/**
 * DNA 360 RBAC & Security Hardening Automated Test Suite
 *
 * Verifies:
 * 1. 9 Canonical Roles + Member capability mapping (§3)
 * 2. Strict Revenue Endpoint Isolation (Only owner_admin permitted, all 8 other roles + member get 403)
 * 3. Export Controls Isolation (/api/members/export and /api/billing/export-gstr1)
 * 4. Personal Training IDOR Barrier (/api/training/trainer/clients/[id])
 * 5. Account Lockout & Generic Error Protection (5 failed attempts -> 429)
 * 6. Mandatory Password Change Enforcement & Complexity Validation
 * 7. Optical Turnstile Dynamic QR Security (90s expiry, replay detection, scanner cooldown)
 */

import { NextRequest } from 'next/server'
import { middleware } from '../middleware'
import {
  ROLE_CAPS,
  canAccessRevenue,
} from '../config/permissions'
import {
  createServerSession,
  validatePasswordComplexity,
  resetLoginAttempts,
  SESSION_COOKIE_NAME,
} from '../lib/server-auth'
import {
  SEEDED_USERS,
  SEEDED_ROLE_DEFINITIONS,
  getRoleDefaultRedirect,
  POWAI_BRANCH,
} from '../lib/auth'
import {
  validateAndConsumeQrToken,
  recordInvalidScan,
  getScannerLockStatus,
  resetQrSecurityState,
} from '../lib/qr-security'
import { GET as getRevenueApi } from '../app/api/revenue/route'
import { GET as exportMembersApi } from '../app/api/members/export/route'
import { GET as exportGstr1Api } from '../app/api/billing/export-gstr1/route'
import { GET as getTrainerClientApi } from '../app/api/training/trainer/clients/[id]/route'
import { POST as loginApi } from '../app/api/auth/login/route'
import { POST as changePasswordApi } from '../app/api/auth/change-password/route'
import type { AuthUser, RoleSlug } from '../types/auth'

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

// Helper to construct mock user for any canonical role
function createMockUser(slug: RoleSlug, overrides: Partial<AuthUser> = {}): AuthUser {
  const roleDef = SEEDED_ROLE_DEFINITIONS.find((r) => r.slug.toLowerCase() === slug.toLowerCase()) || {
    id: `role_${slug}`,
    name: slug,
    slug,
    description: '',
    capabilities: ROLE_CAPS[slug] || [],
    isSystem: true,
    createdAt: new Date().toISOString(),
  }

  return {
    id: `usr_${slug}_test`,
    clubId: 'club_powai',
    type: slug === 'member' ? 'MEMBER' : 'STAFF',
    name: `Test ${slug}`,
    email: `${slug}@test.dna360.in`,
    phone: '+919800000000',
    role: roleDef,
    designation: roleDef.name,
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: slug === 'owner_admin' || slug === 'owner',
    requires_login: true,
    ...overrides,
  }
}

