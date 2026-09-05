import { NextRequest, NextResponse } from 'next/server'
import {
  createServerSession,
  checkLoginLockout,
  recordFailedLogin,
  resetLoginAttempts,
  SESSION_COOKIE_NAME,
} from '@/lib/server-auth'
import { SEEDED_USERS, SEEDED_ROLE_DEFINITIONS, normaliseIndianPhone, getRoleDefaultRedirect } from '@/lib/auth'
import { getStoredMembers } from '@/lib/members'
import { logAuditEvent } from '@/lib/audit'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const GENERIC_INVALID_MSG = 'Invalid credentials. Check your email or phone and password.'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const rawId = body.identifier || body.email || body.phone
    const { password, otp } = body

    if (!rawId) {
      return NextResponse.json({ error: 'Identifier (email or phone) is required.' }, { status: 400 })
    }

    const identifier = String(rawId).trim()
    const cleanId = identifier.toLowerCase()
    const cleanPhone = normaliseIndianPhone(identifier)

    // 1. Check rate limit lockout (5 consecutive failed attempts -> 15-minute lock)
    const lockout = checkLoginLockout(cleanId)
    if (lockout.isLocked) {
      logAuditEvent({
        actor: { id: cleanId, name: 'Anonymous', email: cleanId, role: 'Unknown' },
        action: 'ACCOUNT_LOCKED',
        entity: 'Auth',
        entityId: cleanId,
        branchId: 'pow',
        description: `Blocked login attempt on locked account ${cleanId}. Lockout remaining: ${lockout.remainingSeconds}s.`,
      })

      return NextResponse.json(
        {
          error: `Too many failed login attempts. Account temporarily locked for 15 minutes.`,
          code: 'ACCOUNT_LOCKED',
          locked: true,
          remainingSeconds: lockout.remainingSeconds,
        },
        { status: 429 }
      )
    }

    // 2. Authentication Flow
    let authenticated = false
    let mustChangePassword = false
    let matchedUser: any = null

    // Step A: Attempt Supabase Auth first (for email + password)
    if (password && cleanId.includes('@')) {
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

          mustChangePassword = meta.must_change_password === true

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
        // Fallback to local authentication check
      }
    }

    // Step B: If not authenticated by Supabase Auth, check SEEDED_USERS or Member Directory
    if (!authenticated) {
      matchedUser = SEEDED_USERS.find(
        (u) =>
          u.email?.toLowerCase() === cleanId ||
          u.phone === cleanPhone ||
          u.phone === identifier.trim()
      )

      if (!matchedUser) {
        try {
          const members = getStoredMembers()
          const found = members.find(
            (m: any) =>
              m.email?.toLowerCase() === cleanId ||
              m.phone === cleanPhone ||
              m.phone === identifier.trim() ||
              m.member_code?.toLowerCase() === cleanId
          )
          if (found) {
            const memberRole =
              SEEDED_ROLE_DEFINITIONS.find((r) => r.slug === 'member') ||
              SEEDED_ROLE_DEFINITIONS.find((r) => r.slug === 'MEMBER')!
            matchedUser = {
              id: found.id,
              clubId: 'club_powai_01',
              type: 'MEMBER',
              name: found.name,
              email: found.email || `${found.id}@dna360.in`,
              phone: found.phone,
              role: memberRole,
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
              must_change_password: (found as any).must_change_password ?? false,
            }
          }
        } catch (e) {}
      }

      // If matchedUser found in local store, verify password against passwordHash
      if (matchedUser && password && matchedUser.passwordHash) {
        if (matchedUser.passwordHash === password) {
          authenticated = true
          mustChangePassword = matchedUser.must_change_password === true
        }
      }
    }

    // If authentication failed
    if (!authenticated) {
      const lockResult = recordFailedLogin(cleanId)

      logAuditEvent({
        actor: { id: cleanId, name: 'Anonymous', email: cleanId, role: 'Unknown' },
        action: lockResult.isLocked ? 'ACCOUNT_LOCKED' : 'LOGIN_FAILED',
        entity: 'Auth',
        entityId: cleanId,
        branchId: 'pow',
        description: lockResult.isLocked
          ? `Account locked for identifier ${cleanId} after 5 consecutive failed attempts.`
          : `Failed login attempt for identifier ${cleanId}.`,
      })

      return NextResponse.json(
        {
          error: lockResult.isLocked
            ? 'Account temporarily locked due to consecutive failed attempts. Please try again in 15 minutes.'
            : GENERIC_INVALID_MSG,
          code: lockResult.isLocked ? 'ACCOUNT_LOCKED' : 'INVALID_CREDENTIALS',
          locked: lockResult.isLocked,
        },
        { status: lockResult.isLocked ? 429 : 401 }
      )
    }

    if (!matchedUser) {
      return NextResponse.json({ error: GENERIC_INVALID_MSG }, { status: 401 })
    }

    if (matchedUser.status !== 'active') {
      return NextResponse.json({ error: 'Your account is deactivated.' }, { status: 403 })
    }

    // Reset failed login tracker on success
    resetLoginAttempts(cleanId)

    // 4. Create Server Session Token
    const token = createServerSession(matchedUser, 'tenant_powai')
    const redirectUrl = getRoleDefaultRedirect(matchedUser)

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
