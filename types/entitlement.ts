/* ============================================================
   DNA 360 — Entitlement Type
   
   Child of Membership with its own independent expiry.
   An annual package runs 12 months but its massage and body
   assessment entitlements expire in 2 months.
   ============================================================ */

import type { EntitlementType } from './product'

/** States an entitlement can be in */
export type EntitlementState = 'available' | 'consumed' | 'lapsed'

/**
 * Entitlement — a trackable benefit granted by a membership.
 * 
 * Entitlements have their own expiry independent of the parent
 * membership. When a membership is activated, its product's
 * bundled_entitlements are created as Entitlement records.
 * 
 * Session-based entitlements track consumed vs remaining counts.
 * A scheduled job flips remaining sessions to `lapsed` at expiry.
 */
export interface Entitlement {
  id: string
  /** FK to the parent membership */
  membership_id: string
  /** FK to the member for quick lookups */
  member_id: string
  /** Type of entitlement */
  type: EntitlementType
  /** Total units granted */
  total_count: number
  /** Units consumed (used by the member) */
  consumed_count: number
  /** Units lapsed (expired unused — set by the lapse job) */
  lapsed_count: number
  /** Remaining = total - consumed - lapsed */
  remaining_count: number
  /** Current state */
  state: EntitlementState
  /**
   * Independent expiry date (YYYY-MM-DD).
   * May differ from parent membership's expiry_date.
   */
  expiry_date: string
  /** FK to the product that granted this entitlement */
  product_id: string
  /** Human-readable label, e.g. "Deep Tissue Massage (60 min)" */
  label: string
  /** When this entitlement was created */
  created_at: string
  /** When this entitlement was last updated */
  updated_at: string
}

/**
 * Record of an entitlement being consumed.
 * Every session use, massage booking, InBody scan etc. writes one of these.
 */
export interface EntitlementUsageRecord {
  id: string
  entitlement_id: string
  member_id: string
  /** When the entitlement was consumed */
  consumed_at: string
  /** Who recorded it (staff ID) */
  recorded_by: string
  /** Optional notes, e.g. trainer name, session type */
  notes?: string
}

/**
 * Adjustment credit — special entitlement for Pilates.
 * Each Pilates membership gets 2 missed-session adjustments per tenure.
 * Tracked as a visible counter, decremented on use, shown to front desk.
 */
export interface AdjustmentCreditBalance {
  member_id: string
  membership_id: string
  total_credits: number   // always 2 per Pilates tenure
  used_credits: number
  remaining_credits: number
}
