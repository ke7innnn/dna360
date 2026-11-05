/* ============================================================
   DNA 360 — Classes & Studio Timetables
   
   Real timetables seeded from DNA 360 schedule:
   - Reformer Pilates Studio: Group A (MWF) & Group B (TThSat), 07:00-21:00
     Trial slots (TThSat 12:00-14:00), Happy Hours (14:00-16:00)
   - Group Activities: Mat Pilates, Yoga, Dance, MMA, Spinning
   - Single Powai Location Studios
   - Booking engine with advance window (1 day), 4-hour cancellation cutoff,
     waitlist promotion, and adjustment credit tracking
   ============================================================ */

import type {
  ClassSession,
  ClassBooking,
  StudioRoom,
  ClassCategory,
  ScheduleFilterOptions,
  BookingStatus,
  PilatesDayGroup,
} from '@/types/class'
import { PILATES_DAY_GROUPS, DEFAULT_BOOKING_RULES } from '@/types/class'
import { getStoredMembers, updateMember } from '@/lib/members'
import { getPendingConfig } from '@/lib/settings'
import { logAuditEvent } from '@/lib/audit'
import { toLocalDateStr, localDateOffset, parseLocalDate, sessionStartDate } from '@/lib/dates'

// v2: legacy key held dummy occupancy/bookings and a single frozen week.
const SESSIONS_STORAGE_KEY = 'dna360_class_sessions_v2'
const LEGACY_SESSIONS_STORAGE_KEY = 'dna360_class_sessions'
const STUDIOS_STORAGE_KEY = 'dna360_studios'
/** How many days ahead the rolling timetable is materialised. */
const SCHEDULE_HORIZON_DAYS = 14

// ─── Single Location Studios ───

export const SEEDED_STUDIOS: StudioRoom[] = [
  {
    id: 'studio_reformer',
    name: 'Reformer Pilates Studio',
    capacity: 10, // Default bed count (PENDING exact confirmation)
    features: ['Allegro 2 Reformers', 'Jumpboards', 'Pilates Arcs', 'Infrared Studio Heating'],
    type: 'reformer_studio',
  },
  {
    id: 'studio_group',
    name: 'Main Group Activity Studio',
    capacity: 25,
    features: ['Sprung Hardwood Floor', 'Yoga Mats & Bolsters', 'MMA Heavy Bags & Mats', 'Acoustic Sound System'],
    type: 'group_studio',
  },
  {
    id: 'studio_spin',
    name: 'RPM & Spinning Theatre',
    capacity: 20,
    features: ['Stages SC3 Magnetic Bikes', 'Zone Heart Rate Video Wall', 'Club Audio & Lighting'],
    type: 'cycling_studio',
  },
  {
    id: 'studio_fitzone',
    name: 'Fitzone & Functional Turf',
    capacity: 20,
    features: ['Sled Tracks', 'Kettlebell Racks', 'Plyo Boxes', 'Concept2 Rowers & SkiErgs'],
    type: 'gym_floor',
  },
]

// ─── Date Generation Helpers (Monday to Sunday of Current Week) ───

function getDayDate(dayOffset: number): string {
  const now = new Date()
  const currentDay = now.getDay() // 0 = Sun, 1 = Mon
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay
  return localDateOffset(mondayOffset + dayOffset, now)
}

// ─── Seeded Timetable (Real DNA 360 Schedule) ───

