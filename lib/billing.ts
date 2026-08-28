/* ============================================================
   DNA 360 — Billing & Invoicing Engine
   
   - All prices are GST-inclusive. Tax is back-calculated at 5%
     (SAC 999723) for fitness services, 18% for marketing/shoots.
   - Gapless sequential invoice numbering: DNA/2026-27/0001
   - Sales rep attribution on every invoice
   - Discount ceiling enforcement with manager approval audit
   - No refund status: Void only + Credit Note path for billing errors
   - Cheque handling with realisation sub-states
   ============================================================ */

import type {
  TaxInvoice,
  InvoiceStatus,
  InvoiceLineItem,
  PaymentSplit,
  CreditNote,
  GymPlan,
  BillingFilterOptions,
  Promotion,
} from '@/types/billing'
import { backCalculateGst, getFinancialYear, formatINR } from '@/lib/gst'
import { getPendingConfig } from '@/lib/settings'
import { logAuditEvent } from '@/lib/audit'

const INVOICE_STORAGE_KEY = 'dna360_invoices'
const CREDIT_NOTE_STORAGE_KEY = 'dna360_credit_notes'
const PLANS_STORAGE_KEY = 'dna360_plans'
const PROMOTIONS_STORAGE_KEY = 'dna360_promotions'
const INVOICE_SEQ_KEY = 'dna360_invoice_seq'

// ─── Legacy Plan Bridge (All prices GST-inclusive with 5% back-calculation) ───

export const SEEDED_PLANS: GymPlan[] = [
  {
    id: 'plan_annual_pkg1',
    name: 'Annual Gym Membership Package 1',
    slug: 'annual-gym-pkg1',
    type: 'annual',
    durationMonths: 12,
    basePriceMinor: 4350000, // ₹43,500 inclusive
    gstMinor: 207143, // 5% back-calc: ₹2,071.43
    totalPriceMinor: 4350000,
    taxRate: 0.05,
    ptSessionsCount: 0,
    guestPassesCount: 2,
    steamAccess: true,
    features: [
      'Full Gym Floor & Cardio zone access',
      'Steam & Locker room access',
      '2 Complimentary guest day passes',
    ],
    isActive: true,
  },
  {
    id: 'plan_annual_ice_bath',
    name: 'Annual Gym — Ice Bath Included',
    slug: 'annual-gym-icebath',
    type: 'annual',
    durationMonths: 12,
    basePriceMinor: 5500000, // ₹55,000 inclusive
    gstMinor: 261905, // 5% back-calc: ₹2,619.05
    totalPriceMinor: 5500000,
    taxRate: 0.05,
    ptSessionsCount: 0,
    guestPassesCount: 4,
    steamAccess: true,
    features: [
      'Full Gym Floor & Cardio access',
      'Ice Bath recovery sessions included',
      'Steam & Locker room access',
    ],
    isActive: true,
  },
  {
    id: 'plan_annual_all_activities',
    name: 'Annual Gym — All Activities',
    slug: 'annual-gym-all-activities',
    type: 'annual',
    durationMonths: 12,
    basePriceMinor: 6549900, // ₹65,499 inclusive
    gstMinor: 311900, // 5% back-calc
    totalPriceMinor: 6549900,
    taxRate: 0.05,
    ptSessionsCount: 2,
    guestPassesCount: 6,
    steamAccess: true,
    features: [
      'Full Gym Floor access',
      'All 7 Group Activities included (Yoga, MMA, Spinning, Zumba, etc.)',
      'Steam, Ice Bath & Locker room access',
    ],
    isActive: true,
  },
  {
    id: 'plan_annual_happy_hours',
    name: 'Annual Happy Hours Gym Membership',
    slug: 'annual-happy-hours',
    type: 'annual',
    durationMonths: 12,
    basePriceMinor: 2999900, // ₹29,999 inclusive
    gstMinor: 142852,
    totalPriceMinor: 2999900,
    taxRate: 0.05,
    ptSessionsCount: 0,
    guestPassesCount: 0,
    steamAccess: true,
    features: [
      'Access window: 12:00 PM – 3:30 PM only',
      'Full gym floor access during Happy Hours',
      'Locker room & steam access',
    ],
    isActive: true,
  },
  {
    id: 'plan_day_pass',
    name: 'Gym Day Pass',
    slug: 'gym-day-pass',
    type: 'day_pass',
    durationMonths: 0,
    durationDays: 1,
    basePriceMinor: 145000, // ₹1,450 inclusive
    gstMinor: 6905,
    totalPriceMinor: 145000,
    taxRate: 0.05,
    ptSessionsCount: 0,
    guestPassesCount: 0,
    steamAccess: true,
    features: ['1-day all access gym floor pass'],
    isActive: true,
  },
]

