/* ============================================================
   DNA 360 — Leads & CRM Store
   
   Taxonomy from client's actual data:
   - LeadType: Walk In · Referral · Phone · Event · Website · Other
   - LeadSource: Word Of Mouth · Referral · Website · Ask Me ·
     Facebook · Train Ads · Passing By · Posters · Instagram · Google · Other
   - Assigned to Fitness Consultants
   - Conversion to Member pipeline
   ============================================================ */

import type {
  CrmLead,
  LeadStage,
  LeadType,
  LeadSource,
  CrmKpis,
  LeadActivity,
} from '@/types/leads'
import { logAuditEvent } from '@/lib/audit'
import { createMember } from '@/lib/members'
import { createInAppNotification } from '@/lib/notifications'

const LEADS_CRM_STORAGE_KEY = 'dna360_crm_leads'

export const SEEDED_CRM_LEADS: CrmLead[] = [
  {
    id: 'crm_001',
    name: 'Siddharth Rao',
    phone: '+919820099444',
    email: 'sid.rao@gmail.com',
    type: 'Website',
    source: 'Instagram',
    stage: 'inquiry',
    goal: 'Muscle Gain / Hypertrophy',
    expectedDealValueMinor: 4350000, // ₹43,500
    assignedRepId: 'usr_fc_01',
    assignedRepName: 'Amit Sharma',
    notes: 'Clicked Instagram reel ad on CrossFit turf. Wants morning workout slot.',
    activityLog: [
      {
        id: 'act_01',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
        type: 'note',
        text: 'Inbound lead captured via Meta Ads campaign.',
        actor: 'System',
      },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: 'crm_002',
    name: 'Gaurav Kripalani',
    phone: '+919820099666',
    email: 'gaurav.k@outlook.com',
    type: 'Referral',
    source: 'Word Of Mouth',
    stage: 'trial_scheduled',
    goal: 'Athletic Conditioning',
    expectedDealValueMinor: 4350000,
    assignedRepId: 'usr_fc_01',
    assignedRepName: 'Amit Sharma',
    trialPassCode: 'TRIAL-POW-2026-0881',
    trialDate: new Date().toISOString().slice(0, 10),
    nextFollowUpDate: '2026-08-25',
    isOverdue: true,
    notes: 'Referred by Arjun Mehta. 1-Day Trial QR pass issued for CrossFit session.',
    activityLog: [
      {
        id: 'act_02',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        type: 'sms',
        text: 'Sent welcome SMS with trial pass details.',
        actor: 'Amit Sharma',
      },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: 'crm_003',
    name: 'Meera Nambiar',
    phone: '+919820099555',
    email: 'meera.n@gmail.com',
    type: 'Walk In',
    source: 'Passing By',
    stage: 'negotiating',
    goal: 'Reformer Pilates & Yoga',
    expectedDealValueMinor: 4463700, // ₹44,637
    assignedRepId: 'usr_fc_02',
    assignedRepName: 'Neha Kapoor',
    trialPassCode: 'TRIAL-POW-2026-0882',
    trialDate: new Date().toISOString().slice(0, 10),
    nextFollowUpDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString().slice(0, 10),
    isOverdue: false,
    notes: 'Visited Powai studio in person. Interested in 36-session Reformer package.',
    activityLog: [
      {
        id: 'act_03',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        type: 'call',
        text: 'Followed up after Reformer trial. Member loved the session with Sneha.',
        actor: 'Neha Kapoor',
      },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
  },
]

// ─── Storage Helpers ───

export function getStoredLeads(): CrmLead[] {
  if (typeof window === 'undefined') return SEEDED_CRM_LEADS
  const stored = localStorage.getItem(LEADS_CRM_STORAGE_KEY)
  if (!stored) {
    localStorage.setItem(LEADS_CRM_STORAGE_KEY, JSON.stringify(SEEDED_CRM_LEADS))
    return SEEDED_CRM_LEADS
  }
  try { return JSON.parse(stored) } catch { return SEEDED_CRM_LEADS }
}

export function saveLeads(leads: CrmLead[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LEADS_CRM_STORAGE_KEY, JSON.stringify(leads))
  window.dispatchEvent(new Event('dna360_leads_updated'))
}

// ─── Queries ───

export function getLeads(filters: {
  search?: string
  stage?: LeadStage | 'all'
  type?: LeadType | 'all'
  source?: LeadSource | 'all'
  assignedRepId?: string | 'all'
  overdueOnly?: boolean
} = {}): CrmLead[] {
  let list = getStoredLeads()
  const todayStr = new Date().toISOString().slice(0, 10)

  // Update dynamic isOverdue
  list = list.map(l => ({
    ...l,
    isOverdue: !!(l.nextFollowUpDate && l.nextFollowUpDate < todayStr && l.stage !== 'converted' && l.stage !== 'lost'),
  }))

  if (filters.search) {
    const q = filters.search.toLowerCase().trim()
    list = list.filter(l =>
      l.name.toLowerCase().includes(q) ||
      l.phone.includes(q) ||
      (l.email && l.email.toLowerCase().includes(q)) ||
      l.goal.toLowerCase().includes(q)
    )
  }

  if (filters.stage && filters.stage !== 'all') {
    list = list.filter(l => l.stage === filters.stage)
  }

  if (filters.type && filters.type !== 'all') {
    list = list.filter(l => l.type === filters.type)
  }

  if (filters.source && filters.source !== 'all') {
    list = list.filter(l => l.source === filters.source)
  }

  if (filters.assignedRepId && filters.assignedRepId !== 'all') {
    list = list.filter(l => l.assignedRepId === filters.assignedRepId)
  }

  if (filters.overdueOnly) {
    list = list.filter(l => l.isOverdue)
  }

  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function getLeadById(id: string): CrmLead | null {
  return getStoredLeads().find(l => l.id === id) || null
}

export function getCrmKpis(): CrmKpis {
  const leads = getStoredLeads()
  const converted = leads.filter(l => l.stage === 'converted').length
  const total = leads.length

  const pipelineValue = leads
    .filter(l => l.stage !== 'converted' && l.stage !== 'lost')
    .reduce((acc, l) => acc + l.expectedDealValueMinor, 0)

  const todayStr = new Date().toISOString().slice(0, 10)
  const overdueCount = leads.filter(
    l => l.nextFollowUpDate && l.nextFollowUpDate < todayStr && l.stage !== 'converted' && l.stage !== 'lost'
  ).length

  return {
    totalLeadsMtd: total,
    pipelineValueMinor: pipelineValue,
    conversionRatePct: total > 0 ? Math.round((converted / total) * 100) : 0,
    avgDaysToClose: 4,
    overdueFollowUps: overdueCount,
  }
}

// ─── Mutations ───

export function createLead(data: Omit<CrmLead, 'id' | 'createdAt' | 'activityLog'>): CrmLead {
  const leads = getStoredLeads()
  const newLead: CrmLead = {
    ...data,
    id: `crm_${Date.now()}`,
    createdAt: new Date().toISOString(),
    activityLog: [
      {
        id: `act_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'note',
        text: `Lead created by ${data.assignedRepName || 'Staff'}`,
        actor: data.assignedRepName || 'Staff',
      },
    ],
  }

  leads.unshift(newLead)
  saveLeads(leads)

  logAuditEvent({
    actor: { id: data.assignedRepId, name: data.assignedRepName, email: '', role: 'Fitness Consultant' },
    action: 'CREATE',
    entity: 'Lead',
    entityId: newLead.id,
    branchId: 'pow',
    description: `Added lead ${newLead.name} (${newLead.phone})`,
    afterState: newLead,
  })

  return newLead
}

export function updateLead(id: string, updates: Partial<CrmLead>): CrmLead | null {
  const leads = getStoredLeads()
  const index = leads.findIndex(l => l.id === id)
  if (index === -1) return null

  const before = leads[index]
  const updated = { ...before, ...updates }
  leads[index] = updated
  saveLeads(leads)

  return updated
}

export function addLeadActivity(
  leadId: string,
  typeOrActivity: string | Omit<LeadActivity, 'id' | 'timestamp'>,
  noteText?: string,
  actor = 'Staff'
): CrmLead | null {
  const lead = getLeadById(leadId)
  if (!lead) return null

  let newAct: LeadActivity
  if (typeof typeOrActivity === 'string') {
    newAct = {
      id: `act_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: (typeOrActivity as any) || 'note',
      text: noteText || '',
      actor: actor,
    }
  } else {
    newAct = {
      ...typeOrActivity,
      id: `act_${Date.now()}`,
      timestamp: new Date().toISOString(),
    }
  }

  return updateLead(leadId, {
    activityLog: [newAct, ...lead.activityLog],
  })
}

/**
 * Convert a winning lead into a registered member.
 */
export function convertLeadToMember(params: {
  leadId: string
  membershipProductId: string
  staffName: string
}): { success: boolean; memberId?: string; error?: string } {
  const lead = getLeadById(params.leadId)
  if (!lead) return { success: false, error: 'Lead not found' }

  const nameParts = lead.name.split(' ')
  const firstName = nameParts[0] || lead.name
  const lastName = nameParts.slice(1).join(' ') || 'Member'

  const newMember = createMember({
    first_name: firstName,
    last_name: lastName,
    name: lead.name,
    email: lead.email || null,
    phone: lead.phone,
    gender: 'other',
    dob: null,
    status: 'active',
    active_memberships: [],
    past_memberships: [],
    kyc: {
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
    consent: {
      sms: true,
      email: !!lead.email,
      whatsapp: false,
      updated_at: new Date().toISOString(),
    },
    fitness_metrics: [],
    staff_notes: [
      {
        id: `sn_${Date.now()}`,
        authorId: lead.assignedRepId,
        authorName: lead.assignedRepName,
        authorRole: 'Fitness Consultant',
        timestamp: new Date().toISOString(),
        content: `Converted from lead (${lead.source}). Goal: ${lead.goal}`,
        type: 'general',
      },
    ],
    tags: ['Converted Lead'],
    blacklisted: false,
    blacklist_reason: null,
    blacklisted_by: null,
    blacklisted_at: null,
    complimentary: false,
    special_inclusions: null,
    referred_by: null,
    referral_code: `${firstName.toUpperCase()}360`,
    media_consent: null,
    adjustment_credits_remaining: 0,
    assigned_trainer_id: null,
    assigned_trainer_name: null,
  })

  updateLead(lead.id, {
    stage: 'converted',
    convertedMemberId: newMember.id,
    convertedAt: new Date().toISOString(),
  })

  addLeadActivity(lead.id, {
    type: 'stage_change',
    text: `Converted to Member ${newMember.member_code}`,
    actor: params.staffName,
  })

  return { success: true, memberId: newMember.id }
}

export function updateLeadStage(leadId: string, stage: LeadStage, actorName = 'Staff'): CrmLead | null {
  addLeadActivity(leadId, {
    type: 'stage_change',
    text: `Stage moved to ${stage.replace('_', ' ')}`,
    actor: actorName,
  })
  return updateLead(leadId, { stage })
}

export interface WebsiteInquiryInput {
  name: string
  phone: string
  service?: string
  message: string
}

/**
 * Handle incoming queries from the public website.
 * Persists as a CRM Lead, adds staff in-app notification alerts, and triggers live updates.
 */
export function submitWebsiteInquiry(input: WebsiteInquiryInput): CrmLead {
  const rep = { id: 'usr_fc_01', name: 'Amit Sharma' }
  const goal = input.service?.trim() || 'General Fitness'
  const notes = input.message.trim()
    ? `[Website Contact Form Query]\nInterested in: ${goal}\nMessage: ${input.message.trim()}`
    : `[Website Contact Form Query]\nInterested in: ${goal}`

  const lead = createLead({
    name: input.name.trim(),
    phone: input.phone.trim(),
    type: 'Website',
    source: 'Website',
    stage: 'inquiry',
    goal,
    expectedDealValueMinor: 4350000, // ₹43,500 standard estimated deal value
    assignedRepId: rep.id,
    assignedRepName: rep.name,
    notes,
  })

  // Broadcast in-app notification to staff and admin users
  const notifyUsers = ['usr_admin', 'usr_fc_01', 'usr_fc_02', 'usr_mgr_01', 'usr_owner']
  notifyUsers.forEach((uid) => {
    createInAppNotification(uid, {
      title: `⚡ New Website Query: ${input.name}`,
      body: `${input.name} (${input.phone}) inquired about ${goal}: "${input.message || 'New contact query'}"`,
      type: 'custom',
      link: '/leads',
    })
  })

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('dna360_leads_updated'))
    window.dispatchEvent(new Event('dna360_notifications_updated'))
  }

  return lead
}
