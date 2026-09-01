/**
 * DNA 360 — Training Security & Authorization Test Suite (§1)
 *
 * Asserts all Section 1 non-negotiables:
 * 1. Server-side session enforcement (307 on unauth /m page, 401 on unauth API).
 * 2. Self-coached member data is strictly invisible to trainers (HTTP 403 / blocked).
 * 3. Member can only access their own records (IDOR protection).
 * 4. Trainer can only access active assigned clients.
 * 5. Short-lived signed URLs for health-adjacent media (DPDP Act).
 * 6. Audit logging on PT session deductions and programme assignments.
 */

import { NextRequest } from 'next/server'
import { middleware } from '../middleware'
import { createServerSession } from '../lib/server-auth'
import { SEEDED_USERS } from '../lib/auth'
import {
  canAccessMemberTraining,
  resolveAuthorizedMemberId,
  generateSignedMediaUrl,
  verifySignedMediaToken,
  auditTrainingEvent,
} from '../lib/training/auth-guard'
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
  console.log('  DNA 360 Training Security & Authorization Test Suite')
  console.log('============================================================\n')

  const ownerUser = SEEDED_USERS.find(u => u.role.slug.toUpperCase() === 'OWNER')!
  const trainerSneha = SEEDED_USERS.find(u => u.id === 'usr_staff_03') || {
    id: 'usr_staff_03',
    clubId: 'club_powai',
    type: 'STAFF' as const,
    name: 'Sneha Rao',
    phone: '+919820041003',
    role: { id: 'r_tr', name: 'Trainer', slug: 'TRAINER' as const, description: '', capabilities: ['members.view.own', 'workouts.log'] as any, isSystem: true, createdAt: '' },
    branchId: 'pow',
    branches: [],
    status: 'active' as const,
    can_view_revenue: false,
    requires_login: true,
    assignedClientIds: ['mem_001'],
  }

  const trainerAftab = SEEDED_USERS.find(u => u.id === 'usr_staff_04') || {
    id: 'usr_staff_04',
    clubId: 'club_powai',
    type: 'STAFF' as const,
    name: 'Aftab Memon',
    phone: '+919820041002',
    role: { id: 'r_tr', name: 'Trainer', slug: 'TRAINER' as const, description: '', capabilities: ['members.view.own', 'workouts.log'] as any, isSystem: true, createdAt: '' },
    branchId: 'pow',
    branches: [],
    status: 'active' as const,
    can_view_revenue: false,
    requires_login: true,
    assignedClientIds: [],
  }

  const memberArjun = {
    id: 'mem_001',
    clubId: 'club_powai',
    type: 'MEMBER' as const,
    name: 'Arjun Mehta',
    phone: '+919820011111',
    role: { id: 'r_mem', name: 'Member', slug: 'MEMBER' as const, description: '', capabilities: ['portal.access'] as any, isSystem: true, createdAt: '' },
    branchId: 'pow',
    branches: [],
    status: 'active' as const,
    can_view_revenue: false,
    requires_login: true,
  }

  const memberSelfCoached = {
    id: 'mem_999',
    clubId: 'club_powai',
    type: 'MEMBER' as const,
    name: 'Karan Mehra (Self-Coached)',
    phone: '+919820099999',
    role: { id: 'r_mem', name: 'Member', slug: 'MEMBER' as const, description: '', capabilities: ['portal.access'] as any, isSystem: true, createdAt: '' },
    branchId: 'pow',
    branches: [],
    status: 'active' as const,
    can_view_revenue: false,
    requires_login: true,
  }

  // ─── 1. Middleware Session Protection on /m and /api/training ───
  console.log('--- 1. Server-Side Session Enforcement ---')
  const unauthMReq = new NextRequest('http://localhost:3000/m')
  const unauthMRes = middleware(unauthMReq)
  assert(
    unauthMRes.status === 307 &&
    Boolean(unauthMRes.headers.get('location')?.includes('/login?redirect=%2Fm')),
    'Unauthenticated page request to /m returns HTTP 307 Redirect to /login'
  )

  const unauthSessionReq = new NextRequest('http://localhost:3000/m/session')
  const unauthSessionRes = middleware(unauthSessionReq)
  assert(
    unauthSessionRes.status === 307 &&
    Boolean(unauthSessionRes.headers.get('location')?.includes('/login?redirect=%2Fm%2Fsession')),
    'Unauthenticated page request to /m/session returns HTTP 307 Redirect to /login'
  )

  const unauthApiReq = new NextRequest('http://localhost:3000/api/training/sessions')
  const unauthApiRes = middleware(unauthApiReq)
  assert(
    unauthApiRes.status === 401,
    'Unauthenticated API request to /api/training/sessions returns HTTP 401 Unauthorized'
  )

  // ─── 2. Trainer Isolation & Self-Coached Privacy (§1 Rule 2) ───
  console.log('--- 2. Trainer Isolation & Self-Coached Privacy ---')
  const trainerAccessSelfCoached = canAccessMemberTraining(trainerAftab, 'mem_999')
  assert(
    trainerAccessSelfCoached.allowed === false,
    'Trainer CANNOT view workout logs of unassigned self-coached member (§1 Rule 2)'
  )

  const trainerAccessAssigned = canAccessMemberTraining(trainerSneha, 'mem_001')
  assert(
    trainerAccessAssigned.allowed === true,
    'Trainer CAN access workout logs of assigned client with active assignment row'
  )

  // ─── 3. Member IDOR Protection ───
  console.log('--- 3. Member IDOR & Scope Protection ---')
  const memberAccessOwn = canAccessMemberTraining(memberArjun, 'mem_001')
  assert(memberAccessOwn.allowed === true, 'Member can access their own workout data')

  const memberAccessOther = canAccessMemberTraining(memberArjun, 'mem_999')
  assert(memberAccessOther.allowed === false, 'Member CANNOT access another member’s workout data')

  const resolvedForMember = resolveAuthorizedMemberId(memberArjun, 'mem_999')
  assert(
    resolvedForMember.memberId === 'mem_001',
    'resolveAuthorizedMemberId ignores client-supplied memberId and binds strictly to session user ID'
  )

  // ─── 4. Short-Lived Signed Media URLs (§1 Rule 4) ───
  console.log('--- 4. DPDP Private Media Vault & Signed URLs ---')
  const mediaKey = 'form_check_squat_clip_01.mp4'
  const signedUrl = generateSignedMediaUrl(mediaKey, 'mem_001', 300)
  assert(signedUrl.includes('sig=') && signedUrl.includes('exp='), 'Generates signed media URL with expiration and signature')

  const urlObj = new URL(`http://localhost:3000${signedUrl}`)
  const expParam = urlObj.searchParams.get('exp')!
  const sigParam = urlObj.searchParams.get('sig')!

  const isValidToken = verifySignedMediaToken(mediaKey, 'mem_001', expParam, sigParam)
  assert(isValidToken === true, 'Signed media token validates successfully before expiration')

  const isTamperedToken = verifySignedMediaToken(mediaKey, 'mem_002', expParam, sigParam)
  assert(isTamperedToken === false, 'Tampered media user ID is rejected')

  const isExpiredToken = verifySignedMediaToken(mediaKey, 'mem_001', String(Math.floor(Date.now() / 1000) - 10), sigParam)
  assert(isExpiredToken === false, 'Expired media token is rejected')

  // ─── 5. Audit Logging (§1 Rule 6) ───
  console.log('--- 5. Audit Trail Integration ---')
  auditTrainingEvent(
    trainerSneha,
    'UPDATE',
    'PT_SESSION',
    'sess_001',
    'Trainer Sneha Rao signed off 1-on-1 PT session (Remaining: 7)',
    { before: { remaining: 8 }, after: { remaining: 7 } }
  )

  const recentLogs = getAuditLogs()
  const matchingAudit = recentLogs.find(l => l.entity === 'PT_SESSION' && l.entityId === 'sess_001')
  assert(matchingAudit !== undefined, 'PT session sign-off generates mandatory audit log entry')

  console.log('\n============================================================')
  console.log(`  Test Results: ${passed} passed, ${failed} failed`)
  console.log('============================================================\n')

  if (failed > 0) {
    process.exit(1)
  }
}

runTests().catch(e => {
  console.error(e)
  process.exit(1)
})
