import type {
  ExecutiveKpis,
  BranchPerformance,
  RevenueStreamMix,
  CohortRetentionData,
  ChurnRiskMember,
  GstSummaryReport,
} from '@/types/analytics'
import { logAuditEvent } from '@/lib/audit'

const CHURN_RADAR_KEY = 'dna360_churn_radar_members'

export const SEEDED_KPIS: ExecutiveKpis = {
  mrrMinor: 184000000, // ₹18,40,000
  arrMinor: 2208000000, // ₹2,20,80,000
  totalActiveMembers: 1280,
  arpmMinor: 143750, // ₹1,437.50
  churnRatePct: 3.2,
  gstCollectedMinor: 33120000, // ₹3,31,200
  mrrGrowthPct: 12.4,
}

export const SEEDED_BRANCHES: BranchPerformance[] = [
  {
    branchId: 'pow',
    branchName: 'Powai Flagship',
    monthlyRevenueMinor: 112000000, // ₹11,20,000
    memberCount: 780,
    occupancyPct: 64,
    ptSessionsDelivered: 182,
    growthPct: 14.8,
  },
  {
    branchId: 'and',
    branchName: 'Andheri West Club',
    monthlyRevenueMinor: 72000000, // ₹7,20,000
    memberCount: 500,
    occupancyPct: 52,
    ptSessionsDelivered: 114,
    growthPct: 8.9,
  },
]

export const SEEDED_REVENUE_MIX: RevenueStreamMix = {
  membershipPct: 68,
  ptPct: 22,
  retailPct: 7,
  lockersPct: 3,
}

export const SEEDED_COHORTS: CohortRetentionData[] = [
  { cohort: 'Jan 2026', size: 142, month1: 96, month3: 88, month6: 79, month12: 72 },
  { cohort: 'Feb 2026', size: 128, month1: 95, month3: 86, month6: 78, month12: 70 },
  { cohort: 'Mar 2026', size: 165, month1: 98, month3: 91, month6: 82, month12: 74 },
  { cohort: 'Apr 2026', size: 134, month1: 94, month3: 85, month6: 76, month12: 68 },
  { cohort: 'May 2026', size: 152, month1: 97, month3: 89, month6: 80, month12: 73 },
  { cohort: 'Jun 2026', size: 148, month1: 95, month3: 87, month6: 79, month12: 71 },
]

export const SEEDED_CHURN_MEMBERS: ChurnRiskMember[] = [
  {
    memberId: 'mem_004',
    memberName: 'Rohan Deshmukh',
    memberCode: 'DNA-POW-2026-0118',
    phone: '+919820044444',
    planName: 'Annual Gold Access',
    riskScore: 88,
    riskLevel: 'High',
    primaryRiskFactor: 'Overdue locker dues (₹5,310) + No check-in in 18 days',
    lastVisitDaysAgo: 18,
    recommendedAction: 'Send WhatsApp Dues Waiver + Free 1-on-1 Session Invite',
    retentionStatus: 'uncontacted',
  },
  {
    memberId: 'mem_002',
    memberName: 'Priya Sharma',
    memberCode: 'DNA-POW-2025-1043',
    phone: '+919820022222',
    planName: '6-Month Fitness Plus',
    riskScore: 64,
    riskLevel: 'Medium',
    primaryRiskFactor: 'Plan expiring in 12 days; 2 unutilized PT sessions',
    lastVisitDaysAgo: 4,
    recommendedAction: '1-Click Renewal Discount Call (10% Loyalty Incentive)',
    retentionStatus: 'uncontacted',
  },
  {
    memberId: 'mem_007',
    memberName: 'Deepak Verma',
    memberCode: 'DNA-AND-2025-0914',
    phone: '+919820077777',
    planName: 'Quarterly Andheri Single-Club',
    riskScore: 52,
    riskLevel: 'Medium',
    primaryRiskFactor: 'Attempted entry at wrong branch; 12 days since last session',
    lastVisitDaysAgo: 12,
    recommendedAction: 'Multi-Club Upgrade Trial Offer via WhatsApp',
    retentionStatus: 'uncontacted',
  },
]

export function getStoredChurnRadar(): ChurnRiskMember[] {
  if (typeof window === 'undefined') return SEEDED_CHURN_MEMBERS
  const stored = localStorage.getItem(CHURN_RADAR_KEY)
  if (!stored) {
    localStorage.setItem(CHURN_RADAR_KEY, JSON.stringify(SEEDED_CHURN_MEMBERS))
    return SEEDED_CHURN_MEMBERS
  }
  try {
    return JSON.parse(stored)
  } catch {
    return SEEDED_CHURN_MEMBERS
  }
}

export function saveChurnRadar(members: ChurnRiskMember[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(CHURN_RADAR_KEY, JSON.stringify(members))
  window.dispatchEvent(new Event('dna360_analytics_updated'))
}

export function getExecutiveKpis(): ExecutiveKpis {
  return SEEDED_KPIS
}

export function getBranchPerformance(): BranchPerformance[] {
  return SEEDED_BRANCHES
}

export function getRevenueMix(): RevenueStreamMix {
  return SEEDED_REVENUE_MIX
}

export function getCohortData(): CohortRetentionData[] {
  return SEEDED_COHORTS
}

export function getChurnRiskRadar(): ChurnRiskMember[] {
  return getStoredChurnRadar()
}

export function triggerRetentionOutreach(memberId: string, actionNote: string): boolean {
  const members = getStoredChurnRadar()
  const index = members.findIndex((m) => m.memberId === memberId)
  if (index === -1) return false

  const updated: ChurnRiskMember = {
    ...members[index],
    retentionStatus: 'contacted',
  }

  members[index] = updated
  saveChurnRadar(members)

  logAuditEvent({
    actor: { id: 'usr_exec_01', name: 'Kevin Patel', email: 'kevin@pinnacle.studio', role: 'Owner' },
    action: 'CREATE',
    entity: 'RetentionOutreach',
    entityId: `ret_${Date.now()}`,
    branchId: 'pow',
    description: `Triggered AI Churn Retention Outreach for ${updated.memberName}: ${actionNote}`,
    afterState: updated,
  })

  return true
}

export function getGstTaxReport(): GstSummaryReport {
  return {
    sacCode: '999723',
    taxRate: 0.05,
    taxableValueMinor: 184000000, // ₹18,40,000
    cgstMinor: 4600000, // ₹46,000 (2.5%)
    sgstMinor: 4600000, // ₹46,000 (2.5%)
    totalTaxMinor: 9200000, // ₹92,000 (5%)
    invoiceCount: 48,
  }
}
