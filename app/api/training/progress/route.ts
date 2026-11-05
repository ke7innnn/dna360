import { NextRequest, NextResponse } from 'next/server'
import { validateTrainingSession, resolveAuthorizedMemberId } from '@/lib/training/auth-guard'
import {
  getMemberSessions,
  getMemberBodyMetrics,
  recordBodyMetric,
  getExerciseById,
} from '@/lib/training/db'
import { calculateEpley1RM } from '@/lib/training/session-service'
import { prisma } from '@/lib/prisma'
import type { PersonalRecord } from '@/types/training'

export async function GET(req: NextRequest) {
  try {
    const auth = await validateTrainingSession(req)
    if (!auth.ok) return auth.response!

    const url = new URL(req.url)
    const resolved = resolveAuthorizedMemberId(auth.user!, url.searchParams.get('memberId'))
    if (resolved.errorResponse) return resolved.errorResponse

    const memberId = resolved.memberId!
    const sessions = getMemberSessions(memberId).filter(s => s.status === 'COMPLETED')
    let metrics = getMemberBodyMetrics(memberId)

    // Query authoritative body metrics from Supabase
    try {
      const dbMetrics = await prisma.bodyMetric.findMany({
        where: { memberId },
        orderBy: { recordedAt: 'desc' },
        take: 25,
      })
      if (dbMetrics.length > 0) {
        const mapped = dbMetrics.map(m => ({
          id: m.id,
          memberId: m.memberId,
          recordedAt: m.recordedAt.toISOString(),
          weightKg: m.weightKg,
          bodyFatPct: m.bodyFatPct,
          measurements: (m.measurements as Record<string, number>) || null,
          photoKeys: m.photoKeys || [],
          recordedById: m.recordedById,
        }))
        const seenIds = new Set(mapped.map(x => x.id))
        metrics = [...mapped, ...metrics.filter(x => !seenIds.has(x.id))]
      }
    } catch (dbErr) {
      console.warn('Progress GET Supabase fallback:', dbErr)
    }

    // Compute All-Time PRs & Exercise Timeline
    const prMap: Record<string, { maxWeight: number; best1RM: number; reps: number; achievedAt: string; exerciseName: string }> = {}
    const volumeTimeline: { date: string; volumeKg: number }[] = []

    for (const session of sessions) {
      let sessionVol = 0
      const dateStr = session.completedAt?.slice(0, 10) || session.scheduledDate?.slice(0, 10) || ''

      for (const sex of session.exercises) {
        if (sex.skipped) continue
        const exercise = getExerciseById(sex.exerciseId)
        const name = exercise?.name || 'Exercise'

        if (!prMap[sex.exerciseId]) {
          prMap[sex.exerciseId] = { maxWeight: 0, best1RM: 0, reps: 0, achievedAt: '', exerciseName: name }
        }

        for (const set of sex.setLogs) {
          const w = set.weightKg || 0
          const r = set.reps || 0
          sessionVol += w * r

          if (w > prMap[sex.exerciseId].maxWeight) {
            prMap[sex.exerciseId].maxWeight = w
            prMap[sex.exerciseId].achievedAt = set.completedAt
          }

          const est1RM = calculateEpley1RM(w, r)
          if (est1RM > prMap[sex.exerciseId].best1RM) {
            prMap[sex.exerciseId].best1RM = est1RM
            prMap[sex.exerciseId].reps = r
          }
        }
      }

      if (dateStr && sessionVol > 0) {
        volumeTimeline.push({ date: dateStr, volumeKg: Math.round(sessionVol) })
      }
    }

    const prBoard: PersonalRecord[] = Object.entries(prMap)
      .filter(([_, data]) => data.maxWeight > 0)
      .map(([exerciseId, data]) => ({
        exerciseId,
        exerciseName: data.exerciseName,
        category: 'MAX_WEIGHT',
        value: data.maxWeight,
        unit: 'kg',
        achievedAt: data.achievedAt,
        sessionId: '',
      }))

    return NextResponse.json({
      prBoard,
      volumeTimeline: volumeTimeline.slice(0, 15),
      bodyMetrics: metrics,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch progress data' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await validateTrainingSession(req)
    if (!auth.ok) return auth.response!

    const body = await req.json()
    const resolved = resolveAuthorizedMemberId(auth.user!, body.memberId)
    if (resolved.errorResponse) return resolved.errorResponse

    const memberId = resolved.memberId!
    const weightKg = body.weightKg ? parseFloat(body.weightKg) : null
    const bodyFatPct = body.bodyFatPct ? parseFloat(body.bodyFatPct) : null
    const recordedAt = body.recordedAt || new Date().toISOString()

    const metric = recordBodyMetric({
      memberId,
      recordedAt,
      weightKg,
      bodyFatPct,
      measurements: body.measurements || null,
      photoKeys: body.photoKeys || [],
      recordedById: auth.user!.id,
    })

    // Persist into Supabase BodyMetric table
    try {
      await prisma.bodyMetric.create({
        data: {
          id: metric.id,
          memberId,
          recordedAt: new Date(recordedAt),
          weightKg,
          bodyFatPct,
          measurements: body.measurements || {},
          photoKeys: body.photoKeys || [],
          recordedById: auth.user!.id,
        },
      })
    } catch (dbErr) {
      console.warn('Supabase BodyMetric insert notice:', dbErr)
    }

    return NextResponse.json({ bodyMetric: metric }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to record body metric' }, { status: 500 })
  }
}
