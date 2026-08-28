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

const LEADS_STORAGE_KEY = 'dna360_walkin_leads'
const POS_PRODUCTS_KEY = 'dna360_pos_products'
const POS_SALES_KEY = 'dna360_pos_sales'
const LOCKERS_KEY = 'dna360_lockers'
const SHIFTS_KEY = 'dna360_cash_shifts'

export const SEEDED_POS_PRODUCTS: PosProduct[] = [
  { id: 'prod_01', name: 'DNA 360 Triple Chocolate Whey Isolate Shake', category: 'shake', priceMinor: 25000, costMinor: 11000, stockCount: 140, sku: 'DNA-SHK-01', taxRate: 0.05 },
  { id: 'prod_02', name: 'BCAA Electrolyte Hydration Drink (Watermelon)', category: 'beverage', priceMinor: 15000, costMinor: 6000, stockCount: 85, sku: 'DNA-BEV-02', taxRate: 0.05 },
  { id: 'prod_03', name: 'High-Protein Crunch Bar (20g Protein)', category: 'snack', priceMinor: 18000, costMinor: 8000, stockCount: 120, sku: 'DNA-SNK-03', taxRate: 0.05 },
  { id: 'prod_04', name: 'DNA 360 Heavy Duty Lifting Wrist Straps', category: 'gear', priceMinor: 65000, costMinor: 28000, stockCount: 45, sku: 'DNA-GER-04', taxRate: 0.05 },
  { id: 'prod_05', name: 'DNA 360 Stainless Steel Matte Shaker Bottle', category: 'gear', priceMinor: 85000, costMinor: 38000, stockCount: 30, sku: 'DNA-GER-05', taxRate: 0.05 },
  { id: 'prod_06', name: 'DNA 360 Oversized Acid-Wash Training Tee', category: 'apparel', priceMinor: 140000, costMinor: 60000, stockCount: 25, sku: 'DNA-APP-06', taxRate: 0.05 },
]

export const SEEDED_LEADS: WalkInLead[] = [
  {
    id: 'lead_001',
    name: 'Siddharth Rao',
    phone: '+919820099444',
    email: 'sid.rao@gmail.com',
    goal: 'Muscle Gain',
    source: 'Walk In',
    trialPassIssued: true,
    trialPassCode: 'TRIAL-POW-2026-0881',
    trialDate: new Date().toISOString().slice(0, 10),
    status: 'trial_active',
    notes: 'Looking for Annual All-Access with 1-on-1 PT coaching.',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    assignedTo: 'Amit Sharma (Fitness Consultant)',
  },
  {
    id: 'lead_002',
    name: 'Meera Nambiar',
    phone: '+919820099555',
    email: 'meera.n@gmail.com',
    goal: 'Fat Loss',
    source: 'Website',
    trialPassIssued: true,
    trialPassCode: 'TRIAL-POW-2026-0882',
    trialDate: new Date().toISOString().slice(0, 10),
    status: 'inquiry',
    notes: 'Interested in Power Yoga and Reformer Pilates.',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    assignedTo: 'Neha Kapoor (Fitness Consultant)',
  },
  {
    id: 'lead_003',
    name: 'Gaurav Kripalani',
    phone: '+919820099666',
    goal: 'Athletic Conditioning',
    source: 'Referral',
    trialPassIssued: false,
    status: 'inquiry',
    notes: 'Referred by Arjun Mehta. Enquired about CrossFit sessions.',
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    assignedTo: 'Amit Sharma (Fitness Consultant)',
  },
]

