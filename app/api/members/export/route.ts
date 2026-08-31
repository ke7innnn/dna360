import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, checkExportRateLimit } from '@/lib/server-auth'
import { getStoredMembers } from '@/lib/members'
import { logAuditEvent } from '@/lib/audit'

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
    const isOwner = user.role.slug === 'OWNER' || user.role.slug === 'owner'
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

    // Rate limiting: Max 3 exports per hour
    const rateLimit = checkExportRateLimit(user.id)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded: Maximum 3 member exports per hour.',
          code: 'RATE_LIMIT_EXCEEDED',
        },
        { status: 429 }
      )
    }

    const members = getStoredMembers()

    // Write mandatory audit log
    logAuditEvent({
      actor: { id: user.id, name: user.name, email: user.email || user.phone, role: user.role.name },
      action: 'EXPORT',
      entity: 'MemberDirectory',
      entityId: `exp_mem_${Date.now()}`,
      branchId: user.branchId,
      description: `${user.name} (${user.role.name}) exported complete member directory (${members.length} records).`,
    })

    // Generate CSV
    const headers = ['Member ID', 'Member Code', 'Name', 'Phone', 'Email', 'Gender', 'Status', 'Joined Date', 'Package', 'Expiry Date', 'Total Visits']
    const rows = members.map(m => [
      m.id,
      m.member_code,
      `"${m.name.replace(/"/g, '""')}"`,
      m.phone,
      m.email || '',
      m.gender || '',
      m.status,
      m.joined_date,
      `"${(m.active_memberships[0]?.product_name || 'None').replace(/"/g, '""')}"`,
      m.active_memberships[0]?.expiry_date || '',
      m.total_check_ins || 0,
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
