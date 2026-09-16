import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { requireEnv } from '@/lib/env'

/**
 * Meta WhatsApp Cloud API Webhook endpoint (§4.4)
 * GET: Webhook verification handshake (fail-closed token check)
 * POST: Inbound messages & delivery receipt events (HMAC SHA256 signature verification)
 */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const mode = searchParams.get('hub.mode')
    const token = searchParams.get('hub.verify_token')
    const challenge = searchParams.get('hub.challenge')

    const verifyToken = requireEnv('WHATSAPP_WEBHOOK_VERIFY_TOKEN')

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('[WhatsApp Webhook] Handshake verified successfully.')
      return new NextResponse(challenge, { status: 200 })
    }

    return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Verification failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const appSecret = requireEnv('WHATSAPP_APP_SECRET')
    const raw = await req.text() // must read RAW body, before JSON.parse
    const theirSig = req.headers.get('x-hub-signature-256') || ''
    const ours = 'sha256=' + crypto.createHmac('sha256', appSecret).update(raw).digest('hex')
    const a = Buffer.from(ours)
    const b = Buffer.from(theirSig)

    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const body = JSON.parse(raw)
    console.log('[WhatsApp Webhook Event]:', JSON.stringify(body, null, 2))

    // Meta expects a quick 200 OK response to prevent webhook retry spam
    return NextResponse.json({ status: 'EVENT_RECEIVED' }, { status: 200 })
  } catch (err: any) {
    console.error('[WhatsApp Webhook Error]:', err)
    return NextResponse.json({ error: err.message || 'Invalid request' }, { status: 500 })
  }
}
