import { NextRequest, NextResponse } from 'next/server'
import { validateTrainingSession } from '@/lib/training/auth-guard'
import { shiftPlanSchedule } from '@/lib/training/revisions-service'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await validateTrainingSession(req)
    if (!auth.ok) return auth.response!

    const body = await req.json()
    const daysForward = parseInt(body.days || '7', 10)

    const result = shiftPlanSchedule(params.id, daysForward, auth.user!)

    // Persist schedule shift to Supabase MemberProgram if present
    try {
      const existing = await prisma.memberProgram.findFirst({
        where: {
          OR: [{ id: params.id }, { memberId: auth.user!.id, status: 'ACTIVE' }],
        },
      })
      if (existing) {
        const shiftedStart = new Date(existing.startDate.getTime() + daysForward * 86400000)
        const shiftedEnd = existing.endDate
          ? new Date(existing.endDate.getTime() + daysForward * 86400000)
          : null
        await prisma.memberProgram.update({
          where: { id: existing.id },
          data: {
            startDate: shiftedStart,
            endDate: shiftedEnd,
          },
        })
      }
    } catch (dbErr) {
      console.warn('Supabase shift program schedule notice:', dbErr)
    }

    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to shift plan' }, { status: 500 })
  }
}