export const SEEDED_POS_SALES: PosSale[] = [
  {
    id: 'pos_001',
    receiptNumber: 'DNA/POS/2026-08/1042',
    customerType: 'member',
    customerId: 'mem_001',
    customerName: 'Arjun Mehta',
    customerPhone: '+919820011111',
    items: [
      { productId: 'prod_01', productName: 'DNA 360 Triple Chocolate Whey Isolate Shake', quantity: 1, priceMinor: 25000, totalMinor: 25000 },
      { productId: 'prod_03', productName: 'High-Protein Crunch Bar (20g Protein)', quantity: 2, priceMinor: 18000, totalMinor: 36000 },
    ],
    subtotalMinor: 61000,
    gstMinor: 2905, // 5% back-calculated
    totalMinor: 61000,
    paymentMode: 'UPI',
    transactionRef: 'UPI/POS/99120',
    recordedBy: 'Amit Sharma',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
]

export const SEEDED_LOCKERS: Locker[] = [
  { id: 'lck_m_01', number: 101, zone: 'Male', status: 'dedicated_rental', assignedMemberId: 'mem_001', assignedMemberName: 'Arjun Mehta', assignedMemberPhone: '+919820011111', assignedAt: '2025-01-15T00:00:00Z', rentalExpiryDate: '2027-01-15' },
  { id: 'lck_m_02', number: 102, zone: 'Male', status: 'available' },
  { id: 'lck_m_03', number: 103, zone: 'Male', status: 'occupied', assignedMemberName: 'Day Visitor (Walk-in)', assignedAt: new Date().toISOString() },
  { id: 'lck_f_01', number: 201, zone: 'Female', status: 'dedicated_rental', assignedMemberId: 'mem_002', assignedMemberName: 'Priya Sharma', assignedMemberPhone: '+919820022222', assignedAt: '2025-03-01T00:00:00Z', rentalExpiryDate: '2026-07-06' },
  { id: 'lck_f_02', number: 202, zone: 'Female', status: 'available' },
  { id: 'lck_f_03', number: 203, zone: 'Female', status: 'available' },
]

export const SEEDED_SHIFTS: CashShiftHandover[] = [
  {
    id: 'shift_001',
    shiftType: 'morning',
    staffId: 'usr_fc_01',
    staffName: 'Amit Sharma',
    openedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    closedAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    openingFloatMinor: 500000, // ₹5,000
    cashSalesMinor: 145000,   // ₹1,450 (Day Pass)
    pettyCashOutflowsMinor: 0,
    expectedCashMinor: 645000,
    actualCashCountedMinor: 645000,
    discrepancyMinor: 0,
    notes: 'Morning shift drawer balanced perfectly. 1 Day Pass sold in cash.',
    status: 'closed',
  },
]

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

export function savePosProducts(prods: PosProduct[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(POS_PRODUCTS_KEY, JSON.stringify(prods))
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
}

export function getStoredLockers(): Locker[] {
  if (typeof window === 'undefined') return SEEDED_LOCKERS
  const stored = localStorage.getItem(LOCKERS_KEY)
  if (!stored) {
    localStorage.setItem(LOCKERS_KEY, JSON.stringify(SEEDED_LOCKERS))
    return SEEDED_LOCKERS
  }
  try { return JSON.parse(stored) } catch { return SEEDED_LOCKERS }
}

export function saveLockers(lockers: Locker[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LOCKERS_KEY, JSON.stringify(lockers))
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
  return newLead
}

export function assignLocker(lockerId: string, memberId: string, memberName: string, memberPhone: string, durationMonths = 1): Locker | null {
  const lockers = getStoredLockers()
  const index = lockers.findIndex(l => l.id === lockerId)
  if (index === -1) return null

  const expiry = new Date()
  expiry.setMonth(expiry.getMonth() + durationMonths)

  lockers[index] = {
    ...lockers[index],
    status: durationMonths >= 1 ? 'dedicated_rental' : 'occupied',
    assignedMemberId: memberId,
    assignedMemberName: memberName,
    assignedMemberPhone: memberPhone,
    assignedAt: new Date().toISOString(),
    rentalExpiryDate: expiry.toISOString().slice(0, 10),
  }
  saveLockers(lockers)
  return lockers[index]
}

export function releaseLocker(lockerId: string): Locker | null {
  const lockers = getStoredLockers()
  const index = lockers.findIndex(l => l.id === lockerId)
  if (index === -1) return null

  lockers[index] = {
    ...lockers[index],
    status: 'available',
    assignedMemberId: undefined,
    assignedMemberName: undefined,
    assignedMemberPhone: undefined,
    assignedAt: undefined,
    rentalExpiryDate: undefined,
  }
  saveLockers(lockers)
  return lockers[index]
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
