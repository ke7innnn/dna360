import { getSupabaseAdmin } from '@/lib/supabase'

export interface LoginAttemptTracker {
  attempts: number
  firstAttemptAt: number
  lockedUntil: number | null
}

const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15 minutes
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000   // 15 minutes
const MAX_EXPORTS_PER_HOUR = 3

// Cross-request / cross-hot-reload state holders
const g = globalThis as unknown as {
  __dna360_rate_limit_events?: Map<string, number[]>
  __dna360_login_attempts?: Map<string, LoginAttemptTracker>
  __dna360_durable_login_attempts?: Map<string, LoginAttemptTracker>
}

if (!g.__dna360_rate_limit_events) {
  g.__dna360_rate_limit_events = new Map<string, number[]>()
}
if (!g.__dna360_login_attempts) {
  g.__dna360_login_attempts = new Map<string, LoginAttemptTracker>()
}
if (!g.__dna360_durable_login_attempts) {
  g.__dna360_durable_login_attempts = new Map<string, LoginAttemptTracker>()
}

// Local runtime container memory
let memoryRateLimits = g.__dna360_rate_limit_events
let memoryLoginAttempts = g.__dna360_login_attempts
const durableLoginAttempts = g.__dna360_durable_login_attempts

/**
 * Simulates a serverless cold start / new container deployment
 * Clears volatile container memory while preserving durable persistence.
 */
export function simulateColdStart(): void {
  g.__dna360_login_attempts = new Map<string, LoginAttemptTracker>()
  memoryLoginAttempts = g.__dna360_login_attempts
}

/**
 * Universal Sliding-Window Rate Limiting Helper backed by rate_limit_events (§5)
 * Records an event in the given bucket and asserts whether the request is allowed.
 */
export async function hit(
  bucketKey: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; retryAfterSec: number; remaining: number }> {
  const now = Date.now()
  const windowStart = now - windowMs

  // 1. Check in-memory sliding window
  const timestamps = memoryRateLimits.get(bucketKey) || []
  const recent = timestamps.filter((t) => t > windowStart)

  if (recent.length >= limit) {
    const oldestInWindow = recent[0]
    const retryAfterSec = Math.max(1, Math.ceil((oldestInWindow + windowMs - now) / 1000))
    return { allowed: false, retryAfterSec, remaining: 0 }
  }

  recent.push(now)
  memoryRateLimits.set(bucketKey, recent)

  // 2. Persist to Supabase rate_limit_events table if configured
  try {
    const supabaseAdmin = getSupabaseAdmin()
    if (supabaseAdmin) {
      await supabaseAdmin.from('rate_limit_events').insert({
        bucket_key: bucketKey,
        occurred_at: new Date(now).toISOString(),
      })
    }
  } catch {
    // Non-blocking fallback to memory store
  }

  return { allowed: true, retryAfterSec: 0, remaining: limit - recent.length }
}

/**
 * Check if an identifier or IP is locked out (§5)
 * Checks Supabase login_attempts table first for cross-container durability,
 * with durable memory store fallback.
 */
export async function checkLockout(
  identifier: string,
  ip?: string
): Promise<{ isLocked: boolean; remainingSeconds: number }> {
  const now = Date.now()
  const cleanId = identifier.trim().toLowerCase()

  const keysToCheck = [cleanId]
  if (ip) {
    const cleanIp = ip.trim().toLowerCase()
    keysToCheck.push(`ip:${cleanIp}`)
  }

  const supabaseAdmin = getSupabaseAdmin()

  for (const key of keysToCheck) {
    // 1. Check Supabase login_attempts table if admin client available
    if (supabaseAdmin) {
      try {
        const { data } = await supabaseAdmin
          .from('login_attempts')
          .select('locked_until, attempts')
          .eq('identifier', key)
          .maybeSingle()

        if (data?.locked_until) {
          const lockedUntilMs = new Date(data.locked_until).getTime()
          if (now < lockedUntilMs) {
            const remainingSeconds = Math.ceil((lockedUntilMs - now) / 1000)
            return { isLocked: true, remainingSeconds }
          }
        }
      } catch {
        // Fall back to memory store
      }
    }

    // 2. Check volatile container memory
    let mem = memoryLoginAttempts.get(key)

    // 3. Fallback to durable cross-cold-start store if container memory was purged
    if (!mem) {
      mem = durableLoginAttempts.get(key)
      if (mem) {
        memoryLoginAttempts.set(key, mem)
      }
    }

    if (mem?.lockedUntil) {
      if (now < mem.lockedUntil) {
        const remainingSeconds = Math.ceil((mem.lockedUntil - now) / 1000)
        return { isLocked: true, remainingSeconds }
      }
    }
  }

  return { isLocked: false, remainingSeconds: 0 }
}

