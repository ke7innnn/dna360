import type { AuditAction, AuditActor, AuditLogEntry } from '@/types/auth'

const STORAGE_KEY = 'dna360_audit_log'

// Seeded initial audit logs representing realistic system events
const SEEDED_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud_01J6K89A01',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    actor: {
      id: 'usr_owner_01',
      name: 'Kevin Patel',
      email: 'kevin@pinnacle.studio',
      role: 'Owner',
    },
    action: 'LOGIN',
    entity: 'Auth',
    entityId: 'usr_owner_01',
    branchId: 'pow',
    branchName: 'Powai',
    beforeState: null,
    afterState: { authMethod: 'password', ip: '103.21.126.14', status: 'authenticated' },
    ipAddress: '103.21.126.14',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    description: 'Owner authenticated via email + password from Mumbai, IN',
  },
  {
    id: 'aud_01J6K89A02',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    actor: {
      id: 'usr_manager_01',
      name: 'Sneha Rao',
      email: 'sneha@dna360.in',
      role: 'Manager',
    },
    action: 'UPDATE',
    entity: 'Role',
    entityId: 'role_front_desk',
    branchId: 'pow',
    branchName: 'Powai',
    beforeState: {
      name: 'Front Desk',
      capabilities: ['members.view', 'attendance.check_in', 'front_desk.access'],
    },
    afterState: {
      name: 'Front Desk',
      capabilities: ['members.view', 'members.create', 'attendance.check_in', 'front_desk.access', 'front_desk.day_pass'],
    },
    ipAddress: '103.21.126.14',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    description: 'Updated Front Desk capabilities (+members.create, +front_desk.day_pass)',
  },
  {
    id: 'aud_01J6K89A03',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    actor: {
      id: 'usr_owner_01',
      name: 'Kevin Patel',
      email: 'kevin@pinnacle.studio',
      role: 'Owner',
    },
    action: 'REVOKE_SESSION',
    entity: 'Session',
    entityId: 'sess_staff_temp_99',
    branchId: 'pow',
    branchName: 'Powai',
    beforeState: { sessionId: 'sess_staff_temp_99', status: 'active', user: 'vikram.t@dna360.in' },
    afterState: { sessionId: 'sess_staff_temp_99', status: 'revoked', reason: 'Staff departure protocol' },
    ipAddress: '103.21.126.14',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    description: 'Force-revoked active staff session for Vikram T',
  },
  {
    id: 'aud_01J6K89A04',
    timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    actor: {
      id: 'usr_fd_01',
      name: 'Amit Sharma',
      email: 'amit.desk@dna360.in',
      role: 'Front Desk',
    },
    action: 'CREATE',
    entity: 'Member',
    entityId: 'mbr_099124',
    branchId: 'pow',
    branchName: 'Powai',
    beforeState: null,
    afterState: {
      id: 'mbr_099124',
      name: 'Rohit Verma',
      phone: '+919820011223',
      plan: 'Annual Premium',
      status: 'active',
    },
    ipAddress: '192.168.1.105',
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    description: 'Registered new walk-in member Rohit Verma (Annual Premium)',
  },
]

function getStoredLogs(): AuditLogEntry[] {
  if (typeof window === 'undefined') return SEEDED_AUDIT_LOGS
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEEDED_AUDIT_LOGS))
      return SEEDED_AUDIT_LOGS
    }
    return JSON.parse(data)
  } catch (err) {
    console.error('Failed to load audit logs from storage:', err)
    return SEEDED_AUDIT_LOGS
  }
}

function saveLogs(logs: AuditLogEntry[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs))
  } catch (err) {
    console.error('Failed to save audit logs:', err)
  }
}

/**
 * Universal Immutable Audit Log Helper.
 * Every write operation in the system must call this helper.
 */
export function logAuditEvent(params: {
  actor: AuditActor
  action: AuditAction
  entity: string
  entityId: string
  branchId: string
  branchName?: string
  beforeState?: Record<string, unknown> | object | unknown | null
  afterState?: Record<string, unknown> | object | unknown | null
  description: string
  ipAddress?: string
  userAgent?: string
}): AuditLogEntry {
  const currentLogs = getStoredLogs()

  const newEntry: AuditLogEntry = {
    id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    actor: params.actor,
    action: params.action,
    entity: params.entity,
    entityId: params.entityId,
    branchId: params.branchId,
    branchName: params.branchName || 'Powai',
    beforeState: params.beforeState ?? null,
    afterState: params.afterState ?? null,
    ipAddress: params.ipAddress || '103.21.126.14',
    userAgent:
      params.userAgent ||
      (typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown Client'),
    description: params.description,
  }

  // Prepend so newest is first (immutable append)
  const updatedLogs = [newEntry, ...currentLogs]
  saveLogs(updatedLogs)

  // Dispatch custom event so reactive UI components can refresh instantly
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('dna360_audit_appended', { detail: newEntry }))
  }

  return newEntry
}

/**
 * Retrieve and filter audit logs
 */
export function getAuditLogs(filter?: {
  action?: string
  entity?: string
  actorId?: string
  search?: string
  branchId?: string
}): AuditLogEntry[] {
  let logs = getStoredLogs()

  if (!filter) return logs

  if (filter.action && filter.action !== 'all') {
    logs = logs.filter((l) => l.action.toLowerCase() === filter.action?.toLowerCase())
  }
  if (filter.entity && filter.entity !== 'all') {
    logs = logs.filter((l) => l.entity.toLowerCase() === filter.entity?.toLowerCase())
  }
  if (filter.actorId && filter.actorId !== 'all') {
    logs = logs.filter((l) => l.actor.id === filter.actorId)
  }
  if (filter.branchId && filter.branchId !== 'all') {
    logs = logs.filter((l) => l.branchId === filter.branchId)
  }
  if (filter.search) {
    const q = filter.search.toLowerCase()
    logs = logs.filter(
      (l) =>
        l.description.toLowerCase().includes(q) ||
        l.actor.name.toLowerCase().includes(q) ||
        l.actor.email.toLowerCase().includes(q) ||
        l.entity.toLowerCase().includes(q) ||
        l.entityId.toLowerCase().includes(q) ||
        (l.ipAddress ? l.ipAddress.includes(q) : false)
    )
  }

  return logs
}
