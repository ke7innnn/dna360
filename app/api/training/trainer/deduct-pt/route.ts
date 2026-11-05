import { NextRequest, NextResponse } from 'next/server'
import { validateTrainingSession } from '@/lib/training/auth-guard'
import { signOffPTSession } from '@/lib/training/trainer-service'
import { prisma } from '@/lib/prisma'
import { toLocalDateStr } from '@/lib/dates'

export async function POST(req: NextRequest) {
  try {
    const auth = await validateTrainingSession(req)
    if (!auth.ok) return auth.response!

    const user = auth.user!
    const roleSlug = (user.role?.slug || '').toUpperCase()
    if (roleSlug !== 'TRAINER' && roleSlug !== 'HEAD_TRAINER' && roleSlug !== 'OWNER' && roleSlug !== 'OWNER_ADMIN') {
      return NextResponse.json({ error: 'Trainer role required to sign off PT sessions.' }, { status: 403 })
    }

    const body = await req.json()
    if (!body.memberId) {
      return NextResponse.json({ error: 'memberId is required' }, { status: 400 })
    }

    // 1. Authoritative Supabase transaction if member exists in DB
    try {
      const dbMember = await prisma.member.findUnique({
        where: { id: body.memberId },
        include: { memberships: { where: { status: 'active' } } },
      })

      if (dbMember) {
        const ptMs = dbMember.memberships.find(
          (m) =>
            m.category === 'personal_training' ||
            (m.sessionsTotal !== null && m.sessionsTotal !== undefined && m.category !== 'reformer_pilates') ||
            /\bpt\b|personal/i.test(m.productName || '')
        )

        const currentRemaining = ptMs?.sessionsRemaining ?? 0
        if (currentRemaining <= 0) {
          return NextResponse.json(
            { error: 'No remaining PT sessions in member balance', remainingSessions: 0 },
            { status: 400 }
          )
        }

        const newRemaining = Math.max(0, currentRemaining - 1)
        const newConsumed = (ptMs?.sessionsConsumed ?? 0) + 1
        const logId = `pt_log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`

        await prisma.$transaction(async (tx) => {
          if (ptMs) {
            await tx.membership.update({
              where: { id: ptMs.id },
              data: {
                sessionsRemaining: newRemaining,
                sessionsConsumed: newConsumed,
              },
            })
          }

          await tx.pTSessionLog.create({
            data: {
              id: logId,
              memberId: dbMember.id,
              memberName: dbMember.name,
              trainerId: user.id,
              trainerName: user.name,
              date: toLocalDateStr(),
              durationMinutes: 60,
              workoutFocus: body.note || '1-on-1 PT Session Delivered',
              rating: 5,
              status: 'completed',
              ptTier: 'premium',
            },
          })

          await tx.member.update({
            where: { id: dbMember.id },
            data: {
              attendanceStreak: (dbMember.attendanceStreak || 0) + 1,
              totalCheckIns: (dbMember.totalCheckIns || 0) + 1,
              lastVisitAt: new Date(),
            },
          })
        })

        // Also update in-memory fallback
        signOffPTSession(user, body.memberId, body.sessionId, body.note)

        return NextResponse.json({
          success: true,
          remainingSessions: newRemaining,
          ptSessionId: logId,
        })
      }
    } catch (dbErr) {
      console.warn('Supabase deduct-pt fallback:', dbErr)
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