// ─── Seeded Invoices (Gapless numbering DNA/2026-27/0001...) ───

const SEEDED_LINE_ITEM_1: InvoiceLineItem = {
  id: 'li_001',
  description: 'Annual Gym Membership Package 1',
  productId: 'prod_001',
  sacCode: '999723',
  quantity: 1,
  unitPriceInclusiveMinor: 4350000,
  discountMinor: 0,
  taxableMinor: 4142857,
  taxRate: 0.05,
  cgstMinor: 103571,
  sgstMinor: 103572,
  totalMinor: 4350000,
}

const SEEDED_LINE_ITEM_2: InvoiceLineItem = {
  id: 'li_002',
  description: 'Reformer Pilates — 36 Sessions (3 Months)',
  productId: 'prod_029',
  sacCode: '999723',
  quantity: 1,
  unitPriceInclusiveMinor: 4463700,
  discountMinor: 0,
  taxableMinor: 4251143,
  taxRate: 0.05,
  cgstMinor: 106278,
  sgstMinor: 106279,
  totalMinor: 4463700,
}

const SEEDED_LINE_ITEM_3: InvoiceLineItem = {
  id: 'li_003',
  description: 'Marketing Display — 1 Month',
  productId: 'prod_049',
  sacCode: '998361',
  quantity: 1,
  unitPriceInclusiveMinor: 2500000,
  discountMinor: 0,
  taxableMinor: 2118644,
  taxRate: 0.18, // 18% GST for space rental/marketing
  cgstMinor: 190678,
  sgstMinor: 190678,
  totalMinor: 2500000,
}

