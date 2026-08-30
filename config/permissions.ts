/* ============================================================
   DNA 360 — RBAC Capability Catalog & Role Bundles
   Single-club v1 · Powai

   Underneath, everyone resolves to User -> Role -> Capabilities.
   Capabilities are the atom; roles are named bundles of them.
   Always check capabilities in code, never role names.
   ============================================================ */

export const ALL_CAPABILITIES = [
  // Members
  'members.view.all',
  'members.view.own',
  'members.edit',
  'members.enrol',
  'members.export',
  'members.delete',

  // Check-in & access
  'checkin.operate',
  'checkin.view',

  // Classes & training
  'classes.manage.all',
  'classes.manage.own',
  'classes.book_member',
  'workouts.log',
  'trainers.assign',

  // Leads & marketing
  'leads.manage',
  'campaigns.manage',

  // Billing (operational — invoices & payments, NOT the money dashboard)
  'billing.view',
  'billing.create',
  'billing.export',

  // Revenue (THE WALL — money, totals, GST, financial analytics)
  'revenue.view',

  // Products & pricing
  'products.view',
  'pricing.manage',

  // Staff
  'staff.view',
  'staff.manage',
  'staff.schedule',
  'staff_attendance.view',

  // Admin
  'settings.manage',
  'roles.assign',
  'audit.view',

  // Self-service (baseline for every staff account)
  'self.attendance',
  'self.schedule',
  'self.payslip',
  'self.profile',

  // Member portal (all gated by membership status)
  'portal.access',
  'portal.book',
  'portal.token',
  'portal.invoices',
  'portal.renew',
] as const

export type Capability = (typeof ALL_CAPABILITIES)[number]

/**
 * Self-service baseline granted to every staff account
 */
export const SELF_SERVICE_BASELINE: Capability[] = [
  'self.attendance',
  'self.schedule',
  'self.payslip',
  'self.profile',
]

/**
 * Single Source of Truth for Role -> Capabilities Mapping (§3)
 */
export const ROLE_CAPS: Record<string, Capability[]> = {
  // OWNER / ADMIN — Full unrestricted system access. Sole holder of settings.manage, pricing.manage, roles.assign, members.delete, and all *.export
  OWNER: [...ALL_CAPABILITIES],
  owner: [...ALL_CAPABILITIES],

  // HR HEAD (Revenue Tier)
  HR_HEAD: [
    'revenue.view',
    'staff.view',
    'staff.manage',
    'staff.schedule',
    'staff_attendance.view',
    'audit.view',
    ...SELF_SERVICE_BASELINE,
  ],
  hr_head: [
    'revenue.view',
    'staff.view',
    'staff.manage',
    'staff.schedule',
    'staff_attendance.view',
    'audit.view',
    ...SELF_SERVICE_BASELINE,
  ],

  // MARKETING HEAD (Revenue Tier)
  MARKETING_HEAD: [
    'revenue.view',
    'leads.manage',
    'campaigns.manage',
    'members.view.all',
    ...SELF_SERVICE_BASELINE,
  ],
  marketing_head: [
    'revenue.view',
    'leads.manage',
    'campaigns.manage',
    'members.view.all',
    ...SELF_SERVICE_BASELINE,
  ],

  // SALES HEAD (Asst Sales Head — Revenue Tier)
  SALES_HEAD: [
    'revenue.view',
    'leads.manage',
    'members.view.all',
    'members.edit',
    'members.enrol',
    'billing.view',
    'billing.create',
    ...SELF_SERVICE_BASELINE,
  ],
  sales_head: [
    'revenue.view',
    'leads.manage',
    'members.view.all',
    'members.edit',
    'members.enrol',
    'billing.view',
    'billing.create',
    ...SELF_SERVICE_BASELINE,
  ],

  // HEAD TRAINER
  HEAD_TRAINER: [
    'members.view.all',
    'classes.manage.all',
    'classes.book_member',
    'workouts.log',
    'trainers.assign',
    'checkin.view',
    ...SELF_SERVICE_BASELINE,
  ],
  head_trainer: [
    'members.view.all',
    'classes.manage.all',
    'classes.book_member',
    'workouts.log',
    'trainers.assign',
    'checkin.view',
    ...SELF_SERVICE_BASELINE,
  ],

  // GENERAL TRAINER
  TRAINER: [
    'members.view.own',
    'classes.manage.own',
    'workouts.log',
    ...SELF_SERVICE_BASELINE,
  ],
  trainer: [
    'members.view.own',
    'classes.manage.own',
    'workouts.log',
    ...SELF_SERVICE_BASELINE,
  ],

  // FITNESS CONSULTANT (Sales Floor / Front Desk)
  FITNESS_CONSULTANT: [
    'leads.manage',
    'members.view.all',
    'members.enrol',
    'billing.view',
    'billing.create',
    'checkin.operate',
    'classes.book_member',
    ...SELF_SERVICE_BASELINE,
  ],
  fitness_consultant: [
    'leads.manage',
    'members.view.all',
    'members.enrol',
    'billing.view',
    'billing.create',
    'checkin.operate',
    'classes.book_member',
    ...SELF_SERVICE_BASELINE,
  ],

  // MASSEUR (Service)
  MASSEUR: [
    'members.view.own',
    'classes.manage.own',
    ...SELF_SERVICE_BASELINE,
  ],
  masseur: [
    'members.view.own',
    'classes.manage.own',
    ...SELF_SERVICE_BASELINE,
  ],

  // SUPERVISOR (Floor Oversight)
  SUPERVISOR: [
    'checkin.operate',
    'checkin.view',
    'staff_attendance.view',
    ...SELF_SERVICE_BASELINE,
  ],
  supervisor: [
    'checkin.operate',
    'checkin.view',
    'staff_attendance.view',
    ...SELF_SERVICE_BASELINE,
  ],

  // EMPLOYEE (Support Staff — DJ, Housekeeping, Chef, Valet)
  EMPLOYEE: [...SELF_SERVICE_BASELINE],
  employee: [...SELF_SERVICE_BASELINE],
  staff_no_login: [...SELF_SERVICE_BASELINE],

  // MEMBER (All gated by membership status)
  MEMBER: [
    'portal.access',
    'portal.book',
    'portal.token',
    'portal.invoices',
    'portal.renew',
  ],
  member: [
    'portal.access',
    'portal.book',
    'portal.token',
    'portal.invoices',
    'portal.renew',
  ],

  // Compatibility aliases
  manager: [
    'revenue.view',
    'staff.view',
    'staff.manage',
    'staff.schedule',
    'staff_attendance.view',
    'audit.view',
    'leads.manage',
    'members.view.all',
    'billing.view',
    'billing.create',
    ...SELF_SERVICE_BASELINE,
  ],
  sales: [
    'leads.manage',
    'members.view.all',
    'members.enrol',
    'billing.view',
    'billing.create',
    'checkin.operate',
    'classes.book_member',
    ...SELF_SERVICE_BASELINE,
  ],
  front_desk: [
    'checkin.operate',
    'checkin.view',
    'staff_attendance.view',
    'members.view.all',
    'billing.view',
    ...SELF_SERVICE_BASELINE,
  ],
}

