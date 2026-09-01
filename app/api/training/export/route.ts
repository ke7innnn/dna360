import { NextRequest, NextResponse } from 'next/server'
import { validateTrainingSession, resolveAuthorizedMemberId, auditTrainingEvent } from '@/lib/training/auth-guard'
import {
  getMemberSessions,
  getMemberBodyMetrics,
  getMemberPrograms,
  getExerciseById,
} from '@/lib/training/db'

export async function GET(req: NextRequest) {
  try {
    const auth = validateTrainingSession(req)
    if (!auth.ok) return auth.response!

    const url = new URL(req.url)
    const format = url.searchParams.get('format') || 'json'

    const resolved = resolveAuthorizedMemberId(auth.user!)
    if (resolved.errorResponse) return resolved.errorResponse

    const memberId = resolved.memberId!
    const sessions = getMemberSessions(memberId)
    const metrics = getMemberBodyMetrics(memberId)
    const programs = getMemberPrograms(memberId)

    auditTrainingEvent(
      auth.user!,
      'EXPORT',
      'MEMBER_DATA',
      memberId,
      `Member ${auth.user!.name} exported personal training data in ${format.toUpperCase()} format (DPDP-aligned)`
    )

    if (format === 'csv') {
      // Build flattened CSV rows
      const header = 'SessionID,Date,Title,Status,Exercise,SetIndex,WeightKg,Reps,DurationSec,RPE\n'
      const rows: string[] = []

      for (const s of sessions) {
        const date = s.completedAt || s.scheduledDate || ''
        for (const sex of s.exercises) {
          const exName = getExerciseById(sex.exerciseId)?.name || sex.exerciseId
          for (const set of sex.setLogs) {
            rows.push(
              `"${s.id}","${date}","${s.title || ''}","${s.status}","${exName}",${set.setIndex},${set.weightKg || ''},${set.reps || ''},${set.durationSeconds || ''},${set.rpe || ''}`
            )
          }
        }
      }

      const csvContent = header + rows.join('\n')
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="dna360_workout_history_${memberId}.csv"`,
        },
      })
    }

    // Default JSON format
    const exportPayload = {
      exportTimestamp: new Date().toISOString(),
      memberId,
      memberName: auth.user!.name,
      programs,
      sessions,
      bodyMetrics: metrics,
    }

    return new NextResponse(JSON.stringify(exportPayload, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="dna360_workout_export_${memberId}.json"`,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to export member data' }, { status: 500 })
  }
}
