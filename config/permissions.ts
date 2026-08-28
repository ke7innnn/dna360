/* ============================================================
   DNA 360 — Permissions & Capabilities
   
   Mapped to the 12 real designations, not generic roles.
   
   Key design decisions:
   - Fitness Consultants = sales floor (sell + handle desk)
   - Asst Sales Head = approval authority
   - Revenue visibility is a first-class per-user permission
   - Trainer tier mapping is PENDING
   ============================================================ */

import type { RoleName } from '@/types'

export const ALL_CAPABILITIES = [
  // Members
  'members.view',
  'members.create',
  'members.edit',
  'members.delete',
  'members.merge',
  'members.bulk_actions',

  // Billing & Plans
  'billing.view',
  'billing.create_invoice',
  'billing.edit_plan',
  'billing.apply_discount',
  'billing.approve_discount', // Above ceiling — requires Asst Sales Head
  'billing.void_invoice',     // Void/credit-note, manager-restricted
  'billing.credit_note',

  // Products
  'products.view',
  'products.create',
  'products.edit',

  // Classes & Booking
  'classes.view',
  'classes.create',
  'classes.edit',
  'classes.cancel',
  'classes.manage_bookings',

  // Attendance & Check-in
  'attendance.view',
  'attendance.check_in',
  'attendance.manual_check_in',
  'attendance.override',

  // Staff
  'staff.view',
  'staff.create',
  'staff.edit',
  'staff.manage_shifts',
  'staff.manage_commissions',

  // Trainer-specific
  'trainer.clients',
  'trainer.schedule',
  'trainer.workout_plans',
  'trainer.diet_plans',
  'trainer.session_log',

  // Leads / CRM
  'leads.view',
  'leads.create',
  'leads.edit',
  'leads.assign',
  'leads.convert',

  // Analytics & Revenue
  'analytics.view',
  'analytics.export',
  'analytics.revenue',     // Revenue reports — gated by can_view_revenue per-user flag

  // Front Desk
  'front_desk.access',
  'front_desk.cash_drawer',
  'front_desk.day_pass',
  'front_desk.guest_entry',
  'front_desk.locker',

  // Consent & Documents
  'consent.view',
  'consent.manage_templates',
  'consent.sign',

  // Membership Lifecycle
  'membership.activate',
  'membership.upgrade',
  'membership.transfer',
  'membership.freeze_override', // Manager-only override with audit

  // Settings
  'settings.view',
  'settings.edit',
  'settings.roles',
  'settings.notifications',

  // Audit
  'audit.view',

  // System
  'system.force_logout',
  'system.manage_sessions',
  'system.migration',       // Import/export data
] as const

export type Capability = (typeof ALL_CAPABILITIES)[number]

/**
 * Role-based capability sets.
 * 
 * These map to the real org chart:
 * - owner: Full access (not a designation, but the business owner)
 * - manager: HR Head, Marketing Head, Asst Sales Head
 * - sales: Fitness Consultants (sell + handle desk)
 * - trainer: Head Trainer, General Trainer
 * - front_desk: Masseur, Supervisor
 * - staff_no_login: Chef, Housekeeping, Valet, DJ (attendance only)
 * - member: Self-service portal
 */
export const SEEDED_ROLES: Record<RoleName, Capability[]> = {
  owner: [...ALL_CAPABILITIES],

  manager: [
    'members.view', 'members.create', 'members.edit', 'members.merge', 'members.bulk_actions',
    'billing.view', 'billing.create_invoice', 'billing.edit_plan', 'billing.apply_discount',
    'billing.approve_discount', 'billing.void_invoice', 'billing.credit_note',
    'products.view', 'products.create', 'products.edit',
    'classes.view', 'classes.create', 'classes.edit', 'classes.cancel', 'classes.manage_bookings',
    'attendance.view', 'attendance.check_in', 'attendance.manual_check_in', 'attendance.override',
    'staff.view', 'staff.create', 'staff.edit', 'staff.manage_shifts', 'staff.manage_commissions',
    'leads.view', 'leads.create', 'leads.edit', 'leads.assign', 'leads.convert',
    'analytics.view', 'analytics.export', 'analytics.revenue',
    'front_desk.access', 'front_desk.cash_drawer', 'front_desk.day_pass',
    'front_desk.guest_entry', 'front_desk.locker',
    'consent.view', 'consent.manage_templates', 'consent.sign',
    'membership.activate', 'membership.upgrade', 'membership.transfer', 'membership.freeze_override',
    'settings.view', 'settings.edit',
    'audit.view',
  ],

  sales: [
    'members.view', 'members.create', 'members.edit',
    'billing.view', 'billing.create_invoice', 'billing.apply_discount',
    'products.view',
    'classes.view', 'classes.manage_bookings',
    'attendance.view', 'attendance.check_in', 'attendance.manual_check_in',
    'leads.view', 'leads.create', 'leads.edit', 'leads.assign', 'leads.convert',
    'front_desk.access', 'front_desk.cash_drawer', 'front_desk.day_pass',
    'front_desk.guest_entry', 'front_desk.locker',
    'consent.view', 'consent.sign',
    'membership.activate',
  ],

  trainer: [
    'members.view',
    'classes.view',
    'attendance.view', 'attendance.check_in',
    'trainer.clients', 'trainer.schedule', 'trainer.workout_plans',
    'trainer.diet_plans', 'trainer.session_log',
    'consent.view', 'consent.sign',
  ],

  front_desk: [
    'members.view', 'members.create', 'members.edit',
    'billing.view', 'billing.create_invoice',
    'products.view',
    'classes.view', 'classes.manage_bookings',
    'attendance.view', 'attendance.check_in', 'attendance.manual_check_in',
    'leads.view', 'leads.create', 'leads.edit',
    'front_desk.access', 'front_desk.cash_drawer', 'front_desk.day_pass',
    'front_desk.guest_entry', 'front_desk.locker',
    'consent.view',
  ],

  staff_no_login: [],

  member: [],
}