export const SEEDED_INVOICES: TaxInvoice[] = [
  {
    id: 'inv_001',
    invoiceNumber: 'DNA/2026-27/0001',
    memberId: 'mem_001',
    memberName: 'Arjun Mehta',
    memberPhone: '+919820011111',
    memberEmail: 'arjun.mehta@gmail.com',
    issueDate: '2026-04-02',
    dueDate: '2026-04-02',
    status: 'paid',
    items: [SEEDED_LINE_ITEM_1],
    subtotalMinor: 4350000,
    totalDiscountMinor: 0,
    taxableMinor: 4142857,
    cgstMinor: 103571,
    sgstMinor: 103572,
    grandTotalMinor: 4350000,
    paidAmountMinor: 4350000,
    dueAmountMinor: 0,
    payments: [
      {
        id: 'pay_001',
        mode: 'UPI',
        amountMinor: 4350000,
        transactionRef: 'UPI/20260402/DNA98762',
        recordedAt: '2026-04-02T10:15:00Z',
      },
    ],
    createdBy: { id: 'usr_fc_01', name: 'Amit Sharma', role: 'Fitness Consultant' },
    salesRepId: 'usr_fc_01',
    salesRepName: 'Amit Sharma',
  },
  {
    id: 'inv_002',
    invoiceNumber: 'DNA/2026-27/0002',
    memberId: 'mem_002',
    memberName: 'Priya Sharma',
    memberPhone: '+919820022222',
    memberEmail: 'priya.s@outlook.com',
    issueDate: '2026-04-05',
    dueDate: '2026-04-05',
    status: 'paid',
    items: [SEEDED_LINE_ITEM_2],
    subtotalMinor: 4463700,
    totalDiscountMinor: 0,
    taxableMinor: 4251143,
    cgstMinor: 106278,
    sgstMinor: 106279,
    grandTotalMinor: 4463700,
    paidAmountMinor: 4463700,
    dueAmountMinor: 0,
    payments: [
      {
        id: 'pay_002',
        mode: 'Credit Card',
        amountMinor: 4463700,
        transactionRef: 'HDFC_CC_20260405_9921',
        recordedAt: '2026-04-05T14:30:00Z',
      },
    ],
    createdBy: { id: 'usr_fc_02', name: 'Neha Kapoor', role: 'Fitness Consultant' },
    salesRepId: 'usr_fc_02',
    salesRepName: 'Neha Kapoor',
  },
  {
    id: 'inv_003',
    invoiceNumber: 'DNA/2026-27/0003',
    memberId: 'mem_corp_01',
    memberName: 'Red Bull India Pvt Ltd',
    memberPhone: '+919820099888',
    memberEmail: 'events@redbull.in',
    issueDate: '2026-04-10',
    dueDate: '2026-04-10',
    status: 'paid',
    items: [SEEDED_LINE_ITEM_3],
    subtotalMinor: 2500000,
    totalDiscountMinor: 0,
    taxableMinor: 2118644,
    cgstMinor: 190678,
    sgstMinor: 190678,
    grandTotalMinor: 2500000,
    paidAmountMinor: 2500000,
    dueAmountMinor: 0,
    payments: [
      {
        id: 'pay_003',
        mode: 'Net Banking',
        amountMinor: 2500000,
        transactionRef: 'NEFT_AXIS_20260410_1189',
        recordedAt: '2026-04-10T16:00:00Z',
      },
    ],
    createdBy: { id: 'usr_mgr_sales_head', name: 'Vikramaditya Shinde', role: 'Asst. Sales Head' },
    salesRepId: 'usr_mgr_sales_head',
    salesRepName: 'Vikramaditya Shinde',
  },
]

export const SEEDED_CREDIT_NOTES: CreditNote[] = [
  {
    id: 'cn_001',
    creditNoteNumber: 'CN/2026-27/0001',
    originalInvoiceId: 'inv_legacy_void_01',
    originalInvoiceNumber: 'DNA/2025-26/0678',
    memberId: 'mem_003',
    memberName: 'Vikram Singh',
    taxableRefundMinor: 4142857,
    cgstMinor: 103571,
    sgstMinor: 103572,
    totalRefundMinor: 4350000,
    reason: 'Billing Error',
    notes: 'Duplicate invoice recorded due to network timeout at POS desk.',
    issuedBy: { id: 'usr_fc_01', name: 'Amit Sharma', role: 'Fitness Consultant' },
    approvedBy: { id: 'usr_mgr_sales_head', name: 'Vikramaditya Shinde' },
    timestamp: '2026-03-30T11:00:00Z',
  },
]

export const SEEDED_PROMOTIONS: Promotion[] = [
  {
    id: 'promo_01',
    name: 'Foundation Founder Rate',
    type: 'seasonal',
    discountPct: 10,
    discountFixedMinor: 0,
    startDate: '2026-04-01',
    endDate: '2026-09-30',
    applicableProductIds: [],
    active: true,
    createdBy: 'Vikramaditya Shinde',
  },
  {
    id: 'promo_02',
    name: 'Member Referral Privilege',
    type: 'referral',
    discountPct: 5,
    discountFixedMinor: 0,
    startDate: '2026-04-01',
    endDate: '2027-03-31',
    applicableProductIds: [],
    active: true,
    createdBy: 'Vikramaditya Shinde',
  },
]

// ─── Sequence Generator (Gapless numbering) ───

