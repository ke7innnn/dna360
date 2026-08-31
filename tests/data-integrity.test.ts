/**
 * DNA 360 Data Integrity & Unified Metrics Test Suite (Phase 2)
 *
 * Asserts all Phase 2 acceptance criteria:
 * 1. Single source of truth metrics engine ties out 100% with member directory and overview.
 * 2. Exact status distribution: 512 active, 18 grace, 82 expiring, 32 expired, 15 blacklisted = 659 total.
 * 3. 5% GST inclusive back-calculation: ₹18,40,000 × 5 / 105 = ₹87,619.05.
 * 4. Separation of upfront collections (₹18.4L) from recognised revenue (₹1.53L) and deferred revenue (₹16.87L).
 * 5. Cohort retention elapsed horizon rules (future horizons are null).
 * 6. Realistic non-sequential phone numbers and varied names in seed data.
 * 7. Plausible attendance streaks and total visit histories.
 */

import { getSystemMetrics } from '../lib/metrics'
import { getStoredMembers, generate659Members } from '../lib/members'
import { getExecutiveKpis, getGstTaxReport, getCohortData } from '../lib/analytics'

let passed = 0
let failed = 0

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`)
    passed++
  } else {
    console.error(`  ✗ FAIL: ${testName}${detail ? ` (${detail})` : ''}`)
    failed++
  }
}

async function runTests() {
  console.log('\n============================================================')
  console.log('  DNA 360 Phase 2 Data Integrity & Metrics Test Suite')
  console.log('============================================================\n')

  const metrics = getSystemMetrics()
  const members = getStoredMembers()
  const kpis = getExecutiveKpis()
  const gst = getGstTaxReport()
  const cohorts = getCohortData()

  // ─── 1. Single Source of Truth: Member Counts ───
  console.log('--- 1. Single Source of Truth & Status Distribution ---')
  assert(metrics.totalMembers === 659, `Total members is exactly 659 (got ${metrics.totalMembers})`)
  assert(metrics.activeMembers === 512, `Active members is exactly 512 (got ${metrics.activeMembers})`)
  assert(metrics.gracePeriodMembers === 18, `Grace period members is exactly 18 (got ${metrics.gracePeriodMembers})`)
  assert(metrics.expiringIn30Days === 82, `Expiring in 30 days is exactly 82 (got ${metrics.expiringIn30Days})`)
  assert(metrics.inactiveMembers === 32, `Expired/inactive members is exactly 32 (got ${metrics.inactiveMembers})`)
  assert(metrics.blacklistedMembers === 15, `Blacklisted members is exactly 15 (got ${metrics.blacklistedMembers})`)

  const statusSum = metrics.activeMembers + metrics.gracePeriodMembers + metrics.expiringIn30Days + metrics.inactiveMembers + metrics.blacklistedMembers
  assert(statusSum === 659, `Sum of status buckets equals total: 512 + 18 + 82 + 32 + 15 = ${statusSum}`)

  // ─── 2. Metric Tie-Out across Modules ───
  console.log('\n--- 2. Tie-Out Across Platform Modules ---')
  assert(
    kpis.totalActiveMembers === metrics.activeMembers,
    `Overview KPI active count (${kpis.totalActiveMembers}) matches metrics engine (${metrics.activeMembers})`
  )
  assert(
    members.filter(m => m.status === 'expiring_soon').length === metrics.expiringIn30Days,
    `Members page expiring filter (${members.filter(m => m.status === 'expiring_soon').length}) matches metrics (${metrics.expiringIn30Days})`
  )

  // ─── 3. Accurate 5% GST Back-Calculation Arithmetic ───
  console.log('\n--- 3. GST SAC 999723 Back-Calculation Arithmetic ---')
  // Amount = ₹18,40,000 (184000000 paise)
  // GST = 184000000 * 5 / 105 = 8761904.76 -> 8761905 paise (₹87,619.05)
  const expectedGst = Math.round((184000000 * 5) / 105)
  assert(
    metrics.gstLiabilityMinor === expectedGst,
    `GST liability is exactly Amount × 5 / 105: ₹${(metrics.gstLiabilityMinor / 100).toFixed(2)} (expected ₹${(expectedGst / 100).toFixed(2)})`
  )
  assert(
    metrics.taxableRevenueMinor === 184000000 - expectedGst,
    `Taxable value is Collections - GST: ₹${(metrics.taxableRevenueMinor / 100).toFixed(2)}`
  )
  assert(
    metrics.cgstMinor + metrics.sgstMinor === metrics.gstLiabilityMinor,
    `CGST (₹${(metrics.cgstMinor / 100).toFixed(2)}) + SGST (₹${(metrics.sgstMinor / 100).toFixed(2)}) equals total GST liability`
  )
  assert(
    gst.sacCode === '999723',
    `SAC Code is correctly set to 999723 for Fitness Services`
  )

  // ─── 4. Separation of Collections from Recognised & Deferred Revenue ───
  console.log('\n--- 4. Upfront Collections vs. Recognised & Deferred Revenue ---')
  assert(
    metrics.collectionsMtdMinor === 184000000,
    `Collections MTD is ₹18,40,000`
  )
  assert(
    metrics.recognisedRevenueMtdMinor === Math.round(184000000 / 12),
    `Recognised revenue for 1 month of annual upfront is ₹1,53,333`
  )
  assert(
    metrics.deferredRevenueBalanceMinor === metrics.collectionsMtdMinor - metrics.recognisedRevenueMtdMinor,
    `Deferred revenue balance is ₹16,86,667`
  )
  assert(
    metrics.recognisedRevenueMtdMinor + metrics.deferredRevenueBalanceMinor === metrics.collectionsMtdMinor,
    `Recognised + Deferred equals Total Collections MTD (₹18.4L)`
  )

  // ─── 5. Cohort Table Elapsed Horizon Rules ───
  console.log('\n--- 5. Cohort Retention Elapsed Horizons (As of Aug 2026) ---')
  const janCohort = cohorts.find(c => c.cohort === 'Jan 2026')!
  const junCohort = cohorts.find(c => c.cohort === 'Jun 2026')!

  assert(
    janCohort.month1 === 96 && janCohort.month3 === 88 && janCohort.month6 === 81,
    `Jan 2026 has valid elapsed horizons for M+1, M+3, M+6`
  )
  assert(
    janCohort.month12 === null || janCohort.month12 === undefined,
    `Jan 2026 leaves unreached future horizon M+12 null (no fake data)`
  )
  assert(
    junCohort.month1 === 95,
    `Jun 2026 has valid M+1 elapsed horizon`
  )
  assert(
    junCohort.month3 === null || junCohort.month3 === undefined,
    `Jun 2026 leaves unreached M+3 horizon null`
  )

  // ─── 6. Seed Data Plausibility & Realism ───
  console.log('\n--- 6. Seed Data Realism & Variation ---')
  const uniqueNames = new Set(members.map(m => m.name))
  assert(
    uniqueNames.size > 300,
    `Members dataset has high name diversity (${uniqueNames.size} distinct names across 659 records)`
  )

  // Phone numbers should NOT be sequential (e.g. not ending in 0001, 0002, 0003)
  const phone1 = members[0].phone
  const phone2 = members[1].phone
  const phone3 = members[2].phone
  const isSequential = phone1.slice(-4) === '0001' && phone2.slice(-4) === '0002' && phone3.slice(-4) === '0003'
  assert(!isSequential, `Phone numbers are non-sequential (${phone1}, ${phone2}, ${phone3})`)

  // Attendance Streaks
  const activeMembersWithStreaks = members.filter(m => m.status === 'active' && m.attendance_streak > 0)
  assert(
    activeMembersWithStreaks.length > 400,
    `Active members have plausible non-zero attendance streaks (${activeMembersWithStreaks.length} active members with streaks)`
  )

  const avgCheckIns = Math.round(members.reduce((acc, m) => acc + m.total_check_ins, 0) / members.length)
  assert(
    avgCheckIns >= 30 && avgCheckIns <= 120,
    `Average studio visits is plausible (${avgCheckIns} visits / member)`
  )

  console.log('\n============================================================')
  console.log(`  Test Results: ${passed} passed, ${failed} failed`)
  console.log('============================================================\n')

  if (failed > 0) {
    process.exit(1)
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err)
  process.exit(1)
})
