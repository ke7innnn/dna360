/* ============================================================
   DNA 360 — Settings Store
   
   Correct legal entity: Base Fitness Private Limited
   Correct GSTIN: 27AAICB3300R1ZH
   Single location: Knowledge Park, 502, Hiranandani Gardens,
     Mumbai Suburban, Maharashtra 400076
   
   All PENDING config values stored with safe defaults.
   ============================================================ */

import type {
  BusinessProfile,
  BranchConfig,
  PendingConfig,
  BankDetails,
  NotificationGatewayConfig,
  PaymentGatewayConfig,
  BrandTokens,
  TurnstileDeviceConfig,
} from '@/types/settings'
import { logAuditEvent } from '@/lib/audit'

const PROFILE_KEY = 'dna360_settings_profile'
const BRANCHES_KEY = 'dna360_settings_branches'
const TURNSTILES_KEY = 'dna360_turnstiles_config'
const PENDING_CONFIG_KEY = 'dna360_pending_config'
const BANK_DETAILS_KEY = 'dna360_bank_details'
const NOTIFICATIONS_CONFIG_KEY = 'dna360_notifications_config'
const PAYMENTS_CONFIG_KEY = 'dna360_payments_config'

// ─── Correct Business Profile ───

export const SEEDED_PROFILE: BusinessProfile = {
  clubName: 'DNA 360 Fitness',
  legalEntityName: 'Base Fitness Private Limited',
  gstin: '27AAICB3300R1ZH',
  sacCode: '999723',
  pan: 'AAICB3300R', // derived from GSTIN positions 3-12
  address: 'Knowledge Park, 502, Hiranandani Gardens, Mumbai Suburban, Maharashtra 400076',
  stateCode: '27', // Maharashtra
  phone: '+919820036000',
  email: 'info@dna360fitness.in',
  website: 'https://dna360fitness.in',
  currency: 'INR',
  timezone: 'Asia/Kolkata',
}

// ─── Single Location (Powai only) ───

export const SEEDED_BRANCHES: BranchConfig[] = [
  {
    id: 'pow',
    name: 'Hiranandani Gardens, Powai',
    code: 'POW',
    address: 'Knowledge Park, 502, Hiranandani Gardens, Mumbai Suburban, Maharashtra 400076',
    phone: '+919820036000',
    email: 'info@dna360fitness.in',
    capacity: 200,
    openingTime: '06:00',
    closingTime: '22:00',
    status: 'active',
  },
]

// ─── PENDING Configuration Values ───

export const SEEDED_PENDING_CONFIG: PendingConfig = {
  // Lifecycle
  activation_window_days: 15,
  grace_period_days: 7,
  upgrade_window_days: 10,

  // Billing
  starting_invoice_number: null, // BLOCKS GO-LIVE
  discount_ceiling_pct: 0, // No discounts until set
  dues_ledger_enabled: false, // Feature flag OFF

  // PT Commission
  pt_commission_pct: 40,
  pt_commission_basis: null, // PENDING — don't compute payouts
  pt_commission_trigger: null, // PENDING

  // Access Control
  happy_hours_gym: { start: '12:00', end: '15:30' },
  happy_hours_pilates: { start: '14:00', end: '16:00' },
  happy_hours_day_pass_charge: 145000, // ₹1,450

  // Scheduling
  reformer_capacity: null, // PENDING — ask for bed count
  no_show_consumes_session: true,
  advance_booking_days: 1,
  cancellation_cutoff_hours: 4,

  // Transfer
  transfer_fee_over_6_months: 400000, // ₹4,000
  transfer_fee_under_6_months: 200000, // ₹2,000
  transfer_fee_pilates: 200000, // ₹2,000
}

// ─── Bank Details (for invoice footer) ───

export const SEEDED_BANK_DETAILS: BankDetails = {
  bankName: 'Axis Bank',
  accountNumber: '', // PENDING — from settings, not hardcoded
  ifscCode: '', // PENDING
  branchName: '', // PENDING
  accountType: 'Current',
}

// ─── Brand Tokens ───

export const BRAND_TOKENS: BrandTokens = {
  brandTeal: '#1BA79C',   // gradient start (top of mark)
  brandBlue: '#2AA8E2',   // gradient end (bottom of mark)
  brandInk: '#000000',    // wordmark, primary text
  brandGrey: '#606060',   // tagline, secondary text
  tagline: 'PRO HUMAN EVOLUTION',
}

// ─── Notification Config ───

export const SEEDED_NOTIFICATIONS_CONFIG: NotificationGatewayConfig = {
  whatsappEnabled: false, // Disabled — no BSP access
  wabaId: '',
  dltEntityId: '',
  dltSenderId: '',
  autoSendInvoice: true,
  autoSendRenewalReminder: true,
  autoSendExpiryAlert: true,
}

// ─── Payment Config ───

export const SEEDED_PAYMENTS_CONFIG: PaymentGatewayConfig = {
  onlinePaymentEnabled: true,
  gatewayProvider: 'Razorpay',
  manualPaymentEnabled: true, // Manual recording always works
}

// ─── Storage Helpers ───

export function getProfile(): BusinessProfile {
  if (typeof window === 'undefined') return SEEDED_PROFILE
  const stored = localStorage.getItem(PROFILE_KEY)
  if (!stored) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(SEEDED_PROFILE))
    return SEEDED_PROFILE
  }
  try { return JSON.parse(stored) } catch { return SEEDED_PROFILE }
}

