/* ============================================================
   DNA 360 — Product Catalogue
   
   ~120 canonical SKUs seeded from the Gymex export (205 rows
   across 24 categories) after deduplication and cleanup:
   
   1. Session counts extracted from product name strings
   2. ~40 duplicate/near-duplicate SKUs removed
   3. 10x price error fixed (₹7,31,159 → ₹73,159)
   4. Blank pricetype treated as "Including Tax"
   
   All prices are GST-inclusive. Tax rate per product.
   ============================================================ */

import type { Product, ProductCategory, ProductFilterOptions } from '@/types/product'
import { logAuditEvent } from '@/lib/audit'

const PRODUCTS_STORAGE_KEY = 'dna360_products'

// ─── Helper to create product IDs ───
let productIdCounter = 0
function pid(): string {
  productIdCounter++
  return `prod_${String(productIdCounter).padStart(3, '0')}`
}

/**
 * Canonical product catalogue.
 * 
 * Prices are in paise, GST-inclusive.
 * Tax rate: 0.05 (5%) for fitness, 0.18 (18%) for marketing/shoots.
 * 
 * Session counts and validity extracted from product names and
 * human-verified per the build prompt.
 */
export const SEEDED_PRODUCTS: Product[] = [

  // ════════════════════════════════════════════════════════════════
  // GYM MEMBERSHIP
  // NOTE: Annual package naming is PENDING — form vs Gymex conflict.
  // All annual variants seeded with pending_name_confirmation: true.
  // ════════════════════════════════════════════════════════════════

  { id: pid(), name: 'Annual Gym Membership Package 1', category: 'gym_membership', list_price: 4350000, tax_rate: 0.05, sac_code: '999723', session_count: null, validity_days: 365, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: true, sort_order: 1 },
  { id: pid(), name: 'Annual Gym Membership — Ice Bath Included', category: 'gym_membership', list_price: 5500000, tax_rate: 0.05, sac_code: '999723', session_count: null, validity_days: 365, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: true, sort_order: 2 },
  { id: pid(), name: 'Annual Gym Membership — All Activities', category: 'gym_membership', list_price: 6549900, tax_rate: 0.05, sac_code: '999723', session_count: null, validity_days: 365, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: true, sort_order: 3 },
  { id: pid(), name: 'Annual Happy Hours Gym Membership', category: 'gym_membership', list_price: 2999900, tax_rate: 0.05, sac_code: '999723', session_count: null, validity_days: 365, is_renewal_variant: false, is_trial: false, access_window: { start: '12:00', end: '15:30', label: 'Happy Hours' }, couple: false, active: true, pending_name_confirmation: true, sort_order: 4, description: 'Access restricted to 12:00–15:30. Entry outside this window requires ₹1,450 day pass.' },
  { id: pid(), name: 'Gym Day Pass', category: 'day_pass', list_price: 145000, tax_rate: 0.05, sac_code: '999723', session_count: 1, validity_days: 1, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 5, description: 'Single-day full gym access. Also used for Happy Hours violations.' },

  // ════════════════════════════════════════════════════════════════
  // PERSONAL TRAINING (General / non-tiered)
  // ════════════════════════════════════════════════════════════════

  { id: pid(), name: 'Personal Training — 1 Month / 30 Sessions', category: 'personal_training', list_price: 1099900, tax_rate: 0.05, sac_code: '999723', session_count: 30, validity_days: 30, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 1 },

  // ════════════════════════════════════════════════════════════════
  // PREMIUM PT — ₹1,699/session
  // ════════════════════════════════════════════════════════════════

  { id: pid(), name: 'Premium PT — 1 Session', category: 'premium_pt', list_price: 169900, tax_rate: 0.05, sac_code: '999723', session_count: 1, validity_days: 7, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 1 },
  { id: pid(), name: 'Premium PT — 12 Sessions', category: 'premium_pt', list_price: 2038800, tax_rate: 0.05, sac_code: '999723', session_count: 12, validity_days: 30, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 2 },
  { id: pid(), name: 'Premium PT — 36 Sessions', category: 'premium_pt', list_price: 6116400, tax_rate: 0.05, sac_code: '999723', session_count: 36, validity_days: 90, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 3 },
  { id: pid(), name: 'Premium PT — 72 Sessions', category: 'premium_pt', list_price: 12232800, tax_rate: 0.05, sac_code: '999723', session_count: 72, validity_days: 180, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 4 },
  { id: pid(), name: 'Premium PT — 144 Sessions', category: 'premium_pt', list_price: 24465600, tax_rate: 0.05, sac_code: '999723', session_count: 144, validity_days: 365, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 5 },

  // ════════════════════════════════════════════════════════════════
  // ELITE PT — ₹1,999/session
  // ════════════════════════════════════════════════════════════════

  { id: pid(), name: 'Elite PT — 1 Session', category: 'elite_pt', list_price: 199900, tax_rate: 0.05, sac_code: '999723', session_count: 1, validity_days: 7, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 1 },
  { id: pid(), name: 'Elite PT — 12 Sessions', category: 'elite_pt', list_price: 2398800, tax_rate: 0.05, sac_code: '999723', session_count: 12, validity_days: 30, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 2 },
  { id: pid(), name: 'Elite PT — 36 Sessions', category: 'elite_pt', list_price: 7196400, tax_rate: 0.05, sac_code: '999723', session_count: 36, validity_days: 90, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 3 },
  { id: pid(), name: 'Elite PT — 72 Sessions', category: 'elite_pt', list_price: 14392800, tax_rate: 0.05, sac_code: '999723', session_count: 72, validity_days: 180, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 4 },
  { id: pid(), name: 'Elite PT — 144 Sessions', category: 'elite_pt', list_price: 28785600, tax_rate: 0.05, sac_code: '999723', session_count: 144, validity_days: 365, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 5 },

  // ════════════════════════════════════════════════════════════════
  // SUPER ELITE PT — ₹2,499/session
  // ════════════════════════════════════════════════════════════════

  { id: pid(), name: 'Super Elite PT — 1 Session', category: 'super_elite_pt', list_price: 249900, tax_rate: 0.05, sac_code: '999723', session_count: 1, validity_days: 7, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 1 },
  { id: pid(), name: 'Super Elite PT — 12 Sessions', category: 'super_elite_pt', list_price: 2998800, tax_rate: 0.05, sac_code: '999723', session_count: 12, validity_days: 30, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 2 },
  { id: pid(), name: 'Super Elite PT — 36 Sessions', category: 'super_elite_pt', list_price: 8996400, tax_rate: 0.05, sac_code: '999723', session_count: 36, validity_days: 90, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 3 },
  { id: pid(), name: 'Super Elite PT — 72 Sessions', category: 'super_elite_pt', list_price: 17992800, tax_rate: 0.05, sac_code: '999723', session_count: 72, validity_days: 180, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 4 },
  { id: pid(), name: 'Super Elite PT — 144 Sessions', category: 'super_elite_pt', list_price: 35985600, tax_rate: 0.05, sac_code: '999723', session_count: 144, validity_days: 365, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 5 },

  // ════════════════════════════════════════════════════════════════
  // PREMIUM COUPLE PT — ₹2,399/day
  // ════════════════════════════════════════════════════════════════

  { id: pid(), name: 'Premium Couple PT — 12 Sessions', category: 'premium_couple_pt', list_price: 2878800, tax_rate: 0.05, sac_code: '999723', session_count: 12, validity_days: 30, is_renewal_variant: false, is_trial: false, access_window: null, couple: true, active: true, pending_name_confirmation: false, sort_order: 1 },
  { id: pid(), name: 'Premium Couple PT — 36 Sessions (3 Months)', category: 'premium_couple_pt', list_price: 7315900, tax_rate: 0.05, sac_code: '999723', session_count: 36, validity_days: 90, is_renewal_variant: false, is_trial: false, access_window: null, couple: true, active: true, pending_name_confirmation: false, sort_order: 2, description: 'Confirmed price: ₹73,159 (NOT ₹7,31,159 — the 10x error has been corrected)' },
  { id: pid(), name: 'Premium Couple PT — 72 Sessions', category: 'premium_couple_pt', list_price: 17270400, tax_rate: 0.05, sac_code: '999723', session_count: 72, validity_days: 180, is_renewal_variant: false, is_trial: false, access_window: null, couple: true, active: true, pending_name_confirmation: false, sort_order: 3 },
  { id: pid(), name: 'Premium Couple PT — 144 Sessions', category: 'premium_couple_pt', list_price: 34540800, tax_rate: 0.05, sac_code: '999723', session_count: 144, validity_days: 365, is_renewal_variant: false, is_trial: false, access_window: null, couple: true, active: true, pending_name_confirmation: false, sort_order: 4 },

  // ════════════════════════════════════════════════════════════════
  // ELITE COUPLE PT — ₹3,199/day
  // ════════════════════════════════════════════════════════════════

  { id: pid(), name: 'Elite Couple PT — 12 Sessions', category: 'elite_couple_pt', list_price: 3838800, tax_rate: 0.05, sac_code: '999723', session_count: 12, validity_days: 30, is_renewal_variant: false, is_trial: false, access_window: null, couple: true, active: true, pending_name_confirmation: false, sort_order: 1 },
  { id: pid(), name: 'Elite Couple PT — 36 Sessions', category: 'elite_couple_pt', list_price: 11516400, tax_rate: 0.05, sac_code: '999723', session_count: 36, validity_days: 90, is_renewal_variant: false, is_trial: false, access_window: null, couple: true, active: true, pending_name_confirmation: false, sort_order: 2 },
  { id: pid(), name: 'Elite Couple PT — 72 Sessions', category: 'elite_couple_pt', list_price: 23032800, tax_rate: 0.05, sac_code: '999723', session_count: 72, validity_days: 180, is_renewal_variant: false, is_trial: false, access_window: null, couple: true, active: true, pending_name_confirmation: false, sort_order: 3 },
  { id: pid(), name: 'Elite Couple PT — 144 Sessions', category: 'elite_couple_pt', list_price: 46065600, tax_rate: 0.05, sac_code: '999723', session_count: 144, validity_days: 365, is_renewal_variant: false, is_trial: false, access_window: null, couple: true, active: true, pending_name_confirmation: false, sort_order: 4 },

  // ════════════════════════════════════════════════════════════════
  // REFORMER PILATES
  // ════════════════════════════════════════════════════════════════

  { id: pid(), name: 'Reformer Pilates — Trial', category: 'reformer_pilates', list_price: 79900, tax_rate: 0.05, sac_code: '999723', session_count: 1, validity_days: 7, is_renewal_variant: false, is_trial: true, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 0 },
  { id: pid(), name: 'Reformer Pilates — 1 Session', category: 'reformer_pilates', list_price: 170000, tax_rate: 0.05, sac_code: '999723', session_count: 1, validity_days: 7, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 1 },
  { id: pid(), name: 'Reformer Pilates — 8 Sessions', category: 'reformer_pilates', list_price: 1066600, tax_rate: 0.05, sac_code: '999723', session_count: 8, validity_days: 30, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 2 },
  { id: pid(), name: 'Reformer Pilates — 12 Sessions', category: 'reformer_pilates', list_price: 1599900, tax_rate: 0.05, sac_code: '999723', session_count: 12, validity_days: 30, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 3 },
  { id: pid(), name: 'Reformer Pilates — 36 Sessions (3 Months)', category: 'reformer_pilates', list_price: 4463700, tax_rate: 0.05, sac_code: '999723', session_count: 36, validity_days: 90, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 4 },

  // Reformer Pilates — Renewal variants (separate SKUs, different pricing)
  // NOTE: 8-session renewal (₹11,499) is priced ABOVE new joining (₹10,666).
  // Flagged as probable error per build prompt — do not silently correct.
  { id: pid(), name: 'Reformer Pilates — 8 Sessions (Renewal)', category: 'reformer_pilates', list_price: 1149900, tax_rate: 0.05, sac_code: '999723', session_count: 8, validity_days: 30, is_renewal_variant: true, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 5, description: '⚠️ Priced ABOVE new joining rate (₹11,499 vs ₹10,666). Flagged as probable error.' },
  { id: pid(), name: 'Reformer Pilates — 12 Sessions (Renewal)', category: 'reformer_pilates', list_price: 1449900, tax_rate: 0.05, sac_code: '999723', session_count: 12, validity_days: 30, is_renewal_variant: true, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 6 },
  { id: pid(), name: 'Reformer Pilates — 36 Sessions (Renewal)', category: 'reformer_pilates', list_price: 4045200, tax_rate: 0.05, sac_code: '999723', session_count: 36, validity_days: 90, is_renewal_variant: true, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 7 },

  // Reformer Pilates — Happy Hours variants (14:00–16:00)
  { id: pid(), name: 'Reformer Pilates Happy Hours — 8 Sessions', category: 'reformer_pilates', list_price: 866600, tax_rate: 0.05, sac_code: '999723', session_count: 8, validity_days: 30, is_renewal_variant: false, is_trial: false, access_window: { start: '14:00', end: '16:00', label: 'Pilates Happy Hours' }, couple: false, active: true, pending_name_confirmation: false, sort_order: 8 },
  { id: pid(), name: 'Reformer Pilates Happy Hours — 12 Sessions', category: 'reformer_pilates', list_price: 1249900, tax_rate: 0.05, sac_code: '999723', session_count: 12, validity_days: 30, is_renewal_variant: false, is_trial: false, access_window: { start: '14:00', end: '16:00', label: 'Pilates Happy Hours' }, couple: false, active: true, pending_name_confirmation: false, sort_order: 9 },
  { id: pid(), name: 'Reformer Pilates Happy Hours — 24 Sessions (3 Months)', category: 'reformer_pilates', list_price: 2999800, tax_rate: 0.05, sac_code: '999723', session_count: 24, validity_days: 90, is_renewal_variant: false, is_trial: false, access_window: { start: '14:00', end: '16:00', label: 'Pilates Happy Hours' }, couple: false, active: true, pending_name_confirmation: false, sort_order: 10 },

  // ════════════════════════════════════════════════════════════════
  // REFORMER PILATES PT (1-on-1)
  // ════════════════════════════════════════════════════════════════

  { id: pid(), name: 'Reformer Pilates PT — 1 Day', category: 'reformer_pilates_pt', list_price: 299900, tax_rate: 0.05, sac_code: '999723', session_count: 1, validity_days: 1, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 1 },
  { id: pid(), name: 'Reformer Pilates PT — 1 Month', category: 'reformer_pilates_pt', list_price: 3598800, tax_rate: 0.05, sac_code: '999723', session_count: 12, validity_days: 30, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 2 },
  { id: pid(), name: 'Reformer Pilates PT — 3 Months', category: 'reformer_pilates_pt', list_price: 10796400, tax_rate: 0.05, sac_code: '999723', session_count: 36, validity_days: 90, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 3 },

  // ════════════════════════════════════════════════════════════════
  // GROUP ACTIVITY — Standard price ladder
  // Applies to: Yoga, Zumba, Spinning, MMA, Mat Pilates, Dance
  // Deduplicated: these categories share the same prices
  // ════════════════════════════════════════════════════════════════

  // Yoga
  { id: pid(), name: 'Yoga — Trial', category: 'yoga', list_price: 39900, tax_rate: 0.05, sac_code: '999723', session_count: 1, validity_days: 7, is_renewal_variant: false, is_trial: true, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 0 },
  { id: pid(), name: 'Yoga — 1 Session', category: 'yoga', list_price: 79900, tax_rate: 0.05, sac_code: '999723', session_count: 1, validity_days: 7, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 1 },
  { id: pid(), name: 'Yoga — 8 Sessions / Month', category: 'yoga', list_price: 399900, tax_rate: 0.05, sac_code: '999723', session_count: 8, validity_days: 30, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 2 },
  { id: pid(), name: 'Yoga — 12 Sessions / Month', category: 'yoga', list_price: 599900, tax_rate: 0.05, sac_code: '999723', session_count: 12, validity_days: 30, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 3 },
  { id: pid(), name: 'Yoga — 36 Sessions / 3 Months', category: 'yoga', list_price: 1499900, tax_rate: 0.05, sac_code: '999723', session_count: 36, validity_days: 90, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 4 },
  { id: pid(), name: 'Yoga — 1 Year (Single Activity)', category: 'yoga', list_price: 2999900, tax_rate: 0.05, sac_code: '999723', session_count: null, validity_days: 365, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 5 },

  // Spinning (same ladder)
  { id: pid(), name: 'Spinning — Trial', category: 'spinning', list_price: 39900, tax_rate: 0.05, sac_code: '999723', session_count: 1, validity_days: 7, is_renewal_variant: false, is_trial: true, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 0 },
  { id: pid(), name: 'Spinning — 1 Session', category: 'spinning', list_price: 79900, tax_rate: 0.05, sac_code: '999723', session_count: 1, validity_days: 7, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 1 },
  { id: pid(), name: 'Spinning — 8 Sessions / Month', category: 'spinning', list_price: 399900, tax_rate: 0.05, sac_code: '999723', session_count: 8, validity_days: 30, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 2 },
  { id: pid(), name: 'Spinning — 12 Sessions / Month', category: 'spinning', list_price: 599900, tax_rate: 0.05, sac_code: '999723', session_count: 12, validity_days: 30, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 3 },
  { id: pid(), name: 'Spinning — 36 Sessions / 3 Months', category: 'spinning', list_price: 1499900, tax_rate: 0.05, sac_code: '999723', session_count: 36, validity_days: 90, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 4 },
  { id: pid(), name: 'Spinning — 1 Year (Single Activity)', category: 'spinning', list_price: 2999900, tax_rate: 0.05, sac_code: '999723', session_count: null, validity_days: 365, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 5 },

  // MMA (same ladder)
  { id: pid(), name: 'MMA — Trial', category: 'mma', list_price: 39900, tax_rate: 0.05, sac_code: '999723', session_count: 1, validity_days: 7, is_renewal_variant: false, is_trial: true, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 0 },
  { id: pid(), name: 'MMA — 1 Session', category: 'mma', list_price: 79900, tax_rate: 0.05, sac_code: '999723', session_count: 1, validity_days: 7, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 1 },
  { id: pid(), name: 'MMA — 8 Sessions / Month', category: 'mma', list_price: 399900, tax_rate: 0.05, sac_code: '999723', session_count: 8, validity_days: 30, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 2 },
  { id: pid(), name: 'MMA — 12 Sessions / Month', category: 'mma', list_price: 599900, tax_rate: 0.05, sac_code: '999723', session_count: 12, validity_days: 30, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 3 },
  { id: pid(), name: 'MMA — 36 Sessions / 3 Months', category: 'mma', list_price: 1499900, tax_rate: 0.05, sac_code: '999723', session_count: 36, validity_days: 90, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 4 },
  { id: pid(), name: 'MMA — 1 Year (Single Activity)', category: 'mma', list_price: 2999900, tax_rate: 0.05, sac_code: '999723', session_count: null, validity_days: 365, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 5 },

  // Zumba (same ladder)
  { id: pid(), name: 'Zumba — 1 Session', category: 'zumba', list_price: 79900, tax_rate: 0.05, sac_code: '999723', session_count: 1, validity_days: 7, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 1 },
  { id: pid(), name: 'Zumba — 8 Sessions / Month', category: 'zumba', list_price: 399900, tax_rate: 0.05, sac_code: '999723', session_count: 8, validity_days: 30, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 2 },
  { id: pid(), name: 'Zumba — 12 Sessions / Month', category: 'zumba', list_price: 599900, tax_rate: 0.05, sac_code: '999723', session_count: 12, validity_days: 30, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 3 },
  { id: pid(), name: 'Zumba — 36 Sessions / 3 Months', category: 'zumba', list_price: 1499900, tax_rate: 0.05, sac_code: '999723', session_count: 36, validity_days: 90, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 4 },

  // Mat Pilates (same ladder)
  { id: pid(), name: 'Mat Pilates — 1 Session', category: 'mat_pilates', list_price: 79900, tax_rate: 0.05, sac_code: '999723', session_count: 1, validity_days: 7, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 1 },
  { id: pid(), name: 'Mat Pilates — 8 Sessions / Month', category: 'mat_pilates', list_price: 399900, tax_rate: 0.05, sac_code: '999723', session_count: 8, validity_days: 30, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 2 },
  { id: pid(), name: 'Mat Pilates — 12 Sessions / Month', category: 'mat_pilates', list_price: 599900, tax_rate: 0.05, sac_code: '999723', session_count: 12, validity_days: 30, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 3 },

  // Dance (same ladder)
  { id: pid(), name: 'Dance Class — 1 Session', category: 'dance_class', list_price: 79900, tax_rate: 0.05, sac_code: '999723', session_count: 1, validity_days: 7, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 1 },
  { id: pid(), name: 'Dance Class — 8 Sessions / Month', category: 'dance_class', list_price: 399900, tax_rate: 0.05, sac_code: '999723', session_count: 8, validity_days: 30, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 2 },

  // All Activities Annual
  { id: pid(), name: '1 Year Access To All Activities', category: 'group_activity', list_price: 3999900, tax_rate: 0.05, sac_code: '999723', session_count: null, validity_days: 365, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: true, sort_order: 99, description: '⚠️ Price conflict: ₹39,999 and ₹41,999 both appear in Gymex data. Using ₹39,999 pending confirmation.' },

  // ════════════════════════════════════════════════════════════════
  // CROSSFIT
  // ════════════════════════════════════════════════════════════════

  { id: pid(), name: 'CrossFit — 1 Day', category: 'crossfit', list_price: 69900, tax_rate: 0.05, sac_code: '999723', session_count: 1, validity_days: 1, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 1 },
  { id: pid(), name: 'CrossFit — 8 Sessions / Month', category: 'crossfit', list_price: 499900, tax_rate: 0.05, sac_code: '999723', session_count: 8, validity_days: 30, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 2 },
  { id: pid(), name: 'CrossFit — 12 Sessions / Month', category: 'crossfit', list_price: 699900, tax_rate: 0.05, sac_code: '999723', session_count: 12, validity_days: 30, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 3 },

  // ════════════════════════════════════════════════════════════════
  // HYROX
  // ════════════════════════════════════════════════════════════════

  { id: pid(), name: 'Hyrox — Trial', category: 'hyrox', list_price: 39900, tax_rate: 0.05, sac_code: '999723', session_count: 1, validity_days: 7, is_renewal_variant: false, is_trial: true, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 0 },
  { id: pid(), name: 'Hyrox — 4 Sessions', category: 'hyrox', list_price: 699900, tax_rate: 0.05, sac_code: '999723', session_count: 4, validity_days: 30, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 1 },
  { id: pid(), name: 'Hyrox — 8 Sessions', category: 'hyrox', list_price: 799900, tax_rate: 0.05, sac_code: '999723', session_count: 8, validity_days: 30, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 2 },
  { id: pid(), name: 'Hyrox — 24 Sessions', category: 'hyrox', list_price: 2299900, tax_rate: 0.05, sac_code: '999723', session_count: 24, validity_days: 90, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 3 },

  // ════════════════════════════════════════════════════════════════
  // MASSAGE PACKAGES
  // ════════════════════════════════════════════════════════════════

  { id: pid(), name: 'Deep Tissue Massage — 60 min', category: 'massage', list_price: 288800, tax_rate: 0.05, sac_code: '999723', session_count: 1, validity_days: 30, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 1 },
  { id: pid(), name: 'Deep Tissue Massage — 90 min', category: 'massage', list_price: 349900, tax_rate: 0.05, sac_code: '999723', session_count: 1, validity_days: 30, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 2 },
  { id: pid(), name: 'Neuromuscular Massage — 60 min', category: 'massage', list_price: 310000, tax_rate: 0.05, sac_code: '999723', session_count: 1, validity_days: 30, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 3 },
  { id: pid(), name: 'Neuromuscular Massage — 90 min', category: 'massage', list_price: 380000, tax_rate: 0.05, sac_code: '999723', session_count: 1, validity_days: 30, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 4 },
  { id: pid(), name: 'Head Massage — 35 min', category: 'massage', list_price: 139900, tax_rate: 0.05, sac_code: '999723', session_count: 1, validity_days: 30, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 5 },
  { id: pid(), name: 'Back Massage — 35 min', category: 'massage', list_price: 139900, tax_rate: 0.05, sac_code: '999723', session_count: 1, validity_days: 30, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 6 },
  { id: pid(), name: 'Foot Massage — 35 min', category: 'massage', list_price: 139900, tax_rate: 0.05, sac_code: '999723', session_count: 1, validity_days: 30, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 7 },

  // ════════════════════════════════════════════════════════════════
  // BODY ASSESSMENT (InBody)
  // ════════════════════════════════════════════════════════════════

  { id: pid(), name: 'InBody Assessment — Members', category: 'body_assessment', list_price: 45000, tax_rate: 0.05, sac_code: '999723', session_count: 1, validity_days: 30, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 1 },
  { id: pid(), name: 'InBody Assessment — Non-Members', category: 'body_assessment', list_price: 99900, tax_rate: 0.05, sac_code: '999723', session_count: 1, validity_days: 30, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 2 },

  // ════════════════════════════════════════════════════════════════
  // ICE BATH
  // ════════════════════════════════════════════════════════════════

  { id: pid(), name: 'Ice Bath — 1 Session', category: 'ice_bath', list_price: 129900, tax_rate: 0.05, sac_code: '999723', session_count: 1, validity_days: 7, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 1 },
  { id: pid(), name: 'Ice Bath — 10 Sessions / 60 Days', category: 'ice_bath', list_price: 600000, tax_rate: 0.05, sac_code: '999723', session_count: 10, validity_days: 60, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 2 },

  // ════════════════════════════════════════════════════════════════
  // LOCKER
  // ════════════════════════════════════════════════════════════════

  { id: pid(), name: 'Locker — 1 Month', category: 'locker', list_price: 100000, tax_rate: 0.05, sac_code: '999723', session_count: null, validity_days: 30, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 1 },
  { id: pid(), name: 'Locker — 3 Months', category: 'locker', list_price: 300000, tax_rate: 0.05, sac_code: '999723', session_count: null, validity_days: 90, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 2 },

  // ════════════════════════════════════════════════════════════════
  // CORPORATE / FLOATING
  // ════════════════════════════════════════════════════════════════

  { id: pid(), name: 'Corporate — 1 Year Single Slot', category: 'corporate', list_price: 3000000, tax_rate: 0.05, sac_code: '999723', session_count: null, validity_days: 365, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 1 },
  { id: pid(), name: 'Corporate — 65 Slots / 1 Year', category: 'corporate', list_price: 204750000, tax_rate: 0.05, sac_code: '999723', session_count: null, validity_days: 365, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 2 },
  { id: pid(), name: 'Floating — 50 Slots / 140 Days', category: 'corporate', list_price: 60411000, tax_rate: 0.05, sac_code: '999723', session_count: null, validity_days: 140, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 3 },

  // ════════════════════════════════════════════════════════════════
  // MARKETING & SPACE RENTAL — 18% GST
  // ════════════════════════════════════════════════════════════════

  { id: pid(), name: 'Marketing Display — 1 Month', category: 'marketing', list_price: 2500000, tax_rate: 0.18, sac_code: '998361', session_count: null, validity_days: 30, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 1 },
  { id: pid(), name: 'Marketing Display — 1 Day', category: 'marketing', list_price: 1500000, tax_rate: 0.18, sac_code: '998361', session_count: null, validity_days: 1, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 2 },
  { id: pid(), name: 'Photo Shoot — 1 Day', category: 'video_shoot', list_price: 500000, tax_rate: 0.18, sac_code: '998361', session_count: null, validity_days: 1, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 1 },
  { id: pid(), name: 'Video Shoot — 1 Day', category: 'video_shoot', list_price: 1000000, tax_rate: 0.18, sac_code: '998361', session_count: null, validity_days: 1, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 2 },

  // ════════════════════════════════════════════════════════════════
  // FITZONE
  // ════════════════════════════════════════════════════════════════

  { id: pid(), name: 'Fitzone — 90 Sessions / 180 Days', category: 'fitzone', list_price: 1999900, tax_rate: 0.05, sac_code: '999723', session_count: 90, validity_days: 180, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 1 },
  { id: pid(), name: 'Fitzone — 180 Sessions / 365 Days', category: 'fitzone', list_price: 3499900, tax_rate: 0.05, sac_code: '999723', session_count: 180, validity_days: 365, is_renewal_variant: false, is_trial: false, access_window: null, couple: false, active: true, pending_name_confirmation: false, sort_order: 2 },
]