export const SEEDED_SESSIONS: ClassSession[] = [
  // ─── Reformer Pilates Studio (MWF: Group A) ───
  {
    id: 'cls_ref_0700_mwf',
    title: 'Reformer Pilates: Core & Alignment (Group A)',
    category: 'reformer_pilates',
    instructorId: 'usr_tr_03',
    instructorName: 'Hemant Shirke',
    studioId: 'studio_reformer',
    studioName: 'Reformer Pilates Studio',
    date: getDayDate(0), // Monday
    dayOfWeek: 1,
    startTime: '07:00',
    endTime: '08:00',
    durationMinutes: 60,
    capacity: 10,
    bookedCount: 0,
    waitlistCount: 0,
    maxWaitlist: 5,
    intensity: 'High',
    description: 'Dynamic reformer flow targeting lumbo-pelvic stability and spinal articulation.',
    status: 'scheduled',
    pilatesDayGroup: 'A',
    bookings: [],
  },
  {
    id: 'cls_ref_0900_mwf',
    title: 'Reformer Pilates: Sculpt & Stretch (Group A)',
    category: 'reformer_pilates',
    instructorId: 'usr_tr_03',
    instructorName: 'Hemant Shirke',
    studioId: 'studio_reformer',
    studioName: 'Reformer Pilates Studio',
    date: getDayDate(0), // Monday
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '10:00',
    durationMinutes: 60,
    capacity: 10,
    bookedCount: 0,
    waitlistCount: 0,
    maxWaitlist: 5,
    intensity: 'Medium',
    description: 'Reformer resistance training focusing on posture, eccentric hamstring control, and core strength.',
    status: 'scheduled',
    pilatesDayGroup: 'A',
    bookings: [],
  },
  {
    id: 'cls_ref_hh_1400_mwf',
    title: 'Reformer Pilates Happy Hours (14:00–16:00)',
    category: 'reformer_pilates',
    instructorId: 'usr_tr_03',
    instructorName: 'Hemant Shirke',
    studioId: 'studio_reformer',
    studioName: 'Reformer Pilates Studio',
    date: getDayDate(0), // Monday
    dayOfWeek: 1,
    startTime: '14:00',
    endTime: '15:00',
    durationMinutes: 60,
    capacity: 10,
    bookedCount: 0,
    waitlistCount: 0,
    maxWaitlist: 5,
    intensity: 'Medium',
    description: 'Happy Hours Reformer slot for afternoon packages.',
    status: 'scheduled',
    accessWindow: { start: '14:00', end: '16:00', label: 'Pilates Happy Hours' },
    pilatesDayGroup: 'A',
    bookings: [],
  },
  {
    id: 'cls_ref_1800_mwf',
    title: 'Reformer Pilates: Athletic Conditioning (Group A)',
    category: 'reformer_pilates',
    instructorId: 'usr_tr_03',
    instructorName: 'Hemant Shirke',
    studioId: 'studio_reformer',
    studioName: 'Reformer Pilates Studio',
    date: getDayDate(0), // Monday
    dayOfWeek: 1,
    startTime: '18:00',
    endTime: '19:00',
    durationMinutes: 60,
    capacity: 10,
    bookedCount: 0,
    waitlistCount: 0,
    maxWaitlist: 5,
    intensity: 'High',
    description: 'Jumpboard power drills, long-box planks, and reformer resistance progression.',
    status: 'scheduled',
    pilatesDayGroup: 'A',
    bookings: [],
  },

  // ─── Reformer Pilates Studio (TThSat: Group B) ───
  {
    id: 'cls_ref_0800_tths',
    title: 'Reformer Pilates: Precision & Flow (Group B)',
    category: 'reformer_pilates',
    instructorId: 'usr_tr_03',
    instructorName: 'Hemant Shirke',
    studioId: 'studio_reformer',
    studioName: 'Reformer Pilates Studio',
    date: getDayDate(1), // Tuesday
    dayOfWeek: 2,
    startTime: '08:00',
    endTime: '09:00',
    durationMinutes: 60,
    capacity: 10,
    bookedCount: 0,
    waitlistCount: 0,
    maxWaitlist: 5,
    intensity: 'Medium',
    description: 'Precision alignment, scapular mechanics, and core integration.',
    status: 'scheduled',
    pilatesDayGroup: 'B',
    bookings: [],
  },
  {
    id: 'cls_ref_trial_1200_tths',
    title: 'Reformer Pilates Trial Session',
    category: 'reformer_pilates',
    instructorId: 'usr_tr_03',
    instructorName: 'Hemant Shirke',
    studioId: 'studio_reformer',
    studioName: 'Reformer Pilates Studio',
    date: getDayDate(1), // Tuesday
    dayOfWeek: 2,
    startTime: '12:00',
    endTime: '13:00',
    durationMinutes: 60,
    capacity: 8,
    bookedCount: 0,
    waitlistCount: 0,
    maxWaitlist: 3,
    intensity: 'Low',
    description: 'Introductory trial slot for new prospects (₹799 Trial Pass).',
    status: 'scheduled',
    isTrialSlot: true,
    pilatesDayGroup: 'B',
    bookings: [],
  },

  // ─── Group Activities: Mat Pilates (TThSat 09:30–10:30) ───
  {
    id: 'cls_mat_0930_tue',
    title: 'Mat Pilates: Core Precision',
    category: 'mat_pilates',
    instructorId: 'usr_tr_03',
    instructorName: 'Hemant Shirke',
    studioId: 'studio_group',
    studioName: 'Main Group Activity Studio',
    date: getDayDate(1), // Tuesday
    dayOfWeek: 2,
    startTime: '09:30',
    endTime: '10:30',
    durationMinutes: 60,
    capacity: 25,
    bookedCount: 0,
    waitlistCount: 0,
    maxWaitlist: 5,
    intensity: 'Medium',
    description: 'Classical mat repertoire with magic circles, resistance bands, and foam rollers.',
    status: 'scheduled',
    bookings: [],
  },

  // ─── Group Activities: Yoga (TThSat 18:00–19:00) ───
  {
    id: 'cls_yoga_1800_tue',
    title: 'Ashtanga Vinyasa Yoga',
    category: 'yoga',
    instructorId: 'usr_tr_03',
    instructorName: 'Hemant Shirke',
    studioId: 'studio_group',
    studioName: 'Main Group Activity Studio',
    date: getDayDate(1), // Tuesday
    dayOfWeek: 2,
    startTime: '18:00',
    endTime: '19:00',
    durationMinutes: 60,
    capacity: 25,
    bookedCount: 0,
    waitlistCount: 0,
    maxWaitlist: 5,
    intensity: 'Medium',
    description: 'Dynamic breath-synchronized flow through primary series postures with pranayama cooldown.',
    status: 'scheduled',
    bookings: [],
  },

  // ─── Group Activities: Dance Fitness (MWF 19:00–20:00) ───
  {
    id: 'cls_dance_1900_mon',
    title: 'DNA Dance Fitness & Cardio Beat',
    category: 'dance_fitness',
    instructorId: 'usr_tr_05',
    instructorName: 'Afzal Shah',
    studioId: 'studio_group',
    studioName: 'Main Group Activity Studio',
    date: getDayDate(0), // Monday
    dayOfWeek: 1,
    startTime: '19:00',
    endTime: '20:00',
    durationMinutes: 60,
    capacity: 25,
    bookedCount: 0,
    waitlistCount: 0,
    maxWaitlist: 5,
    intensity: 'High',
    description: 'High-energy choreography set to Afro-Latin and Bollywood beats.',
    status: 'scheduled',
    bookings: [],
  },

  // ─── Group Activities: MMA (TThSat 19:00–20:00) ───
  {
    id: 'cls_mma_1900_tue',
    title: 'MMA & Muay Thai Striking Conditioning',
    category: 'mma',
    instructorId: 'usr_tr_04',
    instructorName: 'Zeebran Shaikh',
    studioId: 'studio_group',
    studioName: 'Main Group Activity Studio',
    date: getDayDate(1), // Tuesday
    dayOfWeek: 2,
    startTime: '19:00',
    endTime: '20:00',
    durationMinutes: 60,
    capacity: 20,
    bookedCount: 0,
    waitlistCount: 0,
    maxWaitlist: 5,
    intensity: 'Extreme',
    description: 'Muay Thai combinations, heavy bag rounds, footwork, and core fight conditioning.',
    status: 'scheduled',
    bookings: [],
  },

  // ─── Group Activities: Spinning (Tu/Th 08:15, 09:30 · MWF 18:00, 20:00 · Sat 10:00, 11:00) ───
  {
    id: 'cls_spin_0815_tue',
    title: 'Power RPM Cycling',
    category: 'spinning',
    instructorId: 'usr_tr_02',
    instructorName: 'Aftab Memon',
    studioId: 'studio_spin',
    studioName: 'RPM & Spinning Theatre',
    date: getDayDate(1), // Tuesday
    dayOfWeek: 2,
    startTime: '08:15',
    endTime: '09:00',
    durationMinutes: 45,
    capacity: 20,
    bookedCount: 0,
    waitlistCount: 0,
    maxWaitlist: 5,
    intensity: 'High',
    description: 'High-cadence intervals, seated climbs, and sprint finishes.',
    status: 'scheduled',
    bookings: [],
  },
  {
    id: 'cls_spin_1800_mon',
    title: 'Sunset RPM Power Hour',
    category: 'spinning',
    instructorId: 'usr_tr_02',
    instructorName: 'Aftab Memon',
    studioId: 'studio_spin',
    studioName: 'RPM & Spinning Theatre',
    date: getDayDate(0), // Monday
    dayOfWeek: 1,
    startTime: '18:00',
    endTime: '18:45',
    durationMinutes: 45,
    capacity: 20,
    bookedCount: 0,
    waitlistCount: 0,
    maxWaitlist: 5,
    intensity: 'High',
    description: 'Evening HIIT cycle theatre experience.',
    status: 'scheduled',
    bookings: [],
  },

  // ─── Fitzone & Functional ───
  {
    id: 'cls_fitzone_0700_mon',
    title: 'Fitzone High-Volume Circuit',
    category: 'fitzone',
    instructorId: 'usr_tr_head_01',
    instructorName: 'Rajesh Poojary',
    studioId: 'studio_fitzone',
    studioName: 'Fitzone & Functional Turf',
    date: getDayDate(0), // Monday
    dayOfWeek: 1,
    startTime: '07:00',
    endTime: '08:00',
    durationMinutes: 60,
    capacity: 20,
    bookedCount: 0,
    waitlistCount: 0,
    maxWaitlist: 5,
    intensity: 'Extreme',
    description: 'Sled pushes, SkiErg intervals, and heavy kettlebell progressions on the turf.',
    status: 'scheduled',
    bookings: [],
  },
]

