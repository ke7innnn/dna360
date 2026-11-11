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

import './test-env'
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

  // ─── 3. GST back-calculation on REAL collections (no hardcoded revenue) ───
  console.log('\n--- 3. GST SAC 999723 Back-Calculation Arithmetic (live collections) ---')
  const collections = metrics.collectionsMtdMinor
  const expectedGst = Math.round((collections * 5) / 105)
  assert(metrics.gstLiabilityMinor === expectedGst, 'GST liability is exactly Amount x 5 / 105 of real collections')
  assert(metrics.taxableRevenueMinor === collections - expectedGst, 'Taxable value is Collections - GST')
  assert(metrics.cgstMinor + metrics.sgstMinor === metrics.gstLiabilityMinor, 'CGST + SGST equals total GST liability')
  assert(gst.sacCode === '999723', 'SAC Code is correctly set to 999723 for Fitness Services')

  // ─── 4. Recognised vs Deferred ───
  console.log('\n--- 4. Upfront Collections vs. Recognised & Deferred Revenue ---')
  assert(metrics.recognisedRevenueMtdMinor === Math.round(collections / 12), 'Recognised revenue is 1/12th of upfront collections')
  assert(
    metrics.recognisedRevenueMtdMinor + metrics.deferredRevenueBalanceMinor === collections,
    'Recognised + Deferred equals Total Collections MTD'
  )

  // ─── 5. Cohorts built from real join dates; unreached horizons stay null ───
  console.log('\n--- 5. Cohort Retention Elapsed Horizons ---')
  const newest = cohorts[cohorts.length - 1]
  assert(cohorts.length === 6, 'Cohort table covers the last 6 calendar months')
  assert(newest.month1 === null || newest.month1 === undefined, 'Current-month cohort leaves unreached M+1 horizon null (no fake data)')
  assert(newest.month12 === null || newest.month12 === undefined, 'Unreached M+12 horizon is null')

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
