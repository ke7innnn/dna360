import { NextRequest, NextResponse } from 'next/server'
import { validateTrainingSession } from '@/lib/training/auth-guard'
import { getTrainerClientRoster, getAdherenceAlerts } from '@/lib/training/trainer-service'

export async function GET(req: NextRequest) {
  try {
    const auth = validateTrainingSession(req)
    if (!auth.ok) return auth.response!

    const user = auth.user!
    const roleSlug = user.role?.slug.toUpperCase()
    if (roleSlug !== 'TRAINER' && roleSlug !== 'HEAD_TRAINER' && roleSlug !== 'OWNER') {
      return NextResponse.json({ error: 'Trainer role required.' }, { status: 403 })
    }

    const roster = getTrainerClientRoster(user.id)
    const alerts = getAdherenceAlerts(user.id)

    return NextResponse.json({
      clients: roster,
      adherenceAlerts: alerts,
      count: roster.length,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch trainer clients' }, { status: 500 })
  }
}
