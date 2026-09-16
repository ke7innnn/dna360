import { NextRequest, NextResponse } from 'next/server'
import { verifyRazorpaySignature } from '@/lib/razorpay'
import { getServerSession } from '@/lib/server-auth'
import { getOrderMapping, markOrderVerified } from '@/lib/razorpay-orders'
import { getStoredInvoices, saveInvoices } from '@/lib/billing'
import { logAuditEvent } from '@/lib/audit'

/**
 * Verifies Razorpay payment signature, validates expected amount matches,
 * marks invoice paid, and logs audit record (§4.3)
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
    const { orderId, paymentId, signature, amountMinor } = body

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        { error: 'orderId, paymentId, and signature are required for verification' },
        { status: 400 }
      )
    }

    // 2. Cryptographic signature check (timingSafeEqual)
    const isValid = verifyRazorpaySignature({
      orderId,
      paymentId,
      signature,
    })

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid payment signature. Verification failed.' },
        { status: 400 }
      )
    }

    // 3. Load server-persisted order record (§4.3)
    const orderRecord = getOrderMapping(orderId)
    if (!orderRecord) {
      return NextResponse.json(
        { error: 'Order record not found or mapping expired.' },
        { status: 400 }
      )
    }

    // 4. Additionally assert captured amount equals expectedAmountMinor (§4.3)
    if (amountMinor !== undefined && Number(amountMinor) !== orderRecord.expectedAmountMinor) {
      // Amount mismatch -> 400 and an audit record
      logAuditEvent({
        actor: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email || undefined,
          role: session.user.role?.name || 'User',
        },
        action: 'UPDATE',
        entity: 'PaymentTamperingAlert',
        entityId: orderId,
        branchId: session.user.branchId || 'pow',
        description: `Payment verification amount mismatch for order ${orderId}: expected ${orderRecord.expectedAmountMinor} paise, received ${amountMinor} paise`,
        afterState: {
          orderId,
          paymentId,
          expectedAmountMinor: orderRecord.expectedAmountMinor,
          receivedAmountMinor: amountMinor,
        },
      })

      return NextResponse.json(
        { error: 'Payment amount mismatch. Verification failed.' },
        { status: 400 }
      )
    }

    // 5. Mark invoice paid / partially paid on server
    const invoices = getStoredInvoices()
    const invoice = invoices.find((i) => i.id === orderRecord.invoiceId)
    if (invoice) {
      const settledAmount = orderRecord.expectedAmountMinor
      invoice.paidAmountMinor = (invoice.paidAmountMinor || 0) + settledAmount
      invoice.dueAmountMinor = Math.max(0, invoice.grandTotalMinor - invoice.paidAmountMinor)
      invoice.status = invoice.dueAmountMinor === 0 ? 'paid' : 'partially_paid'

      invoice.payments = invoice.payments || []
      invoice.payments.push({
        id: `pay_${Date.now()}`,
        mode: 'Online',
        amountMinor: settledAmount,
        transactionRef: paymentId,
        recordedAt: new Date().toISOString(),
      })

      saveInvoices(invoices)
    }

    // 6. Record verification in order store
    markOrderVerified(orderId, paymentId)

    // 7. Write audit log for successful payment settlement
    logAuditEvent({
      actor: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email || undefined,
        role: session.user.role?.name || 'User',
      },
      action: 'UPDATE',
      entity: 'Invoice',
      entityId: orderRecord.invoiceId,
      branchId: session.user.branchId || 'pow',
      description: `Payment confirmed for invoice ${orderRecord.invoiceId} via Razorpay (Payment: ${paymentId}, Amount: ₹${orderRecord.expectedAmountMinor / 100})`,
      afterState: {
        invoiceId: orderRecord.invoiceId,
        orderId,
        paymentId,
        amountMinor: orderRecord.expectedAmountMinor,
      },
    })

    return NextResponse.json({
      success: true,
      verified: true,
      paymentId,
      orderId,
      invoiceId: orderRecord.invoiceId,
      amountMinor: orderRecord.expectedAmountMinor,
    })
  } catch (err: any) {
    console.error('Razorpay Verify Payment Error:', err)
    return NextResponse.json(
      { error: err.message || 'Signature verification failed' },
      { status: 500 }
    )
  }
}
