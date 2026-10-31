import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { toLocalDateStr } from '@/lib/dates'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const memberId = url.searchParams.get('memberId')
    const trainerId = url.searchParams.get('trainerId')

    if (!memberId && !trainerId) {
      return NextResponse.json(
        { error: 'memberId or trainerId is required' },
        { status: 400 }
      )
    }

    const where: any = {}
    if (memberId) where.memberId = memberId
    if (trainerId) where.trainerId = trainerId

    const logs = await prisma.pTSessionLog.findMany({
      where,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    })

    // Also fetch PT membership balance if memberId is given
    let ptBalance: {
      total: number
      consumed: number
      remaining: number
      productName: string | null
      expiryDate: string | null
    } = {
      total: 0,
      consumed: 0,
      remaining: 0,
      productName: null,
      expiryDate: null,
    }

    if (memberId) {
      const ptMembership = await prisma.membership.findFirst({
        where: {
          memberId,
          category: { in: ['personal_training', 'pt'] },
          status: 'active',
        },
        orderBy: { expiryDate: 'desc' },
      })

      if (ptMembership) {
        ptBalance = {
          total: ptMembership.sessionsTotal || 0,
          consumed: ptMembership.sessionsConsumed || 0,
          remaining: ptMembership.sessionsRemaining || 0,
          productName: ptMembership.productName,
          expiryDate: ptMembership.expiryDate,
        }
      }
    }

    return NextResponse.json({
      logs: logs.map(l => ({
        id: l.id,
        memberId: l.memberId,
        memberName: l.memberName,
        trainerId: l.trainerId,
        trainerName: l.trainerName,
        date: l.date,
        durationMinutes: l.durationMinutes,
        workoutFocus: l.workoutFocus,
        rating: l.rating,
        clientFeedback: l.clientFeedback,
        status: l.status,
        createdAt: l.createdAt.toISOString(),
      })),
      ptBalance,
    })
  } catch (err: any) {
    console.error('Error fetching PT ledger:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to fetch PT ledger' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      memberId,
      trainerId,
      trainerName,
      workoutFocus,
      durationMinutes = 60,
      clientFeedback = '',
      rating = 5,
      date = toLocalDateStr(),
    } = body

    if (!memberId || !trainerId || !workoutFocus) {
      return NextResponse.json(
        { error: 'memberId, trainerId, and workoutFocus are required' },
        { status: 400 }
      )
    }

    // 1. Validate member
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: {
        memberships: {
          where: {
            category: { in: ['personal_training', 'pt'] },
            status: 'active',
          },
          orderBy: { expiryDate: 'desc' },
        },
      },
    })

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    const ptMembership = member.memberships[0]
    if (!ptMembership || (ptMembership.sessionsRemaining ?? 0) <= 0) {
      return NextResponse.json(
        { error: 'No active Personal Training sessions remaining on member account.' },
        { status: 400 }
      )
    }

    // 2. Perform sign-off atomically in transaction
    const result = await prisma.$transaction(async tx => {
      const logId = `pt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

      const log = await tx.pTSessionLog.create({
        data: {
          id: logId,
          memberId: member.id,
          memberName: member.name,
          trainerId,
          trainerName: trainerName || 'Trainer',
          date,
          durationMinutes: Number(durationMinutes) || 60,
          workoutFocus,
          rating: Number(rating) || 5,
          clientFeedback: clientFeedback || null,
          status: 'completed',
        },
      })

      const newConsumed = (ptMembership.sessionsConsumed || 0) + 1
      const newRemaining = Math.max(0, (ptMembership.sessionsRemaining || 0) - 1)

      const updatedMembership = await tx.membership.update({
        where: { id: ptMembership.id },
        data: {
          sessionsConsumed: newConsumed,
          sessionsRemaining: newRemaining,
          status: newRemaining === 0 ? 'expired' : 'active',
        },
      })

      return {
        log,
        remaining: newRemaining,
        consumed: newConsumed,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'PT session successfully recorded and balance updated.',
      ...result,
    })
  } catch (err: any) {
    console.error('Error signing off PT session:', err)
    return NextResponse.json(
      { error: err.message || 'PT sign-off failed' },
      { status: 400 }
    )
  }
}
