/* ============================================================
   DNA 360 — Member Store & Service
   
   - Three-date lifecycle: enrolment → activation → expiry
   - Concurrent memberships (Gym + PT + Pilates + Locker)
   - No full Aadhaar stored (id_last_four only)
   - Per-channel marketing consent (SMS / Email / WhatsApp)
   - Special inclusions, complimentary, blacklisted, referrals
   - Pilates adjustment credits (2 per tenure)
   ============================================================ */

import type {
  Member,
  MemberFilterOptions,
  MemberStatus,
  StaffNote,
  FitnessMetric,
  MembershipRecord,
} from '@/types/member'
import { logAuditEvent } from '@/lib/audit'
import { normalizeIndianPhone } from '@/lib/auth'
import { getEffectiveStatus } from '@/lib/lifecycle'

const STORAGE_KEY = 'dna360_members'

export const SEEDED_MEMBERS: Member[] = [
  {
    id: 'mem_001',
    member_code: 'DNA-2025-0892',
    first_name: 'Arjun',
    last_name: 'Mehta',
    name: 'Arjun Mehta',
    email: 'arjun.mehta@gmail.com',
    phone: '+919820011111',
    gender: 'male',
    dob: '1992-05-14',
    joined_date: '2025-01-14',
    status: 'active',
    active_memberships: [
      {
        id: 'ms_001_gym',
        product_id: 'prod_001',
        product_name: 'Annual Gym Membership Package 1',
        product_category: 'gym_membership',
        enrolment_date: '2025-01-14',
        activation_date: '2025-01-15',
        expiry_date: '2027-01-15',
        amount_paid: 4350000,
        discount_amount: 0,
        discount_reason: null,
        discount_approved_by: null,
        tax_rate: 0.05,
        status: 'active',
        invoice_id: 'inv_001',
        invoice_number: 'DNA/2026-27/0001',
        sales_rep_id: 'usr_fc_01',
        sales_rep_name: 'Amit Sharma',
        sessions_total: null,
        sessions_consumed: null,
        sessions_remaining: null,
        access_window: null,
        void_reason: null,
        voided_by: null,
        voided_at: null,
        transferred_from: null,
        transferred_to: null,
        transfer_fee_invoice_id: null,
      },
      {
        id: 'ms_001_pt',
        product_id: 'prod_007',
        product_name: 'Premium PT — 12 Sessions',
        product_category: 'premium_pt',
        enrolment_date: '2026-04-02',
        activation_date: '2026-04-03',
        expiry_date: '2026-05-03',
        amount_paid: 2038800,
        discount_amount: 0,
        discount_reason: null,
        discount_approved_by: null,
        tax_rate: 0.05,
        status: 'active',
        invoice_id: 'inv_001',
        invoice_number: 'DNA/2026-27/0001',
        sales_rep_id: 'usr_fc_01',
        sales_rep_name: 'Amit Sharma',
        sessions_total: 12,
        sessions_consumed: 4,
        sessions_remaining: 8,
        access_window: null,
        void_reason: null,
        voided_by: null,
        voided_at: null,
        transferred_from: null,
        transferred_to: null,
        transfer_fee_invoice_id: null,
      },
    ],
    past_memberships: [],
    kyc: {
      id_type: 'Aadhaar',
      id_last_four: '8912',
      id_verified: true,
      id_verifier: 'Amit Sharma',
      id_verified_at: '2025-01-14T10:00:00Z',
      blood_group: 'O+',
      emergency_contact_name: 'Kavita Mehta',
      emergency_contact_phone: '+919820099999',
      emergency_contact_relation: 'Spouse',
      medical_notes: 'None',
      injuries: 'Right shoulder impingement (rehabilitated 2024)',
    },
    consent: {
      sms: true,
      email: true,
      whatsapp: false, // Must be captured fresh
      updated_at: '2025-01-14T10:00:00Z',
    },
    attendance_streak: 14,
    last_visit_at: '2026-08-24T06:30:00Z',
    total_check_ins: 184,
    fitness_metrics: [
      { id: 'fm_1', date: '2025-01-15', weightKg: 82.5, bodyFatPct: 22.4, bmi: 26.1, muscleMassKg: 61.2 },
      { id: 'fm_2', date: '2025-06-15', weightKg: 78.2, bodyFatPct: 18.1, bmi: 24.7, muscleMassKg: 62.0 },
      { id: 'fm_3', date: '2026-01-10', weightKg: 75.8, bodyFatPct: 15.6, bmi: 23.9, muscleMassKg: 62.8 },
    ],
    staff_notes: [
      {
        id: 'sn_1',
        authorId: 'usr_tr_head_01',
        authorName: 'Rajesh Poojary',
        authorRole: 'Head Trainer',
        timestamp: '2026-02-10T10:00:00Z',
        content: 'Progression on Romanian Deadlifts is steady. Moved from 80kg to 100kg working sets.',
        type: 'general',
      },
    ],
    tags: ['VIP Member', 'Founder', 'High Compliance'],
    blacklisted: false,
    blacklist_reason: null,
    blacklisted_by: null,
    blacklisted_at: null,
    complimentary: false,
    special_inclusions: 'Complimentary locker access & valet parking on weekends',
    referred_by: null,
    referral_code: 'ARJUN360',
    lifetime_value: 6388800,
    media_consent: true,
    adjustment_credits_remaining: 0,
    assigned_trainer_id: 'usr_tr_head_01',
    assigned_trainer_name: 'Rajesh Poojary',
  },
  {
    id: 'mem_002',
    member_code: 'DNA-2025-1043',
    first_name: 'Priya',
    last_name: 'Sharma',
    name: 'Priya Sharma',
    email: 'priya.s@outlook.com',
    phone: '+919820022222',
    gender: 'female',
    dob: '1988-11-22',
    joined_date: '2025-03-01',
    status: 'active',
    active_memberships: [
      {
        id: 'ms_002_pilates',
        product_id: 'prod_029',
        product_name: 'Reformer Pilates — 36 Sessions (3 Months)',
        product_category: 'reformer_pilates',
        enrolment_date: '2026-04-05',
        activation_date: '2026-04-06',
        expiry_date: '2026-07-06',
        amount_paid: 4463700,
        discount_amount: 0,
        discount_reason: null,
        discount_approved_by: null,
        tax_rate: 0.05,
        status: 'active',
        invoice_id: 'inv_002',
        invoice_number: 'DNA/2026-27/0002',
        sales_rep_id: 'usr_fc_02',
        sales_rep_name: 'Neha Kapoor',
        sessions_total: 36,
        sessions_consumed: 14,
        sessions_remaining: 22,
        access_window: null,
        void_reason: null,
        voided_by: null,
        voided_at: null,
        transferred_from: null,
        transferred_to: null,
        transfer_fee_invoice_id: null,
      },
    ],
    past_memberships: [],
    kyc: {
      id_type: 'Passport',
      id_last_four: '4421',
      id_verified: true,
      id_verifier: 'Neha Kapoor',
      id_verified_at: '2025-03-01T14:00:00Z',
      blood_group: 'B+',
      emergency_contact_name: 'Rohit Sharma',
      emergency_contact_phone: '+919820088888',
      emergency_contact_relation: 'Spouse',
      medical_notes: 'Lower back stiffness from desk work',
      injuries: 'L4-L5 mild disc bulge (cleared for Pilates)',
    },
    consent: {
      sms: true,
      email: true,
      whatsapp: false,
      updated_at: '2025-03-01T14:00:00Z',
    },
    attendance_streak: 8,
    last_visit_at: '2026-08-23T07:15:00Z',
    total_check_ins: 92,
    fitness_metrics: [
      { id: 'fm_4', date: '2025-03-02', weightKg: 62.0, bodyFatPct: 24.2, bmi: 22.8, muscleMassKg: 44.5 },
    ],
    staff_notes: [],
    tags: ['Pilates Core', 'Referral Advocate'],
    blacklisted: false,
    blacklist_reason: null,
    blacklisted_by: null,
    blacklisted_at: null,
    complimentary: false,
    special_inclusions: null,
    referred_by: 'mem_001', // Referred by Arjun Mehta
    referral_code: 'PRIYA360',
    lifetime_value: 4463700,
    media_consent: true,
    adjustment_credits_remaining: 2, // 2 missed session adjustments per tenure
    assigned_trainer_id: 'usr_tr_03',
    assigned_trainer_name: 'Sneha Rao',
  },
  {
    id: 'mem_003',
    member_code: 'DNA-2025-1190',
    first_name: 'Vikram',
    last_name: 'Singh',
    name: 'Vikram Singh',
    email: 'vikram.singh@gmail.com',
    phone: '+919820033333',
    gender: 'male',
    dob: '1985-08-30',
    joined_date: '2025-05-20',
    status: 'grace_period', // In 7-day grace period
    active_memberships: [
      {
        id: 'ms_003_gym',
        product_id: 'prod_004',
        product_name: 'Annual Happy Hours Gym Membership',
        product_category: 'gym_membership',
        enrolment_date: '2025-08-20',
        activation_date: '2025-08-21',
        expiry_date: '2026-08-21', // Expired 7 days ago -> Grace period
        amount_paid: 2999900,
        discount_amount: 0,
        discount_reason: null,
        discount_approved_by: null,
        tax_rate: 0.05,
        status: 'active',
        invoice_id: 'inv_legacy_003',
        invoice_number: 'DNA/2025-26/0412',
        sales_rep_id: 'usr_hist_01', // Sold by Swati (historical sales rep)
        sales_rep_name: 'Swati',
        sessions_total: null,
        sessions_consumed: null,
        sessions_remaining: null,
        access_window: { start: '12:00', end: '15:30' },
        void_reason: null,
        voided_by: null,
        voided_at: null,
        transferred_from: null,
        transferred_to: null,
        transfer_fee_invoice_id: null,
      },
    ],
    past_memberships: [],
    kyc: {
      id_type: 'Driving License',
      id_last_four: '7721',
      id_verified: true,
      id_verifier: 'Amit Sharma',
      id_verified_at: '2025-05-20T11:00:00Z',
      blood_group: 'A+',
      emergency_contact_name: 'Manish Singh',
      emergency_contact_phone: '+919820077777',
      emergency_contact_relation: 'Brother',
      medical_notes: null,
      injuries: null,
    },
    consent: {
      sms: true,
      email: false,
      whatsapp: false,
      updated_at: '2025-05-20T11:00:00Z',
    },
    attendance_streak: 2,
    last_visit_at: '2026-08-26T13:00:00Z',
    total_check_ins: 110,
    fitness_metrics: [],
    staff_notes: [],
    tags: ['Happy Hours', 'Renewal Pending'],
    blacklisted: false,
    blacklist_reason: null,
    blacklisted_by: null,
    blacklisted_at: null,
    complimentary: false,
    special_inclusions: null,
    referred_by: null,
    referral_code: 'VIKRAM360',
    lifetime_value: 2999900,
    media_consent: null,
    adjustment_credits_remaining: 0,
    assigned_trainer_id: null,
    assigned_trainer_name: null,
  },
]

