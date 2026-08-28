/* ============================================================
   DNA 360 — Billing & Invoice Types
   
   All prices are GST-inclusive. Tax is back-calculated out of the
   inclusive amount, never added on top.
   
   Tax rate is per-product: 5% (SAC 999723) for fitness services,
   18% for marketing/space-rental.
   
   Supplier and place of supply both Maharashtra (27) → CGST + SGST split.
   ============================================================ */

export type InvoiceStatus =
  | 'paid'
  | 'pending'
  | 'overdue'
  | 'partially_paid'
  | 'void'   // replaced 'refunded' — no refunds, only void/credit-note

export type PaymentMode =
  | 'UPI'
  | 'Credit Card'
  | 'Debit Card'
  | 'Net Banking'
  | 'Cash'
  | 'Cheque'
  | 'Online'   // PENDING gateway adapter — provider not named

/** Cheque-specific states */
export type ChequeStatus = 'pending_realisation' | 'realised' | 'bounced'

export interface PaymentSplit {
  id: string
  mode: PaymentMode
  amountMinor: number // paise
  transactionRef?: string
  recordedAt: string // ISO UTC
  /** Cheque-specific fields */
  chequeNumber?: string
  chequeDate?: string
  chequeBankName?: string
  chequeStatus?: ChequeStatus
  chequeRealisedAt?: string
  chequeBounceReason?: string
}

/**
 * InvoiceLineItem — each line carries its own tax rate from the product.
 * 
 * GST is BACK-CALCULATED from the inclusive price:
 *   taxable = inclusive × 100 / (100 + tax_rate × 100)
 *   total_tax = inclusive - taxable
 *   cgst = floor(total_tax / 2)
 *   sgst = total_tax - cgst  (remainder handles odd paise)
 */
export interface InvoiceLineItem {
  id: string
  description: string
  /** Product FK */
  productId: string
  /** SAC code from the product */
  sacCode: string // e.g. "999723"
  quantity: number
  /**
   * GST-inclusive unit price in paise.
   * This is the list price. Tax is extracted from it, not added to it.
   */
  unitPriceInclusiveMinor: number
  /** Discount in paise */
  discountMinor: number
  /** Taxable amount in paise (back-calculated from inclusive price minus discount) */
  taxableMinor: number
  /**
   * Tax rate as a decimal from the product.
   * 0.05 for fitness (default), 0.18 for marketing/shoots.
   */
  taxRate: number
  /** CGST in paise — half of total tax (intra-state Maharashtra) */
  cgstMinor: number
  /** SGST in paise — half of total tax (intra-state Maharashtra) */
  sgstMinor: number
  /** Line total = taxable + cgst + sgst */
  totalMinor: number
}

/**
 * TaxInvoice — GST-compliant tax invoice.
 * 
 * Format: DNA/2026-27/0001 — financial year April–March, resets annually.
 * Numbering must be gapless and concurrency-safe.
 * 
 * Header: BASE FITNESS PRIVATE LIMITED
 * GSTIN: 27AAICB3300R1ZH
 * Address: Knowledge Park, 502, Hiranandani Gardens, Mumbai Suburban, Maharashtra 400076
 */
export interface TaxInvoice {
  id: string
  /** Gapless invoice number: DNA/YYYY-YY/NNNN */
  invoiceNumber: string
  memberId: string
  memberName: string
  memberPhone: string
  memberEmail: string | null
  memberAddress?: string
  issueDate: string // YYYY-MM-DD
  dueDate: string // YYYY-MM-DD
  status: InvoiceStatus
  items: InvoiceLineItem[]
  subtotalMinor: number // sum of inclusive prices before discount
  totalDiscountMinor: number
  taxableMinor: number // sum of taxable amounts
  cgstMinor: number // sum of all line CGST
  sgstMinor: number // sum of all line SGST
  grandTotalMinor: number
  paidAmountMinor: number
  dueAmountMinor: number
  payments: PaymentSplit[]
  notes?: string
  /** Credit note linkage (void path only, no refunds) */
  creditNoteId?: string
  creditNoteNumber?: string
  /** Who created this invoice */
  createdBy: {
    id: string
    name: string
    role: string
  }
  /** Sales rep attribution — survives even if staff leaves */
  salesRepId: string
  salesRepName: string
  /** Discount audit trail */
  discountReason?: string
  discountApprovedBy?: string
  /** Void audit trail (soft delete only) */
  voidReason?: string
  voidedBy?: string
  voidedAt?: string
}

/**
 * CreditNote — for billing errors only, manager-restricted.
 * No refunds, no cancellations. This is the void/correction path.
 */
export interface CreditNote {
  id: string
  creditNoteNumber: string // e.g. "CN/2026-27/0014"
  originalInvoiceId: string
  originalInvoiceNumber: string
  memberId: string
  memberName: string
  taxableRefundMinor: number
  cgstMinor: number
  sgstMinor: number
  totalRefundMinor: number
  reason: 'Billing Error' | 'Double Charge' | 'System Error' | 'Other'
  /** Mandatory free-text explanation */
  notes: string
  issuedBy: {
    id: string
    name: string
    role: string
  }
  /** Manager who approved this credit note */
  approvedBy: {
    id: string
    name: string
  }
  timestamp: string // ISO UTC
}

/**
 * GymPlan — legacy compatibility type for the UI.
 * New code should use Product from types/product.ts.
 * This bridges the existing plan management UI.
 */
export interface GymPlan {
  id: string
  name: string
  slug: string
  type: 'annual' | 'semi_annual' | 'quarterly' | 'monthly' | 'pt_pack' | 'day_pass' | 'trial'
  durationMonths: number
  durationDays?: number
  /** GST-inclusive price in paise */
  basePriceMinor: number
  /** Back-calculated tax in paise */
  gstMinor: number
  /** This equals basePriceMinor (inclusive) — kept for UI compat */
  totalPriceMinor: number
  /** Tax rate: 0.05 for fitness, 0.18 for marketing */
  taxRate: number
  ptSessionsCount: number
  guestPassesCount: number
  steamAccess: boolean
  branchIds?: string[]
  features: string[]
  isActive: boolean
}

export interface BillingFilterOptions {
  search?: string
  status?: string
  paymentMode?: string
  dateRange?: string
}

/** Promotion / seasonal offer */
export interface Promotion {
  id: string
  name: string
  type: 'seasonal' | 'referral' | 'corporate'
  discountPct: number
  discountFixedMinor: number // paise, 0 if percentage-based
  startDate: string
  endDate: string
  applicableProductIds: string[] // empty = all products
  active: boolean
  createdBy: string
}
