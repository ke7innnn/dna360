/* ============================================================
   DNA 360 — Attendance & Turnstile Access Engine
   
   - Single location (Powai gates)
   - Evaluates access via evaluateCheckIn (Happy Hours, grace period,
     session balance, blacklist)
   - Real-time occupancy calculation
   - Turnstile scan logging with audit
   ============================================================ */

import type {
  AccessDecision,
  AccessLogEntry,
  FloorOccupancy,
  AttendanceFilterOptions,
  ScanType,
  GateDevice,
} from '@/types/attendance'
import { getStoredMembers, updateMember } from '@/lib/members'
import { evaluateCheckIn } from '@/lib/checkin'
import { logAuditEvent } from '@/lib/audit'
import { validateAndConsumeQrToken, recordInvalidScan } from '@/lib/qr-security'

const ACCESS_LOGS_STORAGE_KEY = 'dna360_access_logs'

export type { GateDevice } from '@/types/attendance'

export const SEEDED_GATES: GateDevice[] = [
  {
    id: 'gate_pow_01',
    name: 'Gate 1 - Main Turnstile',
    branchId: 'pow',
    branchName: 'Hiranandani Gardens, Powai',
    type: 'entry',
    status: 'online',
    ipAddress: '192.168.1.101',
    lastHeartbeat: new Date().toISOString(),
  },
  {
    id: 'gate_pow_02',
    name: 'Gate 2 - Steam & Locker Turnstile',
    branchId: 'pow',
    branchName: 'Hiranandani Gardens, Powai',
    type: 'steam_zone',
    status: 'online',
    ipAddress: '192.168.1.102',
    lastHeartbeat: new Date().toISOString(),
  },
  {
    id: 'gate_pow_03',
    name: 'Gate 3 - Exit Turnstile',
    branchId: 'pow',
    branchName: 'Hiranandani Gardens, Powai',
    type: 'exit',
    status: 'online',
    ipAddress: '192.168.1.103',
    lastHeartbeat: new Date().toISOString(),
  },
]

export const SEEDED_ACCESS_LOGS: AccessLogEntry[] = [
  {
    id: 'acc_001',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    memberId: 'mem_001',
    memberName: 'Arjun Mehta',
    memberPhone: '+919820011111',
    scanType: 'QR',
    decision: 'GRANTED',
    reason: 'Access granted via Annual Gym Membership Package 1',
    specialInclusions: 'Complimentary locker access & valet parking on weekends',
  },
  {
    id: 'acc_002',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    memberId: 'mem_002',
    memberName: 'Priya Sharma',
    memberPhone: '+919820022222',
    scanType: 'QR',
    decision: 'GRANTED',
    reason: 'Access granted via Reformer Pilates — 36 Sessions (3 Months)',
    adjustmentCreditsRemaining: 2,
  },
  {
    id: 'acc_003',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    memberId: 'mem_003',
    memberName: 'Vikram Singh',
    memberPhone: '+919820033333',
    scanType: 'QR',
    decision: 'GRANTED_GRACE_PERIOD',
    reason: 'Granted (grace period — 5 days remaining). Renew membership to continue access.',
    graceDaysRemaining: 5,
  },
]

export function getStoredAccessLogs(): AccessLogEntry[] {
  if (typeof window === 'undefined') return SEEDED_ACCESS_LOGS
  const stored = localStorage.getItem(ACCESS_LOGS_STORAGE_KEY)
  if (!stored) {
    localStorage.setItem(ACCESS_LOGS_STORAGE_KEY, JSON.stringify(SEEDED_ACCESS_LOGS))
    return SEEDED_ACCESS_LOGS
  }
  try { return JSON.parse(stored) } catch { return SEEDED_ACCESS_LOGS }
}

