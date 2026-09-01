import { NextRequest, NextResponse } from 'next/server'
import { validateTrainingSession, resolveAuthorizedMemberId } from '@/lib/training/auth-guard'
import { getMemberSessions, getActiveMemberProgram, getExerciseById } from '@/lib/training/db'
import { startFreestyleSession, getLastPerformance } from '@/lib/training/session-service'

export async function GET(req: NextRequest) {
  try {
    const auth = validateTrainingSession(req)
    if (!auth.ok) return auth.response!

    const url = new URL(req.url)
    const targetMemberIdParam = url.searchParams.get('memberId')
    const resolved = resolveAuthorizedMemberId(auth.user!, targetMemberIdParam)
    if (resolved.errorResponse) return resolved.errorResponse

    const memberId = resolved.memberId!
    const sessions = getMemberSessions(memberId)

    // Find currently in-progress session if any
    const activeSession = sessions.find(s => s.status === 'IN_PROGRESS') || null
    const activeProgram = getActiveMemberProgram(memberId)

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
    const auth = validateTrainingSession(req)
    if (!auth.ok) return auth.response!

    const body = await req.json().catch(() => ({}))
    const resolved = resolveAuthorizedMemberId(auth.user!, body.memberId)
    if (resolved.errorResponse) return resolved.errorResponse

    const memberId = resolved.memberId!
    const title = body.title || 'Freestyle Workout'

    const session = startFreestyleSession(memberId, title)
    return NextResponse.json({ session }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to start workout session' }, { status: 500 })
  }
}
