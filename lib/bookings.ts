/* ============================================================
   DNA 360 — Bookings Store & Service
   Direct software booking for trials and wellness sessions.
   ============================================================ */

import type { Booking, BookingServiceType, BookingStatus } from '@/types/booking'
import { BOOKING_SERVICES } from '@/types/booking'
import { logAuditEvent } from '@/lib/audit'

const STORAGE_KEY = 'dna360_bookings_v1'
const DELETED_BOOKINGS_KEY = 'dna360_bookings_deleted_v1'

function getDeletedBookingIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(DELETED_BOOKINGS_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? new Set(parsed) : new Set()
  } catch {
    return new Set()
  }
}

function addDeletedBookingId(id: string) {
  if (typeof window === 'undefined') return
  const set = getDeletedBookingIds()
  set.add(id)
  localStorage.setItem(DELETED_BOOKINGS_KEY, JSON.stringify(Array.from(set)))
}

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
    assignedStaffId: 'usr_trainer_01',
    assignedStaffName: 'Rajesh Poojary',
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
    assignedStaffId: 'usr_trainer_03',
    assignedStaffName: 'Hemant Shirke',
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
    assignedStaffId: 'usr_trainer_02',
    assignedStaffName: 'Aftab Memon',
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
    assignedStaffId: 'usr_trainer_06',
    assignedStaffName: 'Kunal Chavan',
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
    assignedStaffId: 'usr_trainer_01',
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
    assignedStaffId: 'usr_trainer_02',
    assignedStaffName: 'Aftab Memon',
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
    assignedStaffId: 'usr_trainer_04',
    assignedStaffName: 'Zeebran Shaikh',
    status: 'scheduled',
    notes: 'Spinning & HIIT morning group trial.',
    source: 'Social Media',
    createdAt: new Date().toISOString(),
    whatsappReminderSent: false,
  },
]

export function getBookings(): Booking[] {
  if (typeof window === 'undefined') return SEEDED_BOOKINGS
  const deleted = getDeletedBookingIds()
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    const initial = SEEDED_BOOKINGS.filter((b) => !deleted.has(b.id))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial))
    return initial
  }
  try {
    const parsed: Booking[] = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((b) => !deleted.has(b.id)) : SEEDED_BOOKINGS
  } catch {
    return SEEDED_BOOKINGS
  }
}

export function saveBookings(bookings: Booking[]) {
  if (typeof window === 'undefined') return
  const deleted = getDeletedBookingIds()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings.filter((b) => !deleted.has(b.id))))
  window.dispatchEvent(new Event('dna360_bookings_updated'))
}

export async function syncBookingsFromRemote(): Promise<Booking[]> {
  if (typeof window === 'undefined') return SEEDED_BOOKINGS
  try {
    const res = await fetch('/api/settings?scope=bookings')
    if (res.ok) {
      const data = await res.json()
      const deleted = getDeletedBookingIds()
      if (Array.isArray(data?.deletedBookingIds)) {
        for (const id of data.deletedBookingIds) deleted.add(id)
        localStorage.setItem(DELETED_BOOKINGS_KEY, JSON.stringify(Array.from(deleted)))
      }
      const local = getBookings()
      const map = new Map<string, Booking>()
      for (const b of local) {
        if (!deleted.has(b.id)) map.set(b.id, b)
      }
      if (Array.isArray(data?.bookings)) {
        for (const remote of data.bookings) {
          if (remote?.id && !deleted.has(remote.id)) {
            map.set(remote.id, remote)
          }
        }
      }
      const merged = Array.from(map.values()).sort((a, b) =>
        (b.createdAt || '').localeCompare(a.createdAt || '')
      )
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
      return merged
    }
  } catch {
    // offline fallback
  }
  return getBookings()
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
    assignedStaffId: data.assignedStaffId || 'usr_staff_03',
    assignedStaffName: data.assignedStaffName || 'Rajesh Poojary',
    status: 'scheduled',
    notes: data.notes?.trim() || undefined,
    source: data.source || 'Walk-in',
    createdAt: new Date().toISOString(),
    whatsappReminderSent: false,
  }

  const updated = [newBooking, ...current]
  saveBookings(updated)

  if (typeof window !== 'undefined') {
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'UPSERT_BOOKING', booking: newBooking }),
    }).catch(() => {})

    fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prospectName: newBooking.clientName,
        phone: newBooking.clientPhone,
        email: newBooking.clientEmail,
        source: newBooking.source || 'Walk-in',
        interestArea: newBooking.serviceName,
        assignedStaffId: newBooking.assignedStaffId,
        assignedStaffName: newBooking.assignedStaffName,
        trialDate: newBooking.bookingDate,
        notes: `${newBooking.serviceName} booked for ${newBooking.bookingDate} at ${newBooking.timeSlot}. ${newBooking.notes || ''}`.trim(),
      }),
    }).catch(() => {})
  }

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

  if (typeof window !== 'undefined') {
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'UPSERT_BOOKING', booking: updated }),
    }).catch(() => {})
  }

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
  addDeletedBookingId(id)
  saveBookings(filtered)

  if (typeof window !== 'undefined') {
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'DELETE_BOOKING', bookingId: id }),
    }).catch(() => {})
  }

  logAuditEvent({
    actor: { id: 'staff', name: 'Front Desk', email: '', role: 'Reception' },
    action: 'DELETE',
    entity: 'Booking',
    entityId: id,
    branchId: 'pow',
    description: `Deleted trial booking ${id}`,
  })
  return true
}

export function getTodayBookings(): Booking[] {
  const today = new Date().toISOString().split('T')[0]
  const list = getBookings()
  const todayList = list.filter((b) => b.bookingDate === today)
  if (todayList.length > 0) return todayList

  // If no bookings match today's date (date rolled forward), freshen seeded bookings with current date
  const refreshed = list.map((b, idx) => {
    if (idx < 3) {
      return { ...b, bookingDate: today }
    }
    return b
  })
  saveBookings(refreshed)
  return refreshed.filter((b) => b.bookingDate === today)
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
