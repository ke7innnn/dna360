/* ============================================================
   DNA 360 — Auth & Staff Store
   
   34 staff on record with 12 real designations:
   - HR Head, Marketing Head, Asst Sales Head
   - Fitness Consultants (Sales & Front Desk floor)
   - Head Trainer, General Trainers
   - Masseur, Supervisor
   - Chef, Housekeeping, Valet, DJ (Attendance-only, no login)
   
   6 historical inactive staff for legacy sales attribution:
   - Swati, Deeksha Kenjale, Kiran Solanki, Abhijit Mahdalkar,
     Amita Galphade, Vaishnavi Javia
   
   Deduplicated: "Krrish Rawat" -> "Krish Rawat"
   ============================================================ */

import type { AuthUser, RoleDefinition, UserSession } from '@/types/auth'
import type { StaffDesignation } from '@/types'
import { SEEDED_ROLES } from '@/config/permissions'
import { logAuditEvent } from './audit'

export const SEEDED_ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    id: 'role_owner',
    name: 'Owner / Executive',
    slug: 'owner',
    description: 'Full unrestricted system access across all financial records, audit logs, and settings.',
    capabilities: SEEDED_ROLES.owner,
    isSystem: true,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'role_manager',
    name: 'Management (HR / Marketing / Asst Sales Head)',
    slug: 'manager',
    description: 'Management supervision, discount overrides, class/staff scheduling, and operations.',
    capabilities: SEEDED_ROLES.manager,
    isSystem: true,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'role_sales',
    name: 'Fitness Consultant (Sales & Desk Floor)',
    slug: 'sales',
    description: 'Sales floor consulting, lead pipeline, POS desk operations, member check-ins.',
    capabilities: SEEDED_ROLES.sales,
    isSystem: true,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'role_trainer',
    name: 'Trainer / Coach',
    slug: 'trainer',
    description: 'Personal training schedules, client workout & nutrition plans, session logs.',
    capabilities: SEEDED_ROLES.trainer,
    isSystem: true,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'role_front_desk',
    name: 'Front Desk / Supervisor / Masseur',
    slug: 'front_desk',
    description: 'Member check-ins, guest entries, day passes, locker allocations, cash drawer.',
    capabilities: SEEDED_ROLES.front_desk,
    isSystem: true,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'role_staff_no_login',
    name: 'Attendance Only (Chef / Housekeeping / Valet / DJ)',
    slug: 'staff_no_login',
    description: 'Biometric/attendance tracking only. No application login credentials.',
    capabilities: [],
    isSystem: true,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'role_member',
    name: 'Member',
    slug: 'member',
    description: 'Self-service member portal: digital QR pass, plan details, class bookings, profile.',
    capabilities: [],
    isSystem: true,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
]

const POWAI_BRANCH = {
  id: 'pow',
  name: 'Hiranandani Gardens, Powai',
  code: 'POW',
  address: 'Knowledge Park, 502, Hiranandani Gardens, Mumbai Suburban, Maharashtra 400076',
  timezone: 'Asia/Kolkata',
  phone: '+919820036000',
  isActive: true,
}

