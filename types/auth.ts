/* ============================================================
   DNA 360 — Auth & Staff Types
   
   34 staff on record with 12 real designations.
   6 historical inactive staff for attribution.
   ============================================================ */

import type { Capability } from '@/config/permissions'
import type { Branch, StaffDesignation } from '@/types'

export type RoleSlug = 'owner' | 'manager' | 'sales' | 'trainer' | 'front_desk' | 'staff_no_login' | 'member' | string

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
 * AuthUser — staff member who can log into the system.
 * 
 * Key additions:
 * - designation: the real org chart title
 * - can_view_revenue: first-class per-user permission
 *   (currently on HR Head, Marketing Head, Asst Sales Head)
 * - pt_tier: which PT tier this trainer can deliver (PENDING)
 * - is_active: false for historical staff (6 ex-sales reps)
 */
export interface AuthUser {
  id: string
  name: string
  email: string
  phone: string
  avatar?: string
  role: RoleDefinition
  /** The real designation from the org chart */
  designation: StaffDesignation
  branchId: string
  branches: Branch[]
  status: 'active' | 'suspended' | 'invited' | 'inactive'
  lastLoginAt?: string
  /**
   * First-class per-user permission for revenue visibility.
   * They already think in terms of who can see money.
   * Currently on: HR Head, Marketing Head, Asst Sales Head, Owner.
   */
  can_view_revenue: boolean
  /**
   * PT tier this trainer can deliver.
   * PENDING — products are tiered Premium/Elite/Super Elite
   * but staff records only distinguish Head/General Trainer.
   * Blocks booking validation and commission.
   */
  pt_tier: 'premium' | 'elite' | 'super_elite' | null
  /** Whether this staff member needs app login (vs attendance-only) */
  requires_login: boolean
}

export interface UserSession {
  id: string
  userId: string
  userName: string
  userEmail?: string
  userRole: string
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
  | 'LOGIN'
  | 'LOGOUT'
  | 'REVOKE_SESSION'
  | 'OVERRIDE'
  | 'EXPORT'
  | 'VOID'
  | 'TRANSFER'
  | 'DISCOUNT_OVERRIDE'
  | 'CHECKIN_OVERRIDE'
  | 'FREEZE_OVERRIDE'
  | 'ROLE_CHANGE'
  | 'PERMISSION_GRANT'
  | 'PERMISSION_REVOKE'

export interface AuditActor {
  id: string
  name: string
  email: string
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
