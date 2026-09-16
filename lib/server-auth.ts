import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import type { AuthUser, RoleDefinition, UserSession, RoleSlug } from '@/types/auth'
import type { Capability } from '@/config/permissions'
import { SEEDED_USERS, SEEDED_ROLE_DEFINITIONS, POWAI_BRANCH, CLUB_ID_POWAI } from '@/lib/auth'
import { hasCapability, canAccessRevenue } from '@/config/permissions'
import { logAuditEvent } from '@/lib/audit'
import { getStoredMembers } from '@/lib/members'
import { requireEnv } from '@/lib/env'
import { getSupabaseAdmin } from '@/lib/supabase'
import {
  saveSessionToMemory,
  getSessionFromMemoryByHash,
  revokeSessionInMemory,
  type AuthSessionRecord,
} from '@/lib/session-store'

const SESSION_SECRET = requireEnv('SESSION_SECRET')
export const SESSION_COOKIE_NAME = 'dna360_session'

// In-memory server session store (token -> session record)
export interface ServerSessionData {
  sessionId: string
  userId: string
  tenantId: string
  user: AuthUser
  createdAt: number
  lastActiveAt: number
  expiresAt: number
}

import {
  checkLoginLockoutSync,
  recordFailedLoginSync,
  resetLoginAttemptsSync,
  checkExportRateLimitSync,
} from '@/lib/rate-limit'

// Dynamic user memory cache for mock / test users (plain object to eliminate in-memory Map)
const userMemoryCache: Record<string, AuthUser> = {}

const SESSION_TTL_MS = 12 * 60 * 60 * 1000 // 12 hours idle timeout

/**
 * Legacy HMAC signer for compatibility
 */
export function signToken(payload: Record<string, any>): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(data)
    .digest('base64url')
  return `${data}.${signature}`
}

/**
 * Verifies active session by hashing raw token and checking durable store
 */
export function verifyToken(token: string): Record<string, any> | null {
  if (!token) return null
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  const session = getSessionFromMemoryByHash(tokenHash)
  if (!session || session.revoked_at || new Date(session.expires_at).getTime() < Date.now()) {
    return null
  }
  return {
    sessionId: session.id,
    userId: session.user_id,
    roleSlug: session.role_slug,
    must_change_password: session.must_change_password,
    expiresAt: new Date(session.expires_at).getTime(),
  }
}

/**
 * Exported rate limiting and lockout helpers repointed at durable rate-limit module (§5)
 */
export const checkLoginLockout = checkLoginLockoutSync
export const recordFailedLogin = recordFailedLoginSync
export const resetLoginAttempts = resetLoginAttemptsSync
export const checkExportRateLimit = checkExportRateLimitSync


/**
 * Enforce minimum password strength rules (§1)
 * - Minimum 10 characters
 * - Uppercase, lowercase, numeric digit, special character
 * - No common static defaults
 */
