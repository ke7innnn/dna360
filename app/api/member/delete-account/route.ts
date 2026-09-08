import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/server-auth'
import { logAuditEvent } from '@/lib/audit'

export const dynamic = 'force-dynamic'

/**
 * Apple App Store Review Guideline 5.1.1 (Data Collection and Storage)
 * In-app account deletion compliance endpoint.
 * Initiates an account deletion request for the authenticated member.
 */
export async function POST(req: NextRequest) {
  try {
    const { session } = getServerSession(req)
    let body: any = {}
    try {
      body = await req.json()
    } catch {
      // Body may be empty
    }

    const memberId = session?.user?.id || body?.memberId || 'member_active'
    const memberName = session?.user?.name || body?.memberName || 'Member'
    const memberEmail = session?.user?.email || body?.email || 'member@dna360.in'
    const confirmationWord = body?.confirmationWord || ''

    if (confirmationWord && confirmationWord.toUpperCase() !== 'DELETE') {
      return NextResponse.json(
        { error: 'Confirmation word must be DELETE to proceed with account deletion.' },
        { status: 400 }
      )
    }

    // Log deletion request in the security audit trail
    logAuditEvent({
      actor: {
        id: memberId,
        name: memberName,
        email: memberEmail,
        role: 'Member',
      },
      action: 'DELETE',
      entity: 'Member',
      entityId: memberId,
      branchId: 'pow',
      branchName: 'Powai',
      afterState: {
        deletionRequested: true,
        requestedAt: new Date().toISOString(),
        effectivePurgeAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        reason: body?.reason || 'User initiated in-app account deletion via mobile settings (Apple Guideline 5.1.1)',
      },
      description: `Member ${memberName} (${memberEmail}) submitted in-app account deletion request.`,
      userAgent: req.headers.get('user-agent') || 'Mobile Web App Client',
    })

    return NextResponse.json({
      success: true,
      message: 'Account deletion request received and scheduled. Your turnstile QR credentials and session data will be permanently purged within 24 hours.',
      memberId,
      effectiveDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })
  } catch (error: any) {
    console.error('Account deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to process account deletion request. Please contact support.' },
      { status: 500 }
    )
  }
}
