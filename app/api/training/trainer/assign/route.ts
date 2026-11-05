import { NextRequest, NextResponse } from 'next/server'
import { validateTrainingSession } from '@/lib/training/auth-guard'
import { assignProgramToClient } from '@/lib/training/trainer-service'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const auth = await validateTrainingSession(req)
    if (!auth.ok) return auth.response!

    const user = auth.user!
    const roleSlug = (user.role?.slug || '').toUpperCase()
    if (roleSlug !== 'TRAINER' && roleSlug !== 'HEAD_TRAINER' && roleSlug !== 'OWNER' && roleSlug !== 'OWNER_ADMIN') {
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

    // Sync assigned trainer and MemberProgram to Supabase
    try {
      await prisma.member.update({
        where: { id: body.memberId },
        data: {
          assignedTrainerId: user.id,
          assignedTrainerName: user.name,
        },
      })

      if (memberProgram) {
        await prisma.memberProgram.upsert({
          where: { id: memberProgram.id },
          update: {
            trainerId: user.id,
            status: 'ACTIVE',
            snapshot: (memberProgram.snapshot as any) || {},
          },
          create: {
            id: memberProgram.id,
            memberId: body.memberId,
            trainerId: user.id,
            coachingMode: 'TRAINER_LED',
            sourceProgramId: memberProgram.sourceProgramId || body.programId,
            currentVersion: memberProgram.currentVersion || 1,
            snapshot: (memberProgram.snapshot as any) || {},
            adaptationPolicy: (memberProgram.adaptationPolicy as any) || 'FLEXIBLE',
            scheduleMode: (memberProgram.scheduleMode as any) || 'FLEXIBLE',
            scheduleDays: memberProgram.scheduleDays || [1, 3, 5],
            sessionsPerWeek: memberProgram.sessionsPerWeek || 3,
            startDate: new Date(memberProgram.startDate || Date.now()),
            status: 'ACTIVE',
          },
        })
      }
    } catch (dbErr) {
      console.warn('Supabase trainer program assign sync notice:', dbErr)
    }

    return NextResponse.json({ memberProgram }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to assign program' }, { status: 500 })
  }
}