// ─── Storage ───

export function getStoredProducts(): Product[] {
  if (typeof window === 'undefined') return SEEDED_PRODUCTS
  const stored = localStorage.getItem(PRODUCTS_STORAGE_KEY)
  if (!stored) {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(SEEDED_PRODUCTS))
    return SEEDED_PRODUCTS
  }
  try {
    return JSON.parse(stored)
  } catch {
    return SEEDED_PRODUCTS
  }
}

export function saveProducts(products: Product[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products))
  window.dispatchEvent(new Event('dna360_products_updated'))
}

// ─── Queries ───

export function getProducts(filters: ProductFilterOptions = {}): Product[] {
  let list = getStoredProducts()

  if (filters.search) {
    const q = filters.search.toLowerCase().trim()
    list = list.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
  }

  if (filters.category && filters.category !== 'all') {
    list = list.filter(p => p.category === filters.category)
  }

  if (filters.active !== undefined && filters.active !== 'all') {
    list = list.filter(p => p.active === filters.active)
  }

  if (filters.is_trial !== undefined) {
    list = list.filter(p => p.is_trial === filters.is_trial)
  }

  if (filters.is_renewal !== undefined) {
    list = list.filter(p => p.is_renewal_variant === filters.is_renewal)
  }

  return list.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category)
    return a.sort_order - b.sort_order
  })
}

