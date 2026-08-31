import type {
  ExecutiveKpis,
  BranchPerformance,
  RevenueStreamMix,
  CohortRetentionData,
  ChurnRiskMember,
  GstSummaryReport,
} from '@/types/analytics'
import { logAuditEvent } from '@/lib/audit'

import { getSystemMetrics } from '@/lib/metrics'

const CHURN_RADAR_KEY = 'dna360_churn_radar_members'

export const SEEDED_KPIS: ExecutiveKpis = {
  mrrMinor: 184000000, // ₹18,40,000 (Collections MTD)
  arrMinor: 2208000000, // ₹2,20,80,000
  totalActiveMembers: 512, // 512 Active (out of 659 Total registered)
  arpmMinor: 279210, // ₹2,792.10 per member
  churnRatePct: 2.8,
  gstCollectedMinor: 8761905, // ₹87,619.05 (5% GST back-calculated: 18,40,000 * 5 / 105)
  mrrGrowthPct: 14.2,
}

export const SEEDED_BRANCHES: BranchPerformance[] = [
  {
    branchId: 'pow',
    branchName: 'Powai Studio & Flagship',
    monthlyRevenueMinor: 184000000, // ₹18,40,000
    memberCount: 659,
    occupancyPct: 68,
    ptSessionsDelivered: 296,
    growthPct: 14.2,
  },
]

export const SEEDED_REVENUE_MIX: RevenueStreamMix = {
  membershipPct: 74,
  ptPct: 22,
  retailPct: 0,
  lockersPct: 4,
}

// Current date: August 2026. Only elapsed horizons M+1 to M+N are rendered; unreached future horizons are null.
export const SEEDED_COHORTS: CohortRetentionData[] = [
  { cohort: 'Jan 2026', size: 112, month1: 96, month3: 88, month6: 81, month12: null as any },
  { cohort: 'Feb 2026', size: 98, month1: 95, month3: 86, month6: 80, month12: null as any },
  { cohort: 'Mar 2026', size: 125, month1: 98, month3: 91, month6: null as any, month12: null as any },
  { cohort: 'Apr 2026', size: 104, month1: 94, month3: 85, month6: null as any, month12: null as any },
  { cohort: 'May 2026', size: 118, month1: 97, month3: 89, month6: null as any, month12: null as any },
  { cohort: 'Jun 2026', size: 122, month1: 95, month3: null as any, month6: null as any, month12: null as any },
]

export const SEEDED_CHURN_MEMBERS: ChurnRiskMember[] = [
  {
    memberId: 'mem_004',
    memberName: 'Rohan Deshmukh',
    memberCode: 'DNA-2025-0004',
    phone: '+919820044444',
    planName: 'Annual Happy Hours Gym Membership',
    riskScore: 88,
    riskLevel: 'High',
    primaryRiskFactor: 'Overdue locker dues + No check-in in 18 days',
    lastVisitDaysAgo: 18,
    recommendedAction: 'Send WhatsApp Dues Reminder + Free 1-on-1 Session Invite',
    retentionStatus: 'uncontacted',
  },
  {
    memberId: 'mem_018',
    memberName: 'Priya Sharma',
    memberCode: 'DNA-2025-0018',
    phone: '+919833022222',
    planName: '6-Month Fitness Plus',
    riskScore: 64,
    riskLevel: 'Medium',
    primaryRiskFactor: 'Plan expired 3 days ago (in 7-day grace window)',
    lastVisitDaysAgo: 4,
    recommendedAction: '1-Click Renewal Discount Call (10% Loyalty Incentive)',
    retentionStatus: 'uncontacted',
  },
  {
    memberId: 'mem_072',
    memberName: 'Neha Kulkarni',
    memberCode: 'DNA-2025-0072',
    phone: '+919819055555',
    planName: 'Reformer Pilates — 36 Sessions (3 Months)',
    riskScore: 48,
    riskLevel: 'Medium',
    primaryRiskFactor: 'Tenure expires in 10 days with 6 sessions remaining',
    lastVisitDaysAgo: 2,
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
  const metrics = getSystemMetrics()
  return {
    mrrMinor: metrics.collectionsMtdMinor,
    arrMinor: metrics.collectionsMtdMinor * 12,
    totalActiveMembers: metrics.activeMembers,
    arpmMinor: Math.round(metrics.collectionsMtdMinor / metrics.totalMembers),
    churnRatePct: metrics.churnRatePct,
    gstCollectedMinor: metrics.gstLiabilityMinor,
    mrrGrowthPct: 14.2,
  }
}

export function getBranchPerformance(): BranchPerformance[] {
  const metrics = getSystemMetrics()
  return [
    {
      branchId: 'pow',
      branchName: 'Powai Studio & Flagship',
      monthlyRevenueMinor: metrics.collectionsMtdMinor,
      memberCount: metrics.totalMembers,
      occupancyPct: 68,
      ptSessionsDelivered: 296,
      growthPct: 14.2,
    },
  ]
}

export function getRevenueMix(): RevenueStreamMix {
  return SEEDED_REVENUE_MIX
}

export function getCohortData(): CohortRetentionData[] {
  return SEEDED_COHORTS
}

export function getGstTaxReport(): GstSummaryReport {
  const metrics = getSystemMetrics()
  return {
    sacCode: metrics.gstSacCode,
    taxRate: metrics.gstRatePct / 100,
    taxableValueMinor: metrics.taxableRevenueMinor,
    cgstMinor: metrics.cgstMinor,
    sgstMinor: metrics.sgstMinor,
    totalTaxMinor: metrics.gstLiabilityMinor,
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
