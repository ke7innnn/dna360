import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/server-auth'
import { prisma } from '@/lib/prisma'
import { toLocalDateStr, parseLocalDate } from '@/lib/dates'

export const dynamic = 'force-dynamic'

const DAY_MS = 24 * 60 * 60 * 1000

function daysUntil(dateStr?: string | null): number {
  if (!dateStr) return 0
  const diff = parseLocalDate(dateStr).getTime() - parseLocalDate(toLocalDateStr()).getTime()
  return Math.max(0, Math.round(diff / DAY_MS))
}

async function resolveTargetMember(req: NextRequest, bodyMemberId?: string | null) {
  const { session } = await getServerSession(req)
  if (!session?.user) return null

  const roleSlug = (session.user.role?.slug || '').toUpperCase()
  const isMember = session.user.type === 'MEMBER' || roleSlug === 'MEMBER'

  const url = new URL(req.url)
  const targetMemberId = isMember
    ? session.user.id
    : bodyMemberId || url.searchParams.get('memberId') || session.user.id

  if (!targetMemberId) return null

  const orConditions: any[] = isMember
    ? [
        { id: session.user.id },
        ...(session.user.email ? [{ email: session.user.email }] : []),
        ...(session.user.phone ? [{ phone: session.user.phone }] : []),
      ]
    : [
        { id: targetMemberId },
        { memberCode: targetMemberId },
        { email: targetMemberId },
        { phone: targetMemberId },
        { name: { equals: targetMemberId, mode: 'insensitive' } },
      ]

  return prisma.member.findFirst({
    where: {
      OR: orConditions,
    },
    include: {
      memberships: {
        orderBy: { createdAt: 'desc' },
      },
      bookings: {
        where: {
          status: { in: ['confirmed', 'waitlisted'] },
        },
        include: {
          session: true,
        },
        orderBy: {
          bookedAt: 'desc',
        },
        take: 10,
      },
      ptSessionLogs: {
        orderBy: {
          date: 'desc',
        },
        take: 10,
      },
    },
  })
}