export const CAPABILITY_GROUPS = [
  {
    id: 'members',
    name: 'Members',
    description: 'Member directory, profiles, KYC, and bulk management',
    capabilities: [
      { id: 'members.view' as Capability, name: 'View Members', description: 'Browse directory and view member profiles' },
      { id: 'members.create' as Capability, name: 'Register Members', description: 'Complete onboarding and create records' },
      { id: 'members.edit' as Capability, name: 'Edit Profiles', description: 'Update contact, health, and emergency info' },
      { id: 'members.delete' as Capability, name: 'Soft Delete', description: 'Mark member profile as inactive (soft delete only)' },
      { id: 'members.merge' as Capability, name: 'Merge Records', description: 'Resolve duplicate member entries' },
      { id: 'members.bulk_actions' as Capability, name: 'Bulk Operations', description: 'Export and bulk status modification' },
    ],
  },
  {
    id: 'billing',
    name: 'Billing & Plans',
    description: 'Invoices, payments, discounts, and credit notes',
    capabilities: [
      { id: 'billing.view' as Capability, name: 'View Billing', description: 'Inspect ledger, invoices, and payment histories' },
      { id: 'billing.create_invoice' as Capability, name: 'Issue Invoices', description: 'Generate GST-compliant tax invoices (5% default)' },
      { id: 'billing.edit_plan' as Capability, name: 'Manage Plans', description: 'Create and modify plan pricing and durations' },
      { id: 'billing.apply_discount' as Capability, name: 'Apply Discounts', description: 'Apply discount within the configured ceiling' },
      { id: 'billing.approve_discount' as Capability, name: 'Approve Overrides', description: 'Authorize discounts exceeding the ceiling (Asst Sales Head)' },
      { id: 'billing.void_invoice' as Capability, name: 'Void Invoice', description: 'Void an invoice with mandatory reason (no refunds)' },
      { id: 'billing.credit_note' as Capability, name: 'Credit Notes', description: 'Issue GST credit notes for billing errors only' },
    ],
  },
  {
    id: 'products',
    name: 'Product Catalogue',
    description: 'Manage the 120+ product catalogue across 24 categories',
    capabilities: [
      { id: 'products.view' as Capability, name: 'View Products', description: 'Browse the product catalogue' },
      { id: 'products.create' as Capability, name: 'Create Products', description: 'Add new products to the catalogue' },
      { id: 'products.edit' as Capability, name: 'Edit Products', description: 'Modify pricing, sessions, and validity' },
    ],
  },
  {
    id: 'classes',
    name: 'Classes & Bookings',
    description: 'Timetables, class reservations, and Pilates studio',
    capabilities: [
      { id: 'classes.view' as Capability, name: 'View Timetable', description: 'Browse class schedule and availability' },
      { id: 'classes.create' as Capability, name: 'Schedule Classes', description: 'Create recurring schedule slots' },
      { id: 'classes.edit' as Capability, name: 'Modify Classes', description: 'Change instructor, capacity, or timings' },
      { id: 'classes.cancel' as Capability, name: 'Cancel Sessions', description: 'Cancel class and trigger member alerts' },
      { id: 'classes.manage_bookings' as Capability, name: 'Manage Bookings', description: 'Override waitlists and manual slot bookings' },
    ],
  },
  {
    id: 'attendance',
    name: 'Attendance & Check-in',
    description: 'QR scanner, access control, and Happy Hours enforcement',
    capabilities: [
      { id: 'attendance.view' as Capability, name: 'View History', description: 'Inspect check-in logs and access decisions' },
      { id: 'attendance.check_in' as Capability, name: 'Scan Check-ins', description: 'Process QR check-ins' },
      { id: 'attendance.manual_check_in' as Capability, name: 'Manual Override', description: 'Manually record check-in with reason' },
      { id: 'attendance.override' as Capability, name: 'Access Override', description: 'Grant entry to expired or blocked members (audit logged)' },
    ],
  },
  {
    id: 'staff',
    name: 'Staff Management',
    description: 'Staff rosters, commissions, and performance',
    capabilities: [
      { id: 'staff.view' as Capability, name: 'View Staff', description: 'Inspect employee directory and rosters' },
      { id: 'staff.create' as Capability, name: 'Onboard Staff', description: 'Add new employees and assign designations' },
      { id: 'staff.edit' as Capability, name: 'Edit Staff Records', description: 'Update employee details and credentials' },
      { id: 'staff.manage_shifts' as Capability, name: 'Manage Roster', description: 'Schedule shift timings and clock-in logs' },
      { id: 'staff.manage_commissions' as Capability, name: 'Sales Commissions', description: 'View and authorize commission statements' },
    ],
  },
  {
    id: 'trainer',
    name: 'Trainer Surface',
    description: 'Workout/diet plans, client rosters, and session logs',
    capabilities: [
      { id: 'trainer.clients' as Capability, name: 'Assigned Clients', description: 'View assigned personal training clients' },
      { id: 'trainer.schedule' as Capability, name: 'PT Calendar', description: 'Manage 1-on-1 personal training slots' },
      { id: 'trainer.workout_plans' as Capability, name: 'Workout Builder', description: 'Create and assign workout routines' },
      { id: 'trainer.diet_plans' as Capability, name: 'Diet Programming', description: 'Create and assign meal nutritional plans' },
      { id: 'trainer.session_log' as Capability, name: 'Session Sign-off', description: 'Log completed PT sessions with sign-off' },
    ],
  },
  {
    id: 'leads',
    name: 'Leads & CRM',
    description: 'Sales pipelines, inquiries, and follow-ups',
    capabilities: [
      { id: 'leads.view' as Capability, name: 'View Pipeline', description: 'Inspect leads, trials, and conversion stages' },
      { id: 'leads.create' as Capability, name: 'Add Inquiries', description: 'Record walk-in and phone inquiries' },
      { id: 'leads.edit' as Capability, name: 'Update Leads', description: 'Log call notes, trials, and follow-up tasks' },
      { id: 'leads.assign' as Capability, name: 'Assign Sales Rep', description: 'Assign leads to Fitness Consultants' },
      { id: 'leads.convert' as Capability, name: 'Convert to Member', description: 'Convert winning lead into paid member' },
    ],
  },
  {
    id: 'front_desk',
    name: 'Front Desk Operations',
    description: 'Day passes, cash drawer, guest entries, and lockers',
    capabilities: [
      { id: 'front_desk.access' as Capability, name: 'Access Console', description: 'Access front desk console' },
      { id: 'front_desk.cash_drawer' as Capability, name: 'Cash Drawer', description: 'Open/close cash shift and reconcile' },
      { id: 'front_desk.day_pass' as Capability, name: 'Sell Day Passes', description: 'Issue day-pass QR codes (incl. Happy Hours violations)' },
      { id: 'front_desk.guest_entry' as Capability, name: 'Guest Log', description: 'Record complimentary guest entries' },
      { id: 'front_desk.locker' as Capability, name: 'Locker Allocation', description: 'Assign and clear physical lockers' },
    ],
  },
  {
    id: 'analytics',
    name: 'Analytics & Revenue',
    description: 'Revenue reports gated by per-user can_view_revenue flag',
    capabilities: [
      { id: 'analytics.view' as Capability, name: 'View Analytics', description: 'Access management dashboard and KPIs' },
      { id: 'analytics.export' as Capability, name: 'Export Reports', description: 'Download analytics as CSV' },
      { id: 'analytics.revenue' as Capability, name: 'Revenue Reports', description: 'Inspect revenue — requires can_view_revenue flag' },
    ],
  },
  {
    id: 'settings',
    name: 'Settings & Security',
    description: 'System configuration, role manager, and audit logs',
    capabilities: [
      { id: 'settings.view' as Capability, name: 'View Settings', description: 'Inspect system settings and PENDING config values' },
      { id: 'settings.edit' as Capability, name: 'Modify Config', description: 'Change tax rates, invoice sequences, and lifecycle rules' },
      { id: 'settings.roles' as Capability, name: 'Role & Permissions', description: 'Create roles and modify permission matrix' },
      { id: 'settings.notifications' as Capability, name: 'Notification Rules', description: 'Configure notification triggers' },
      { id: 'audit.view' as Capability, name: 'View Audit Logs', description: 'Inspect immutable system event records' },
      { id: 'system.force_logout' as Capability, name: 'Force Logout', description: 'Revoke active employee login sessions' },
      { id: 'system.manage_sessions' as Capability, name: 'Session Control', description: 'View active sessions' },
      { id: 'system.migration' as Capability, name: 'Data Migration', description: 'Run Gymex data import/export' },
    ],
  },
]

/**
 * Check if a role has a capability.
 */
export function hasCapability(role: RoleName, capability: Capability): boolean {
  return SEEDED_ROLES[role]?.includes(capability) ?? false
}
