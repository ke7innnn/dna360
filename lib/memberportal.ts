import type {
  MemberPortalState,
  MemberClassBooking,
  MemberFreezeRequest,
} from '@/types/memberportal'
import { getStoredMembers, updateMember } from '@/lib/members'
import { recordMembershipInvoice } from '@/lib/billing'
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

export function getMemberPortalState(memberId?: string): MemberPortalState {
  const targetId = memberId || 'mem_001'
  const key = `${PORTAL_STATE_KEY}_${targetId}`

  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(key)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        // Fall through to rehydration
      }
    }
  }

  // Auto-hydrate dynamically from verified member records in getStoredMembers()
  const members = getStoredMembers()
  const found = members.find(
    (m) =>
      m.id === targetId ||
      m.member_code === targetId ||
      m.name.toLowerCase() === targetId.toLowerCase() ||
      m.phone === targetId
  )

  if (found) {
    const primaryMs = found.active_memberships?.[0]
    const expiry = primaryMs?.expiry_date || '2027-03-15'
    const daysLeft = Math.max(
      0,
      Math.ceil((new Date(expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    )

    const ptMs = found.active_memberships?.find(
      (ms) =>
        ms.sessions_remaining !== null ||
        ms.category === 'personal_training' ||
        ms.product_name?.toLowerCase().includes('pt') ||
        ms.product_name?.toLowerCase().includes('personal')
    )
    const ptSessionsRemaining = ptMs ? (ptMs.sessions_remaining ?? 0) : (found.id === 'mem_001' ? 8 : 0)
    const ptSessionsTotal = ptMs ? (ptMs.sessions_total ?? 12) : (found.id === 'mem_001' ? 12 : 0)

    const hydrated: MemberPortalState = {
      memberId: found.id,
      memberName: found.name,
      memberCode: found.member_code,
      phone: found.phone,
      email: found.email || '',
      planName: primaryMs?.product_name || 'Annual All-Access Membership',
      planTier: 'Platinum All-Access',
      branchName: 'Powai Flagship (+ Multi-Club)',
      expiryDate: expiry,
      daysRemaining: daysLeft,
      activePlans: found.active_memberships?.map((ms) => ({
        productName: ms.product_name,
        category: ms.category,
        expiryDate: ms.expiry_date,
        daysRemaining: Math.max(
          0,
          Math.ceil((new Date(ms.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        ),
        sessionsRemaining: ms.sessions_remaining,
        sessionsTotal: ms.sessions_total,
        accessWindow: ms.access_window ? `${ms.access_window.start} - ${ms.access_window.end}` : null,
      })) || [],
      attendanceStreak: found.attendance_streak || 12,
      totalVisits: found.total_check_ins || found.total_visits || 48,
      ptSessionsRemaining,
      ptSessionsTotal,
      waterIntakeMl: 2250,
      waterTargetMl: 3500,
      qrToken: `OTP-${found.member_code.replace(/[^0-9]/g, '').slice(-4) || '9821'}-4402`,
      qrExpiresInSeconds: 28,
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify(hydrated))
      } catch {}
    }
    return hydrated
  }

  // Fallback to seeded state
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(SEEDED_PORTAL_STATE))
    } catch {}
  }
  return SEEDED_PORTAL_STATE
}

export function saveMemberPortalState(state: MemberPortalState, memberId?: string) {
  if (typeof window === 'undefined') return
  const targetId = memberId || state.memberId || 'mem_001'
  const key = `${PORTAL_STATE_KEY}_${targetId}`
  localStorage.setItem(key, JSON.stringify(state))
  window.dispatchEvent(new Event('dna360_memberportal_updated'))
}

export function getMemberBookings(memberId?: string): MemberClassBooking[] {
  const targetId = memberId || 'mem_001'
  const key = `${PORTAL_BOOKINGS_KEY}_${targetId}`

  if (typeof window === 'undefined') {
    return targetId === 'mem_001' ? SEEDED_PORTAL_BOOKINGS : []
  }

  const stored = localStorage.getItem(key)
  if (!stored) {
    const initial = targetId === 'mem_001' ? SEEDED_PORTAL_BOOKINGS : []
    try {
      localStorage.setItem(key, JSON.stringify(initial))
    } catch {}
    return initial
  }
  try {
    return JSON.parse(stored)
  } catch {
    return []
  }
}

export function saveMemberBookings(bookings: MemberClassBooking[], memberId?: string) {
  if (typeof window === 'undefined') return
  const targetId = memberId || 'mem_001'
  const key = `${PORTAL_BOOKINGS_KEY}_${targetId}`
  localStorage.setItem(key, JSON.stringify(bookings))
  window.dispatchEvent(new Event('dna360_memberportal_updated'))
}

export function addWaterIntake(amountMl: number, memberId?: string): MemberPortalState {
  const current = getMemberPortalState(memberId)
  const updated = {
    ...current,
    waterIntakeMl: Math.min(6000, current.waterIntakeMl + amountMl),
  }
  saveMemberPortalState(updated, memberId)
  return updated
}

