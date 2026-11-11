/* ============================================================
   DNA 360 — Front Desk Operations Store
   
   - Walk-in Lead registration & trial pass generation
   - Physical Locker allocation & rental expiry tracking (1 & 3 Months)
   - POS retail sales with GST back-calculation
   - Cash shift handover & reconciliation
   ============================================================ */

import type {
  WalkInLead,
  PosProduct,
  PosSale,
  Locker,
  CashShiftHandover,
} from '@/types/frontdesk'
import { logAuditEvent } from '@/lib/audit'
import { backCalculateGst } from '@/lib/gst'
import { issueInvoice, buildLineItem } from '@/lib/billing'

const LEADS_STORAGE_KEY = 'dna360_walkin_leads_v2'
const POS_PRODUCTS_KEY = 'dna360_pos_products'
const POS_SALES_KEY = 'dna360_pos_sales_v2'
const LOCKERS_KEY = 'dna360_lockers_v2'
const SHIFTS_KEY = 'dna360_cash_shifts_v2'

export const SEEDED_POS_PRODUCTS: PosProduct[] = [
  { id: 'prod_01', name: 'DNA 360 Triple Chocolate Whey Isolate Shake', category: 'shake', priceMinor: 25000, costMinor: 11000, stockCount: 140, sku: 'DNA-SHK-01', taxRate: 0.05 },
  { id: 'prod_02', name: 'BCAA Electrolyte Hydration Drink (Watermelon)', category: 'beverage', priceMinor: 15000, costMinor: 6000, stockCount: 85, sku: 'DNA-BEV-02', taxRate: 0.05 },
  { id: 'prod_03', name: 'High-Protein Crunch Bar (20g Protein)', category: 'snack', priceMinor: 18000, costMinor: 8000, stockCount: 120, sku: 'DNA-SNK-03', taxRate: 0.05 },
  { id: 'prod_04', name: 'DNA 360 Heavy Duty Lifting Wrist Straps', category: 'gear', priceMinor: 65000, costMinor: 28000, stockCount: 45, sku: 'DNA-GER-04', taxRate: 0.05 },
  { id: 'prod_05', name: 'DNA 360 Stainless Steel Matte Shaker Bottle', category: 'gear', priceMinor: 85000, costMinor: 38000, stockCount: 30, sku: 'DNA-GER-05', taxRate: 0.05 },
  { id: 'prod_06', name: 'DNA 360 Oversized Acid-Wash Training Tee', category: 'apparel', priceMinor: 140000, costMinor: 60000, stockCount: 25, sku: 'DNA-APP-06', taxRate: 0.05 },
]

export const SEEDED_LEADS: WalkInLead[] = []

export const SEEDED_POS_SALES: PosSale[] = []

function buildInitialLockers(): Locker[] {
  const list: Locker[] = []

  // Male Floor: 101-120 (20 lockers)
  for (let i = 1; i <= 20; i++) {
    const num = 100 + i
    const id = `lck_m_${String(i).padStart(2, '0')}`
    list.push({ id, number: num, zone: 'Male', status: 'available' })
  }

  // Female Floor: 201-220 (20 lockers)
  for (let i = 1; i <= 20; i++) {
    const num = 200 + i
    const id = `lck_f_${String(i).padStart(2, '0')}`
    list.push({ id, number: num, zone: 'Female', status: 'available' })
  }

  // Executive VIP: 301-308 (8 lockers)
  for (let i = 1; i <= 8; i++) {
    const num = 300 + i
    const id = `lck_vip_${String(i).padStart(2, '0')}`
    list.push({ id, number: num, zone: 'VIP', status: 'available' })
  }

  return list
}

export const SEEDED_LOCKERS: Locker[] = buildInitialLockers()

export const SEEDED_SHIFTS: CashShiftHandover[] = []

// ─── Storage Helpers ───

export function getStoredLeads(): WalkInLead[] {
  if (typeof window === 'undefined') return SEEDED_LEADS
  const stored = localStorage.getItem(LEADS_STORAGE_KEY)
  if (!stored) {
    localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(SEEDED_LEADS))
    return SEEDED_LEADS
  }
  try { return JSON.parse(stored) } catch { return SEEDED_LEADS }
}

