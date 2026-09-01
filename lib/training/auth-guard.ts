/* ============================================================
   DNA 360 — Training Authorization & Security Guard (§1)
   Enforces strict session identity, trainer access barriers,
   short-lived signed media URLs, and audit logging.
   ============================================================ */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getServerSession } from '@/lib/server-auth'
import type { AuthUser } from '@/types/auth'
import { getMemberPrograms } from './db'
import { logAuditEvent } from '@/lib/audit'

const SIGNED_MEDIA_SECRET = process.env.MEDIA_SECRET || 'dna360_secure_media_vault_powai_2026'

/**
 * Validates session identity from request cookies or bearer header.
 * Rejects unauthenticated requests with HTTP 401.
 */
export function validateTrainingSession(req: NextRequest): {
  ok: boolean
  user?: AuthUser
  response?: NextResponse
} {
  const { session, error } = getServerSession(req)
  if (!session || !session.user) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: error || 'Unauthorized: Valid session required for training data.',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      ),
    }
  }
  return { ok: true, user: session.user }
}

/**
 * Enforces §1 Rule 2: A self-coached member's training data is INVISIBLE to trainers.
 * Access requires an active assignment row.
 */
export function canAccessMemberTraining(
  user: AuthUser,
  targetMemberId: string
): { allowed: boolean; reason?: string } {
  // 1. Member accessing own data
  if (user.type === 'MEMBER' || user.role?.slug.toUpperCase() === 'MEMBER') {
    if (user.id === targetMemberId) {
      return { allowed: true }
    }
    return { allowed: false, reason: 'Members cannot access other members’ workout data.' }
  }

  // 2. Owner has club-wide management oversight
  const roleSlug = user.role?.slug.toUpperCase()
  if (roleSlug === 'OWNER') {
    return { allowed: true }
  }

  // 3. Trainer / Coach access check: MUST have active assignment row
  if (roleSlug === 'TRAINER' || roleSlug === 'HEAD_TRAINER') {
    const memberPrograms = getMemberPrograms(targetMemberId)
    const hasActiveAssignment = memberPrograms.some(
      mp => mp.trainerId === user.id && mp.status === 'ACTIVE'
    )
    const isAssignedClient = user.assignedClientIds?.includes(targetMemberId) ?? false

    if (hasActiveAssignment || isAssignedClient) {
      return { allowed: true }
    }

    return {
      allowed: false,
      reason: 'Trainer isolation: Self-coached members and unassigned clients are invisible to trainers (§1 Rule 2).',
    }
  }

  return { allowed: false, reason: 'Insufficient role permissions for workout data.' }
}

/**
 * Resolves verified target member ID from session.
 * Never trust a client-supplied memberId without validating authorization.
 */
export function resolveAuthorizedMemberId(
  user: AuthUser,
  requestedMemberId?: string | null
): { memberId: string | null; errorResponse?: NextResponse } {
  // If user is a member, strictly force target to their own session user ID
  if (user.type === 'MEMBER' || user.role?.slug.toUpperCase() === 'MEMBER') {
    return { memberId: user.id }
  }

  // If user is staff/trainer and supplied a target ID, validate assignment
  if (requestedMemberId) {
    const access = canAccessMemberTraining(user, requestedMemberId)
    if (!access.allowed) {
      return {
        memberId: null,
        errorResponse: NextResponse.json(
          { error: access.reason || 'Forbidden: Access denied to this member’s data.', code: 'FORBIDDEN' },
          { status: 403 }
        ),
      }
    }
    return { memberId: requestedMemberId }
  }

  // Default to session user if no memberId requested
  return { memberId: user.id }
}

/**
 * §1 Rule 4: Short-lived signed URLs for progress photos and form checks.
 * Health-adjacent personal data under DPDP Act. Short-lived signed URLs only.
 */
export function generateSignedMediaUrl(
  mediaKey: string,
  authorizedUserId: string,
  expiresInSeconds: number = 300
): string {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds
  const payload = `${mediaKey}:${authorizedUserId}:${expiresAt}`
  const signature = crypto
    .createHmac('sha256', SIGNED_MEDIA_SECRET)
    .update(payload)
    .digest('hex')

  return `/api/training/media/view?key=${encodeURIComponent(mediaKey)}&exp=${expiresAt}&sig=${signature}`
}

/**
 * Validates short-lived signed media token
 */
export function verifySignedMediaToken(
  mediaKey: string,
  authorizedUserId: string,
  expiresAtStr: string,
  signature: string
): boolean {
  const expiresAt = parseInt(expiresAtStr, 10)
  if (isNaN(expiresAt) || Math.floor(Date.now() / 1000) > expiresAt) {
    return false // Expired
  }

  const payload = `${mediaKey}:${authorizedUserId}:${expiresAt}`
  const expectedSig = crypto
    .createHmac('sha256', SIGNED_MEDIA_SECRET)
    .update(payload)
    .digest('hex')

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))
}

/**
 * §1 Rule 6: Mandatory Audit Trail for sensitive training events
 */
export function auditTrainingEvent(
  actor: AuthUser,
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT',
  entity: 'PROGRAM' | 'MEMBER_PROGRAM' | 'PT_SESSION' | 'COACH_NOTE' | 'FORM_CHECK' | 'MEMBER_DATA',
  entityId: string,
  description: string,
  details?: Record<string, any>
) {
  logAuditEvent({
    actor: {
      id: actor.id,
      name: actor.name,
      email: actor.email || `${actor.id}@dna360.in`,
      role: actor.role?.slug || 'UNKNOWN',
    },
    action,
    entity,
    entityId,
    branchId: actor.branchId || 'pow',
    branchName: 'Powai',
    description,
    beforeState: details?.before,
    afterState: details?.after,
  })
}
