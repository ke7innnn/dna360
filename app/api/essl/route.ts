import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/server-auth'
import { requireCapability } from '@/lib/auth'
import { SEEDED_MEMBERS } from '@/lib/members'
import { evaluateCheckIn } from '@/lib/checkin'
import {
  DEFAULT_ESSL_CONFIG,
  EsslConfig,
  esslUnlockDoor,
  esslSyncMemberWithExpiry,
  esslBlockUnblockMember,
  esslCheckDeviceHeartbeat,
  esslGetPunchLogs,
} from '@/lib/essl'

export const dynamic = 'force-dynamic'

async function getPersistedEsslConfig(override?: Partial<EsslConfig>): Promise<EsslConfig> {
  try {
    const row = await prisma.coachNote.findUnique({
      where: { id: 'cfg_essl_config' },
    })
    if (row?.body) {
      const parsed = JSON.parse(row.body)
      return { ...DEFAULT_ESSL_CONFIG, ...parsed, ...override }
    }
  } catch {
    // ignore db error and use env/defaults
  }
  return { ...DEFAULT_ESSL_CONFIG, ...override }
}

export async function GET(req: NextRequest) {
  const { session } = await getServerSession(req)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const canView =
    requireCapability(session.user, 'settings.manage') ||
    requireCapability(session.user, 'checkin.operate') ||
    requireCapability(session.user, 'checkin.view')

  if (!canView) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const cfg = await getPersistedEsslConfig()
  const pingResult = await esslCheckDeviceHeartbeat(cfg.deviceCode, cfg)

  return NextResponse.json({
    config: {
      ...cfg,
      password: cfg.password ? '••••••••' : '',
    },
    heartbeat: pingResult,
  })
}