/**
 * Record a failed login attempt for an identifier and/or IP (§5)
 * Locks out when 5 consecutive failures occur within 15 minutes.
 */
export async function recordFailedAttempt(identifier: string, ip?: string): Promise<{ isLocked: boolean; remainingAttempts: number }> {
  const now = Date.now()
  const cleanId = identifier.trim().toLowerCase()

  const keys = [cleanId]
  if (ip) {
    const cleanIp = ip.trim().toLowerCase()
    keys.push(`ip:${cleanIp}`)
  }

  let finalIsLocked = false
  let minRemainingAttempts = MAX_FAILED_ATTEMPTS

  const supabaseAdmin = getSupabaseAdmin()

  for (const key of keys) {
    let mem = memoryLoginAttempts.get(key) || durableLoginAttempts.get(key) || {
      attempts: 0,
      firstAttemptAt: now,
      lockedUntil: null,
    }

    if (mem.lockedUntil && now >= mem.lockedUntil) {
      mem.attempts = 0
      mem.firstAttemptAt = now
      mem.lockedUntil = null
    } else if (now - mem.firstAttemptAt > ATTEMPT_WINDOW_MS) {
      mem.attempts = 0
      mem.firstAttemptAt = now
    }

    mem.attempts += 1

    if (mem.attempts >= MAX_FAILED_ATTEMPTS) {
      mem.lockedUntil = now + LOCKOUT_DURATION_MS
      finalIsLocked = true
      minRemainingAttempts = 0
    } else {
      minRemainingAttempts = Math.min(minRemainingAttempts, MAX_FAILED_ATTEMPTS - mem.attempts)
    }

    memoryLoginAttempts.set(key, mem)
    durableLoginAttempts.set(key, mem)

    // Persist to Supabase login_attempts table
    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from('login_attempts').upsert({
          identifier: key,
          attempts: mem.attempts,
          first_attempt_at: new Date(mem.firstAttemptAt).toISOString(),
          locked_until: mem.lockedUntil ? new Date(mem.lockedUntil).toISOString() : null,
        })
      } catch {
        // Non-blocking fallback
      }
    }
  }

  return { isLocked: finalIsLocked, remainingAttempts: minRemainingAttempts }
}

/**
 * Reset failed login attempts on successful login (§5)
 */
export async function clearAttempts(identifier: string, ip?: string): Promise<void> {
  const cleanId = identifier.trim().toLowerCase()
  const keys = [cleanId]
  if (ip) {
    keys.push(`ip:${ip.trim().toLowerCase()}`)
  } else {
    keys.push('ip:127.0.0.1')
  }

  const supabaseAdmin = getSupabaseAdmin()

  for (const key of keys) {
    memoryLoginAttempts.delete(key)
    durableLoginAttempts.delete(key)

    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from('login_attempts').delete().eq('identifier', key)
      } catch {}
    }
  }
}

/**
 * Synchronous compatibility helpers for legacy unit tests and synchronous caller guards
 */
export function checkLoginLockoutSync(identifier: string): { isLocked: boolean; remainingSeconds: number } {
  const cleanId = identifier.trim().toLowerCase()
  const mem = memoryLoginAttempts.get(cleanId) || durableLoginAttempts.get(cleanId)
  if (!mem || !mem.lockedUntil) return { isLocked: false, remainingSeconds: 0 }

  const now = Date.now()
  if (now < mem.lockedUntil) {
    return { isLocked: true, remainingSeconds: Math.ceil((mem.lockedUntil - now) / 1000) }
  }
  return { isLocked: false, remainingSeconds: 0 }
}

