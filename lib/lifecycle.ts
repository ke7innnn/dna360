/* ============================================================
   DNA 360 — Membership Lifecycle State Machine
   
   enrol → activate → expire → grace → block
   
   Key rules:
   - Activation within 15 days of enrolment
   - Expiry counts from activation, not enrolment
   - 7-day grace period after expiry
   - No freeze/hold (manager override with audit)
   - No downgrade, ever
   - Upgrade within config window (default 10 days)
   - Transfer: blood relatives only, fee by tenure remaining
   - No refunds, no cancellations
   - Sessions lapse at expiry
   ============================================================ */

import type { MembershipRecord } from '@/types/member'
import type { Entitlement, EntitlementState } from '@/types/entitlement'
import type { Product } from '@/types/product'
import { logAuditEvent } from '@/lib/audit'

// ─── Configuration (from settings, with defaults) ───

export interface LifecycleConfig {
  activation_window_days: number      // 15
  grace_period_days: number            // 7
  upgrade_window_days: number          // 10 (PENDING: form says "same month")
  transfer_fee_over_6_months: number   // 400000 paise (₹4,000)
  transfer_fee_under_6_months: number  // 200000 paise (₹2,000)
  transfer_fee_pilates: number         // 200000 paise (₹2,000)
}

export const DEFAULT_LIFECYCLE_CONFIG: LifecycleConfig = {
  activation_window_days: 15,
  grace_period_days: 7,
  upgrade_window_days: 10,
  transfer_fee_over_6_months: 400000,
  transfer_fee_under_6_months: 200000,
  transfer_fee_pilates: 200000,
}

const CONFIG_KEY = 'dna360_lifecycle_config'

export function getLifecycleConfig(): LifecycleConfig {
  if (typeof window === 'undefined') return DEFAULT_LIFECYCLE_CONFIG
  const stored = localStorage.getItem(CONFIG_KEY)
  if (!stored) return DEFAULT_LIFECYCLE_CONFIG
  try {
    return { ...DEFAULT_LIFECYCLE_CONFIG, ...JSON.parse(stored) }
  } catch {
    return DEFAULT_LIFECYCLE_CONFIG
  }
}

export function saveLifecycleConfig(config: LifecycleConfig) {
  if (typeof window === 'undefined') return
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
}

