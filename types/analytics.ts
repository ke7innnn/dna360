/* ============================================================
   DNA 360 — Analytics Types
   
   Reports at launch from §13 of the build prompt.
   Revenue visibility respects the per-user can_view_revenue flag.
   GST summary split by rate (5% and 18%) for filing.
   ============================================================ */

export interface ExecutiveKpis {
  mrrMinor: number
  arrMinor: number
  totalActiveMembers: number
  arpmMinor: number
  churnRatePct: number
  /** GST collected — split by rate in the detail report */
  gstCollectedMinor: number
  mrrGrowthPct: number
}

export interface BranchPerformance {
  branchId: string
  branchName: string
  monthlyRevenueMinor: number
  memberCount: number
  occupancyPct: number
  ptSessionsDelivered: number
  growthPct: number
}

export interface RevenueStreamMix {
  membershipPct: number
  ptPct: number
  retailPct: number
  lockersPct: number
}

export interface RevenueByCategory {
  category: string
  revenueMinor: number
  invoiceCount: number
  /** Tax rate for this category (5% or 18%) */
  taxRate: number
}

export interface ExpiringMembership {
  memberId: string
  memberName: string
  memberPhone: string
  productName: string
  expiryDate: string
  daysUntilExpiry: number
}

export interface ExpiringEntitlement {
  memberId: string
  memberName: string
  memberPhone: string
  entitlementType: string
  entitlementLabel: string
  remainingCount: number
  expiryDate: string
  daysUntilExpiry: number
}

export interface TrainerCommissionReport {
  trainerId: string
  trainerName: string
  sessionsDelivered: number
  grossRevenueMinor: number
  commissionMinor: number
  /** Commission basis used (PENDING config — shows as "not configured" if null) */
  commissionBasis: string | null
}

export interface SalesRepPerformance {
  repId: string
  repName: string
  /** Active or inactive (historical) */
  isActive: boolean
  leadsCaptured: number
  conversions: number
  conversionRate: number
  revenueMinor: number
}

export interface CheckInVolumeByHour {
  hour: number // 0-23
  count: number
  /** Helps validate whether Happy Hours pricing is working */
  isHappyHours: boolean
}

export interface LeadConversionBySource {
  source: string
  totalLeads: number
  converted: number
  conversionRate: number
  avgDaysToClose: number
}

/**
 * GST summary split by rate for filing.
 * Fitness services at 5%, marketing/shoots at 18%.
 */
export interface GstSummaryReport {
  sacCode: string
  taxRate: number // 0.05 or 0.18
  taxableValueMinor: number
  cgstMinor: number
  sgstMinor: number
  totalTaxMinor: number
  invoiceCount: number
}

export interface CohortRetentionData {
  cohort: string
  size: number
  month1: number
  month3: number
  month6: number
  month12: number
}

export interface ChurnRiskMember {
  memberId: string
  memberCode?: string
  memberName: string
  phone: string
  planName: string
  riskScore: number
  riskLevel: 'High' | 'Medium' | 'Low'
  primaryRiskFactor: string
  lastVisitDaysAgo: number
  recommendedAction: string
  retentionStatus: 'uncontacted' | 'contacted' | 'resolved'
}
