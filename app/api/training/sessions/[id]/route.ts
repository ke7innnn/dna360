import { NextRequest, NextResponse } from 'next/server'
import { validateTrainingSession, canAccessMemberTraining } from '@/lib/training/auth-guard'
import { getSessionById, getExerciseById } from '@/lib/training/db'
import { finishWorkoutSession, getLastPerformance } from '@/lib/training/session-service'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = validateTrainingSession(req)
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
    const auth = validateTrainingSession(req)
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

    return NextResponse.json({ session: completed, prs })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to finish session' }, { status: 500 })
  }
}
