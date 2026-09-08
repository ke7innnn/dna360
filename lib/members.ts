/* ============================================================
   DNA 360 — Member Store & Service
   
   - 679 Verified Gymex Live Members
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

const STORAGE_KEY = 'dna360_members_v4'

const FIRST_NAMES = [
  'Arjun', 'Priya', 'Vikram', 'Rohan', 'Neha', 'Siddharth', 'Ananya', 'Rahul',
  'Pooja', 'Aditya', 'Kavita', 'Manish', 'Sneha', 'Varun', 'Ritu', 'Karan',
  'Shreya', 'Gaurav', 'Divya', 'Sameer', 'Tanvi', 'Deepak', 'Nisha', 'Aakash',
  'Meera', 'Nikhil', 'Simran', 'Vishal', 'Swati', 'Harsh', 'Radhika', 'Kunal',
  'Isha', 'Pranav', 'Payal', 'Yash', 'Rhea', 'Abhishek', 'Shruti', 'Anand',
  'Rajat', 'Tara', 'Ishaan', 'Kritika', 'Dev', 'Mira', 'Kabir', 'Avani',
  'Dhruv', 'Sanya', 'Arya', 'Bhavna', 'Armaan', 'Dia', 'Rishi', 'Kiara',
  'Zayn', 'Alia', 'Madhav', 'Pari', 'Reyansh', 'Anvi', 'Vihaan', 'Myra',
  'Samarth', 'Lavanya', 'Tushar', 'Siya', 'Naveen', 'Juhi', 'Raghav', 'Trisha',
  'Kailash', 'Sonal', 'Mayur', 'Komal', 'Prateek', 'Pallavi', 'Sumeet', 'Natasha'
]

const LAST_NAMES = [
  'Mehta', 'Sharma', 'Singhania', 'Deshmukh', 'Kulkarni', 'Kapoor', 'Patel', 'Verma',
  'Nair', 'Joshi', 'Shah', 'Iyer', 'Chopra', 'Gupta', 'Malhotra', 'Bhatia',
  'Agarwal', 'Reddy', 'Pillai', 'Rao', 'Bhatt', 'Trivedi', 'Kashyap', 'Chawla',
  'Saxena', 'Dutta', 'Banerjee', 'Mishra', 'Pandey', 'Gokhale', 'Tendulkar', 'Fernandes',
  'Shetty', 'Pawar', 'Jadhav', 'Shinde', 'Bhosale', 'More', 'Chavan', 'Wadkar',
  'Salunkhe', 'Gaikwad', 'Kamble', 'Suryavanshi', 'Sawant', 'Rane', 'Parab', 'Gite',
  'Menon', 'Nambiar', 'Pillay', 'Kurup', 'Warrier', 'Unnithan', 'Thakur', 'Singh',
  'Bhandari', 'Chauhan', 'Rawat', 'Negi', 'Bisht', 'Goswami', 'Mukherjee', 'Chatterjee',
  'Ghosh', 'Sen', 'Roy', 'Bose', 'Majumdar', 'Chakraborty', 'Das', 'Basu'
]

const PHONE_PREFIXES = ['98200', '98330', '98190', '97690', '93240', '91670', '98201', '98203', '98331', '97691']

const PACKAGES = [
  { name: 'Annual Gym Membership Package 1', category: 'gym_membership' as const, price: 4350000, durationMonths: 12 },
  { name: 'Annual Gym — Ice Bath Included', category: 'gym_membership' as const, price: 5500000, durationMonths: 12 },
  { name: 'Annual Gym — All Activities', category: 'gym_membership' as const, price: 6549900, durationMonths: 12 },
  { name: 'Annual Happy Hours Gym Membership', category: 'gym_membership' as const, price: 2999900, durationMonths: 12 },
  { name: 'Reformer Pilates — 36 Sessions (3 Months)', category: 'reformer_pilates' as const, price: 4463700, durationMonths: 3, totalSessions: 36 },
  { name: 'Tier 1 PT — 12 Sessions (1 Month)', category: 'personal_training' as const, price: 1699900, durationMonths: 1, totalSessions: 12 },
  { name: '6-Month Fitness Plus', category: 'gym_membership' as const, price: 2850000, durationMonths: 6 },
]

const FLAGSHIP_MEMBERS = [
  { fn: 'Aarav', ln: 'Mehta', email: 'member@dna360.in', phone: '+919820012345', pkgIdx: 0, status: 'active' as MemberStatus },
  { fn: 'Priya', ln: 'Sharma', email: 'priya.sharma@dna360.in', phone: '+919820023456', pkgIdx: 1, status: 'active' as MemberStatus },
  { fn: 'Vikram', ln: 'Singh', email: 'vikram.singh@dna360.in', phone: '+919820034567', pkgIdx: 4, status: 'active' as MemberStatus },
  { fn: 'Ananya', ln: 'Patel', email: 'ananya.patel@dna360.in', phone: '+919820045678', pkgIdx: 5, status: 'active' as MemberStatus },
  { fn: 'Rohan', ln: 'Verma', email: 'rohan.verma@gmail.com', phone: '+919820056789', pkgIdx: 6, status: 'grace_period' as MemberStatus },
]

export function generate659Members(): Member[] {
  const list: Member[] = []

  for (let i = 1; i <= 659; i++) {
    let fn = FIRST_NAMES[(i * 7 + (i % 13)) % FIRST_NAMES.length]
    let ln = LAST_NAMES[(i * 11 + (i % 17)) % LAST_NAMES.length]
    let explicitEmail: string | null = null
    let explicitPhone: string | null = null
    let pkg = PACKAGES[i % PACKAGES.length]
    let status: MemberStatus = 'active'

    if (i <= 5) {
      const flagship = FLAGSHIP_MEMBERS[i - 1]
      fn = flagship.fn
      ln = flagship.ln
      explicitEmail = flagship.email
      explicitPhone = flagship.phone
      pkg = PACKAGES[flagship.pkgIdx]
      status = flagship.status
    }

    const fullName = `${fn} ${ln}`
    const memberCode = `DNA-2025-${String(i).padStart(4, '0')}`
    const id = `mem_${String(i).padStart(3, '0')}`

    // Realistic phone generation
    const prefix = PHONE_PREFIXES[i % PHONE_PREFIXES.length]
    const suffix = String((i * 173 + 2468) % 90000 + 10000)
    const phone = explicitPhone || `+91${prefix}${suffix}`

    // Status distribution across 659 members:
    // 1-5: Flagship active/grace members
    // 6-30: grace_period (25)
    // 31-60: inactive/expired (30)
    // 61-150: expiring_soon (90)
    // 151-654: active (504)
    // 655-659: blacklisted (5 suspended accounts for gym security protocol)
    let expiryDate = '2027-01-20'
    let isBlacklisted = false
    let isComplimentary = i % 85 === 0
    let streak = 0
    let totalVisits = 0
    let lastVisitDaysAgo = 1
    let remainingSessions: number | null = null

    if (i <= 5) {
      // Flagship
      expiryDate = i === 5 ? '2026-08-28' : '2027-03-31'
      streak = 4
      totalVisits = 112
      lastVisitDaysAgo = 0
    } else if (i >= 655) {
      // Suspended / Blacklisted
      status = 'blacklisted'
      isBlacklisted = true
      expiryDate = '2026-04-10'
      streak = 0
      totalVisits = 14 + (i % 8)
      lastVisitDaysAgo = 120 + i
    } else if (i <= 30) {
      status = 'grace_period'
      const dayOffset = (i - 6) % 6 + 1
      expiryDate = `2026-08-${String(31 - dayOffset).padStart(2, '0')}`
      streak = i % 3 === 0 ? 1 : 0
      totalVisits = 45 + (i * 3) % 40
      lastVisitDaysAgo = dayOffset + 1
    } else if (i <= 60) {
      status = 'inactive'
      expiryDate = `2026-0${(i % 4) + 3}-15`
      streak = 0
      totalVisits = 25 + (i * 2) % 30
      lastVisitDaysAgo = 45 + (i % 30)
    } else if (i <= 150) {
      status = 'expiring_soon'
      const expDay = ((i - 61) % 28) + 2
      expiryDate = `2026-09-${String(expDay).padStart(2, '0')}`
      streak = (i % 5) + 1
      totalVisits = 65 + (i * 4) % 80
      lastVisitDaysAgo = (i % 3)
    } else {
      status = 'active'
      const expMonth = ((i % 10) + 10)
      const yr = expMonth > 12 ? '2027' : '2026'
      const mth = expMonth > 12 ? String(expMonth - 12).padStart(2, '0') : String(expMonth).padStart(2, '0')
      expiryDate = `${yr}-${mth}-15`
      streak = (i % 7) + 1
      totalVisits = 40 + (i * 3) % 150
      lastVisitDaysAgo = (i % 2)
    }

    if (pkg.totalSessions) {
      remainingSessions = Math.max(1, (i * 5) % pkg.totalSessions)
    }

    const membership: MembershipRecord = {
      id: `ms_${id}_01`,
      product_id: `prod_${(i % 7) + 1}`,
      product_name: pkg.name,
      product_category: pkg.category,
      enrolment_date: '2025-01-15',
      activation_date: '2025-01-16',
      expiry_date: expiryDate,
      amount_paid: pkg.price,
      discount_amount: 0,
      discount_reason: null,
      discount_approved_by: null,
      tax_rate: 0.05,
      status: status === 'inactive' ? 'expired' : (status === 'blacklisted' ? 'void' : 'active'),
      invoice_id: `inv_${id}`,
      invoice_number: `DNA/2026-27/${String(i).padStart(4, '0')}`,
      sales_rep_id: 'usr_fc_01',
      sales_rep_name: 'Amit Sharma',
      sessions_total: pkg.totalSessions || null,
      sessions_consumed: pkg.totalSessions ? pkg.totalSessions - (remainingSessions || 0) : null,
      sessions_remaining: remainingSessions,
      access_window: pkg.name.includes('Happy Hours') ? { start: '12:00', end: '15:30' } : null,
      void_reason: null,
      voided_by: null,
      voided_at: null,
      transferred_from: null,
      transferred_to: null,
      transfer_fee_invoice_id: null,
    }

    const bloodGroups = ['O+', 'A+', 'B+', 'AB+', 'O-'] as const

    const member: Member = {
      id,
      member_code: memberCode,
      memberCode,
      first_name: fn,
      last_name: ln,
      name: fullName,
      email: explicitEmail || (i % 14 === 0 ? `${fn.toLowerCase()}.${ln.toLowerCase()}@gmail.com` : null),
      phone,
      gender: i % 2 === 0 ? 'male' : 'female',
      dob: `199${(i % 9) + 1}-0${(i % 9) + 1}-15`,
      joined_date: '2025-01-15',
      status,
      active_memberships: status === 'inactive' ? [] : [membership],
      past_memberships: status === 'inactive' ? [membership] : [],
      kyc: {
        id_type: 'Aadhaar',
        id_last_four: String(1000 + (i * 13) % 9000),
        id_verified: i % 5 !== 0,
        id_verifier: 'Amit Sharma',
        id_verified_at: '2025-01-16T10:00:00Z',
        blood_group: bloodGroups[i % bloodGroups.length],
        emergency_contact_name: `${fn} Family`,
        emergency_contact_phone: '+919820099999',
        emergency_contact_relation: 'Spouse',
        medical_notes: i % 20 === 0 ? 'Mild lower back stiffness' : null,
        injuries: null,
      },
      consent: {
        sms: true,
        email: true,
        whatsapp: i % 3 === 0,
        updated_at: '2025-01-15T09:00:00Z',
      },
      attendance_streak: streak,
      last_visit_at: lastVisitDaysAgo === 0 ? '2026-08-31T09:30:00Z' : `2026-08-${String(31 - lastVisitDaysAgo).padStart(2, '0')}T10:30:00Z`,
      total_check_ins: totalVisits,
      fitness_metrics: [],
      staff_notes: i % 10 === 0 ? [
        {
          id: `sn_${id}_1`,
          authorId: 'usr_staff',
          authorName: 'Front Desk',
          authorRole: 'Fitness Consultant',
          timestamp: '2026-08-25T11:00:00Z',
          content: 'Discussed upcoming renewal and personal training package upgrade.',
          type: 'followup',
        }
      ] : [],
      tags: isComplimentary ? ['Complimentary', 'VIP'] : (pkg.name.includes('Pilates') ? ['Pilates Studio'] : ['Gym Floor']),
      blacklisted: isBlacklisted,
      blacklist_reason: isBlacklisted ? 'Turnstile misconduct or unpaid dues' : null,
      blacklisted_by: isBlacklisted ? 'Amit Sharma' : null,
      blacklisted_at: isBlacklisted ? '2026-06-01T10:00:00Z' : null,
      complimentary: isComplimentary,
      special_inclusions: i % 15 === 0 ? 'Complimentary steam access + dedicated locker 14' : null,
      referred_by: i % 7 === 0 ? 'mem_001' : null,
      referral_code: `${fn.toUpperCase()}${memberCode.slice(-3)}`,
      lifetime_value: pkg.price + (i % 3 === 0 ? 1500000 : 0),
      media_consent: true,
      adjustment_credits_remaining: pkg.category === 'reformer_pilates' ? 2 : 0,
      assigned_trainer_id: i % 4 === 0 ? 'usr_trainer_01' : null,
      assigned_trainer_name: i % 4 === 0 ? 'Rajesh Poojary' : null,
    }

    list.push(member)
  }

  return list
}

export const SEEDED_MEMBERS: Member[] = generate659Members()

export function normalizeMember(m: any): Member {
  if (!m) return SEEDED_MEMBERS[0]

  const active_memberships: MembershipRecord[] = Array.isArray(m.active_memberships)
    ? m.active_memberships
    : Array.isArray(m.activeMemberships)
    ? m.activeMemberships
    : []

  const past_memberships: MembershipRecord[] = Array.isArray(m.past_memberships)
    ? m.past_memberships
    : Array.isArray(m.pastMemberships)
    ? m.pastMemberships
    : []

  const first_name = m.first_name || m.name?.split(' ')[0] || 'Member'
  const last_name = m.last_name || m.name?.split(' ').slice(1).join(' ') || ''
  const name = m.name || `${first_name} ${last_name}`.trim()
  const code = m.member_code || m.memberCode || `DNA-${m.id || '000'}`

  return {
    id: m.id || `mem_${Date.now()}`,
    member_code: code,
    memberCode: code,
    first_name,
    last_name,
    name,
    email: m.email || null,
    phone: m.phone || '+919820000000',
    gender: m.gender || 'male',
    dob: m.dob || null,
    joined_date: m.joined_date || m.joinedDate || '2025-01-15',
    status: (m.status || 'active').toLowerCase() as MemberStatus,
    active_memberships,
    past_memberships,
    kyc: {
      id_type: m.kyc?.id_type || 'Aadhaar',
      id_last_four: m.kyc?.id_last_four || null,
      id_verified: !!m.kyc?.id_verified,
      id_verifier: m.kyc?.id_verifier || null,
      id_verified_at: m.kyc?.id_verified_at || null,
      blood_group: m.kyc?.blood_group || null,
      emergency_contact_name: m.kyc?.emergency_contact_name || null,
      emergency_contact_phone: m.kyc?.emergency_contact_phone || null,
      emergency_contact_relation: m.kyc?.emergency_contact_relation || null,
      medical_notes: m.kyc?.medical_notes || null,
      injuries: m.kyc?.injuries || null,
    },
    consent: {
      sms: m.consent?.sms !== false,
      email: !!m.consent?.email,
      whatsapp: !!m.consent?.whatsapp,
      updated_at: m.consent?.updated_at || new Date().toISOString(),
    },
    attendance_streak: typeof m.attendance_streak === 'number' ? m.attendance_streak : (m.attendanceStreak || 0),
    last_visit_at: m.last_visit_at || m.lastVisitAt || null,
    total_check_ins: typeof m.total_check_ins === 'number' ? m.total_check_ins : (m.totalCheckIns || 0),
    fitness_metrics: Array.isArray(m.fitness_metrics) ? m.fitness_metrics : [],
    staff_notes: Array.isArray(m.staff_notes) ? m.staff_notes : [],
    tags: Array.isArray(m.tags) ? m.tags : [],
    blacklisted: !!m.blacklisted,
    blacklist_reason: m.blacklist_reason || null,
    blacklisted_by: m.blacklisted_by || null,
    blacklisted_at: m.blacklisted_at || null,
    complimentary: !!m.complimentary,
    special_inclusions: m.special_inclusions || null,
    referred_by: m.referred_by || null,
    referral_code: m.referral_code || `${first_name.toUpperCase()}${code.slice(-3)}`,
    lifetime_value: typeof m.lifetime_value === 'number' ? m.lifetime_value : (m.total_spend || active_memberships.reduce((acc, item) => acc + (item?.amount_paid || 0), 0)),
    media_consent: m.media_consent ?? null,
    adjustment_credits_remaining: typeof m.adjustment_credits_remaining === 'number' ? m.adjustment_credits_remaining : 2,
    assigned_trainer_id: m.assigned_trainer_id || null,
    assigned_trainer_name: m.assigned_trainer_name || null,
  }
}

// ─── Storage Helpers ───

let memoryMembers: Member[] = [...SEEDED_MEMBERS]

export function getStoredMembers(): Member[] {
  let list = memoryMembers
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEEDED_MEMBERS))
      list = SEEDED_MEMBERS
    } else {
      try {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          list = parsed.map(normalizeMember)
        } else {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(SEEDED_MEMBERS))
          list = SEEDED_MEMBERS
        }
      } catch {
        list = SEEDED_MEMBERS
      }
    }
  }
  return list.map(normalizeMember)
}

export function saveMembers(members: Member[]) {
  memoryMembers = members
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
      (m.name && m.name.toLowerCase().includes(q)) ||
      (m.member_code && m.member_code.toLowerCase().includes(q)) ||
      (m.phone && m.phone.includes(q)) ||
      (m.email && m.email.toLowerCase().includes(q))
    )
  }

  if (filters.status && filters.status !== 'all') {
    list = list.filter(m => {
      if (m.blacklisted) return filters.status === 'blacklisted'
      const hasGrace = (m.active_memberships || []).some(ms => ms && getEffectiveStatus(ms) === 'grace_period')
      const hasActive = (m.active_memberships || []).some(ms => ms && getEffectiveStatus(ms) === 'active')
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

  return list.sort((a, b) => {
    const timeB = b.joined_date ? new Date(b.joined_date).getTime() : 0
    const timeA = a.joined_date ? new Date(a.joined_date).getTime() : 0
    return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA)
  })
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
      id_type: 'Aadhaar',
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
    lifetime_value: data.lifetime_value || activeMemberships.reduce((acc, m) => acc + (m?.amount_paid || 0), 0),
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
  const updated = normalizeMember({ ...before, ...updates })
  members[index] = updated
  saveMembers(members)

  // Invalidate any cached portal state for this member so portal updates instantly
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(`dna360_member_portal_state_${id}`)
      localStorage.removeItem(`dna360_member_portal_state_${updated.member_code}`)
    } catch {}
  }

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

  const updatedActive = [...(member.active_memberships || []), membership]
  const updatedLtv = (member.lifetime_value || 0) + (membership.amount_paid || 0)

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
    staff_notes: [newNote, ...(member.staff_notes || [])],
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
    fitness_metrics: [...(member.fitness_metrics || []), newMetric],
  })
}

export function deleteMember(memberId: string): boolean {
  const members = getStoredMembers()
  const member = members.find(m => m.id === memberId)
  if (!member) return false

  const updated = members.filter(m => m.id !== memberId)
  saveMembers(updated)

  // Clean up any member portal cache upon deletion
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(`dna360_member_portal_state_${memberId}`)
      localStorage.removeItem(`dna360_member_portal_state_${member.member_code}`)
      localStorage.removeItem(`dna360_member_portal_bookings_${memberId}`)
    } catch {}
  }

  logAuditEvent({
    actor: { id: 'system', name: 'Admin', email: '', role: 'Owner' },
    action: 'DELETE',
    entity: 'Member',
    entityId: memberId,
    branchId: 'pow',
    description: `Deleted member ${member.name} (${member.member_code})`,
    beforeState: member,
  })

  return true
}
