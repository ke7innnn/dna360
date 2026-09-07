import { NextRequest, NextResponse } from 'next/server'

/**
 * Meta WhatsApp Cloud API Webhook endpoint
 * GET: Webhook verification handshake
 * POST: Inbound messages & delivery receipt events
 */

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'dna360_wa_secure_webhook'

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[WhatsApp Webhook] Handshake verified successfully.')
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('[WhatsApp Webhook Event]:', JSON.stringify(body, null, 2))

    // Meta expects a quick 200 OK response to prevent webhook retry spam
    return NextResponse.json({ status: 'EVENT_RECEIVED' }, { status: 200 })
  } catch (err: any) {
    console.error('[WhatsApp Webhook Error]:', err)
    return NextResponse.json({ status: 'ERROR' }, { status: 500 })
  }
}
