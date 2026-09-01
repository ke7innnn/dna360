import { NextRequest, NextResponse } from 'next/server'
import { validateTrainingSession } from '@/lib/training/auth-guard'
import { getExercises, createCustomExercise } from '@/lib/training/db'
import type { MuscleGroup, Equipment } from '@/types/training'

export async function GET(req: NextRequest) {
  try {
    const auth = validateTrainingSession(req)
    if (!auth.ok) return auth.response!

    const url = new URL(req.url)
    const search = url.searchParams.get('search') || undefined
    const muscle = (url.searchParams.get('muscle') as MuscleGroup) || undefined
    const equipment = (url.searchParams.get('equipment') as Equipment) || undefined

    const exercises = getExercises({
      search,
      primaryMuscle: muscle,
      equipment,
    })

    return NextResponse.json({ exercises, count: exercises.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch exercises' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = validateTrainingSession(req)
    if (!auth.ok) return auth.response!

    const body = await req.json()
    if (!body.name || !body.primaryMuscle || !body.equipment) {
      return NextResponse.json({ error: 'Name, primaryMuscle, and equipment are required.' }, { status: 400 })
    }

    const created = createCustomExercise(
      {
        name: body.name,
        primaryMuscle: body.primaryMuscle,
        secondaryMuscles: body.secondaryMuscles || [],
        equipment: body.equipment,
        instructions: body.instructions || null,
        createdById: auth.user!.id,
      },
      auth.user!.id
    )

    return NextResponse.json({ exercise: created }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create exercise' }, { status: 500 })
  }
}
