import { NextRequest, NextResponse } from 'next/server'
import { verifyRazorpaySignature } from '@/lib/razorpay'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { orderId, paymentId, signature } = body

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        { error: 'orderId, paymentId, and signature are required for verification' },
        { status: 400 }
      )
    }

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

    return NextResponse.json({
      success: true,
      verified: true,
      paymentId,
      orderId,
    })
  } catch (err: any) {
    console.error('Razorpay Verify Payment Error:', err)
    return NextResponse.json(
      { error: err.message || 'Signature verification failed' },
      { status: 500 }
    )
  }
}
