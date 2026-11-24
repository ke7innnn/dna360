/* ============================================================
   DNA 360 — Persistent Serverless eSSL ADMS / iClock Store
   Persists door heartbeats & command queue in PostgreSQL (Supabase)
   via Prisma so Vercel serverless functions share state reliably.
   Falls back gracefully to in-memory store when DB is unavailable.
   ============================================================ */

import { prisma } from '@/lib/prisma'
import {
  DEFAULT_ESSL_CONFIG,
  recordAdmsHeartbeat as recordMemoryHeartbeat,
  getAdmsHeartbeats as getMemoryHeartbeats,
  queueAdmsCommand as queueMemoryCommand,
  dequeueAdmsCommands as dequeueMemoryCommands,
  type AdmsQueuedCommand,
} from '@/lib/essl'

const HB_AUTHOR_ID = 'ADMS_HEARTBEAT'
const CMD_PENDING_AUTHOR = 'ADMS_CMD_PENDING'
const CMD_SENT_AUTHOR = 'ADMS_CMD_SENT'
const CMD_DONE_AUTHOR = 'ADMS_CMD_DONE'

export interface AdmsHeartbeatRecord {
  serialNumber: string
  firstSeenAt: string
  lastSeenAt: string
  ip?: string
  totalPings: number
  lastEndpoint?: string
}

export interface AdmsDeviceStatus {
  serialNumber: string
  online: boolean
  lastSeenAt: string | null
  firstSeenAt: string | null
  secondsAgo: number | null
  ip: string | null
  totalPings: number
  pendingCommandsCount: number
  storage: 'database' | 'memory'
}

function normalizeSn(sn?: string): string {
  return (sn || DEFAULT_ESSL_CONFIG.deviceCode || 'SDE7261100390').trim().toUpperCase()
}

function generateCmdId(): number {
  // Positive 9-digit integer safe for ZKTeco/eSSL C:<id>:<cmd> protocol across serverless instances
  const timePart = Math.floor(Date.now() % 900_000_000)
  const jitter = Math.floor(Math.random() * 97)
  return Math.max(101, timePart + jitter)
}

/**
 * Records a live heartbeat from an eSSL / ZKTeco ADMS terminal.
 * Returns `isFirstConnect = true` ONLY the very first time this serial number ever connects.
 */
export async function recordAdmsHeartbeatPersistent(
  serialNumber: string,
  ip?: string,
  endpoint?: string
): Promise<{ isFirstConnect: boolean; heartbeat: AdmsHeartbeatRecord }> {
  const sn = normalizeSn(serialNumber)
  const now = new Date().toISOString()

  const memBefore = getMemoryHeartbeats()[sn]
  recordMemoryHeartbeat(sn, ip)

  const rowId = `adms_hb_${sn}`

  try {
    const existing = await prisma.coachNote.findUnique({
      where: { id: rowId },
    })

    let prev: Partial<AdmsHeartbeatRecord> = {}
    if (existing?.body) {
      try {
        prev = JSON.parse(existing.body)
      } catch {
        prev = {}
      }
    }

    const isFirstConnect = !existing
    const record: AdmsHeartbeatRecord = {
      serialNumber: sn,
      firstSeenAt: prev.firstSeenAt || now,
      lastSeenAt: now,
      ip: ip || prev.ip,
      totalPings: (prev.totalPings || 0) + 1,
      lastEndpoint: endpoint || prev.lastEndpoint,
    }

    await prisma.coachNote.upsert({
      where: { id: rowId },
      create: {
        id: rowId,
        authorId: HB_AUTHOR_ID,
        memberId: sn,
        body: JSON.stringify(record),
      },
      update: {
        body: JSON.stringify(record),
        readAt: new Date(),
      },
    })

    return { isFirstConnect, heartbeat: record }
  } catch {
    return {
      isFirstConnect: !memBefore,
      heartbeat: {
        serialNumber: sn,
        firstSeenAt: memBefore?.lastSeenAt || now,
        lastSeenAt: now,
        ip,
        totalPings: 1,
        lastEndpoint: endpoint,
      },
    }
  }
}

