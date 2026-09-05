/* ============================================================
   DNA 360 — Auth & Staff Types (RBAC)
   Single-club v1 · Powai

   Underneath, everyone resolves to User -> Role -> Capabilities.
   Capabilities are the atom; roles are named bundles of them.
   ============================================================ */

import type { Capability } from '@/config/permissions'
import type { Branch, StaffDesignation } from '@/types'

export type UserType = 'STAFF' | 'MEMBER'
export type MembershipStatus = 'ACTIVE' | 'FROZEN' | 'EXPIRED' | 'GRACE_PERIOD'

export type RoleSlug =
  | 'owner_admin'
  | 'hr_head'
  | 'sales_head'
  | 'sales_consultant'
  | 'front_desk'
  | 'supervisor'
  | 'head_trainer'
  | 'general_trainer'
  | 'masseur'
  | 'member'
  // Uppercase and legacy aliases for backward compatibility
  | 'OWNER'
  | 'HR_HEAD'
  | 'MARKETING_HEAD'
  | 'SALES_HEAD'
  | 'HEAD_TRAINER'
  | 'TRAINER'
  | 'FITNESS_CONSULTANT'
  | 'MASSEUR'
  | 'SUPERVISOR'
  | 'EMPLOYEE'
  | 'MEMBER'
  | 'owner'
  | 'marketing_head'
  | 'trainer'
  | 'fitness_consultant'
  | 'employee'
  | 'manager'
  | 'sales'
  | 'staff_no_login'

export interface RoleDefinition {
  id: string
  name: string
  slug: RoleSlug
  description: string
  capabilities: Capability[]
  isSystem: boolean
  createdAt: string
  updatedAt?: string
}

/**
 * AuthUser — verified user identity on the server & client.
 */
export interface AuthUser {
  id: string
  clubId: string // Single-club v1 seam: "club_powai"
  type: UserType
  name: string
  email?: string | null
  phone: string
  avatar?: string
  role: RoleDefinition
  /** The real designation from the org chart */
  designation?: StaffDesignation | string
  branchId: string
  branches: Branch[]
  status: 'active' | 'suspended' | 'invited' | 'inactive'
  membershipStatus?: MembershipStatus // For members (ACTIVE | FROZEN | EXPIRED)
  lastLoginAt?: string
  /**
   * First-class revenue visibility flag.
   * True ONLY for: Owner, HR Head, Marketing Head, Sales Head.
   */
  can_view_revenue: boolean
  /** 2FA requirement flag (Enforced for Owner + 3 revenue heads) */
  twoFactorEnabled?: boolean
  twoFactorRequired?: boolean
  /** Assigned trainer clients (for Trainer / Masseur scoping) */
  assignedClientIds?: string[]
  /** Whether this staff member needs app login */
  requires_login: boolean
  passwordHash?: string
  /** Mandatory first-login password change flag */
  must_change_password?: boolean
}

export interface UserSession {
  id: string
  userId: string
  userName: string
  userEmail?: string
  userRole: string
  capabilities: Capability[]
  clubId: string
  membershipStatus?: MembershipStatus
  ipAddress: string
  userAgent: string
  deviceType: 'Desktop' | 'Mobile' | 'Tablet'
  location: string
  branchName?: string
  lastActiveAt: string
  createdAt?: string
  isCurrent: boolean
}

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'VIEW'
  | 'LOGIN'
  | 'LOGOUT'
  | 'REVOKE_SESSION'
  | 'OVERRIDE'
  | 'EXPORT'
  | 'VOID'
  | 'TRANSFER'
  | 'REVENUE_VIEW'
  | 'DISCOUNT_OVERRIDE'
  | 'CHECKIN_OVERRIDE'
  | 'FREEZE_OVERRIDE'
  | 'ROLE_CHANGE'
  | 'PERMISSION_GRANT'
  | 'PERMISSION_REVOKE'
  | 'VIEW_AS_MEMBER'
  | 'MEMBER_PHONE_REVEAL'
  | 'STATUS_CHANGE'
  | 'SEND_WHATSAPP'
  | 'PT_SESSION_SIGNOFF'
  | 'TURNSTILE_SCAN'
  | 'ACCOUNT_LOCKED'
  | 'LOGIN_FAILED'
  | 'PASSWORD_CHANGED'

export interface AuditActor {
  id: string
  name: string
  email?: string
  role: string
}

export interface AuditEvent {
  id: string
  timestamp: string // ISO UTC
  actor: AuditActor
  action: AuditAction
  entity: string
  entityId: string
  branchId: string
  branchName?: string
  beforeState?: unknown
  afterState?: unknown
  description: string
  ipAddress?: string
  userAgent?: string
}

export type AuditLogEntry = AuditEvent
export type StaffRole = RoleSlug

export interface RoleCapabilityMap {
  role: StaffRole
  capabilities: Capability[]
}

export interface CapabilityGroup {
  id: string
  name: string
  description: string
  capabilities: {
    id: Capability
    name: string
    description: string
  }[]
}