export function cancelMemberBooking(bookingId: string, memberId?: string): boolean {
  const bookings = getMemberBookings(memberId)
  const filtered = bookings.filter((b) => b.id !== bookingId)
  saveMemberBookings(filtered, memberId)

  const current = getMemberPortalState(memberId)
  logAuditEvent({
    actor: { id: current.memberId, name: current.memberName, email: current.email || '', role: 'Member' },
    action: 'DELETE',
    entity: 'ClassBooking',
    entityId: bookingId,
    branchId: 'pow',
    description: `Member ${current.memberName} cancelled self-service class reservation ${bookingId}`,
  })

  return true
}

let memoryFreezeRequests: Record<string, MemberFreezeRequest[]> = {}

export function getMemberFreezeRequests(memberId?: string): MemberFreezeRequest[] {
  const targetId = memberId || 'mem_001'
  const key = `${PORTAL_FREEZE_KEY}_${targetId}`

  if (typeof window === 'undefined') {
    return memoryFreezeRequests[targetId] || []
  }

  const stored = localStorage.getItem(key)
  if (!stored) return []
  try {
    return JSON.parse(stored)
  } catch {
    return []
  }
}

export function saveMemberFreezeRequests(requests: MemberFreezeRequest[], memberId?: string) {
  const targetId = memberId || 'mem_001'
  const key = `${PORTAL_FREEZE_KEY}_${targetId}`
  memoryFreezeRequests[targetId] = requests
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(requests))
    window.dispatchEvent(new Event('dna360_memberportal_updated'))
  }
}

export function submitFreezeRequest(
  data: {
    startDate: string
    endDate: string
    daysCount: number
    reason: MemberFreezeRequest['reason']
    notes?: string
  },
  memberId?: string
): MemberFreezeRequest {
  const current = getMemberPortalState(memberId)
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

  const existing = getMemberFreezeRequests(current.memberId)
  saveMemberFreezeRequests([newRequest, ...existing], current.memberId)

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

export function renewOrUpgradePlan(
  planName: string,
  planTier: string,
  priceMinor: number,
  memberId?: string,
  paymentReference?: string
): MemberPortalState {
  const current = getMemberPortalState(memberId)
  const newExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const updated: MemberPortalState = {
    ...current,
    planName,
    planTier,
    daysRemaining: (current.daysRemaining ?? 0) + 365,
    expiryDate: newExpiry,
  }

  saveMemberPortalState(updated, memberId)

  // 1. Central Member Directory Update
  try {
    updateMember(current.memberId, {
      status: 'active',
      lifetime_value: (priceMinor || 0) + 5000000,
      active_memberships: [
        {
          id: `ms_upg_${Date.now()}`,
          category: 'gym_membership',
          product_name: planName,
          enrolment_date: new Date().toISOString().slice(0, 10),
          activation_date: new Date().toISOString().slice(0, 10),
          expiry_date: newExpiry,
          amount_paid: priceMinor,
          base_price: Math.round(priceMinor / 1.05),
          cgst_amount: Math.round(((priceMinor / 1.05) * 0.025)),
          sgst_amount: Math.round(((priceMinor / 1.05) * 0.025)),
          discount_amount: 0,
          discount_reason: null,
          discount_approved_by: null,
          tax_rate: 0.05,
          status: 'active',
          invoice_id: `inv_upg_${Date.now()}`,
          invoice_number: `DNA/2026-27/${Math.floor(1000 + Math.random() * 9000)}`,
          sales_rep_id: 'usr_online',
          sales_rep_name: 'Member Self-Service Online',
          sessions_total: planTier.includes('VIP') ? 20 : null,
          sessions_consumed: 0,
          sessions_remaining: planTier.includes('VIP') ? 20 : null,
          access_window: null,
          void_reason: null,
          voided_by: null,
          voided_at: null,
          transferred_from: null,
          transferred_to: null,
          transfer_fee_invoice_id: null,
        },
      ],
    })
  } catch (e) {
    console.error('Failed to sync member directory on upgrade:', e)
  }

  // 2. Central Tax Invoice Generation (Recorded in Billing Ledger)
  try {
    recordMembershipInvoice({
      memberId: current.memberId,
      memberName: current.memberName,
      memberPhone: current.phone,
      memberEmail: current.email,
      planName,
      amountInclusiveMinor: priceMinor,
      paymentMode: 'Razorpay Live',
      paymentReference: paymentReference || `rzp_live_${Date.now()}`,
      notes: `Member portal self-service upgrade: ${planName} (${planTier})`,
      createdBy: {
        id: current.memberId,
        name: current.memberName,
        role: 'Member',
      },
    })
  } catch (e) {
    console.error('Failed to record billing invoice on upgrade:', e)
  }

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