export function getNextInvoiceNumber(): string {
  const fy = getFinancialYear()
  const config = getPendingConfig()
  const startingNumber = config.starting_invoice_number ?? 1

  if (typeof window === 'undefined') {
    return `DNA/${fy}/${String(startingNumber + 3).padStart(4, '0')}`
  }

  const storedSeq = localStorage.getItem(`${INVOICE_SEQ_KEY}_${fy}`)
  let nextNum = storedSeq ? parseInt(storedSeq, 10) + 1 : startingNumber

  // Ensure nextNum is higher than existing invoices
  const existingInvoices = getStoredInvoices()
  for (const inv of existingInvoices) {
    if (inv.invoiceNumber.startsWith(`DNA/${fy}/`)) {
      const numPart = parseInt(inv.invoiceNumber.split('/')[2] || '0', 10)
      if (numPart >= nextNum) {
        nextNum = numPart + 1
      }
    }
  }

  localStorage.setItem(`${INVOICE_SEQ_KEY}_${fy}`, nextNum.toString())
  return `DNA/${fy}/${String(nextNum).padStart(4, '0')}`
}

// ─── Storage Helpers ───

export function getStoredInvoices(): TaxInvoice[] {
  if (typeof window === 'undefined') return SEEDED_INVOICES
  const stored = localStorage.getItem(INVOICE_STORAGE_KEY)
  if (!stored) {
    localStorage.setItem(INVOICE_STORAGE_KEY, JSON.stringify(SEEDED_INVOICES))
    return SEEDED_INVOICES
  }
  try { return JSON.parse(stored) } catch { return SEEDED_INVOICES }
}