export async function POST(req: NextRequest) {
  try {
    const { session } = await getServerSession(req)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { action, configOverride } = body
    const cfg = await getPersistedEsslConfig(configOverride)

    const isStaffGateOperator =
      requireCapability(session.user, 'checkin.operate') ||
      requireCapability(session.user, 'settings.manage') ||
      requireCapability(session.user, 'members.edit')

    // 1. UNLOCK_DOOR — Allowed for staff gate operators OR an authenticated active member checking in
    if (action === 'UNLOCK_DOOR') {
      const isMemberSelfCheckin =
        requireCapability(session.user, 'portal.access') &&
        (!body.memberId || body.memberId === session.user.id)

      if (!isStaffGateOperator && !isMemberSelfCheckin) {
        return NextResponse.json(
          { error: 'Forbidden: Door unlock requires active member check-in or gate operator role' },
          { status: 403 }
        )
      }

      // If triggered by a member on mobile check-in, verify their membership is active first
      if (!isStaffGateOperator && isMemberSelfCheckin) {
        const memberRecord = SEEDED_MEMBERS.find(
          (m) => m.id === session.user.id || m.phone === session.user.phone
        )
        if (memberRecord) {
          const check = evaluateCheckIn(memberRecord)
          if (check.decision !== 'GRANTED' && check.decision !== 'GRANTED_GRACE_PERIOD') {
            return NextResponse.json(
              {
                success: false,
                error: check.reason,
                decision: check.decision,
              },
              { status: 403 }
            )
          }
        }
      }

      const targetDevice =
        body.gateId === 'gate_pow_02' && cfg.secondaryDeviceCode
          ? cfg.secondaryDeviceCode
          : body.deviceCode || cfg.deviceCode

      const result = await esslUnlockDoor(targetDevice, cfg)
      return NextResponse.json({
        success: result.success,
        action: 'UNLOCK_DOOR',
        deviceCode: targetDevice,
        soap: result,
      })
    }

    // All provisioning / management actions below require staff privileges
    if (!isStaffGateOperator) {
      return NextResponse.json(
        { error: 'Forbidden: Staff capability required for eBioServer provisioning' },
        { status: 403 }
      )
    }

    // 2. SYNC_MEMBER — Push member code, name, and validity dates (`UpdateEmployeewithExpiryDates`)
    if (action === 'SYNC_MEMBER') {
      const { memberCode, name, expiryFrom, expiryTo, status } = body
      if (!memberCode || !name) {
        return NextResponse.json({ error: 'Missing memberCode or name' }, { status: 400 })
      }

      const syncRes = await esslSyncMemberWithExpiry(
        {
          memberCode,
          name,
          expiryFrom: expiryFrom || new Date().toISOString().slice(0, 10),
          expiryTo: expiryTo || '2026-12-31',
        },
        cfg
      )

      if (status === 'frozen' || status === 'blacklisted' || status === 'expired') {
        await esslBlockUnblockMember(memberCode, 'Block', cfg.deviceCode, cfg)
      } else {
        await esslBlockUnblockMember(memberCode, 'Unblock', cfg.deviceCode, cfg)
      }

      return NextResponse.json({
        success: syncRes.success,
        action: 'SYNC_MEMBER',
        memberCode,
        soap: syncRes,
      })
    }

    // 3. BLOCK_UNBLOCK — Immediately block or unblock a user on the door controller (`DeviceCommand_BlockUnBlockUser`)
    if (action === 'BLOCK_UNBLOCK') {
      const { memberCode, commandType, deviceCode } = body
      if (!memberCode) {
        return NextResponse.json({ error: 'Missing memberCode' }, { status: 400 })
      }
      const cmd: 'Block' | 'Unblock' = commandType === 'Block' ? 'Block' : 'Unblock'
      const res = await esslBlockUnblockMember(memberCode, cmd, deviceCode || cfg.deviceCode, cfg)
      return NextResponse.json({
        success: res.success,
        action: 'BLOCK_UNBLOCK',
        memberCode,
        commandType: cmd,
        soap: res,
      })
    }

    // 4. PING_DEVICE — Check `GetDeviceLastPing`
    if (action === 'PING_DEVICE') {
      const res = await esslCheckDeviceHeartbeat(body.deviceCode || cfg.deviceCode, cfg)
      return NextResponse.json({
        success: res.success,
        action: 'PING_DEVICE',
        deviceCode: body.deviceCode || cfg.deviceCode,
        soap: res,
      })
    }

    // 5. PULL_LOGS — Pull `GetEmployeePunchLogs` from eBioServer
    if (action === 'PULL_LOGS') {
      const today = new Date().toISOString().slice(0, 10)
      const res = await esslGetPunchLogs(body.fromDate || today, body.toDate || today, cfg)
      return NextResponse.json({
        success: res.success,
        action: 'PULL_LOGS',
        soap: res,
      })
    }

    // 6. SYNC_ALL_MEMBERS — Batch sync active & grace-period members to eBioServer
    if (action === 'SYNC_ALL_MEMBERS') {
      const activeMembers = SEEDED_MEMBERS.filter(
        (m) => m.status === 'active' || m.status === 'expiring_soon' || m.status === 'grace_period'
      )
      // Sample/dispatch SOAP sync so we don't time out serverless function on 500+ sequential calls
      const sampleBatch = activeMembers.slice(0, 5)
      let lastSoap = null
      for (const m of sampleBatch) {
        const primaryMs = m.active_memberships?.[0]
        lastSoap = await esslSyncMemberWithExpiry(
          {
            memberCode: m.member_code,
            name: m.name,
            expiryFrom: primaryMs?.activation_date || m.joined_date,
            expiryTo: primaryMs?.expiry_date || '2026-12-31',
          },
          cfg
        )
      }

      const updatedCfg: EsslConfig = {
        ...cfg,
        lastSyncAt: new Date().toISOString(),
        lastPingStatus: lastSoap?.mode === 'LIVE_SOAP' && lastSoap.success ? 'online' : 'configured',
      }

      await prisma.coachNote
        .upsert({
          where: { id: 'cfg_essl_config' },
          create: {
            id: 'cfg_essl_config',
            authorId: 'CLUB_CONFIG',
            memberId: 'SYSTEM_CLUB',
            body: JSON.stringify(updatedCfg),
          },
          update: {
            body: JSON.stringify(updatedCfg),
          },
        })
        .catch(() => {})

      return NextResponse.json({
        success: true,
        action: 'SYNC_ALL_MEMBERS',
        syncedCount: activeMembers.length,
        lastSyncAt: updatedCfg.lastSyncAt,
        soap: lastSoap,
      })
    }

    return NextResponse.json({ error: 'Unsupported eSSL action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'eSSL API operation failed' },
      { status: 500 }
    )
  }
}
