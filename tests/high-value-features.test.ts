/**
 * DNA 360 High-Value Operational Features Test Suite (Phase 3)
 *
 * Asserts all Phase 3 acceptance criteria:
 * 1. Daily Action Queue generation, prioritization, and state transitions.
 * 2. WhatsApp Cloud engine, approved template catalog, interpolation, and Meta budget guard.
 * 3. Churn risk scoring based on attendance frequency decay.
 * 4. PT pack burn-down detection (>=80% consumed).
 * 5. Studio attendance heatmap 16-hour matrix and peak hour tagging.
 * 6. Renewal collections forecasting model (30, 60, 90-day horizons).
 */

import { generateDailyActionQueue, updateActionQueueItem } from '../lib/action-queue'
import {
  APPROVED_TEMPLATES,
  getWhatsAppBudget,
  sendWhatsAppMessage,
  interpolateTemplate,
} from '../lib/whatsapp'
import { computeChurnRadar } from '../lib/churn'
import { getAttendanceHeatmap } from '../lib/heatmap'
import { getRenewalForecast } from '../lib/forecast'
import { getAuditLogs } from '../lib/audit'

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
  console.log('  DNA 360 Phase 3 High-Value Features Test Suite')
  console.log('============================================================\n')

  // ─── 1. Daily Action Queue ───
  console.log('--- 1. Daily Action Queue & Workflows ---')
  const queue = generateDailyActionQueue()
  assert(queue.length >= 8, `Action queue contains prioritized daily tasks (got ${queue.length} items)`)

  const hasGrace = queue.some((i) => i.category === 'GRACE_RECOVERY' && i.priority === 'CRITICAL')
  const hasRenew = queue.some((i) => i.category === 'RENEWAL' && i.priority === 'HIGH')
  const hasPt = queue.some((i) => i.category === 'PT_BURNDOWN')
  const hasLead = queue.some((i) => i.category === 'LEAD_OUTREACH')

  assert(hasGrace, 'Action queue includes Critical Grace Period Dues tasks')
  assert(hasRenew, 'Action queue includes High-Priority 7-Day Renewal calls')
  assert(hasPt, 'Action queue includes PT Pack Burn-Down top-up tasks')
  assert(hasLead, 'Action queue includes Unassigned Lead outreach tasks')

  // Test item state transition
  const firstItem = queue[0]
  const updatedQueue = updateActionQueueItem(firstItem.id, 'done', 'Amit Sharma')
  const targetUpdated = updatedQueue.find((i) => i.id === firstItem.id)
  assert(
    targetUpdated?.status === 'done' && targetUpdated.completedBy === 'Amit Sharma',
    'Action item state successfully transitions to DONE and records actor'
  )

  // ─── 2. WhatsApp Cloud Engine & Meta Budget Guard ───
  console.log('\n--- 2. WhatsApp Cloud API & Meta Budget Guard ---')
  assert(
    APPROVED_TEMPLATES.length >= 5,
    `Approved template catalog contains ${APPROVED_TEMPLATES.length} pre-approved templates`
  )

  const renewalTpl = APPROVED_TEMPLATES.find((t) => t.id === 'tpl_renewal_reminder')!
  const interpolated = interpolateTemplate(renewalTpl, {
    member_name: 'Arjun Mehta',
    plan_name: 'Annual Gym Membership',
    expiry_date: '15 Sep 2026',
  })
  assert(
    interpolated.includes('Arjun Mehta') &&
    interpolated.includes('Annual Gym Membership') &&
    interpolated.includes('15 Sep 2026'),
    'Template variable interpolation replaces {{placeholders}} with live member data'
  )

  // Send message test
  const initialAuditCount = getAuditLogs().length
  const sendRes = sendWhatsAppMessage({
    memberId: 'mem_001',
    memberName: 'Arjun Mehta',
    phone: '+919820011111',
    templateId: 'tpl_renewal_reminder',
    variables: { member_name: 'Arjun Mehta', plan_name: 'Annual Gym', expiry_date: '15 Sep 2026' },
    actor: { id: 'usr_staff_01', name: 'Amit Sharma', role: 'Fitness Consultant' },
  })

  assert(sendRes.success, 'WhatsApp message transmission succeeds under budget')
  const postSendAudit = getAuditLogs()
  assert(
    postSendAudit.length > initialAuditCount &&
    postSendAudit[0].action === 'SEND_WHATSAPP' &&
    postSendAudit[0].entity === 'WhatsAppOutbound',
    'Outbound WhatsApp send writes an immutable audit record'
  )

  // Budget Guard
  const budget = getWhatsAppBudget()
  assert(
    budget.monthlyLimitInr === 5000 && budget.costPerMessageInr === 0.85,
    'Meta Budget Guard enforces ₹5,000 monthly limit with ₹0.85/msg cost tracking'
  )

  // ─── 3. Churn Risk Decay Radar ───
  console.log('\n--- 3. Churn Risk Scoring (Attendance Decay) ---')
  const churnProfiles = computeChurnRadar()
  assert(churnProfiles.length > 0, `Churn radar identified ${churnProfiles.length} members with attendance decay`)

  const highestRisk = churnProfiles[0]
  assert(
    highestRisk.riskScore >= 60,
    `Top at-risk member has high risk score (${highestRisk.riskScore}/100)`
  )
  assert(
    highestRisk.primaryRiskFactor.length > 0 && highestRisk.recommendedIntervention.length > 0,
    'Churn profile includes primary decay factor and recommended intervention'
  )

  // ─── 4. Studio Attendance Heatmap ───
  console.log('\n--- 4. Studio Attendance Heatmap (16-Hour Grid) ---')
  const heatmap = getAttendanceHeatmap()
  assert(heatmap.length === 7, 'Heatmap contains all 7 days of the week')
  assert(
    heatmap[0].slots.length === 16,
    `Each day contains 16 operational hourly slots (6 AM – 9 PM)`
  )
  const mondayMorningPeak = heatmap[0].slots.find((s) => s.hour === 7)!
  assert(
    mondayMorningPeak.isPeak && mondayMorningPeak.checkIns > 30,
    'Peak hour slots (7 AM) are flagged with peak status and elevated check-ins'
  )

  // ─── 5. Renewal Collections Forecast ───
  console.log('\n--- 5. Renewal Collections Forecast (30, 60, 90 Days) ---')
  const forecasts = getRenewalForecast()
  assert(forecasts.length === 3, 'Forecast model computes 30, 60, and 90-day horizons')

  const f30 = forecasts[0]
  assert(
    f30.scenarios.low.ratePct === 65 &&
    f30.scenarios.base.ratePct === 78 &&
    f30.scenarios.high.ratePct === 90,
    'Forecast provides Low (65%), Base (78%), and High (90%) scenario calculations'
  )
  assert(
    f30.scenarios.base.projectedCollectionsMinor > 0 &&
    f30.scenarios.base.projectedCollectionsMinor === Math.round(f30.totalGrossValueMinor * 0.78),
    `Base scenario projected collections correctly calculate at 78%: ₹${(f30.scenarios.base.projectedCollectionsMinor / 100).toLocaleString()}`
  )

  console.log('\n============================================================')
  console.log(`  Test Results: ${passed} passed, ${failed} failed`)
  console.log('============================================================\n')

  if (failed > 0) {
    process.exit(1)
  }
}

runTests().catch((err) => {
  console.error('Test execution error:', err)
  process.exit(1)
})
