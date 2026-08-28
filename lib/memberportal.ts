import type {
  MemberPortalState,
  MemberClassBooking,
  MemberFreezeRequest,
} from '@/types/memberportal'
import { getStoredMembers, updateMember } from '@/lib/members'
import { logAuditEvent } from '@/lib/audit'

const PORTAL_STATE_KEY = 'dna360_member_portal_state'
const PORTAL_BOOKINGS_KEY = 'dna360_member_portal_bookings'
const PORTAL_FREEZE_KEY = 'dna360_member_portal_freeze'

export const SEEDED_PORTAL_STATE: MemberPortalState = {
  memberId: 'mem_001',
  memberName: 'Arjun Mehta',
  memberCode: 'DNA-POW-2025-0892',
  phone: '+919820011111',
  email: 'arjun.mehta@gmail.com',
  planName: 'Annual All-Access Premium',
  planTier: 'Platinum All-Access',
  branchName: 'Powai Flagship (+ Multi-Club)',
  expiryDate: '2027-03-15',
  daysRemaining: 218,
  activePlans: [
    {
      productName: 'Annual Gym Membership Package 1',
      category: 'gym_membership',
      expiryDate: '2027-03-15',
      daysRemaining: 218,
      sessionsRemaining: null,
      sessionsTotal: null,
      accessWindow: null,
    },
    {
      productName: 'Tier 1 PT — 12 Sessions (1 Month)',
      category: 'personal_training',
      expiryDate: '2026-09-30',
      daysRemaining: 33,
      sessionsRemaining: 8,
      sessionsTotal: 12,
      accessWindow: null,
    },
  ],
  attendanceStreak: 14,
  totalVisits: 142,
  ptSessionsRemaining: 8,
  ptSessionsTotal: 12,
  waterIntakeMl: 2250,
  waterTargetMl: 3500,
  qrToken: 'OTP-9821-4402',
  qrExpiresInSeconds: 28,
}

export const SEEDED_PORTAL_BOOKINGS: MemberClassBooking[] = [
  {
    id: 'mb_001',
    sessionId: 'cls_001',
    classTitle: 'CrossFit WOD: Helen & Heavy Cleans',
    category: 'CrossFit / Functional',
    instructorName: 'Rajesh Poojary',
    date: 'Today',
    time: '18:30 - 19:30 IST',
    studioName: 'Studio A (Functional Turf)',
    status: 'confirmed',
  },
  {
    id: 'mb_002',
    sessionId: 'cls_003',
    classTitle: 'RPM Sprint High-Intensity Cycle',
    category: 'RPM Cycling',
    instructorName: 'Aftab Memon',
    date: 'Tomorrow',
    time: '07:00 - 07:45 IST',
    studioName: 'Studio C (Cycle Theatre)',
    status: 'confirmed',
  },
]

export function getMemberPortalState(): MemberPortalState {
  if (typeof window === 'undefined') return SEEDED_PORTAL_STATE
  const stored = localStorage.getItem(PORTAL_STATE_KEY)
  if (!stored) {
    localStorage.setItem(PORTAL_STATE_KEY, JSON.stringify(SEEDED_PORTAL_STATE))
    return SEEDED_PORTAL_STATE
  }
  try {
    return JSON.parse(stored)
  } catch {
    return SEEDED_PORTAL_STATE
  }
}

export function saveMemberPortalState(state: MemberPortalState) {
  if (typeof window === 'undefined') return
  localStorage.setItem(PORTAL_STATE_KEY, JSON.stringify(state))
  window.dispatchEvent(new Event('dna360_memberportal_updated'))
}

export function getMemberBookings(): MemberClassBooking[] {
  if (typeof window === 'undefined') return SEEDED_PORTAL_BOOKINGS
  const stored = localStorage.getItem(PORTAL_BOOKINGS_KEY)
  if (!stored) {
    localStorage.setItem(PORTAL_BOOKINGS_KEY, JSON.stringify(SEEDED_PORTAL_BOOKINGS))
    return SEEDED_PORTAL_BOOKINGS
  }
  try {
    return JSON.parse(stored)
  } catch {
    return SEEDED_PORTAL_BOOKINGS
  }
}

export function saveMemberBookings(bookings: MemberClassBooking[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(PORTAL_BOOKINGS_KEY, JSON.stringify(bookings))
  window.dispatchEvent(new Event('dna360_memberportal_updated'))
}

export function addWaterIntake(amountMl: number): MemberPortalState {
  const current = getMemberPortalState()
  const updated = {
    ...current,
    waterIntakeMl: Math.min(6000, current.waterIntakeMl + amountMl),
  }
  saveMemberPortalState(updated)
  return updated
}

export function cancelMemberBooking(bookingId: string): boolean {
  const bookings = getMemberBookings()
  const filtered = bookings.filter((b) => b.id !== bookingId)
  saveMemberBookings(filtered)

  logAuditEvent({
    actor: { id: 'mem_001', name: 'Arjun Mehta', email: 'arjun.mehta@gmail.com', role: 'Member' },
    action: 'DELETE',
    entity: 'ClassBooking',
    entityId: bookingId,
    branchId: 'pow',
    description: `Member Arjun Mehta cancelled self-service class reservation ${bookingId}`,
  })

  return true
}

export function submitFreezeRequest(data: {
  startDate: string
  endDate: string
  daysCount: number
  reason: MemberFreezeRequest['reason']
  notes?: string
}): MemberFreezeRequest {
  const current = getMemberPortalState()
  const newRequest: MemberFreezeRequest = {
    id: `frz_req_${Date.now()}`,
    memberId: current.memberId,
    memberName: current.memberName,
    startDate: data.startDate,
    endDate: data.endDate,
    daysCount: data.daysCount,
    reason: data.reason,
    notes: data.notes,
    status: 'pending',
    submittedAt: new Date().toISOString(),
  }

  logAuditEvent({
    actor: { id: current.memberId, name: current.memberName, email: current.email || '', role: 'Member' },
    action: 'CREATE',
    entity: 'FreezeRequest',
    entityId: newRequest.id,
    branchId: 'pow',
    description: `Member submitted self-service pause request for ${data.daysCount} days (${data.startDate} to ${data.endDate}). Reason: ${data.reason}`,
    afterState: newRequest,
  })

  return newRequest
}

export function renewOrUpgradePlan(planName: string, planTier: string, priceMinor: number): MemberPortalState {
  const current = getMemberPortalState()
  const updated: MemberPortalState = {
    ...current,
    planName,
    planTier,
    daysRemaining: (current.daysRemaining ?? 0) + 365,
    expiryDate: '2028-03-15',
  }

  saveMemberPortalState(updated)

  logAuditEvent({
    actor: { id: current.memberId, name: current.memberName, email: current.email || '', role: 'Member' },
    action: 'UPDATE',
    entity: 'MembershipPlan',
    entityId: `ren_${Date.now()}`,
    branchId: 'pow',
    description: `Member executed self-service plan upgrade/renewal to ${planName} for ₹${(priceMinor / 100).toLocaleString('en-IN')}`,
    afterState: updated,
  })

  return updated
}