export function saveInvoices(invoices: TaxInvoice[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(INVOICE_STORAGE_KEY, JSON.stringify(invoices))
  window.dispatchEvent(new Event('dna360_invoices_updated'))
}

export function getStoredCreditNotes(): CreditNote[] {
  if (typeof window === 'undefined') return SEEDED_CREDIT_NOTES
  const stored = localStorage.getItem(CREDIT_NOTE_STORAGE_KEY)
  if (!stored) {
    localStorage.setItem(CREDIT_NOTE_STORAGE_KEY, JSON.stringify(SEEDED_CREDIT_NOTES))
    return SEEDED_CREDIT_NOTES
  }
  try { return JSON.parse(stored) } catch { return SEEDED_CREDIT_NOTES }
}

export function saveCreditNotes(cns: CreditNote[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(CREDIT_NOTE_STORAGE_KEY, JSON.stringify(cns))
  window.dispatchEvent(new Event('dna360_credit_notes_updated'))
}

export function getStoredPlans(): GymPlan[] {
  if (typeof window === 'undefined') return SEEDED_PLANS
  const stored = localStorage.getItem(PLANS_STORAGE_KEY)
  if (!stored) {
    localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(SEEDED_PLANS))
    return SEEDED_PLANS
  }
  try { return JSON.parse(stored) } catch { return SEEDED_PLANS }
}

export function savePlans(plans: GymPlan[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(plans))
}

export function getStoredPromotions(): Promotion[] {
  if (typeof window === 'undefined') return SEEDED_PROMOTIONS
  const stored = localStorage.getItem(PROMOTIONS_STORAGE_KEY)
  if (!stored) {
    localStorage.setItem(PROMOTIONS_STORAGE_KEY, JSON.stringify(SEEDED_PROMOTIONS))
    return SEEDED_PROMOTIONS
  }
  try { return JSON.parse(stored) } catch { return SEEDED_PROMOTIONS }
}

export function savePromotions(promos: Promotion[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(PROMOTIONS_STORAGE_KEY, JSON.stringify(promos))
}

// ─── Invoice Operations ───

/**
 * Creates an InvoiceLineItem from an inclusive list price and product tax rate.
 * Tax is extracted via back-calculation.
 */
export function buildLineItem(params: {
  productId: string
  description: string
  sacCode: string
  unitPriceInclusiveMinor: number
  quantity: number
  discountMinor: number
  taxRate: number
}): InvoiceLineItem {
  const grossLineMinor = params.unitPriceInclusiveMinor * params.quantity
  const netLineMinor = Math.max(0, grossLineMinor - params.discountMinor)
  const gst = backCalculateGst(netLineMinor, params.taxRate)

  return {
    id: `li_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    productId: params.productId,
    description: params.description,
    sacCode: params.sacCode,
    quantity: params.quantity,
    unitPriceInclusiveMinor: params.unitPriceInclusiveMinor,
    discountMinor: params.discountMinor,
    taxableMinor: gst.taxable,
    taxRate: params.taxRate,
    cgstMinor: gst.cgst,
    sgstMinor: gst.sgst,
    totalMinor: netLineMinor,
  }
}

/**
 * Validates discount ceiling. If requested discount exceeds ceiling %,
 * requires manager approval details.
 */
export function validateDiscount(params: {
  totalGrossMinor: number
  discountMinor: number
  managerApproval?: { approvedBy: string; reason: string }
}): { allowed: boolean; reason?: string } {
  if (params.discountMinor <= 0) return { allowed: true }

  const config = getPendingConfig()
  const ceilingPct = config.discount_ceiling_pct // e.g. 0 by default
  const maxAllowedDiscount = Math.round((params.totalGrossMinor * ceilingPct) / 100)

  if (params.discountMinor > maxAllowedDiscount) {
    if (!params.managerApproval?.approvedBy || !params.managerApproval?.reason) {
      return {
        allowed: false,
        reason: `Discount of ${formatINR(params.discountMinor)} exceeds front-desk ceiling (${ceilingPct}% = ${formatINR(maxAllowedDiscount)}). Manager override approval and reason are mandatory.`,
      }
    }
  }

  return { allowed: true }
}

/**
 * Issue a new Tax Invoice with GST back-calculation and gapless sequence.
 */
export function issueInvoice(params: {
  memberId: string
  memberName: string
  memberPhone: string
  memberEmail?: string | null
  memberAddress?: string
  items: InvoiceLineItem[]
  payments: PaymentSplit[]
  salesRepId: string
  salesRepName: string
  createdBy: { id: string; name: string; role: string }
  discountReason?: string
  discountApprovedBy?: string
  notes?: string
}): TaxInvoice {
  const invoiceNumber = getNextInvoiceNumber()
  const todayStr = new Date().toISOString().slice(0, 10)

  const subtotalMinor = params.items.reduce((s, it) => s + (it.unitPriceInclusiveMinor * it.quantity), 0)
  const totalDiscountMinor = params.items.reduce((s, it) => s + it.discountMinor, 0)
  const grandTotalMinor = params.items.reduce((s, it) => s + it.totalMinor, 0)
  const taxableMinor = params.items.reduce((s, it) => s + it.taxableMinor, 0)
  const cgstMinor = params.items.reduce((s, it) => s + it.cgstMinor, 0)
  const sgstMinor = params.items.reduce((s, it) => s + it.sgstMinor, 0)

  const paidAmountMinor = params.payments.reduce((s, p) => s + p.amountMinor, 0)
  const dueAmountMinor = Math.max(0, grandTotalMinor - paidAmountMinor)

  let status: InvoiceStatus = 'pending'
  if (paidAmountMinor >= grandTotalMinor) {
    status = 'paid'
  } else if (paidAmountMinor > 0) {
    status = 'partially_paid'
  }

  const invoice: TaxInvoice = {
    id: `inv_${Date.now()}`,
    invoiceNumber,
    memberId: params.memberId,
    memberName: params.memberName,
    memberPhone: params.memberPhone,
    memberEmail: params.memberEmail || null,
    memberAddress: params.memberAddress,
    issueDate: todayStr,
    dueDate: todayStr,
    status,
    items: params.items,
    subtotalMinor,
    totalDiscountMinor,
    taxableMinor,
    cgstMinor,
    sgstMinor,
    grandTotalMinor,
    paidAmountMinor,
    dueAmountMinor,
    payments: params.payments,
    createdBy: params.createdBy,
    salesRepId: params.salesRepId,
    salesRepName: params.salesRepName,
    discountReason: params.discountReason,
    discountApprovedBy: params.discountApprovedBy,
    notes: params.notes,
  }

  const invoices = getStoredInvoices()
  invoices.unshift(invoice)
  saveInvoices(invoices)

  logAuditEvent({
    actor: { id: params.createdBy.id, name: params.createdBy.name, email: '', role: params.createdBy.role },
    action: 'CREATE',
    entity: 'Invoice',
    entityId: invoice.id,
    branchId: 'pow',
    description: `Generated Tax Invoice ${invoice.invoiceNumber} for ${params.memberName} (${formatINR(grandTotalMinor)})`,
    afterState: invoice,
  })

  return invoice
}

/**
 * Void an invoice with mandatory reason and optional credit note generation.
 * No refunds — void only path.
 */
export function voidInvoice(params: {
  invoiceId: string
  voidReason: string
  voidedBy: { id: string; name: string; role: string }
  issueCreditNote: boolean
}): { success: boolean; invoice?: TaxInvoice; creditNote?: CreditNote; error?: string } {
  const invoices = getStoredInvoices()
  const index = invoices.findIndex(i => i.id === params.invoiceId)
  if (index === -1) return { success: false, error: 'Invoice not found' }

  const invoice = invoices[index]
  if (invoice.status === 'void') {
    return { success: false, error: 'Invoice is already void' }
  }

  const before = { ...invoice }
  invoice.status = 'void'
  invoice.voidReason = params.voidReason
  invoice.voidedBy = params.voidedBy.name
  invoice.voidedAt = new Date().toISOString()

  let creditNote: CreditNote | undefined

  if (params.issueCreditNote && invoice.paidAmountMinor > 0) {
    const fy = getFinancialYear()
    const creditNotes = getStoredCreditNotes()
    const cnNumber = `CN/${fy}/${String(creditNotes.length + 1).padStart(4, '0')}`

    creditNote = {
      id: `cn_${Date.now()}`,
      creditNoteNumber: cnNumber,
      originalInvoiceId: invoice.id,
      originalInvoiceNumber: invoice.invoiceNumber,
      memberId: invoice.memberId,
      memberName: invoice.memberName,
      taxableRefundMinor: invoice.taxableMinor,
      cgstMinor: invoice.cgstMinor,
      sgstMinor: invoice.sgstMinor,
      totalRefundMinor: invoice.paidAmountMinor,
      reason: 'Billing Error',
      notes: params.voidReason,
      issuedBy: params.voidedBy,
      approvedBy: { id: params.voidedBy.id, name: params.voidedBy.name },
      timestamp: new Date().toISOString(),
    }

    invoice.creditNoteId = creditNote.id
    invoice.creditNoteNumber = creditNote.creditNoteNumber

    creditNotes.unshift(creditNote)
    saveCreditNotes(creditNotes)
  }

  invoices[index] = invoice
  saveInvoices(invoices)

  logAuditEvent({
    actor: { id: params.voidedBy.id, name: params.voidedBy.name, email: '', role: params.voidedBy.role },
    action: 'VOID',
    entity: 'Invoice',
    entityId: invoice.id,
    branchId: 'pow',
    description: `Voided Invoice ${invoice.invoiceNumber}: ${params.voidReason}`,
    beforeState: before,
    afterState: invoice,
  })

  return { success: true, invoice, creditNote }
}

/**
 * Updates a cheque payment status (realised or bounced).
 */
export function updateChequeStatus(params: {
  invoiceId: string
  paymentId: string
  status: 'realised' | 'bounced'
  bounceReason?: string
  staffName: string
}): boolean {
  const invoices = getStoredInvoices()
  const invoice = invoices.find(i => i.id === params.invoiceId)
  if (!invoice) return false

  const payment = invoice.payments.find(p => p.id === params.paymentId)
  if (!payment || payment.mode !== 'Cheque') return false

  payment.chequeStatus = params.status
  if (params.status === 'realised') {
    payment.chequeRealisedAt = new Date().toISOString()
  } else if (params.status === 'bounced') {
    payment.chequeBounceReason = params.bounceReason || 'Cheque dishonoured by bank'
    // Reopen invoice dues
    invoice.paidAmountMinor = Math.max(0, invoice.paidAmountMinor - payment.amountMinor)
    invoice.dueAmountMinor = invoice.grandTotalMinor - invoice.paidAmountMinor
    invoice.status = invoice.paidAmountMinor === 0 ? 'overdue' : 'partially_paid'
  }

  saveInvoices(invoices)

  logAuditEvent({
    actor: { id: 'system', name: params.staffName, email: '', role: 'Staff' },
    action: 'UPDATE',
    entity: 'Payment',
    entityId: payment.id,
    branchId: 'pow',
    description: `Updated cheque payment on invoice ${invoice.invoiceNumber} to ${params.status}`,
    afterState: payment,
  })

  return true
}

export function getInvoices(filters: BillingFilterOptions = {}): TaxInvoice[] {
  let list = getStoredInvoices()

  if (filters.search) {
    const q = filters.search.toLowerCase().trim()
    list = list.filter(i =>
      i.invoiceNumber.toLowerCase().includes(q) ||
      i.memberName.toLowerCase().includes(q) ||
      i.memberPhone.includes(q) ||
      i.salesRepName.toLowerCase().includes(q)
    )
  }

  if (filters.status && filters.status !== 'all') {
    list = list.filter(i => i.status === filters.status)
  }

  if (filters.paymentMode && filters.paymentMode !== 'all') {
    list = list.filter(i => i.payments.some(p => p.mode === filters.paymentMode))
  }

  return list.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
}

export function getInvoiceById(id: string): TaxInvoice | null {
  return getStoredInvoices().find(i => i.id === id) || null
}

export { numberToWordsINR } from '@/lib/gst'

export const createInvoice = issueInvoice

export function createPlan(data: Partial<GymPlan> & Pick<GymPlan, 'name' | 'type' | 'durationMonths' | 'basePriceMinor'>): GymPlan {
  const plans = getStoredPlans()
  const taxRate = data.taxRate ?? 0.05
  const gst = backCalculateGst(data.basePriceMinor, taxRate)
  const newPlan: GymPlan = {
    id: `plan_${Date.now()}`,
    slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
    name: data.name,
    type: data.type,
    durationMonths: data.durationMonths,
    durationDays: data.durationDays,
    basePriceMinor: data.basePriceMinor,
    gstMinor: data.gstMinor ?? gst.totalTax,
    totalPriceMinor: data.totalPriceMinor ?? data.basePriceMinor,
    taxRate: taxRate,
    ptSessionsCount: data.ptSessionsCount ?? 0,
    guestPassesCount: data.guestPassesCount ?? 0,
    steamAccess: data.steamAccess ?? true,
    branchIds: data.branchIds || ['pow'],
    features: data.features || [],
    isActive: data.isActive ?? true,
  }
  plans.push(newPlan)
  savePlans(plans)
  return newPlan
}

export function updatePlan(id: string, updates: Partial<GymPlan>): GymPlan | null {
  const plans = getStoredPlans()
  const index = plans.findIndex(p => p.id === id)
  if (index === -1) return null
  const updated = { ...plans[index], ...updates }
  plans[index] = updated
  savePlans(plans)
  return updated
}

export function issueCreditNote(
  invoiceId: string,
  params: { reason: string; notes?: string; issuedBy: { id: string; name: string; role: string } }
): CreditNote | null {
  const res = voidInvoice({
    invoiceId,
    voidReason: `${params.reason}: ${params.notes || ''}`,
    voidedBy: params.issuedBy,
    issueCreditNote: true,
  })
  return res.creditNote || null
}