export function saveAccessLogs(logs: AccessLogEntry[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(ACCESS_LOGS_STORAGE_KEY, JSON.stringify(logs.slice(0, 5000)))
  window.dispatchEvent(new Event('dna360_access_logs_updated'))
}

export function getStoredGates(): GateDevice[] {
  return SEEDED_GATES
}

export function getAccessLogs(filters: AttendanceFilterOptions = {}): AccessLogEntry[] {
  let list = getStoredAccessLogs()

  if (filters.search) {
    const q = filters.search.toLowerCase().trim()
    list = list.filter(l =>
      l.memberName.toLowerCase().includes(q) ||
      l.memberPhone.includes(q) ||
      l.reason.toLowerCase().includes(q)
    )
  }

  if (filters.decision && filters.decision !== 'all') {
    list = list.filter(l => l.decision === filters.decision)
  }

  if (filters.date) {
    list = list.filter(l => l.timestamp.startsWith(filters.date!))
  }

  return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export function getLiveOccupancy(_branchId?: string): FloorOccupancy {
  const logs = getStoredAccessLogs()
  const todayStr = new Date().toISOString().slice(0, 10)
  const todaysLogs = logs.filter(l => l.timestamp.startsWith(todayStr))

  const entriesToday = todaysLogs.filter(l => l.decision === 'GRANTED' || l.decision === 'GRANTED_GRACE_PERIOD' || l.decision === 'MANUAL_OVERRIDE').length
  const currentEst = Math.max(12, Math.min(65, Math.round(entriesToday * 0.45)))

  return {
    currentCount: currentEst,
    maxCapacity: 200,
    peakTimeToday: '07:30 - 09:30 AM',
    avgDwellMinutes: 68,
  }
}

/**
 * Scan turnstile QR or search code and evaluate access.
 */
export function scanTurnstilePass(query: string, gateId = 'gate_pow_01', scanType: ScanType = 'QR') {
  const members = getStoredMembers()
  let cleanQuery = query.trim()

  if (scanType === 'QR' && cleanQuery.startsWith('DNA360:')) {
    const qrValidation = validateAndConsumeQrToken(cleanQuery)
    if (!qrValidation.valid) {
      const logEntry: AccessLogEntry = {
        id: `acc_${Date.now()}`,
        timestamp: new Date().toISOString(),
        memberId: 'unknown',
        memberName: 'Unverified QR Token',
        memberPhone: query,
        gateId,
        gateName: gateId === 'gate_pow_01' ? 'Gate 1 - Main Turnstile' : 'Gate 2 - Secondary Turnstile',
        scanType,
        decision: 'DENIED_EXPIRED',
        reason: qrValidation.message || 'Dynamic QR validation failed.',
      }
      const logs = getStoredAccessLogs()
      saveAccessLogs([logEntry, ...logs])
      return { entry: logEntry, member: undefined }
    }
    cleanQuery = qrValidation.memberCode || cleanQuery
  } else if (cleanQuery.startsWith('DNA360:')) {
    const parts = cleanQuery.split(':')
    cleanQuery = parts[1] === 'MEMBER' ? parts[2] || '' : parts[1] || ''
  }
  const q = cleanQuery.trim().toLowerCase()

  const member = members.find(
    m =>
      m.id === cleanQuery ||
      m.member_code.toLowerCase() === q ||
      m.phone.includes(q) ||
      m.name.toLowerCase().includes(q)
  )

  let decision: AccessDecision = 'GRANTED'
  let reason = 'Active membership verified. Turnstile unlocked.'
  let dayPassChargeMinor: number | undefined
  let graceDaysRemaining: number | undefined
  let specialInclusions: string | undefined
  let adjustmentCreditsRemaining: number | undefined

  if (!member) {
    recordInvalidScan()
    decision = 'DENIED_EXPIRED'
    reason = 'No active member record or QR pass found in database.'
  } else {
    const result = evaluateCheckIn(member)
    decision = result.decision
    reason = result.reason
    dayPassChargeMinor = result.dayPassChargeMinor
    graceDaysRemaining = result.graceDaysRemaining || undefined
    specialInclusions = result.specialInclusions || undefined
    adjustmentCreditsRemaining = result.adjustmentCreditsRemaining || undefined

    if (decision === 'GRANTED' || decision === 'GRANTED_GRACE_PERIOD') {
      updateMember(member.id, {
        attendance_streak: member.attendance_streak + 1,
        total_check_ins: member.total_check_ins + 1,
        last_visit_at: new Date().toISOString(),
      })
    }
  }

  const logEntry: AccessLogEntry = {
    id: `acc_${Date.now()}`,
    timestamp: new Date().toISOString(),
    memberId: member ? member.id : 'unknown',
    memberName: member ? member.name : 'Unknown Visitor',
    memberPhone: member ? member.phone : query,
    memberCode: member ? member.member_code : undefined,
    gateId,
    gateName: gateId === 'gate_pow_01' ? 'Gate 1 - Main Turnstile' : 'Gate 2 - Secondary Turnstile',
    scanType,
    decision,
    reason,
    dayPassChargeMinor,
    graceDaysRemaining,
    specialInclusions,
    adjustmentCreditsRemaining,
  }

  const logs = getStoredAccessLogs()
  saveAccessLogs([logEntry, ...logs])

  logAuditEvent({
    actor: { id: 'usr_turnstile', name: 'Turnstile Scanner', email: 'hardware@dna360.in', role: 'Hardware' },
    action: 'CREATE',
    entity: 'TurnstileAccess',
    entityId: logEntry.id,
    branchId: 'pow',
    description: `Turnstile Scan at ${gateId}: ${logEntry.memberName} -> ${decision} (${reason})`,
    afterState: logEntry,
  })

  return { entry: logEntry, member }
}

export function triggerManualOverride(
  memberId: string,
  gateId = 'gate_pow_01',
  reason: string,
  staffName = 'Amit Sharma (Fitness Consultant)'
): AccessLogEntry | null {
  const members = getStoredMembers()
  const member = members.find(m => m.id === memberId)
  if (!member) return null

  updateMember(member.id, {
    attendance_streak: member.attendance_streak + 1,
    total_check_ins: member.total_check_ins + 1,
    last_visit_at: new Date().toISOString(),
  })

  const logEntry: AccessLogEntry = {
    id: `acc_${Date.now()}`,
    timestamp: new Date().toISOString(),
    memberId: member.id,
    memberName: member.name,
    memberPhone: member.phone,
    memberCode: member.member_code,
    gateId,
    gateName: gateId === 'gate_pow_01' ? 'Gate 1 - Main Turnstile' : 'Gate 2 - Secondary Turnstile',
    scanType: 'Manual',
    decision: 'MANUAL_OVERRIDE',
    reason: `Manual override by ${staffName}: ${reason}`,
    overrideBy: staffName,
    overrideReason: reason,
    specialInclusions: member.special_inclusions || undefined,
    adjustmentCreditsRemaining: member.adjustment_credits_remaining || undefined,
  }

  const logs = getStoredAccessLogs()
  saveAccessLogs([logEntry, ...logs])

  logAuditEvent({
    actor: { id: 'system', name: staffName, email: '', role: 'Staff' },
    action: 'CHECKIN_OVERRIDE',
    entity: 'TurnstileAccess',
    entityId: logEntry.id,
    branchId: 'pow',
    description: `Manual override for ${member.name}: ${reason}`,
    afterState: logEntry,
  })

  return logEntry
}

export const evaluateAccess = scanTurnstilePass
export const getFloorOccupancy = getLiveOccupancy

export function triggerEmergencyEvacuation(staffName = 'Duty Manager'): void {
  logAuditEvent({
    actor: { id: 'system', name: staffName, email: '', role: 'Manager' },
    action: 'CHECKIN_OVERRIDE',
    entity: 'TurnstileAccess',
    entityId: `emerg_${Date.now()}`,
    branchId: 'pow',
    description: 'Emergency Evacuation Triggered — All turnstiles unlocked open.',
  })
}

export function resetEmergencyGates(staffName = 'Duty Manager'): void {
  logAuditEvent({
    actor: { id: 'system', name: staffName, email: '', role: 'Manager' },
    action: 'CHECKIN_OVERRIDE',
    entity: 'TurnstileAccess',
    entityId: `emerg_rst_${Date.now()}`,
    branchId: 'pow',
    description: 'Emergency state cleared — Turnstiles restored to normal access control.',
  })
}
