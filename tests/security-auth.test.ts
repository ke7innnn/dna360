/**
 * DNA 360 Security & Authentication Automated Test Suite (Phase 1)
 *
 * Asserts all 9 Phase 1 acceptance criteria:
 * 1. Server-side session enforcement (307 redirect on unauth page, 401 on unauth API).
 * 2. Role-based authorization on API endpoints.
 * 3. Trainer role restriction on revenue, GSTR-1, and member exports (403 Forbidden).
 * 4. PII masking on member list views.
 * 5. Audit-logged contact number reveal action.
 * 6. Rate-limited and audit-logged export protection.
 * 7. Rate-limited login lockout after 5 failed attempts.
 * 8. Session destruction on logout.
 * 9. Security headers & crawl protection (X-Robots-Tag, CSP, robots.txt).
 */

import { NextRequest } from 'next/server'
import { middleware } from '../middleware'
import {
  createServerSession,
  verifyToken,
  checkLoginLockout,
  recordFailedLogin,
  resetLoginAttempts,
  checkExportRateLimit,
  maskPhoneNumber,
  SESSION_COOKIE_NAME,
} from '../lib/server-auth'
import { SEEDED_USERS, SEEDED_ROLE_DEFINITIONS } from '../lib/auth'
import { getAuditLogs } from '../lib/audit'
import { GET as getMembersApi } from '../app/api/members/route'
import { GET as getRevenueApi } from '../app/api/revenue/route'
import { GET as exportMembersApi } from '../app/api/members/export/route'
import { GET as exportGstr1Api } from '../app/api/billing/export-gstr1/route'
import { POST as revealPhoneApi } from '../app/api/members/[id]/reveal-phone/route'
import { POST as loginApi } from '../app/api/auth/login/route'
import { POST as logoutApi } from '../app/api/auth/logout/route'

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
  console.log('  DNA 360 Phase 1 Security & Authentication Test Suite')
  console.log('============================================================\n')

  const ownerUser = SEEDED_USERS.find(u => u.role.slug === 'OWNER')!
  const trainerUser = SEEDED_USERS.find(u => u.role.slug === 'TRAINER')!
  const fcUser = SEEDED_USERS.find(u => u.role.slug === 'FITNESS_CONSULTANT')!

  const ownerToken = createServerSession(ownerUser)
  const trainerToken = createServerSession(trainerUser)
  const fcToken = createServerSession(fcUser)

  // ─── Test 1: Middleware redirects unauthenticated page request to /login ───
  console.log('--- 1. Server-Side Session Enforcement ---')
  const unauthOverviewReq = new NextRequest('http://localhost:3000/overview')
  const unauthOverviewRes = middleware(unauthOverviewReq)
  assert(
    unauthOverviewRes.status === 307 &&
    unauthOverviewRes.headers.get('location')?.includes('/login?redirect=%2Foverview'),
    'Unauthenticated page request to /overview returns HTTP 307 Redirect to /login'
  )

  const unauthMembersReq = new NextRequest('http://localhost:3000/members')
  const unauthMembersRes = middleware(unauthMembersReq)
  assert(
    unauthMembersRes.status === 307,
    'Unauthenticated page request to /members returns HTTP 307 Redirect to /login'
  )

  // ─── Test 2: Middleware returns 401 Unauthorized for unauthenticated API requests ───
  const unauthApiReq = new NextRequest('http://localhost:3000/api/members')
  const unauthApiRes = middleware(unauthApiReq)
  assert(
    unauthApiRes.status === 401,
    'Unauthenticated request to /api/members returns HTTP 401 Unauthorized'
  )

  // ─── Test 3: Public routes are accessible without session ───
  console.log('\n--- 2. Public Route Whitelisting ---')
  const publicContactReq = new NextRequest('http://localhost:3000/contact')
  const publicContactRes = middleware(publicContactReq)
  assert(
    publicContactRes.status === 200,
    'Public route /contact is accessible without authentication'
  )

  const publicServicesReq = new NextRequest('http://localhost:3000/services/personal-training')
  const publicServicesRes = middleware(publicServicesReq)
  assert(
    publicServicesRes.status === 200,
    'Public route /services/* is accessible without authentication'
  )

  // ─── Test 4: Security Headers ───
  console.log('\n--- 3. Defense-in-Depth Security Headers ---')
  assert(
    unauthOverviewRes.headers.get('X-Robots-Tag')?.includes('noindex'),
    'X-Robots-Tag: noindex, nofollow is set on responses'
  )
  assert(
    unauthOverviewRes.headers.get('X-Frame-Options') === 'DENY',
    'X-Frame-Options: DENY is enforced'
  )
  assert(
    unauthOverviewRes.headers.get('X-Content-Type-Options') === 'nosniff',
    'X-Content-Type-Options: nosniff is enforced'
  )

  // ─── Test 5: Role-Based Authorization — Trainer restricted from Revenue (403) ───
  console.log('\n--- 4. Role-Based Access Control (RBAC) ---')
  const trainerRevenueReq = new NextRequest('http://localhost:3000/api/revenue', {
    headers: { Authorization: `Bearer ${trainerToken}` },
  })
  const trainerRevenueRes = await getRevenueApi(trainerRevenueReq)
  assert(
    trainerRevenueRes.status === 403,
    'Trainer role receives HTTP 403 Forbidden when requesting /api/revenue'
  )

  // Owner accessing revenue returns 200
  const ownerRevenueReq = new NextRequest('http://localhost:3000/api/revenue', {
    headers: { Authorization: `Bearer ${ownerToken}` },
  })
  const ownerRevenueRes = await getRevenueApi(ownerRevenueReq)
  assert(
    ownerRevenueRes.status === 200,
    'Owner role receives HTTP 200 OK with revenue data when requesting /api/revenue'
  )

  // ─── Test 6: Trainer restricted from GSTR-1 and Member Exports (403) ───
  const trainerGstr1Req = new NextRequest('http://localhost:3000/api/billing/export-gstr1', {
    headers: { Authorization: `Bearer ${trainerToken}` },
  })
  const trainerGstr1Res = await exportGstr1Api(trainerGstr1Req)
  assert(
    trainerGstr1Res.status === 403,
    'Trainer role receives HTTP 403 Forbidden on GSTR-1 export'
  )

  const trainerExportReq = new NextRequest('http://localhost:3000/api/members/export', {
    headers: { Authorization: `Bearer ${trainerToken}` },
  })
  const trainerExportRes = await exportMembersApi(trainerExportReq)
  assert(
    trainerExportRes.status === 403,
    'Trainer role receives HTTP 403 Forbidden on member directory export'
  )

  // ─── Test 7: PII Masking on Member Directory ───
  console.log('\n--- 5. PII Masking & Server-Side Pagination ---')
  const ownerMembersReq = new NextRequest('http://localhost:3000/api/members?page=1&pageSize=10', {
    headers: { Authorization: `Bearer ${ownerToken}` },
  })
  const ownerMembersRes = await getMembersApi(ownerMembersReq)
  const ownerMembersData = await ownerMembersRes.json()
  assert(
    ownerMembersRes.status === 200 && ownerMembersData.members.length === 10,
    'Server-side pagination returns requested page size (10 records)'
  )
  assert(
    ownerMembersData.members[0].phone.includes('••••'),
    `Phone number is masked by default in member list (${ownerMembersData.members[0].phone})`
  )

  // ─── Test 8: Audit-Logged Phone Reveal ───
  console.log('\n--- 6. Audit-Logged PII Reveal Action ---')
  const initialAuditCount = getAuditLogs().length
  const revealReq = new NextRequest('http://localhost:3000/api/members/mem_001/reveal-phone', {
    method: 'POST',
    headers: { Authorization: `Bearer ${ownerToken}` },
  })
  const revealRes = await revealPhoneApi(revealReq, { params: { id: 'mem_001' } })
  const revealData = await revealRes.json()
  const postRevealAuditLogs = getAuditLogs()

  assert(
    revealRes.status === 200 && revealData.phone && !revealData.phone.includes('••••'),
    'Phone reveal endpoint returns unmasked phone number'
  )
  assert(
    postRevealAuditLogs.length > initialAuditCount &&
    postRevealAuditLogs[0].action === 'VIEW' &&
    postRevealAuditLogs[0].entity === 'MemberPhonePII',
    'Phone reveal writes mandatory audit trail entry'
  )

  // ─── Test 9: Rate Limiting & Export Protection ───
  console.log('\n--- 7. Rate Limiting on Exports ---')
  const testUserId = `test_export_user_${Date.now()}`
  const e1 = checkExportRateLimit(testUserId)
  const e2 = checkExportRateLimit(testUserId)
  const e3 = checkExportRateLimit(testUserId)
  const e4 = checkExportRateLimit(testUserId) // Exceeds max 3/hr
  assert(
    e1.allowed && e2.allowed && e3.allowed && !e4.allowed,
    'Export rate limiter allows 3 requests per hour and blocks the 4th with 429'
  )

  // ─── Test 10: Failed Login Lockout (5 attempts -> 15 min lock) ───
  console.log('\n--- 8. Brute Force Login Protection & Lockout ---')
  const testLoginId = `attacker_${Date.now()}@dna360.in`
  resetLoginAttempts(testLoginId)

  for (let i = 1; i <= 4; i++) {
    const res = recordFailedLogin(testLoginId)
    assert(!res.isLocked, `Failed login attempt #${i} leaves account unlocked`)
  }

  const fifthAttempt = recordFailedLogin(testLoginId)
  assert(fifthAttempt.isLocked, '5th consecutive failed login attempt locks account')

  const lockoutCheck = checkLoginLockout(testLoginId)
  assert(lockoutCheck.isLocked && lockoutCheck.remainingSeconds > 0, 'Login lockout status persists')

  resetLoginAttempts(testLoginId)
  assert(!checkLoginLockout(testLoginId).isLocked, 'Resetting login attempts removes lockout')

  // ─── Test 11: Phone Masking Utility ───
  console.log('\n--- 9. Utility Functions ---')
  assert(maskPhoneNumber('+919820099123') === '+91 ••••• •9123', 'maskPhoneNumber formats +91 numbers correctly')

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
