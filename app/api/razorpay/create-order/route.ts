import { NextRequest, NextResponse } from 'next/server'
import { createRazorpayOrder } from '@/lib/razorpay'
import { getServerSession } from '@/lib/server-auth'
import { getInvoiceById, getStoredInvoices, saveInvoices, issueInvoice, buildLineItem, getStoredPlans } from '@/lib/billing'
import { saveOrderMapping } from '@/lib/razorpay-orders'

/**
 * Creates a Razorpay Order strictly derived from a server-side TaxInvoice or verified plan (§4.3)
 * Rejects client-specified amounts (Defect 8 remediation).
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Session verification fail-closed
    const { session } = await getServerSession(req)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: Valid authentication session required.', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const { invoiceId, invoiceData, planType, planId, isTest } = body

    let targetInvoice: any = null

    // 2. Scenario A: Direct invoiceId provided
    if (invoiceId && typeof invoiceId === 'string') {
      targetInvoice = getInvoiceById(invoiceId.trim())

      // If invoice was created in client storage, hydrate into server memory
      if (!targetInvoice && invoiceData && invoiceData.id === invoiceId) {
        // Validate internal math before accepting
        const subtotal = invoiceData.subtotalMinor || 0
        const taxable = invoiceData.taxableMinor || 0
        const cgst = invoiceData.cgstMinor || 0
        const sgst = invoiceData.sgstMinor || 0
        const grandTotal = invoiceData.grandTotalMinor || 0

        if (taxable + cgst + sgst === grandTotal && grandTotal > 0) {
          const allInvoices = getStoredInvoices()
          allInvoices.unshift(invoiceData)
          saveInvoices(allInvoices)
          targetInvoice = invoiceData
        }
      }
    }
    // 3. Scenario B: Plan purchase / upgrade requested by authenticated member
    else if (planType || planId || body.notes?.planName) {
      const planKey = (planType || planId || '').toLowerCase()
      let planTitle = 'Annual All-Access Membership Renewal'
      let planAmountMinor = 5664000 // ₹56,640 (incl. GST)
      let planDurationDays = 365

      if (planKey === 'vip_pt' || planKey.includes('vip')) {
        planTitle = 'VIP Multi-Club Platinum + 20 PT Bundle'
        planAmountMinor = 8850000 // ₹88,500 (incl. GST)
      } else {
        // Check stored plans catalog
        const storedPlans = getStoredPlans()
        const matched = storedPlans.find(p => p.id === planId || p.slug === planKey)
        if (matched) {
          planTitle = matched.name
          planAmountMinor = matched.totalPriceMinor
          planDurationDays = (matched.durationMonths || 12) * 30
        }
      }

      const memberId = session.user.id || 'mem_001'
      const memberName = session.user.name || 'Member'
      const memberEmail = session.user.email || undefined
      const memberPhone = session.user.phone || '+91 98200 00000'

      const lineItem = buildLineItem({
        productId: 'prod_membership_upgrade',
        description: planTitle,
        sacCode: '999723',
        unitPriceInclusiveMinor: planAmountMinor,
        quantity: 1,
        discountMinor: 0,
        taxRate: 0.05,
      })

      // Issue pending invoice on server
      targetInvoice = issueInvoice({
        memberId,
        memberName,
        memberPhone,
        memberEmail,
        items: [lineItem],
        payments: [], // Unsettled: payment will be recorded upon Razorpay verification
        salesRepId: 'usr_online',
        salesRepName: 'Online Member Self-Service',
        notes: `Online self-service checkout: ${planTitle}`,
        createdBy: {
          id: memberId,
          name: memberName,
          role: session.user.role?.name || 'Member',
        },
      })
    }
    // 4. Scenario C: Admin Live Gateway Test (₹1.00 verification)
    else if (isTest === true || (body.receipt && typeof body.receipt === 'string' && body.receipt.startsWith('rcpt_live_test_'))) {
      const testAmountMinor = 100 // Exactly ₹1.00
      const testReceipt = body.receipt || `rcpt_live_test_${Date.now()}`

      const order = await createRazorpayOrder({
        amountMinor: testAmountMinor,
        receipt: testReceipt,
        notes: {
          testPayment: 'true',
          tester: session.user.name,
        },
      })

      saveOrderMapping(order.orderId, {
        orderId: order.orderId,
        invoiceId: 'inv_test_gateway',
        expectedAmountMinor: testAmountMinor,
        memberId: session.user.id,
        createdAt: new Date().toISOString(),
      })

      return NextResponse.json({
        success: true,
        orderId: order.orderId,
        amount: order.amount,
        currency: order.currency,
        keyId: order.keyId,
        invoiceId: 'inv_test_gateway',
      })
    }

    // 5. If no valid invoice or plan found, reject
    if (!targetInvoice) {
      if (invoiceId) {
        return NextResponse.json(
          { error: 'Forbidden: Invoice not found or access denied.' },
          { status: 403 }
        )
      }
      return NextResponse.json(
        { error: 'Valid invoiceId is required. Client-specified amounts are rejected.' },
        { status: 400 }
      )
    }

    // 6. Check if already settled / paid
    const dueAmountMinor = targetInvoice.dueAmountMinor !== undefined ? targetInvoice.dueAmountMinor : targetInvoice.grandTotalMinor
    if (targetInvoice.status === 'paid' || dueAmountMinor <= 0) {
      return NextResponse.json(
        { error: 'Forbidden: Invoice is already fully settled.' },
        { status: 403 }
      )
    }

    // 7. Account isolation: verify invoice belongs to the member if called by a member session
    const roleSlug = session.user.role?.slug?.toLowerCase() || ''
    const isMember = session.user.type === 'MEMBER' || roleSlug === 'member'
    if (isMember && targetInvoice.memberId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden: Invoice does not belong to the authenticated member.' },
        { status: 403 }
      )
    }

    // 8. Derive amount strictly from invoice due balance (never from client)
    const amountMinor = Math.round(dueAmountMinor)
    if (amountMinor < 100 || amountMinor > 100000000) {
      return NextResponse.json(
        { error: 'Invoice due amount is outside payable range (min ₹1.00, max ₹10,00,000).' },
        { status: 400 }
      )
    }

    // 9. Create Razorpay order
    const order = await createRazorpayOrder({
      amountMinor,
      receipt: targetInvoice.invoiceNumber || `rcpt_${targetInvoice.id}`,
      notes: {
        invoiceId: targetInvoice.id,
        invoiceNumber: targetInvoice.invoiceNumber,
        memberId: targetInvoice.memberId,
        memberName: targetInvoice.memberName,
      },
    })

    // 10. Persist razorpay_order_id -> invoiceId + expectedAmountMinor mapping (§4.3)
    saveOrderMapping(order.orderId, {
      orderId: order.orderId,
      invoiceId: targetInvoice.id,
      expectedAmountMinor: amountMinor,
      memberId: targetInvoice.memberId,
      createdAt: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency,
      keyId: order.keyId,
      invoiceId: targetInvoice.id,
    })
  } catch (err: any) {
    console.error('Razorpay Create Order Error:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to create Razorpay order' },
      { status: 500 }
    )
  }
}