/** Legacy export alias for compatibility */
export const SEEDED_ROLES = ROLE_CAPS

/**
 * Check if a given role possesses a specific capability.
 */
export function hasCapability(role: string, capability: Capability): boolean {
  if (!role) return false
  const r = role.toUpperCase()
  if (r === 'OWNER') return true
  const caps = ROLE_CAPS[role] || ROLE_CAPS[r] || []
  return caps.includes(capability)
}

/**
 * Check if a role is allowed through "The Wall" (Revenue Visibility).
 * ONLY Owner, HR Head, Marketing Head, Sales Head.
 */
export function canAccessRevenue(role: string): boolean {
  return hasCapability(role, 'revenue.view')
}

/**
 * Capability Groups for UI display & Role matrix
 */
export const CAPABILITY_GROUPS = [
  {
    id: 'members',
    name: 'Members',
    description: 'Directory access, member profiles, enrollment, and export',
    capabilities: [
      { id: 'members.view.all' as Capability, name: 'View All Members', description: 'Browse entire club directory' },
      { id: 'members.view.own' as Capability, name: 'View Assigned Members', description: 'Inspect only assigned personal training/service clients' },
      { id: 'members.edit' as Capability, name: 'Edit Member Profiles', description: 'Update contact info, emergency contacts, and profile details' },
      { id: 'members.enrol' as Capability, name: 'Enrol Members', description: 'Register new members and setup initial memberships' },
      { id: 'members.export' as Capability, name: 'Export Member PII', description: 'Download members CSV (Owner only)' },
      { id: 'members.delete' as Capability, name: 'Delete Members', description: 'Soft-delete member records (Owner only)' },
    ],
  },
  {
    id: 'checkin',
    name: 'Check-in & Turnstiles',
    description: 'Turnstile gate operations, QR scan simulator, and access logs',
    capabilities: [
      { id: 'checkin.operate' as Capability, name: 'Operate Turnstiles', description: 'Trigger manual door releases and process check-ins' },
      { id: 'checkin.view' as Capability, name: 'View Check-in Feed', description: 'Inspect real-time turnstile occupancy and logs' },
    ],
  },
  {
    id: 'classes',
    name: 'Classes & Training',
    description: 'Studio scheduling, member bookings, and trainer client assignments',
    capabilities: [
      { id: 'classes.manage.all' as Capability, name: 'Manage All Classes', description: 'Create, modify, and cancel studio timetable slots' },
      { id: 'classes.manage.own' as Capability, name: 'Manage Own Sessions', description: 'Manage own assigned 1-on-1 or group class roster' },
      { id: 'classes.book_member' as Capability, name: 'Book for Member', description: 'Reserve or override class spots on behalf of members' },
      { id: 'workouts.log' as Capability, name: 'Log Workouts', description: 'Record workout programming and session completion' },
      { id: 'trainers.assign' as Capability, name: 'Assign Trainers', description: 'Allocate personal trainers to incoming members' },
    ],
  },
  {
    id: 'leads',
    name: 'Leads & CRM',
    description: 'Walk-in pipelines, trial sessions, and marketing campaigns',
    capabilities: [
      { id: 'leads.manage' as Capability, name: 'Manage Leads Pipeline', description: 'View, update, and convert walk-ins/inquiries' },
      { id: 'campaigns.manage' as Capability, name: 'Manage Campaigns', description: 'Create and track marketing promotions and offers' },
    ],
  },
  {
    id: 'billing',
    name: 'Billing & Invoices',
    description: 'Operational tax invoices and payment processing (NOT money dashboard)',
    capabilities: [
      { id: 'billing.view' as Capability, name: 'View Invoices', description: 'Inspect member invoices, receipts, and payment ledger' },
      { id: 'billing.create' as Capability, name: 'Raise Tax Invoices', description: 'Generate GST-compliant tax invoices and credit notes' },
      { id: 'billing.export' as Capability, name: 'Export Invoices', description: 'Download billing CSV / GSTR-1 data (Owner only)' },
    ],
  },
  {
    id: 'revenue',
    name: 'Revenue & Finance (The Wall)',
    description: 'Executive revenue totals, MRR, GST liability, and analytics',
    capabilities: [
      { id: 'revenue.view' as Capability, name: 'View Revenue & Financials', description: 'Access revenue metrics, MRR, cash velocity, and GST totals' },
    ],
  },
  {
    id: 'products',
    name: 'Products & Tariffs',
    description: 'Catalogue pricing, SAC tax mappings, and master packages',
    capabilities: [
      { id: 'products.view' as Capability, name: 'View Product Catalogue', description: 'Browse active membership plans and PT tariffs' },
      { id: 'pricing.manage' as Capability, name: 'Manage Pricing', description: 'Create/modify plan rates and tariffs (Owner only)' },
    ],
  },
  {
    id: 'staff',
    name: 'Staff Management',
    description: 'Staff directory, shifts, scheduling, and attendance logs',
    capabilities: [
      { id: 'staff.view' as Capability, name: 'View Staff Directory', description: 'Browse employee list and contact info' },
      { id: 'staff.manage' as Capability, name: 'Manage Staff Accounts', description: 'Create, update, and offboard staff accounts' },
      { id: 'staff.schedule' as Capability, name: 'Schedule Shifts', description: 'Assign duty rosters and shift allocations' },
      { id: 'staff_attendance.view' as Capability, name: 'View Staff Attendance', description: 'Inspect employee punch logs and clock-in records' },
    ],
  },
  {
    id: 'admin',
    name: 'System & Governance',
    description: 'Master club settings, role capability toggles, and audit trail',
    capabilities: [
      { id: 'settings.manage' as Capability, name: 'Manage Club Settings', description: 'Modify legal profile, bank details, and gateways (Owner only)' },
      { id: 'roles.assign' as Capability, name: 'Assign & Edit Roles', description: 'Modify role capability matrix (Owner only)' },
      { id: 'audit.view' as Capability, name: 'View Audit Trail', description: 'Inspect immutable system event log' },
    ],
  },
  {
    id: 'self',
    name: 'Self-Service Baseline',
    description: 'Staff employee self-service baseline',
    capabilities: [
      { id: 'self.attendance' as Capability, name: 'Own Attendance', description: 'View own biometric punch clock-in records' },
      { id: 'self.schedule' as Capability, name: 'Own Schedule', description: 'Inspect own scheduled shift roster' },
      { id: 'self.payslip' as Capability, name: 'Own Payslip', description: 'View own monthly payroll and compensation slip' },
      { id: 'self.profile' as Capability, name: 'Own Profile', description: 'Update own contact and emergency details' },
    ],
  },
  {
    id: 'portal',
    name: 'Member Portal',
    description: 'Member self-service actions (gated by active membership status)',
    capabilities: [
      { id: 'portal.access' as Capability, name: 'Portal Access', description: 'Access member self-service portal' },
      { id: 'portal.book' as Capability, name: 'Book Classes', description: 'Reserve slots in group classes (Active status only)' },
      { id: 'portal.token' as Capability, name: 'Gate Token', description: 'Generate rolling QR entry token (Active status only)' },
      { id: 'portal.invoices' as Capability, name: 'View Invoices', description: 'Download own payment receipts and tax invoices' },
      { id: 'portal.renew' as Capability, name: 'Renew Plan', description: 'Purchase or renew membership subscription' },
    ],
  },
]
