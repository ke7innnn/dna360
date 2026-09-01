import { NextRequest, NextResponse } from 'next/server'
import { validateTrainingSession } from '@/lib/training/auth-guard'
import { getManagerPTLeadSignals } from '@/lib/training/trainer-service'

export async function GET(req: NextRequest) {
  try {
    const auth = validateTrainingSession(req)
    if (!auth.ok) return auth.response!

    const user = auth.user!
    const roleSlug = user.role?.slug.toUpperCase()

    // §7: Opt-in aggregate list generated strictly for managers/owners
    const isManager = roleSlug === 'OWNER' || roleSlug === 'HR_HEAD' || roleSlug === 'SALES_HEAD' || roleSlug === 'HEAD_TRAINER'
    if (!isManager) {
      return NextResponse.json(
        { error: 'Forbidden: PT lead signals are aggregate and restricted to managers (§7).' },
        { status: 403 }
      )
    }

    const leads = getManagerPTLeadSignals()
    return NextResponse.json({
      leads,
      count: leads.length,
      explanation: 'Aggregate plateau signals: self-coached members with >= 6 weeks activity and a stalled core lift.',
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch lead signals' }, { status: 500 })
  }
}
