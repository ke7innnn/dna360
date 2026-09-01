import { NextRequest, NextResponse } from 'next/server'
import { validateTrainingSession } from '@/lib/training/auth-guard'
import { signOffPTSession } from '@/lib/training/trainer-service'

export async function POST(req: NextRequest) {
  try {
    const auth = validateTrainingSession(req)
    if (!auth.ok) return auth.response!

    const user = auth.user!
    const roleSlug = user.role?.slug.toUpperCase()
    if (roleSlug !== 'TRAINER' && roleSlug !== 'HEAD_TRAINER' && roleSlug !== 'OWNER') {
      return NextResponse.json({ error: 'Trainer role required to sign off PT sessions.' }, { status: 403 })
    }

    const body = await req.json()
    if (!body.memberId) {
      return NextResponse.json({ error: 'memberId is required' }, { status: 400 })
    }

    const result = signOffPTSession(user, body.memberId, body.sessionId, body.note)
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to sign off PT session' }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to sign off PT session' }, { status: 500 })
  }
}
