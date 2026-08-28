/* ============================================================
   DNA 360 — Front Desk Types
   
   Walk-in lead registration, day pass issuance, locker management,
   and cash shift reconciliation. No F&B POS in Phase 1.
   ============================================================ */

/**
 * WalkInLead — a walk-in prospect registered at the front desk.
 * Auto-creates a CRM lead when saved.
 */
export interface WalkInLead {
  id: string
  name: string
  phone: string
  email?: string
  goal: 'Fat Loss' | 'Muscle Gain' | 'General Fitness' | 'Athletic Conditioning' | 'Rehab / Mobility' | 'Pilates' | 'Group Classes'
  source: 'Walk In' | 'Referral' | 'Phone' | 'Event' | 'Website' | 'Other'
  trialPassIssued?: boolean
  issueTrialPass?: boolean
  trialPassCode?: string
  trialDate?: string
  status?: 'inquiry' | 'trial_active' | 'converted' | 'lost'
  notes?: string
  branchId?: string
  branchName?: string
  assignedTo?: string
  createdAt: string
}

/**
 * POS Product — retail items sold at the desk.
 * F&B / café POS is NOT in scope for Phase 1.
 * Kitchen has 4 chefs on payroll but no F&B module in requirements.
 */
export interface PosProduct {
  id: string
  name: string
  category: 'shake' | 'beverage' | 'snack' | 'apparel' | 'gear'
  priceMinor: number // paise, GST-inclusive
  costMinor: number // paise
  stockCount: number
  sku: string
  taxRate: number // 0.05 or 0.18
}

export interface PosSaleItem {
  productId: string
  productName: string
  quantity: number
  priceMinor: number
  totalMinor: number
}

export interface PosSale {
  id: string
  receiptNumber: string
  customerType: 'member' | 'guest'
  customerId?: string
  customerName: string
  customerPhone?: string
  items: PosSaleItem[]
  subtotalMinor: number
  gstMinor: number
  totalMinor: number
  paymentMode: 'UPI' | 'Cash' | 'Card'
  transactionRef?: string
  recordedBy: string
  timestamp: string
}

/**
 * Locker — physical locker allocation.
 * Locker rental is a purchasable product: 1 month ₹1,000, 3 months ₹3,000.
 */
export interface Locker {
  id: string
  number: number
  zone: 'Male' | 'Female'
  status: 'available' | 'occupied' | 'dedicated_rental' | 'maintenance'
  assignedMemberId?: string
  assignedMemberName?: string
  assignedMemberPhone?: string
  assignedAt?: string
  rentalExpiryDate?: string
}

/**
 * CashShiftHandover — cash drawer reconciliation.
 * No part payments, so cash handling is simpler.
 */
export interface CashShiftHandover {
  id: string
  branchId?: string
  branchName?: string
  shiftType: 'morning' | 'evening' | 'Morning' | 'Evening' | string
  staffId: string
  staffName: string
  openedAt: string
  closedAt: string
  openingFloatMinor: number
  cashSalesMinor: number
  pettyCashOutflowsMinor: number
  expectedCashMinor: number
  actualCashCountedMinor: number
  discrepancyMinor: number
  notes?: string
  status: 'open' | 'closed'
}