export const SEEDED_USERS: (AuthUser & { passwordHash?: string })[] = [
  // ─── Owner / Leadership ───
  {
    id: 'usr_owner_01',
    name: 'Kevin Patel',
    email: 'kevin@dna360.in',
    phone: '+919820011111',
    role: SEEDED_ROLE_DEFINITIONS[0],
    designation: 'hr_head',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: true,
    pt_tier: null,
    requires_login: true,
    passwordHash: 'password123',
  },

  // ─── Management & Heads (Can View Revenue) ───
  {
    id: 'usr_mgr_hr',
    name: 'Pooja Hegde',
    email: 'pooja.hr@dna360.in',
    phone: '+919820021001',
    role: SEEDED_ROLE_DEFINITIONS[1],
    designation: 'hr_head',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: true,
    pt_tier: null,
    requires_login: true,
    passwordHash: 'password123',
  },
  {
    id: 'usr_mgr_mktg',
    name: 'Rohan Deshmukh',
    email: 'rohan.mktg@dna360.in',
    phone: '+919820021002',
    role: SEEDED_ROLE_DEFINITIONS[1],
    designation: 'marketing_head',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: true,
    pt_tier: null,
    requires_login: true,
    passwordHash: 'password123',
  },
  {
    id: 'usr_mgr_sales_head',
    name: 'Vikramaditya Shinde',
    email: 'vikram.sales@dna360.in',
    phone: '+919820021003',
    role: SEEDED_ROLE_DEFINITIONS[1],
    designation: 'asst_sales_head',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: true, // Asst Sales Head has discount approval & revenue visibility
    pt_tier: null,
    requires_login: true,
    passwordHash: 'password123',
  },

  // ─── Fitness Consultants (Sales & Front Desk Floor) ───
  {
    id: 'usr_fc_01',
    name: 'Amit Sharma',
    email: 'amit.sharma@dna360.in',
    phone: '+919820031001',
    role: SEEDED_ROLE_DEFINITIONS[2],
    designation: 'fitness_consultant',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: false,
    pt_tier: null,
    requires_login: true,
    passwordHash: 'password123',
  },
  {
    id: 'usr_fc_02',
    name: 'Neha Kapoor',
    email: 'neha.kapoor@dna360.in',
    phone: '+919820031002',
    role: SEEDED_ROLE_DEFINITIONS[2],
    designation: 'fitness_consultant',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: false,
    pt_tier: null,
    requires_login: true,
    passwordHash: 'password123',
  },
  {
    id: 'usr_fc_03',
    name: 'Karan Malhotra',
    email: 'karan.m@dna360.in',
    phone: '+919820031003',
    role: SEEDED_ROLE_DEFINITIONS[2],
    designation: 'fitness_consultant',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: false,
    pt_tier: null,
    requires_login: true,
    passwordHash: 'password123',
  },
  {
    id: 'usr_fc_04',
    name: 'Ananya Roy',
    email: 'ananya.roy@dna360.in',
    phone: '+919820031004',
    role: SEEDED_ROLE_DEFINITIONS[2],
    designation: 'fitness_consultant',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: false,
    pt_tier: null,
    requires_login: true,
    passwordHash: 'password123',
  },

  // ─── Trainers (Head & General) ───
  {
    id: 'usr_tr_head_01',
    name: 'Rajesh Poojary',
    email: 'rajesh.coach@dna360.in',
    phone: '+919820041001',
    role: SEEDED_ROLE_DEFINITIONS[3],
    designation: 'head_trainer',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: false,
    pt_tier: 'super_elite', // Seeded as highest tier
    requires_login: true,
    passwordHash: 'password123',
  },
  {
    id: 'usr_tr_02',
    name: 'Krish Rawat', // Deduplicated from Krrish Rawat
    email: 'krish.rawat@dna360.in',
    phone: '+919820041002',
    role: SEEDED_ROLE_DEFINITIONS[3],
    designation: 'general_trainer',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: false,
    pt_tier: 'elite',
    requires_login: true,
    passwordHash: 'password123',
  },
  {
    id: 'usr_tr_03',
    name: 'Sneha Rao',
    email: 'sneha.pilates@dna360.in',
    phone: '+919820041003',
    role: SEEDED_ROLE_DEFINITIONS[3],
    designation: 'general_trainer',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: false,
    pt_tier: 'premium',
    requires_login: true,
    passwordHash: 'password123',
  },
  {
    id: 'usr_tr_04',
    name: 'Aftab Memon',
    email: 'aftab.cycling@dna360.in',
    phone: '+919820041004',
    role: SEEDED_ROLE_DEFINITIONS[3],
    designation: 'general_trainer',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: false,
    pt_tier: 'elite',
    requires_login: true,
    passwordHash: 'password123',
  },
  {
    id: 'usr_tr_05',
    name: 'Zeebran Shaikh',
    email: 'zeebran.boxing@dna360.in',
    phone: '+919820041005',
    role: SEEDED_ROLE_DEFINITIONS[3],
    designation: 'general_trainer',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: false,
    pt_tier: 'premium',
    requires_login: true,
    passwordHash: 'password123',
  },

  // ─── Masseur & Supervisor ───
  {
    id: 'usr_masseur_01',
    name: 'Ganesh Sawant',
    email: 'ganesh.massage@dna360.in',
    phone: '+919820051001',
    role: SEEDED_ROLE_DEFINITIONS[4],
    designation: 'masseur',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: false,
    pt_tier: null,
    requires_login: true,
    passwordHash: 'password123',
  },
  {
    id: 'usr_sup_01',
    name: 'Mahesh Kadam',
    email: 'mahesh.sup@dna360.in',
    phone: '+919820051002',
    role: SEEDED_ROLE_DEFINITIONS[4],
    designation: 'supervisor',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: false,
    pt_tier: null,
    requires_login: true,
    passwordHash: 'password123',
  },

  // ─── Attendance Only (No App Login) ───
  {
    id: 'usr_chef_01',
    name: 'Chef Suresh Nair',
    email: 'chef.suresh@dna360.in',
    phone: '+919820061001',
    role: SEEDED_ROLE_DEFINITIONS[5],
    designation: 'chef',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: false,
    pt_tier: null,
    requires_login: false,
  },
  {
    id: 'usr_hk_01',
    name: 'Ramesh Jadhav',
    email: 'hk.ramesh@dna360.in',
    phone: '+919820061002',
    role: SEEDED_ROLE_DEFINITIONS[5],
    designation: 'housekeeping',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: false,
    pt_tier: null,
    requires_login: false,
  },
  {
    id: 'usr_valet_01',
    name: 'Santosh Gole',
    email: 'valet.santosh@dna360.in',
    phone: '+919820061003',
    role: SEEDED_ROLE_DEFINITIONS[5],
    designation: 'valet',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: false,
    pt_tier: null,
    requires_login: false,
  },
  {
    id: 'usr_dj_01',
    name: 'DJ Dev',
    email: 'dj.dev@dna360.in',
    phone: '+919820061004',
    role: SEEDED_ROLE_DEFINITIONS[5],
    designation: 'dj',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: false,
    pt_tier: null,
    requires_login: false,
  },

  // ─── 6 Historical Inactive Staff (for Legacy Sales Attribution) ───
  {
    id: 'usr_hist_01',
    name: 'Swati',
    email: 'swati.legacy@dna360.in',
    phone: '+919820090001',
    role: SEEDED_ROLE_DEFINITIONS[2],
    designation: 'fitness_consultant',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'inactive',
    can_view_revenue: false,
    pt_tier: null,
    requires_login: false,
  },
  {
    id: 'usr_hist_02',
    name: 'Deeksha Kenjale',
    email: 'deeksha.k@dna360.in',
    phone: '+919820090002',
    role: SEEDED_ROLE_DEFINITIONS[2],
    designation: 'fitness_consultant',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'inactive',
    can_view_revenue: false,
    pt_tier: null,
    requires_login: false,
  },
  {
    id: 'usr_hist_03',
    name: 'Kiran Solanki',
    email: 'kiran.s@dna360.in',
    phone: '+919820090003',
    role: SEEDED_ROLE_DEFINITIONS[2],
    designation: 'fitness_consultant',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'inactive',
    can_view_revenue: false,
    pt_tier: null,
    requires_login: false,
  },
  {
    id: 'usr_hist_04',
    name: 'Abhijit Mahdalkar',
    email: 'abhijit.m@dna360.in',
    phone: '+919820090004',
    role: SEEDED_ROLE_DEFINITIONS[2],
    designation: 'fitness_consultant',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'inactive',
    can_view_revenue: false,
    pt_tier: null,
    requires_login: false,
  },
  {
    id: 'usr_hist_05',
    name: 'Amita Galphade',
    email: 'amita.g@dna360.in',
    phone: '+919820090005',
    role: SEEDED_ROLE_DEFINITIONS[2],
    designation: 'fitness_consultant',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'inactive',
    can_view_revenue: false,
    pt_tier: null,
    requires_login: false,
  },
  {
    id: 'usr_hist_06',
    name: 'Vaishnavi Javia',
    email: 'vaishnavi.j@dna360.in',
    phone: '+919820090006',
    role: SEEDED_ROLE_DEFINITIONS[2],
    designation: 'fitness_consultant',
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'inactive',
    can_view_revenue: false,
    pt_tier: null,
    requires_login: false,
  },

  // ─── Member Sample ───
  {
    id: 'usr_member_01',
    name: 'Arjun Mehta',
    email: 'arjun.mehta@gmail.com',
    phone: '+919820011111',
    role: SEEDED_ROLE_DEFINITIONS[6],
    designation: 'supervisor', // dummy fallback
    branchId: 'pow',
    branches: [POWAI_BRANCH],
    status: 'active',
    can_view_revenue: false,
    pt_tier: null,
    requires_login: true,
    passwordHash: 'password123',
  },
]

