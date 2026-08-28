/* ============================================================
   DNA 360 — Check-in / Access Control Engine
   
   Provider-agnostic adapter. QR first.
   Clean interface for biometric (device PENDING).
   
   Evaluation order:
   1. Membership active or inside 7-day grace window
   2. Plan access window (Happy Hours)
   3. Session balance remaining
   4. Blacklist flag
   
   Two SEPARATE Happy Hours windows — do not share one constant:
   - Gym: 12:00–15:30
   - Pilates: 14:00–16:00
   ============================================================ */

import type { Member, MembershipRecord } from '@/types/member'
import type { AccessDecision, AccessLogEntry, ScanType } from '@/types/attendance'
import { getEffectiveStatus, getDaysRemaining } from '@/lib/lifecycle'
import { logAuditEvent } from '@/lib/audit'

const ACCESS_LOG_KEY = 'dna360_access_log'

// ─── Happy Hours Configuration ───

export interface HappyHoursWindows {
  gym: { start: string; end: string }
  pilates: { start: string; end: string }
}

export const DEFAULT_HAPPY_HOURS: HappyHoursWindows = {
  gym: { start: '12:00', end: '15:30' },
  pilates: { start: '14:00', end: '16:00' },
}

/** Day pass charge for Happy Hours violation */
export const HAPPY_HOURS_DAY_PASS_CHARGE = 145000 // ₹1,450 in paise

// ─── Access Decision Engine ───

export interface CheckInResult {
  decision: AccessDecision
  reason: string
  /** Whether the member is in grace period */
  isGracePeriod: boolean
  graceDaysRemaining: number
  /** Special inclusions to show at desk */
  specialInclusions: string | null
  /** Pilates adjustment credits remaining */
  adjustmentCreditsRemaining: number
  /** For Happy Hours violation: prompt to collect this charge */
  dayPassChargeMinor?: number
  /** The membership that grants access (null if denied) */
  grantingMembership?: MembershipRecord
}

/**
 * Evaluate whether a member can check in.
 * Returns a clear decision and reason.
 * 
 * Evaluation order (per build prompt §6):
 * 1. Blacklist flag
 * 2. Any active membership or inside grace window
 * 3. Plan access window (Happy Hours)
 * 4. Session balance remaining
 */
export function evaluateCheckIn(member: Member): CheckInResult {
  // 1. Blacklist check — first, absolute block
  if (member.blacklisted) {
    return {
      decision: 'DENIED_BLACKLISTED',
      reason: `Member is blacklisted. Reason: ${member.blacklist_reason || 'Not specified'}`,
      isGracePeriod: false,
      graceDaysRemaining: 0,
      specialInclusions: member.special_inclusions,
      adjustmentCreditsRemaining: member.adjustment_credits_remaining,
    }
  }

  // 2. Check for any active or grace-period membership
  const activeMemberships = member.active_memberships.filter(m => {
    const status = getEffectiveStatus(m)
    return status === 'active' || status === 'grace_period'
  })

  if (activeMemberships.length === 0) {
    return {
      decision: 'DENIED_EXPIRED',
      reason: 'No active membership. All memberships have expired beyond the grace period.',
      isGracePeriod: false,
      graceDaysRemaining: 0,
      specialInclusions: member.special_inclusions,
      adjustmentCreditsRemaining: member.adjustment_credits_remaining,
    }
  }

  // Find the best membership to grant access through
  let grantingMembership: MembershipRecord | null = null
  let isGracePeriod = false
  let graceDaysRemaining = 0

  for (const m of activeMemberships) {
    const status = getEffectiveStatus(m)
    const days = getDaysRemaining(m)

    // 3. Check access window (Happy Hours enforcement)
    if (m.access_window) {
      const isWithinWindow = isTimeWithinWindow(m.access_window.start, m.access_window.end)
      if (!isWithinWindow) {
        // Happy Hours violation — BLOCK, prompt to collect day pass
        return {
          decision: 'DENIED_OUTSIDE_HOURS',
          reason: `Happy Hours package — access restricted to ${m.access_window.start}–${m.access_window.end}. Member must pay ₹1,450 day pass for entry outside this window.`,
          isGracePeriod: false,
          graceDaysRemaining: 0,
          specialInclusions: member.special_inclusions,
          adjustmentCreditsRemaining: member.adjustment_credits_remaining,
          dayPassChargeMinor: HAPPY_HOURS_DAY_PASS_CHARGE,
        }
      }
    }

    // 4. Check session balance
    if (m.sessions_remaining !== null && m.sessions_remaining <= 0) {
      continue // Try next membership
    }

    // This membership grants access
    if (status === 'grace_period') {
      isGracePeriod = true
      graceDaysRemaining = days.graceDaysRemaining
    }

    grantingMembership = m
    break
  }

  // Check if all memberships failed session balance
  if (!grantingMembership) {
    return {
      decision: 'DENIED_NO_SESSIONS',
      reason: 'All session-based memberships have exhausted their session balance.',
      isGracePeriod: false,
      graceDaysRemaining: 0,
      specialInclusions: member.special_inclusions,
      adjustmentCreditsRemaining: member.adjustment_credits_remaining,
    }
  }

  // Check for pending activation
  if (grantingMembership.status === 'pending_activation') {
    return {
      decision: 'DENIED_NOT_ACTIVATED',
      reason: 'Membership is pending activation. Please activate at the front desk.',
      isGracePeriod: false,
      graceDaysRemaining: 0,
      specialInclusions: member.special_inclusions,
      adjustmentCreditsRemaining: member.adjustment_credits_remaining,
    }
  }

  // ACCESS GRANTED
  return {
    decision: isGracePeriod ? 'GRANTED_GRACE_PERIOD' : 'GRANTED',
    reason: isGracePeriod
      ? `Granted (grace period — ${graceDaysRemaining} days remaining). Renew membership to continue access.`
      : `Access granted via ${grantingMembership.product_name}`,
    isGracePeriod,
    graceDaysRemaining,
    specialInclusions: member.special_inclusions,
    adjustmentCreditsRemaining: member.adjustment_credits_remaining,
    grantingMembership,
  }
}

