import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, maskPhoneNumber } from '@/lib/server-auth'
import { getStoredMembers } from '@/lib/members'

export async function GET(req: NextRequest) {
  try {
    const { session, error } = await getServerSession(req)
    if (!session || !session.user) {
      return NextResponse.json(
        { error: error || 'Unauthorized: Authentication required.' },
        { status: 401 }
      )
    }

    const user = session.user
    const userCaps = user.role.capabilities || []
    const roleSlugLower = user.role.slug.toLowerCase()
    const isOwner = roleSlugLower === 'owner' || roleSlugLower === 'owner_admin'
    const canViewAll = isOwner || userCaps.includes('members.view.all')
    const canViewOwn = userCaps.includes('members.view.own')

    if (!canViewAll && !canViewOwn) {
      return NextResponse.json(
        {
          error: `Forbidden: Role '${user.role.name}' does not have permission to view members.`,
          code: 'FORBIDDEN',
        },
        { status: 403 }
      )
    }

    const url = new URL(req.url)
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
    const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize') || '20', 10)))
    const search = url.searchParams.get('search')?.toLowerCase().trim() || ''
    const statusFilter = url.searchParams.get('status') || 'all'
    const unmaskPii = url.searchParams.get('unmasked') === 'true' && isOwner
    const includeInvoices = url.searchParams.get('includeInvoices') === 'true'
    const includeAuditLogs = url.searchParams.get('includeAuditLogs') === 'true'

    if (includeInvoices) {
      try {
        const { prisma } = await import('@/lib/prisma')
        const dbInvoices = await prisma.invoice.findMany({
          include: { payments: true },
          orderBy: { createdAt: 'desc' },
          take: 100,
        })
        return NextResponse.json({
          invoices: dbInvoices.map((inv) => ({
            id: inv.id,
            invoiceNumber: inv.invoiceNumber,
            memberId: inv.memberId,
            memberName: inv.memberName,
            memberPhone: inv.memberPhone,
            memberEmail: inv.memberEmail,
            status: inv.status,
            subtotalMinor: Number(inv.subtotalMinor),
            taxableMinor: Number(inv.taxableMinor),
            cgstMinor: Number(inv.cgstMinor),
            sgstMinor: Number(inv.sgstMinor),
            grandTotalMinor: Number(inv.grandTotalMinor),
            paidAmountMinor: Number(inv.paidAmountMinor),
            dueAmountMinor: Number(inv.dueAmountMinor),
            issueDate: inv.issueDate,
            dueDate: inv.dueDate,
            salesRepName: inv.salesRepName || 'Front Desk',
            notes: inv.notes,
            payments: inv.payments.map((p) => ({
              id: p.id,
              mode: p.mode,
              amountMinor: Number(p.amountMinor),
              transactionRef: p.transactionRef,
              recordedAt: p.recordedAt.toISOString(),
            })),
          })),
        })
      } catch (err: any) {
        return NextResponse.json({ invoices: [], warning: err.message })
      }
    }

    if (includeAuditLogs) {
      try {
        const { prisma } = await import('@/lib/prisma')
        const rows = await prisma.coachNote.findMany({
          where: { authorId: 'SYSTEM_AUDIT' },
          orderBy: { createdAt: 'desc' },
          take: 100,
        })
        const auditLogs = rows
          .map((r) => {
            try {
              return JSON.parse(r.body)
            } catch {
              return null
            }
          })
          .filter(Boolean)
        return NextResponse.json({ auditLogs })
      } catch (err: any) {
        return NextResponse.json({ auditLogs: [], warning: err.message })
      }
    }

    // 1. Query Supabase Central PostgreSQL Database
    try {
      const { prisma } = await import('@/lib/prisma')
      const where: any = {}
      if (!canViewAll && canViewOwn) {
        where.assignedTrainerId = user.id
      }
      if (statusFilter !== 'all') {
        where.status = statusFilter
      }
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { memberCode: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
          { email: { contains: search, mode: 'insensitive' } },
        ]
      }

      const totalCount = await prisma.member.count({ where })
      if (totalCount > 0) {
        const dbRecords = await prisma.member.findMany({
          where,
          include: {
            memberships: {
              where: { status: 'active' },
            },
          },
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { name: 'asc' },
        })

        const sanitizedRecords = dbRecords.map(m => ({
          id: m.id,
          member_code: m.memberCode,
          name: m.name,
          first_name: m.firstName,
          last_name: m.lastName,
          phone: unmaskPii ? m.phone : maskPhoneNumber(m.phone),
          isPhoneMasked: !unmaskPii,
          email: m.email,
          gender: m.gender,
          status: m.status,
          joined_date: m.joinedDate,
          attendance_streak: m.attendanceStreak || 0,
          total_check_ins: m.totalCheckIns || 0,
          active_memberships: m.memberships.map(ms => ({
            id: ms.id,
            product_name: ms.productName,
            expiry_date: ms.expiryDate,
            status: ms.status,
            sessions_remaining: ms.sessionsRemaining,
            sessions_total: ms.sessionsTotal,
          })),
          assigned_trainer_name: m.assignedTrainerName,
        }))

        return NextResponse.json({
          members: sanitizedRecords,
          pagination: {
            page,
            pageSize,
            total: totalCount,
            totalPages: Math.ceil(totalCount / pageSize),
          },
        })
      }
    } catch (dbErr) {
      console.warn('Supabase DB member query fallback:', dbErr)
    }

    let allMembers = getStoredMembers()

    // Trainer Role Restriction: Trainers ONLY see their own assigned clients
    if (!canViewAll && canViewOwn) {
      allMembers = allMembers.filter(
        m => m.assigned_trainer_id === user.id || Boolean(user.assignedClientIds?.includes(m.id))
      )
    }

    // Search filter
    if (search) {
      allMembers = allMembers.filter(
        m =>
          m.name.toLowerCase().includes(search) ||
          m.member_code.toLowerCase().includes(search) ||
          m.phone.includes(search) ||
          (m.email && m.email.toLowerCase().includes(search))
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      allMembers = allMembers.filter(m => m.status === statusFilter)
    }

    const total = allMembers.length
    const totalPages = Math.ceil(total / pageSize)
    const offset = (page - 1) * pageSize
    const paginatedSlice = allMembers.slice(offset, offset + pageSize)

    // Mask PII (phone number) in list responses unless explicit unmasked request by Owner
    const sanitizedRecords = paginatedSlice.map(m => ({
      id: m.id,
      member_code: m.member_code,
      name: m.name,
      first_name: m.first_name,
      last_name: m.last_name,
      phone: unmaskPii ? m.phone : maskPhoneNumber(m.phone),
      isPhoneMasked: !unmaskPii,
      email: m.email,
      gender: m.gender,
      status: m.status,
      joined_date: m.joined_date,
      attendance_streak: m.attendance_streak || 0,
      total_check_ins: m.total_check_ins || 0,
      active_memberships: m.active_memberships.map(ms => ({
        id: ms.id,
        product_name: ms.product_name,
        expiry_date: ms.expiry_date,
        status: ms.status,
        sessions_remaining: ms.sessions_remaining,
        sessions_total: ms.sessions_total,
      })),
      assigned_trainer_name: m.assigned_trainer_name,
    }))

    return NextResponse.json({
      members: sanitizedRecords,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch members' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { session, error } = await getServerSession(req)
    if (!session?.user) {
      return NextResponse.json(
        { error: error || 'Unauthorized: Authentication required.' },
        { status: 401 }
      )
    }
    if (session.user.type === 'MEMBER' || (session.user.role?.slug || '').toUpperCase() === 'MEMBER') {
      return NextResponse.json(
        { error: 'Forbidden: Members cannot modify member records.', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { prisma } = await import('@/lib/prisma')

    // Audit Log sync from lib/audit.ts
    if (body.action === 'LOG_AUDIT' && body.entry) {
      const entry = body.entry
      await prisma.coachNote.upsert({
        where: { id: entry.id },
        update: { body: JSON.stringify(entry) },
        create: {
          id: entry.id,
          authorId: 'SYSTEM_AUDIT',
          memberId: entry.entityId || 'system',
          body: JSON.stringify(entry),
        },
      }).catch(() => null)
      return NextResponse.json({ success: true })
    }

    // Invoice sync from lib/billing.ts
    if (body.action === 'SYNC_INVOICE' && body.invoice) {
      const inv = body.invoice
      const targetMemberId = inv.memberId || `mem_walkin_${inv.id}`
      let memberExists = await prisma.member.findUnique({ where: { id: targetMemberId } })
      if (!memberExists) {
        const nameParts = String(inv.memberName || 'Walk-in Member').trim().split(/\s+/)
        const firstName = nameParts[0] || 'Member'
        const lastName = nameParts.slice(1).join(' ') || 'DNA360'
        memberExists = await prisma.member.upsert({
          where: { id: targetMemberId },
          update: {},
          create: {
            id: targetMemberId,
            memberCode: `DNA-2026-${Date.now().toString().slice(-4)}`,
            firstName,
            lastName,
            name: inv.memberName || 'Walk-in Member',
            phone: inv.memberPhone || '+919820000000',
            email: inv.memberEmail || null,
            joinedDate: inv.issueDate || new Date().toISOString().slice(0, 10),
            status: 'active',
          },
        }).catch(() => null)
      }
      if (memberExists) {
        await prisma.invoice.upsert({
          where: { id: inv.id },
          update: {
            status: inv.status || 'paid',
            paidAmountMinor: BigInt(inv.paidAmountMinor || 0),
            dueAmountMinor: BigInt(inv.dueAmountMinor || 0),
          },
          create: {
            id: inv.id,
            invoiceNumber: inv.invoiceNumber,
            memberId: memberExists.id,
            memberName: inv.memberName || memberExists.name,
            memberPhone: inv.memberPhone || memberExists.phone,
            memberEmail: inv.memberEmail || memberExists.email,
            status: inv.status || 'paid',
            subtotalMinor: BigInt(inv.subtotalMinor || 0),
            taxableMinor: BigInt(inv.taxableMinor || 0),
            cgstMinor: BigInt(inv.cgstMinor || 0),
            sgstMinor: BigInt(inv.sgstMinor || 0),
            grandTotalMinor: BigInt(inv.grandTotalMinor || 0),
            paidAmountMinor: BigInt(inv.paidAmountMinor || 0),
            dueAmountMinor: BigInt(inv.dueAmountMinor || 0),
            issueDate: inv.issueDate || new Date().toISOString().slice(0, 10),
            dueDate: inv.dueDate || new Date().toISOString().slice(0, 10),
            salesRepName: inv.salesRepName || 'Front Desk',
            notes: inv.notes || null,
          },
        })

        if (Array.isArray(inv.payments)) {
          for (const p of inv.payments) {
            await prisma.payment.upsert({
              where: { id: p.id },
              update: {},
              create: {
                id: p.id,
                invoiceId: inv.id,
                mode: p.mode || 'UPI',
                amountMinor: BigInt(p.amountMinor || 0),
                transactionRef: p.transactionRef || null,
              },
            })
          }
        }
      }
      return NextResponse.json({ success: true })
    }

    // Create / Upsert Member (from MemberOnboardingModal / createMember)
    const m = body.member || body
    if (!m || !m.id) {
      return NextResponse.json({ error: 'Member payload required' }, { status: 400 })
    }

    const upserted = await prisma.member.upsert({
      where: { id: m.id },
      update: {
        name: m.name || `${m.first_name || ''} ${m.last_name || ''}`.trim(),
        email: m.email ?? undefined,
        phone: m.phone ?? undefined,
        status: m.status ?? undefined,
        attendanceStreak: typeof m.attendance_streak === 'number' ? m.attendance_streak : undefined,
        totalCheckIns: typeof m.total_check_ins === 'number' ? m.total_check_ins : undefined,
        lastVisitAt: m.last_visit_at ? new Date(m.last_visit_at) : undefined,
        blacklisted: typeof m.blacklisted === 'boolean' ? m.blacklisted : undefined,
        blacklistReason: m.blacklist_reason !== undefined ? m.blacklist_reason : undefined,
        specialInclusions: m.special_inclusions !== undefined ? m.special_inclusions : undefined,
        assignedTrainerId: m.assigned_trainer_id !== undefined ? m.assigned_trainer_id : undefined,
        assignedTrainerName: m.assigned_trainer_name !== undefined ? m.assigned_trainer_name : undefined,
        adjustmentCreditsRemaining: typeof m.adjustment_credits_remaining === 'number' ? m.adjustment_credits_remaining : undefined,
        lifetimeValue: typeof m.lifetime_value === 'number' ? BigInt(Math.round(m.lifetime_value)) : undefined,
      },
      create: {
        id: m.id,
        memberCode: m.member_code || m.memberCode || `DNA-2026-${Date.now().toString().slice(-4)}`,
        firstName: m.first_name || m.firstName || 'Member',
        lastName: m.last_name || m.lastName || '',
        name: m.name || `${m.first_name || ''} ${m.last_name || ''}`.trim(),
        email: m.email || null,
        phone: m.phone || '+919820000000',
        gender: m.gender || 'other',
        dob: m.dob || null,
        joinedDate: m.joined_date || new Date().toISOString().slice(0, 10),
        status: m.status || 'active',
        attendanceStreak: m.attendance_streak || 0,
        totalCheckIns: m.total_check_ins || 0,
        lastVisitAt: m.last_visit_at ? new Date(m.last_visit_at) : null,
        blacklisted: !!m.blacklisted,
        blacklistReason: m.blacklist_reason || null,
        complimentary: !!m.complimentary,
        specialInclusions: m.special_inclusions || null,
        referredBy: m.referred_by || null,
        referralCode: m.referral_code || null,
        lifetimeValue: BigInt(Math.round(m.lifetime_value || 0)),
        adjustmentCreditsRemaining: m.adjustment_credits_remaining ?? 2,
        assignedTrainerId: m.assigned_trainer_id || null,
        assignedTrainerName: m.assigned_trainer_name || null,
      },
    })

    // Sync active_memberships if provided
    if (Array.isArray(m.active_memberships)) {
      for (const ms of m.active_memberships) {
        if (!ms?.id) continue
        await prisma.membership.upsert({
          where: { id: ms.id },
          update: {
            productName: ms.product_name || ms.productName,
            expiryDate: ms.expiry_date || ms.expiryDate || null,
            status: ms.status || 'active',
            sessionsRemaining: ms.sessions_remaining ?? ms.sessionsRemaining ?? null,
            sessionsTotal: ms.sessions_total ?? ms.sessionsTotal ?? null,
            sessionsConsumed: ms.sessions_consumed ?? ms.sessionsConsumed ?? 0,
          },
          create: {
            id: ms.id,
            memberId: upserted.id,
            productId: ms.product_id || ms.productId || 'prod_001',
            productName: ms.product_name || ms.productName || 'Gym Membership',
            category: ms.product_category || ms.category || 'gym_membership',
            enrolmentDate: ms.enrolment_date || new Date().toISOString().slice(0, 10),
            activationDate: ms.activation_date || new Date().toISOString().slice(0, 10),
            expiryDate: ms.expiry_date || ms.expiryDate || null,
            amountPaid: BigInt(Math.round(ms.amount_paid || 0)),
            discountAmount: BigInt(Math.round(ms.discount_amount || 0)),
            taxRate: ms.tax_rate ?? 0.05,
            status: ms.status || 'active',
            invoiceId: ms.invoice_id || null,
            invoiceNumber: ms.invoice_number || null,
            sessionsTotal: ms.sessions_total ?? null,
            sessionsConsumed: ms.sessions_consumed ?? 0,
            sessionsRemaining: ms.sessions_remaining ?? null,
          },
        })
      }
    }

    // Sync latest fitness_metric if provided
    if (Array.isArray(m.fitness_metrics) && m.fitness_metrics.length > 0) {
      const latest = m.fitness_metrics[0]
      if (latest && (latest.weight_kg || latest.weightKg)) {
        const metricId = latest.id || `fit_${upserted.id}_${Date.now()}`
        await prisma.bodyMetric.upsert({
          where: { id: metricId },
          update: {
            weightKg: Number(latest.weight_kg ?? latest.weightKg) || null,
            bodyFatPct: Number(latest.body_fat_pct ?? latest.bodyFatPct) || null,
            measurements: {
              muscleMassKg: Number(latest.muscle_mass_kg ?? latest.muscleMassKg) || null,
            },
          },
          create: {
            id: metricId,
            memberId: upserted.id,
            recordedAt: latest.recorded_at ? new Date(latest.recorded_at) : new Date(),
            weightKg: Number(latest.weight_kg ?? latest.weightKg) || null,
            bodyFatPct: Number(latest.body_fat_pct ?? latest.bodyFatPct) || null,
            measurements: {
              muscleMassKg: Number(latest.muscle_mass_kg ?? latest.muscleMassKg) || null,
            },
            photoKeys: [],
            recordedById: upserted.id,
          },
        }).catch(() => null)
      }
    }

    return NextResponse.json({ success: true, memberId: upserted.id })
  } catch (err: any) {
    console.warn('POST /api/members sync error:', err)
    return NextResponse.json({ error: err.message || 'Failed to sync member' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const { session, error } = await getServerSession(req)
  if (!session?.user) {
    return NextResponse.json(
      { error: error || 'Unauthorized: Authentication required.' },
      { status: 401 }
    )
  }
  if (session.user.type === 'MEMBER' || (session.user.role?.slug || '').toUpperCase() === 'MEMBER') {
    return NextResponse.json(
      { error: 'Forbidden: Members cannot modify member records.', code: 'FORBIDDEN' },
      { status: 403 }
    )
  }
  return POST(req)
}

export async function DELETE(req: NextRequest) {
  try {
    const { session, error } = await getServerSession(req)
    if (!session?.user) {
      return NextResponse.json(
        { error: error || 'Unauthorized: Authentication required.' },
        { status: 401 }
      )
    }
    if (session.user.type === 'MEMBER' || (session.user.role?.slug || '').toUpperCase() === 'MEMBER') {
      return NextResponse.json(
        { error: 'Forbidden: Members cannot delete member records.', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    const url = new URL(req.url)
    const memberId = url.searchParams.get('id')
    if (!memberId) {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }
    const { prisma } = await import('@/lib/prisma')
    await prisma.member.delete({ where: { id: memberId } }).catch(() => null)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete member' }, { status: 500 })
  }
}
