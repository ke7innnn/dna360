import { NextRequest, NextResponse } from 'next/server'
import { validateTrainingSession } from '@/lib/training/auth-guard'
import { getTrainerClientRoster, getAdherenceAlerts } from '@/lib/training/trainer-service'
import { prisma } from '@/lib/prisma'
import type { TrainerClientSummary } from '@/types/training'

export async function GET(req: NextRequest) {
  try {
    const auth = await validateTrainingSession(req)
    if (!auth.ok) return auth.response!

    const user = auth.user!
    const roleSlug = (user.role?.slug || '').toUpperCase()
    if (roleSlug !== 'TRAINER' && roleSlug !== 'HEAD_TRAINER' && roleSlug !== 'OWNER' && roleSlug !== 'OWNER_ADMIN') {
      return NextResponse.json({ error: 'Trainer role required.' }, { status: 403 })
    }

    // Query Supabase for real PT clients / assigned clients
    try {
      const isGlobal = roleSlug === 'HEAD_TRAINER' || roleSlug === 'OWNER' || roleSlug === 'OWNER_ADMIN'
      const dbMembers = await prisma.member.findMany({
        where: isGlobal
          ? {
              OR: [
                { assignedTrainerId: { not: null } },
                { id: { in: ['mem_001', 'mem_002', 'mem_003', 'mem_004', 'mem_005'] } },
                { memberships: { some: { category: { in: ['personal_training', 'reformer_pilates'] } } } },
              ],
            }
          : {
              OR: [
                { assignedTrainerId: user.id },
                { id: { in: ['mem_001', 'mem_002', 'mem_003', 'mem_004', 'mem_005'] } },
              ],
            },
        include: {
          memberships: { where: { status: 'active' } },
        },
        take: 25,
        orderBy: { id: 'asc' },
      })

      if (dbMembers.length > 0) {
        const dbRoster: TrainerClientSummary[] = dbMembers.map((m) => {
          const ptMs = m.memberships.find(
            (ms) =>
              ms.category === 'personal_training' ||
              (ms.sessionsTotal !== null && ms.sessionsTotal !== undefined && ms.category !== 'reformer_pilates') ||
              /\bpt\b|personal/i.test(ms.productName || '')
          )
          return {
            memberId: m.id,
            memberName: m.name,
            memberCode: m.memberCode,
            phone: m.phone,
            programName: ptMs?.productName || m.memberships[0]?.productName || 'Strength & Conditioning',
            coachingMode: m.assignedTrainerId ? 'TRAINER_LED' : 'SELF_COACHED',
            weekCurrent: 1,
            weekTotal: 4,
            adherencePct: m.attendanceStreak > 0 ? Math.min(98, 60 + m.attendanceStreak * 7) : 45,
            lastLoggedSessionDate: m.lastVisitAt?.toISOString() || null,
            ptSessionsRemaining: ptMs?.sessionsRemaining ?? 0,
            ptSessionsTotal: ptMs?.sessionsTotal ?? 0,
            ptTier: 'premium',
            deviationCount: 0,
            hasUnreadNotes: false,
            pendingFormChecks: 0,
          }
        })

        return NextResponse.json({
          clients: dbRoster,
          adherenceAlerts: getAdherenceAlerts(user.id),
          count: dbRoster.length,
        })
      }
    } catch (dbErr) {
      console.warn('Trainer clients Supabase fallback:', dbErr)
    }

    const roster = getTrainerClientRoster(user.id)
    const alerts = getAdherenceAlerts(user.id)

    return NextResponse.json({
      clients: roster,
      adherenceAlerts: alerts,
      count: roster.length,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch trainer clients' }, { status: 500 })
  }
}
