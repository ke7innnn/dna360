/* ============================================================
   DNA 360 — Auth & Staff Store (RBAC)
   Single-club v1 · Powai

   34 staff on record + Gym Owner + Member personas.
   Underneath, everyone resolves to User -> Role -> Capabilities.
   Capabilities are the atom; roles are named bundles of them.
   ============================================================ */

import type { AuthUser, RoleDefinition, UserSession, RoleSlug } from '@/types/auth'
import type { Capability } from '@/config/permissions'
import { ROLE_CAPS, hasCapability, canAccessRevenue } from '@/config/permissions'
import { logAuditEvent } from './audit'

export const CLUB_ID_POWAI = 'club_powai_01'

export const POWAI_BRANCH = {
  id: 'pow',
  name: 'Hiranandani Gardens, Powai',
  code: 'POW',
  address: 'Knowledge Park, 502, Hiranandani Gardens, Mumbai Suburban, Maharashtra 400076',
  timezone: 'Asia/Kolkata',
  phone: '+919820036000',
  isActive: true,
}

// ─── 11 Role Definitions ───
export const SEEDED_ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    id: 'role_owner',
    name: 'Owner / Executive',
    slug: 'OWNER',
    description: 'Unrestricted administrative access. Full revenue, all exports, settings, pricing, and role management.',
    capabilities: ROLE_CAPS.OWNER,
    isSystem: true,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'role_hr_head',
    name: 'HR Head (Revenue Tier)',
    slug: 'HR_HEAD',
    description: 'Manages people, staff rosters, attendance, and audit trail. Revenue visibility enabled.',
    capabilities: ROLE_CAPS.HR_HEAD,
    isSystem: true,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'role_marketing_head',
    name: 'Marketing Head (Revenue Tier)',
    slug: 'MARKETING_HEAD',
    description: 'Runs marketing campaigns, CRM leads pipeline, and member directory overview. Revenue visibility enabled.',
    capabilities: ROLE_CAPS.MARKETING_HEAD,
    isSystem: true,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'role_sales_head',
    name: 'Asst Sales Head (Revenue Tier)',
    slug: 'SALES_HEAD',
    description: 'Directs sales desk, memberships, enrollments, and operational tax billing. Revenue visibility enabled.',
    capabilities: ROLE_CAPS.SALES_HEAD,
    isSystem: true,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'role_head_trainer',
    name: 'Head Trainer',
    slug: 'HEAD_TRAINER',
    description: 'Studio timetables, trainer allocations, class bookings, workout programming, check-in view.',
    capabilities: ROLE_CAPS.HEAD_TRAINER,
    isSystem: true,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'role_trainer',
    name: 'General Trainer',
    slug: 'TRAINER',
    description: 'Scoped to assigned personal training clients and assigned sessions only. Log workouts and self-service.',
    capabilities: ROLE_CAPS.TRAINER,
    isSystem: true,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'role_fitness_consultant',
    name: 'Fitness Consultant',
    slug: 'FITNESS_CONSULTANT',
    description: 'Sales floor & front desk: lead pipeline, member enrollments, operational invoices, and turnstile check-ins.',
    capabilities: ROLE_CAPS.FITNESS_CONSULTANT,
    isSystem: true,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'role_masseur',
    name: 'Masseur (Service)',
    slug: 'MASSEUR',
    description: 'Scoped to assigned clients and therapy session bookings + staff self-service.',
    capabilities: ROLE_CAPS.MASSEUR,
    isSystem: true,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'role_supervisor',
    name: 'Supervisor',
    slug: 'SUPERVISOR',
    description: 'Turnstile gate operations, check-in feeds, and staff attendance monitoring + self-service.',
    capabilities: ROLE_CAPS.SUPERVISOR,
    isSystem: true,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'role_employee',
    name: 'Employee (Support Staff)',
    slug: 'EMPLOYEE',
    description: 'Staff self-service baseline: attendance punch logs, shift schedules, payslips, and profile.',
    capabilities: ROLE_CAPS.EMPLOYEE,
    isSystem: true,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'role_member',
    name: 'Member',
    slug: 'MEMBER',
    description: 'Member self-service portal: rolling QR token, class bookings, tax invoice receipts, and renewals.',
    capabilities: ROLE_CAPS.MEMBER,
    isSystem: true,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
]

