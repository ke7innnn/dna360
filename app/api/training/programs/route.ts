import { NextRequest, NextResponse } from 'next/server'
import { validateTrainingSession, resolveAuthorizedMemberId } from '@/lib/training/auth-guard'
import { getGymPrograms, getMemberPrograms, saveProgram, generateCuid } from '@/lib/training/db'
import { startGymProgram } from '@/lib/training/revisions-service'
import type { Program } from '@/types/training'

export async function GET(req: NextRequest) {
  try {
    const auth = validateTrainingSession(req)
    if (!auth.ok) return auth.response!

    const url = new URL(req.url)
    const view = url.searchParams.get('view') || 'all'

    const gymPrograms = getGymPrograms()
    const memberPrograms = getMemberPrograms(auth.user!.id)

    return NextResponse.json({
      gymPrograms,
      memberPrograms,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch programs' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = validateTrainingSession(req)
    if (!auth.ok) return auth.response!

    const body = await req.json()
    const { action } = body

    if (action === 'CLONE_GYM') {
      if (!body.programId) {
        return NextResponse.json({ error: 'programId required' }, { status: 400 })
      }
      const result = startGymProgram(auth.user!, body.programId, {
        scheduleMode: body.scheduleMode,
        scheduleDays: body.scheduleDays,
        adaptationPolicy: body.adaptationPolicy,
      })
      return NextResponse.json(result, { status: 201 })
    }

    if (action === 'BUILD_CUSTOM') {
      const progId = generateCuid('prog_custom')
      const newProgram: Program = {
        id: progId,
        name: body.name || 'My Custom Program',
        goal: body.goal || 'GENERAL',
        weeks: body.weeks || 4,
        daysPerWeek: body.daysPerWeek || 3,
        notes: body.notes || null,
        ownerType: 'MEMBER',
        ownerId: auth.user!.id,
        visibility: 'PRIVATE',
        clonedFromId: null,
        days: body.days || [],
      }
      saveProgram(newProgram)
      return NextResponse.json({ program: newProgram }, { status: 201 })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to process program action' }, { status: 500 })
  }
}
