import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import {
  createServerSession,
  destroyServerSession,
  SESSION_COOKIE_NAME,
} from '@/lib/server-auth'
import {
  checkLockout,
  recordFailedAttempt,
  clearAttempts,
} from '@/lib/rate-limit'
import { SEEDED_USERS, SEEDED_ROLE_DEFINITIONS, normaliseIndianPhone, getRoleDefaultRedirect } from '@/lib/auth'
import { getStoredMembers } from '@/lib/members'
import { logAuditEvent } from '@/lib/audit'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const GENERIC_INVALID_MSG = 'Invalid credentials. Check your email or phone and password.'

// Constant-work dummy hash to mitigate user enumeration timing attacks
const DUMMY_HASH = '$2b$12$e8YQj0kE3vY0NqT9QO7K5u5zWqE6Vq3o5e4Pz8l4K6f1v9Y8X2y8K'

function genericFailure(isLocked: boolean = false, remainingSeconds: number = 0) {
  if (isLocked) {
    const res = NextResponse.json(
      {
        error: 'Too many failed login attempts. Account temporarily locked for 15 minutes.',
        code: 'ACCOUNT_LOCKED',
        locked: true,
        remainingSeconds,
      },
      { status: 429 }
    )
    if (remainingSeconds > 0) {
      res.headers.set('Retry-After', String(remainingSeconds))
    }
    return res
  }
  return NextResponse.json(
    {
      error: GENERIC_INVALID_MSG,
      code: 'INVALID_CREDENTIALS',
    },
    { status: 401 }
  )
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const rawId = body.identifier || body.email || body.phone
    const { password } = body

    if (!rawId) {
      return NextResponse.json({ error: 'Identifier (email or phone) is required.' }, { status: 400 })
    }

    const identifier = String(rawId).trim()
    const cleanId = identifier.toLowerCase().replace(/\s+/g, ' ')
    const cleanPhone = normaliseIndianPhone(identifier)

    // Extract client IP (strict gate prevents user lockout denial-of-service)
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1'

    // 1. Check rate limit lockout keyed on identifier and IP separately (§5)
    const lockout = await checkLockout(cleanId, clientIp)
    if (lockout.isLocked) {
      logAuditEvent({
        actor: { id: cleanId, name: 'Anonymous', email: cleanId, role: 'Unknown' },
        action: 'ACCOUNT_LOCKED',
        entity: 'Auth',
        entityId: cleanId,
        branchId: 'pow',
        ipAddress: clientIp,
        description: `Blocked login attempt on locked account/IP ${cleanId} / ${clientIp}. Lockout remaining: ${lockout.remainingSeconds}s.`,
      })

      return genericFailure(true, lockout.remainingSeconds)
    }

    // 2. Authentication Flow
    let authenticated = false
    let mustChangePassword = false
    let matchedUser: any = null

    // Step A: Attempt Supabase Auth first (for email + password in non-test runtime)
    if (process.env.NODE_ENV !== 'test' && password && cleanId.includes('@')) {
      try {
        const { data: sbData, error: sbError } = await supabase.auth.signInWithPassword({
          email: cleanId,
          password,
        })
        if (!sbError && sbData?.user) {
          const meta = sbData.user.user_metadata || {}
          const userRoleSlug = (meta.role || 'member').toLowerCase()
          const roleDef =
            SEEDED_ROLE_DEFINITIONS.find((r) => r.slug.toLowerCase() === userRoleSlug) ||
            SEEDED_ROLE_DEFINITIONS.find((r) => r.slug.toUpperCase() === userRoleSlug.toUpperCase()) ||
            SEEDED_ROLE_DEFINITIONS[0]

          mustChangePassword = Boolean(meta.must_change_password)

          matchedUser = {
            id: sbData.user.id,
            clubId: 'club_powai_01',
            type: userRoleSlug === 'member' ? 'MEMBER' : 'STAFF',
            name: meta.name || sbData.user.email?.split('@')[0] || 'User',
            email: sbData.user.email || cleanId,
            phone: meta.phone || '+919999900000',
            role: roleDef,
            designation: meta.roleName || roleDef.name,
            branchId: 'pow',
            branches: [SEEDED_USERS[0].branches[0]],
            status: 'active',
            can_view_revenue: userRoleSlug === 'owner_admin' || userRoleSlug === 'owner',
            requires_login: true,
            twoFactorRequired: false,
            must_change_password: mustChangePassword,
          }
          authenticated = true
        }
      } catch (e) {
        // Fallback to seeded directory
      }
    }

    // Step B: Check Staff (SEEDED_USERS) and Member Directory
    if (!authenticated) {
      // 1. Check Staff Directory by Full Name, Email, or Phone
      const STAFF_ALIASES: Record<string, string> = {
        'jateen kadam': 'jateen gaonkar',
        'aditya shinde': 'aditya sarmalkar',
        'vaibhav pawar': 'vaibhav gawade',
        'hussain shaikh': 'mohd hussain ansari',
        'nisha jadhav': 'nisha yadav',
        'liladhar gaikwad': 'liladhar kahiram mestry',
        'suresh patil': 'suresh jivanvar',
        'pallavi': 'pallavi more',
      }
      const resolvedStaffQuery = STAFF_ALIASES[cleanId] || cleanId

      matchedUser = SEEDED_USERS.find((u) => {
        const uName = (u.name || '').toLowerCase().replace(/\s+/g, ' ').trim()
        const uEmail = (u.email || '').toLowerCase().trim()
        const uPhone = (u.phone || '').trim()
        return (
          uName === cleanId ||
          uName === resolvedStaffQuery ||
          uEmail === cleanId ||
          uPhone === cleanPhone ||
          uPhone === identifier
        )
      })

      // 2. Check Member Directory by Full Name, Email, Phone, or Member Code
      if (!matchedUser) {
        try {
          const members = getStoredMembers()
          const found = members.find((m: any) => {
            const mName = (m.name || '').toLowerCase().replace(/\s+/g, ' ').trim()
            const mEmail = (m.email || '').toLowerCase().trim()
            const mPhone = (m.phone || '').trim()
            const mCode = (m.member_code || '').toLowerCase().trim()
            return (
              mName === cleanId ||
              mEmail === cleanId ||
              mPhone === cleanPhone ||
              mPhone === identifier ||
              mCode === cleanId
            )
          })

          if (found) {
            const memberRole =
              SEEDED_ROLE_DEFINITIONS.find((r) => r.slug.toLowerCase() === 'member') ||
              SEEDED_ROLE_DEFINITIONS[SEEDED_ROLE_DEFINITIONS.length - 1]

            matchedUser = {
              id: found.id,
              clubId: 'club_powai_01',
              type: 'MEMBER',
              name: found.name,
              email: found.email || `${found.id}@dna360.in`,
              phone: found.phone,
              role: memberRole,
              designation: 'Member',
              branchId: 'pow',
              branches: [SEEDED_USERS[0].branches[0]],
              status: found.status === 'blacklisted' ? 'inactive' : 'active',
              membershipStatus:
                found.status === 'inactive'
                  ? 'EXPIRED'
                  : found.status === 'grace_period'
                  ? 'GRACE_PERIOD'
                  : 'ACTIVE',
              can_view_revenue: false,
              requires_login: true,
              passwordHash: (found as any).passwordHash,
              must_change_password: Boolean((found as any).must_change_password),
            }
          }
        } catch (e) {}
      }

      // 3. Exactly one password verification check: bcrypt against hashed password
      if (!matchedUser?.passwordHash) {
        // Timing mitigation: execute dummy bcrypt work factor
        await bcrypt.compare(password || '', DUMMY_HASH).catch(() => false)
        const lock = await recordFailedAttempt(cleanId, clientIp)
        const lockoutStatus = await checkLockout(cleanId, clientIp)
        logAuditEvent({
          actor: { id: cleanId, name: 'Anonymous', email: cleanId, role: 'Unknown' },
          action: lock.isLocked ? 'ACCOUNT_LOCKED' : 'LOGIN_FAILED',
          entity: 'Auth',
          entityId: cleanId,
          branchId: 'pow',
          ipAddress: clientIp,
          description: lock.isLocked
            ? `Account/IP locked for identifier ${cleanId} from ${clientIp} after 5 consecutive failed attempts.`
            : `Failed login attempt for identifier ${cleanId} from ${clientIp}.`,
        })
        return genericFailure(lock.isLocked, lockoutStatus.remainingSeconds)
      }

      const ok = await bcrypt.compare(password || '', matchedUser.passwordHash)
      if (!ok) {
        const lock = await recordFailedAttempt(cleanId, clientIp)
        const lockoutStatus = await checkLockout(cleanId, clientIp)
        logAuditEvent({
          actor: { id: cleanId, name: 'Anonymous', email: cleanId, role: 'Unknown' },
          action: lock.isLocked ? 'ACCOUNT_LOCKED' : 'LOGIN_FAILED',
          entity: 'Auth',
          entityId: cleanId,
          branchId: 'pow',
          ipAddress: clientIp,
          description: lock.isLocked
            ? `Account/IP locked for identifier ${cleanId} from ${clientIp} after 5 consecutive failed attempts.`
            : `Failed login attempt for identifier ${cleanId} from ${clientIp}.`,
        })
        return genericFailure(lock.isLocked, lockoutStatus.remainingSeconds)
      }

      authenticated = true
      mustChangePassword = Boolean(matchedUser.must_change_password)
    }

    if (!authenticated || !matchedUser) {
      return genericFailure()
    }

    if (matchedUser.status !== 'active') {
      return NextResponse.json({ error: 'Your account is deactivated.' }, { status: 403 })
    }

    // Reset failed login tracker on success for both identifier and IP (§5)
    await clearAttempts(cleanId, clientIp)

    // 2.6 Session Rotation: Revoke any existing session cookie before issuing the new one
    const existingCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value
    if (existingCookie) {
      destroyServerSession(existingCookie)
    }

    // 4. Create Server Session Token
    const token = createServerSession(matchedUser, 'tenant_powai')
    const redirectUrl = getRoleDefaultRedirect(matchedUser.role.slug, matchedUser)

    logAuditEvent({
      actor: {
        id: matchedUser.id,
        name: matchedUser.name,
        email: matchedUser.email || matchedUser.phone,
        role: matchedUser.role.name,
      },
      action: 'LOGIN',
      entity: 'Auth',
      entityId: matchedUser.id,
      branchId: matchedUser.branchId,
      branchName: matchedUser.branches[0]?.name,
      description: `${matchedUser.name} (${matchedUser.role.name}) logged in successfully.${
        mustChangePassword ? ' Mandatory first-login password change required.' : ''
      }`,
    })

    const sanitizedUser = {
      id: matchedUser.id,
      name: matchedUser.name,
      email: matchedUser.email,
      phone: matchedUser.phone,
      type: matchedUser.type,
      role: matchedUser.role,
      branchId: matchedUser.branchId,
      can_view_revenue: matchedUser.can_view_revenue,
      must_change_password: mustChangePassword,
    }

    const response = NextResponse.json({
      success: true,
      user: sanitizedUser,
      must_change_password: mustChangePassword,
      redirectUrl: mustChangePassword ? '/change-password' : redirectUrl,
    })

    // Set secure HttpOnly cookie
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 12 * 60 * 60, // 12 hours
    })

    return response
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal login error' }, { status: 500 })
  }
}
