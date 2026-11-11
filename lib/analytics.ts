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
import { getStoredMembers } from '@/lib/members'
import { getStoredInvoices } from '@/lib/billing'
import { getStoredPosSales } from '@/lib/frontdesk'
import { getLiveOccupancy } from '@/lib/attendance'

const CHURN_CONTACTED_KEY = 'dna360_churn_contacted_v2'

function getContactedIds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CHURN_CONTACTED_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Churn radar derived 100% from real member records:
 * active/expiring members with no visit for 14+ days, and members in the grace window.
 */
export function getStoredChurnRadar(): ChurnRiskMember[] {
  const contacted = new Set(getContactedIds())
  const nowMs = Date.now()
  const list: ChurnRiskMember[] = []

  for (const m of getStoredMembers()) {
    if (m.status === 'blacklisted' || m.blacklisted) continue
    if (m.status === 'inactive') continue
    const lastVisitMs = m.last_visit_at ? new Date(m.last_visit_at).getTime() : null
    const daysAgo = lastVisitMs ? Math.floor((nowMs - lastVisitMs) / 86400000) : null
    const isGrace = m.status === 'grace_period'
    const isLapsing = daysAgo === null || daysAgo >= 14
    if (!isGrace && !isLapsing) continue

    const visitScore = daysAgo === null ? 40 : Math.min(60, Math.round(daysAgo * 1.5))
    const riskScore = Math.min(99, visitScore + (isGrace ? 30 : 0) + (m.status === 'expiring_soon' ? 15 : 0))
    const factors: string[] = []
    if (isGrace) factors.push('Plan expired (in 7-day grace window)')
    if (m.status === 'expiring_soon') factors.push('Plan expiring soon')
    factors.push(daysAgo === null ? 'No check-in recorded yet' : `No check-in in ${daysAgo} days`)

    list.push({
      memberId: m.id,
      memberName: m.name,
      memberCode: m.member_code,
      phone: m.phone,
      planName: m.active_memberships?.[0]?.product_name || 'Membership',
      riskScore,
      riskLevel: riskScore >= 75 ? 'High' : riskScore >= 45 ? 'Medium' : 'Low',
      primaryRiskFactor: factors.join(' + '),
      lastVisitDaysAgo: daysAgo ?? 0,
      recommendedAction: isGrace
        ? 'Call to settle dues and renew before turnstile lockout'
        : 'WhatsApp check-in + invite for a complimentary 1-on-1 session',
      retentionStatus: contacted.has(m.id) ? 'contacted' : 'uncontacted',
    } as ChurnRiskMember)
  }

  return list.sort((x, y) => y.riskScore - x.riskScore).slice(0, 25)
}

export function saveChurnRadar(members: ChurnRiskMember[]) {
  if (typeof window === 'undefined') return
  const ids = members.filter((m) => m.retentionStatus === 'contacted').map((m) => m.memberId)
  localStorage.setItem(CHURN_CONTACTED_KEY, JSON.stringify(Array.from(new Set([...getContactedIds(), ...ids]))))
  window.dispatchEvent(new Event('dna360_analytics_updated'))
}

export function getExecutiveKpis(): ExecutiveKpis {
  const metrics = getSystemMetrics()
  return {
    mrrMinor: metrics.collectionsMtdMinor,
    arrMinor: metrics.collectionsMtdMinor * 12,
    totalActiveMembers: metrics.activeMembers,
    arpmMinor: metrics.totalMembers > 0 ? Math.round(metrics.collectionsMtdMinor / metrics.totalMembers) : 0,
    churnRatePct: metrics.churnRatePct,
    gstCollectedMinor: metrics.gstLiabilityMinor,
    mrrGrowthPct: 0,
  }
}

export function getBranchPerformance(): BranchPerformance[] {
  const metrics = getSystemMetrics()
  const floor = getLiveOccupancy()
  return [
    {
      branchId: 'pow',
      branchName: 'Powai Studio & Flagship',
      monthlyRevenueMinor: metrics.collectionsMtdMinor,
      memberCount: metrics.totalMembers,
      occupancyPct: Math.round((floor.currentCount / floor.maxCapacity) * 100),
      ptSessionsDelivered: 0,
      growthPct: 0,
    },
  ]
}

/** Revenue mix computed from real invoice line items + POS retail sales issued this month. */
export function getRevenueMix(): RevenueStreamMix {
  const monthPrefix = new Date().toISOString().slice(0, 7)
  let membership = 0
  let pt = 0
  let lockers = 0
  for (const inv of getStoredInvoices()) {
    if (inv.status === 'void' || !String(inv.issueDate).startsWith(monthPrefix)) continue
    for (const item of inv.items || []) {
      const d = (item.description || '').toLowerCase()
      const amt = item.totalMinor || 0
      if (d.includes('personal training') || /\bpt\b/.test(d)) pt += amt
      else if (d.includes('locker')) lockers += amt
      else membership += amt
    }
  }
  const retail = getStoredPosSales()
    .filter((s) => String(s.timestamp).startsWith(monthPrefix))
    .reduce((acc, s) => acc + (s.totalMinor || 0), 0)
  const total = membership + pt + lockers + retail
  const pct = (v: number) => (total > 0 ? Math.round((v / total) * 100) : 0)
  return { membershipPct: pct(membership), ptPct: pct(pt), retailPct: pct(retail), lockersPct: pct(lockers) }
}

/** Cohort retention computed from real member join dates (only elapsed horizons are filled). */
export function getCohortData(): CohortRetentionData[] {
  const members = getStoredMembers()
  const now = new Date()
  const rows: CohortRetentionData[] = []
  for (let back = 5; back >= 0; back--) {
    const d = new Date(now.getFullYear(), now.getMonth() - back, 1)
    const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const cohort = members.filter((m) => String(m.joined_date || '').startsWith(prefix))
    const retained = cohort.filter((m) => m.status !== 'inactive' && m.status !== 'blacklisted').length
    const pct = cohort.length > 0 ? Math.round((retained / cohort.length) * 100) : (null as any)
    rows.push({
      cohort: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      size: cohort.length,
      month1: back >= 1 ? pct : (null as any),
      month3: back >= 3 ? pct : (null as any),
      month6: back >= 6 ? pct : (null as any),
      month12: null as any,
    })
  }
  return rows
}

export function getGstTaxReport(): GstSummaryReport {
  const metrics = getSystemMetrics()
  const monthPrefix = new Date().toISOString().slice(0, 7)
  const invoiceCount = getStoredInvoices().filter(
    (inv) => inv.status !== 'void' && String(inv.issueDate).startsWith(monthPrefix)
  ).length
  return {
    sacCode: metrics.gstSacCode,
    taxRate: metrics.gstRatePct / 100,
    taxableValueMinor: metrics.taxableRevenueMinor,
    cgstMinor: metrics.cgstMinor,
    sgstMinor: metrics.sgstMinor,
    totalTaxMinor: metrics.gstLiabilityMinor,
    invoiceCount,
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
