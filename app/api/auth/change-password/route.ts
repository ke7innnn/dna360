import { NextRequest, NextResponse } from 'next/server'
import {
  getServerSession,
  createServerSession,
  validatePasswordComplexity,
  SESSION_COOKIE_NAME,
} from '@/lib/server-auth'
import { SEEDED_USERS, getRoleDefaultRedirect } from '@/lib/auth'
import { logAuditEvent } from '@/lib/audit'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { session, error: sessionErr } = getServerSession(req)
    if (!session || !session.user) {
      return NextResponse.json(
        { error: sessionErr || 'Unauthorized: Active session required to change password.' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { newPassword, confirmPassword } = body

    if (!newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'Both new password and confirm password are required.' },
        { status: 400 }
      )
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'New password and confirmation password do not match.' },
        { status: 400 }
      )
    }

    // Enforce password complexity rules (§1)
    const complexity = validatePasswordComplexity(newPassword)
    if (!complexity.valid) {
      return NextResponse.json({ error: complexity.error }, { status: 400 })
    }

    const user = session.user

    // 1. Update in Supabase Auth if admin client is available
    const supabaseAdmin = getSupabaseAdmin()
    if (supabaseAdmin && user.email) {
      try {
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
          password: newPassword,
          user_metadata: {
            must_change_password: false,
          },
        })
      } catch (err: any) {
        console.warn('Supabase password update notice:', err.message)
      }
    }

    // 2. Update user in local seeded / in-memory store
    const localUser = SEEDED_USERS.find((u) => u.id === user.id)
    if (localUser) {
      localUser.passwordHash = newPassword
      localUser.must_change_password = false
    }

    // 3. Clear flag on user session object
    user.must_change_password = false
    user.passwordHash = newPassword

    // 4. Create new clean session token
    const newToken = createServerSession(user, session.tenantId)
    const redirectUrl = getRoleDefaultRedirect(user)

    // 5. Audit Log
    logAuditEvent({
      actor: { id: user.id, name: user.name, email: user.email || user.phone, role: user.role.name },
      action: 'PASSWORD_CHANGED',
      entity: 'Auth',
      entityId: user.id,
      branchId: user.branchId,
      description: `User ${user.name} (${user.role.name}) successfully updated their password and cleared must_change_password flag.`,
    })

    const response = NextResponse.json({
      success: true,
      message: 'Password updated successfully.',
      redirectUrl,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        must_change_password: false,
      },
    })

    // Set updated cookie
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: newToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 12 * 60 * 60,
    })

    return response
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update password' }, { status: 500 })
  }
}