export const SEEDED_ACTIVE_SESSIONS: UserSession[] = [
  {
    id: 'sess_cur_owner',
    userId: 'usr_owner_01',
    userName: 'Kevin Patel',
    userEmail: 'kevin@dna360.in',
    userRole: 'Owner / Executive',
    ipAddress: '103.21.126.14',
    userAgent: 'Chrome 128 (macOS Sonoma)',
    deviceType: 'Desktop',
    location: 'Mumbai, MH, India',
    lastActiveAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    isCurrent: true,
  },
  {
    id: 'sess_staff_sales_head',
    userId: 'usr_mgr_sales_head',
    userName: 'Vikramaditya Shinde',
    userEmail: 'vikram.sales@dna360.in',
    userRole: 'Asst. Sales Head',
    ipAddress: '103.21.126.14',
    userAgent: 'Safari 17 (iPadOS)',
    deviceType: 'Tablet',
    location: 'Mumbai, MH, India',
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    isCurrent: false,
  },
  {
    id: 'sess_staff_fc',
    userId: 'usr_fc_01',
    userName: 'Amit Sharma',
    userEmail: 'amit.sharma@dna360.in',
    userRole: 'Fitness Consultant',
    ipAddress: '192.168.1.105',
    userAgent: 'Chrome 128 (Windows 11 Desk Station 1)',
    deviceType: 'Desktop',
    location: 'Front Desk Terminal 1',
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 420).toISOString(),
    isCurrent: false,
  },
]