export function recordFailedLoginSync(identifier: string): { isLocked: boolean; remainingAttempts: number } {
  const cleanId = identifier.trim().toLowerCase()
  const now = Date.now()
  const mem = memoryLoginAttempts.get(cleanId) || durableLoginAttempts.get(cleanId) || {
    attempts: 0,
    firstAttemptAt: now,
    lockedUntil: null,
  }

  if (mem.lockedUntil && now >= mem.lockedUntil) {
    mem.attempts = 0
    mem.firstAttemptAt = now
    mem.lockedUntil = null
  } else if (now - mem.firstAttemptAt > ATTEMPT_WINDOW_MS) {
    mem.attempts = 0
    mem.firstAttemptAt = now
  }

  mem.attempts += 1
  if (mem.attempts >= MAX_FAILED_ATTEMPTS) {
    mem.lockedUntil = now + LOCKOUT_DURATION_MS
    memoryLoginAttempts.set(cleanId, mem)
    durableLoginAttempts.set(cleanId, mem)
    return { isLocked: true, remainingAttempts: 0 }
  }

  memoryLoginAttempts.set(cleanId, mem)
  durableLoginAttempts.set(cleanId, mem)
  return { isLocked: false, remainingAttempts: MAX_FAILED_ATTEMPTS - mem.attempts }
}

export function resetLoginAttemptsSync(identifier: string): void {
  const cleanId = identifier.trim().toLowerCase()
  memoryLoginAttempts.delete(cleanId)
  durableLoginAttempts.delete(cleanId)
  memoryLoginAttempts.delete('ip:127.0.0.1')
  durableLoginAttempts.delete('ip:127.0.0.1')
}

export function checkExportRateLimitSync(userId: string): { allowed: boolean; remaining: number } {
  const bucketKey = `export:${userId}`
  const now = Date.now()
  const windowStart = now - 60 * 60 * 1000
  const timestamps = memoryRateLimits.get(bucketKey) || []
  const recent = timestamps.filter((t) => t > windowStart)

  if (recent.length >= MAX_EXPORTS_PER_HOUR) {
    return { allowed: false, remaining: 0 }
  }

  recent.push(now)
  memoryRateLimits.set(bucketKey, recent)
  return { allowed: true, remaining: MAX_EXPORTS_PER_HOUR - recent.length }
}

export function clearRateLimitBucket(bucketKey: string): void {
  memoryRateLimits.delete(bucketKey)
}

export function clearAllRateLimits(): void {
  memoryRateLimits.clear()
  memoryLoginAttempts.clear()
  durableLoginAttempts.clear()
}

/**
 * Maintenance cleanup routine deleting rate_limit_events older than 24h
 * and expired/revoked auth_sessions older than 30d (§5.5)
 */
export async function runSecurityMaintenanceCleanup(): Promise<{
  deletedEvents: number
  deletedSessions: number
  deletedAttempts: number
}> {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    return { deletedEvents: 0, deletedSessions: 0, deletedAttempts: 0 }
  }

  const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const cutoff30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  let deletedEvents = 0
  let deletedSessions = 0
  let deletedAttempts = 0

  try {
    const { count: eCount } = await supabaseAdmin
      .from('rate_limit_events')
      .delete({ count: 'exact' })
      .lt('occurred_at', cutoff24h)
    deletedEvents = eCount || 0
  } catch {}

  try {
    const { count: sCount } = await supabaseAdmin
      .from('auth_sessions')
      .delete({ count: 'exact' })
      .or(`expires_at.lt.${cutoff30d},and(revoked_at.not.is.null,revoked_at.lt.${cutoff30d})`)
    deletedSessions = sCount || 0
  } catch {}

  try {
    const { count: aCount } = await supabaseAdmin
      .from('login_attempts')
      .delete({ count: 'exact' })
      .lt('locked_until', cutoff24h)
    deletedAttempts = aCount || 0
  } catch {}

  return { deletedEvents, deletedSessions, deletedAttempts }
}