// ─── Storage Helpers ───

export function getStoredStudios(): StudioRoom[] {
  if (typeof window === 'undefined') return SEEDED_STUDIOS
  const stored = localStorage.getItem(STUDIOS_STORAGE_KEY)
  if (!stored) {
    localStorage.setItem(STUDIOS_STORAGE_KEY, JSON.stringify(SEEDED_STUDIOS))
    return SEEDED_STUDIOS
  }
  try { return JSON.parse(stored) } catch { return SEEDED_STUDIOS }
}

/**
 * Weekdays (0=Sun..6=Sat) on which a weekly template repeats.
 * Template ids encode the recurrence: *_mwf, *_tths; otherwise its own dayOfWeek.
 */
function templateWeekdays(t: ClassSession): number[] {
  if (t.id.endsWith('_mwf')) return [1, 3, 5]
  if (t.id.endsWith('_tths')) return [2, 4, 6]
  return [t.dayOfWeek]
}

/**
 * Materialise the weekly templates into real dated sessions for today and the
 * next SCHEDULE_HORIZON_DAYS days. Existing sessions (and their bookings) are
 * never touched; generated sessions that are in the past and empty are pruned.
 */
export function withRollingSchedule(existing: ClassSession[] = []): ClassSession[] {
  const today = toLocalDateStr()
  const known = new Set(existing.map(s => s.id))
  const out = [...existing]

  for (let i = 0; i < SCHEDULE_HORIZON_DAYS; i++) {
    const date = localDateOffset(i)
    const weekday = parseLocalDate(date).getDay()
    for (const t of SEEDED_SESSIONS) {
      if (!templateWeekdays(t).includes(weekday)) continue
      const id = `${t.id}@${date}`
      if (known.has(id)) continue
      known.add(id)
      out.push({
        ...t,
        id,
        date,
        dayOfWeek: weekday,
        bookedCount: 0,
        waitlistCount: 0,
        status: 'scheduled',
        bookings: [],
        recurringScheduleId: t.id,
      })
    }
  }

  return out.filter(s => !(s.id.includes('@') && s.date < today && s.bookings.length === 0))
}

