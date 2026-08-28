/* ============================================================
   DNA 360 — Corporate / Floating Membership Type
   
   Floating / corporate memberships are a distinct shape.
   Live SKUs exist for 1, 50 and 65 shared slots.
   One contract, N concurrent slots, any member drawing on the pool.
   ============================================================ */

/**
 * CorporateContract — one contract with a slot pool and
 * named or anonymous occupants.
 * 
 * This is NOT modelled as N individual memberships.
 * The contract owns the slot pool; occupants are allocated
 * and deallocated by the gym admin.
 */
export interface CorporateContract {
  id: string
  /** Company or contract holder name */
  company_name: string
  /** Contact person at the company */
  contact_name: string
  contact_phone: string
  contact_email?: string
  /** Total slots purchased */
  total_slots: number
  /** Maximum concurrent active occupants */
  concurrent_max: number
  /** Contract validity in days */
  validity_days: number
  /** Contract start date (YYYY-MM-DD) */
  start_date: string
  /** Contract end date (YYYY-MM-DD) */
  end_date: string
  /** FK to the product (e.g. 65-slot corporate annual) */
  product_id: string
  /** FK to the invoice for this contract */
  invoice_id: string
  /** Currently allocated occupants */
  occupants: CorporateOccupant[]
  /** Whether slots are named (assigned to specific members) or anonymous (any member can use) */
  allocation_type: 'named' | 'anonymous'
  /** Contract status */
  status: 'active' | 'expired' | 'void'
  /** Sales rep who closed this deal */
  sales_rep_id: string
  sales_rep_name: string
  /** Audit timestamps */
  created_at: string
  updated_at: string
  created_by: string
}

/**
 * An occupant drawing on a corporate slot pool.
 * For named allocation, each occupant is a specific member.
 * For anonymous, occupants are recorded on each visit.
 */
export interface CorporateOccupant {
  /** FK to member — may be null for anonymous walk-ins */
  member_id: string | null
  name: string
  phone?: string
  /** When this occupant was allocated a slot */
  allocated_at: string
  /** When this occupant was deallocated (null if still active) */
  deallocated_at: string | null
  /** Who allocated this occupant */
  allocated_by: string
}

export interface CorporateContractFilterOptions {
  search?: string
  status?: 'active' | 'expired' | 'void' | 'all'
  allocation_type?: 'named' | 'anonymous' | 'all'
}
