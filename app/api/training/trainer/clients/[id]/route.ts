import { NextRequest, NextResponse } from 'next/server'
import { validateTrainingSession } from '@/lib/training/auth-guard'
import { getStoredMembers } from '@/lib/members'
import { getActiveMemberProgram, getMemberSessions } from '@/lib/training/db'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await validateTrainingSession(req)
    if (!auth.ok) return auth.response!

    const user = auth.user!
    const roleSlug = user.role?.slug.toLowerCase()
    const targetMemberId = params.id

    const members = getStoredMembers()
    let member = members.find((m) => m.id === targetMemberId)

    // Hydrate with live Supabase data if available
    try {
      const dbMember = await prisma.member.findUnique({
        where: { id: targetMemberId },
        include: {
          memberships: { where: { status: 'active' } },
        },
      })
      const dbMetrics = await prisma.bodyMetric.findMany({
        where: { memberId: targetMemberId },
        orderBy: { recordedAt: 'desc' },
        take: 10,
      })
      if (dbMember) {
        member = {
          ...(member || ({} as any)),
          id: dbMember.id,
          member_code: dbMember.memberCode,
          memberCode: dbMember.memberCode,
          first_name: dbMember.firstName,
          last_name: dbMember.lastName,
          name: dbMember.name,
          email: dbMember.email,
          phone: dbMember.phone,
          status: dbMember.status as any,
          attendance_streak: dbMember.attendanceStreak,
          total_check_ins: dbMember.totalCheckIns,
          last_visit_at: dbMember.lastVisitAt?.toISOString() || null,
          assigned_trainer_id: dbMember.assignedTrainerId,
          assigned_trainer_name: dbMember.assignedTrainerName,
          active_memberships: dbMember.memberships.map((ms) => ({
            id: ms.id,
            product_id: ms.productId,
            product_name: ms.productName,
            product_category: ms.category as any,
            enrolment_date: ms.enrolmentDate,
            activation_date: ms.activationDate,
            expiry_date: ms.expiryDate,
            amount_paid: Number(ms.amountPaid),
            discount_amount: Number(ms.discountAmount),
            discount_reason: null,
            discount_approved_by: null,
            tax_rate: ms.taxRate,
            status: ms.status as any,
            invoice_id: ms.invoiceId,
            invoice_number: ms.invoiceNumber,
            sales_rep_id: 'usr_fc_01',
            sales_rep_name: 'Front Desk',
            sessions_total: ms.sessionsTotal,
            sessions_consumed: ms.sessionsConsumed,
            sessions_remaining: ms.sessionsRemaining,
            access_window: null,
            void_reason: null,
            voided_by: null,
            voided_at: null,
            transferred_from: null,
            transferred_to: null,
            transfer_fee_invoice_id: null,
          })),
          fitness_metrics: dbMetrics.map((bm) => ({
            id: bm.id,
            recorded_at: bm.recordedAt.toISOString(),
            recorded_by_name: bm.recordedById,
            weight_kg: bm.weightKg ?? undefined,
            body_fat_pct: bm.bodyFatPct ?? undefined,
            muscle_mass_kg: (bm.measurements as any)?.muscleMassKg ?? undefined,
          })),
        }
      }
    } catch {
      // Fallback to in-memory member
    }

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
