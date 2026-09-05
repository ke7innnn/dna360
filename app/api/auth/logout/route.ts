import { NextRequest, NextResponse } from 'next/server'
import { destroyServerSession, getServerSession, SESSION_COOKIE_NAME } from '@/lib/server-auth'
import { logAuditEvent } from '@/lib/audit'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { session } = getServerSession(req)
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value

    if (token) {
      destroyServerSession(token)
    }

    if (session?.user) {
      logAuditEvent({
        actor: { id: session.user.id, name: session.user.name, email: session.user.email || '', role: session.user.role.name },
        action: 'LOGOUT',
        entity: 'Auth',
        entityId: session.user.id,
        branchId: session.user.branchId,
        description: `${session.user.name} logged out. Session destroyed.`,
      })
    }

    const response = NextResponse.json({ success: true, message: 'Logged out successfully' })

    // Destroy cookie
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })

    return response
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Logout failed' }, { status: 500 })
  }
}
