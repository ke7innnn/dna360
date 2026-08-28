/* ============================================================
   DNA 360 — Shared Types
   
   Single location: Hiranandani Gardens, Powai, Mumbai
   Legal entity: Base Fitness Private Limited
   ============================================================ */

/**
 * Staff designations — the 12 real titles from the org chart.
 * These are NOT generic roles; they map to actual job titles at DNA 360.
 * 
 * Login-required: hr_head, marketing_head, asst_sales_head,
 *   fitness_consultant, head_trainer, general_trainer, masseur, supervisor
 * Attendance-only: chef, housekeeping, valet, dj
 */
export type StaffDesignation =
  | 'hr_head'
  | 'marketing_head'
  | 'asst_sales_head'
  | 'fitness_consultant'
  | 'head_trainer'
  | 'general_trainer'
  | 'masseur'
  | 'supervisor'
  | 'chef'
  | 'housekeeping'
  | 'valet'
  | 'dj'

/** System role for permission grouping (maps designations to capability sets) */
export type RoleName = 'owner' | 'manager' | 'sales' | 'trainer' | 'front_desk' | 'staff_no_login' | 'member'

/** Designation → Role mapping */
export const DESIGNATION_ROLE_MAP: Record<StaffDesignation, RoleName> = {
  hr_head: 'manager',
  marketing_head: 'manager',
  asst_sales_head: 'manager',
  fitness_consultant: 'sales',
  head_trainer: 'trainer',
  general_trainer: 'trainer',
  masseur: 'front_desk',
  supervisor: 'front_desk',
  chef: 'staff_no_login',
  housekeeping: 'staff_no_login',
  valet: 'staff_no_login',
  dj: 'staff_no_login',
}

/** Designations that require app login */
export const LOGIN_REQUIRED_DESIGNATIONS: StaffDesignation[] = [
  'hr_head', 'marketing_head', 'asst_sales_head', 'fitness_consultant',
  'head_trainer', 'general_trainer', 'masseur', 'supervisor',
]

/** Designations that are attendance-only (no app login) */
export const ATTENDANCE_ONLY_DESIGNATIONS: StaffDesignation[] = [
  'chef', 'housekeeping', 'valet', 'dj',
]

/** Human-readable designation labels */
export const DESIGNATION_LABELS: Record<StaffDesignation, string> = {
  hr_head: 'HR Head',
  marketing_head: 'Marketing Head',
  asst_sales_head: 'Asst. Sales Head',
  fitness_consultant: 'Fitness Consultant',
  head_trainer: 'Head Trainer',
  general_trainer: 'General Trainer',
  masseur: 'Masseur',
  supervisor: 'Supervisor',
  chef: 'Chef',
  housekeeping: 'Housekeeping',
  valet: 'Valet',
  dj: 'DJ',
}

export interface Role {
  id: string
  name: string
  slug: RoleName
  capabilities: string[]
  isSystem: boolean
}

/** Branch / location — single location for now */
export interface Branch {
  id: string
  name: string
  code: string // "POW"
  address: string
  timezone: string // "Asia/Kolkata"
  phone: string
  isActive: boolean
}

/** Navigation item */
export interface NavItem {
  id: string
  label: string
  icon: string // lucide icon name
  href: string
  badge?: number
  children?: NavItem[]
  requiredCapability?: string
}

/** Navigation group */
export interface NavGroup {
  label?: string
  items: NavItem[]
}

/** User session */
export interface User {
  id: string
  name: string
  email: string
  phone: string
  avatar?: string
  role: Role
  branchId: string
  branches: Branch[]
}

/** Table column definition */
export interface ColumnDef<T> {
  id: string
  header: string
  accessorKey?: keyof T
  accessorFn?: (row: T) => unknown
  cell?: (value: unknown, row: T) => React.ReactNode
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
}

/** Pagination */
export interface PaginationState {
  page: number
  pageSize: number
  total: number
}

/** Sort state */
export interface SortState {
  column: string
  direction: 'asc' | 'desc'
}

/** Status for async operations */
export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error'

/** Semantic status */
export type SemanticStatus = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

/** Currency amount — always in paise */
export type Paise = number & { readonly __brand: 'paise' }

/** Helper to create Paise */
export function asPaise(value: number): Paise {
  return Math.round(value) as Paise
}

/** GST rate as a branded type for type safety */
export type GstRate = number & { readonly __brand: 'gst_rate' }

/** Helper to create GstRate (e.g. 0.05 for 5%, 0.18 for 18%) */
export function asGstRate(value: number): GstRate {
  return value as GstRate
}

/** Financial year string, e.g. "2026-27" */
export function getFinancialYear(date: Date = new Date()): string {
  const month = date.getMonth() // 0-indexed
  const year = date.getFullYear()
  if (month >= 3) { // April onwards
    return `${year}-${String(year + 1).slice(2)}`
  }
  return `${year - 1}-${String(year).slice(2)}`
}
