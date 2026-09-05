import crypto from 'crypto'

export interface RazorpayOrderResult {
  orderId: string
  amount: number
  currency: string
  keyId: string
  receipt?: string
}

export interface RazorpayPaymentVerification {
  orderId: string
  paymentId: string
  signature: string
}

/**
 * Server-side: Create an order with Razorpay Orders API using HTTP Basic Auth
 */
export async function createRazorpayOrder(params: {
  amountMinor: number // amount in paise (e.g. ₹100 = 10000)
  receipt?: string
  currency?: string
  notes?: Record<string, string>
}): Promise<RazorpayOrderResult> {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials missing in server environment.')
  }

  const payload = {
    amount: Math.round(params.amountMinor),
    currency: params.currency || 'INR',
    receipt: params.receipt || `rcpt_${Date.now()}`,
    notes: params.notes || {},
  }

  const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`

  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error?.description || `Razorpay order creation failed: ${res.statusText}`)
  }

  const data = await res.json()
  return {
    orderId: data.id,
    amount: data.amount,
    currency: data.currency,
    keyId: keyId,
    receipt: data.receipt,
  }
}

/**
 * Server-side: Verify Razorpay Payment Signature
 */
export function verifyRazorpaySignature(params: RazorpayPaymentVerification): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keySecret) {
    throw new Error('Razorpay key secret missing in server environment.')
  }

  const generatedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${params.orderId}|${params.paymentId}`)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(generatedSignature),
    Buffer.from(params.signature)
  )
}

/**
 * Client-side: Dynamically load the Razorpay checkout script
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      return resolve(false)
    }

    if ((window as any).Razorpay) {
      return resolve(true)
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export interface RazorpayCheckoutOptions {
  orderId: string
  amountMinor: number
  keyId?: string
  name?: string
  description?: string
  prefill?: {
    name?: string
    email?: string
    contact?: string
  }
  notes?: Record<string, string>
  onSuccess: (response: {
    razorpay_payment_id: string
    razorpay_order_id: string
    razorpay_signature: string
  }) => void
  onDismiss?: () => void
}

/**
 * Client-side: Launch Razorpay standard checkout popup
 */
export async function openRazorpayCheckout(options: RazorpayCheckoutOptions) {
  const loaded = await loadRazorpayScript()
  if (!loaded) {
    throw new Error('Unable to load Razorpay payment gateway checkout script.')
  }

  const key = options.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_TYHCeWPxNrTujC'

  const rzpOptions = {
    key: key,
    amount: options.amountMinor,
    currency: 'INR',
    name: options.name || 'DNA 360 Gym & Wellness',
    description: options.description || 'Membership & Services Payment',
    image: '/favicon.ico',
    order_id: options.orderId,
    prefill: {
      name: options.prefill?.name || '',
      email: options.prefill?.email || '',
      contact: options.prefill?.contact || '',
    },
    notes: options.notes || {},
    theme: {
      color: '#00c8c8',
      backdrop_color: 'rgba(10, 15, 29, 0.85)',
    },
    modal: {
      ondismiss: () => {
        if (options.onDismiss) options.onDismiss()
      },
    },
    handler: (response: any) => {
      options.onSuccess({
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_signature: response.razorpay_signature,
      })
    },
  }

  const rzp = new (window as any).Razorpay(rzpOptions)
  rzp.open()
}
