/* ============================================================
   DNA 360 — Product Catalogue Type
   
   Config-driven, admin-editable product catalogue.
   205 Gymex SKUs → ~120 canonical products after dedup.
   ============================================================ */

/** 24 real product categories from the Gymex export */
export type ProductCategory =
  | 'gym_membership'
  | 'personal_training'
  | 'premium_pt'
  | 'elite_pt'
  | 'super_elite_pt'
  | 'premium_couple_pt'
  | 'elite_couple_pt'
  | 'reformer_pilates'
  | 'reformer_pilates_pt'
  | 'fitzone'
  | 'group_activity'
  | 'crossfit'
  | 'spinning'
  | 'zumba'
  | 'yoga'
  | 'mat_pilates'
  | 'mma'
  | 'dance_class'
  | 'hyrox'
  | 'massage'
  | 'body_assessment'
  | 'ice_bath'
  | 'locker'
  | 'marketing'
  | 'video_shoot'
  | 'display_item'
  | 'day_pass'
  | 'corporate'

/** Access window for time-restricted packages (Happy Hours etc.) */
export interface AccessWindow {
  start: string // HH:MM format, e.g. "12:00"
  end: string   // HH:MM format, e.g. "15:30"
  label: string // e.g. "Happy Hours", "Trial Window"
}

/**
 * Product — a purchasable item in the catalogue.
 * 
 * All prices are GST-inclusive. Tax is back-calculated,
 * never added on top. This is the fundamental invariant.
 * 
 * A product may be limited by sessions, by days, or by both —
 * whichever exhausts first.
 */
export interface Product {
  id: string
  name: string
  category: ProductCategory
  /** GST-inclusive list price in paise */
  list_price: number
  /** Tax rate as a decimal: 0.05 for fitness (default), 0.18 for marketing/shoots */
  tax_rate: number
  /** SAC code — 999723 for fitness services */
  sac_code: string
  /** Number of sessions included, null if unlimited / not session-based */
  session_count: number | null
  /** Validity in days from activation, null if not time-limited */
  validity_days: number | null
  /** Whether this is a renewal variant (currently Reformer Pilates only) */
  is_renewal_variant: boolean
  /** Whether this is a trial product */
  is_trial: boolean
  /** Time-of-day access restriction, null if no restriction */
  access_window: AccessWindow | null
  /** Whether this is a couple/pair product */
  couple: boolean
  /** Whether this product is currently available for sale */
  active: boolean
  /**
   * Flag for products whose naming is disputed between client's
   * requirement form and Gymex catalogue. Must be resolved before
   * migration. Affects 71% of member base (annual gym packages).
   */
  pending_name_confirmation: boolean
  /** Optional description / included facilities */
  description?: string
  /** Entitlements this product grants (beyond the primary session/validity) */
  bundled_entitlements?: BundledEntitlement[]
  /** Display order within category */
  sort_order: number
}

/** Entitlement bundled with a product (e.g., annual gym includes 2-month massage) */
export interface BundledEntitlement {
  type: EntitlementType
  count: number
  validity_days: number // independent expiry
}

/** Types of entitlements a membership can carry */
export type EntitlementType =
  | 'gym_access'
  | 'pt_session'
  | 'pilates_session'
  | 'group_class_session'
  | 'massage'
  | 'body_assessment'
  | 'ice_bath'
  | 'locker'
  | 'adjustment_credit'
  | 'spinning_session'
  | 'crossfit_session'
  | 'yoga_session'
  | 'mma_session'
  | 'zumba_session'
  | 'mat_pilates_session'
  | 'dance_session'
  | 'hyrox_session'
  | 'fitzone_session'

export interface ProductFilterOptions {
  search?: string
  category?: ProductCategory | 'all'
  active?: boolean | 'all'
  is_trial?: boolean
  is_renewal?: boolean
}
