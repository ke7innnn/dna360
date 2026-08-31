import type { AuditAction, AuditActor, AuditLogEntry } from '@/types/auth'

const STORAGE_KEY = 'dna360_audit_log'

// Seeded initial audit logs representing realistic system events
const SEEDED_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud_01J6K89A01',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    actor: {
      id: 'usr_owner_01',
      name: 'Executive Admin',
      email: 'admin@dna360.in',
      role: 'Owner / Executive',
    },
    action: 'LOGIN',
    entity: 'Auth',
    entityId: 'usr_owner_01',
    branchId: 'pow',
    branchName: 'Powai',
    beforeState: null,
    afterState: { authMethod: 'password', twoFactor: 'TOTP_VERIFIED', ip: '103.21.126.14', status: 'authenticated' },
    ipAddress: '103.21.126.14',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    description: 'Owner authenticated via email + 2FA TOTP from Mumbai, IN',
  },
  {
    id: 'aud_01J6K89A02',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    actor: {
      id: 'usr_staff_01',
      name: 'Swapnil Borhade',
      email: 'swapnil.hr@dna360.in',
      role: 'HR Head',
    },
    action: 'ROLE_CHANGE',
    entity: 'Role',
    entityId: 'role_fitness_consultant',
    branchId: 'pow',
    branchName: 'Powai',
    beforeState: {
      name: 'Fitness Consultant',
      capabilities: ['leads.manage', 'members.view.all', 'checkin.operate'],
    },
    afterState: {
      name: 'Fitness Consultant',
      capabilities: ['leads.manage', 'members.view.all', 'members.enrol', 'billing.view', 'billing.create', 'checkin.operate', 'classes.book_member'],
    },
    ipAddress: '103.21.126.14',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    description: 'Updated Fitness Consultant capabilities (+billing.create, +classes.book_member)',
  },
  {
    id: 'aud_01J6K89A03',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    actor: {
      id: 'usr_owner_01',
      name: 'Executive Admin',
      email: 'admin@dna360.in',
      role: 'Owner / Executive',
    },
    action: 'REVENUE_VIEW',
    entity: 'RevenueAnalytics',
    entityId: 'overview_mrr_aug_2026',
    branchId: 'pow',
    branchName: 'Powai',
    beforeState: null,
    afterState: { mrrMinor: 184000000, gstLiabilityMinor: 9200000 },
    ipAddress: '103.21.126.14',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    description: 'Owner accessed monthly MRR financial breakdown and GSTR-1 liability summary',
  },
  {
    id: 'aud_01J6K89A04',
    timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    actor: {
      id: 'usr_staff_10',
      name: 'Monica Picholla',
      email: 'monica.sales@dna360.in',
      role: 'Asst Sales Head',
    },
    action: 'CREATE',
    entity: 'TaxInvoice',
    entityId: 'inv_099124',
    branchId: 'pow',
    branchName: 'Powai',
    beforeState: null,
    afterState: {
      invoiceNumber: 'DNA/2026-27/0042',
      memberName: 'Ananya Roy',
      totalMinor: 4350000,
      cgstMinor: 103571,
      sgstMinor: 103572,
    },
    ipAddress: '192.168.1.105',
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    description: 'Raised GST tax invoice DNA/2026-27/0042 for Annual Gym Package (₹43,500)',
  },
]

let serverAuditLogs: AuditLogEntry[] = [...SEEDED_AUDIT_LOGS]

function getStoredLogs(): AuditLogEntry[] {
  if (typeof window === 'undefined') return serverAuditLogs
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
  if (typeof window === 'undefined') {
    serverAuditLogs = logs
    return
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs))
  } catch (err) {
    console.error('Failed to save audit logs:', err)
  }
}

/**
 * Universal Immutable Audit Log Helper.
 * Every write operation & sensitive view in the system must call this helper.
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
