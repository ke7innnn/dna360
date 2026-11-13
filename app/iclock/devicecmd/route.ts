import { NextRequest, NextResponse } from 'next/server'
import { recordAdmsHeartbeat } from '@/lib/essl'

export const dynamic = 'force-dynamic'

/**
 * POST /iclock/devicecmd?SN=<SerialNumber>
 * Receives execution confirmation from the physical eSSL door machine after running a command.
 */
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sn = searchParams.get('SN') || searchParams.get('sn') || 'SDE7261100390'
  const ip = req.headers.get('x-forwarded-for') || undefined

  recordAdmsHeartbeat(sn, ip)

  return new NextResponse('OK\n', {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}

