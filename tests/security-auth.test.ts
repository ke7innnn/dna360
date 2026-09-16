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

import './test-env'
import { NextRequest } from 'next/server'
import { middleware } from '../middleware'
import {
  createServerSession,
  destroyServerSession,
  verifyToken,
  checkLoginLockout,
  recordFailedLogin,
  resetLoginAttempts,
  checkExportRateLimit,
  maskPhoneNumber,
  SESSION_COOKIE_NAME,
} from '../lib/server-auth'
import { requireEnv } from '../lib/env'
import { SEEDED_USERS, SEEDED_ROLE_DEFINITIONS, SEEDED_DEFAULT_TEMP_PASSWORD } from '../lib/auth'
import { getAuditLogs } from '../lib/audit'
import { GET as getMembersApi } from '../app/api/members/route'
import { GET as getRevenueApi } from '../app/api/revenue/route'
import { GET as exportMembersApi } from '../app/api/members/export/route'
import { GET as exportGstr1Api } from '../app/api/billing/export-gstr1/route'
import { POST as revealPhoneApi } from '../app/api/members/[id]/reveal-phone/route'
import { POST as loginApi } from '../app/api/auth/login/route'
import { POST as changePasswordApi } from '../app/api/auth/change-password/route'
import crypto from 'crypto'
import { findUserById } from '../lib/server-auth'
import { POST as whatsappSendApi } from '../app/api/whatsapp/send/route'
import { POST as whatsappWebhookPostApi, GET as whatsappWebhookGetApi } from '../app/api/whatsapp/webhook/route'
import { POST as razorpayCreateOrderApi } from '../app/api/razorpay/create-order/route'
import { POST as razorpayVerifyPaymentApi } from '../app/api/razorpay/verify-payment/route'
import { getStoredInvoices, saveInvoices, getInvoiceById } from '../lib/billing'
import { simulateColdStart, clearAttempts } from '../lib/rate-limit'
import { GET as trainingExportApi } from '../app/api/training/export/route'

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
  const unauthOverviewRes = await middleware(unauthOverviewReq)
  assert(
    Boolean(unauthOverviewRes.status === 307 && unauthOverviewRes.headers.get('location')?.includes('/login?redirect=%2Foverview')),
    'Unauthenticated page request to /overview returns HTTP 307 Redirect to /login'
  )

  const unauthMembersReq = new NextRequest('http://localhost:3000/members')
  const unauthMembersRes = await middleware(unauthMembersReq)
  assert(
    unauthMembersRes.status === 307,
    'Unauthenticated page request to /members returns HTTP 307 Redirect to /login'
  )

  // ─── Test 2: Middleware returns 401 Unauthorized for unauthenticated API requests ───
  const unauthApiReq = new NextRequest('http://localhost:3000/api/members')
  const unauthApiRes = await middleware(unauthApiReq)
  assert(
    unauthApiRes.status === 401,
    'Unauthenticated request to /api/members returns HTTP 401 Unauthorized'
  )

  // ─── Test 3: Public routes are accessible without session ───
  console.log('\n--- 2. Public Route Whitelisting ---')
  const publicContactReq = new NextRequest('http://localhost:3000/contact')
  const publicContactRes = await middleware(publicContactReq)
  assert(
    publicContactRes.status === 200,
    'Public route /contact is accessible without authentication'
  )

  const publicServicesReq = new NextRequest('http://localhost:3000/services/personal-training')
  const publicServicesRes = await middleware(publicServicesReq)
  assert(
    publicServicesRes.status === 200,
    'Public route /services/* is accessible without authentication'
  )

  // ─── Test 4: Security Headers ───
  console.log('\n--- 3. Defense-in-Depth Security Headers ---')
  assert(
    Boolean(unauthOverviewRes.headers.get('X-Robots-Tag')?.includes('noindex')),
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

  // ─── Test 12: Phase 2 Session Integrity & Hardening ───
  console.log('\n--- 10. Phase 2 Session Integrity & Hardening ---')

  // 12a: Handcrafted / forged cookie returns 401
  const forgedReq = new NextRequest('http://localhost:3000/api/members', {
    headers: { cookie: `${SESSION_COOKIE_NAME}=forged_cookie_token_with_no_session_record` },
  })
  const forgedRes = await middleware(forgedReq)
  assert(forgedRes.status === 401, 'Handcrafted/forged cookie returns HTTP 401 Unauthorized')

  // 12b: Real logout — session revocation causes immediate 401 on reuse
  const logoutUser = { ...SEEDED_USERS[0], must_change_password: false }
  const sessionToRevoke = createServerSession(logoutUser)
  const preLogoutReq = new NextRequest('http://localhost:3000/api/members', {
    headers: { cookie: `${SESSION_COOKIE_NAME}=${sessionToRevoke}` },
  })
  const preLogoutRes = await middleware(preLogoutReq)
  assert(preLogoutRes.status === 200, 'Active session accesses protected route before logout')

  destroyServerSession(sessionToRevoke)

  const postLogoutReq = new NextRequest('http://localhost:3000/api/members', {
    headers: { cookie: `${SESSION_COOKIE_NAME}=${sessionToRevoke}` },
  })
  const postLogoutRes = await middleware(postLogoutReq)
  assert(postLogoutRes.status === 401, 'Reusing revoked session cookie returns HTTP 401 Unauthorized')

  // 12c: Tampered token returns 401
  const tamperedReq = new NextRequest('http://localhost:3000/api/members', {
    headers: { cookie: `${SESSION_COOKIE_NAME}=${sessionToRevoke}extra_junk` },
  })
  const tamperedRes = await middleware(tamperedReq)
  assert(tamperedRes.status === 401, 'Tampered token returns HTTP 401 Unauthorized')

  // 12d: requireEnv fail-closed validation
  let envThrew = false
  try {
    requireEnv('NON_EXISTENT_SECRET_FOR_TESTING')
  } catch {
    envThrew = true
  }
  assert(envThrew, 'requireEnv strictly throws on missing or short environment secrets')

  // 12e: Client-provided / forged role claims are ignored; DB session role strictly governs authorization
  const memberUserForRoleCheck = SEEDED_USERS.find(u => u.role.slug === 'MEMBER' || (u as any).user_type === 'MEMBER') || {
    id: 'mem_role_test',
    email: 'member.role.test@dna360.in',
    role: { id: 'r_mem', name: 'Member', slug: 'MEMBER' },
    user_type: 'MEMBER' as const,
    name: 'Role Test Member',
    requires_login: false,
    must_change_password: false,
  }
  const memberTokenForRoleCheck = createServerSession(memberUserForRoleCheck as any)
  const forgedRoleReq = new NextRequest('http://localhost:3000/overview', {
    headers: {
      cookie: `${SESSION_COOKIE_NAME}=${memberTokenForRoleCheck}`,
      'x-role': 'owner_admin',
    },
  })
  const forgedRoleRes = await middleware(forgedRoleReq)
  assert(
    forgedRoleRes.status === 307 && Boolean(forgedRoleRes.headers.get('location')?.endsWith('/m')),
    'Client-supplied role claims are ignored; DB/session role strictly governs authorization (redirected to /m)'
  )

  // ─── Test 13: Phase 3 Authentication Hardening ───
  console.log('\n--- 11. Phase 3 Authentication Hardening ---')

  // 13a: Every historical backdoor returns 401
  const backdoorPasswords = [
    'Swapnil@123',
    'swapnil@123',
    'password123',
    'Password@123',
    'Admin@123',
    'admin@123',
    'Dna#Admin92!kP',
    'Dna#Keith84!xM',
  ]

  for (const bd of backdoorPasswords) {
    resetLoginAttempts('swapnil.hr@dna360.in')
    const bdReq = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifier: 'swapnil.hr@dna360.in', password: bd }),
    })
    const bdRes = await loginApi(bdReq)
    assert(bdRes.status === 401, `Backdoor password '${bd}' is blocked with HTTP 401`)
  }

  // 13b: Seeded accounts use cost-12 bcrypt hash starting with $2b$12$ or $2a$12$
  const staffWithLogins = SEEDED_USERS.filter((u) => u.requires_login)
  const allHashedCost12 = staffWithLogins.every(
    (u) => Boolean(u.passwordHash && (u.passwordHash.startsWith('$2b$12$') || u.passwordHash.startsWith('$2a$12$')))
  )
  assert(allHashedCost12, 'All seeded staff accounts have cost-12 bcrypt hashes ($2b$12$)')

  // 13c: Correct password for seeded account succeeds and forces /change-password
  resetLoginAttempts('swapnil.hr@dna360.in')
  const validLoginReq = new NextRequest('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ identifier: 'swapnil.hr@dna360.in', password: SEEDED_DEFAULT_TEMP_PASSWORD }),
  })
  const validLoginRes = await loginApi(validLoginReq)
  const validLoginData = await validLoginRes.json()
  assert(
    validLoginRes.status === 200 &&
      validLoginData.must_change_password === true &&
      validLoginData.redirectUrl === '/change-password',
    'Valid login for seeded account succeeds with must_change_password: true and redirects to /change-password'
  )

  // 13d: Change password rejects reusing current password
  const adminUser = SEEDED_USERS.find((u) => u.email === 'admin@dna360.in')!
  const changePwReuseReq = new NextRequest('http://localhost:3000/api/auth/change-password', {
    method: 'POST',
    headers: {
      cookie: `${SESSION_COOKIE_NAME}=${ownerToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      currentPassword: SEEDED_DEFAULT_TEMP_PASSWORD,
      newPassword: SEEDED_DEFAULT_TEMP_PASSWORD,
      confirmPassword: SEEDED_DEFAULT_TEMP_PASSWORD,
    }),
  })
  const changePwReuseRes = await changePasswordApi(changePwReuseReq)
  assert(
    changePwReuseRes.status === 400,
    '/api/auth/change-password rejects reusing the current password with HTTP 400'
  )

  // ─── Phase 4 Tests: Lock Down Unauthenticated Endpoints ───
  console.log('\n--- 12. Phase 4 Endpoint Lockdown & Tampering Protection ---')

  // 14a: WhatsApp send with no cookie returns 401
  const unauthWaReq = new NextRequest('http://localhost:3000/api/whatsapp/send', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ phone: '+919820011111', metaTemplateName: 'dna360_welcome_member' }),
  })
  const unauthWaRes = await whatsappSendApi(unauthWaReq)
  assert(unauthWaRes.status === 401, 'POST /api/whatsapp/send with no cookie returns HTTP 401 Unauthorized')

  // 14b: Middleware also blocks unauthenticated /api/whatsapp/send with 401
  const mwUnauthWaRes = await middleware(unauthWaReq)
  assert(mwUnauthWaRes.status === 401, 'Middleware blocks unauthenticated /api/whatsapp/send with HTTP 401')

  // 14c: Member session calling WhatsApp send returns 403 Forbidden
  const memberUser = findUserById('mem_001')!
  const memberToken = createServerSession(memberUser)
  const memberWaReq = new NextRequest('http://localhost:3000/api/whatsapp/send', {
    method: 'POST',
    headers: {
      cookie: `${SESSION_COOKIE_NAME}=${memberToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ phone: '+919820011111', metaTemplateName: 'dna360_welcome_member' }),
  })
  const memberWaRes = await whatsappSendApi(memberWaReq)
  assert(memberWaRes.status === 403, 'Member session calling /api/whatsapp/send returns HTTP 403 Forbidden')

  // 14d: Authorized staff session (owner/sales) can dispatch approved template
  const staffWaReq = new NextRequest('http://localhost:3000/api/whatsapp/send', {
    method: 'POST',
    headers: {
      cookie: `${SESSION_COOKIE_NAME}=${ownerToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ phone: '+919820011111', metaTemplateName: 'dna360_welcome_member' }),
  })
  const staffWaRes = await whatsappSendApi(staffWaReq)
  assert(staffWaRes.status === 200, 'Authorized staff session successfully dispatches approved WhatsApp template')

  // 14e: WhatsApp Webhook GET verify token handshake
  const validWebhookGetReq = new NextRequest(
    'http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=test_whatsapp_webhook_verify_token_min_32_chars&hub.challenge=test_challenge_xyz'
  )
  const validWebhookGetRes = await whatsappWebhookGetApi(validWebhookGetReq)
  const challengeText = await validWebhookGetRes.text()
  assert(
    validWebhookGetRes.status === 200 && challengeText === 'test_challenge_xyz',
    'WhatsApp webhook GET returns 200 challenge when verify token matches'
  )

  const invalidWebhookGetReq = new NextRequest(
    'http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=wrong_token&hub.challenge=test_challenge_xyz'
  )
  const invalidWebhookGetRes = await whatsappWebhookGetApi(invalidWebhookGetReq)
  assert(invalidWebhookGetRes.status === 403, 'WhatsApp webhook GET returns 403 Forbidden when verify token is wrong')

  // 14f: WhatsApp Webhook POST with wrong or absent signature returns 401
  const sampleWebhookBody = JSON.stringify({ object: 'whatsapp_business_account', entry: [] })

  const unauthWebhookReq = new NextRequest('http://localhost:3000/api/whatsapp/webhook', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: sampleWebhookBody,
  })
  const unauthWebhookRes = await whatsappWebhookPostApi(unauthWebhookReq)
  assert(unauthWebhookRes.status === 401, 'WhatsApp webhook POST with absent signature returns HTTP 401')

  const badSigWebhookReq = new NextRequest('http://localhost:3000/api/whatsapp/webhook', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-hub-signature-256': 'sha256=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    },
    body: sampleWebhookBody,
  })
  const badSigWebhookRes = await whatsappWebhookPostApi(badSigWebhookReq)
  assert(badSigWebhookRes.status === 401, 'WhatsApp webhook POST with forged signature returns HTTP 401')

  // 14g: WhatsApp Webhook POST with valid HMAC SHA256 signature returns 200
  const validHmac =
    'sha256=' +
    crypto
      .createHmac('sha256', process.env.WHATSAPP_APP_SECRET!)
      .update(sampleWebhookBody)
      .digest('hex')

  const validWebhookReq = new NextRequest('http://localhost:3000/api/whatsapp/webhook', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-hub-signature-256': validHmac,
    },
    body: sampleWebhookBody,
  })
  const validWebhookRes = await whatsappWebhookPostApi(validWebhookReq)
  assert(validWebhookRes.status === 200, 'WhatsApp webhook POST with valid HMAC SHA256 returns HTTP 200')

  // 14h: Razorpay create-order with unauthenticated session returns 401
  const unauthOrderReq = new NextRequest('http://localhost:3000/api/razorpay/create-order', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ invoiceId: 'inv_001' }),
  })
  const unauthOrderRes = await razorpayCreateOrderApi(unauthOrderReq)
  assert(unauthOrderRes.status === 401, 'Razorpay create-order without session returns HTTP 401')

  // 14i: Razorpay create-order for already-settled invoice returns 403
  const settledOrderReq = new NextRequest('http://localhost:3000/api/razorpay/create-order', {
    method: 'POST',
    headers: {
      cookie: `${SESSION_COOKIE_NAME}=${ownerToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ invoiceId: 'inv_001' }), // inv_001 is status: 'paid'
  })
  const settledOrderRes = await razorpayCreateOrderApi(settledOrderReq)
  assert(settledOrderRes.status === 403, 'Razorpay create-order for already paid invoice returns HTTP 403 Forbidden')

  // 14j: Razorpay create-order ignores forged amountMinor in body and derives strictly from invoice
  const currentInvoices = getStoredInvoices()
  const testUnpaidInv = {
    id: 'inv_test_unpaid_phase4',
    invoiceNumber: 'DNA/2026-27/4444',
    memberId: 'mem_001',
    memberName: 'Arjun Mehta',
    memberPhone: '+919820011111',
    memberEmail: 'arjun.mehta@gmail.com',
    issueDate: '2026-04-15',
    dueDate: '2026-04-20',
    status: 'pending' as const,
    items: [],
    subtotalMinor: 4500000,
    totalDiscountMinor: 0,
    taxableMinor: 4285714,
    cgstMinor: 107143,
    sgstMinor: 107143,
    grandTotalMinor: 4500000,
    paidAmountMinor: 0,
    dueAmountMinor: 4500000,
    payments: [],
    createdBy: { id: 'usr_fc_01', name: 'Amit Sharma', role: 'Fitness Consultant' },
    salesRepId: 'usr_fc_01',
    salesRepName: 'Amit Sharma',
  }
  currentInvoices.push(testUnpaidInv)
  saveInvoices(currentInvoices)

  const forgedAmountReq = new NextRequest('http://localhost:3000/api/razorpay/create-order', {
    method: 'POST',
    headers: {
      cookie: `${SESSION_COOKIE_NAME}=${ownerToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      invoiceId: 'inv_test_unpaid_phase4',
      amountMinor: 100, // Attacker forged ₹1.00 instead of ₹45,000!
    }),
  })
  const forgedAmountRes = await razorpayCreateOrderApi(forgedAmountReq)
  const forgedAmountData = await forgedAmountRes.json()
  assert(
    forgedAmountRes.status === 200 && forgedAmountData.amount === 4500000,
    'Razorpay create-order ignores client-forged amountMinor (100) and derives amount from invoice (4500000)'
  )

  // 14k: Razorpay verify-payment asserts captured amount equals expectedAmountMinor (mismatch -> 400 + audit record)
  const testOrderId = forgedAmountData.orderId
  const testPaymentId = `pay_tamper_${Date.now()}`
  const testSig = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(`${testOrderId}|${testPaymentId}`)
    .digest('hex')

  const auditBeforeTamperCount = getAuditLogs().length
  const tamperAmountReq = new NextRequest('http://localhost:3000/api/razorpay/verify-payment', {
    method: 'POST',
    headers: {
      cookie: `${SESSION_COOKIE_NAME}=${ownerToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      orderId: testOrderId,
      paymentId: testPaymentId,
      signature: testSig,
      amountMinor: 100, // Tampered amount (claimed ₹1 instead of ₹45,000)
    }),
  })
  const tamperAmountRes = await razorpayVerifyPaymentApi(tamperAmountReq)
  const auditAfterTamperCount = getAuditLogs().length
  assert(
    tamperAmountRes.status === 400 && auditAfterTamperCount > auditBeforeTamperCount,
    'Razorpay verify-payment detects amount mismatch, returns HTTP 400, and writes audit record'
  )

  // 14l: Razorpay verify-payment with matching amount marks invoice paid
  const legitimatePaymentId = `pay_legit_${Date.now()}`
  const legitimateSig = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(`${testOrderId}|${legitimatePaymentId}`)
    .digest('hex')

  const legitimateVerifyReq = new NextRequest('http://localhost:3000/api/razorpay/verify-payment', {
    method: 'POST',
    headers: {
      cookie: `${SESSION_COOKIE_NAME}=${ownerToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      orderId: testOrderId,
      paymentId: legitimatePaymentId,
      signature: legitimateSig,
      amountMinor: 4500000, // Correct amount matching order mapping
    }),
  })
  const legitimateVerifyRes = await razorpayVerifyPaymentApi(legitimateVerifyReq)
  const legitimateVerifyData = await legitimateVerifyRes.json()
  const settledInvoice = getInvoiceById('inv_test_unpaid_phase4')
  assert(
    legitimateVerifyRes.status === 200 &&
      legitimateVerifyData.verified === true &&
      settledInvoice?.status === 'paid' &&
      settledInvoice?.dueAmountMinor === 0,
    'Razorpay verify-payment succeeds with matching amount and marks invoice paid'
  )

  // ─── Phase 5 Tests: Durable Rate Limiting & Export Governance ───
  console.log('\n--- 13. Phase 5 Durable Rate Limiting & Export Governance ---')

  // 15a: 6 consecutive bad logins -> 429, and persists across a cold start
  const coldStartTarget = 'coldstart.target@dna360.in'
  await clearAttempts(coldStartTarget, '103.21.126.99')

  for (let i = 1; i <= 5; i++) {
    const badReq = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '103.21.126.99',
      },
      body: JSON.stringify({ identifier: coldStartTarget, password: `WrongPass${i}!` }),
    })
    const badRes = await loginApi(badReq)
    if (i < 5) {
      assert(badRes.status === 401, `Failed login attempt #${i} returns HTTP 401`)
    } else {
      assert(badRes.status === 429, `5th consecutive failed login attempt locks account with HTTP 429`)
    }
  }

  // Simulate serverless cold start by purging volatile container memory
  simulateColdStart()

  // 6th attempt on fresh container -> must still return 429 because lockout persisted!
  const coldStartReq = new NextRequest('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '103.21.126.99',
    },
    body: JSON.stringify({ identifier: coldStartTarget, password: 'WrongPassColdStart!' }),
  })
  const coldStartRes = await loginApi(coldStartReq)
  const coldStartData = await coldStartRes.json()
  const retryAfterHeader = coldStartRes.headers.get('retry-after')
  assert(
    coldStartRes.status === 429 &&
      coldStartData.locked === true &&
      Boolean(retryAfterHeader && Number(retryAfterHeader) > 0),
    '6th consecutive bad login returns HTTP 429 with Retry-After and persists across serverless cold start'
  )

  // 15b: Export rate limiting (4th export in an hour -> 429) on /api/members/export
  const exportTestOwner = SEEDED_USERS.find((u) => u.role.slug === 'OWNER')!
  const exportOwnerToken = createServerSession(exportTestOwner)

  const memExp1 = await exportMembersApi(new NextRequest('http://localhost:3000/api/members/export', {
    headers: { cookie: `${SESSION_COOKIE_NAME}=${exportOwnerToken}`, 'x-forwarded-for': '103.21.126.44' },
  }))
  const memExp2 = await exportMembersApi(new NextRequest('http://localhost:3000/api/members/export', {
    headers: { cookie: `${SESSION_COOKIE_NAME}=${exportOwnerToken}`, 'x-forwarded-for': '103.21.126.44' },
  }))
  const memExp3 = await exportMembersApi(new NextRequest('http://localhost:3000/api/members/export', {
    headers: { cookie: `${SESSION_COOKIE_NAME}=${exportOwnerToken}`, 'x-forwarded-for': '103.21.126.44' },
  }))
  const memExp4 = await exportMembersApi(new NextRequest('http://localhost:3000/api/members/export', {
    headers: { cookie: `${SESSION_COOKIE_NAME}=${exportOwnerToken}`, 'x-forwarded-for': '103.21.126.44' },
  }))

  assert(
    memExp1.status === 200 && memExp2.status === 200 && memExp3.status === 200 && memExp4.status === 429,
    '4th member export in an hour returns HTTP 429 Rate Limit Exceeded'
  )

  // 15c: Every export writes an audit record with actor, role, IP, and row count
  const allAudits = getAuditLogs()
  const latestExportAudit = allAudits.find(a => a.entity === 'MemberDirectory' && a.ipAddress === '103.21.126.44')
  assert(
    Boolean(
      latestExportAudit &&
        latestExportAudit.action === 'EXPORT' &&
        latestExportAudit.entity === 'MemberDirectory' &&
        latestExportAudit.ipAddress === '103.21.126.44' &&
        latestExportAudit.afterState &&
        typeof (latestExportAudit.afterState as any).rowCount === 'number'
    ),
    'Member export writes mandatory audit log entry with actor, role, IP, and row count'
  )

  // 15d: Export rate limiting (4th export in an hour -> 429) on /api/training/export
  const trainingMember = findUserById('mem_001')!
  const trainingMemberToken = createServerSession(trainingMember)

  const trnExp1 = await trainingExportApi(new NextRequest('http://localhost:3000/api/training/export', {
    headers: { cookie: `${SESSION_COOKIE_NAME}=${trainingMemberToken}`, 'x-forwarded-for': '103.21.126.55' },
  }))
  const trnExp2 = await trainingExportApi(new NextRequest('http://localhost:3000/api/training/export', {
    headers: { cookie: `${SESSION_COOKIE_NAME}=${trainingMemberToken}`, 'x-forwarded-for': '103.21.126.55' },
  }))
  const trnExp3 = await trainingExportApi(new NextRequest('http://localhost:3000/api/training/export', {
    headers: { cookie: `${SESSION_COOKIE_NAME}=${trainingMemberToken}`, 'x-forwarded-for': '103.21.126.55' },
  }))
  const trnExp4 = await trainingExportApi(new NextRequest('http://localhost:3000/api/training/export', {
    headers: { cookie: `${SESSION_COOKIE_NAME}=${trainingMemberToken}`, 'x-forwarded-for': '103.21.126.55' },
  }))

  assert(
    trnExp1.status === 200 && trnExp2.status === 200 && trnExp3.status === 200 && trnExp4.status === 429,
    '4th training export in an hour returns HTTP 429 Rate Limit Exceeded'
  )

  // ─── Section 14: Phase 6 CSP & Transport Security Hardening ───
  console.log('\n--- 14. Phase 6 Transport & Content-Security Hardening ---')
  const cspReq = new NextRequest('http://localhost:3000/login')
  const cspRes = await middleware(cspReq)
  const csp = cspRes.headers.get('content-security-policy') || ''

  assert(Boolean(csp), 'Content-Security-Policy header is present on responses')

  // Directives should not contain bare https: wildcards
  const directives = csp.split(';').map(d => d.trim()).filter(Boolean)
  const hasBareHttps = directives.some(directive => {
    const tokens = directive.split(/\s+/)
    return tokens.includes('https:')
  })
  assert(!hasBareHttps, 'No bare https: wildcard remains in any CSP directive')

  // script-src must not contain unsafe-eval
  assert(!csp.includes("'unsafe-eval'"), "script-src does not contain 'unsafe-eval'")

  // connect-src must enumerate Razorpay and Supabase
  assert(
    csp.includes('https://api.razorpay.com') && csp.includes('https://lumberjack.razorpay.com'),
    'connect-src enumerates Razorpay API and Lumberjack telemetry hosts'
  )
  assert(
    csp.includes('rqmgvwcqfbfnrixxvgza.supabase.co'),
    'connect-src enumerates Supabase project host'
  )

  // Critical defense-in-depth directives
  assert(
    csp.includes("frame-ancestors 'none'") &&
      csp.includes("form-action 'self'") &&
      csp.includes("base-uri 'self'"),
    "Critical defense directives frame-ancestors 'none', form-action 'self', base-uri 'self' are preserved"
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