export async function GET(req: NextRequest) {
  try {
    const { session } = await getServerSession(req)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const member = await resolveTargetMember(req)

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found in database' },
        { status: 404 }
      )
    }

    // Fetch latest body metrics from Supabase
    const recentMetrics = await prisma.bodyMetric.findMany({
      where: { memberId: member.id },
      orderBy: { recordedAt: 'desc' },
      take: 10,
    })
    const latestMetric = recentMetrics[0] || null

    // Fetch active MemberProgram if any
    const activeProgram = await prisma.memberProgram.findFirst({
      where: { memberId: member.id, status: 'ACTIVE' },
      orderBy: { startDate: 'desc' },
    }).catch(() => null)

    const activeGymMs = member.memberships.find(
      (m) => m.status === 'active' && m.category === 'gym_membership'
    )
    const primaryMs = activeGymMs || member.memberships.find((m) => m.status === 'active') || member.memberships[0]

    const ptMs = member.memberships.find(
      (m) =>
        m.status === 'active' &&
        (m.category === 'personal_training' ||
          (m.sessionsTotal !== null && m.sessionsTotal !== undefined && m.category !== 'reformer_pilates') ||
          /\bpt\b|personal/i.test(m.productName || ''))
    )

    const expiry = primaryMs?.expiryDate || null

    const profile = {
      memberId: member.id,
      memberName: member.name,
      memberCode: member.memberCode,
      phone: member.phone,
      email: member.email || '',
      status: member.status,
      planName: primaryMs?.productName || 'No active plan',
      planTier: primaryMs?.productName || 'No active plan',
      branchName: 'DNA 360 Powai',
      expiryDate: expiry,
      daysRemaining: daysUntil(expiry),
      activePlans: member.memberships
        .filter((ms) => ms.status === 'active')
        .map((ms) => ({
          id: ms.id,
          productName: ms.productName,
          category: ms.category,
          expiryDate: ms.expiryDate,
          daysRemaining: daysUntil(ms.expiryDate),
          sessionsRemaining: ms.sessionsRemaining,
          sessionsTotal: ms.sessionsTotal,
        })),
      attendanceStreak: member.attendanceStreak ?? 0,
      totalVisits: member.totalCheckIns ?? 0,
      lastVisitAt: member.lastVisitAt?.toISOString() || null,
      ptSessionsRemaining: ptMs?.sessionsRemaining ?? 0,
      ptSessionsTotal: ptMs?.sessionsTotal ?? 0,
      assignedTrainer: member.assignedTrainerName || null,
      assignedTrainerId: member.assignedTrainerId || null,
      specialInclusions: member.specialInclusions || null,
      adjustmentCreditsRemaining: member.adjustmentCreditsRemaining ?? 0,
      activeProgram: activeProgram || null,
      recentBookings: (member.bookings || []).map((b) => ({
        id: b.id,
        sessionId: b.sessionId,
        title: b.session.title,
        date: b.session.date,
        time: `${b.session.startTime} - ${b.session.endTime}`,
        studio: b.session.studioName,
        instructor: b.session.instructorName,
        status: b.status,
      })),
      recentPtLogs: member.ptSessionLogs.map((l) => ({
        id: l.id,
        date: l.date,
        trainerName: l.trainerName,
        workoutFocus: l.workoutFocus,
        durationMinutes: l.durationMinutes,
        status: l.status,
      })),
      biometrics: latestMetric
        ? {
            recordedAt: latestMetric.recordedAt.toISOString(),
            weightKg: latestMetric.weightKg,
            bodyFatPct: latestMetric.bodyFatPct,
            measurements: latestMetric.measurements,
          }
        : null,
      fitnessMetrics: recentMetrics.map((m) => ({
        id: m.id,
        recordedAt: m.recordedAt.toISOString(),
        weightKg: m.weightKg,
        bodyFatPct: m.bodyFatPct,
        muscleMassKg: (m.measurements as any)?.muscleMassKg ?? null,
        measurements: m.measurements,
      })),
    }

    return NextResponse.json({ success: true, profile })
  } catch (err: any) {
    console.error('Member profile GET error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { session } = await getServerSession(req)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const member = await resolveTargetMember(req, body.memberId)

    if (!member) {
      return NextResponse.json({ error: 'Member not found in database' }, { status: 404 })
    }

    const action = body.action || 'UPDATE_PROFILE'

    // 1. Complete workout session -> increment streak & totalCheckIns + record WorkoutSession
    if (action === 'COMPLETE_WORKOUT') {
      const newStreak = (member.attendanceStreak || 0) + 1
      const newVisits = (member.totalCheckIns || 0) + 1
      const now = new Date()

      const updatedMember = await prisma.member.update({
        where: { id: member.id },
        data: {
          attendanceStreak: newStreak,
          totalCheckIns: newVisits,
          lastVisitAt: now,
        },
      })

      let workoutSession = null
      try {
        workoutSession = await prisma.workoutSession.create({
          data: {
            memberId: member.id,
            title: body.title || 'Push & Core Hypertrophy',
            scheduledDate: now,
            startedAt: body.startedAt ? new Date(body.startedAt) : new Date(now.getTime() - (body.durationSeconds || 2700) * 1000),
            completedAt: now,
            status: 'COMPLETED',
            memberFeedback: body.feedback || `Volume: ${body.totalVolumeKg || 0} kg`,
            perceivedEffort: body.rpe || 8,
          },
        })
      } catch (e) {
        console.warn('WorkoutSession DB log note:', e)
      }

      return NextResponse.json({
        success: true,
        attendanceStreak: updatedMember.attendanceStreak,
        totalVisits: updatedMember.totalCheckIns,
        lastVisitAt: updatedMember.lastVisitAt?.toISOString(),
        workoutSession,
      })
    }

    // 2. Submit Freeze Request -> extend active membership expiry & record note
    if (action === 'FREEZE_REQUEST') {
      const daysCount = Number(body.daysCount) || 14
      const activeMs = member.memberships.find((m) => m.status === 'active')
      let newExpiry: string | null = activeMs?.expiryDate || null

      if (activeMs && activeMs.expiryDate) {
        const currentExp = parseLocalDate(activeMs.expiryDate)
        currentExp.setDate(currentExp.getDate() + daysCount)
        newExpiry = toLocalDateStr(currentExp)

        await prisma.membership.update({
          where: { id: activeMs.id },
          data: { expiryDate: newExpiry },
        })
      }

      const freezeSummary = `Freeze requested (${daysCount}d: ${body.startDate || ''} to ${body.endDate || ''}) - ${body.reason || 'Personal'}`
      await prisma.member.update({
        where: { id: member.id },
        data: {
          specialInclusions: member.specialInclusions
            ? `${member.specialInclusions} | ${freezeSummary}`
            : freezeSummary,
        },
      })

      return NextResponse.json({
        success: true,
        newExpiryDate: newExpiry,
        daysExtended: daysCount,
      })
    }

    // 3. Record Body Metric directly
    if (action === 'RECORD_METRIC') {
      const metric = await prisma.bodyMetric.create({
        data: {
          memberId: member.id,
          recordedAt: body.recordedAt ? new Date(body.recordedAt) : new Date(),
          weightKg: body.weightKg !== undefined && body.weightKg !== null ? Number(body.weightKg) : null,
          bodyFatPct: body.bodyFatPct !== undefined && body.bodyFatPct !== null ? Number(body.bodyFatPct) : null,
          measurements: body.measurements || (body.muscleMassKg ? { muscleMassKg: Number(body.muscleMassKg) } : {}),
          photoKeys: body.photoKeys || [],
          recordedById: body.recordedById || member.id,
        },
      })

      return NextResponse.json({ success: true, metric })
    }

    // 4. Generic profile update (from updateMember in lib/members.ts or onboarding/admin actions)
    const updateData: any = {}
    if (typeof body.attendanceStreak === 'number') updateData.attendanceStreak = body.attendanceStreak
    if (typeof body.attendance_streak === 'number') updateData.attendanceStreak = body.attendance_streak
    if (typeof body.totalCheckIns === 'number') updateData.totalCheckIns = body.totalCheckIns
    if (typeof body.total_check_ins === 'number') updateData.totalCheckIns = body.total_check_ins
    if (body.lastVisitAt || body.last_visit_at) {
      updateData.lastVisitAt = new Date(body.lastVisitAt || body.last_visit_at)
    }
    if (body.status) updateData.status = body.status
    if (typeof body.blacklisted === 'boolean') updateData.blacklisted = body.blacklisted
    if (body.blacklistReason !== undefined || body.blacklist_reason !== undefined) {
      updateData.blacklistReason = body.blacklistReason ?? body.blacklist_reason
    }
    if (body.assignedTrainerId !== undefined || body.assigned_trainer_id !== undefined) {
      updateData.assignedTrainerId = body.assignedTrainerId ?? body.assigned_trainer_id
    }
    if (body.assignedTrainerName !== undefined || body.assigned_trainer_name !== undefined) {
      updateData.assignedTrainerName = body.assignedTrainerName ?? body.assigned_trainer_name
    }
    if (typeof body.adjustmentCreditsRemaining === 'number' || typeof body.adjustment_credits_remaining === 'number') {
      updateData.adjustmentCreditsRemaining = body.adjustmentCreditsRemaining ?? body.adjustment_credits_remaining
    }
    if (body.specialInclusions !== undefined || body.special_inclusions !== undefined) {
      updateData.specialInclusions = body.specialInclusions ?? body.special_inclusions
    }
    if (typeof body.lifetimeValue === 'number' || typeof body.lifetime_value === 'number') {
      updateData.lifetimeValue = BigInt(Math.round(body.lifetimeValue ?? body.lifetime_value))
    }

    const updated = Object.keys(updateData).length > 0
      ? await prisma.member.update({ where: { id: member.id }, data: updateData })
      : member

    return NextResponse.json({ success: true, memberId: updated.id })
  } catch (err: any) {
    console.error('Member profile PATCH error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  return PATCH(req)
}
