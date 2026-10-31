import type {
  MemberPortalState,
  MemberClassBooking,
  MemberFreezeRequest,
} from '@/types/memberportal'

export type { MemberPortalState, MemberClassBooking, MemberFreezeRequest }
import type { Member, MembershipRecord } from '@/types/member'
import type { GymPlan } from '@/types/billing'
import { getStoredMembers, updateMember } from '@/lib/members'
import { recordMembershipInvoice } from '@/lib/billing'
import { logAuditEvent } from '@/lib/audit'
import { getStoredSessions, cancelClassBooking } from '@/lib/classes'
import { toLocalDateStr, parseLocalDate } from '@/lib/dates'

const PORTAL_STATE_KEY = 'dna360_member_portal_state'
const PORTAL_WATER_KEY = 'dna360_member_water'
const PORTAL_FREEZE_KEY = 'dna360_member_portal_freeze'

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Neutral, zeroed portal state. It is only used when no member record can be
 * resolved (e.g. signed-out render) — it never contains another person's data.
 */
export const SEEDED_PORTAL_STATE: MemberPortalState = {
  memberId: '',
  memberName: 'Member',
  memberCode: '',
  phone: '',
  email: '',
  planName: 'No active plan',
  planTier: 'No active plan',
  branchName: 'DNA 360 Powai',
  expiryDate: null,
  daysRemaining: 0,
  activePlans: [],
  attendanceStreak: 0,
  totalVisits: 0,
  ptSessionsRemaining: 0,
  ptSessionsTotal: 0,
  waterIntakeMl: 0,
  waterTargetMl: 3500,
  qrToken: '',
  qrExpiresInSeconds: 0,
}

/**
 * Single source of truth for mapping whatever identifier the session/UI holds
 * (member id, member code, phone, e-mail or name) to the stored member record.
 * Returns null — never a different member — when there is no match.
 */
export function resolveMember(ref?: string | null): Member | null {
  if (!ref) return null
  const needle = ref.trim().toLowerCase()
  if (!needle) return null
  const members = getStoredMembers()
  return (
    members.find((m) => m.id.toLowerCase() === needle) ||
    members.find((m) => m.member_code?.toLowerCase() === needle) ||
    members.find((m) => m.phone === ref.trim()) ||
    members.find((m) => !!m.email && m.email.toLowerCase() === needle) ||
    members.find((m) => m.name.toLowerCase() === needle) ||
    null
  )
}

function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null
  const diff = parseLocalDate(dateStr).getTime() - parseLocalDate(toLocalDateStr()).getTime()
  return Math.max(0, Math.round(diff / DAY_MS))
}

// ─── Water intake (resets every local day) ───

function readWaterToday(memberId: string): number {
  if (typeof window === 'undefined') return 0
  try {
    const raw = localStorage.getItem(`${PORTAL_WATER_KEY}_${memberId}`)
    if (!raw) return 0
    const parsed = JSON.parse(raw) as { date: string; ml: number }
    return parsed.date === toLocalDateStr() ? Math.max(0, Number(parsed.ml) || 0) : 0
  } catch {
    return 0
  }
}

function writeWaterToday(memberId: string, ml: number) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(
      `${PORTAL_WATER_KEY}_${memberId}`,
      JSON.stringify({ date: toLocalDateStr(), ml })
    )
  } catch {}
}

/** The member's primary (gym) membership: first active gym plan, else first active, else first. */
function primaryMembership(m: Member): MembershipRecord | undefined {
  const list = m.active_memberships || []
  const isGym = (ms: MembershipRecord) =>
    (ms.category || ms.product_category || '') === 'gym_membership'
  return (
    list.find((ms) => ms.status === 'active' && isGym(ms)) ||
    list.find((ms) => ms.status === 'active') ||
    list[0]
  )
}

function isPtMembership(ms: MembershipRecord): boolean {
  const cat = ms.category || ms.product_category || ''
  return (
    cat === 'personal_training' ||
    (ms.sessions_total !== null && ms.sessions_total !== undefined && cat !== 'reformer_pilates' && cat !== 'pilates') ||
    /\bpt\b|personal/i.test(ms.product_name || '')
  )
}

/**
 * The portal state is always derived from the member record (the single
 * source of truth), so streak / visits / PT balance / plan can never drift.
 * Only the daily water counter is portal-owned.
 */
