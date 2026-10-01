/* ============================================================
   DNA 360 — Bookings & Trials Types
   Direct software booking for trials and wellness services.
   ============================================================ */

export type BookingServiceType =
  | 'gym_trial'
  | 'pt_trial'
  | 'reformer_pilates_trial'
  | 'group_activity_trial'
  | 'body_assessment'
  | 'massage'
  | 'ice_bath'

export type BookingStatus =
  | 'scheduled'
  | 'attended'
  | 'no_show'
  | 'converted'
  | 'cancelled'

export interface BookingServiceOption {
  type: BookingServiceType
  label: string
  durationMinutes: number
  description: string
  category: 'trial' | 'assessment' | 'recovery'
}

export const BOOKING_SERVICES: Record<BookingServiceType, BookingServiceOption> = {
  gym_trial: {
    type: 'gym_trial',
    label: 'Gym Trial',
    durationMinutes: 90,
    description: 'Complimentary single-session full gym floor & cardio workout trial.',
    category: 'trial',
  },
  pt_trial: {
    type: 'pt_trial',
    label: 'Personal Training Trial',
    durationMinutes: 60,
    description: '1-on-1 personalized form evaluation & strength workout with coach.',
    category: 'trial',
  },
  reformer_pilates_trial: {
    type: 'reformer_pilates_trial',
    label: 'Reformer Pilates Trial',
    durationMinutes: 50,
    description: 'Introduction to Allegro 2 Reformer core & mobility reformer session.',
    category: 'trial',
  },
  group_activity_trial: {
    type: 'group_activity_trial',
    label: 'Group Activity Trial',
    durationMinutes: 45,
    description: 'High-energy trial class (Spinning, Zumba, Power Yoga, or HIIT).',
    category: 'trial',
  },
  body_assessment: {
    type: 'body_assessment',
    label: 'Body Assessment',
    durationMinutes: 30,
    description: 'Comprehensive InBody composition scan, visceral fat & muscle mass report.',
    category: 'assessment',
  },
  massage: {
    type: 'massage',
    label: 'Massage',
    durationMinutes: 60,
    description: 'Deep tissue athletic sports recovery & tension relief therapy.',
    category: 'recovery',
  },
  ice_bath: {
    type: 'ice_bath',
    label: 'Ice Bath',
    durationMinutes: 20,
    description: 'Cold plunge cryo-therapy bath (4°C) for inflammation & lactic recovery.',
    category: 'recovery',
  },
}

export interface Booking {
  id: string
  bookingNumber: string
  clientName: string
  clientPhone: string
  clientEmail?: string
  serviceType: BookingServiceType
  serviceName: string
  bookingDate: string // YYYY-MM-DD
  timeSlot: string // e.g. "10:00 AM"
  assignedStaffId: string
  assignedStaffName: string
  status: BookingStatus
  notes?: string
  source?: 'Walk-in' | 'WhatsApp' | 'Telephonic' | 'Social Media' | 'Reference'
  createdAt: string // ISO
  convertedMemberId?: string
  whatsappReminderSent?: boolean
}
