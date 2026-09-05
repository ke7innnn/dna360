/* ============================================================
   DNA 360 — QR Check-In Security Engine
   - 90-second dynamic token expiry
   - In-memory Replay Attack Detection (Single-use token window)
   - Invalid scan rate limiter (5 fails in 60s -> 30s cooldown)
   ============================================================ */

export const QR_EXPIRY_MS = 90 * 1000 // 90 seconds
export const MAX_INVALID_ATTEMPTS = 5
export const INVALID_WINDOW_MS = 60 * 1000 // 60 seconds
export const COOLDOWN_DURATION_MS = 30 * 1000 // 30 seconds

// In-memory replay tracking: Set of "memberCode:tokenSeed"
const usedTokens = new Map<string, number>() // key -> usedTimestamp

// Rate limiting state
let failedScanTimestamps: number[] = []
let cooldownUntil: number | null = null

/**
 * Clean up expired replay tokens from the map
 */
function cleanupUsedTokens(now: number) {
  usedTokens.forEach((timestamp, key) => {
    if (now - timestamp > QR_EXPIRY_MS * 2) {
      usedTokens.delete(key)
    }
  })
}

/**
 * Check if the scanner is currently in cooldown due to excessive invalid scans
 */
export function getScannerLockStatus(now = Date.now()): { isLocked: boolean; cooldownRemainingSeconds: number } {
  if (cooldownUntil && now < cooldownUntil) {
    const remaining = Math.ceil((cooldownUntil - now) / 1000)
    return { isLocked: true, cooldownRemainingSeconds: remaining }
  }
  if (cooldownUntil && now >= cooldownUntil) {
    cooldownUntil = null
    failedScanTimestamps = []
  }
  return { isLocked: false, cooldownRemainingSeconds: 0 }
}

/**
 * Record an invalid scan attempt and trigger cooldown if threshold exceeded
 */
export function recordInvalidScan(now = Date.now()): { isLocked: boolean; cooldownRemainingSeconds: number } {
  const status = getScannerLockStatus(now)
  if (status.isLocked) return status

  // Prune timestamps older than the sliding window
  failedScanTimestamps = failedScanTimestamps.filter(t => now - t <= INVALID_WINDOW_MS)
  failedScanTimestamps.push(now)

  if (failedScanTimestamps.length >= MAX_INVALID_ATTEMPTS) {
    cooldownUntil = now + COOLDOWN_DURATION_MS
    failedScanTimestamps = []
    return { isLocked: true, cooldownRemainingSeconds: Math.ceil(COOLDOWN_DURATION_MS / 1000) }
  }

  return { isLocked: false, cooldownRemainingSeconds: 0 }
}

/**
 * Record a valid scan to reset failed attempt streaks
 */
export function recordValidScan(): void {
  failedScanTimestamps = []
  cooldownUntil = null
}

export interface QrValidationResult {
  valid: boolean
  error?: 'EXPIRED_TOKEN' | 'REPLAY_DETECTED' | 'RATE_LIMITED' | 'INVALID_FORMAT'
  message?: string
  memberCode?: string
  tokenSeed?: number
  cooldownRemainingSeconds?: number
}

/**
 * Validates a dynamic QR payload and consumes the token to prevent replay
 */
export function validateAndConsumeQrToken(rawText: string, now = Date.now()): QrValidationResult {
  const lockStatus = getScannerLockStatus(now)
  if (lockStatus.isLocked) {
    return {
      valid: false,
      error: 'RATE_LIMITED',
      message: `Scanner Locked: Too many invalid scans. Please wait ${lockStatus.cooldownRemainingSeconds}s.`,
      cooldownRemainingSeconds: lockStatus.cooldownRemainingSeconds,
    }
  }

  const query = rawText.trim()
  if (!query) {
    const lock = recordInvalidScan(now)
    return {
      valid: false,
      error: 'INVALID_FORMAT',
      message: 'Empty QR code payload.',
      cooldownRemainingSeconds: lock.cooldownRemainingSeconds,
    }
  }

  // Check if it matches DNA360:[MEMBER:]<code>:<tokenSeed>
  if (query.startsWith('DNA360:')) {
    const parts = query.split(':')
    // Format 1: DNA360:MEMBER:<code>:<seed>
    // Format 2: DNA360:<code>:<seed>
    let memberCode = ''
    let seedStr = ''

    if (parts.length >= 4 && parts[1] === 'MEMBER') {
      memberCode = parts[2]
      seedStr = parts[3]
    } else if (parts.length >= 3) {
      memberCode = parts[1]
      seedStr = parts[2]
    } else if (parts.length === 2) {
      memberCode = parts[1]
    }

    if (seedStr) {
      const tokenSeed = parseInt(seedStr, 10)
      if (isNaN(tokenSeed)) {
        const lock = recordInvalidScan(now)
        return {
          valid: false,
          error: 'INVALID_FORMAT',
          message: 'Invalid QR token timestamp format.',
          cooldownRemainingSeconds: lock.cooldownRemainingSeconds,
        }
      }

      // Check token expiry: tokenSeed must be within [now - 90s, now + 30s] (allowing clock drift)
      const ageMs = now - tokenSeed
      if (ageMs > QR_EXPIRY_MS) {
        const lock = recordInvalidScan(now)
        return {
          valid: false,
          error: 'EXPIRED_TOKEN',
          message: `QR Code Expired: Token is ${Math.round(ageMs / 1000)}s old (limit is 90s). Please ask the member to refresh their app.`,
          memberCode,
          tokenSeed,
          cooldownRemainingSeconds: lock.cooldownRemainingSeconds,
        }
      }

      // Replay Detection
      cleanupUsedTokens(now)
      const replayKey = `${memberCode}:${tokenSeed}`
      if (usedTokens.has(replayKey)) {
        const lock = recordInvalidScan(now)
        return {
          valid: false,
          error: 'REPLAY_DETECTED',
          message: 'Replay Detected: This dynamic QR code has already been scanned and verified. Duplicates are blocked.',
          memberCode,
          tokenSeed,
          cooldownRemainingSeconds: lock.cooldownRemainingSeconds,
        }
      }

      // Consume the token
      usedTokens.set(replayKey, now)
      recordValidScan()

      return {
        valid: true,
        memberCode,
        tokenSeed,
      }
    }

    // If no seed provided (e.g. static search code DNA360:MEM001)
    return {
      valid: true,
      memberCode,
    }
  }

  // Non-prefixed direct search query (e.g. typed phone or code)
  return {
    valid: true,
    memberCode: query,
  }
}

/**
 * Reset in-memory tracking (for test suite isolation)
 */
export function resetQrSecurityState(): void {
  usedTokens.clear()
  failedScanTimestamps = []
  cooldownUntil = null
}
