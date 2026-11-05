import { NextRequest, NextResponse } from 'next/server'
import { validateTrainingSession, resolveAuthorizedMemberId } from '@/lib/training/auth-guard'
import { getMemberSessions, getActiveMemberProgram, getExerciseById } from '@/lib/training/db'
import { startFreestyleSession, getLastPerformance } from '@/lib/training/session-service'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const auth = await validateTrainingSession(req)
    if (!auth.ok) return auth.response!

    const url = new URL(req.url)
    const targetMemberIdParam = url.searchParams.get('memberId')
    const resolved = resolveAuthorizedMemberId(auth.user!, targetMemberIdParam)
    if (resolved.errorResponse) return resolved.errorResponse

    const memberId = resolved.memberId!
    let sessions = getMemberSessions(memberId)
    let activeProgram = getActiveMemberProgram(memberId)

    // Hydrate from Supabase if available
    try {
      const dbProgram = await prisma.memberProgram.findFirst({
        where: { memberId, status: 'ACTIVE' },
        orderBy: { startDate: 'desc' },
      })
      if (dbProgram) {
        activeProgram = {
          id: dbProgram.id,
          memberId: dbProgram.memberId,
          trainerId: dbProgram.trainerId,
          coachingMode: dbProgram.coachingMode as any,
          sourceProgramId: dbProgram.sourceProgramId,
          currentVersion: dbProgram.currentVersion,
          snapshot: dbProgram.snapshot as any,
          adaptationPolicy: dbProgram.adaptationPolicy as any,
          scheduleMode: dbProgram.scheduleMode as any,
          scheduleDays: dbProgram.scheduleDays || [],
          sessionsPerWeek: dbProgram.sessionsPerWeek,
          startDate: dbProgram.startDate.toISOString(),
          endDate: dbProgram.endDate ? dbProgram.endDate.toISOString() : null,
          status: dbProgram.status as any,
        }
      }

      const dbSessions = await prisma.workoutSession.findMany({
        where: { memberId },
        orderBy: { scheduledDate: 'desc' },
        take: 15,
      })
      if (dbSessions.length > 0) {
        const mapped = dbSessions.map((s) => ({
          id: s.id,
          memberId: s.memberId,
          memberProgramId: s.memberProgramId,
          programVersion: s.programVersion,
          weekIndex: s.weekIndex,
          dayIndex: s.dayIndex,
          title: s.title || 'Workout Session',
          scheduledDate: s.scheduledDate?.toISOString() || null,
          startedAt: s.startedAt?.toISOString() || null,
          completedAt: s.completedAt?.toISOString() || null,
          status: s.status as any,
          memberFeedback: s.memberFeedback,
          perceivedEffort: s.perceivedEffort,
          ptSessionId: s.ptSessionId,
          exercises: [],
        }))
        const seen = new Set(sessions.map((x) => x.id))
        sessions = [...sessions, ...mapped.filter((x) => !seen.has(x.id))]
      }
    } catch {
      // Fallback to in-memory
    }

    // Find currently in-progress session if any
    const activeSession = sessions.find(s => s.status === 'IN_PROGRESS') || null

    // Augment exercises with inline last-time performance
    if (activeSession) {
      for (const sex of activeSession.exercises) {
        if (!sex.exercise) sex.exercise = getExerciseById(sex.exerciseId) || undefined
        const lastPerf = getLastPerformance(memberId, sex.exerciseId, activeSession.id)
        ;(sex as any).lastPerformance = lastPerf?.text || null
      }
    }

    return NextResponse.json({
      activeSession,
      activeProgram,
      history: sessions.filter(s => s.status === 'COMPLETED').slice(0, 10),
      totalSessions: sessions.length,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch sessions' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await validateTrainingSession(req)
    if (!auth.ok) return auth.response!

    const body = await req.json().catch(() => ({}))
    const resolved = resolveAuthorizedMemberId(auth.user!, body.memberId)
    if (resolved.errorResponse) return resolved.errorResponse

    const memberId = resolved.memberId!
    const title = body.title || 'Freestyle Workout'

    const session = startFreestyleSession(memberId, title)

    try {
      await prisma.workoutSession.create({
        data: {
          id: session.id,
          memberId,
          title,
          scheduledDate: new Date(),
          startedAt: new Date(),
          status: 'IN_PROGRESS',
        },
      })
    } catch (dbErr) {
      console.warn('Supabase WorkoutSession start notice:', dbErr)
    }

    return NextResponse.json({ session }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to start workout session' }, { status: 500 })
  }
}