// ─── Storage Helpers ───

export function getStoredMembers(): Member[] {
  let list = SEEDED_MEMBERS
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEEDED_MEMBERS))
      list = SEEDED_MEMBERS
    } else {
      try { list = JSON.parse(stored) } catch { list = SEEDED_MEMBERS }
    }
  }
  return list.map(m => ({ ...m, memberCode: m.member_code }))
}

export function saveMembers(members: Member[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(members))
  window.dispatchEvent(new Event('dna360_members_updated'))
}

// ─── Queries ───

export function getMembers(filters: MemberFilterOptions = {}): Member[] {
  let list = getStoredMembers()

  if (filters.search) {
    const q = filters.search.toLowerCase().trim()
    list = list.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.member_code.toLowerCase().includes(q) ||
      m.phone.includes(q) ||
      (m.email && m.email.toLowerCase().includes(q))
    )
  }

  if (filters.status && filters.status !== 'all') {
    list = list.filter(m => {
      // Re-evaluate dynamic status
      if (m.blacklisted) return filters.status === 'blacklisted'
      const hasGrace = m.active_memberships.some(ms => getEffectiveStatus(ms) === 'grace_period')
      const hasActive = m.active_memberships.some(ms => getEffectiveStatus(ms) === 'active')
      if (filters.status === 'grace_period') return hasGrace
      if (filters.status === 'active') return hasActive
      if (filters.status === 'inactive') return !hasActive && !hasGrace
      return m.status === filters.status
    })
  }

  if (filters.blacklisted !== undefined) {
    list = list.filter(m => m.blacklisted === filters.blacklisted)
  }

  if (filters.complimentary !== undefined) {
    list = list.filter(m => m.complimentary === filters.complimentary)
  }

  return list.sort((a, b) => new Date(b.joined_date).getTime() - new Date(a.joined_date).getTime())
}