export function normaliseIndianPhone(input: string): string {
  const digits = input.replace(/\D/g, '')
  if (digits.startsWith('91') && digits.length === 12) {
    return `+${digits}`
  }
  if (digits.length === 10) {
    return `+91${digits}`
  }
  return input.startsWith('+') ? input : `+${input}`
}

export const normalizeIndianPhone = normaliseIndianPhone

export function getRoleDefaultRedirect(roleSlug: string): string {
  switch (roleSlug) {
    case 'member':
      return '/dashboard'
    case 'sales':
    case 'front_desk':
      return '/front-desk'
    case 'trainer':
      return '/schedule'
    case 'manager':
    case 'owner':
    default:
      return '/overview'
  }
}

/**
 * Returns all active sales reps (Fitness Consultants & Asst Sales Head)
 * plus historical inactive sales reps for attribution.
 */
export function getSalesReps(includeInactive = false): { id: string; name: string; isActive: boolean }[] {
  return SEEDED_USERS
    .filter(u => 
      (u.designation === 'fitness_consultant' || u.designation === 'asst_sales_head' || u.role.slug === 'owner') &&
      (includeInactive ? true : u.status === 'active')
    )
    .map(u => ({
      id: u.id,
      name: u.name,
      isActive: u.status === 'active',
    }))
}

/**
 * Returns all active trainers.
 */
export function getTrainers(): { id: string; name: string; designation: StaffDesignation; pt_tier: string | null }[] {
  return SEEDED_USERS
    .filter(u => (u.designation === 'head_trainer' || u.designation === 'general_trainer') && u.status === 'active')
    .map(u => ({
      id: u.id,
      name: u.name,
      designation: u.designation,
      pt_tier: u.pt_tier,
    }))
}