export function saveLeads(leads: WalkInLead[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(leads))
}

export function getStoredPosProducts(): PosProduct[] {
  if (typeof window === 'undefined') return SEEDED_POS_PRODUCTS
  const stored = localStorage.getItem(POS_PRODUCTS_KEY)
  if (!stored) {
    localStorage.setItem(POS_PRODUCTS_KEY, JSON.stringify(SEEDED_POS_PRODUCTS))
    return SEEDED_POS_PRODUCTS
  }
  try { return JSON.parse(stored) } catch { return SEEDED_POS_PRODUCTS }
}

function pushFrontDeskRemote(key: 'fd_pos_products' | 'fd_pos_sales' | 'fd_lockers' | 'fd_shifts', payload: unknown) {
  if (typeof window === 'undefined') return
  fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'SAVE_CONFIG', key, payload }),
  }).catch(() => {})
}

export async function syncFrontDeskFromRemote(): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    const res = await fetch('/api/settings?scope=frontdesk')
    if (!res.ok) return
    const data = await res.json()
    const cfg = data?.configs || {}
    let changed = false
    if (Array.isArray(cfg.fd_pos_products) && cfg.fd_pos_products.length > 0) {
      localStorage.setItem(POS_PRODUCTS_KEY, JSON.stringify(cfg.fd_pos_products))
      changed = true
    }
    if (Array.isArray(cfg.fd_pos_sales) && cfg.fd_pos_sales.length > 0) {
      localStorage.setItem(POS_SALES_KEY, JSON.stringify(cfg.fd_pos_sales))
      changed = true
    }
    if (Array.isArray(cfg.fd_lockers) && cfg.fd_lockers.length >= 48) {
      localStorage.setItem(LOCKERS_KEY, JSON.stringify(cfg.fd_lockers))
      changed = true
    }
    if (Array.isArray(cfg.fd_shifts) && cfg.fd_shifts.length > 0) {
      localStorage.setItem(SHIFTS_KEY, JSON.stringify(cfg.fd_shifts))
      changed = true
    }
    if (changed) {
      window.dispatchEvent(new CustomEvent('dna360_frontdesk_updated'))
    }
  } catch {
    // offline fallback
  }
}

