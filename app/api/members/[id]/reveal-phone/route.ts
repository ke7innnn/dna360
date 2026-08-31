import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/server-auth'
import { getStoredMembers } from '@/lib/members'
import { logAuditEvent } from '@/lib/audit'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const canViewAll = isOwner || userCaps.includes('members.view.all')
    const canViewOwn = userCaps.includes('members.view.own')

    const memberId = params.id
    const members = getStoredMembers()
    const member = members.find(m => m.id === memberId || m.member_code === memberId)

    if (!member) {
      return NextResponse.json({ error: 'Member not found.' }, { status: 404 })
    }

    // If trainer, check that they are assigned to this member
    if (!canViewAll) {
      if (!canViewOwn || member.assigned_trainer_id !== user.id) {
        return NextResponse.json(
          { error: 'Forbidden: You can only reveal contact info for your assigned clients.' },
          { status: 403 }
        )
      }
    }

    // Log mandatory PII reveal audit event
    logAuditEvent({
      actor: { id: user.id, name: user.name, email: user.email || user.phone, role: user.role.name },
      action: 'VIEW',
      entity: 'MemberPhonePII',
      entityId: member.id,
      branchId: user.branchId,
      description: `${user.name} (${user.role.name}) revealed unmasked phone number for member ${member.name} (${member.member_code})`,
    })

    return NextResponse.json({
      memberId: member.id,
      name: member.name,
      phone: member.phone,
      revealedAt: new Date().toISOString(),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to reveal phone' }, { status: 500 })
  }
}
