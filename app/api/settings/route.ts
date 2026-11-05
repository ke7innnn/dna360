import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/server-auth'
import { requireCapability, SEEDED_USERS, CLUB_ID_POWAI } from '@/lib/auth'
import { ROLE_CAPS } from '@/config/permissions'
import { memorySessions } from '@/lib/session-store'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { session } = await getServerSession(req)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const scope = req.nextUrl.searchParams.get('scope') || 'all'
    const result: Record<string, any> = {}
    const isMember =
      session.user.type === 'MEMBER' ||
      (session.user.role?.slug || '').toUpperCase() === 'MEMBER'

    if (scope === 'all' || scope === 'config' || scope === 'products' || scope === 'roles' || scope === 'frontdesk') {
      const cfgRows = await prisma.coachNote.findMany({
        where: { authorId: 'CLUB_CONFIG' },
      })
      const configs: Record<string, any> = {}
      const sensitiveMemberKeys = new Set(['bank', 'fd_pos_sales', 'fd_shifts', 'fd_lockers'])
      for (const row of cfgRows) {
        try {
          const cleanKey = row.id.replace(/^cfg_/, '')
          if (isMember && sensitiveMemberKeys.has(cleanKey)) {
            continue
          }
          configs[cleanKey] = JSON.parse(row.body)
        } catch {
          // ignore malformed config row
        }
      }
      if (isMember) {
        delete configs.bank
        delete configs.fd_pos_sales
        delete configs.fd_shifts
        delete configs.fd_lockers
      }
      result.configs = configs
    }

    if (
      (scope === 'all' || scope === 'access_logs') &&
      (requireCapability(session.user, 'checkin.view') || requireCapability(session.user, 'checkin.operate'))
    ) {
      const accRows = await prisma.coachNote.findMany({
        where: { authorId: 'ACCESS_LOG' },
        orderBy: { createdAt: 'desc' },
        take: 250,
      })
      const accessLogs: any[] = []
      for (const row of accRows) {
        try {
          accessLogs.push(JSON.parse(row.body))
        } catch {
          // ignore malformed
        }
      }
      result.accessLogs = accessLogs
    }

    if (scope === 'all' || scope === 'agreements') {
      const canViewAll = requireCapability(session.user, 'members.view.all')
      const agrRows = await prisma.coachNote.findMany({
        where: {
          authorId: 'CONSENT_AGREEMENT',
          ...(canViewAll ? {} : { memberId: session.user.id }),
        },
        orderBy: { createdAt: 'desc' },
        take: 250,
      })
      const agreements: any[] = []
      for (const row of agrRows) {
        try {
          agreements.push(JSON.parse(row.body))
        } catch {
          // ignore malformed
        }
      }
      result.agreements = agreements
    }

    if (
      (scope === 'all' || scope === 'bookings') &&
      (requireCapability(session.user, 'classes.book_member') ||
        requireCapability(session.user, 'leads.manage') ||
        requireCapability(session.user, 'classes.manage.all'))
    ) {
      const bkRows = await prisma.coachNote.findMany({
        where: { authorId: 'TRIAL_BOOKING' },
        orderBy: { createdAt: 'desc' },
        take: 300,
      })
      const bookings: any[] = []
      const deletedBookingIds: string[] = []
      for (const row of bkRows) {
        try {
          const parsed = JSON.parse(row.body)
          if (parsed?._deleted) {
            deletedBookingIds.push(parsed.id || row.id)
          } else if (parsed?.id) {
            bookings.push(parsed)
          }
        } catch {
          // ignore malformed
        }
      }
      result.bookings = bookings
      result.deletedBookingIds = deletedBookingIds
    }

    if ((scope === 'all' || scope === 'sessions') && requireCapability(session.user, 'settings.manage')) {
      try {
        const dbSessions = await prisma.auth_sessions.findMany({
          where: {
            revoked_at: null,
            expires_at: { gt: new Date() },
          },
          orderBy: { last_active_at: 'desc' },
          take: 50,
        })
        result.sessions = dbSessions.map((s) => {
          const matchedUser = SEEDED_USERS.find((u) => u.id === s.user_id)
          const ua = s.user_agent || 'Web Client'
          const deviceType = /Mobile|Android|iPhone/i.test(ua)
            ? 'Mobile'
            : /iPad|Tablet/i.test(ua)
              ? 'Tablet'
              : 'Desktop'
          return {
            id: s.id,
            userId: s.user_id,
            userName: matchedUser?.name || s.user_id,
            userEmail: matchedUser?.email || '',
            userRole: s.role_slug,
            capabilities: ROLE_CAPS[s.role_slug] || [],
            clubId: CLUB_ID_POWAI,
            ipAddress: s.ip || '127.0.0.1',
            userAgent: ua,
            deviceType,
            location: 'Mumbai, IN',
            branchName: 'Powai Flagship',
            lastActiveAt: s.last_active_at.toISOString(),
            isCurrent: s.user_id === session.user.id,
          }
        })
      } catch {
        // fallback if auth_sessions table unavailable in local test env
      }
    }

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { session } = await getServerSession(req)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { action } = body

    if (action === 'SAVE_CONFIG') {
      const { key, payload } = body
      if (!key) return NextResponse.json({ error: 'Missing config key' }, { status: 400 })

      if (key === 'products') {
        if (!requireCapability(session.user, 'pricing.manage')) {
          return NextResponse.json({ error: 'Forbidden: pricing.manage required' }, { status: 403 })
        }
      } else if (key === 'roles') {
        if (!requireCapability(session.user, 'roles.assign')) {
          return NextResponse.json({ error: 'Forbidden: roles.assign required' }, { status: 403 })
        }
      } else if (key.startsWith('fd_')) {
        if (!requireCapability(session.user, 'checkin.operate')) {
          return NextResponse.json({ error: 'Forbidden: checkin.operate required' }, { status: 403 })
        }
      } else {
        if (!requireCapability(session.user, 'settings.manage')) {
          return NextResponse.json({ error: 'Forbidden: settings.manage required' }, { status: 403 })
        }
      }

      const rowId = `cfg_${key}`
      const serialized = JSON.stringify(payload)
      await prisma.coachNote.upsert({
        where: { id: rowId },
        create: {
          id: rowId,
          authorId: 'CLUB_CONFIG',
          memberId: 'SYSTEM_CLUB',
          body: serialized,
        },
        update: {
          body: serialized,
        },
      })

      return NextResponse.json({ success: true, key })
    }

    if (action === 'UPSERT_AGREEMENT') {
      const { agreement } = body
      if (!agreement?.id) return NextResponse.json({ error: 'Missing agreement.id' }, { status: 400 })
      const canManage =
        requireCapability(session.user, 'members.view.all') ||
        (requireCapability(session.user, 'portal.access') && agreement.member_id === session.user.id)
      if (!canManage) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const serialized = JSON.stringify(agreement)
      await prisma.coachNote.upsert({
        where: { id: agreement.id },
        create: {
          id: agreement.id,
          authorId: 'CONSENT_AGREEMENT',
          memberId: agreement.member_id || 'MEMBER',
          body: serialized,
        },
        update: {
          body: serialized,
        },
      })

      return NextResponse.json({ success: true })
    }

    if (action === 'UPSERT_BOOKING') {
      const { booking } = body
      if (!booking?.id) return NextResponse.json({ error: 'Missing booking.id' }, { status: 400 })
      if (
        !requireCapability(session.user, 'classes.book_member') &&
        !requireCapability(session.user, 'leads.manage') &&
        !requireCapability(session.user, 'classes.manage.all')
      ) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const serialized = JSON.stringify(booking)
      await prisma.coachNote.upsert({
        where: { id: booking.id },
        create: {
          id: booking.id,
          authorId: 'TRIAL_BOOKING',
          memberId: booking.clientPhone || 'PROSPECT',
          body: serialized,
        },
        update: {
          body: serialized,
        },
      })

      return NextResponse.json({ success: true })
    }

    if (action === 'DELETE_BOOKING') {
      const { bookingId } = body
      if (!bookingId) return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 })
      if (
        !requireCapability(session.user, 'classes.book_member') &&
        !requireCapability(session.user, 'leads.manage') &&
        !requireCapability(session.user, 'classes.manage.all')
      ) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const tombstone = JSON.stringify({
        id: bookingId,
        _deleted: true,
        deletedAt: new Date().toISOString(),
        deletedBy: session.user.id,
      })
      await prisma.coachNote.upsert({
        where: { id: bookingId },
        create: {
          id: bookingId,
          authorId: 'TRIAL_BOOKING',
          memberId: 'TOMBSTONE',
          body: tombstone,
        },
        update: {
          memberId: 'TOMBSTONE',
          body: tombstone,
        },
      })

      return NextResponse.json({ success: true })
    }

    if (action === 'LOG_ACCESS') {
      if (
        !requireCapability(session.user, 'checkin.operate') &&
        !requireCapability(session.user, 'checkin.view')
      ) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      const { entry } = body
      if (!entry?.id) return NextResponse.json({ error: 'Missing entry.id' }, { status: 400 })
      const serialized = JSON.stringify(entry)
      await prisma.coachNote.upsert({
        where: { id: entry.id },
        create: {
          id: entry.id,
          authorId: 'ACCESS_LOG',
          memberId: entry.memberId || 'TURNSTILE',
          body: serialized,
        },
        update: {
          body: serialized,
        },
      })
      return NextResponse.json({ success: true })
    }

    if (action === 'REVOKE_SESSION') {
      if (!requireCapability(session.user, 'settings.manage')) {
        return NextResponse.json({ error: 'Forbidden: settings.manage required' }, { status: 403 })
      }
      const { sessionId } = body
      if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })

      const nowIso = new Date().toISOString()
      memorySessions.forEach((memSess) => {
        if (memSess.id === sessionId) {
          memSess.revoked_at = nowIso
        }
      })

      try {
        await prisma.auth_sessions.updateMany({
          where: { id: sessionId },
          data: { revoked_at: new Date() },
        })
      } catch {
        // non-UUID seeded IDs or offline local test env
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Settings mutation failed' }, { status: 500 })
  }
}