export function savePosProducts(prods: PosProduct[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(POS_PRODUCTS_KEY, JSON.stringify(prods))
  pushFrontDeskRemote('fd_pos_products', prods)
}

export function getStoredPosSales(): PosSale[] {
  if (typeof window === 'undefined') return SEEDED_POS_SALES
  const stored = localStorage.getItem(POS_SALES_KEY)
  if (!stored) {
    localStorage.setItem(POS_SALES_KEY, JSON.stringify(SEEDED_POS_SALES))
    return SEEDED_POS_SALES
  }
  try { return JSON.parse(stored) } catch { return SEEDED_POS_SALES }
}

export function savePosSales(sales: PosSale[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(POS_SALES_KEY, JSON.stringify(sales))
  pushFrontDeskRemote('fd_pos_sales', sales)
}

export function getStoredLockers(): Locker[] {
  if (typeof window === 'undefined') return SEEDED_LOCKERS
  const stored = localStorage.getItem(LOCKERS_KEY)
  if (!stored) {
    localStorage.setItem(LOCKERS_KEY, JSON.stringify(SEEDED_LOCKERS))
    return SEEDED_LOCKERS
  }
  try {
    const parsed = JSON.parse(stored)
    // Reseed if older version stored fewer than the 48 flagship studio lockers
    if (Array.isArray(parsed) && parsed.length < 48) {
      localStorage.setItem(LOCKERS_KEY, JSON.stringify(SEEDED_LOCKERS))
      return SEEDED_LOCKERS
    }
    return parsed
  } catch {
    return SEEDED_LOCKERS
  }
}

export function saveLockers(lockers: Locker[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LOCKERS_KEY, JSON.stringify(lockers))
  pushFrontDeskRemote('fd_lockers', lockers)
  window.dispatchEvent(new CustomEvent('dna360_frontdesk_updated'))
}

export function getStoredShifts(): CashShiftHandover[] {
  if (typeof window === 'undefined') return SEEDED_SHIFTS
  const stored = localStorage.getItem(SHIFTS_KEY)
  if (!stored) {
    localStorage.setItem(SHIFTS_KEY, JSON.stringify(SEEDED_SHIFTS))
    return SEEDED_SHIFTS
  }
  try { return JSON.parse(stored) } catch { return SEEDED_SHIFTS }
}

export function saveShifts(shifts: CashShiftHandover[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(SHIFTS_KEY, JSON.stringify(shifts))
  pushFrontDeskRemote('fd_shifts', shifts)
}

// ─── Operations ───

export function recordPosSale(data: Omit<PosSale, 'id' | 'receiptNumber' | 'timestamp'> & { gstMinor?: number }): PosSale {
  const gst = backCalculateGst(data.totalMinor, 0.05)
  const newSale: PosSale = {
    ...data,
    id: `pos_${Date.now()}`,
    receiptNumber: `DNA/POS/${new Date().toISOString().slice(0, 7)}/${String(Date.now()).slice(-4)}`,
    gstMinor: data.gstMinor ?? gst.totalTax,
    timestamp: new Date().toISOString(),
  }

  const sales = getStoredPosSales()
  savePosSales([newSale, ...sales])

  // Update stock counts
  const prods = getStoredPosProducts()
  for (const item of data.items) {
    const p = prods.find(pr => pr.id === item.productId)
    if (p) {
      p.stockCount = Math.max(0, p.stockCount - item.quantity)
    }
  }
  savePosProducts(prods)

  // Link POS retail sale into the central billing ledger
  try {
    const lineItems = data.items.map((it) =>
      buildLineItem({
        productId: it.productId || 'prod_retail',
        description: it.productName,
        sacCode: '21069099',
        quantity: it.quantity,
        unitPriceInclusiveMinor: it.priceMinor,
        discountMinor: 0,
        taxRate: 0.05,
      })
    )

    const grandTotalMinor = lineItems.reduce((s, it) => s + (it.totalMinor || 0), 0)

    issueInvoice({
      memberId: data.customerId || `guest_${Date.now()}`,
      memberName: data.customerName,
      memberPhone: data.customerPhone || '+919820000000',
      items: lineItems,
      payments: [
        {
          id: `pay_${Date.now()}`,
          mode: (data.paymentMode as any) || 'UPI',
          amountMinor: grandTotalMinor,
          recordedAt: new Date().toISOString(),
        },
      ],
      salesRepId: 'usr_frontdesk',
      salesRepName: data.recordedBy || 'Front Desk Staff',
      createdBy: { id: 'usr_frontdesk', name: data.recordedBy || 'Front Desk Staff', role: 'FrontDesk' },
      invoiceNumber: newSale.receiptNumber,
    })
  } catch (err) {
    console.error('Failed to link POS sale into billing ledger:', err)
  }

  logAuditEvent({
    actor: { id: 'usr_fc', name: data.recordedBy, email: '', role: 'Fitness Consultant' },
    action: 'CREATE',
    entity: 'PosSale',
    entityId: newSale.id,
    branchId: 'pow',
    description: `Recorded POS Sale ${newSale.receiptNumber} (${(newSale.totalMinor / 100).toLocaleString('en-IN')})`,
    afterState: newSale,
  })

  return newSale
}

export const createPosSale = recordPosSale

export function createWalkInLead(data: Partial<WalkInLead> & Pick<WalkInLead, 'name' | 'phone' | 'goal' | 'source'>): WalkInLead {
  const leads = getStoredLeads()
  const hasTrialPass = data.trialPassIssued ?? data.issueTrialPass ?? true
  const newLead: WalkInLead = {
    id: `lead_${Date.now()}`,
    name: data.name,
    phone: data.phone,
    email: data.email,
    goal: data.goal,
    source: data.source,
    trialPassIssued: hasTrialPass,
    issueTrialPass: hasTrialPass,
    trialPassCode: hasTrialPass ? `TP-${String(Date.now()).slice(-4)}` : undefined,
    trialDate: hasTrialPass ? new Date().toISOString().slice(0, 10) : undefined,
    status: data.status || (hasTrialPass ? 'trial_active' : 'inquiry'),
    notes: data.notes,
    branchId: data.branchId || 'pow',
    branchName: data.branchName || 'Powai',
    assignedTo: data.assignedTo,
    createdAt: new Date().toISOString(),
  }
  leads.unshift(newLead)
  saveLeads(leads)

  if (typeof window !== 'undefined') {
    fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prospectName: newLead.name,
        phone: newLead.phone,
        email: newLead.email,
        source: newLead.source || 'Walk-in',
        interestArea: newLead.goal || 'General Gym',
        assignedStaffName: newLead.assignedTo || 'Pallavi More',
        trialDate: newLead.trialDate,
        notes: newLead.notes,
      }),
    }).catch(() => {})
  }

  return newLead
}

