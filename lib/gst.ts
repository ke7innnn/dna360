/* ============================================================
   DNA 360 — GST Calculation Engine
   
   THE MOST CRITICAL MODULE IN THE SYSTEM.
   
   All prices are GST-inclusive. Tax is BACK-CALCULATED out of
   the inclusive amount, NEVER added on top.
   Getting this backwards corrupts every invoice.
   
   Tax rate is per-product, not global:
     - 5% (SAC 999723) for all fitness services (DEFAULT)
     - 18% for marketing / space-rental line items
   
   Supplier and place of supply are both Maharashtra (27),
   so invoices split CGST + SGST, half each.
   ============================================================ */

/**
 * GST breakdown for a single amount.
 * All values in paise (integer minor units).
 */
export interface GstBreakdown {
  /** The original GST-inclusive amount */
  inclusive: number
  /** Taxable value (inclusive minus tax) */
  taxable: number
  /** CGST (Central GST) — half of total tax for intra-state */
  cgst: number
  /** SGST (State GST) — half of total tax for intra-state */
  sgst: number
  /** IGST — zero for intra-state (both parties in Maharashtra) */
  igst: number
  /** Total tax (cgst + sgst + igst) */
  totalTax: number
  /** The tax rate used (e.g. 0.05 or 0.18) */
  taxRate: number
}

/**
 * Back-calculate GST from a GST-inclusive amount.
 * 
 * This is the ONLY direction this system uses. Tax is extracted
 * from the inclusive price, never added on top.
 * 
 * Formula:
 *   taxable = inclusive × 100 / (100 + taxRate × 100)
 *   totalTax = inclusive - taxable
 *   cgst = floor(totalTax / 2)
 *   sgst = totalTax - cgst  (remainder handles odd paise)
 * 
 * @param inclusiveAmountMinor - GST-inclusive amount in paise
 * @param taxRate - Tax rate as decimal (0.05 for 5%, 0.18 for 18%)
 * @returns GstBreakdown with all components in paise
 * 
 * @example
 * // ₹43,500 annual gym package at 5% GST
 * backCalculateGst(4350000, 0.05)
 * // → { inclusive: 4350000, taxable: 4142857, cgst: 103571, sgst: 103572, ... }
 * 
 * @example
 * // ₹25,000 marketing package at 18% GST
 * backCalculateGst(2500000, 0.18)
 * // → { inclusive: 2500000, taxable: 2118644, cgst: 190678, sgst: 190678, ... }
 */
export function backCalculateGst(
  inclusiveAmountMinor: number,
  taxRate: number
): GstBreakdown {
  // Validate inputs
  if (inclusiveAmountMinor < 0) {
    throw new Error('GST: Inclusive amount cannot be negative')
  }
  if (taxRate < 0 || taxRate > 1) {
    throw new Error(`GST: Tax rate ${taxRate} is outside valid range [0, 1]`)
  }

  // Zero amount = zero everything
  if (inclusiveAmountMinor === 0) {
    return { inclusive: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0, taxRate }
  }

  // Zero tax rate = no tax
  if (taxRate === 0) {
    return {
      inclusive: inclusiveAmountMinor,
      taxable: inclusiveAmountMinor,
      cgst: 0,
      sgst: 0,
      igst: 0,
      totalTax: 0,
      taxRate,
    }
  }

  // Back-calculate taxable from inclusive
  // taxable = inclusive × 100 / (100 + rate%)
  const taxRatePct = taxRate * 100 // e.g. 5 or 18
  const taxable = Math.round(inclusiveAmountMinor * 100 / (100 + taxRatePct))
  const totalTax = inclusiveAmountMinor - taxable

  // Intra-state split: supplier (27 Maharashtra) = place of supply (27 Maharashtra)
  // Therefore: CGST + SGST, half each
  // Use floor + remainder to handle odd paise
  const cgst = Math.floor(totalTax / 2)
  const sgst = totalTax - cgst

  return {
    inclusive: inclusiveAmountMinor,
    taxable,
    cgst,
    sgst,
    igst: 0, // Always 0 for intra-state
    totalTax,
    taxRate,
  }
}