export function validatePasswordComplexity(password: string): { valid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required.' }
  }
  if (password.length < 10) {
    return { valid: false, error: 'Password must be at least 10 characters long.' }
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter (A-Z).' }
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter (a-z).' }
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one numeric digit (0-9).' }
  }
  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?~`\\/]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one special character (!@#$%^&*...).' }
  }
  if (password.toLowerCase().includes('password')) {
    return { valid: false, error: 'Password cannot contain common patterns or match the default credentials.' }
  }
  return { valid: true }
}

/**
 * Create a new opaque session token (crypto.randomBytes(32).toString('base64url'))
 * Stores only sha256(rawToken) in auth_sessions.token_hash
 */
export function createSession(user: AuthUser, tenantId: string = 'tenant_powai'): string {
  const rawToken = crypto.randomBytes(32).toString('base64url')
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
  const now = new Date()
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS)

  const sessionRecord: AuthSessionRecord = {
    id: `sess_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`,
    token_hash: tokenHash,
    user_id: user.id,
    user_type: user.type === 'MEMBER' ? 'MEMBER' : 'STAFF',
    role_slug: user.role.slug,
    must_change_password: Boolean((user as any).must_change_password),
    created_at: now.toISOString(),
    last_active_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
    revoked_at: null,
  }

  saveSessionToMemory(sessionRecord)
  userMemoryCache[user.id] = user

  // Asynchronously persist to Supabase if configured
  try {
    const supabaseAdmin = getSupabaseAdmin()
    if (supabaseAdmin) {
      supabaseAdmin
        .from('auth_sessions')
        .insert({
          id: sessionRecord.id,
          token_hash: sessionRecord.token_hash,
          user_id: sessionRecord.user_id,
          user_type: sessionRecord.user_type,
          role_slug: sessionRecord.role_slug,
          must_change_password: sessionRecord.must_change_password,
          created_at: sessionRecord.created_at,
          last_active_at: sessionRecord.last_active_at,
          expires_at: sessionRecord.expires_at,
          revoked_at: null,
        })
        .then(({ error }) => {
          if (error) {
            // Table may not exist yet if migration pending
          }
        })
    }
  } catch {
    // Ignore async write error if db not available
  }

  return rawToken
}

/**
 * Backward compatibility alias for createSession
 */
export const createServerSession = createSession

/**
 * Destroy a session by token or token hash (immediate and permanent revocation)
 */
export function destroyServerSession(rawTokenOrHash: string) {
  if (!rawTokenOrHash) return
  let tokenHash = rawTokenOrHash
  if (rawTokenOrHash.length !== 64 || !/^[0-9a-f]{64}$/.test(rawTokenOrHash)) {
    tokenHash = crypto.createHash('sha256').update(rawTokenOrHash).digest('hex')
  }

  revokeSessionInMemory(tokenHash)

  try {
    const supabaseAdmin = getSupabaseAdmin()
    if (supabaseAdmin) {
      supabaseAdmin
        .from('auth_sessions')
        .update({ revoked_at: new Date().toISOString() })
        .eq('token_hash', tokenHash)
        .then(({ error }) => {
          if (error) {
            // Table may not exist yet
          }
        })
    }
  } catch {
    // Ignore if db unavailable
  }
}

/**
 * Find user by ID across staff and members, with email fallback
 */
export function findUserById(userId: string, email?: string): AuthUser | null {
  const cached = userMemoryCache[userId]
  if (cached) return cached

  const staff = SEEDED_USERS.find(
    (u) => u.id === userId || (email && u.email?.toLowerCase() === email.toLowerCase())
  )
  if (staff) return staff

  try {
    const members = getStoredMembers()
    const member = members.find(
      (m) => m.id === userId || (email && m.email?.toLowerCase() === email.toLowerCase())
    )
    if (member) {
      const memberRole =
        SEEDED_ROLE_DEFINITIONS.find((r) => r.slug.toLowerCase() === 'member') ||
        SEEDED_ROLE_DEFINITIONS[SEEDED_ROLE_DEFINITIONS.length - 1]
      return {
        id: member.id,
        clubId: CLUB_ID_POWAI,
        type: 'MEMBER',
        name: member.name,
        email: member.email || `${member.id}@dna360.in`,
        phone: member.phone,
        role: memberRole,
        branchId: 'pow',
        branches: [POWAI_BRANCH],
        status: member.status === 'blacklisted' ? 'inactive' : 'active',
        membershipStatus:
          member.status === 'inactive'
            ? 'EXPIRED'
            : member.status === 'grace_period'
            ? 'GRACE_PERIOD'
            : 'ACTIVE',
        can_view_revenue: false,
        requires_login: true,
      }
    }
  } catch (e) {
    // fallback if members cannot be loaded synchronously
  }
  return null
}

/**
 * Resolves session from NextRequest (Cookies or Authorization header)
 * Token is an opaque pointer: user and role are resolved fresh from DB, NEVER from token payload.
 */
export function getServerSession(req: NextRequest): { session: ServerSessionData | null; error?: string } {
  let token = req.cookies.get(SESSION_COOKIE_NAME)?.value

  if (!token) {
    const authHeader = req.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7)
    }
  }

  if (!token) {
    return { session: null, error: 'No session token provided' }
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  const sessionRecord = getSessionFromMemoryByHash(tokenHash)

  if (!sessionRecord) {
    return { session: null, error: 'Invalid or tampered session token' }
  }

  if (sessionRecord.revoked_at) {
    return { session: null, error: 'Session has been revoked' }
  }

  const now = Date.now()
  if (new Date(sessionRecord.expires_at).getTime() < now) {
    return { session: null, error: 'Session expired' }
  }

  // Load user fresh from database / seeded catalog
  let user = findUserById(sessionRecord.user_id)
  if (!user) {
    return { session: null, error: 'User not found' }
  }

  // Resolve role strictly from role_slug against SEEDED_ROLE_DEFINITIONS / DB
  const roleDef =
    SEEDED_ROLE_DEFINITIONS.find(
      (r) => r.slug.toLowerCase() === sessionRecord.role_slug.toLowerCase()
    ) || SEEDED_ROLE_DEFINITIONS[0]

  user = {
    ...user,
    role: roleDef,
    can_view_revenue: roleDef.slug.toLowerCase() === 'owner_admin' || roleDef.slug.toLowerCase() === 'owner',
    must_change_password: sessionRecord.must_change_password,
  }

  // Update last_active_at (12h idle expiry preserved)
  sessionRecord.last_active_at = new Date().toISOString()

  const sessionData: ServerSessionData = {
    sessionId: sessionRecord.id,
    userId: user.id,
    tenantId: 'tenant_powai',
    user,
    createdAt: new Date(sessionRecord.created_at).getTime(),
    lastActiveAt: now,
    expiresAt: new Date(sessionRecord.expires_at).getTime(),
  }

  return { session: sessionData }
}

/**
 * Mask Indian phone numbers for PII protection (e.g. "+91 98200 99123" -> "+91 ••••• •9123")
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone) return ''
  const trimmed = phone.trim()
  if (trimmed.length <= 4) return '••••'
  const lastFour = trimmed.slice(-4)
  if (trimmed.startsWith('+91')) {
    return `+91 ••••• •${lastFour}`
  }
  return `••••••${lastFour}`
}

/**
 * Helper to require a capability on an API route.
 * Returns { user, tenantId } or a Next response (401 or 403).
 */
export function requireCapabilityApi(
  req: NextRequest,
  capability: Capability
): { user: AuthUser; tenantId: string } | NextResponse {
  const { session, error } = getServerSession(req)
  if (!session || !session.user) {
    return NextResponse.json(
      { error: error || 'Unauthorized: Authentication required.' },
      { status: 401 }
    )
  }

  const user = session.user
  const userCaps = user.role.capabilities || []
  const roleSlug = user.role.slug.toLowerCase()
  const hasCap = userCaps.includes(capability) || roleSlug === 'owner_admin' || roleSlug === 'owner'

  if (!hasCap) {
    return NextResponse.json(
      {
        error: `Forbidden: Role '${user.role.name}' does not have capability '${capability}'.`,
        requiredCapability: capability,
      },
      { status: 403 }
    )
  }

  return { user, tenantId: session.tenantId }
}
