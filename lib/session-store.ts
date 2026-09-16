export interface AuthSessionRecord {
  id: string
  token_hash: string
  user_id: string
  user_type: 'STAFF' | 'MEMBER'
  role_slug: string
  must_change_password: boolean
  created_at: string
  last_active_at: string
  expires_at: string
  revoked_at: string | null
  ip?: string | null
  user_agent?: string | null
}

const g = globalThis as unknown as { __dna360_sessions?: Map<string, AuthSessionRecord> }
if (!g.__dna360_sessions) {
  g.__dna360_sessions = new Map<string, AuthSessionRecord>()
}

export const memorySessions = g.__dna360_sessions

export function saveSessionToMemory(record: AuthSessionRecord): void {
  memorySessions.set(record.token_hash, record)
}

export function getSessionFromMemoryByHash(tokenHash: string): AuthSessionRecord | null {
  const session = memorySessions.get(tokenHash)
  if (!session) return null
  return session
}

export function revokeSessionInMemory(tokenHash: string): void {
  const session = memorySessions.get(tokenHash)
  if (session) {
    session.revoked_at = new Date().toISOString()
  }
}

export function clearAllSessionsInMemory(): void {
  memorySessions.clear()
}
