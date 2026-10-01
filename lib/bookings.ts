/* ============================================================
   DNA 360 — Bookings Store & Service
   Direct software booking for trials and wellness sessions.
   ============================================================ */

import type { Booking, BookingServiceType, BookingStatus } from '@/types/booking'
import { BOOKING_SERVICES } from '@/types/booking'
import { logAuditEvent } from '@/lib/audit'

const STORAGE_KEY = 'dna360_bookings_v1'

const SEEDED_BOOKINGS: Booking[] = [
  {
    id: 'bk_001',
    bookingNumber: 'DNA-BK-1001',
    clientName: 'Siddharth Rao',
    clientPhone: '+919820011223',
    clientEmail: 'siddharth.rao@gmail.com',
    serviceType: 'gym_trial',
    serviceName: 'Gym Trial',
    bookingDate: new Date().toISOString().split('T')[0],
    timeSlot: '07:30 AM',
    assignedStaffId: 'usr_tr_01',
    assignedStaffName: 'Rohan Kulkarni',
    status: 'scheduled',
    notes: 'Interested in annual membership and strength training.',
    source: 'Walk-in',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    whatsappReminderSent: true,
  },
  {
    id: 'bk_002',
    bookingNumber: 'DNA-BK-1002',
    clientName: 'Meenakshi Iyer',
    clientPhone: '+919833044556',
    clientEmail: 'meenakshi.i@outlook.com',
    serviceType: 'reformer_pilates_trial',
    serviceName: 'Reformer Pilates Trial',
    bookingDate: new Date().toISOString().split('T')[0],
    timeSlot: '11:00 AM',
    assignedStaffId: 'usr_tr_02',
    assignedStaffName: 'Rajesh Poojary',
    status: 'scheduled',
    notes: 'Looking for posture correction and core mobility.',
    source: 'WhatsApp',
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    whatsappReminderSent: true,
  },
  {
    id: 'bk_003',
    bookingNumber: 'DNA-BK-1003',
    clientName: 'Rahul Malhotra',
    clientPhone: '+919819077889',
    serviceType: 'pt_trial',
    serviceName: 'Personal Training Trial',
    bookingDate: new Date().toISOString().split('T')[0],
    timeSlot: '06:00 PM',
    assignedStaffId: 'usr_tr_03',
    assignedStaffName: 'Sameer Khan',
    status: 'scheduled',
    notes: 'Wants body recomposition & high-intensity strength trial.',
    source: 'Telephonic',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    whatsappReminderSent: false,
  },
  {
    id: 'bk_004',
    bookingNumber: 'DNA-BK-1004',
    clientName: 'Tanvi Deshmukh',
    clientPhone: '+919769012399',
    serviceType: 'body_assessment',
    serviceName: 'Body Assessment',
    bookingDate: new Date().toISOString().split('T')[0],
    timeSlot: '04:30 PM',
    assignedStaffId: 'usr_tr_01',
    assignedStaffName: 'Rohan Kulkarni',
    status: 'scheduled',
    notes: 'InBody composition analysis before joining gym.',
    source: 'Social Media',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    whatsappReminderSent: false,
  },
  {
    id: 'bk_005',
    bookingNumber: 'DNA-BK-1005',
    clientName: 'Aditya Singhania',
    clientPhone: '+919820066778',
    serviceType: 'ice_bath',
    serviceName: 'Ice Bath',
    bookingDate: new Date().toISOString().split('T')[0],
    timeSlot: '05:30 PM',
    assignedStaffId: 'usr_tr_02',
    assignedStaffName: 'Rajesh Poojary',
    status: 'scheduled',
    notes: 'Recovery session trial after marathon run.',
    source: 'Reference',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    whatsappReminderSent: true,
  },
  {
    id: 'bk_006',
    bookingNumber: 'DNA-BK-1006',
    clientName: 'Kunal Kapoor',
    clientPhone: '+919833088990',
    serviceType: 'massage',
    serviceName: 'Massage',
    bookingDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    timeSlot: '03:00 PM',
    assignedStaffId: 'usr_tr_03',
    assignedStaffName: 'Sameer Khan',
    status: 'scheduled',
    notes: 'Sports recovery back massage.',
    source: 'Walk-in',
    createdAt: new Date().toISOString(),
    whatsappReminderSent: false,
  },
  {
    id: 'bk_007',
    bookingNumber: 'DNA-BK-1007',
    clientName: 'Pooja Agarwal',
    clientPhone: '+919819033445',
    serviceType: 'group_activity_trial',
    serviceName: 'Group Activity Trial',
    bookingDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    timeSlot: '08:00 AM',
    assignedStaffId: 'usr_tr_01',
    assignedStaffName: 'Rohan Kulkarni',
    status: 'scheduled',
    notes: 'Spinning & HIIT morning group trial.',
    source: 'Social Media',
    createdAt: new Date().toISOString(),
    whatsappReminderSent: false,
  },
]