export interface AssignLockerOptions {
  lockerId: string
  memberId?: string
  memberName: string
  memberPhone?: string
  assignmentType?: 'daily' | 'rental'
  durationMonths?: number
  keyTag?: string
  notes?: string
}

export function assignLocker(
  lockerIdOrOptions: string | AssignLockerOptions,
  memberId?: string,
  memberName?: string,
  memberPhone?: string,
  durationMonths = 0,
  assignmentType: 'daily' | 'rental' = 'daily',
  keyTag?: string
): Locker | null {
  const lockers = getStoredLockers()
  let opts: AssignLockerOptions

  if (typeof lockerIdOrOptions === 'object') {
    opts = lockerIdOrOptions
  } else {
    opts = {
      lockerId: lockerIdOrOptions,
      memberId,
      memberName: memberName || 'Guest Member',
      memberPhone,
      durationMonths,
      assignmentType: assignmentType || (durationMonths > 0 ? 'rental' : 'daily'),
      keyTag,
    }
  }

  const index = lockers.findIndex((l) => l.id === opts.lockerId)
  if (index === -1) return null

  const isRental = opts.assignmentType === 'rental' || (opts.durationMonths && opts.durationMonths > 0)
  let expiryStr: string | undefined = undefined

  if (isRental) {
    const months = opts.durationMonths && opts.durationMonths > 0 ? opts.durationMonths : 1
    const expiry = new Date()
    expiry.setMonth(expiry.getMonth() + months)
    expiryStr = expiry.toISOString().slice(0, 10)
  }

  lockers[index] = {
    ...lockers[index],
    status: isRental ? 'dedicated_rental' : 'occupied',
    assignmentType: isRental ? 'rental' : 'daily',
    assignedMemberId: opts.memberId,
    assignedMemberName: opts.memberName,
    assignedMemberPhone: opts.memberPhone,
    assignedAt: new Date().toISOString(),
    rentalExpiryDate: expiryStr,
    keyTag: opts.keyTag,
    notes: opts.notes,
  }

  saveLockers(lockers)

  logAuditEvent({
    actor: { id: 'usr_frontdesk', name: 'Front Desk', email: '', role: 'Reception' },
    action: 'UPDATE',
    entity: 'Locker',
    entityId: lockers[index].id,
    branchId: 'pow',
    description: `Assigned Locker #${lockers[index].number} (${lockers[index].zone}) to ${opts.memberName} · Mode: ${isRental ? 'Dedicated Rental' : 'Daily Floor Key'}`,
  })

  return lockers[index]
}

export function releaseLocker(lockerId: string): Locker | null {
  const lockers = getStoredLockers()
  const index = lockers.findIndex((l) => l.id === lockerId)
  if (index === -1) return null

  const prev = lockers[index]
  lockers[index] = {
    ...lockers[index],
    status: 'available',
    assignedMemberId: undefined,
    assignedMemberName: undefined,
    assignedMemberPhone: undefined,
    assignedAt: undefined,
    rentalExpiryDate: undefined,
    assignmentType: undefined,
    keyTag: undefined,
    notes: undefined,
  }

  saveLockers(lockers)

  logAuditEvent({
    actor: { id: 'usr_frontdesk', name: 'Front Desk', email: '', role: 'Reception' },
    action: 'UPDATE',
    entity: 'Locker',
    entityId: prev.id,
    branchId: 'pow',
    description: `Released Locker #${prev.number} (${prev.zone}) from ${prev.assignedMemberName || 'Guest'} · Key Checked In`,
  })

  return lockers[index]
}