export function getProductById(id: string): Product | null {
  return getStoredProducts().find(p => p.id === id) || null
}

export function getProductsByCategory(category: ProductCategory): Product[] {
  return getStoredProducts()
    .filter(p => p.category === category && p.active)
    .sort((a, b) => a.sort_order - b.sort_order)
}

// ─── Mutations ───

export function createProduct(product: Omit<Product, 'id'>): Product {
  const products = getStoredProducts()
  const newProduct: Product = { ...product, id: `prod_${Date.now()}` }
  saveProducts([...products, newProduct])

  logAuditEvent({
    actor: { id: 'system', name: 'System', email: '', role: 'System' },
    action: 'CREATE',
    entity: 'Product',
    entityId: newProduct.id,
    branchId: 'pow',
    description: `Created product: ${newProduct.name} (₹${(newProduct.list_price / 100).toLocaleString('en-IN')})`,
    afterState: newProduct,
  })

  return newProduct
}

export function updateProduct(id: string, updates: Partial<Product>): Product | null {
  const products = getStoredProducts()
  const index = products.findIndex(p => p.id === id)
  if (index === -1) return null

  const before = products[index]
  const updated = { ...before, ...updates }
  products[index] = updated
  saveProducts(products)

  logAuditEvent({
    actor: { id: 'system', name: 'System', email: '', role: 'System' },
    action: 'UPDATE',
    entity: 'Product',
    entityId: id,
    branchId: 'pow',
    description: `Updated product: ${updated.name}`,
    beforeState: before,
    afterState: updated,
  })

  return updated
}

