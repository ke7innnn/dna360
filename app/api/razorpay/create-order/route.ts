import { NextRequest, NextResponse } from 'next/server'
import { createRazorpayOrder } from '@/lib/razorpay'
import { getServerSession } from '@/lib/server-auth'
import { getInvoiceById } from '@/lib/billing'
import { saveOrderMapping } from '@/lib/razorpay-orders'

/**
 * Creates a Razorpay Order strictly derived from a server-side TaxInvoice (§4.3)
 * Rejects client-specified amounts (Defect 8 remediation).
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Session verification fail-closed
    const { session } = getServerSession(req)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: Valid authentication session required.', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const { invoiceId } = body

    // 2. Stop accepting amountMinor from client. Accept invoiceId only (§4.3)
    if (!invoiceId || typeof invoiceId !== 'string') {
      return NextResponse.json(
        { error: 'Valid invoiceId is required. Client-specified amounts are rejected.' },
        { status: 400 }
      )
    }

    // 3. Load invoice server-side
    const invoice = getInvoiceById(invoiceId.trim())
    if (!invoice) {
      return NextResponse.json(
        { error: 'Forbidden: Invoice not found or access denied.' },
        { status: 403 }
      )
    }

    // 4. Check if already settled / paid
    const dueAmountMinor = invoice.dueAmountMinor !== undefined ? invoice.dueAmountMinor : invoice.grandTotalMinor
    if (invoice.status === 'paid' || dueAmountMinor <= 0) {
      return NextResponse.json(
        { error: 'Forbidden: Invoice is already fully settled.' },
        { status: 403 }
      )
    }

    // 5. Account isolation: verify invoice belongs to the member if called by a member session
    const roleSlug = session.user.role?.slug?.toLowerCase() || ''
    const isMember = session.user.type === 'MEMBER' || roleSlug === 'member'
    if (isMember && invoice.memberId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden: Invoice does not belong to the authenticated member.' },
        { status: 403 }
      )
    }

    // 6. Derive amount strictly from invoice due balance (never from client)
    const amountMinor = Math.round(dueAmountMinor)
    if (amountMinor < 100 || amountMinor > 100000000) {
      return NextResponse.json(
        { error: 'Invoice due amount is outside payable range (min ₹1.00, max ₹10,00,000).' },
        { status: 400 }
      )
    }

    // 7. Create Razorpay order
    const order = await createRazorpayOrder({
      amountMinor,
      receipt: invoice.invoiceNumber || `rcpt_${invoice.id}`,
      notes: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        memberId: invoice.memberId,
        memberName: invoice.memberName,
      },
    })

    // 8. Persist razorpay_order_id -> invoiceId + expectedAmountMinor mapping (§4.3)
    saveOrderMapping(order.orderId, {
      orderId: order.orderId,
      invoiceId: invoice.id,
      expectedAmountMinor: amountMinor,
      memberId: invoice.memberId,
      createdAt: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency,
      keyId: order.keyId,
      invoiceId: invoice.id,
    })
  } catch (err: any) {
    console.error('Razorpay Create Order Error:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to create Razorpay order' },
      { status: 500 }
    )
  }
}
