import { NextRequest, NextResponse } from 'next/server'
import { createRazorpayOrder } from '@/lib/razorpay'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { amountMinor, receipt, notes } = body

    if (
      typeof amountMinor !== 'number' ||
      !Number.isFinite(amountMinor) ||
      !Number.isInteger(amountMinor) ||
      amountMinor < 100 ||
      amountMinor > 100000000
    ) {
      return NextResponse.json(
        { error: 'Valid integer amountMinor (in paise) between 100 (₹1) and 100,000,000 (₹10,00,000) is required' },
        { status: 400 }
      )
    }

    const order = await createRazorpayOrder({
      amountMinor,
      receipt,
      notes,
    })

    return NextResponse.json({
      success: true,
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency,
      keyId: order.keyId,
    })
  } catch (err: any) {
    console.error('Razorpay Create Order Error:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to create Razorpay order' },
      { status: 500 }
    )
  }
}