export function saveProfile(profile: BusinessProfile) {
  if (typeof window === 'undefined') return
  const before = getProfile()
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
  logAuditEvent({
    actor: { id: 'system', name: 'Admin', email: '', role: 'Owner' },
    action: 'UPDATE',
    entity: 'BusinessProfile',
    entityId: 'profile',
    branchId: 'pow',
    description: 'Updated business profile',
    beforeState: before,
    afterState: profile,
  })
}

export function getBranches(): BranchConfig[] {
  if (typeof window === 'undefined') return SEEDED_BRANCHES
  const stored = localStorage.getItem(BRANCHES_KEY)
  if (!stored) {
    localStorage.setItem(BRANCHES_KEY, JSON.stringify(SEEDED_BRANCHES))
    return SEEDED_BRANCHES
  }
  try { return JSON.parse(stored) } catch { return SEEDED_BRANCHES }
}

export const getStoredBranches = getBranches

export function saveBranches(branches: BranchConfig[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(BRANCHES_KEY, JSON.stringify(branches))
}

export function saveBranch(branch: BranchConfig) {
  const branches = getStoredBranches()
  const index = branches.findIndex(b => b.id === branch.id)
  if (index >= 0) {
    branches[index] = branch
  } else {
    branches.push(branch)
  }
  saveBranches(branches)
}

export function getStoredTurnstiles(): TurnstileDeviceConfig[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(TURNSTILES_KEY)
  if (!stored) return []
  try { return JSON.parse(stored) } catch { return [] }
}

export function saveTurnstile(turnstile: TurnstileDeviceConfig) {
  const list = getStoredTurnstiles()
  const index = list.findIndex(t => t.id === turnstile.id)
  if (index >= 0) {
    list[index] = turnstile
  } else {
    list.push(turnstile)
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(TURNSTILES_KEY, JSON.stringify(list))
  }
}

export function getPendingConfig(): PendingConfig {
  if (typeof window === 'undefined') return SEEDED_PENDING_CONFIG
  const stored = localStorage.getItem(PENDING_CONFIG_KEY)
  if (!stored) {
    localStorage.setItem(PENDING_CONFIG_KEY, JSON.stringify(SEEDED_PENDING_CONFIG))
    return SEEDED_PENDING_CONFIG
  }
  try { return { ...SEEDED_PENDING_CONFIG, ...JSON.parse(stored) } } catch { return SEEDED_PENDING_CONFIG }
}

export function savePendingConfig(config: PendingConfig) {
  if (typeof window === 'undefined') return
  const before = getPendingConfig()
  localStorage.setItem(PENDING_CONFIG_KEY, JSON.stringify(config))
  logAuditEvent({
    actor: { id: 'system', name: 'Admin', email: '', role: 'Owner' },
    action: 'UPDATE',
    entity: 'PendingConfig',
    entityId: 'pending_config',
    branchId: 'pow',
    description: 'Updated system configuration',
    beforeState: before,
    afterState: config,
  })
}

export function getBankDetails(): BankDetails {
  if (typeof window === 'undefined') return SEEDED_BANK_DETAILS
  const stored = localStorage.getItem(BANK_DETAILS_KEY)
  if (!stored) return SEEDED_BANK_DETAILS
  try { return JSON.parse(stored) } catch { return SEEDED_BANK_DETAILS }
}

export function saveBankDetails(details: BankDetails) {
  if (typeof window === 'undefined') return
  localStorage.setItem(BANK_DETAILS_KEY, JSON.stringify(details))
}

export function getNotificationsConfig(): NotificationGatewayConfig {
  if (typeof window === 'undefined') return SEEDED_NOTIFICATIONS_CONFIG
  const stored = localStorage.getItem(NOTIFICATIONS_CONFIG_KEY)
  if (!stored) return SEEDED_NOTIFICATIONS_CONFIG
  try { return JSON.parse(stored) } catch { return SEEDED_NOTIFICATIONS_CONFIG }
}

export function saveNotificationsConfig(config: NotificationGatewayConfig) {
  if (typeof window === 'undefined') return
  localStorage.setItem(NOTIFICATIONS_CONFIG_KEY, JSON.stringify(config))
}

export function getPaymentsConfig(): PaymentGatewayConfig {
  if (typeof window === 'undefined') return SEEDED_PAYMENTS_CONFIG
  const stored = localStorage.getItem(PAYMENTS_CONFIG_KEY)
  if (!stored) return SEEDED_PAYMENTS_CONFIG
  try { return JSON.parse(stored) } catch { return SEEDED_PAYMENTS_CONFIG }
}

export function savePaymentsConfig(config: PaymentGatewayConfig) {
  if (typeof window === 'undefined') return
  localStorage.setItem(PAYMENTS_CONFIG_KEY, JSON.stringify(config))
}

/**
 * Check if system is ready for go-live.
 * Returns blockers that must be resolved.
 */
export function getGoLiveBlockers(): string[] {
  const config = getPendingConfig()
  const bank = getBankDetails()
  const blockers: string[] = []

  if (config.starting_invoice_number === null) {
    blockers.push('Starting invoice number is not set')
  }
  if (config.reformer_capacity === null) {
    blockers.push('Reformer Pilates studio capacity (bed count) is not set')
  }
  if (config.pt_commission_basis === null) {
    blockers.push('PT commission basis is not configured')
  }
  if (config.pt_commission_trigger === null) {
    blockers.push('PT commission trigger (on sale vs on delivery) is not configured')
  }
  if (!bank.accountNumber) {
    blockers.push('Bank account details for invoice footer are not set')
  }

  return blockers
}