// Helper to make authenticated NextRequest
function createAuthRequest(url: string, user: AuthUser, method = 'GET', body?: any): NextRequest {
  const token = createServerSession(user)
  const req = new NextRequest(url, {
    method,
    headers: {
      cookie: `${SESSION_COOKIE_NAME}=${token}`,
      'content-type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  return req
}

async function runTests() {
  console.log('\n============================================================')
  console.log('  DNA 360 RBAC & Security Hardening Test Suite')
  console.log('============================================================\n')

  // ──────────────────────────────────────────────────────────────────────────
  // 1. CANONICAL ROLE CATALOG & REVENUE CAPABILITY CHECK (§3)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('--- 1. Canonical Role Catalog & Revenue Gate Checks ---')
  const canonicalRoles: RoleSlug[] = [
    'owner_admin',
    'hr_head',
    'sales_head',
    'sales_consultant',
    'front_desk',
    'supervisor',
    'head_trainer',
    'general_trainer',
    'masseur',
  ]

  assert(
    canonicalRoles.every((r) => Array.isArray(ROLE_CAPS[r])),
    'All 9 canonical staff roles have defined capability bundles in ROLE_CAPS'
  )

  assert(
    canAccessRevenue(createMockUser('owner_admin')) === true,
    'canAccessRevenue returns TRUE for owner_admin'
  )

  const nonRevenueRoles: RoleSlug[] = [
    'hr_head',
    'sales_head',
    'sales_consultant',
    'front_desk',
    'supervisor',
    'head_trainer',
    'general_trainer',
    'masseur',
    'member',
  ]

  for (const role of nonRevenueRoles) {
    const user = createMockUser(role)
    assert(
      canAccessRevenue(user) === false,
      `canAccessRevenue returns FALSE for role: '${role}'`
    )
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. REVENUE API ISOLATION (/api/revenue)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- 2. Revenue API Route Isolation (/api/revenue) ---')
  // Owner Admin access
  const ownerUser = createMockUser('owner_admin')
  const ownerReq = createAuthRequest('http://localhost:3000/api/revenue', ownerUser)
  const ownerRes = await getRevenueApi(ownerReq)
  assert(
    ownerRes.status === 200,
    'owner_admin receives HTTP 200 OK from /api/revenue'
  )

  // Non-owner roles MUST receive 403 Forbidden
  for (const role of nonRevenueRoles) {
    const user = createMockUser(role)
    const req = createAuthRequest('http://localhost:3000/api/revenue', user)
    const res = await getRevenueApi(req)
    const body = await res.json()
    assert(
      res.status === 403 && body.code === 'FORBIDDEN',
      `Role '${role}' receives HTTP 403 Forbidden from /api/revenue`
    )
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 3. EXPORT ENDPOINTS GOVERNANCE
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- 3. Export Controls Isolation ---')
  // Members Export
  const ownerExpReq = createAuthRequest('http://localhost:3000/api/members/export', ownerUser)
  const ownerExpRes = await exportMembersApi(ownerExpReq)
  assert(
    Boolean(ownerExpRes.status === 200 && ownerExpRes.headers.get('content-type')?.includes('text/csv')),
    'owner_admin successfully exports members directory (HTTP 200 CSV)'
  )

  const hrExpReq = createAuthRequest('http://localhost:3000/api/members/export', createMockUser('hr_head'))
  const hrExpRes = await exportMembersApi(hrExpReq)
  assert(
    hrExpRes.status === 403,
    'hr_head is forbidden from exporting members directory (HTTP 403)'
  )

  const trainerExpReq = createAuthRequest('http://localhost:3000/api/members/export', createMockUser('general_trainer'))
  const trainerExpRes = await exportMembersApi(trainerExpReq)
  assert(
    trainerExpRes.status === 403,
    'general_trainer is forbidden from exporting members directory (HTTP 403)'
  )

  // GSTR-1 Billing Export
  const ownerGstrReq = createAuthRequest('http://localhost:3000/api/billing/export-gstr1', ownerUser)
  const ownerGstrRes = await exportGstr1Api(ownerGstrReq)
  assert(
    ownerGstrRes.status === 200,
    'owner_admin successfully exports GSTR-1 data (HTTP 200)'
  )

  const fcGstrReq = createAuthRequest('http://localhost:3000/api/billing/export-gstr1', createMockUser('sales_consultant'))
  const fcGstrRes = await exportGstr1Api(fcGstrReq)
  assert(
    fcGstrRes.status === 403,
    'sales_consultant is forbidden from exporting GSTR-1 data (HTTP 403)'
  )

  // ──────────────────────────────────────────────────────────────────────────
  // 4. PERSONAL TRAINING IDOR BARRIER (/api/training/trainer/clients/[id])
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- 4. Personal Training IDOR Barrier ---')
  // Setup Trainer A (assigned to mem_001) and Trainer B (assigned to mem_002)
  const trainerA = createMockUser('general_trainer', {
    id: 'usr_trainer_alpha',
    assignedClientIds: ['mem_001'],
  })
  const trainerB = createMockUser('general_trainer', {
    id: 'usr_trainer_beta',
    assignedClientIds: ['mem_002'],
  })

  // Trainer A requesting assigned client mem_001 -> 200 OK
  const trAReq1 = createAuthRequest('http://localhost:3000/api/training/trainer/clients/mem_001', trainerA)
  const trARes1 = await getTrainerClientApi(trAReq1, { params: { id: 'mem_001' } })
  assert(
    trARes1.status === 200,
    'Trainer A accessing assigned client mem_001 returns HTTP 200 OK'
  )

  // Trainer A requesting UNASSIGNED client mem_002 -> 403 Forbidden (IDOR BLOCKED)
  const trAReq2 = createAuthRequest('http://localhost:3000/api/training/trainer/clients/mem_002', trainerA)
  const trARes2 = await getTrainerClientApi(trAReq2, { params: { id: 'mem_002' } })
  const idorBody = await trARes2.json()
  assert(
    trARes2.status === 403 && idorBody.code === 'CLIENT_ACCESS_DENIED',
    'Trainer A requesting unassigned client mem_002 receives HTTP 403 Forbidden (IDOR Barrier Enforced)'
  )

  // Head Trainer requesting mem_002 -> 200 OK (Department Oversight)
  const headTrainer = createMockUser('head_trainer', { id: 'usr_ht_01' })
  const htReq = createAuthRequest('http://localhost:3000/api/training/trainer/clients/mem_002', headTrainer)
  const htRes = await getTrainerClientApi(htReq, { params: { id: 'mem_002' } })
  assert(
    htRes.status === 200,
    'Head Trainer requesting client mem_002 returns HTTP 200 OK (Department Oversight)'
  )

  // Owner requesting mem_002 -> 200 OK (Executive Oversight)
  const ownerClReq = createAuthRequest('http://localhost:3000/api/training/trainer/clients/mem_002', ownerUser)
  const ownerClRes = await getTrainerClientApi(ownerClReq, { params: { id: 'mem_002' } })
  assert(
    ownerClRes.status === 200,
    'owner_admin requesting client mem_002 returns HTTP 200 OK (Executive Oversight)'
  )

  // ──────────────────────────────────────────────────────────────────────────
  // 5. BRUTE FORCE LOCKOUT & ANTI-ENUMERATION PROTECTION
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- 5. Brute Force Account Lockout & Generic Error Protection ---')
  const testEmail = 'lockout_test_target@dna360.in'
  resetLoginAttempts(testEmail)

  let lastRes: any = null
  for (let i = 1; i <= 5; i++) {
    const fakeLoginReq = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'WrongPassword!123' }),
    })
    lastRes = await loginApi(fakeLoginReq)
  }

  const lockedBody = await lastRes.json()
  assert(
    lastRes.status === 429 && lockedBody.code === 'ACCOUNT_LOCKED',
    '5 consecutive failed login attempts trigger HTTP 429 Account Lockout'
  )

  assert(
    lockedBody.error.toLowerCase().includes('temporarily locked') && !lockedBody.error.includes('does not exist'),
    'Lockout error message is generic and does not leak account existence'
  )

  // 6th attempt immediately rejected
  const lockedReq = new NextRequest('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'AnyPassword!123' }),
  })
  const lockedRes = await loginApi(lockedReq)
  assert(
    lockedRes.status === 429,
    'Subsequent attempt during lockout window is immediately rejected with HTTP 429'
  )

  // ──────────────────────────────────────────────────────────────────────────
  // 6. MANDATORY PASSWORD CHANGE ENFORCEMENT & COMPLEXITY
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- 6. Mandatory Password Change Policy & Complexity ---')
  // Complexity Unit Tests
  assert(validatePasswordComplexity('short').valid === false, 'Password < 10 chars rejected')
  assert(validatePasswordComplexity('alllowercase123!').valid === false, 'Password without uppercase rejected')
  assert(validatePasswordComplexity('ALLUPPERCASE123!').valid === false, 'Password without lowercase rejected')
  assert(validatePasswordComplexity('NoNumbersSpecial!').valid === false, 'Password without numeric digit rejected')
  assert(validatePasswordComplexity('NoSpecialChar12345').valid === false, 'Password without special character rejected')
  assert(validatePasswordComplexity('Valid#Pass2026!').valid === true, 'Strong password meeting all complexity criteria accepted')

  // User with must_change_password: true
  const userMustChange = createMockUser('sales_consultant', {
    must_change_password: true,
  })

  // Default redirect helper routes to /change-password
  assert(
    getRoleDefaultRedirect(userMustChange.role.slug, userMustChange) === '/change-password',
    'getRoleDefaultRedirect routes user with must_change_password to /change-password'
  )

  // Middleware redirects to /change-password when navigating to /overview
  const reqOverview = createAuthRequest('http://localhost:3000/overview', userMustChange)
  const resOverview = middleware(reqOverview)
  assert(
    Boolean(resOverview.status === 307 && resOverview.headers.get('location')?.includes('/change-password')),
    'Middleware intercepts protected route request and redirects to /change-password'
  )

  // Middleware allows reaching /change-password
  const reqChangePwPage = createAuthRequest('http://localhost:3000/change-password', userMustChange)
  const resChangePwPage = middleware(reqChangePwPage)
  assert(
    resChangePwPage.status === 200,
    'Middleware allows user with must_change_password to access /change-password'
  )

  // Change password endpoint rejects non-compliant new password
  const weakPwReq = createAuthRequest('http://localhost:3000/api/auth/change-password', userMustChange, 'POST', {
    currentPassword: 'OldPassword123',
    newPassword: 'weak',
    confirmPassword: 'weak',
  })
  const weakPwRes = await changePasswordApi(weakPwReq)
  assert(
    weakPwRes.status === 400,
    '/api/auth/change-password rejects non-compliant new password with HTTP 400'
  )

  // Change password endpoint rejects mismatch
  const mismatchReq = createAuthRequest('http://localhost:3000/api/auth/change-password', userMustChange, 'POST', {
    currentPassword: 'OldPassword123',
    newPassword: 'StrongPassword!2026',
    confirmPassword: 'DifferentPassword!2026',
  })
  const mismatchRes = await changePasswordApi(mismatchReq)
  assert(
    mismatchRes.status === 400,
    '/api/auth/change-password rejects password confirmation mismatch with HTTP 400'
  )

  // ──────────────────────────────────────────────────────────────────────────
  // 7. OPTICAL TURNSTILE QR ANTI-FRAUD & RATE LIMITING
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- 7. Optical Turnstile Dynamic QR Security ---')
  resetQrSecurityState()

  const now = Date.now()
  const memberCode = 'DNA-2025-0012'

  // Fresh QR Code (age 15s) -> VALID
  const freshPayload = `DNA360:${memberCode}:${now - 15000}`
  const validScan = validateAndConsumeQrToken(freshPayload, now)
  assert(
    validScan.valid === true && validScan.memberCode === memberCode,
    'Fresh dynamic QR token (< 90s) is accepted and verified'
  )

  // Replay of same token -> REJECTED
  const replayScan = validateAndConsumeQrToken(freshPayload, now)
  assert(
    replayScan.valid === false && replayScan.error === 'REPLAY_DETECTED',
    'Replay of already-consumed QR token is blocked with REPLAY_DETECTED'
  )

  // Expired QR Code (age 100s > 90s limit) -> REJECTED
  const expiredPayload = `DNA360:${memberCode}:${now - 100000}`
  const expiredScan = validateAndConsumeQrToken(expiredPayload, now)
  assert(
    expiredScan.valid === false && expiredScan.error === 'EXPIRED_TOKEN',
    'QR token older than 90 seconds is rejected with EXPIRED_TOKEN'
  )

  // Scanner Cooldown Rate Limiting (5 invalid scans trigger 30s lock)
  resetQrSecurityState()
  for (let i = 0; i < 4; i++) {
    recordInvalidScan(now)
  }
  assert(
    getScannerLockStatus(now).isLocked === false,
    'Scanner remains unlocked after 4 failed scans'
  )

  const fifthInvalid = recordInvalidScan(now)
  assert(
    fifthInvalid.isLocked === true && fifthInvalid.cooldownRemainingSeconds > 0,
    '5th consecutive invalid scan triggers 30-second scanner cooldown lock'
  )

  // Any scan during cooldown is rejected with RATE_LIMITED
  const cooldownScan = validateAndConsumeQrToken(`DNA360:${memberCode}:${now}`, now)
  assert(
    cooldownScan.valid === false && cooldownScan.error === 'RATE_LIMITED',
    'Scans attempted during cooldown period are rejected with RATE_LIMITED'
  )

  console.log('\n============================================================')
  console.log(`  RESULTS: ${passed} PASSED / ${failed} FAILED`)
  console.log('============================================================\n')

  if (failed > 0) {
    process.exit(1)
  }
}

runTests().catch((err) => {
  console.error('Fatal error running tests:', err)
  process.exit(1)
})