const findRole = (slug: RoleSlug): RoleDefinition =>
  SEEDED_ROLE_DEFINITIONS.find((r) => r.slug.toUpperCase() === slug.toUpperCase()) || SEEDED_ROLE_DEFINITIONS[0]

// ─── The Official 34 Staff + Owner + Members (§9) ───
export const SEEDED_USERS: AuthUser[] = [
  // ─── Owner / Executive ───
  {
    id: 'usr_owner_01',
    clubId: CLUB_ID_POWAI,
    type: 'STAFF',
    name: 'Executive Admin',
    email: 'admin@dna360.in',
    phone: '+919820011111',
    role: findRole('OWNER'),
    designation: 'Owner / Executive',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: true,
    twoFactorEnabled: true,
    twoFactorRequired: true,
    requires_login: true,
    passwordHash: 'password123',
  },

  // ─── Revenue Leaders (§9) ───
  {
    id: 'usr_staff_01',
    clubId: CLUB_ID_POWAI,
    type: 'STAFF',
    name: 'Swapnil Borhade',
    email: 'swapnil.hr@dna360.in',
    phone: '+919820021001',
    role: findRole('HR_HEAD'),
    designation: 'HR Head',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: true,
    twoFactorEnabled: true,
    twoFactorRequired: true,
    requires_login: true,
    passwordHash: 'password123',
  },
  {
    id: 'usr_staff_02',
    clubId: CLUB_ID_POWAI,
    type: 'STAFF',
    name: 'Keith Shah',
    email: 'keith.mktg@dna360.in',
    phone: '+919820021002',
    role: findRole('OWNER'),
    designation: 'Administrator (All Features Access)',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: true,
    twoFactorEnabled: true,
    twoFactorRequired: true,
    requires_login: true,
    passwordHash: 'password123',
  },
  {
    id: 'usr_staff_10',
    clubId: CLUB_ID_POWAI,
    type: 'STAFF',
    name: 'Monica Picholla',
    email: 'monica.sales@dna360.in',
    phone: '+919820021003',
    role: findRole('SALES_HEAD'),
    designation: 'Asst Sales Head',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: true,
    twoFactorEnabled: true,
    twoFactorRequired: true,
    requires_login: true,
    passwordHash: 'password123',
  },

  // ─── Head Trainers (§9) ───
  {
    id: 'usr_staff_03',
    clubId: CLUB_ID_POWAI,
    type: 'STAFF',
    name: 'Rajesh Poojary',
    email: 'rajesh.coach@dna360.in',
    phone: '+919820041001',
    role: findRole('HEAD_TRAINER'),
    designation: 'Head Trainer',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: false,
    requires_login: true,
    passwordHash: 'password123',
  },
  {
    id: 'usr_staff_04',
    clubId: CLUB_ID_POWAI,
    type: 'STAFF',
    name: 'Aftab Memon',
    email: 'aftab.coach@dna360.in',
    phone: '+919820041002',
    role: findRole('HEAD_TRAINER'),
    designation: 'Head Trainer',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: false,
    requires_login: true,
    passwordHash: 'password123',
  },

  // ─── General Trainers (§9) ───
  {
    id: 'usr_staff_05',
    clubId: CLUB_ID_POWAI,
    type: 'STAFF',
    name: 'Pramod Sawant',
    email: 'pramod.trainer@dna360.in',
    phone: '+919820041003',
    role: findRole('TRAINER'),
    designation: 'General Trainer',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: false,
    assignedClientIds: ['mem_001', 'mem_002', 'mem_003'],
    requires_login: true,
    passwordHash: 'password123',
  },
  {
    id: 'usr_staff_06',
    clubId: CLUB_ID_POWAI,
    type: 'STAFF',
    name: 'Jateen Gaonkar',
    email: 'jateen.trainer@dna360.in',
    phone: '+919820041004',
    role: findRole('TRAINER'),
    designation: 'General Trainer',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: false,
    assignedClientIds: ['mem_004', 'mem_005'],
    requires_login: true,
    passwordHash: 'password123',
  },
  {
    id: 'usr_staff_07',
    clubId: CLUB_ID_POWAI,
    type: 'STAFF',
    name: 'Aditya Sarmalkar',
    email: 'aditya.trainer@dna360.in',
    phone: '+919820041005',
    role: findRole('TRAINER'),
    designation: 'General Trainer',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: false,
    assignedClientIds: ['mem_006'],
    requires_login: true,
    passwordHash: 'password123',
  },
  {
    id: 'usr_staff_08',
    clubId: CLUB_ID_POWAI,
    type: 'STAFF',
    name: 'Vaibhav Gawade',
    email: 'vaibhav.trainer@dna360.in',
    phone: '+919820041006',
    role: findRole('TRAINER'),
    designation: 'General Trainer',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: false,
    assignedClientIds: ['mem_007', 'mem_008'],
    requires_login: true,
    passwordHash: 'password123',
  },
  {
    id: 'usr_staff_09',
    clubId: CLUB_ID_POWAI,
    type: 'STAFF',
    name: 'Mohd Hussain Ansari',
    email: 'hussain.trainer@dna360.in',
    phone: '+919820041007',
    role: findRole('TRAINER'),
    designation: 'General Trainer',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: false,
    assignedClientIds: ['mem_009'],
    requires_login: true,
    passwordHash: 'password123',
  },

  // ─── Fitness Consultants (Sales & Desk Floor) (§9) ───
  {
    id: 'usr_frontdesk_01',
    clubId: CLUB_ID_POWAI,
    type: 'STAFF',
    name: 'Front Desk Operations',
    email: 'frontdesk@dna360.in',
    phone: '+919820036000',
    role: findRole('FITNESS_CONSULTANT'),
    designation: 'Front Desk Supervisor',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: false,
    requires_login: true,
    passwordHash: 'Password@123',
  },
  {
    id: 'usr_staff_11',
    clubId: CLUB_ID_POWAI,
    type: 'STAFF',
    name: 'Pallavi',
    email: 'pallavi.fc@dna360.in',
    phone: '+919820031001',
    role: findRole('FITNESS_CONSULTANT'),
    designation: 'Fitness Consultant',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: false,
    requires_login: true,
    passwordHash: 'password123',
  },
  {
    id: 'usr_staff_12',
    clubId: CLUB_ID_POWAI,
    type: 'STAFF',
    name: 'Nisha Yadav',
    email: 'nisha.fc@dna360.in',
    phone: '+919820031002',
    role: findRole('FITNESS_CONSULTANT'),
    designation: 'Fitness Consultant',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: false,
    requires_login: true,
    passwordHash: 'password123',
  },
  {
    id: 'usr_staff_13',
    clubId: CLUB_ID_POWAI,
    type: 'STAFF',
    name: 'Surendra Chaudhary',
    email: 'surendra.fc@dna360.in',
    phone: '+919820031003',
    role: findRole('FITNESS_CONSULTANT'),
    designation: 'Fitness Consultant',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: false,
    requires_login: true,
    passwordHash: 'password123',
  },
  {
    id: 'usr_staff_14',
    clubId: CLUB_ID_POWAI,
    type: 'STAFF',
    name: 'Krish Rawat',
    email: 'krish.fc@dna360.in',
    phone: '+919820031004',
    role: findRole('FITNESS_CONSULTANT'),
    designation: 'Fitness Consultant',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: false,
    requires_login: true,
    passwordHash: 'password123',
  },

  // ─── Masseur & Supervisor (§9) ───
  {
    id: 'usr_staff_15',
    clubId: CLUB_ID_POWAI,
    type: 'STAFF',
    name: 'Liladhar Kahiram Mestry',
    email: 'liladhar.masseur@dna360.in',
    phone: '+919820051001',
    role: findRole('MASSEUR'),
    designation: 'Masseur',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: false,
    assignedClientIds: ['mem_001', 'mem_010'],
    requires_login: true,
    passwordHash: 'password123',
  },
  {
    id: 'usr_staff_17',
    clubId: CLUB_ID_POWAI,
    type: 'STAFF',
    name: 'Suresh Jivanvar',
    email: 'suresh.sup@dna360.in',
    phone: '+919820051002',
    role: findRole('SUPERVISOR'),
    designation: 'Supervisor',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: false,
    requires_login: true,
    passwordHash: 'password123',
  },

  // ─── Support Staff Baseline (DJ, Housekeeping, Chefs, Valets) (§9) ───
  {
    id: 'usr_staff_16',
    clubId: CLUB_ID_POWAI,
    type: 'STAFF',
    name: 'Prathamesh Pawar',
    phone: '+919820061001',
    role: findRole('EMPLOYEE'),
    designation: 'DJ',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: false,
    requires_login: false,
  },
  {
    id: 'usr_staff_18',
    clubId: CLUB_ID_POWAI,
    type: 'STAFF',
    name: 'Kanchan Wadekar',
    phone: '+919820061002',
    role: findRole('EMPLOYEE'),
    designation: 'Housekeeping Staff',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: false,
    requires_login: false,
  },
  {
    id: 'usr_staff_19',
    clubId: CLUB_ID_POWAI,
    type: 'STAFF',
    name: 'Kishun Safi',
    phone: '+919820061003',
    role: findRole('EMPLOYEE'),
    designation: 'Housekeeping Staff',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: false,
    requires_login: false,
  },
  {
    id: 'usr_staff_20',
    clubId: CLUB_ID_POWAI,
    type: 'STAFF',
    name: 'Dashrath Lolam',
    phone: '+919820061004',
    role: findRole('EMPLOYEE'),
    designation: 'Housekeeping Staff',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: false,
    requires_login: false,
  },
  {
    id: 'usr_staff_21',
    clubId: CLUB_ID_POWAI,
    type: 'STAFF',
    name: 'Santoshi Yadav',
    phone: '+919820061005',
    role: findRole('EMPLOYEE'),
    designation: 'Housekeeping Staff',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: false,
    requires_login: false,
  },
  {
    id: 'usr_staff_22',
    clubId: CLUB_ID_POWAI,
    type: 'STAFF',
    name: 'Sangeeta Kale',
    phone: '+919820061006',
    role: findRole('EMPLOYEE'),
    designation: 'Housekeeping Staff',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: false,
    requires_login: false,
  },
  {
    id: 'usr_staff_23',
    clubId: CLUB_ID_POWAI,
    type: 'STAFF',
    name: 'Pratik Kadam',
    phone: '+919820061007',
    role: findRole('EMPLOYEE'),
    designation: 'Housekeeping Staff',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: false,
    requires_login: false,
  },
  {
    id: 'usr_staff_24',
    clubId: CLUB_ID_POWAI,
    type: 'STAFF',
    name: 'Pandurang Sankpal',
    phone: '+919820061008',
    role: findRole('EMPLOYEE'),
    designation: 'Housekeeping Staff',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: false,
    requires_login: false,
  },
  {
    id: 'usr_staff_25',
    clubId: CLUB_ID_POWAI,
    type: 'STAFF',
    name: 'Vijay Mohite',
    phone: '+919820061009',
    role: findRole('EMPLOYEE'),
    designation: 'Housekeeping Staff',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: false,
    requires_login: false,
  },
  {
    id: 'usr_staff_26',
    clubId: CLUB_ID_POWAI,
    type: 'STAFF',
    name: 'Kanhaiya Kumar Yadav',
    phone: '+919820061010',
    role: findRole('EMPLOYEE'),
    designation: 'Housekeeping Staff',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: false,
    requires_login: false,
  },
  {
    id: 'usr_staff_27',
    clubId: CLUB_ID_POWAI,
    type: 'STAFF',
    name: 'Vandana Johare',
    phone: '+919820061011',
    role: findRole('EMPLOYEE'),
    designation: 'Housekeeping Staff',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: false,
    requires_login: false,
  },
  {
    id: 'usr_staff_28',
    clubId: CLUB_ID_POWAI,
    type: 'STAFF',
    name: 'Sunita Hate',
    phone: '+919820061012',
    role: findRole('EMPLOYEE'),
    designation: 'Chef',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: false,
    requires_login: false,
  },
  {
    id: 'usr_staff_29',
    clubId: CLUB_ID_POWAI,
    type: 'STAFF',
    name: 'Siddhesh Paktekar',
    phone: '+919820061013',
    role: findRole('EMPLOYEE'),
    designation: 'Chef',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: false,
    requires_login: false,
  },
  {
    id: 'usr_staff_30',
    clubId: CLUB_ID_POWAI,
    type: 'STAFF',
    name: 'Mayuri Rasam',
    phone: '+919820061014',
    role: findRole('EMPLOYEE'),
    designation: 'Chef',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: false,
    requires_login: false,
  },
  {
    id: 'usr_staff_31',
    clubId: CLUB_ID_POWAI,
    type: 'STAFF',
    name: 'Yash Hatkar',
    phone: '+919820061015',
    role: findRole('EMPLOYEE'),
    designation: 'Chef',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: false,
    requires_login: false,
  },
  {
    id: 'usr_staff_32',
    clubId: CLUB_ID_POWAI,
    type: 'STAFF',
    name: 'Ram Agre',
    phone: '+919820061016',
    role: findRole('EMPLOYEE'),
    designation: 'Valet',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: false,
    requires_login: false,
  },
  {
    id: 'usr_staff_33',
    clubId: CLUB_ID_POWAI,
    type: 'STAFF',
    name: 'Pawan Yadav',
    phone: '+919820061017',
    role: findRole('EMPLOYEE'),
    designation: 'Valet',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: false,
    requires_login: false,
  },
  {
    id: 'usr_staff_34',
    clubId: CLUB_ID_POWAI,
    type: 'STAFF',
    name: 'Mahesh Mane',
    phone: '+919820061018',
    role: findRole('EMPLOYEE'),
    designation: 'Valet',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: false,
    requires_login: false,
  },
]

