import { NextRequest, NextResponse } from 'next/server'
import { dequeueAdmsCommands, recordAdmsHeartbeat } from '@/lib/essl'

export const dynamic = 'force-dynamic'

/**
 * GET /iclock/getrequest?SN=<SerialNumber>
 * Polled every 2 seconds by the physical eSSL door machine.
 * Delivers queued commands (door unlock, member provision with expiry, or expired member block).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sn = searchParams.get('SN') || searchParams.get('sn') || 'SDE7261100390'
  const ip = req.headers.get('x-forwarded-for') || undefined

  recordAdmsHeartbeat(sn, ip)

  const commands = dequeueAdmsCommands(sn, 5)
  if (commands.length === 0) {
    return new NextResponse('OK\n', {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  const body = commands.map((c) => `C:${c.id}:${c.command}`).join('\n') + '\n'
  return new NextResponse(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}

