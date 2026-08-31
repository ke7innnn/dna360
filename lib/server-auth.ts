import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import type { AuthUser, RoleDefinition, UserSession, RoleSlug } from '@/types/auth'
import type { Capability } from '@/config/permissions'
import { SEEDED_USERS, SEEDED_ROLE_DEFINITIONS, POWAI_BRANCH, CLUB_ID_POWAI } from '@/lib/auth'
import { hasCapability, canAccessRevenue } from '@/config/permissions'
import { logAuditEvent } from '@/lib/audit'
import { getStoredMembers } from '@/lib/members'

const SESSION_SECRET = process.env.SESSION_SECRET || 'dna360_secure_session_secret_key_powai_2026'
export const SESSION_COOKIE_NAME = 'dna360_session'

// In-memory server session store (token -> session record)
interface ServerSessionData {
  sessionId: string
  userId: string
  tenantId: string
  user: AuthUser
  createdAt: number
  lastActiveAt: number
  expiresAt: number
}

const activeSessions = new Map<string, ServerSessionData>()

// Failed login attempt tracker for rate limiting / lockout (identifier -> { count, lockedUntil })
interface LoginAttemptTracker {
  attempts: number
  firstAttemptAt: number
  lockedUntil: number | null
}

const loginAttempts = new Map<string, LoginAttemptTracker>()

// Export rate limiter (userId -> timestamps array)
const exportRateLimits = new Map<string, number[]>()

const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15 minutes
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000
const SESSION_TTL_MS = 12 * 60 * 60 * 1000 // 12 hours idle timeout
const MAX_EXPORTS_PER_HOUR = 3

/**
 * Creates a signed token string: base64(payload).signature
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
 * Verifies and decodes a signed token
 */
export function verifyToken(token: string): Record<string, any> | null {
  if (!token || !token.includes('.')) return null
  const [data, signature] = token.split('.')
  if (!data || !signature) return null

  const expectedSignature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(data)
    .digest('base64url')

  if (signature !== expectedSignature) return null

  try {
    const json = Buffer.from(data, 'base64url').toString('utf-8')
    return JSON.parse(json)
  } catch {
    return null
  }
}

/**
 * Check if an identifier (email or phone) is currently locked out
 */
export function checkLoginLockout(identifier: string): { isLocked: boolean; remainingSeconds: number } {
  const cleanId = identifier.trim().toLowerCase()
  const record = loginAttempts.get(cleanId)
  if (!record || !record.lockedUntil) return { isLocked: false, remainingSeconds: 0 }

  const now = Date.now()
  if (now < record.lockedUntil) {
    const remaining = Math.ceil((record.lockedUntil - now) / 1000)
    return { isLocked: true, remainingSeconds: remaining }
  }

  // Lockout expired
  loginAttempts.delete(cleanId)
  return { isLocked: false, remainingSeconds: 0 }
}

/**
 * Record a failed login attempt; lock out if threshold reached
 */
export function recordFailedLogin(identifier: string): { isLocked: boolean; remainingAttempts: number } {
  const cleanId = identifier.trim().toLowerCase()
  const now = Date.now()
  const record = loginAttempts.get(cleanId) || { attempts: 0, firstAttemptAt: now, lockedUntil: null }

  if (now - record.firstAttemptAt > ATTEMPT_WINDOW_MS) {
    record.attempts = 0
    record.firstAttemptAt = now
  }

  record.attempts += 1

  if (record.attempts >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS
    loginAttempts.set(cleanId, record)
    return { isLocked: true, remainingAttempts: 0 }
  }

  loginAttempts.set(cleanId, record)
  return { isLocked: false, remainingAttempts: MAX_FAILED_ATTEMPTS - record.attempts }
}

/**
 * Reset failed login attempts on successful login
 */
export function resetLoginAttempts(identifier: string) {
  const cleanId = identifier.trim().toLowerCase()
  loginAttempts.delete(cleanId)
}

/**
 * Check export rate limit (max 3 per hour)
 */
export function checkExportRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const windowStart = now - 60 * 60 * 1000
  let timestamps = exportRateLimits.get(userId) || []

  // Filter within last 1 hour
  timestamps = timestamps.filter(t => t > windowStart)
  if (timestamps.length >= MAX_EXPORTS_PER_HOUR) {
    exportRateLimits.set(userId, timestamps)
    return { allowed: false, remaining: 0 }
  }

  timestamps.push(now)
  exportRateLimits.set(userId, timestamps)
  return { allowed: true, remaining: MAX_EXPORTS_PER_HOUR - timestamps.length }
}

/**
 * Create a new server session and return the signed session token
 */
export function createServerSession(user: AuthUser, tenantId: string = 'tenant_powai'): string {
  const sessionId = `sess_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`
  const now = Date.now()
  const expiresAt = now + SESSION_TTL_MS

  const tokenPayload = {
    sessionId,
    userId: user.id,
    tenantId,
    role: user.role.slug,
    issuedAt: now,
    expiresAt,
  }

  const token = signToken(tokenPayload)

  activeSessions.set(sessionId, {
    sessionId,
    userId: user.id,
    tenantId,
    user,
    createdAt: now,
    lastActiveAt: now,
    expiresAt,
  })

  return token
}

/**
 * Destroy a session by token or session ID
 */
export function destroyServerSession(tokenOrId: string) {
  if (tokenOrId.includes('.')) {
    const verified = verifyToken(tokenOrId)
    if (verified?.sessionId) {
      activeSessions.delete(verified.sessionId)
    }
  } else {
    activeSessions.delete(tokenOrId)
  }
}

/**
 * Find user by ID across staff and members
 */
export function findUserById(userId: string): AuthUser | null {
  const staff = SEEDED_USERS.find(u => u.id === userId)
  if (staff) return staff

  try {
    const members = getStoredMembers()
    const member = members.find(m => m.id === userId)
    if (member) {
      const memberRole = SEEDED_ROLE_DEFINITIONS.find(r => r.slug === 'MEMBER') || SEEDED_ROLE_DEFINITIONS[SEEDED_ROLE_DEFINITIONS.length - 1]
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
        membershipStatus: member.status === 'inactive' ? 'EXPIRED' : (member.status === 'grace_period' ? 'GRACE_PERIOD' : 'ACTIVE'),
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

  const payload = verifyToken(token)
  if (!payload || !payload.sessionId) {
    return { session: null, error: 'Invalid or tampered session token' }
  }

  const now = Date.now()
  if (payload.expiresAt && now > payload.expiresAt) {
    activeSessions.delete(payload.sessionId)
    return { session: null, error: 'Session expired' }
  }

  let sessionData = activeSessions.get(payload.sessionId)
  if (!sessionData) {
    // Reconstitute session if user exists
    const user = findUserById(payload.userId)
    if (!user) {
      return { session: null, error: 'User not found' }
    }
    sessionData = {
      sessionId: payload.sessionId,
      userId: payload.userId,
      tenantId: payload.tenantId || 'tenant_powai',
      user,
      createdAt: payload.issuedAt || now,
      lastActiveAt: now,
      expiresAt: payload.expiresAt || (now + SESSION_TTL_MS),
    }
    activeSessions.set(payload.sessionId, sessionData)
  }

  // Update lastActiveAt
  sessionData.lastActiveAt = now
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
  const hasCap = userCaps.includes(capability) || user.role.slug === 'OWNER' || user.role.slug === 'owner'

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