/**
 * Determine whether the tax split should be CGST+SGST or IGST.
 * 
 * Both supplier and place of supply must be compared.
 * If same state → CGST + SGST (intra-state)
 * If different state → IGST (inter-state)
 * 
 * DNA 360 is single-location Maharashtra (27), so this always
 * returns 'intra-state'. But the function exists so the logic
 * is derived, not hardcoded.
 * 
 * @param supplierStateCode - Supplier's state code (e.g. "27" for Maharashtra)
 * @param placeOfSupplyCode - Place of supply state code
 */
export function determineTaxSplit(
  supplierStateCode: string,
  placeOfSupplyCode: string
): 'intra-state' | 'inter-state' {
  return supplierStateCode === placeOfSupplyCode ? 'intra-state' : 'inter-state'
}

/** DNA 360's supplier state code (Maharashtra) */
export const SUPPLIER_STATE_CODE = '27'

/** Default place of supply (Maharashtra — same as supplier) */
export const DEFAULT_PLACE_OF_SUPPLY = '27'

/** Default tax rate for fitness services */
export const DEFAULT_FITNESS_TAX_RATE = 0.05

/** Tax rate for marketing / space rental services */
export const MARKETING_TAX_RATE = 0.18

/** Default SAC code for fitness services */
export const DEFAULT_SAC_CODE = '999723'

/**
 * Format an amount in paise as Indian Rupees.
 * e.g. 4350000 → "₹43,500"
 */
export function formatINR(amountMinor?: number | null): string {
  if (typeof amountMinor !== 'number' || isNaN(amountMinor)) return '₹0'
  const rupees = amountMinor / 100
  return `₹${rupees.toLocaleString('en-IN', { 
    minimumFractionDigits: 0,
    maximumFractionDigits: 2 
  })}`
}

/**
 * Convert ex-tax amount to inclusive amount.
 * Used during Gymex migration — their cost columns are ex-tax.
 * BaseCost × (1 + taxRate) = inclusive
 */
export function exTaxToInclusive(exTaxMinor: number, taxRate: number): number {
  return Math.round(exTaxMinor * (1 + taxRate))
}

/**
 * Converts a paise amount to Indian English words for GST invoice compliance.
 * e.g. 4350000 → "Rupees Forty Three Thousand Five Hundred Only"
 */
export function numberToWordsINR(amountMinor: number): string {
  const amount = Math.floor(amountMinor / 100)
  if (amount === 0) return 'Rupees Zero Only'

  const units = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
  ]
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  function convertTwoDigits(n: number): string {
    if (n < 20) return units[n]
    const u = n % 10
    const t = Math.floor(n / 10)
    return `${tens[t]}${u > 0 ? ` ${units[u]}` : ''}`
  }

  function convertThreeDigits(n: number): string {
    if (n === 0) return ''
    const h = Math.floor(n / 100)
    const rem = n % 100
    let result = ''
    if (h > 0) result += `${units[h]} Hundred`
    if (rem > 0) result += `${h > 0 ? ' and ' : ''}${convertTwoDigits(rem)}`
    return result
  }

  // Indian numbering: Crore, Lakh, Thousand, Hundred
  const crore = Math.floor(amount / 10000000)
  const lakh = Math.floor((amount % 10000000) / 100000)
  const thousand = Math.floor((amount % 100000) / 1000)
  const hundred = amount % 1000

  let words = ''
  if (crore > 0) words += `${convertTwoDigits(crore)} Crore `
  if (lakh > 0) words += `${convertTwoDigits(lakh)} Lakh `
  if (thousand > 0) words += `${convertTwoDigits(thousand)} Thousand `
  if (hundred > 0) words += convertThreeDigits(hundred)

  return `Rupees ${words.trim()} Only`
}

/**
 * Get current Indian Financial Year string (e.g. "2026-27" for FY starting April 2026).
 */
export function getFinancialYear(date: Date = new Date()): string {
  const month = date.getMonth() // 0-indexed: 0=Jan, 3=Apr
  const year = date.getFullYear()
  const startYear = month >= 3 ? year : year - 1
  const endYear = (startYear + 1) % 100
  return `${startYear}-${String(endYear).padStart(2, '0')}`
}
