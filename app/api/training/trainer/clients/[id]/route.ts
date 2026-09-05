import { NextRequest, NextResponse } from 'next/server'
import { validateTrainingSession } from '@/lib/training/auth-guard'
import { getStoredMembers } from '@/lib/members'
import { getActiveMemberProgram, getMemberSessions } from '@/lib/training/db'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = validateTrainingSession(req)
    if (!auth.ok) return auth.response!

    const user = auth.user!
    const roleSlug = user.role?.slug.toLowerCase()
    const targetMemberId = params.id

    const members = getStoredMembers()
    const member = members.find((m) => m.id === targetMemberId)

    if (!member) {
      return NextResponse.json({ error: `Client with ID '${targetMemberId}' not found.` }, { status: 404 })
    }

    // 1. Executive Admin / Owner / Head Trainer have global coaching oversight
    if (roleSlug === 'owner_admin' || roleSlug === 'owner' || roleSlug === 'head_trainer') {
      const activeProgram = getActiveMemberProgram(member.id)
      const sessions = getMemberSessions(member.id)
      return NextResponse.json({
        success: true,
        client: member,
        activeProgram,
        recentSessions: sessions.slice(0, 10),
      })
    }

    // 2. General Trainer: Strict Server-Side IDOR Barrier (§4)
    if (roleSlug === 'general_trainer' || roleSlug === 'trainer') {
      const activeProgram = getActiveMemberProgram(member.id)
      const isAssignedTrainer =
        member.assigned_trainer_id === user.id ||
        activeProgram?.trainerId === user.id ||
        (user.assignedClientIds && user.assignedClientIds.includes(member.id))

      if (!isAssignedTrainer) {
        return NextResponse.json(
          {
            error: 'Forbidden: You are not authorized to access records for this client.',
            code: 'CLIENT_ACCESS_DENIED',
            detail: 'Cross-trainer client access is strictly denied by server-side policy.',
          },
          { status: 403 }
        )
      }

      const sessions = getMemberSessions(member.id)
      return NextResponse.json({
        success: true,
        client: member,
        activeProgram,
        recentSessions: sessions.slice(0, 10),
      })
    }

    // 3. Member: Can only access their own record
    if (roleSlug === 'member') {
      if (user.id !== member.id) {
        return NextResponse.json(
          {
            error: 'Forbidden: Members can only access their own records.',
            code: 'CLIENT_ACCESS_DENIED',
          },
          { status: 403 }
        )
      }
      const activeProgram = getActiveMemberProgram(member.id)
      const sessions = getMemberSessions(member.id)
      return NextResponse.json({
        success: true,
        client: member,
        activeProgram,
        recentSessions: sessions.slice(0, 10),
      })
    }

    // All other roles denied
    return NextResponse.json(
      {
        error: `Forbidden: Role '${user.role?.name || roleSlug}' is not authorized to access PT client records.`,
        code: 'CLIENT_ACCESS_DENIED',
      },
      { status: 403 }
    )
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch client record' }, { status: 500 })
  }
}