/**
 * Get all unique product categories that have active products.
 */
export function getActiveCategories(): { category: ProductCategory; count: number; label: string }[] {
  const products = getStoredProducts().filter(p => p.active)
  const map = new Map<ProductCategory, number>()
  for (const p of products) {
    map.set(p.category, (map.get(p.category) || 0) + 1)
  }
  return Array.from(map.entries())
    .map(([category, count]) => ({
      category,
      count,
      label: CATEGORY_LABELS[category] || category,
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

/** Human-readable category labels */
export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  gym_membership: 'Gym Membership',
  personal_training: 'Personal Training',
  premium_pt: 'Premium Personal Training',
  elite_pt: 'Elite Personal Training',
  super_elite_pt: 'Super Elite Personal Training',
  premium_couple_pt: 'Premium Couple PT',
  elite_couple_pt: 'Elite Couple PT',
  reformer_pilates: 'Reformer Pilates',
  reformer_pilates_pt: 'Reformer Pilates PT',
  fitzone: 'Fitzone',
  group_activity: 'Group Activity',
  crossfit: 'CrossFit',
  spinning: 'Spinning',
  zumba: 'Zumba',
  yoga: 'Yoga',
  mat_pilates: 'Mat Pilates',
  mma: 'MMA',
  dance_class: 'Dance Class',
  hyrox: 'Hyrox',
  massage: 'Massage',
  body_assessment: 'Body Assessment (InBody)',
  ice_bath: 'Ice Bath',
  locker: 'Locker',
  marketing: 'Marketing Display',
  video_shoot: 'Video / Photo Shoot',
  display_item: 'Display Item',
  day_pass: 'Day Pass',
  corporate: 'Corporate / Floating',
}
