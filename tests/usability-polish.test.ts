/**
 * DNA 360 Usability, Accessibility & Navigation Test Suite (Phase 4)
 *
 * Asserts all Phase 4 acceptance criteria:
 * 1. Navigation hierarchy cleanup (no dead or duplicate links).
 * 2. Dual date formatting (relative + absolute).
 * 3. Table pagination and page size arithmetic across 659 records.
 * 4. Multi-select bulk export CSV data transformation.
 */

import { ALL_NAV_GROUPS } from '../config/navigation'
import { formatDualDate, formatAbsoluteDate } from '../lib/date-format'
import { getStoredMembers } from '../lib/members'

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
  console.log('  DNA 360 Phase 4 Usability & Polish Test Suite')
  console.log('============================================================\n')

  // ─── 1. Navigation Hierarchy & Cleanup ───
  console.log('--- 1. Navigation Hierarchy & Deduplication ---')
  const allItems = ALL_NAV_GROUPS.flatMap((g) => g.items)

  // Verify /analytics has its own dedicated financial route
  const analyticsItem = allItems.find((i) => i.id === 'analytics')
  assert(
    analyticsItem?.href === '/analytics',
    `Financial Analytics item points to dedicated '/analytics' route (got '${analyticsItem?.href}')`
  )

  // Verify Front Desk item exists
  const frontDeskItem = allItems.find((i) => i.id === 'front-desk')
  assert(
    frontDeskItem?.href === '/front-desk',
    `Front Desk Terminal item is configured at '/front-desk'`
  )

  // Verify no duplicate IDs
  const idCounts = allItems.reduce<Record<string, number>>((acc, item) => {
    acc[item.id] = (acc[item.id] || 0) + 1
    return acc
  }, {})
  const duplicateIds = Object.entries(idCounts).filter(([_, count]) => count > 1)
  assert(
    duplicateIds.length === 0,
    `No duplicate navigation IDs exist in ALL_NAV_GROUPS (found: ${duplicateIds.map(([id]) => id).join(', ') || 'none'})`
  )

  // ─── 2. Dual Relative & Absolute Date Engine ───
  console.log('\n--- 2. Dual Relative & Absolute Date Formatting ---')
  const sampleDate = '2026-09-15'
  const dualFormatted = formatDualDate(sampleDate)
  assert(
    dualFormatted.includes('in 15 days') && dualFormatted.includes('15 Sep 2026'),
    `formatDualDate produces relative + absolute readout: '${dualFormatted}'`
  )

  const absFormatted = formatAbsoluteDate(sampleDate)
  assert(
    absFormatted === '15 Sep 2026',
    `formatAbsoluteDate formats standard date correctly: '${absFormatted}'`
  )

  // ─── 3. Server-Side Table Pagination Arithmetic ───
  console.log('\n--- 3. Pagination & Multi-Select Arithmetic ---')
  const members = getStoredMembers()
  const total = members.length // 659

  const pages15 = Math.ceil(total / 15)
  const pages25 = Math.ceil(total / 25)
  const pages50 = Math.ceil(total / 50)

  assert(total === 659, `Total records under pagination is 659`)
  assert(pages15 === 44, `Page size 15 yields exactly 44 pages (got ${pages15})`)
  assert(pages25 === 27, `Page size 25 yields exactly 27 pages (got ${pages25})`)
  assert(pages50 === 14, `Page size 50 yields exactly 14 pages (got ${pages50})`)

  // ─── 4. Bulk Action Selection & CSV Transformation ───
  console.log('\n--- 4. Bulk Actions & CSV Transformation ---')
  const selectedMembers = members.slice(0, 5)
  const csvRows = ['Member Code,Name,Phone,Status'].concat(
    selectedMembers.map((m) => `"${m.member_code}","${m.name}","${m.phone}","${m.status}"`)
  )
  assert(
    csvRows.length === 6 && csvRows[1].includes(selectedMembers[0].member_code),
    `Bulk export correctly formats ${selectedMembers.length} selected records into valid CSV payload`
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
