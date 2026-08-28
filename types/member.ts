/* ============================================================
   DNA 360 — Member Types
   
   Three-date lifecycle: enrolment → activation → expiry
   Concurrent memberships (Gym + PT + Pilates + Locker)
   No Aadhaar numbers or scanned ID images stored
   ============================================================ */

import type { EntitlementType } from './product'

export type MemberStatus =
  | 'active'           // at least one active membership
  | 'expiring_soon'    // membership expiring within 15 days
  | 'grace_period'     // expired but within 7-day grace window
  | 'inactive'         // all memberships expired, past grace
  | 'blacklisted'      // blacklisted by admin

/** ID document types — we store type + last 4 digits only, never full numbers */
export type IdDocumentType = 'Aadhaar' | 'PAN' | 'Passport' | 'Driving License' | 'Voter ID'

/**
 * KYC — Identity verification record.
 * 
 * CRITICAL: Never store full Aadhaar numbers or scanned ID images.
 * Store document type, verified boolean, verifier, timestamp,
 * and last 4 digits at most. The legacy data has 3 Govt ID values
 * and 0 PANs across 679 members.
 */
export interface MemberKYC {
  /** Type of ID document presented */
  id_type: IdDocumentType | null
  /** Last 4 digits only — NEVER the full number */
  id_last_four: string | null
  /** Whether the document was verified in person */
  id_verified: boolean
  /** Staff member who verified the document */
  id_verifier: string | null
  /** When verification was performed (ISO timestamp) */
  id_verified_at: string | null
  /** Blood group */
  blood_group: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | null
  /** Emergency contact */
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  emergency_contact_relation: string | null
  /** Medical notes visible to trainers */
  medical_notes: string | null
  medicalNotes?: string | null
  /** Known injuries */
  injuries: string | null
}

/**
 * Marketing consent — per channel, independently tracked.
 * 
 * 679/679 members have mobile (100%), only 48 have email (7%).
 * No WhatsApp consent exists in legacy data — must be captured fresh.
 */
export interface MarketingConsent {
  sms: boolean
  email: boolean
  whatsapp: boolean
  /** When consent was last updated */
  updated_at: string | null
}

/**
 * Membership — a purchased plan attached to a member.
 * 
 * A member can hold MULTIPLE concurrent memberships
 * (Gym + PT + Pilates + Locker is normal, not an edge case).
 * 
 * Three distinct dates that must NOT be merged:
 * - enrolment_date: when the sale was made
 * - activation_date: when the member starts using it (within 15 days of enrolment)
 * - expiry_date: calculated from activation_date + validity_days
 */
export interface MembershipRecord {
  id: string
  /** FK to the product purchased */
  product_id: string
  product_name: string
  product_category: string
  /**
   * When the sale was made.
   * Activation must occur within 15 days of this date.
   */
  enrolment_date: string // YYYY-MM-DD
  /**
   * When the member starts using the membership.
   * Expiry counts from this date, not enrolment.
   * null if not yet activated.
   */
  activation_date: string | null // YYYY-MM-DD
  /**
   * When the membership expires.
   * Calculated as activation_date + product's validity_days.
   * null if not yet activated.
   */
  expiry_date: string | null // YYYY-MM-DD
  /** GST-inclusive price paid in paise */
  amount_paid: number
  /** Discount applied in paise */
  discount_amount: number
  /** Discount reason (mandatory for any discount) */
  discount_reason: string | null
  /** Who approved the discount (null if within ceiling, staff ID if manager override) */
  discount_approved_by: string | null
  /** Tax rate applied (from product) */
  tax_rate: number
  /** Membership status */
  status: 'pending_activation' | 'active' | 'expired' | 'void'
  /** FK to the invoice */
  invoice_id: string
  invoice_number: string
  /** Sales rep who closed this sale */
  sales_rep_id: string
  sales_rep_name: string
  /** Session-based tracking */
  sessions_total: number | null
  sessions_consumed: number | null
  sessions_remaining: number | null
  /** Access window if time-restricted */
  access_window: { start: string; end: string } | null
  /** Void reason and audit (soft delete only) */
  void_reason: string | null
  voided_by: string | null
  voided_at: string | null
  /** Transfer details if this membership was transferred */
  transferred_from: string | null  // member ID
  transferred_to: string | null    // member ID
  transfer_fee_invoice_id: string | null
}

