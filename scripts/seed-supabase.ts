import { prisma } from '../lib/prisma'
import { SEEDED_MEMBERS } from '../lib/members'
import { withRollingSchedule } from '../lib/classes'
import { toLocalDateStr, localDateOffset } from '../lib/dates'

async function seed() {
  console.log('--- Starting DNA 360 Supabase Seeding ---')

  const memberCount = await prisma.member.count()
  console.log(`Current member count in Supabase: ${memberCount}`)

  if (memberCount === 0) {
    console.log(`Seeding ${SEEDED_MEMBERS.length} verified members into Supabase...`)
    let insertedMembers = 0
    let insertedMemberships = 0

    // Seed in batches of 50 for efficiency
    const batchSize = 50
    for (let i = 0; i < SEEDED_MEMBERS.length; i += batchSize) {
      const batch = SEEDED_MEMBERS.slice(i, i + batchSize)
      for (const m of batch) {
        await prisma.member.upsert({
          where: { id: m.id },
          create: {
            id: m.id,
            memberCode: m.member_code,
            firstName: m.first_name,
            lastName: m.last_name,
            name: m.name,
            email: m.email,
            phone: m.phone,
            gender: m.gender,
            dob: m.dob,
            avatarUrl: (m as any).avatar || null,
            joinedDate: m.joined_date,
            status: m.status,
            attendanceStreak: m.attendance_streak || 0,
            totalCheckIns: m.total_check_ins || 0,
            lastVisitAt: m.last_visit_at ? new Date(m.last_visit_at) : null,
            blacklisted: m.blacklisted || false,
            blacklistReason: m.blacklist_reason || null,
            complimentary: m.complimentary || false,
            specialInclusions: m.special_inclusions ? JSON.stringify(m.special_inclusions) : null,
            referredBy: m.referred_by || null,
            referralCode: m.referral_code || null,
            lifetimeValue: BigInt(m.lifetime_value || 0),
            mediaConsent: m.media_consent ?? true,
            adjustmentCreditsRemaining: m.adjustment_credits_remaining || 0,
            assignedTrainerId: m.assigned_trainer_id || null,
            assignedTrainerName: m.assigned_trainer_name || null,
          },
          update: {
            status: m.status,
            phone: m.phone,
            email: m.email,
          },
        })
        insertedMembers++

        // Seed concurrent memberships
        const memberMemberships = [...(m.active_memberships || []), ...(m.past_memberships || [])]
        if (memberMemberships.length > 0) {
          for (const mem of memberMemberships) {
            await prisma.membership.upsert({
              where: { id: mem.id },
              create: {
                id: mem.id,
                memberId: m.id,
                productId: mem.product_id,
                productName: mem.product_name,
                category: mem.product_category || 'gym_membership',
                enrolmentDate: mem.enrolment_date,
                activationDate: mem.activation_date || null,
                expiryDate: mem.expiry_date || null,
                amountPaid: BigInt(mem.amount_paid || 0),
                discountAmount: BigInt(mem.discount_amount || 0),
                taxRate: mem.tax_rate ?? 0.05,
                status: mem.status,
                invoiceId: mem.invoice_id || null,
                invoiceNumber: mem.invoice_number || null,
                sessionsTotal: mem.sessions_total || null,
                sessionsConsumed: mem.sessions_consumed || 0,
                sessionsRemaining: mem.sessions_remaining || null,
              },
              update: {
                status: mem.status,
                sessionsConsumed: mem.sessions_consumed || 0,
                sessionsRemaining: mem.sessions_remaining || null,
              },
            })
            insertedMemberships++
          }
        }
      }
      console.log(`Processed ${Math.min(i + batchSize, SEEDED_MEMBERS.length)} / ${SEEDED_MEMBERS.length} members`)
    }

    console.log(`Successfully seeded ${insertedMembers} members and ${insertedMemberships} memberships into Supabase!`)
  } else {
    console.log(`Supabase already has ${memberCount} members. Ensuring memberships are synced...`)
    let insertedMemberships = 0
    for (const m of SEEDED_MEMBERS) {
      const memberMemberships = [...(m.active_memberships || []), ...(m.past_memberships || [])]
      for (const mem of memberMemberships) {
        await prisma.membership.upsert({
          where: { id: mem.id },
          create: {
            id: mem.id,
            memberId: m.id,
            productId: mem.product_id,
            productName: mem.product_name,
            category: mem.product_category || 'gym_membership',
            enrolmentDate: mem.enrolment_date,
            activationDate: mem.activation_date || null,
            expiryDate: mem.expiry_date || null,
            amountPaid: BigInt(mem.amount_paid || 0),
            discountAmount: BigInt(mem.discount_amount || 0),
            taxRate: mem.tax_rate ?? 0.05,
            status: mem.status,
            invoiceId: mem.invoice_id || null,
            invoiceNumber: mem.invoice_number || null,
            sessionsTotal: mem.sessions_total || null,
            sessionsConsumed: mem.sessions_consumed || 0,
            sessionsRemaining: mem.sessions_remaining || null,
          },
          update: {
            status: mem.status,
            sessionsConsumed: mem.sessions_consumed || 0,
            sessionsRemaining: mem.sessions_remaining || null,
          },
        })
        insertedMemberships++
      }
    }
    console.log(`Synced ${insertedMemberships} memberships.`)
  }

  // Seed Class Sessions for the next 14 days if not present
  const today = toLocalDateStr(new Date())
  const twoWeeksLater = localDateOffset(14)
  const classCount = await prisma.classSession.count()
  console.log(`Current class sessions count in Supabase: ${classCount}`)

  if (classCount === 0) {
    console.log(`Generating rolling 14-day timetable (${today} to ${twoWeeksLater})...`)
    const rollingSchedule = withRollingSchedule([])
    console.log(`Generated ${rollingSchedule.length} sessions. Inserting with 0 bookings...`)

    let insertedSessions = 0
    for (const s of rollingSchedule) {
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
      insertedSessions++
    }
    console.log(`Successfully seeded ${insertedSessions} class sessions into Supabase!`)
  } else {
    console.log(`Class sessions already exist (${classCount} sessions).`)
  }

  const finalMemberCount = await prisma.member.count()
  const finalClassCount = await prisma.classSession.count()
  const finalBookingCount = await prisma.classBooking.count()
  const finalPtCount = await prisma.pTSessionLog.count()

  console.log('--- Seeding Complete ---')
  console.log({
    finalMemberCount,
    finalClassCount,
    finalBookingCount,
    finalPtCount,
  })

  await prisma.$disconnect()
}

seed().catch(err => {
  console.error('Seed error:', err)
  process.exit(1)
})