// ─── Date Helpers ───

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function daysBetween(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(dateStr1)
  const d2 = new Date(dateStr2)
  return Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

// ─── Lifecycle Operations ───

/**
 * Check if a membership can be activated.
 * Must be within activation_window_days of enrolment.
 */
export function canActivate(membership: MembershipRecord): { allowed: boolean; reason: string } {
  const config = getLifecycleConfig()

  if (membership.status !== 'pending_activation') {
    return { allowed: false, reason: `Membership is ${membership.status}, not pending activation` }
  }

  const daysFromEnrolment = daysBetween(membership.enrolment_date, today())
  if (daysFromEnrolment > config.activation_window_days) {
    return {
      allowed: false,
      reason: `Activation window expired. Must activate within ${config.activation_window_days} days of enrolment (enrolled ${daysFromEnrolment} days ago)`,
    }
  }

  return { allowed: true, reason: 'OK' }
}

/**
 * Activate a membership.
 * Sets activation_date to today, calculates expiry_date.
 */
export function activateMembership(
  membership: MembershipRecord,
  product: Product
): MembershipRecord {
  const check = canActivate(membership)
  if (!check.allowed) {
    throw new Error(`Cannot activate: ${check.reason}`)
  }

  const activationDate = today()
  const expiryDate = product.validity_days
    ? addDays(activationDate, product.validity_days)
    : null

  return {
    ...membership,
    activation_date: activationDate,
    expiry_date: expiryDate,
    status: 'active',
  }
}

/**
 * Check the effective status of a membership considering grace period.
 */
export function getEffectiveStatus(
  membership: MembershipRecord
): 'active' | 'grace_period' | 'expired' | 'pending_activation' | 'void' {
  if (membership.status === 'void') return 'void'
  if (membership.status === 'pending_activation') return 'pending_activation'

  if (!membership.expiry_date) return 'active'

  const config = getLifecycleConfig()
  const daysUntilExpiry = daysBetween(today(), membership.expiry_date)

  if (daysUntilExpiry > 0) return 'active'
  if (daysUntilExpiry >= -config.grace_period_days) return 'grace_period'
  return 'expired'
}

/**
 * Get days remaining on a membership, including grace period.
 */
export function getDaysRemaining(membership: MembershipRecord): {
  daysRemaining: number
  isGracePeriod: boolean
  graceDaysRemaining: number
} {
  if (!membership.expiry_date) {
    return { daysRemaining: Infinity, isGracePeriod: false, graceDaysRemaining: 0 }
  }

  const config = getLifecycleConfig()
  const daysUntilExpiry = daysBetween(today(), membership.expiry_date)

  if (daysUntilExpiry > 0) {
    return { daysRemaining: daysUntilExpiry, isGracePeriod: false, graceDaysRemaining: 0 }
  }

  const graceDaysRemaining = config.grace_period_days + daysUntilExpiry
  if (graceDaysRemaining > 0) {
    return { daysRemaining: 0, isGracePeriod: true, graceDaysRemaining }
  }

  return { daysRemaining: 0, isGracePeriod: false, graceDaysRemaining: 0 }
}

/**
 * Check if a membership can be upgraded.
 * Only within upgrade_window_days of activation.
 * No downgrade ever.
 */
export function canUpgrade(
  membership: MembershipRecord,
  newProduct: Product,
  currentProduct: Product
): { allowed: boolean; reason: string } {
  const config = getLifecycleConfig()

  if (membership.status !== 'active' || !membership.activation_date) {
    return { allowed: false, reason: 'Membership must be active to upgrade' }
  }

  const daysSinceActivation = daysBetween(membership.activation_date, today())
  if (daysSinceActivation > config.upgrade_window_days) {
    return {
      allowed: false,
      reason: `Upgrade window expired. Must upgrade within ${config.upgrade_window_days} days of activation (activated ${daysSinceActivation} days ago)`,
    }
  }

  if (newProduct.list_price <= currentProduct.list_price) {
    return { allowed: false, reason: 'Downgrade is not allowed. New plan must be higher value.' }
  }

  return { allowed: true, reason: 'OK' }
}

/**
 * Calculate transfer fee based on remaining tenure.
 * First-degree blood relatives only.
 * 
 * Standard: ₹4,000 if >6 months remain, ₹2,000 if <6 months
 * Pilates: flat ₹2,000
 */
export function getTransferFee(
  membership: MembershipRecord,
  isPilates: boolean
): number {
  const config = getLifecycleConfig()

  if (isPilates) return config.transfer_fee_pilates

  if (!membership.expiry_date) return config.transfer_fee_over_6_months

  const monthsRemaining = daysBetween(today(), membership.expiry_date) / 30
  return monthsRemaining > 6
    ? config.transfer_fee_over_6_months
    : config.transfer_fee_under_6_months
}

/**
 * Create entitlements for a membership based on its product.
 * Each entitlement has its own independent expiry.
 */
export function createEntitlementsForProduct(
  membershipId: string,
  memberId: string,
  product: Product,
  activationDate: string
): Entitlement[] {
  const entitlements: Entitlement[] = []
  const now = new Date().toISOString()

  // Primary entitlement (sessions from the product itself)
  if (product.session_count) {
    entitlements.push({
      id: `ent_${Date.now()}_primary`,
      membership_id: membershipId,
      member_id: memberId,
      type: getEntitlementTypeForCategory(product.category),
      total_count: product.session_count,
      consumed_count: 0,
      lapsed_count: 0,
      remaining_count: product.session_count,
      state: 'available',
      expiry_date: product.validity_days ? addDays(activationDate, product.validity_days) : '9999-12-31',
      product_id: product.id,
      label: product.name,
      created_at: now,
      updated_at: now,
    })
  }

  // Bundled entitlements (e.g., annual gym includes massage, InBody)
  if (product.bundled_entitlements) {
    for (const bundle of product.bundled_entitlements) {
      entitlements.push({
        id: `ent_${Date.now()}_${bundle.type}_${Math.random().toString(36).slice(2, 6)}`,
        membership_id: membershipId,
        member_id: memberId,
        type: bundle.type,
        total_count: bundle.count,
        consumed_count: 0,
        lapsed_count: 0,
        remaining_count: bundle.count,
        state: 'available',
        expiry_date: addDays(activationDate, bundle.validity_days),
        product_id: product.id,
        label: `${product.name} — ${bundle.type.replace(/_/g, ' ')}`,
        created_at: now,
        updated_at: now,
      })
    }
  }

  // Pilates adjustment credits (2 per tenure)
  if (product.category === 'reformer_pilates' || product.category === 'reformer_pilates_pt') {
    entitlements.push({
      id: `ent_${Date.now()}_adj_credit`,
      membership_id: membershipId,
      member_id: memberId,
      type: 'adjustment_credit',
      total_count: 2,
      consumed_count: 0,
      lapsed_count: 0,
      remaining_count: 2,
      state: 'available',
      expiry_date: product.validity_days ? addDays(activationDate, product.validity_days) : '9999-12-31',
      product_id: product.id,
      label: 'Missed Session Adjustment Credits',
      created_at: now,
      updated_at: now,
    })
  }

  return entitlements
}

function getEntitlementTypeForCategory(category: string): import('@/types/product').EntitlementType {
  const map: Record<string, import('@/types/product').EntitlementType> = {
    gym_membership: 'gym_access',
    personal_training: 'pt_session',
    premium_pt: 'pt_session',
    elite_pt: 'pt_session',
    super_elite_pt: 'pt_session',
    premium_couple_pt: 'pt_session',
    elite_couple_pt: 'pt_session',
    reformer_pilates: 'pilates_session',
    reformer_pilates_pt: 'pilates_session',
    fitzone: 'fitzone_session',
    crossfit: 'crossfit_session',
    spinning: 'spinning_session',
    yoga: 'yoga_session',
    mma: 'mma_session',
    zumba: 'zumba_session',
    mat_pilates: 'mat_pilates_session',
    dance_class: 'dance_session',
    hyrox: 'hyrox_session',
    massage: 'massage',
    body_assessment: 'body_assessment',
    ice_bath: 'ice_bath',
    locker: 'locker',
    group_activity: 'group_class_session',
  }
  return map[category] || 'gym_access'
}

/**
 * Lapse expired entitlements.
 * Flips remaining sessions to `lapsed` at expiry.
 * Records the count for reporting.
 * 
 * This should run as a scheduled job.
 */
export function lapseExpiredEntitlements(entitlements: Entitlement[]): {
  updated: Entitlement[]
  lapsedCount: number
  lapsedEntitlementIds: string[]
} {
  const todayStr = today()
  let lapsedCount = 0
  const lapsedEntitlementIds: string[] = []

  const updated = entitlements.map(ent => {
    if (ent.state !== 'available') return ent
    if (ent.expiry_date > todayStr) return ent

    // Lapse the remaining
    const remaining = ent.remaining_count
    lapsedCount += remaining
    lapsedEntitlementIds.push(ent.id)

    return {
      ...ent,
      lapsed_count: ent.lapsed_count + remaining,
      remaining_count: 0,
      state: 'lapsed' as EntitlementState,
      updated_at: new Date().toISOString(),
    }
  })

  return { updated, lapsedCount, lapsedEntitlementIds }
}