/**
 * Check if the current time is within an access window.
 */
function isTimeWithinWindow(startTime: string, endTime: string): boolean {
  const now = new Date()
  // Convert to IST (UTC+5:30)
  const istOffset = 5.5 * 60 * 60 * 1000
  const istNow = new Date(now.getTime() + istOffset + now.getTimezoneOffset() * 60 * 1000)
  
  const currentMinutes = istNow.getHours() * 60 + istNow.getMinutes()

  const [startH, startM] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)

  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes
}

// ─── Access Log ───

export function getAccessLog(): AccessLogEntry[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(ACCESS_LOG_KEY)
  if (!stored) return []
  try {
    return JSON.parse(stored)
  } catch {
    return []
  }
}

export function recordCheckIn(
  member: Member,
  result: CheckInResult,
  scanType: ScanType,
  overrideBy?: string,
  overrideReason?: string
): AccessLogEntry {
  const entry: AccessLogEntry = {
    id: `access_${Date.now()}`,
    timestamp: new Date().toISOString(),
    memberId: member.id,
    memberName: member.name,
    memberPhone: member.phone,
    scanType,
    decision: overrideBy ? 'MANUAL_OVERRIDE' : result.decision,
    reason: overrideBy ? `Manual override by ${overrideBy}: ${overrideReason}` : result.reason,
    dayPassChargeMinor: result.dayPassChargeMinor,
    overrideBy,
    overrideReason,
    graceDaysRemaining: result.graceDaysRemaining || undefined,
    specialInclusions: member.special_inclusions || undefined,
    adjustmentCreditsRemaining: member.adjustment_credits_remaining || undefined,
  }

  const log = getAccessLog()
  log.unshift(entry)
  if (typeof window !== 'undefined') {
    localStorage.setItem(ACCESS_LOG_KEY, JSON.stringify(log.slice(0, 5000)))
  }

  // Audit trail for overrides
  if (overrideBy) {
    logAuditEvent({
      actor: { id: overrideBy, name: overrideBy, email: '', role: 'Staff' },
      action: 'CHECKIN_OVERRIDE',
      entity: 'CheckIn',
      entityId: entry.id,
      branchId: 'pow',
      description: `Manual check-in override for ${member.name}: ${overrideReason}`,
      afterState: entry,
    })
  }

  return entry
}

// ─── QR Token (Provider-Agnostic Adapter Interface) ───

/**
 * Generate a rotating QR check-in token.
 * Token expires every 30 seconds for security.
 */
export function generateQRToken(memberId: string): { token: string; expiresAt: number } {
  const timestamp = Math.floor(Date.now() / 30000) // 30-second windows
  const token = btoa(`${memberId}:${timestamp}:${Math.random().toString(36).slice(2, 8)}`)
  return {
    token,
    expiresAt: (timestamp + 1) * 30000,
  }
}

/**
 * Validate a QR token and extract the member ID.
 * Returns null if the token is expired or invalid.
 */
export function validateQRToken(token: string): string | null {
  try {
    const decoded = atob(token)
    const [memberId, timestampStr] = decoded.split(':')
    const tokenTimestamp = parseInt(timestampStr, 10)
    const currentTimestamp = Math.floor(Date.now() / 30000)

    // Token is valid for current window and previous window (60 seconds total)
    if (currentTimestamp - tokenTimestamp > 1) return null

    return memberId
  } catch {
    return null
  }
}

// ─── Biometric Adapter Interface (PENDING) ───

/**
 * Biometric check-in adapter interface.
 * Device make and model are PENDING.
 * Nothing couples to a specific SDK.
 */
export interface BiometricAdapter {
  /** Initialize the biometric device */
  initialize(): Promise<boolean>
  /** Scan and identify a member */
  scan(): Promise<{ memberId: string | null; confidence: number }>
  /** Get device status */
  getStatus(): Promise<'online' | 'offline' | 'error'>
  /** Disconnect from the device */
  disconnect(): Promise<void>
}
