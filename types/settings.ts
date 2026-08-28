/* ============================================================
   DNA 360 — Settings Types
   
   Legal entity: Base Fitness Private Limited
   GSTIN: 27AAICB3300R1ZH
   Single location: Hiranandani Gardens, Powai, Mumbai
   
   All PENDING items stored as editable config fields.
   ============================================================ */

import type { UserSession } from './auth'
export type { UserSession }

/**
 * BusinessProfile — correct entity details.
 * 
 * Previous code had wrong legal entity name and GSTIN.
 * This is critical because it goes on every invoice.
 */
export interface BusinessProfile {
  clubName: string               // "DNA 360 Fitness"
  legalEntityName: string        // "Base Fitness Private Limited"
  gstin: string                  // "27AAICB3300R1ZH"
  /** Default SAC code for fitness services */
  sacCode: string                // "999723"
  pan: string                    // derived from GSTIN
  address: string                // "Knowledge Park, 502, Hiranandani Gardens, Mumbai Suburban, Maharashtra 400076"
  stateCode: string              // "27" (Maharashtra)
  phone: string
  email: string
  website: string
  currency: string               // "INR"
  timezone: string               // "Asia/Kolkata"
}

/**
 * BranchConfig — single location for now.
 * Future multi-branch is deferred to later phases.
 */
export interface BranchConfig {
  id: string
  name: string
  code: string // "POW"
  address: string
  phone: string
  email: string
  capacity: number
  openingTime: string
  closingTime: string
  status: 'active' | 'provisioning' | 'closed'
  gateDeviceIds?: string[]
}

/**
 * All PENDING configuration values from the build prompt.
 * Each has a safe default. Nothing is guessed.
 * Some values BLOCK go-live if not set (marked below).
 */
export interface PendingConfig {
  // ─── Lifecycle Rules ───

  /** Days from enrolment within which member must activate. Default 15. */
  activation_window_days: number
  /** Days after expiry before access is blocked. Default 7. */
  grace_period_days: number
  /**
   * Days from activation within which upgrade is allowed.
   * PENDING: Form says "same month", T&C says 10 days.
   * Default 10, labelled clearly in admin.
   */
  upgrade_window_days: number

  // ─── Billing ───

  /**
   * Starting invoice number. BLOCKS GO-LIVE if null.
   * Invoice format: DNA/YYYY-YY/{this number, zero-padded to 4 digits}
   */
  starting_invoice_number: number | null
  /**
   * Maximum discount percentage that front desk (Fitness Consultants)
   * can apply without manager (Asst Sales Head) approval.
   * Default 0 = no discounts until explicitly set by admin.
   */
  discount_ceiling_pct: number
  /** Whether part payments / dues ledger is enabled. Default false. */
  dues_ledger_enabled: boolean

  // ─── PT Commission ───

  /** Commission percentage for PT sessions. Default 40. */
  pt_commission_pct: number
  /**
   * Basis for PT commission calculation. PENDING — do not compute payouts until set.
   * 'gross' = on list price
   * 'net_of_gst' = on taxable amount (excl. GST)
   * 'post_discount' = on amount after discount
   */
  pt_commission_basis: 'gross' | 'net_of_gst' | 'post_discount' | null
  /**
   * When commission is earned.
   * 'on_sale' = when the package is sold
   * 'on_delivery' = when each session is delivered
   */
  pt_commission_trigger: 'on_sale' | 'on_delivery' | null

  // ─── Access Control ───

  /**
   * Gym Happy Hours window.
   * Members on Happy Hours packages are BLOCKED outside this window.
   * Default: 12:00–15:30 per build prompt.
   */
  happy_hours_gym: { start: string; end: string }
  /**
   * Reformer Pilates Happy Hours window.
   * SEPARATE from gym Happy Hours — do not share one constant.
   * Default: 14:00–16:00 per studio timetable.
   */
  happy_hours_pilates: { start: string; end: string }
  /** Day pass charge for Happy Hours violation. Default ₹1,450. */
  happy_hours_day_pass_charge: number

  // ─── Scheduling ───

  /**
   * Reformer Pilates studio capacity per slot.
   * PENDING — needed before booking engine can enforce anything.
   * Ask client for bed count.
   */
  reformer_capacity: number | null
  /**
   * Whether an uncancelled no-show consumes the session.
   * PENDING — config toggle, default true, log every no-show either way.
   */
  no_show_consumes_session: boolean
  /** Advance booking window in days. Default 1. */
  advance_booking_days: number
  /** Cancellation cutoff in hours before class. Default 4. */
  cancellation_cutoff_hours: number

  // ─── Transfer Fees ───

  /** Transfer fee if >6 months remaining on membership (paise). Default ₹4,000. */
  transfer_fee_over_6_months: number
  /** Transfer fee if <6 months remaining (paise). Default ₹2,000. */
  transfer_fee_under_6_months: number
  /** Pilates transfer fee — flat rate (paise). Default ₹2,000. */
  transfer_fee_pilates: number
}

/**
 * Happy Hours configuration — two distinct windows.
 * These are NOT the same and must NOT share a constant.
 */
export interface HappyHoursConfig {
  gym: { start: string; end: string }     // 12:00–15:30
  pilates: { start: string; end: string } // 14:00–16:00
}

/** Bank account details for invoice footer (settings, not hardcoded) */
export interface BankDetails {
  bankName: string
  accountNumber: string
  ifscCode: string
  branchName: string
  accountType: 'Current' | 'Savings'
}

/** Notification gateway config — provider adapter pattern */
export interface NotificationGatewayConfig {
  /** WhatsApp BSP — disabled until API access is set up */
  whatsappEnabled: boolean
  /** WhatsApp Business Account ID (PENDING) */
  wabaId: string
  /** DLT entity ID for SMS */
  dltEntityId: string
  /** DLT sender ID */
  dltSenderId: string
  /** Auto-send triggers */
  autoSendInvoice: boolean
  autoSendRenewalReminder: boolean
  autoSendExpiryAlert: boolean
}

/** Payment gateway config — provider is PENDING */
export interface PaymentGatewayConfig {
  /** Online payment gateway enabled */
  onlinePaymentEnabled: boolean
  /** Gateway provider — PENDING, adapter pattern */
  gatewayProvider: string | null
  /** Manual payment recording always works */
  manualPaymentEnabled: boolean
}

/** Brand tokens sampled from the logo */
export interface BrandTokens {
  brandTeal: string   // '#1BA79C' — gradient start (top of mark)
  brandBlue: string   // '#2AA8E2' — gradient end (bottom of mark)
  brandInk: string    // '#000000' — wordmark, primary text
  brandGrey: string   // '#606060' — tagline, secondary text
  tagline: string     // "PRO HUMAN EVOLUTION"
}

export interface TurnstileDeviceConfig {
  id: string
  name: string
  branchId: string
  branchName?: string
  ipAddress: string
  port: number
  type: 'entry' | 'exit' | 'bidirectional'
  relayDurationMs: number
  firmwareVersion?: string
  pingMs?: number
  status: 'online' | 'offline' | 'unreachable'
  lastHeartbeatAt?: string
}