export function getBookings(): Booking[] {
  if (typeof window === 'undefined') return SEEDED_BOOKINGS
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEEDED_BOOKINGS))
    return SEEDED_BOOKINGS
  }
  try {
    return JSON.parse(raw)
  } catch {
    return SEEDED_BOOKINGS
  }
}

export function saveBookings(bookings: Booking[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings))
}

export function createBooking(data: {
  clientName: string
  clientPhone: string
  clientEmail?: string
  serviceType: BookingServiceType
  bookingDate: string
  timeSlot: string
  assignedStaffId?: string
  assignedStaffName?: string
  notes?: string
  source?: 'Walk-in' | 'WhatsApp' | 'Telephonic' | 'Social Media' | 'Reference'
}): Booking {
  const current = getBookings()
  const svc = BOOKING_SERVICES[data.serviceType]
  const newBooking: Booking = {
    id: `bk_${Date.now()}`,
    bookingNumber: `DNA-BK-${1000 + current.length + 1}`,
    clientName: data.clientName.trim(),
    clientPhone: data.clientPhone.trim(),
    clientEmail: data.clientEmail?.trim() || undefined,
    serviceType: data.serviceType,
    serviceName: svc?.label || 'Trial Session',
    bookingDate: data.bookingDate,
    timeSlot: data.timeSlot,
    assignedStaffId: data.assignedStaffId || 'usr_tr_01',
    assignedStaffName: data.assignedStaffName || 'Rohan Kulkarni',
    status: 'scheduled',
    notes: data.notes?.trim() || undefined,
    source: data.source || 'Walk-in',
    createdAt: new Date().toISOString(),
    whatsappReminderSent: false,
  }

  const updated = [newBooking, ...current]
  saveBookings(updated)

  logAuditEvent({
    actor: { id: 'staff', name: 'Front Desk', email: '', role: 'Reception' },
    action: 'CREATE',
    entity: 'Booking',
    entityId: newBooking.id,
    branchId: 'pow',
    description: `Booked ${newBooking.serviceName} for ${newBooking.clientName} on ${newBooking.bookingDate} at ${newBooking.timeSlot}`,
  })

  return newBooking
}

export function updateBookingStatus(id: string, status: BookingStatus, convertedMemberId?: string): Booking | null {
  const current = getBookings()
  const idx = current.findIndex((b) => b.id === id)
  if (idx === -1) return null

  const updated = {
    ...current[idx],
    status,
    ...(convertedMemberId ? { convertedMemberId } : {}),
  }
  current[idx] = updated
  saveBookings(current)

  logAuditEvent({
    actor: { id: 'staff', name: 'Front Desk', email: '', role: 'Reception' },
    action: 'UPDATE',
    entity: 'Booking',
    entityId: id,
    branchId: 'pow',
    description: `Updated booking ${updated.bookingNumber} status to ${status.toUpperCase()}`,
  })

  return updated
}

export function deleteBooking(id: string): boolean {
  const current = getBookings()
  const filtered = current.filter((b) => b.id !== id)
  if (filtered.length === current.length) return false
  saveBookings(filtered)
  return true
}

export function getTodayBookings(): Booking[] {
  const today = new Date().toISOString().split('T')[0]
  return getBookings().filter((b) => b.bookingDate === today)
}

/**
 * Generate a WhatsApp trial confirmation and reminder link
 */
export function getWhatsAppBookingLink(booking: Booking): string {
  const cleanPhone = booking.clientPhone.replace(/\D/g, '')
  const phone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`
  const message = encodeURIComponent(
    `Hello ${booking.clientName}! 👋 Greetings from *DNA 360 Fitness, Powai*.\n\nYour *${booking.serviceName}* is confirmed for *${booking.bookingDate}* at *${booking.timeSlot}*.\nAssigned Specialist: *Coach ${booking.assignedStaffName}*.\n\n📍 Location: Knowledge Park 502, Hiranandani Gardens, Powai.\n\nPlease arrive 10 mins early in comfortable workout attire. Reply YES to confirm! 💪`
  )
  return `https://wa.me/${phone}?text=${message}`
}