/**
 * Queues a hardware command (AC_UNLOCK, DATA UPDATE USERINFO, etc.) in PostgreSQL
 * so the door receives it on its very next GET /iclock/getrequest poll on any serverless instance.
 */
export async function queueAdmsCommandPersistent(
  serialNumber: string,
  command: string
): Promise<AdmsQueuedCommand> {
  const sn = serialNumber === '*' ? '*' : normalizeSn(serialNumber)
  const cmdId = generateCmdId()
  const now = new Date().toISOString()

  const entry: AdmsQueuedCommand = {
    id: cmdId,
    serialNumber: sn,
    command,
    createdAt: now,
  }

  // Always mirror in memory for immediate local dev / fallback
  queueMemoryCommand(sn, command)

  try {
    const rowId = `adms_cmd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    await prisma.coachNote.create({
      data: {
        id: rowId,
        authorId: CMD_PENDING_AUTHOR,
        memberId: sn,
        sessionId: String(cmdId),
        body: JSON.stringify(entry),
      },
    })
  } catch {
    // Graceful fallback already queued in memory
  }

  return entry
}

/**
 * Atomically fetches up to `maxBatch` pending commands for a device serial number
 * and marks them as sent (`ADMS_CMD_SENT`) so they are delivered exactly once.
 */
export async function dequeueAdmsCommandsPersistent(
  serialNumber: string,
  maxBatch = 5
): Promise<AdmsQueuedCommand[]> {
  const sn = normalizeSn(serialNumber)
  const defaultSn = normalizeSn(DEFAULT_ESSL_CONFIG.deviceCode)
  const targetSns = Array.from(new Set([sn, defaultSn, '*']))

  try {
    const rows = await prisma.coachNote.findMany({
      where: {
        authorId: CMD_PENDING_AUTHOR,
        memberId: { in: targetSns },
      },
      orderBy: { createdAt: 'asc' },
      take: maxBatch,
    })

    if (rows.length > 0) {
      const ids = rows.map((r) => r.id)
      await prisma.coachNote.updateMany({
        where: { id: { in: ids }, authorId: CMD_PENDING_AUTHOR },
        data: {
          authorId: CMD_SENT_AUTHOR,
          readAt: new Date(),
        },
      })

      // Drain matching memory queue too to avoid duplicates if running single-instance
      dequeueMemoryCommands(sn, maxBatch)

      const parsed: AdmsQueuedCommand[] = []
      for (const row of rows) {
        try {
          const item = JSON.parse(row.body) as AdmsQueuedCommand
          if (item?.id && item?.command) {
            parsed.push(item)
          }
        } catch {
          // skip malformed row
        }
      }
      return parsed
    }

    // DB succeeded and has 0 pending commands -> clear memory mirror and return []
    dequeueMemoryCommands(sn, maxBatch)
    return []
  } catch {
    // DB unavailable -> fallback to in-memory queue
    return dequeueMemoryCommands(sn, maxBatch)
  }
}

/**
 * Marks a command as acknowledged/executed when the door posts to /iclock/devicecmd.
 */
export async function acknowledgeAdmsCommandPersistent(
  serialNumber: string,
  rawAckBody: string
): Promise<void> {
  const sn = normalizeSn(serialNumber)
  const idMatch = rawAckBody.match(/(?:^|&|\s)ID=(\d+)/i)
  if (!idMatch?.[1]) return

  const cmdId = idMatch[1]
  try {
    await prisma.coachNote.updateMany({
      where: {
        memberId: sn,
        sessionId: cmdId,
        authorId: { in: [CMD_PENDING_AUTHOR, CMD_SENT_AUTHOR] },
      },
      data: {
        authorId: CMD_DONE_AUTHOR,
        readAt: new Date(),
      },
    })
  } catch {
    // non-fatal
  }
}

/**
 * Returns real-time connectivity status for the eSSL door controller.
 * Considered online if last heartbeat was received within the past 90 seconds.
 */
export async function getAdmsDeviceStatus(serialNumber?: string): Promise<AdmsDeviceStatus> {
  const sn = normalizeSn(serialNumber)
  const rowId = `adms_hb_${sn}`

  try {
    const [hbRow, pendingCount] = await Promise.all([
      prisma.coachNote.findUnique({ where: { id: rowId } }),
      prisma.coachNote.count({
        where: {
          authorId: CMD_PENDING_AUTHOR,
          memberId: { in: [sn, '*'] },
        },
      }),
    ])

    if (hbRow?.body) {
      const parsed = JSON.parse(hbRow.body) as AdmsHeartbeatRecord
      const lastMs = parsed.lastSeenAt ? new Date(parsed.lastSeenAt).getTime() : 0
      const secondsAgo = lastMs ? Math.max(0, Math.round((Date.now() - lastMs) / 1000)) : null
      return {
        serialNumber: sn,
        online: secondsAgo !== null && secondsAgo <= 90,
        lastSeenAt: parsed.lastSeenAt || null,
        firstSeenAt: parsed.firstSeenAt || null,
        secondsAgo,
        ip: parsed.ip || null,
        totalPings: parsed.totalPings || 1,
        pendingCommandsCount: pendingCount,
        storage: 'database',
      }
    }

    return {
      serialNumber: sn,
      online: false,
      lastSeenAt: null,
      firstSeenAt: null,
      secondsAgo: null,
      ip: null,
      totalPings: 0,
      pendingCommandsCount: pendingCount,
      storage: 'database',
    }
  } catch {
    const mem = getMemoryHeartbeats()[sn]
    const lastMs = mem?.lastSeenAt ? new Date(mem.lastSeenAt).getTime() : 0
    const secondsAgo = lastMs ? Math.max(0, Math.round((Date.now() - lastMs) / 1000)) : null
    return {
      serialNumber: sn,
      online: secondsAgo !== null && secondsAgo <= 90,
      lastSeenAt: mem?.lastSeenAt || null,
      firstSeenAt: mem?.lastSeenAt || null,
      secondsAgo,
      ip: mem?.ip || null,
      totalPings: mem ? 1 : 0,
      pendingCommandsCount: 0,
      storage: 'memory',
    }
  }
}

/**
 * Helper to build ADMS USERINFO sync command string for an active/updated member.
 */
export function buildAdmsUserSyncCommand(member: {
  memberCode: string
  name: string
  expiryFrom: string
  expiryTo: string
  cardNumber?: string
}): string {
  const fromDate = member.expiryFrom.slice(0, 10)
  const toDate = member.expiryTo.slice(0, 10)
  const numericPin =
    member.memberCode.replace(/\D/g, '').replace(/^202\d/, '').replace(/^0+/, '') ||
    member.memberCode
  const startCompact = fromDate.replace(/-/g, '')
  const endCompact = toDate.replace(/-/g, '')
  return `DATA UPDATE USERINFO PIN=${numericPin}\tName=${member.name.slice(0, 24)}\tPri=0\tPasswd=\tCard=${member.cardNumber || ''}\tGrp=1\tTZ=0000000100000000\tStartDatetime=${startCompact}\tEndDatetime=${endCompact}`
}

/**
 * Helper to build ADMS USERINFO block/unblock command string.
 */
export function buildAdmsBlockCommand(
  employeeCode: string,
  action: 'Block' | 'Unblock'
): string {
  const numericPin =
    employeeCode.replace(/\D/g, '').replace(/^202\d/, '').replace(/^0+/, '') || employeeCode
  if (action === 'Block') {
    return `DATA UPDATE USERINFO PIN=${numericPin}\tGrp=99\tTZ=0000000000000000\tEndDatetime=20200101`
  }
  return `DATA UPDATE USERINFO PIN=${numericPin}\tGrp=1\tTZ=0000000100000000`
}