export const SEEDED_ACTIVE_SESSIONS: UserSession[] = [
  {
    id: 'sess_cur_01',
    userId: 'usr_owner_01',
    userName: 'Executive Admin',
    userEmail: 'admin@dna360.in',
    userRole: 'OWNER',
    capabilities: ROLE_CAPS.OWNER,
    clubId: CLUB_ID_POWAI,
    ipAddress: '103.21.126.14',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    deviceType: 'Desktop',
    location: 'Mumbai, IN',
    branchName: 'Powai',
    lastActiveAt: new Date().toISOString(),
    isCurrent: true,
  },
]

export function normaliseIndianPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 10) return `+91${digits}`
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`
  return raw
}

export function maskPhoneNumber(phone: string): string {
  if (!phone) return ''
  const trimmed = phone.trim()
  if (trimmed.length <= 4) return '••••'
  const lastFour = trimmed.slice(-4)
  if (trimmed.startsWith('+91')) {
    return `+91 ••••• •${lastFour}`
  }
  return `••••••${lastFour}`
}

/**
 * Default Redirect after Login based on Role & Population
 */
export function getRoleDefaultRedirect(user: AuthUser): string {
  if (user.type === 'MEMBER') {
    return '/dashboard'
  }
  // Staff routing
  const slug = user.role.slug.toUpperCase()
  if (slug === 'OWNER' || slug === 'HR_HEAD' || slug === 'MARKETING_HEAD' || slug === 'SALES_HEAD') {
    return '/overview'
  }
  if (slug === 'HEAD_TRAINER' || slug === 'TRAINER') {
    return '/classes'
  }
  if (slug === 'FITNESS_CONSULTANT') {
    return '/leads'
  }
  if (slug === 'SUPERVISOR') {
    return '/attendance'
  }
  return '/dashboard'
}

/**
 * Server-side / Client Capability Guard Helper (§7)
 */
export function requireCapability(user: AuthUser | null, capability: Capability): boolean {
  if (!user) return false
  if (user.role.slug.toUpperCase() === 'OWNER') return true
  return hasCapability(user.role.slug, capability)
}

/**
 * Scoped record check (Kills IDOR (§7))
 */
export function canAccessMemberRecord(user: AuthUser | null, targetMemberId: string): boolean {
  if (!user) return false
  if (user.role.slug.toUpperCase() === 'OWNER' || hasCapability(user.role.slug, 'members.view.all')) {
    return true
  }
  if (hasCapability(user.role.slug, 'members.view.own')) {
    return user.assignedClientIds?.includes(targetMemberId) ?? false
  }
  if (user.type === 'MEMBER') {
    return user.id === targetMemberId
  }
  return false
}

// Re-exports & Compatibility Helpers
export { canAccessRevenue, hasCapability } from '@/config/permissions'
export const normalizeIndianPhone = normaliseIndianPhone

export function getSalesReps(): { id: string; name: string; email?: string | null; phone: string }[] {
  return SEEDED_USERS.filter(
    (u) =>
      u.role.slug.toUpperCase() === 'SALES_HEAD' ||
      u.role.slug.toUpperCase() === 'FITNESS_CONSULTANT' ||
      u.role.slug.toUpperCase() === 'OWNER'
  ).map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
  }))
}