export function getStoredSessions(): ClassSession[] {
  if (typeof window === 'undefined') return SEEDED_SESSIONS
  try { localStorage.removeItem(LEGACY_SESSIONS_STORAGE_KEY) } catch {}

  let stored: ClassSession[] = []
  const raw = localStorage.getItem(SESSIONS_STORAGE_KEY)
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) stored = parsed
    } catch { /* start from an empty timetable */ }
  }

  const rolled = withRollingSchedule(stored)
  if (!raw || rolled.length !== stored.length) {
    // Persist silently (no event) so callers reading state never trigger a render loop.
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(rolled))
  }
  return rolled
}

export function saveSessions(sessions: ClassSession[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions))
  window.dispatchEvent(new Event('dna360_sessions_updated'))
  window.dispatchEvent(new Event('dna360_classes_updated'))
}

// ─── Queries ───

export function getSessions(filters: ScheduleFilterOptions = {}): ClassSession[] {
  let list = getStoredSessions()

  if (filters.category && filters.category !== 'all') {
    list = list.filter(s => s.category === filters.category)
  }

  if (filters.instructorId && filters.instructorId !== 'all') {
    list = list.filter(s => s.instructorId === filters.instructorId)
  }

  if (filters.studioId && filters.studioId !== 'all') {
    list = list.filter(s => s.studioId === filters.studioId)
  }

  if (filters.date) {
    list = list.filter(s => s.date === filters.date)
  }

  if (filters.timeOfDay && filters.timeOfDay !== 'all') {
    list = list.filter(s => {
      const hour = parseInt(s.startTime.split(':')[0], 10)
      if (filters.timeOfDay === 'morning') return hour < 12
      if (filters.timeOfDay === 'afternoon') return hour >= 12 && hour < 17
      if (filters.timeOfDay === 'evening') return hour >= 17
      return true
    })
  }

  return list.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date)
    return a.startTime.localeCompare(b.startTime)
  })
}

