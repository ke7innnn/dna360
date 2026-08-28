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
  totalActiveMembers: 679, // Real Gymex verified count
  arpmMinor: 270986, // ₹2,709.86 per member
  churnRatePct: 2.8,
  gstCollectedMinor: 9200000, // ₹92,000 (5% GST standard MTD)
  mrrGrowthPct: 14.2,
}

export const SEEDED_BRANCHES: BranchPerformance[] = [
  {
    branchId: 'pow',
    branchName: 'Powai Studio & Flagship',
    monthlyRevenueMinor: 184000000, // ₹18,40,000
    memberCount: 679,
    occupancyPct: 68,
    ptSessionsDelivered: 296,
    growthPct: 14.2,
  },
]

export const SEEDED_REVENUE_MIX: RevenueStreamMix = {
  membershipPct: 74,
  ptPct: 22,
  retailPct: 0, // Out of scope in Phase 1
  lockersPct: 4,
}

export const SEEDED_COHORTS: CohortRetentionData[] = [
  { cohort: 'Jan 2026', size: 112, month1: 96, month3: 88, month6: 81, month12: 74 },
  { cohort: 'Feb 2026', size: 98, month1: 95, month3: 86, month6: 80, month12: 72 },
  { cohort: 'Mar 2026', size: 125, month1: 98, month3: 91, month6: 84, month12: 76 },
  { cohort: 'Apr 2026', size: 104, month1: 94, month3: 85, month6: 78, month12: 70 },
  { cohort: 'May 2026', size: 118, month1: 97, month3: 89, month6: 82, month12: 75 },
  { cohort: 'Jun 2026', size: 122, month1: 95, month3: 87, month6: 80, month12: 73 },
]

export const SEEDED_CHURN_MEMBERS: ChurnRiskMember[] = [
  {
    memberId: 'mem_004',
    memberName: 'Rohan Deshmukh',
    memberCode: 'DNA-2025-0118',
    phone: '+919820044444',
    planName: 'Annual Gold Access',
    riskScore: 88,
    riskLevel: 'High',
    primaryRiskFactor: 'Overdue locker dues (₹5,310) + No check-in in 18 days',
    lastVisitDaysAgo: 18,
    recommendedAction: 'Send WhatsApp Dues Reminder + Free 1-on-1 Session Invite',
    retentionStatus: 'uncontacted',
  },
  {
    memberId: 'mem_002',
    memberName: 'Priya Sharma',
    memberCode: 'DNA-2025-1043',
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
    memberId: 'mem_005',
    memberName: 'Neha Kulkarni',
    memberCode: 'DNA-2025-0329',
    phone: '+919820055555',
    planName: 'Reformer Pilates 24-Pack',
    riskScore: 48,
    riskLevel: 'Medium',
    primaryRiskFactor: 'Tenure expires in 10 days with 6 sessions remaining',
    lastVisitDaysAgo: 6,
    recommendedAction: 'Tenure Extension Call or Batch Top-up Offer',
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

export function getGstTaxReport(): GstSummaryReport {
  return {
    sacCode: '999723',
    taxRate: 0.05,
    taxableValueMinor: 175238095, // ₹17,52,380.95
    cgstMinor: 4380952,          // ₹43,809.52 (2.5%)
    sgstMinor: 4380952,          // ₹43,809.52 (2.5%)
    totalTaxMinor: 8761904,      // ₹87,619.04
    invoiceCount: 412,
  }
}

export function logChurnActionTaken(memberId: string, actionNote: string, actorName: string) {
  const members = getStoredChurnRadar()
  const updated = members.map((m) =>
    m.memberId === memberId
      ? { ...m, retentionStatus: 'contacted' as const }
      : m
  )
  saveChurnRadar(updated)

  logAuditEvent({
    actor: { id: 'usr_001', name: actorName, email: 'owner@dna360.in', role: 'Owner' },
    action: 'UPDATE',
    entity: 'ChurnRadar',
    entityId: memberId,
    branchId: 'pow',
    branchName: 'Powai Flagship',
    description: `Retention outreach recorded for member ${memberId}: ${actionNote}`,
  })
}

export const getChurnRiskRadar = getStoredChurnRadar

export function triggerRetentionOutreach(memberId: string, actionNote: string) {
  logChurnActionTaken(memberId, actionNote, 'Operations Manager')
}
