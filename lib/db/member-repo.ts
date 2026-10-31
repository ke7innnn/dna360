import { prisma } from '@/lib/prisma'
import { toLocalDateStr, parseLocalDate } from '@/lib/dates'
import { getStoredPlans } from '@/lib/billing'

function addMonthsLocal(base: Date, months: number): Date {
  const d = new Date(base.getFullYear(), base.getMonth() + months, base.getDate())
  if (d.getDate() !== base.getDate()) d.setDate(0)
  return d
}

export async function getMemberFromDb(memberId: string) {
  try {
    return await prisma.member.findUnique({
      where: { id: memberId },
      include: {
        memberships: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })
  } catch (err) {
    console.error('Failed to get member from DB:', err)
    return null
  }
}

export async function updateMemberInDb(memberId: string, data: {
  status?: string
  attendanceStreak?: number
  totalCheckIns?: number
  lastVisitAt?: Date
  adjustmentCreditsRemaining?: number
}) {
  try {
    return await prisma.member.update({
      where: { id: memberId },
      data,
    })
  } catch (err) {
    console.error('Failed to update member in DB:', err)
    return null
  }
}

export async function applyPlanPurchaseInDb(params: {
  memberId: string
  planId: string
  amountMinor: number
  paymentRef: string
  invoiceId?: string
}) {
  try {
    const { memberId, planId, amountMinor, invoiceId } = params
    const matchedPlan = getStoredPlans().find(
      p => p.id.toLowerCase() === planId.toLowerCase() || p.slug?.toLowerCase() === planId.toLowerCase()
    )

    if (!matchedPlan) {
      console.warn(`Plan ${planId} not found in catalog for DB sync`)
      return null
    }

    const todayStr = toLocalDateStr()
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: {
        memberships: true,
      },
    })

    if (!member) {
      console.warn(`Member ${memberId} not found in DB for plan purchase`)
      return null
    }

    const existing = member.memberships.find(
      m => m.productId.toLowerCase() === matchedPlan.id.toLowerCase() && m.status !== 'void'
    )

    const baseStr = existing?.expiryDate && existing.expiryDate > todayStr ? existing.expiryDate : todayStr
    const baseDate = parseLocalDate(baseStr)
    const newExpiryDate =
      matchedPlan.durationMonths > 0
        ? addMonthsLocal(baseDate, matchedPlan.durationMonths)
        : new Date(baseDate.getTime() + (matchedPlan.durationDays || 30) * 86400000)
    const newExpiry = toLocalDateStr(newExpiryDate)

    const ptCount = matchedPlan.ptSessionsCount || 0

    return await prisma.$transaction(async tx => {
      let membership
      if (existing) {
        membership = await tx.membership.update({
          where: { id: existing.id },
          data: {
            status: 'active',
            expiryDate: newExpiry,
            amountPaid: existing.amountPaid + BigInt(amountMinor),
            invoiceId: invoiceId || existing.invoiceId,
            sessionsTotal: (existing.sessionsTotal || 0) + ptCount,
            sessionsRemaining: (existing.sessionsRemaining || 0) + ptCount,
          },
        })
      } else {
        const membershipId = `mem_ship_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
        membership = await tx.membership.create({
          data: {
            id: membershipId,
            memberId: member.id,
            productId: matchedPlan.id,
            productName: matchedPlan.name,
            category: (matchedPlan as any).category || matchedPlan.type || 'gym_membership',
            enrolmentDate: todayStr,
            activationDate: todayStr,
            expiryDate: newExpiry,
            amountPaid: BigInt(amountMinor),
            discountAmount: BigInt(0),
            taxRate: matchedPlan.taxRate ?? 0.05,
            status: 'active',
            invoiceId: invoiceId || null,
            sessionsTotal: ptCount > 0 ? ptCount : null,
            sessionsConsumed: 0,
            sessionsRemaining: ptCount > 0 ? ptCount : null,
          },
        })
      }

      // Ensure member status is active
      await tx.member.update({
        where: { id: member.id },
        data: {
          status: 'active',
          lifetimeValue: member.lifetimeValue + BigInt(amountMinor),
        },
      })

      return membership
    })
  } catch (err) {
    console.error('Failed to apply plan purchase in DB:', err)
    return null
  }
}

export async function recordPaymentInDb(params: {
  invoiceId: string
  memberId: string
  amountMinor: number
  transactionRef: string
  mode?: string
}) {
  try {
    const { invoiceId, memberId, amountMinor, transactionRef, mode = 'Razorpay Live' } = params
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`

    // Ensure invoice exists in DB or create placeholder
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    })

    if (!existingInvoice) {
      const todayStr = toLocalDateStr()
      const member = await prisma.member.findUnique({ where: { id: memberId } })
      await prisma.invoice.create({
        data: {
          id: invoiceId,
          invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
          memberId,
          memberName: member?.name || 'Member',
          memberPhone: member?.phone || '',
          memberEmail: member?.email || null,
          status: 'paid',
          grandTotalMinor: BigInt(amountMinor),
          paidAmountMinor: BigInt(amountMinor),
          dueAmountMinor: BigInt(0),
          issueDate: todayStr,
          dueDate: todayStr,
          salesRepName: 'Online Member Self-Service',
          notes: `Self-service payment ref ${transactionRef}`,
        },
      })
    } else {
      const newPaid = existingInvoice.paidAmountMinor + BigInt(amountMinor)
      const newDue = existingInvoice.grandTotalMinor > newPaid ? existingInvoice.grandTotalMinor - newPaid : BigInt(0)
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          paidAmountMinor: newPaid,
          dueAmountMinor: newDue,
          status: newDue === BigInt(0) ? 'paid' : 'partially_paid',
        },
      })
    }

    return await prisma.payment.create({
      data: {
        id: paymentId,
        invoiceId,
        mode,
        amountMinor: BigInt(amountMinor),
        transactionRef,
      },
    })
  } catch (err) {
    console.error('Failed to record payment in DB:', err)
    return null
  }
}
