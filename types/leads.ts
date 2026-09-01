/* ============================================================
   DNA 360 — Lead & CRM Types
   
   Taxonomy from the client's actual data, not generic defaults.
   ============================================================ */

export type LeadStage =
  | 'inquiry'
  | 'trial_scheduled'
  | 'trial_attended'
  | 'negotiating'
  | 'converted'
  | 'lost'

/**
 * Lead type — HOW the enquiry came in.
 * From §10 of the build prompt.
 */
export type LeadType =
  | 'Walk In'
  | 'Referral'
  | 'Phone'
  | 'Event'
  | 'Website'
  | 'Other'

/**
 * Lead source — WHERE the lead heard about DNA 360.
 * From the actual Gymex data taxonomy.
 */
export type LeadSource =
  | 'Word Of Mouth'
  | 'Referral'
  | 'Website'
  | 'Ask Me'
  | 'Facebook'
  | 'Train Ads'
  | 'Passing By'
  | 'Posters'
  | 'Instagram'
  | 'Google'
  | 'Corporate'
  | 'Other'

export interface LeadActivity {
  id: string
  timestamp: string // ISO UTC
  type: 'note' | 'call' | 'whatsapp' | 'sms' | 'stage_change' | 'trial_issued' | 'follow_up'
  text: string
  actor: string
}

/**
 * CrmLead — a prospective member in the sales pipeline.
 * 
 * The export contains live members only — no leads, no lapsed members.
 * The pipeline starts empty unless they can export prospects separately.
 * Trials and day passes auto-create leads.
 */
export interface CrmLead {
  id: string
  name: string
  phone: string
  email?: string
  /** How the enquiry came in */
  type?: LeadType
  /** Where they heard about DNA 360 */
  source: LeadSource
  stage: LeadStage
  /** What they're looking for */
  goal: string
  planInterest?: string
  expectedDealValueMinor: number // paise
  potentialValueMinor?: number // alias
  /** Sales rep (Fitness Consultant) assigned */
  assignedRepId: string
  assignedRepName: string
  assignedStaffName?: string // alias
  /** Trial pass issued */
  trialPassCode?: string
  trialDate?: string
  /** Next follow-up date */
  nextFollowUpDate?: string
  /** Whether this follow-up is overdue */
  isOverdue?: boolean
  notes?: string
  activityLog: LeadActivity[]
  createdAt: string // ISO UTC
  /** If converted, the member ID */
  branchId?: string
  branchName?: string
  convertedMemberId?: string
  convertedAt?: string
  /** If lost, the reason */
  lostReason?: string
}

export interface CrmKpis {
  totalLeadsMtd: number
  totalLeads?: number
  pipelineValueMinor: number
  conversionRatePct: number
  avgDaysToClose: number
  overdueFollowUps: number
  trialsThisWeek?: number
}
