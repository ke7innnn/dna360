import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { SEEDED_MEMBERS, normalizeMember } from '@/lib/members'
import { evaluateCheckIn } from '@/lib/checkin'
import { validateAndConsumeQrToken } from '@/lib/qr-security'
import {
  DEFAULT_ESSL_CONFIG,
  EsslConfig,
  esslUnlockDoor,
  esslBlockUnblockMember,
  tryDecryptEsslPayload,
} from '@/lib/essl'
import type { AccessLogEntry, ScanType } from '@/types/attendance'

export const dynamic = 'force-dynamic'

async function loadServerEsslConfig(): Promise<EsslConfig> {
  try {
    const row = await prisma.coachNote.findUnique({
      where: { id: 'cfg_essl_config' },
    })
    if (row?.body) {
      return { ...DEFAULT_ESSL_CONFIG, ...JSON.parse(row.body) }
    }
  } catch {
    // fallback to env/default config
  }
  return DEFAULT_ESSL_CONFIG
}

function extractXmlTag(xml: string, tag: string): string | undefined {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const match = xml.match(regex)
  return match?.[1]?.trim()
}

/**
 * GET /api/webhooks/essl
 * Health check & webhook handshake endpoint for eSSL eBioServer-New
 */
export async function GET(req: NextRequest) {
  const challenge =
    req.nextUrl.searchParams.get('challenge') ||
    req.nextUrl.searchParams.get('echo') ||
    req.nextUrl.searchParams.get('hub.challenge')

  if (challenge) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  const cfg = await loadServerEsslConfig()
  return NextResponse.json({
    status: 'ok',
    service: 'DNA 360 eSSL eBioServer-New Real-Time Door Webhook',
    protocol: 'SOAP 1.1 Webservice.asmx + Real-Time JSON/XML Push',
    deviceCode: cfg.deviceCode,
    locationCode: cfg.locationCode,
    autoUnlockOnQrVerify: cfg.autoUnlockOnQrVerify,
    timestamp: new Date().toISOString(),
  })
}

/**
 * POST /api/webhooks/essl
 * Receives real-time punch / biometric / RFID / QR scan events pushed by eSSL eBioServer-New,
 * verifies membership status in DNA 360, logs the turnstile entry, and triggers `DeviceCommand_UnlockDoor`.
 */
