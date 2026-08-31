import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/server-auth'

export async function GET(req: NextRequest) {
  try {
    const { session, error } = getServerSession(req)

    if (!session || !session.user) {
      return NextResponse.json(
        { authenticated: false, error: error || 'No active session' },
        { status: 401 }
      )
    }

    const user = session.user
    const sanitizedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      type: user.type,
      role: user.role,
      branchId: user.branchId,
      branches: user.branches,
      can_view_revenue: user.can_view_revenue,
      membershipStatus: user.membershipStatus,
    }

    return NextResponse.json({
      authenticated: true,
      user: sanitizedUser,
      tenantId: session.tenantId,
      expiresAt: session.expiresAt,
    })
  } catch (err: any) {
    return NextResponse.json({ authenticated: false, error: err.message }, { status: 500 })
  }
}
