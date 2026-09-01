import { NextRequest, NextResponse } from 'next/server'
import { validateTrainingSession, canAccessMemberTraining } from '@/lib/training/auth-guard'
import { getSessionById } from '@/lib/training/db'
import {
  addExerciseToSession,
  swapSessionExercise,
  getSwapAlternatives,
  skipSessionExercise,
} from '@/lib/training/session-service'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = validateTrainingSession(req)
    if (!auth.ok) return auth.response!

    const url = new URL(req.url)
    const exerciseId = url.searchParams.get('exerciseId')
    if (!exerciseId) {
      return NextResponse.json({ error: 'exerciseId required' }, { status: 400 })
    }

    const alternatives = getSwapAlternatives(exerciseId)
    return NextResponse.json({ alternatives })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch swap alternatives' }, { status: 500 })
  }
}

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
    if (!body.exerciseId) return NextResponse.json({ error: 'exerciseId is required' }, { status: 400 })

    const added = addExerciseToSession(params.id, body.exerciseId, body.source || 'MEMBER_ADDED')
    return NextResponse.json({ sessionExercise: added }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to add exercise' }, { status: 500 })
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
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    const access = canAccessMemberTraining(auth.user!, session.memberId)
    if (!access.allowed) return NextResponse.json({ error: access.reason || 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const { sessionExerciseId, action } = body

    if (!sessionExerciseId) {
      return NextResponse.json({ error: 'sessionExerciseId is required' }, { status: 400 })
    }

    if (action === 'SWAP') {
      if (!body.targetExerciseId) {
        return NextResponse.json({ error: 'targetExerciseId is required for swap' }, { status: 400 })
      }
      const swapped = swapSessionExercise(params.id, sessionExerciseId, body.targetExerciseId)
      return NextResponse.json({ sessionExercise: swapped })
    }

    if (action === 'SKIP') {
      const skipped = skipSessionExercise(params.id, sessionExerciseId, body.reason)
      return NextResponse.json({ success: skipped })
    }

    return NextResponse.json({ error: 'Invalid action. Must be SWAP or SKIP.' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update exercise' }, { status: 500 })
  }
}
