/* ============================================================
   DNA 360 — Class & Scheduling Types
   
   Real activities from the timetable, not generic categories.
   Reformer Pilates studio with alternating day groups.
   ============================================================ */

import type { AccessWindow } from './product'

/** Real activity categories from DNA 360's timetable */
export type ClassCategory =
  | 'reformer_pilates'
  | 'reformer_pilates_pt'
  | 'mat_pilates'
  | 'yoga'
  | 'dance_fitness'
  | 'mma'
  | 'spinning'
  | 'crossfit'
  | 'hyrox'
  | 'fitzone'

export type BookingStatus =
  | 'confirmed'
  | 'attended'
  | 'no_show'
  | 'cancelled'
  | 'waitlisted'

export type IntensityLevel = 'Low' | 'Medium' | 'High' | 'Extreme'

/** Reformer Pilates studio day groups */
export type PilatesDayGroup = 'A' | 'B'

/** Map day of week (1=Mon…6=Sat) to Pilates group */
export const PILATES_DAY_GROUPS: Record<number, PilatesDayGroup> = {
  1: 'A', // Monday
  2: 'B', // Tuesday
  3: 'A', // Wednesday
  4: 'B', // Thursday
  5: 'A', // Friday
  6: 'B', // Saturday
}

export interface StudioRoom {
  id: string
  name: string
  /** Capacity per slot — PENDING for Reformer Pilates (need bed count) */
  capacity: number | null
  features: string[]
  /** Studio type for routing logic */
  type: 'reformer_studio' | 'group_studio' | 'cycling_studio' | 'gym_floor'
}

export interface ClassBooking {
  id: string
  sessionId: string
  memberId: string
  memberName: string
  memberPhone: string
  memberCode?: string
  status: BookingStatus
  waitlistPosition?: number
  bookedAt: string // ISO UTC
  checkedInAt?: string // ISO UTC
  cancelledAt?: string
  /**
   * Whether this no-show consumed a session.
   * Controlled by config: no_show_consumes_session (default true).
   * Logged either way.
   */
  noShowConsumedSession?: boolean
  /** Entitlement ID that was decremented for this booking */
  entitlementId?: string
  /** Adjustment credit used (Pilates only, 2 per tenure) */
  adjustmentCreditUsed?: boolean
}

export interface ClassSession {
  id: string
  title: string
  category: ClassCategory
  instructorId: string
  instructorName: string
  studioId: string
  studioName: string
  date: string // YYYY-MM-DD
  dayOfWeek: number // 1 = Monday, ..., 6 = Saturday, 0 = Sunday
  startTime: string // "07:00"
  endTime: string // "08:00"
  durationMinutes: number
  /** Capacity — null if PENDING (Reformer studio) */
  capacity: number | null
  bookedCount: number
  waitlistCount: number
  maxWaitlist: number
  intensity: IntensityLevel
  caloriesEstimate?: number
  description: string
  bookings: ClassBooking[]
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'full'
  /** Access window restriction (e.g. Pilates Happy Hours 14:00–16:00) */
  accessWindow?: AccessWindow
  /** Pilates day group (A or B) if applicable */
  pilatesDayGroup?: PilatesDayGroup
  /** Whether this is a trial slot */
  isTrialSlot?: boolean
  /** Recurring schedule ID this session belongs to */
  recurringScheduleId?: string
}

/**
 * Booking rules — from §7 of the build prompt.
 * These are config values, not hardcoded.
 */
export interface BookingRules {
  /** How far in advance bookings open (days) */
  advanceBookingDays: number // 1
  /** Cancellation cutoff before class start (hours) */
  cancellationCutoffHours: number // 4
  /** Whether waitlist auto-promotes with notification */
  autoPromoteWaitlist: boolean // true
  /** Whether no-show consumes the session — PENDING config, default true */
  noShowConsumesSession: boolean
}

export const DEFAULT_BOOKING_RULES: BookingRules = {
  advanceBookingDays: 1,
  cancellationCutoffHours: 4,
  autoPromoteWaitlist: true,
  noShowConsumesSession: true,
}

export interface ScheduleFilterOptions {
  category?: string
  instructorId?: string
  studioId?: string
  date?: string
  timeOfDay?: 'all' | 'morning' | 'afternoon' | 'evening'
  viewMode?: 'grid' | 'list'
  branchId?: string
  search?: string
}