export function getMemberPortalState(memberId?: string): MemberPortalState {
  const found = resolveMember(memberId)
  if (!found) return SEEDED_PORTAL_STATE

  const primaryMs = primaryMembership(found)
  const expiry = primaryMs?.expiry_date ?? null

  const ptMs = found.active_memberships?.find((ms) => ms.status === 'active' && isPtMembership(ms))
  const ptSessionsRemaining = ptMs?.sessions_remaining ?? 0
  const ptSessionsTotal = ptMs?.sessions_total ?? 0

  return {
    memberId: found.id,
    memberName: found.name,
    memberCode: found.member_code,
    phone: found.phone,
    email: found.email || '',
    planName: primaryMs?.product_name || 'No active plan',
    planTier: primaryMs?.product_name || 'No active plan',
    branchName: 'DNA 360 Powai',
    expiryDate: expiry,
    daysRemaining: daysUntil(expiry) ?? 0,
    activePlans:
      found.active_memberships?.map((ms) => ({
        productName: ms.product_name,
        category: ms.category || ms.product_category || 'gym_membership',
        expiryDate: ms.expiry_date,
        daysRemaining: daysUntil(ms.expiry_date),
        sessionsRemaining: ms.sessions_remaining,
        sessionsTotal: ms.sessions_total,
        accessWindow: ms.access_window || null,
      })) || [],
    attendanceStreak: found.attendance_streak ?? 0,
    totalVisits: found.total_check_ins ?? 0,
    ptSessionsRemaining,
    ptSessionsTotal,
    waterIntakeMl: readWaterToday(found.id),
    waterTargetMl: 3500,
    specialInclusions: found.special_inclusions,
    adjustmentCreditsRemaining: found.adjustment_credits_remaining,
    assignedTrainer: found.assigned_trainer_name || undefined,
    qrToken: found.member_code,
    qrExpiresInSeconds: 0,
  }
}

export function saveMemberPortalState(state: MemberPortalState, memberId?: string) {
  if (typeof window === 'undefined') return
  const found = resolveMember(memberId || state.memberId)
  if (!found) return

  if (typeof state.waterIntakeMl === 'number') {
    writeWaterToday(found.id, state.waterIntakeMl)
  }

  // Sync streak / visits into the persistent members database
  if (typeof state.attendanceStreak === 'number') {
    updateMember(found.id, {
      attendance_streak: state.attendanceStreak,
      total_check_ins: state.totalVisits ?? found.total_check_ins,
      last_visit_at: new Date().toISOString(),
    })
  }

  window.dispatchEvent(new Event('dna360_memberportal_updated'))
}

// ─── Class bookings (derived from the single class-session engine) ───

