import { NextRequest, NextResponse } from 'next/server'
import { recordAdmsHeartbeat } from '@/lib/essl'
import { POST as handleEsslWebhook } from '@/app/api/webhooks/essl/route'

export const dynamic = 'force-dynamic'

/**
 * GET /iclock/cdata?SN=<SerialNumber>&options=all
 * Native eSSL / ZKTeco ADMS Direct Cloud Handshake
 * Allows the physical eSSL biometric door machine to connect directly to https://dna360.in
 * with ZERO Windows PC, ZERO SQL Server, and ZERO IIS setup required.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sn = searchParams.get('SN') || searchParams.get('sn') || 'ESSL_POWAI_MAIN_01'
  const ip = req.headers.get('x-forwarded-for') || undefined

  recordAdmsHeartbeat(sn, ip)

  const handshakeResponse = [
    `GET OPTION FROM: ${sn}`,
    `ATTLOGStamp=None`,
    `OPERLOGStamp=9999`,
    `ATTPHOTOStamp=None`,
    `ErrorDelay=30`,
    `Delay=2`,
    `TransTimes=00:00;14:05`,
    `TransInterval=1`,
    `TransFlag=TransData AttLog\tOpLog\tAttPhoto\tEnrollUser\tChgUser\tEnrollFP\tChgFP\tFPImag`,
    `TimeZone=330`,
    `Realtime=1`,
    `Encrypt=None`,
  ].join('\n')

  return new NextResponse(`${handshakeResponse}\n`, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}

/**
 * POST /iclock/cdata?SN=<SerialNumber>&table=ATTLOG&Stamp=9999
 * Receives real-time tab-separated biometric punches directly from the eSSL door machine:
 * Format: <PIN>\t<YYYY-MM-DD HH:MM:SS>\t<Status>\t<VerifyMode>\t<WorkCode>
 */
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sn = searchParams.get('SN') || searchParams.get('sn') || 'ESSL_POWAI_MAIN_01'
  const table = (searchParams.get('table') || 'ATTLOG').toUpperCase()
  const ip = req.headers.get('x-forwarded-for') || undefined

  recordAdmsHeartbeat(sn, ip)

  const rawBody = await req.text()
  if (!rawBody.trim() || table !== 'ATTLOG') {
    return new NextResponse('OK\n', {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  const lines = rawBody
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  let processedCount = 0

  for (const line of lines) {
    // Skip key=value lines (e.g., OPLOG or USER lines)
    if (line.startsWith('OPLOG') || line.startsWith('USER') || line.startsWith('PIN=')) {
      processedCount++
      continue
    }

    const parts = line.split('\t')
    const userPin = (parts[0] || '').trim()
    const logDateTime = (parts[1] || new Date().toISOString()).trim()
    const punchState = (parts[2] || '0').trim() // 0 = Check-In, 1 = Check-Out
    const verifyCode = (parts[3] || '1').trim() // 1 = FP, 15 = Face, 3/4 = Card

    if (!userPin) continue

    const verifyModeMap: Record<string, string> = {
      '1': 'VS_FP',
      '15': 'VS_FACE',
      '3': 'VS_CARD',
      '4': 'VS_CARD',
      '2': 'VS_PWD',
    }

    const syntheticPayload = {
      UserId: userPin,
      LogDateTime: logDateTime,
      SerialNumber: sn,
      DeviceName: 'Main Turnstile (Powai)',
      Direction: punchState === '1' ? 'OUT' : 'IN',
      TransactionMode: verifyModeMap[verifyCode] || 'VS_FP',
    }

    try {
      const internalReq = new NextRequest(new URL('/api/webhooks/essl', req.url), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(syntheticPayload),
      })
      await handleEsslWebhook(internalReq)
    } catch (err) {
      console.error('Direct ADMS scan forward error:', err)
    }

    processedCount++
  }

  return new NextResponse(`OK: ${processedCount || 1}\n`, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
