import { NextRequest, NextResponse } from 'next/server'
import { validateTrainingSession } from '@/lib/training/auth-guard'
import { assignProgramToClient } from '@/lib/training/trainer-service'

export async function POST(req: NextRequest) {
  try {
    const auth = validateTrainingSession(req)
    if (!auth.ok) return auth.response!

    const user = auth.user!
    const roleSlug = user.role?.slug.toUpperCase()
    if (roleSlug !== 'TRAINER' && roleSlug !== 'HEAD_TRAINER' && roleSlug !== 'OWNER') {
      return NextResponse.json({ error: 'Trainer role required to assign programs.' }, { status: 403 })
    }

    const body = await req.json()
    if (!body.memberId || !body.programId) {
      return NextResponse.json({ error: 'memberId and programId are required.' }, { status: 400 })
    }

    const memberProgram = assignProgramToClient(user, body.memberId, body.programId, {
      adaptationPolicy: body.adaptationPolicy,
      scheduleMode: body.scheduleMode,
      scheduleDays: body.scheduleDays,
      startDate: body.startDate,
    })

    return NextResponse.json({ memberProgram }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to assign program' }, { status: 500 })
  }
}
