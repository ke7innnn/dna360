import { NextRequest, NextResponse } from 'next/server'
import { validateTrainingSession, canAccessMemberTraining } from '@/lib/training/auth-guard'
import { getSessionById } from '@/lib/training/db'
import { logSet } from '@/lib/training/session-service'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = validateTrainingSession(req)
    if (!auth.ok) return auth.response!

    const session = getSessionById(params.id)
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    const access = canAccessMemberTraining(auth.user!, session.memberId)
    if (!access.allowed) return NextResponse.json({ error: access.reason || 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const {
      sessionExerciseId,
      clientLogId,
      setIndex,
      weightKg,
      reps,
      durationSeconds,
      distanceMetres,
      rpe,
      isWarmup,
      completedAt,
    } = body

    if (!sessionExerciseId || !clientLogId || setIndex === undefined) {
      return NextResponse.json(
        { error: 'sessionExerciseId, clientLogId, and setIndex are required.' },
        { status: 400 }
      )
    }

    const setLog = logSet(params.id, sessionExerciseId, {
      clientLogId,
      setIndex,
      weightKg,
      reps,
      durationSeconds,
      distanceMetres,
      rpe,
      isWarmup,
      completedAt,
    })

    if (!setLog) {
      return NextResponse.json({ error: 'Failed to record set log' }, { status: 500 })
    }

    return NextResponse.json({ setLog }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to log set' }, { status: 500 })
  }
}
