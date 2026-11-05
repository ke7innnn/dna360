import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/server-auth'
import { withRollingSchedule } from '@/lib/classes'
import { toLocalDateStr, localDateOffset, parseLocalDate, sessionStartDate } from '@/lib/dates'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const startDate = url.searchParams.get('startDate') || toLocalDateStr()
    const endDate = url.searchParams.get('endDate') || localDateOffset(14)
    const memberId = url.searchParams.get('memberId')

    // 1. Fetch sessions from Supabase
    let sessions = await prisma.classSession.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        bookings: {
          where: {
            status: { in: ['confirmed', 'waitlisted', 'attended', 'no_show'] },
          },
        },
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' },
      ],
    })

    // If database has no sessions in this range, seed rolling schedule
    if (sessions.length === 0) {
      const generated = withRollingSchedule([])
      for (const s of generated) {
        await prisma.classSession.upsert({
          where: { id: s.id },
          create: {
            id: s.id,
            title: s.title,
            category: s.category,
            instructorId: s.instructorId,
            instructorName: s.instructorName,
            studioId: s.studioId,
            studioName: s.studioName,
            date: s.date,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            durationMinutes: s.durationMinutes,
            capacity: s.capacity ?? 20,
            bookedCount: 0,
            waitlistCount: 0,
            maxWaitlist: s.maxWaitlist || 5,
            intensity: s.intensity || 'High',
            description: s.description || null,
            status: 'scheduled',
            pilatesDayGroup: s.pilatesDayGroup || null,
            recurringScheduleId: s.recurringScheduleId || null,
          },
          update: {},
        })
      }

      sessions = await prisma.classSession.findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          bookings: {
            where: {
              status: { in: ['confirmed', 'waitlisted'] },
            },
          },
        },
        orderBy: [
          { date: 'asc' },
          { startTime: 'asc' },
        ],
      })
    }

    // Format for client
    const formatted = sessions.map(s => {
      const userBooking = memberId
        ? s.bookings.find(b => b.memberId === memberId)
        : null

      return {
        id: s.id,
        title: s.title,
        category: s.category,
        instructorId: s.instructorId,
        instructorName: s.instructorName,
        studioId: s.studioId,
        studioName: s.studioName,
        date: s.date,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        durationMinutes: s.durationMinutes,
        capacity: s.capacity,
        bookedCount: s.bookedCount,
        waitlistCount: s.waitlistCount,
        maxWaitlist: s.maxWaitlist,
        intensity: s.intensity,
        description: s.description,
        status: s.status,
        pilatesDayGroup: s.pilatesDayGroup,
        userBookingStatus: userBooking ? userBooking.status : null,
        userWaitlistPosition: userBooking ? userBooking.waitlistPosition : null,
        bookings: s.bookings.map(b => ({
          id: b.id,
          sessionId: b.sessionId,
          memberId: b.memberId,
          memberName: b.memberName,
          memberPhone: b.memberPhone,
          memberCode: b.memberCode,
          status: b.status,
          waitlistPosition: b.waitlistPosition,
          bookedAt: b.bookedAt ? b.bookedAt.toISOString() : new Date().toISOString(),
        })),
      }
    })

    return NextResponse.json({ sessions: formatted })
  } catch (err: any) {
    console.error('Error fetching class sessions:', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const { session: authSession } = await getServerSession(req)
    if (!authSession?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    if (body.action === 'CREATE_SESSION') {
      const s = body.session
      if (!s || !s.title || !s.date || !s.startTime) {
        return NextResponse.json({ error: 'Invalid session payload' }, { status: 400 })
      }
      const sessionId = s.id || `cls_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      const created = await prisma.classSession.upsert({
        where: { id: sessionId },
        create: {
          id: sessionId,
          title: s.title,
          category: s.category || 'crossfit',
          instructorId: s.instructorId || 'usr_trainer_01',
          instructorName: s.instructorName || 'Rajesh Poojary',
          studioId: s.studioId || 'studio_pow_a',
          studioName: s.studioName || 'Main Studio',
          date: s.date,
          dayOfWeek: typeof s.dayOfWeek === 'number' ? s.dayOfWeek : new Date(s.date).getDay(),
          startTime: s.startTime,
          endTime: s.endTime || '08:00',
          durationMinutes: Number(s.durationMinutes) || 60,
          capacity: Number(s.capacity) || 20,
          bookedCount: 0,
          waitlistCount: 0,
          maxWaitlist: Number(s.maxWaitlist) || 5,
          intensity: s.intensity || 'High',
          description: s.description || null,
          status: 'scheduled',
          pilatesDayGroup: s.pilatesDayGroup || null,
          recurringScheduleId: s.recurringScheduleId || null,
        },
        update: {
          title: s.title,
          category: s.category || 'crossfit',
          instructorId: s.instructorId || 'usr_trainer_01',
          instructorName: s.instructorName || 'Rajesh Poojary',
          studioId: s.studioId || 'studio_pow_a',
          studioName: s.studioName || 'Main Studio',
          date: s.date,
          startTime: s.startTime,
          endTime: s.endTime || '08:00',
          durationMinutes: Number(s.durationMinutes) || 60,
          capacity: Number(s.capacity) || 20,
          intensity: s.intensity || 'High',
          description: s.description || null,
        },
      })
      return NextResponse.json({ success: true, session: created })
    }

    const { sessionId, memberId, isAdminOverride, useAdjustmentCredit } = body

    if (!sessionId || !memberId) {
      return NextResponse.json(
        { error: 'sessionId and memberId are required' },
        { status: 400 }
      )
    }

    // 1. Validate Member (auto-upsert from body fallback if seeded member not yet in DB)
    let member = await prisma.member.findUnique({
      where: { id: memberId },
    })

    if (!member && body.memberName) {
      const nameParts = String(body.memberName).trim().split(' ')
      member = await prisma.member.upsert({
        where: { id: memberId },
        create: {
          id: memberId,
          memberCode: body.memberCode || `DNA-POW-${memberId.replace(/\D/g, '').padStart(4, '0')}`,
          name: body.memberName,
          firstName: nameParts[0] || body.memberName,
          lastName: nameParts.slice(1).join(' ') || '',
          phone: body.memberPhone || '+91 98200 00000',
          email: body.memberEmail || `${memberId}@dna360.in`,
          joinedDate: toLocalDateStr(),
          status: 'active',
        },
        update: {},
      })
    }

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    if (member.status === 'blacklisted' || member.status === 'inactive') {
      return NextResponse.json(
        { error: `Account is ${member.status}. Bookings are disabled.` },
        { status: 403 }
      )
    }

    // 2. Fetch session
    const session = await prisma.classSession.findUnique({
      where: { id: sessionId },
      include: {
        bookings: {
          where: {
            memberId,
            status: { in: ['confirmed', 'waitlisted'] },
          },
        },
      },
    })

    if (!session) {
      return NextResponse.json({ error: 'Class session not found' }, { status: 404 })
    }

    if (session.status === 'cancelled') {
      return NextResponse.json({ error: 'This class has been cancelled.' }, { status: 400 })
    }

    // Check if session is in past (unless admin override)
    const start = sessionStartDate(session.date, session.startTime)
    if (!isAdminOverride && start.getTime() <= Date.now()) {
      return NextResponse.json({ error: 'This class has already started or concluded.' }, { status: 400 })
    }

    // Check if member already booked
    if (session.bookings.length > 0) {
      return NextResponse.json(
        { error: 'You are already registered for this session.' },
        { status: 400 }
      )
    }

    // Check 1-day advance booking window (unless admin override)
    const maxDate = localDateOffset(1) // today + 1 day
    if (!isAdminOverride && session.date > maxDate) {
      return NextResponse.json(
        { error: 'Bookings open 1 day in advance at 00:00.' },
        { status: 400 }
      )
    }

    // 3. Atomically book spot or waitlist
    const bookingResult = await prisma.$transaction(async tx => {
      // Re-fetch session for isolation
      const currentSession = await tx.classSession.findUnique({
        where: { id: sessionId },
      })
      if (!currentSession) throw new Error('Session not found')

      const bookingId = body.bookingId || `bkg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

      if (useAdjustmentCredit && member.adjustmentCreditsRemaining > 0) {
        await tx.member.update({
          where: { id: member.id },
          data: {
            adjustmentCreditsRemaining: { decrement: 1 },
          },
        })
      }

      if (currentSession.bookedCount < currentSession.capacity) {
        // Direct confirmed booking
        const newBooking = await tx.classBooking.create({
          data: {
            id: bookingId,
            sessionId: currentSession.id,
            memberId: member.id,
            memberName: member.name,
            memberPhone: member.phone,
            memberCode: member.memberCode,
            status: 'confirmed',
          },
        })

        const updatedCount = currentSession.bookedCount + 1
        await tx.classSession.update({
          where: { id: currentSession.id },
          data: {
            bookedCount: updatedCount,
            status: updatedCount >= currentSession.capacity ? 'full' : currentSession.status,
          },
        })

        return {
          status: 'confirmed' as const,
          booking: newBooking,
          message: 'Booking confirmed!',
        }
      } else if (currentSession.waitlistCount < currentSession.maxWaitlist) {
        // Waitlist booking
        const position = currentSession.waitlistCount + 1
        const newBooking = await tx.classBooking.create({
          data: {
            id: bookingId,
            sessionId: currentSession.id,
            memberId: member.id,
            memberName: member.name,
            memberPhone: member.phone,
            memberCode: member.memberCode,
            status: 'waitlisted',
            waitlistPosition: position,
          },
        })

        await tx.classSession.update({
          where: { id: currentSession.id },
          data: {
            waitlistCount: position,
          },
        })

        return {
          status: 'waitlisted' as const,
          booking: newBooking,
          message: `Class is full. You are on the waitlist (Position #${position}).`,
        }
      } else {
        throw new Error('Class and waitlist are completely full.')
      }
    })

    return NextResponse.json({
      success: true,
      ...bookingResult,
    })
  } catch (err: any) {
    console.error('Error booking class session:', err)
    return NextResponse.json(
      { error: err.message || 'Booking failed' },
      { status: 400 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { session } = await getServerSession(req)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { action, sessionId, bookingId, memberId, status } = body

    if (action === 'MARK_ATTENDANCE') {
      if (!sessionId || !status) {
        return NextResponse.json({ error: 'sessionId and status are required' }, { status: 400 })
      }

      const booking = bookingId
        ? await prisma.classBooking.findUnique({ where: { id: bookingId } })
        : memberId
          ? await prisma.classBooking.findFirst({ where: { sessionId, memberId } })
          : null

      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      }

      const updated = await prisma.classBooking.update({
        where: { id: booking.id },
        data: { status },
      })

      if (status === 'attended' && booking.memberId) {
        await prisma.member.update({
          where: { id: booking.memberId },
          data: {
            attendanceStreak: { increment: 1 },
            totalCheckIns: { increment: 1 },
            lastVisitAt: new Date(),
          },
        }).catch(() => {})
      }

      return NextResponse.json({ success: true, booking: updated })
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
  } catch (err: any) {
    console.error('Error updating class session/booking:', err)
    return NextResponse.json({ error: err.message || 'Update failed' }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { session: authSession } = await getServerSession(req)
    if (!authSession?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { sessionId, memberId, bookingId, isAdminOverride } = body

    if (!sessionId || (!memberId && !bookingId)) {
      return NextResponse.json(
        { error: 'sessionId and (memberId or bookingId) are required' },
        { status: 400 }
      )
    }

    const cancelResult = await prisma.$transaction(async tx => {
      const session = await tx.classSession.findUnique({
        where: { id: sessionId },
      })
      if (!session) throw new Error('Session not found')

      // Cutoff check: 4 hours before class (unless admin override)
      if (!isAdminOverride) {
        const start = sessionStartDate(session.date, session.startTime)
        const hoursUntil = (start.getTime() - Date.now()) / (1000 * 60 * 60)
        if (hoursUntil < 4 && hoursUntil > 0) {
          throw new Error('Cancellations are locked within 4 hours of class start time.')
        }
      }

      // Find active booking
      const booking = bookingId
        ? await tx.classBooking.findUnique({ where: { id: bookingId } })
        : await tx.classBooking.findFirst({
            where: {
              sessionId,
              memberId,
              status: { in: ['confirmed', 'waitlisted'] },
            },
          })

      if (!booking || booking.status === 'cancelled') {
        throw new Error('No active booking found for this session.')
      }

      const wasConfirmed = booking.status === 'confirmed'

      // Mark cancelled
      await tx.classBooking.update({
        where: { id: booking.id },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
        },
      })

      if (wasConfirmed) {
        // Promote next waitlisted member if any
        const nextInWaitlist = await tx.classBooking.findFirst({
          where: {
            sessionId,
            status: 'waitlisted',
          },
          orderBy: [
            { waitlistPosition: 'asc' },
            { bookedAt: 'asc' },
          ],
        })

        if (nextInWaitlist) {
          // Promote waitlisted member to confirmed
          await tx.classBooking.update({
            where: { id: nextInWaitlist.id },
            data: {
              status: 'confirmed',
              waitlistPosition: null,
            },
          })

          const newWaitlistCount = Math.max(0, session.waitlistCount - 1)
          await tx.classSession.update({
            where: { id: session.id },
            data: {
              waitlistCount: newWaitlistCount,
            },
          })

          // Re-index remaining waitlisted bookings
          const remainingWaitlist = await tx.classBooking.findMany({
            where: {
              sessionId,
              status: 'waitlisted',
            },
            orderBy: { waitlistPosition: 'asc' },
          })

          for (let i = 0; i < remainingWaitlist.length; i++) {
            await tx.classBooking.update({
              where: { id: remainingWaitlist[i].id },
              data: { waitlistPosition: i + 1 },
            })
          }

          return { message: 'Booking cancelled. Spot promoted to next waitlisted member.' }
        } else {
          // Free spot
          const newBookedCount = Math.max(0, session.bookedCount - 1)
          await tx.classSession.update({
            where: { id: session.id },
            data: {
              bookedCount: newBookedCount,
              status: 'scheduled',
            },
          })

          return { message: 'Booking cancelled. Spot freed.' }
        }
      } else {
        // Was waitlisted
        const newWaitlistCount = Math.max(0, session.waitlistCount - 1)
        await tx.classSession.update({
          where: { id: session.id },
          data: {
            waitlistCount: newWaitlistCount,
          },
        })

        // Re-index remaining waitlisted bookings
        const remainingWaitlist = await tx.classBooking.findMany({
          where: {
            sessionId,
            status: 'waitlisted',
          },
          orderBy: { waitlistPosition: 'asc' },
        })

        for (let i = 0; i < remainingWaitlist.length; i++) {
          await tx.classBooking.update({
            where: { id: remainingWaitlist[i].id },
            data: { waitlistPosition: i + 1 },
          })
        }

        return { message: 'Waitlist entry cancelled.' }
      }
    })

    return NextResponse.json({
      success: true,
      ...cancelResult,
    })
  } catch (err: any) {
    console.error('Error cancelling class booking:', err)
    return NextResponse.json(
      { error: err.message || 'Cancellation failed' },
      { status: 400 }
    )
  }
}