export function getMemberById(id: string): Member | null {
  return getStoredMembers().find(m => m.id === id) || null
}

export function createMember(data: Partial<Member> & Pick<Member, 'first_name' | 'last_name' | 'phone'>): Member {
  const members = getStoredMembers()
  const currentYear = new Date().getFullYear()
  const code = data.member_code || `DNA-${currentYear}-${String(members.length + 1).padStart(4, '0')}`
  const firstName = data.first_name.trim()
  const lastName = data.last_name.trim()
  const activeMemberships = data.active_memberships || []

  const newMember: Member = {
    id: data.id || `mem_${Date.now()}`,
    member_code: code,
    memberCode: code,
    first_name: firstName,
    last_name: lastName,
    name: data.name || `${firstName} ${lastName}`,
    email: data.email || null,
    phone: normalizeIndianPhone(data.phone),
    gender: data.gender || 'other',
    dob: data.dob || null,
    joined_date: data.joined_date || new Date().toISOString().slice(0, 10),
    status: data.status || 'active',
    active_memberships: activeMemberships,
    past_memberships: data.past_memberships || [],
    kyc: data.kyc || {
      id_type: null,
      id_last_four: null,
      id_verified: false,
      id_verifier: null,
      id_verified_at: null,
      blood_group: null,
      emergency_contact_name: null,
      emergency_contact_phone: null,
      emergency_contact_relation: null,
      medical_notes: null,
      injuries: null,
    },
    consent: data.consent || {
      sms: true,
      email: !!data.email,
      whatsapp: false,
      updated_at: new Date().toISOString(),
    },
    attendance_streak: data.attendance_streak || 0,
    last_visit_at: data.last_visit_at || null,
    total_check_ins: data.total_check_ins || 0,
    fitness_metrics: data.fitness_metrics || [],
    staff_notes: data.staff_notes || [],
    tags: data.tags || [],
    blacklisted: data.blacklisted || false,
    blacklist_reason: data.blacklist_reason || null,
    blacklisted_by: data.blacklisted_by || null,
    blacklisted_at: data.blacklisted_at || null,
    complimentary: data.complimentary || false,
    special_inclusions: data.special_inclusions || null,
    referred_by: data.referred_by || null,
    referral_code: data.referral_code || `${firstName.toUpperCase()}${code.slice(-3)}`,
    lifetime_value: data.lifetime_value || activeMemberships.reduce((acc, m) => acc + m.amount_paid, 0),
    media_consent: data.media_consent || null,
    adjustment_credits_remaining: data.adjustment_credits_remaining ?? 2,
    assigned_trainer_id: data.assigned_trainer_id || null,
    assigned_trainer_name: data.assigned_trainer_name || null,
  }

  members.unshift(newMember)
  saveMembers(members)

  logAuditEvent({
    actor: { id: 'system', name: 'Front Desk', email: '', role: 'Staff' },
    action: 'CREATE',
    entity: 'Member',
    entityId: newMember.id,
    branchId: 'pow',
    description: `Registered new member ${newMember.name} (${newMember.member_code})`,
    afterState: newMember,
  })

  return newMember
}

