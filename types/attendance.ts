/* ============================================================
   DNA 360 — Access Control & Attendance Types
   
   Provider-agnostic check-in with QR first.
   Clean interface for biometric adapter (device PENDING).
   ============================================================ */

export type AccessDecision =
  | 'GRANTED'
  | 'GRANTED_GRACE_PERIOD'     // within 7-day grace window
  | 'DENIED_EXPIRED'           // past grace period
  | 'DENIED_BLACKLISTED'       // blacklist flag
  | 'DENIED_NO_SESSIONS'       // session balance exhausted
  | 'DENIED_OUTSIDE_HOURS'     // Happy Hours violation
  | 'DENIED_NOT_ACTIVATED'     // membership not yet activated
  | 'MANUAL_OVERRIDE'          // staff override with reason

/** Provider-agnostic scan type. QR first, biometric adapter PENDING. */
export type ScanType = 'QR' | 'Biometric' | 'Manual'

export interface AccessLogEntry {
  id: string
  timestamp: string // ISO UTC
  memberId: string
  memberName: string
  memberPhone: string
  memberCode?: string
  gateId?: string
  gateName?: string
  scanType: ScanType
  decision: AccessDecision
  /** Human-readable reason (always populated, especially for denials) */
  reason: string
  /** If denied outside Happy Hours, the charge to collect */
  dayPassChargeMinor?: number
  /** If manual override, who overrode and why */
  overrideBy?: string
  overrideReason?: string
  /** Grace period days remaining (if GRANTED_GRACE_PERIOD) */
  graceDaysRemaining?: number
  /** Special inclusions to show at desk */
  specialInclusions?: string
  /** Adjustment credits remaining (Pilates) */
  adjustmentCreditsRemaining?: number
}

export interface FloorOccupancy {
  currentCount: number
  maxCapacity: number
  peakTimeToday: string
  avgDwellMinutes: number
}

export interface AttendanceFilterOptions {
  search?: string
  decision?: string
  date?: string
  branchId?: string
}

export interface GateDevice {
  id: string
  name: string
  branchId: string
  branchName: string
  type: 'entry' | 'exit' | 'steam_zone'
  status: 'online' | 'offline' | 'emergency_unlocked'
  ipAddress: string
  lastHeartbeat: string
}
