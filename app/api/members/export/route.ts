import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/server-auth'
import { hit } from '@/lib/rate-limit'
import { getStoredMembers } from '@/lib/members'
import { logAuditEvent } from '@/lib/audit'

function sanitizeCsvField(value: any): string {
  if (value === null || value === undefined) return '""'
  let str = String(value).trim()
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'` + str
  }
  return `"${str.replace(/"/g, '""')}"`
}

export async function GET(req: NextRequest) {
  try {
    const { session, error } = getServerSession(req)
    if (!session || !session.user) {
      return NextResponse.json(
        { error: error || 'Unauthorized: Authentication required.' },
        { status: 401 }
      )
    }

    const user = session.user
    const userCaps = user.role.capabilities || []
    const isOwner = user.role.slug === 'OWNER' || user.role.slug === 'owner' || user.role.slug === 'owner_admin'
    const canExport = isOwner || userCaps.includes('members.export')

    if (!canExport) {
      return NextResponse.json(
        {
          error: `Forbidden: Role '${user.role.name}' does not hold 'members.export' permission.`,
          code: 'FORBIDDEN',
        },
        { status: 403 }
      )
    }

    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1'

    // Rate limiting: Max 3 exports per hour per user (§5.4)
    const rateLimit = await hit(`export:${user.id}`, 3, 60 * 60 * 1000)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded: Maximum 3 member exports per hour.',
          code: 'RATE_LIMIT_EXCEEDED',
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimit.retryAfterSec) },
        }
      )
    }

    const members = getStoredMembers()

    // Write mandatory audit log with actor, role, IP, row count (§5.4)
    logAuditEvent({
      actor: { id: user.id, name: user.name, email: user.email || undefined, role: user.role.name },
      action: 'EXPORT',
      entity: 'MemberDirectory',
      entityId: `exp_mem_${Date.now()}`,
      branchId: user.branchId || 'pow',
      ipAddress: clientIp,
      description: `${user.name} (${user.role.name}) exported complete member directory (${members.length} records) from ${clientIp}.`,
      afterState: { rowCount: members.length, ip: clientIp, role: user.role.name },
    })

    // Generate CSV
    const headers = ['Member ID', 'Member Code', 'Name', 'Phone', 'Email', 'Gender', 'Status', 'Joined Date', 'Package', 'Expiry Date', 'Total Visits']
    const rows = members.map(m => [
      sanitizeCsvField(m.id),
      sanitizeCsvField(m.member_code),
      sanitizeCsvField(m.name),
      sanitizeCsvField(m.phone),
      sanitizeCsvField(m.email || ''),
      sanitizeCsvField(m.gender || ''),
      sanitizeCsvField(m.status),
      sanitizeCsvField(m.joined_date),
      sanitizeCsvField(m.active_memberships[0]?.product_name || 'None'),
      sanitizeCsvField(m.active_memberships[0]?.expiry_date || ''),
      sanitizeCsvField(m.total_check_ins || 0),
    ])

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="DNA360_Members_Export_${new Date().toISOString().slice(0, 10)}.csv"`,
        'X-RateLimit-Remaining': String(rateLimit.remaining),
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Export failed' }, { status: 500 })
  }
}