export interface AttendanceRecord {
  id: string
  timestamp: string // ISO UTC
  gate: string
  method: 'QR Code' | 'Biometric' | 'Manual Override'
  /** Reason for manual override (mandatory if method is Manual Override) */
  override_reason?: string
  /** Staff who performed override */
  recorded_by?: string
  /** Access decision for this check-in */
  decision: 'granted' | 'denied' | 'grace_period'
  /** Denial reason if applicable */
  denial_reason?: string
}

export interface FitnessMetric {
  id: string
  date: string // YYYY-MM-DD
  weightKg: number
  bodyFatPct: number
  bmi: number
  muscleMassKg: number
  chestCm?: number
  waistCm?: number
  hipsCm?: number
  notes?: string
}

export interface StaffNote {
  id: string
  authorId: string
  authorName: string
  authorRole: string
  timestamp: string
  content: string
  type: 'general' | 'call' | 'followup' | 'medical' | 'warning'
}

/**
 * Member — the central entity.
 * 
 * Key differences from the prototype:
 * - activeMemberships (plural) — concurrent memberships are normal
 * - blacklisted, complimentary, special_inclusions flags
 * - referred_by FK (104 of 679 have one, referral programme is live)
 * - Marketing consent per channel
 * - KYC stores last 4 digits only, never full ID numbers
 * - media_consent from Pilates clause 9
 */
export interface Member {
  id: string
  member_code: string // e.g. "DNA-2025-0892"
  memberCode?: string // Convenience alias
  first_name: string
  last_name: string
  name: string
  email: string | null // only 48 of 679 have email (7%)
  phone: string // E.164 (+91...) — 100% coverage
  gender: 'male' | 'female' | 'other'
  dob: string | null // YYYY-MM-DD — 40% coverage
  avatar_url?: string
  joined_date: string // YYYY-MM-DD
  status: MemberStatus
  /** All active and recent memberships — a member can have many */
  active_memberships: MembershipRecord[]
  past_memberships: MembershipRecord[]
  /** KYC — last 4 digits only, no scanned documents */
  kyc: MemberKYC
  /** Marketing consent per channel */
  consent: MarketingConsent
  /** Attendance tracking */
  attendance_streak: number
  last_visit_at: string | null
  total_check_ins: number
  /** Fitness tracking */
  fitness_metrics: FitnessMetric[]
  /** Staff notes */
  staff_notes: StaffNote[]
  tags: string[]

  // ─── DNA 360 specific fields ───

  /** Blacklisted — blocked at check-in */
  blacklisted: boolean
  blacklist_reason: string | null
  blacklisted_by: string | null
  blacklisted_at: string | null

  /** Complimentary member — no charges */
  complimentary: boolean

  /**
   * Free-text "special inclusions" — negotiated extra facilities.
   * Explicit stated pain point: they have nowhere to record this.
   * MUST be shown at check-in and on renewal.
   */
  special_inclusions: string | null

  /** Referral programme — 104 of 679 have a referrer */
  referred_by: string | null // member ID FK
  referral_code: string | null

  /** Lifetime value (derived, in paise) */
  lifetime_value: number

  /** Media consent from Pilates clause 9 */
  media_consent: boolean | null // null = not yet asked

  /** Pilates adjustment credits remaining (2 per tenure) */
  adjustment_credits_remaining: number

  /** Assigned trainer (may be null) */
  assigned_trainer_id: string | null
  assigned_trainer_name: string | null
}

export interface MemberFilterOptions {
  search?: string
  status?: string
  planType?: string
  trainerId?: string
  expiringDays?: number
  blacklisted?: boolean
  complimentary?: boolean
}
