import { NextRequest, NextResponse } from 'next/server'
import { validateTrainingSession } from '@/lib/training/auth-guard'
import { getGymPrograms, getMemberPrograms, saveProgram, generateCuid } from '@/lib/training/db'
import { startGymProgram } from '@/lib/training/revisions-service'
import { prisma } from '@/lib/prisma'
import type { Program } from '@/types/training'

export async function GET(req: NextRequest) {
  try {
    const auth = await validateTrainingSession(req)
    if (!auth.ok) return auth.response!

    const gymPrograms = getGymPrograms()
    let memberPrograms = getMemberPrograms(auth.user!.id)

    try {
      const dbMemberPrograms = await prisma.memberProgram.findMany({
        where: { memberId: auth.user!.id },
        orderBy: { startDate: 'desc' },
      })
      if (dbMemberPrograms.length > 0) {
        const mapped = dbMemberPrograms.map((mp) => ({
          id: mp.id,
          memberId: mp.memberId,
          trainerId: mp.trainerId,
          coachingMode: mp.coachingMode as any,
          sourceProgramId: mp.sourceProgramId,
          currentVersion: mp.currentVersion,
          snapshot: mp.snapshot as any,
          adaptationPolicy: mp.adaptationPolicy as any,
          scheduleMode: mp.scheduleMode as any,
          scheduleDays: mp.scheduleDays || [],
          sessionsPerWeek: mp.sessionsPerWeek,
          startDate: mp.startDate.toISOString(),
          endDate: mp.endDate ? mp.endDate.toISOString() : null,
          status: mp.status as any,
        }))
        const seen = new Set(mapped.map((m) => m.id))
        memberPrograms = [...mapped, ...memberPrograms.filter((m) => !seen.has(m.id))]
      }
    } catch (dbErr) {
      console.warn('Programs GET Supabase fallback:', dbErr)
    }

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
    const auth = await validateTrainingSession(req)
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

      if (result.memberProgram) {
        const mp = result.memberProgram
        try {
          await prisma.memberProgram.upsert({
            where: { id: mp.id },
            update: {
              status: mp.status || 'ACTIVE',
              snapshot: mp.snapshot as any,
            },
            create: {
              id: mp.id,
              memberId: mp.memberId,
              trainerId: mp.trainerId || null,
              coachingMode: (mp.coachingMode as any) || 'SELF_COACHED',
              sourceProgramId: mp.sourceProgramId || null,
              currentVersion: mp.currentVersion || 1,
              snapshot: (mp.snapshot as any) || {},
              adaptationPolicy: (mp.adaptationPolicy as any) || 'FLEXIBLE',
              scheduleMode: (mp.scheduleMode as any) || 'FLEXIBLE',
              scheduleDays: mp.scheduleDays || [],
              sessionsPerWeek: mp.sessionsPerWeek || 3,
              startDate: new Date(mp.startDate || Date.now()),
              status: mp.status || 'ACTIVE',
            },
          })
        } catch (dbErr) {
          console.warn('Supabase MemberProgram clone sync notice:', dbErr)
        }
      }

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

      try {
        await prisma.program.create({
          data: {
            id: newProgram.id,
            name: newProgram.name,
            goal: (newProgram.goal as any) || 'GENERAL',
            weeks: newProgram.weeks,
            daysPerWeek: newProgram.daysPerWeek,
            notes: newProgram.notes,
            ownerType: 'MEMBER',
            ownerId: auth.user!.id,
            visibility: 'PRIVATE',
          },
        })
      } catch (dbErr) {
        console.warn('Supabase Program insert notice:', dbErr)
      }

      return NextResponse.json({ program: newProgram }, { status: 201 })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to process program action' }, { status: 500 })
  }
}
