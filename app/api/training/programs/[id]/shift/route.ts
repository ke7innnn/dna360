import { NextRequest, NextResponse } from 'next/server'
import { validateTrainingSession } from '@/lib/training/auth-guard'
import { shiftPlanSchedule } from '@/lib/training/revisions-service'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = validateTrainingSession(req)
    if (!auth.ok) return auth.response!

    const body = await req.json()
    const daysForward = parseInt(body.days || '7', 10)

    const result = shiftPlanSchedule(params.id, daysForward, auth.user!)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to shift plan' }, { status: 500 })
  }
}