export function getMemberBookings(memberId?: string): MemberClassBooking[] {
  const member = resolveMember(memberId)
  if (!member) return []
  const today = toLocalDateStr()

  const out: MemberClassBooking[] = []
  for (const s of getStoredSessions()) {
    if (s.date < today || s.status === 'cancelled') continue
    for (const b of s.bookings) {
      if (b.memberId !== member.id) continue
      if (b.status !== 'confirmed' && b.status !== 'waitlisted') continue
      out.push({
        id: b.id,
        sessionId: s.id,
        classTitle: s.title,
        category: s.category,
        instructorName: s.instructorName,
        date: s.date,
        time: `${s.startTime} - ${s.endTime}`,
        studioName: s.studioName,
        status: b.status,
      })
    }
  }
  return out.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
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

/** Member self-service cancellation — goes through the same engine (4h cutoff enforced). */
export function cancelMemberBooking(
  bookingId: string,
  memberId?: string
): { success: boolean; error?: string } {
  const member = resolveMember(memberId)
  if (!member) return { success: false, error: 'Member not found' }

  const session = getStoredSessions().find((s) => s.bookings.some((b) => b.id === bookingId))
  if (!session) return { success: false, error: 'Booking not found' }

  return cancelClassBooking({
    sessionId: session.id,
    bookingId,
    cancelledBy: { id: member.id, name: member.name, role: 'Member' },
  })
}

let memoryFreezeRequests: Record<string, MemberFreezeRequest[]> = {}

export function getMemberFreezeRequests(memberId?: string): MemberFreezeRequest[] {
  const targetId = resolveMember(memberId)?.id || memberId || ''
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
  const targetId = resolveMember(memberId)?.id || memberId || ''
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

function addMonthsLocal(base: Date, months: number): Date {
  const d = new Date(base.getFullYear(), base.getMonth() + months, base.getDate())
  // Guard month overflow (e.g. 31 Jan + 1 month)
  if (d.getDate() !== base.getDate()) d.setDate(0)
  return d
}

/**
 * Apply a plan purchase that Razorpay has already CONFIRMED (verified server-side).
 * - Renewing the same plan extends from the later of (current expiry, today).
 * - A different plan is added alongside existing memberships (nothing is wiped).
 * - PT sessions included in the plan are added to the member's balance.
 * - Exactly one tax invoice is recorded, for the amount that was actually paid.
 */
export function renewOrUpgradePlan(
  plan: Pick<GymPlan, 'id' | 'name' | 'durationMonths' | 'ptSessionsCount' | 'taxRate'> & {
    durationDays?: number
  },
  amountPaidMinor: number,
  memberId: string | undefined,
  paymentReference: string
): MemberPortalState {
  const member = resolveMember(memberId)
  if (!member) throw new Error('Member record not found — cannot apply plan.')

  const todayStr = toLocalDateStr()
  const existing = member.active_memberships.find(
    (ms) => ms.product_id === plan.id && ms.status !== 'void'
  )

  const baseStr =
    existing?.expiry_date && existing.expiry_date > todayStr ? existing.expiry_date : todayStr
  const baseDate = parseLocalDate(baseStr)
  const newExpiryDate =
    plan.durationMonths > 0
      ? addMonthsLocal(baseDate, plan.durationMonths)
      : new Date(baseDate.getTime() + (plan.durationDays ?? 1) * DAY_MS)
  const newExpiry = toLocalDateStr(newExpiryDate)

  const ptAdded = plan.ptSessionsCount || 0
  const invoice = recordMembershipInvoice({
    memberId: member.id,
    memberName: member.name,
    memberPhone: member.phone,
    memberEmail: member.email,
    planName: plan.name,
    amountInclusiveMinor: amountPaidMinor,
    paymentMode: 'Razorpay Live',
    paymentReference,
    notes: `Member portal self-service purchase: ${plan.name}`,
    createdBy: { id: member.id, name: member.name, role: 'Member' },
  })

  let memberships: MembershipRecord[]
  if (existing) {
    memberships = member.active_memberships.map((ms) =>
      ms.id === existing.id
        ? {
            ...ms,
            status: 'active',
            expiry_date: newExpiry,
            amount_paid: (ms.amount_paid || 0) + amountPaidMinor,
            invoice_id: invoice.id,
            invoice_number: invoice.invoiceNumber,
            sessions_total: ptAdded ? (ms.sessions_total ?? 0) + ptAdded : ms.sessions_total,
            sessions_remaining: ptAdded ? (ms.sessions_remaining ?? 0) + ptAdded : ms.sessions_remaining,
          }
        : ms
    )
  } else {
    const record: MembershipRecord = {
      id: `ms_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      product_id: plan.id,
      product_name: plan.name,
      product_category: 'gym_membership',
      category: 'gym_membership',
      enrolment_date: todayStr,
      activation_date: todayStr,
      expiry_date: newExpiry,
      amount_paid: amountPaidMinor,
      discount_amount: 0,
      discount_reason: null,
      discount_approved_by: null,
      tax_rate: plan.taxRate,
      status: 'active',
      invoice_id: invoice.id,
      invoice_number: invoice.invoiceNumber,
      sales_rep_id: 'usr_online',
      sales_rep_name: 'Member Self-Service Online',
      sessions_total: ptAdded || null,
      sessions_consumed: ptAdded ? 0 : null,
      sessions_remaining: ptAdded || null,
      access_window: null,
      void_reason: null,
      voided_by: null,
      voided_at: null,
      transferred_from: null,
      transferred_to: null,
      transfer_fee_invoice_id: null,
    }
    memberships = [...member.active_memberships, record]
  }

  updateMember(member.id, {
    status: 'active',
    lifetime_value: (member.lifetime_value || 0) + amountPaidMinor,
    active_memberships: memberships,
  })

  logAuditEvent({
    actor: { id: member.id, name: member.name, email: member.email || '', role: 'Member' },
    action: 'UPDATE',
    entity: 'MembershipPlan',
    entityId: invoice.id,
    branchId: 'pow',
    description: `Member purchased ${plan.name} for ₹${(amountPaidMinor / 100).toLocaleString('en-IN')} (Razorpay ${paymentReference})`,
    afterState: { planId: plan.id, expiry: newExpiry, invoiceNumber: invoice.invoiceNumber },
  })

  window.dispatchEvent(new Event('dna360_memberportal_updated'))
  return getMemberPortalState(member.id)
}