export async function POST(req: NextRequest) {
  try {
    const cfg = await loadServerEsslConfig()
    const rawBody = await req.text()
    const contentType = (req.headers.get('content-type') || '').toLowerCase()

    let payload: Record<string, any> = {}

    if (contentType.includes('xml') || rawBody.trim().startsWith('<')) {
      payload = {
        EmployeeCode:
          extractXmlTag(rawBody, 'EmployeeCode') ||
          extractXmlTag(rawBody, 'UserId') ||
          extractXmlTag(rawBody, 'Pin'),
        DeviceCode:
          extractXmlTag(rawBody, 'DeviceCode') ||
          extractXmlTag(rawBody, 'SerialNumber') ||
          extractXmlTag(rawBody, 'DeviceSNo'),
        LogDate:
          extractXmlTag(rawBody, 'LogDate') ||
          extractXmlTag(rawBody, 'PunchTime') ||
          extractXmlTag(rawBody, 'AttTime'),
        VerificationType:
          extractXmlTag(rawBody, 'VerificationType') ||
          extractXmlTag(rawBody, 'VerifyMode'),
        Password: extractXmlTag(rawBody, 'Password') || extractXmlTag(rawBody, 'Secret'),
      }
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const params = new URLSearchParams(rawBody)
      params.forEach((v, k) => {
        payload[k] = v
      })
    } else if (rawBody.trim()) {
      try {
        payload = JSON.parse(rawBody)
      } catch {
        // Check if entire body is base64 AES-256 encrypted payload from eBioServer
        const decrypted = tryDecryptEsslPayload(rawBody.trim(), cfg.webhookSecret)
        if (decrypted && typeof decrypted === 'object') {
          payload = decrypted
        }
      }
    }

    // If JSON contains an encrypted inner field (`EncryptedData` or `data`)
    if (typeof payload.EncryptedData === 'string' && cfg.webhookSecret) {
      const decrypted = tryDecryptEsslPayload(payload.EncryptedData, cfg.webhookSecret)
      if (decrypted && typeof decrypted === 'object') {
        payload = { ...payload, ...decrypted }
      }
    }

    // Verify shared secret when configured
    const headerSecret =
      req.headers.get('x-essl-secret') ||
      req.headers.get('x-api-key') ||
      req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
      req.nextUrl.searchParams.get('secret') ||
      req.nextUrl.searchParams.get('key') ||
      payload.secret ||
      payload.webhookSecret ||
      payload.apiKey ||
      payload.Password

    if (
      cfg.webhookSecret &&
      headerSecret &&
      headerSecret !== cfg.webhookSecret &&
      headerSecret !== cfg.password
    ) {
      return NextResponse.json(
        { error: 'Unauthorized eSSL webhook signature or secret' },
        { status: 401 }
      )
    }

    // Normalize fields across eSSL eBioServer-New payload formats
    const rawIdentifier = String(
      payload.EmployeeCode ||
        payload.employeeCode ||
        payload.memberCode ||
        payload.MemberCode ||
        payload.UserId ||
        payload.userId ||
        payload.Pin ||
        payload.QRData ||
        payload.qrToken ||
        payload.CardNumber ||
        ''
    ).trim()

    if (!rawIdentifier) {
      return NextResponse.json(
        { error: 'Missing EmployeeCode / MemberCode / QRData in eSSL webhook payload' },
        { status: 400 }
      )
    }

    const deviceCode = String(
      payload.DeviceCode ||
        payload.deviceCode ||
        payload.SerialNumber ||
        payload.DeviceSNo ||
        cfg.deviceCode
    ).trim()

    const rawVerifyMode = String(
      payload.VerificationType || payload.verifyMode || payload.ScanType || 'Biometric'
    ).toLowerCase()

    const scanType: ScanType =
      rawVerifyMode.includes('qr') || rawIdentifier.startsWith('DNA360:')
        ? 'QR'
        : 'Biometric'

    let lookupKey = rawIdentifier
    if (rawIdentifier.startsWith('DNA360:')) {
      const qrResult = validateAndConsumeQrToken(rawIdentifier)
      if (!qrResult.valid && !rawIdentifier.startsWith('DNA360:MEMBER:')) {
        const deniedEntry: AccessLogEntry = {
          id: `acc_essl_${Date.now()}`,
          timestamp: new Date().toISOString(),
          memberId: 'unknown',
          memberName: 'Expired / Invalid QR Pass',
          memberPhone: rawIdentifier.slice(0, 24),
          gateId: deviceCode === cfg.secondaryDeviceCode ? 'gate_pow_02' : 'gate_pow_01',
          gateName:
            deviceCode === cfg.secondaryDeviceCode
              ? `Gate 2 - Steam & Locker (${deviceCode})`
              : `Gate 1 - Main eSSL Door (${deviceCode})`,
          scanType: 'QR',
          decision: 'DENIED_EXPIRED',
          reason: qrResult.message || 'QR token expired or already used at eSSL reader.',
        }
        await prisma.coachNote
          .upsert({
            where: { id: deniedEntry.id },
            create: {
              id: deniedEntry.id,
              authorId: 'ACCESS_LOG',
              memberId: 'TURNSTILE',
              body: JSON.stringify(deniedEntry),
            },
            update: { body: JSON.stringify(deniedEntry) },
          })
          .catch(() => {})

        return NextResponse.json({
          status: 'denied',
          decision: 'DENIED_EXPIRED',
          doorUnlocked: false,
          reason: deniedEntry.reason,
        })
      }
      if (qrResult.memberCode) {
        lookupKey = qrResult.memberCode
      } else {
        const parts = rawIdentifier.split(':')
        lookupKey = parts[1] === 'MEMBER' ? parts[2] || '' : parts[1] || ''
      }
    }

    const q = lookupKey.toLowerCase()
    const numericSuffix = q.replace(/\D/g, '')

    // 1. Resolve member from seeded deterministic cohort or live Prisma DB
    let matchedMember = SEEDED_MEMBERS.find(
      (m) =>
        m.id.toLowerCase() === q ||
        m.member_code.toLowerCase() === q ||
        (numericSuffix.length >= 3 &&
          m.member_code.toLowerCase().endsWith(`-${numericSuffix.padStart(4, '0')}`)) ||
        m.phone.replace(/\D/g, '').endsWith(numericSuffix && numericSuffix.length >= 10 ? numericSuffix.slice(-10) : '___none___')
    )

    try {
      const dbMember = await prisma.member.findFirst({
        where: {
          OR: [
            { id: lookupKey },
            { memberCode: { equals: lookupKey, mode: 'insensitive' } },
            { phone: { contains: lookupKey } },
          ],
        },
        include: {
          memberships: {
            where: { status: 'active' },
          },
        },
      })
      if (dbMember) {
        const activeDbMs = dbMember.memberships?.[0]
        const expDateStr =
          activeDbMs?.expiryDate ||
          matchedMember?.active_memberships?.[0]?.expiry_date ||
          '2026-12-31'

        if (matchedMember) {
          matchedMember = normalizeMember({
            ...matchedMember,
            status: (dbMember.status as any) || matchedMember.status,
            attendance_streak: dbMember.attendanceStreak ?? matchedMember.attendance_streak,
            total_check_ins: dbMember.totalCheckIns ?? matchedMember.total_check_ins,
            active_memberships: matchedMember.active_memberships.map((ms, idx) =>
              idx === 0 ? { ...ms, expiry_date: expDateStr } : ms
            ),
          })
        } else {
          matchedMember = normalizeMember({
            id: dbMember.id,
            member_code: dbMember.memberCode || `DNA-2025-${dbMember.id.slice(-4).toUpperCase()}`,
            name: dbMember.name,
            email: dbMember.email || null,
            phone: dbMember.phone,
            gender: (dbMember.gender || 'male').toLowerCase(),
            dob: dbMember.dob || '1995-01-01',
            joined_date: dbMember.joinedDate || '2025-01-15',
            status: (dbMember.status || 'active').toLowerCase(),
            attendance_streak: dbMember.attendanceStreak || 0,
            total_check_ins: dbMember.totalCheckIns || 0,
            last_visit_at: dbMember.lastVisitAt || new Date().toISOString(),
            active_memberships: [
              {
                id: activeDbMs?.id || `ms_${dbMember.id}_01`,
                product_id: activeDbMs?.productId || 'prod_1',
                product_name: activeDbMs?.productName || 'Annual Gym Membership Package 1',
                product_category: 'gym_membership',
                enrolment_date: dbMember.joinedDate || '2025-01-15',
                activation_date: activeDbMs?.activationDate || dbMember.joinedDate || '2025-01-15',
                expiry_date: expDateStr,
                amount_paid: Number(activeDbMs?.amountPaid || 3500000),
                discount_amount: 0,
                discount_reason: null,
                discount_approved_by: null,
                tax_rate: 0.05,
                status: 'active',
                invoice_id: `inv_${dbMember.id}`,
                invoice_number: `DNA/2026-27/DB`,
                sales_rep_id: 'usr_fc_01',
                sales_rep_name: 'Rajesh Poojary',
                sessions_total: activeDbMs?.sessionsTotal ?? null,
                sessions_consumed: activeDbMs?.sessionsConsumed ?? null,
                sessions_remaining: activeDbMs?.sessionsRemaining ?? null,
                access_window: null,
                void_reason: null,
                voided_by: null,
                voided_at: null,
                transferred_from: null,
                transferred_to: null,
                transfer_fee_invoice_id: null,
              },
            ],
          })
        }
      }
    } catch {
      // fallback to seeded member evaluation
    }

    if (!matchedMember) {
      const unknownEntry: AccessLogEntry = {
        id: `acc_essl_${Date.now()}`,
        timestamp: new Date().toISOString(),
        memberId: 'unknown',
        memberName: `Unregistered eSSL ID (${rawIdentifier})`,
        memberPhone: rawIdentifier,
        memberCode: rawIdentifier,
        gateId: deviceCode === cfg.secondaryDeviceCode ? 'gate_pow_02' : 'gate_pow_01',
        gateName: `Gate 1 - Main eSSL Door (${deviceCode})`,
        scanType,
        decision: 'DENIED_EXPIRED',
        reason: `EmployeeCode "${rawIdentifier}" not found in DNA 360 Powai member registry.`,
      }

      await prisma.coachNote
        .upsert({
          where: { id: unknownEntry.id },
          create: {
            id: unknownEntry.id,
            authorId: 'ACCESS_LOG',
            memberId: 'TURNSTILE',
            body: JSON.stringify(unknownEntry),
          },
          update: { body: JSON.stringify(unknownEntry) },
        })
        .catch(() => {})

      return NextResponse.json({
        status: 'denied',
        decision: 'DENIED_EXPIRED',
        doorUnlocked: false,
        employeeCode: rawIdentifier,
        reason: unknownEntry.reason,
      })
    }

    // 2. Evaluate membership rules (expiry, grace period, happy hours, sessions, freeze/blacklist)
    const evalResult = evaluateCheckIn(matchedMember)
    const isGranted =
      evalResult.decision === 'GRANTED' || evalResult.decision === 'GRANTED_GRACE_PERIOD'

    // 3. Trigger physical eSSL Door Unlock (`DeviceCommand_UnlockDoor`) or Block
    let soapResult = null
    if (isGranted) {
      soapResult = await esslUnlockDoor(deviceCode, cfg)
      // Update attendance streak & check-in count in Prisma
      await prisma.member
        .updateMany({
          where: {
            OR: [{ id: matchedMember.id }, { phone: matchedMember.phone }],
          },
          data: {
            attendanceStreak: { increment: 1 },
            totalCheckIns: { increment: 1 },
            lastVisitAt: new Date().toISOString(),
          },
        })
        .catch(() => {})
    } else {
      soapResult = await esslBlockUnblockMember(matchedMember.member_code, 'Block', deviceCode, cfg)
    }

    // 4. Persist real-time turnstile access log for Front Desk live monitor
    const logEntry: AccessLogEntry = {
      id: `acc_essl_${Date.now()}`,
      timestamp: new Date().toISOString(),
      memberId: matchedMember.id,
      memberName: matchedMember.name,
      memberPhone: matchedMember.phone,
      memberCode: matchedMember.member_code,
      gateId: deviceCode === cfg.secondaryDeviceCode ? 'gate_pow_02' : 'gate_pow_01',
      gateName:
        deviceCode === cfg.secondaryDeviceCode
          ? `Gate 2 - Steam & Locker (${deviceCode})`
          : `Gate 1 - Main eSSL Door (${deviceCode})`,
      scanType,
      decision: evalResult.decision,
      reason: isGranted
        ? `${evalResult.reason} · eSSL Door Unlocked (${deviceCode})`
        : `${evalResult.reason} · Door Locked`,
      dayPassChargeMinor: evalResult.dayPassChargeMinor,
      graceDaysRemaining: evalResult.graceDaysRemaining || undefined,
      specialInclusions: evalResult.specialInclusions || undefined,
      adjustmentCreditsRemaining: evalResult.adjustmentCreditsRemaining || undefined,
    }

    await prisma.coachNote
      .upsert({
        where: { id: logEntry.id },
        create: {
          id: logEntry.id,
          authorId: 'ACCESS_LOG',
          memberId: matchedMember.id,
          body: JSON.stringify(logEntry),
        },
        update: { body: JSON.stringify(logEntry) },
      })
      .catch(() => {})

    const primaryPlan = matchedMember.active_memberships?.[0]

    return NextResponse.json({
      status: isGranted ? 'granted' : 'denied',
      decision: evalResult.decision,
      doorUnlocked: isGranted,
      memberId: matchedMember.id,
      memberCode: matchedMember.member_code,
      memberName: matchedMember.name,
      planName: primaryPlan?.product_name || 'Gym Membership',
      membershipExpiry: primaryPlan?.expiry_date || null,
      deviceCode,
      reason: logEntry.reason,
      soapCommandResult: soapResult,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to process eSSL door webhook' },
      { status: 500 }
    )
  }
}