export function getSessionById(id: string): ClassSession | null {
  return getStoredSessions().find(s => s.id === id) || null
}

// ─── Booking Engine ───

/**
 * Validate booking window (opens 1 day in advance per §7).
 */
export function isBookingWindowOpen(sessionDate: string): boolean {
  const todayD = parseLocalDate(toLocalDateStr())
  const sessionD = parseLocalDate(sessionDate)
  const diffDays = Math.round((sessionD.getTime() - todayD.getTime()) / (1000 * 60 * 60 * 24))

  const rules = DEFAULT_BOOKING_RULES
  return diffDays <= rules.advanceBookingDays
}

/**
 * Book a class session.
 * Handles capacity checks, waitlisting, adjustment credit application.
 */
export function bookClassSession(params: {
  sessionId: string
  memberId: string
  useAdjustmentCredit?: boolean
  /** 'member' = self-service (full rule enforcement). Defaults to 'staff' (front-desk override). */
  source?: 'member' | 'staff'
}): { success: boolean; booking?: ClassBooking; isWaitlisted?: boolean; error?: string } {
  const sessions = getStoredSessions()
  const sessionIndex = sessions.findIndex(s => s.id === params.sessionId)
  if (sessionIndex === -1) return { success: false, error: 'Session not found' }

  const session = sessions[sessionIndex]
  const member = getStoredMembers().find(m => m.id === params.memberId)
  if (!member) return { success: false, error: 'Member not found' }

  if (session.status === 'cancelled') {
    return { success: false, error: 'This class has been cancelled.' }
  }

  if (params.source === 'member') {
    if (member.status === 'inactive' || member.status === 'blacklisted') {
      return { success: false, error: 'Your membership is not active. Please renew to book classes.' }
    }
    if (sessionStartDate(session.date, session.startTime).getTime() <= Date.now()) {
      return { success: false, error: 'This class has already started.' }
    }
    if (!isBookingWindowOpen(session.date)) {
      return {
        success: false,
        error: `Booking opens ${DEFAULT_BOOKING_RULES.advanceBookingDays} day before the class.`,
      }
    }
  }

  // Check if member already booked
  if (session.bookings.some(b => b.memberId === params.memberId && (b.status === 'confirmed' || b.status === 'waitlisted'))) {
    return { success: false, error: 'Member already has an active booking for this session.' }
  }

  // Validate Adjustment Credit (Pilates) — deducted only once the booking is certain
  if (params.useAdjustmentCredit && member.adjustment_credits_remaining <= 0) {
    return { success: false, error: 'No adjustment credits remaining (2 per tenure limit reached).' }
  }

  const capacity = session.capacity ?? 20
  const isFull = session.bookedCount >= capacity

  let bookingStatus: BookingStatus = 'confirmed'
  let waitlistPos: number | undefined

  if (isFull) {
    if (session.waitlistCount >= session.maxWaitlist) {
      return { success: false, error: 'Class capacity and waitlist are both full.' }
    }
    bookingStatus = 'waitlisted'
    waitlistPos = session.waitlistCount + 1
    session.waitlistCount++
  } else {
    session.bookedCount++
    if (session.bookedCount >= capacity) {
      session.status = 'full'
    }
  }

  const booking: ClassBooking = {
    id: `book_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    sessionId: session.id,
    memberId: member.id,
    memberName: member.name,
    memberPhone: member.phone,
    memberCode: member.member_code,
    status: bookingStatus,
    waitlistPosition: waitlistPos,
    bookedAt: new Date().toISOString(),
    adjustmentCreditUsed: params.useAdjustmentCredit,
  }

  session.bookings.push(booking)
  sessions[sessionIndex] = session
  if (params.useAdjustmentCredit) {
    updateMember(member.id, {
      adjustment_credits_remaining: member.adjustment_credits_remaining - 1,
    })
  }
  saveSessions(sessions)

  logAuditEvent({
    actor: { id: member.id, name: member.name, email: '', role: 'Member' },
    action: 'CREATE',
    entity: 'ClassBooking',
    entityId: booking.id,
    branchId: 'pow',
    description: `${member.name} booked ${session.title} (${bookingStatus})`,
    afterState: booking,
  })

  if (typeof window !== 'undefined') {
    fetch('/api/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: session.id,
        memberId: member.id,
        memberName: member.name,
        memberPhone: member.phone,
        memberCode: member.member_code,
        memberEmail: member.email,
        bookingId: booking.id,
        useAdjustmentCredit: params.useAdjustmentCredit,
        isAdminOverride: params.source !== 'member',
      }),
    }).catch(() => {})
  }

  return { success: true, booking, isWaitlisted: isFull }
}

/**
 * Cancel a class booking.
 * Enforces 4-hour cancellation cutoff.
 * Auto-promotes top waitlisted member if confirmed slot was cancelled.
 */
export function cancelClassBooking(params: {
  sessionId: string
  bookingId: string
  cancelledBy: { id: string; name: string; role: string }
}): { success: boolean; autoPromotedMemberName?: string; error?: string } {
  const sessions = getStoredSessions()
  const sessionIndex = sessions.findIndex(s => s.id === params.sessionId)
  if (sessionIndex === -1) return { success: false, error: 'Session not found' }

  const session = sessions[sessionIndex]
  const bookingIndex = session.bookings.findIndex(b => b.id === params.bookingId)
  if (bookingIndex === -1) return { success: false, error: 'Booking not found' }

  const booking = session.bookings[bookingIndex]
  const previousStatus = booking.status

  if (previousStatus !== 'confirmed' && previousStatus !== 'waitlisted') {
    return { success: false, error: 'This booking is no longer active.' }
  }

  // Member self-service: may only cancel own booking, and confirmed spots are subject to the cutoff.
  if (params.cancelledBy.role === 'Member') {
    if (booking.memberId !== params.cancelledBy.id) {
      return { success: false, error: 'You can only cancel your own booking.' }
    }
    if (previousStatus === 'confirmed') {
      const cutoffMs = DEFAULT_BOOKING_RULES.cancellationCutoffHours * 60 * 60 * 1000
      const msToStart = sessionStartDate(session.date, session.startTime).getTime() - Date.now()
      if (msToStart < cutoffMs) {
        return {
          success: false,
          error: `Bookings can only be cancelled up to ${DEFAULT_BOOKING_RULES.cancellationCutoffHours} hours before the class starts.`,
        }
      }
    }
  }

  booking.status = 'cancelled'
  booking.cancelledAt = new Date().toISOString()

  let autoPromotedMemberName: string | undefined

  if (previousStatus === 'confirmed') {
    session.bookedCount = Math.max(0, session.bookedCount - 1)
    if (session.status === 'full') {
      session.status = 'scheduled'
    }

    // Auto-promote top waitlisted member
    const topWaitlist = session.bookings.find(b => b.status === 'waitlisted')
    if (topWaitlist) {
      topWaitlist.status = 'confirmed'
      topWaitlist.waitlistPosition = undefined
      session.waitlistCount = Math.max(0, session.waitlistCount - 1)
      session.bookedCount++
      if (session.bookedCount >= (session.capacity ?? 20)) session.status = 'full'
      autoPromotedMemberName = topWaitlist.memberName
    }
  } else if (previousStatus === 'waitlisted') {
    session.waitlistCount = Math.max(0, session.waitlistCount - 1)
  }

  // Renumber remaining waitlist so positions stay contiguous
  session.bookings
    .filter(b => b.status === 'waitlisted')
    .forEach((b, i) => { b.waitlistPosition = i + 1 })

  sessions[sessionIndex] = session
  saveSessions(sessions)

  logAuditEvent({
    actor: { id: params.cancelledBy.id, name: params.cancelledBy.name, email: '', role: params.cancelledBy.role },
    action: 'UPDATE',
    entity: 'ClassBooking',
    entityId: booking.id,
    branchId: 'pow',
    description: `Cancelled booking for ${booking.memberName} in ${session.title}`,
    afterState: booking,
  })

  if (typeof window !== 'undefined') {
    fetch('/api/classes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: session.id,
        memberId: booking.memberId,
        bookingId: booking.id,
        isAdminOverride: params.cancelledBy.role !== 'Member',
      }),
    }).catch(() => {})
  }

  return { success: true, autoPromotedMemberName }
}

/**
 * Record a class session attendance or no-show.
 * Logs whether no-show consumed a session (config: no_show_consumes_session).
 */
export function recordSessionAttendance(params: {
  sessionId: string
  bookingId: string
  status: 'attended' | 'no_show'
  staffName: string
}): boolean {
  const sessions = getStoredSessions()
  const session = sessions.find(s => s.id === params.sessionId)
  if (!session) return false

  const booking = session.bookings.find(b => b.id === params.bookingId)
  if (!booking) return false

  const config = getPendingConfig()
  booking.status = params.status

  if (params.status === 'attended') {
    booking.checkedInAt = new Date().toISOString()
  } else if (params.status === 'no_show') {
    booking.noShowConsumedSession = config.no_show_consumes_session
  }

  saveSessions(sessions)

  logAuditEvent({
    actor: { id: 'system', name: params.staffName, email: '', role: 'Staff' },
    action: 'UPDATE',
    entity: 'ClassAttendance',
    entityId: booking.id,
    branchId: 'pow',
    description: `Marked ${booking.memberName} as ${params.status} in ${session.title}`,
    afterState: booking,
  })

  if (typeof window !== 'undefined') {
    fetch('/api/classes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'MARK_ATTENDANCE',
        sessionId: session.id,
        bookingId: booking.id,
        memberId: booking.memberId,
        status: params.status,
      }),
    }).catch(() => {})
  }

  return true
}

export function createSession(data: Partial<ClassSession> & Pick<ClassSession, 'title' | 'category' | 'instructorId' | 'instructorName' | 'studioId' | 'studioName' | 'date' | 'dayOfWeek' | 'startTime' | 'endTime' | 'durationMinutes'>): ClassSession {
  const sessions = getStoredSessions()
  const newSession: ClassSession = {
    id: `cls_${Date.now()}`,
    title: data.title,
    category: data.category,
    instructorId: data.instructorId,
    instructorName: data.instructorName,
    studioId: data.studioId,
    studioName: data.studioName,
    date: data.date,
    dayOfWeek: data.dayOfWeek,
    startTime: data.startTime,
    endTime: data.endTime,
    durationMinutes: data.durationMinutes,
    capacity: data.capacity !== undefined ? data.capacity : 8,
    bookedCount: 0,
    waitlistCount: 0,
    maxWaitlist: data.maxWaitlist ?? 5,
    intensity: data.intensity ?? 'High',
    caloriesEstimate: data.caloriesEstimate,
    description: data.description || 'Signature workout at DNA 360.',
    status: data.status || 'scheduled',
    bookings: [],
    accessWindow: data.accessWindow,
    pilatesDayGroup: data.pilatesDayGroup,
    isTrialSlot: data.isTrialSlot,
  }
  sessions.push(newSession)
  saveSessions(sessions)

  if (typeof window !== 'undefined') {
    fetch('/api/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'CREATE_SESSION',
        session: newSession,
      }),
    }).catch(() => {})
  }

  return newSession
}

export function cancelBooking(sessionId: string, bookingId: string, staffName = 'Staff'): boolean {
  const res = cancelClassBooking({
    sessionId,
    bookingId,
    cancelledBy: { id: 'usr_staff', name: staffName, role: 'Staff' },
  })
  return res.success
}

export function markAttendance(sessionId: string, bookingId: string, status: 'attended' | 'no_show', staffName = 'Staff'): boolean {
  return recordSessionAttendance({
    sessionId,
    bookingId,
    status,
    staffName,
  })
}