export function updateMember(id: string, updates: Partial<Member>): Member | null {
  const members = getStoredMembers()
  const index = members.findIndex(m => m.id === id)
  if (index === -1) return null

  const before = members[index]
  const updated = { ...before, ...updates }
  members[index] = updated
  saveMembers(members)

  logAuditEvent({
    actor: { id: 'system', name: 'Staff', email: '', role: 'Staff' },
    action: 'UPDATE',
    entity: 'Member',
    entityId: id,
    branchId: 'pow',
    description: `Updated member profile for ${updated.name}`,
    beforeState: before,
    afterState: updated,
  })

  return updated
}

export function addMembershipToMember(memberId: string, membership: MembershipRecord): Member | null {
  const member = getMemberById(memberId)
  if (!member) return null

  const updatedActive = [...member.active_memberships, membership]
  const updatedLtv = member.lifetime_value + membership.amount_paid

  return updateMember(memberId, {
    active_memberships: updatedActive,
    lifetime_value: updatedLtv,
    status: 'active',
  })
}

export function blacklistMember(params: {
  memberId: string
  reason: string
  blacklistedBy: string
}): Member | null {
  return updateMember(params.memberId, {
    blacklisted: true,
    blacklist_reason: params.reason,
    blacklisted_by: params.blacklistedBy,
    blacklisted_at: new Date().toISOString(),
    status: 'blacklisted',
  })
}

export function unblacklistMember(memberId: string): Member | null {
  return updateMember(memberId, {
    blacklisted: false,
    blacklist_reason: null,
    blacklisted_by: null,
    blacklisted_at: null,
    status: 'active',
  })
}

export function addStaffNote(memberId: string, note: Omit<StaffNote, 'id' | 'timestamp'>): Member | null {
  const member = getMemberById(memberId)
  if (!member) return null

  const newNote: StaffNote = {
    ...note,
    id: `sn_${Date.now()}`,
    timestamp: new Date().toISOString(),
  }

  return updateMember(memberId, {
    staff_notes: [newNote, ...member.staff_notes],
  })
}

export function addFitnessMetric(memberId: string, metric: Omit<FitnessMetric, 'id'>): Member | null {
  const member = getMemberById(memberId)
  if (!member) return null

  const newMetric: FitnessMetric = {
    ...metric,
    id: `fm_${Date.now()}`,
  }

  return updateMember(memberId, {
    fitness_metrics: [...member.fitness_metrics, newMetric],
  })
}
