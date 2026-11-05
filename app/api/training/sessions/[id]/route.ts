import { NextRequest, NextResponse } from 'next/server'
import { validateTrainingSession, canAccessMemberTraining } from '@/lib/training/auth-guard'
import { getSessionById, getExerciseById } from '@/lib/training/db'
import { finishWorkoutSession, getLastPerformance } from '@/lib/training/session-service'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await validateTrainingSession(req)
    if (!auth.ok) return auth.response!

    const session = getSessionById(params.id)
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const access = canAccessMemberTraining(auth.user!, session.memberId)
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason || 'Forbidden' }, { status: 403 })
    }

    // Attach exercise details and last-performance telemetry
    for (const sex of session.exercises) {
      if (!sex.exercise) sex.exercise = getExerciseById(sex.exerciseId) || undefined
      const lastPerf = getLastPerformance(session.memberId, sex.exerciseId, session.id)
      ;(sex as any).lastPerformance = lastPerf?.text || null
    }

    return NextResponse.json({ session })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch session' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await validateTrainingSession(req)
    if (!auth.ok) return auth.response!

    const session = getSessionById(params.id)
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const access = canAccessMemberTraining(auth.user!, session.memberId)
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason || 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { session: completed, prs } = finishWorkoutSession(params.id, {
      perceivedEffort: body.perceivedEffort,
      memberFeedback: body.memberFeedback,
      ptSessionId: body.ptSessionId,
    })

    // Sync completed session & member streak/visits to Supabase
    try {
      await prisma.workoutSession.upsert({
        where: { id: params.id },
        update: {
          status: 'COMPLETED',
          completedAt: new Date(),
          perceivedEffort: body.perceivedEffort || null,
          memberFeedback: body.memberFeedback || null,
          ptSessionId: body.ptSessionId || null,
        },
        create: {
          id: params.id,
          memberId: session.memberId,
          title: session.title || 'Workout Session',
          scheduledDate: session.scheduledDate ? new Date(session.scheduledDate) : new Date(),
          startedAt: session.startedAt ? new Date(session.startedAt) : new Date(),
          completedAt: new Date(),
          status: 'COMPLETED',
          perceivedEffort: body.perceivedEffort || null,
          memberFeedback: body.memberFeedback || null,
          ptSessionId: body.ptSessionId || null,
        },
      })

      const dbMember = await prisma.member.findUnique({ where: { id: session.memberId } })
      if (dbMember) {
        await prisma.member.update({
          where: { id: session.memberId },
          data: {
            attendanceStreak: (dbMember.attendanceStreak || 0) + 1,
            totalCheckIns: (dbMember.totalCheckIns || 0) + 1,
            lastVisitAt: new Date(),
          },
        })
      }
    } catch (dbErr) {
      console.warn('Supabase finishWorkoutSession sync notice:', dbErr)
    }

    return NextResponse.json({ session: completed, prs })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to finish session' }, { status: 500 })
  }
}
