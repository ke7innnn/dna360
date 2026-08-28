/* ============================================================
   DNA 360 — Member Portal Types
   
   Self-service portal — no freeze requests (no freeze policy).
   ============================================================ */

export interface MemberPortalState {
  memberId: string
  memberName: string
  memberCode: string
  phone: string
  email: string | null
  /** Active memberships (can have multiple) */
  activePlans?: {
    productName: string
    category: string
    expiryDate: string | null
    daysRemaining: number | null
    sessionsRemaining: number | null
    sessionsTotal: number | null
    accessWindow: { start: string; end: string } | null
  }[]
  attendanceStreak: number
  totalVisits: number
  planName?: string
  planTier?: string
  branchName?: string
  expiryDate?: string | null
  daysRemaining?: number | null
  ptSessionsRemaining?: number | null
  ptSessionsTotal?: number | null
  waterIntakeMl: number
  waterTargetMl: number
  /** Special inclusions (shown prominently) */
  specialInclusions?: string | null
  /** Pilates adjustment credits */
  adjustmentCreditsRemaining?: number
  /** QR check-in pass */
  qrToken: string
  qrExpiresInSeconds: number
}

export interface MemberClassBooking {
  id: string
  sessionId: string
  classTitle: string
  category: string
  instructorName: string
  date: string
  time: string
  studioName: string
  status: 'confirmed' | 'waitlisted'
}

export interface MemberFreezeRequest {
  id: string
  memberId: string
  memberName: string
  startDate: string
  endDate: string
  daysCount?: number
  reason: string
  notes?: string
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: string
}