export function toggleLockerMaintenance(lockerId: string, reason?: string): Locker | null {
  const lockers = getStoredLockers()
  const index = lockers.findIndex((l) => l.id === lockerId)
  if (index === -1) return null

  const current = lockers[index]
  const isNowMaintenance = current.status !== 'maintenance'

  lockers[index] = {
    ...current,
    status: isNowMaintenance ? 'maintenance' : 'available',
    notes: isNowMaintenance ? (reason || 'Lock maintenance / repair needed') : undefined,
    assignedMemberId: undefined,
    assignedMemberName: undefined,
    assignedMemberPhone: undefined,
    assignedAt: undefined,
    rentalExpiryDate: undefined,
    assignmentType: undefined,
    keyTag: undefined,
  }

  saveLockers(lockers)

  logAuditEvent({
    actor: { id: 'usr_frontdesk', name: 'Front Desk', email: '', role: 'Reception' },
    action: 'UPDATE',
    entity: 'Locker',
    entityId: current.id,
    branchId: 'pow',
    description: isNowMaintenance
      ? `Marked Locker #${current.number} (${current.zone}) for Maintenance: ${reason || 'Out of order'}`
      : `Restored Locker #${current.number} (${current.zone}) to Available`,
  })

  return lockers[index]
}

export function autoAssignNextLocker(
  zone: string,
  options: Omit<AssignLockerOptions, 'lockerId'>
): Locker | null {
  const lockers = getStoredLockers()
  const available = lockers.find(
    (l) => (zone === 'all' || l.zone.toLowerCase() === zone.toLowerCase()) && l.status === 'available'
  )
  if (!available) return null

  return assignLocker({
    ...options,
    lockerId: available.id,
  })
}

export function closeShiftHandover(
  arg1: string | (Omit<CashShiftHandover, 'id' | 'status' | 'closedAt' | 'discrepancyMinor'> & { id?: string; shiftId?: string }),
  arg2?: { actualCashCountedMinor: number; notes?: string; staffName: string }
): CashShiftHandover {
  const shifts = getStoredShifts()
  if (typeof arg1 === 'string') {
    const shiftId = arg1
    const index = shifts.findIndex(s => s.id === shiftId)
    if (index === -1) {
      const fallback: CashShiftHandover = {
        id: shiftId,
        branchId: 'pow',
        branchName: 'Powai',
        shiftType: 'Morning',
        staffId: 'usr_fd_01',
        staffName: arg2?.staffName || 'Front Desk',
        openedAt: new Date().toISOString(),
        closedAt: new Date().toISOString(),
        openingFloatMinor: 500000,
        cashSalesMinor: 1820000,
        pettyCashOutflowsMinor: 40000,
        expectedCashMinor: 2280000,
        actualCashCountedMinor: arg2?.actualCashCountedMinor || 2280000,
        discrepancyMinor: 0,
        notes: arg2?.notes,
        status: 'closed',
      }
      saveShifts([fallback, ...shifts])
      return fallback
    }
    const shift = shifts[index]
    const discrepancy = (arg2?.actualCashCountedMinor ?? shift.actualCashCountedMinor) - shift.expectedCashMinor
    shifts[index] = {
      ...shift,
      closedAt: new Date().toISOString(),
      actualCashCountedMinor: arg2?.actualCashCountedMinor ?? shift.actualCashCountedMinor,
      discrepancyMinor: discrepancy,
      notes: arg2?.notes || shift.notes,
      status: 'closed',
    }
    saveShifts(shifts)
    return shifts[index]
  } else {
    const data = arg1
    const discrepancy = data.actualCashCountedMinor - data.expectedCashMinor
    const newShift: CashShiftHandover = {
      ...data,
      id: data.id || data.shiftId || `shift_${Date.now()}`,
      closedAt: new Date().toISOString(),
      discrepancyMinor: discrepancy,
      status: 'closed',
    }
    saveShifts([newShift, ...shifts])
    return newShift
  }
}
