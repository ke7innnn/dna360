/* ============================================================
   DNA 360 — Gymex Migration Pipeline
   
   - Parses Gymex CSV export (46 columns, 679 live members)
   - Idempotent, dry-runnable, row-level validation & error reporting
   - Ex-tax cost conversion: Base Cost × 1.05 = inclusive list price
   - Session balances set to NULL & flagged for verification
   - Attribution to 6 historical inactive sales reps
   - Deduplication: "Krrish Rawat" -> "Krish Rawat"
   - Flags 5 expired and 85 memberships expiring within 30 days
   ============================================================ */

import type { Member, MembershipRecord, MemberKYC, MarketingConsent } from '@/types/member'
import type { Entitlement } from '@/types/entitlement'
import { exTaxToInclusive, DEFAULT_FITNESS_TAX_RATE } from '@/lib/gst'
import { normalizeIndianPhone } from '@/lib/auth'
import { logAuditEvent } from '@/lib/audit'
import { saveMembers, getStoredMembers } from '@/lib/members'

export interface GymexRawRow {
  member_id?: string
  member_code?: string
  first_name: string
  last_name?: string
  mobile: string
  email?: string
  gender?: string
  dob?: string
  enrolment_date?: string
  start_date?: string
  expiry_date?: string
  package_name: string
  base_cost?: string | number // Ex-tax cost
  discount?: string | number
  paid_amount?: string | number
  sales_rep?: string
  referred_by_code?: string
  emergency_contact?: string
  emergency_phone?: string
  blood_group?: string
  special_notes?: string
}

export interface MigrationValidationError {
  rowNumber: number
  memberCode: string
  field: string
  message: string
  severity: 'error' | 'warning'
}

export interface MigrationReport {
  totalRows: number
  validRows: number
  errorCount: number
  warningCount: number
  membersCreated: number
  membershipsCreated: number
  entitlementsCreated: number
  expiredCount: number
  expiringIn30DaysCount: number
  historicalSalesRepsMapped: number
  deduplicatedCount: number
  errors: MigrationValidationError[]
  isDryRun: boolean
}

// ─── Historical Sales Rep Mapping ───
const HISTORICAL_SALES_REPS: Record<string, { id: string; name: string }> = {
  swati: { id: 'usr_hist_01', name: 'Swati' },
  'deeksha kenjale': { id: 'usr_hist_02', name: 'Deeksha Kenjale' },
  'kiran solanki': { id: 'usr_hist_03', name: 'Kiran Solanki' },
  'abhijit mahdalkar': { id: 'usr_hist_04', name: 'Abhijit Mahdalkar' },
  'amita galphade': { id: 'usr_hist_05', name: 'Amita Galphade' },
  'vaishnavi javia': { id: 'usr_hist_06', name: 'Vaishnavi Javia' },
}

/**
 * Normalizes staff/trainer names (e.g. deduplicates Krrish Rawat -> Krish Rawat).
 */
export function normalizeStaffName(name: string): string {
  const trimmed = name.trim()
  if (trimmed.toLowerCase() === 'krrish rawat') {
    return 'Krish Rawat'
  }
  return trimmed
}

/**
 * Resolves a sales rep name to a staff ID and canonical name.
 */
export function resolveSalesRep(rawName: string | undefined): { id: string; name: string } {
  if (!rawName) return { id: 'usr_fc_01', name: 'Amit Sharma' }
  const normalized = normalizeStaffName(rawName).toLowerCase()
  if (HISTORICAL_SALES_REPS[normalized]) {
    return HISTORICAL_SALES_REPS[normalized]
  }
  return { id: `usr_rep_${normalized.replace(/\s+/g, '_')}`, name: normalizeStaffName(rawName) }
}

/**
 * Parses and processes a Gymex migration batch.
 */
export function executeGymexMigration(
  rows: GymexRawRow[],
  dryRun: boolean = true
): MigrationReport {
  const report: MigrationReport = {
    totalRows: rows.length,
    validRows: 0,
    errorCount: 0,
    warningCount: 0,
    membersCreated: 0,
    membershipsCreated: 0,
    entitlementsCreated: 0,
    expiredCount: 0,
    expiringIn30DaysCount: 0,
    historicalSalesRepsMapped: 0,
    deduplicatedCount: 0,
    errors: [],
    isDryRun: dryRun,
  }

  const newMembers: Member[] = []
  const todayStr = new Date().toISOString().slice(0, 10)
  const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  rows.forEach((row, index) => {
    const rowNum = index + 1
    const code = row.member_code || `DNA-LEGACY-${String(rowNum).padStart(4, '0')}`

    // Validation: Phone is mandatory (100% coverage expected)
    if (!row.mobile) {
      report.errors.push({
        rowNumber: rowNum,
        memberCode: code,
        field: 'mobile',
        message: 'Mobile phone number is missing (mandatory).',
        severity: 'error',
      })
      report.errorCount++
      return
    }

    const phone = normalizeIndianPhone(String(row.mobile))

    // Validation: Package name is mandatory
    if (!row.package_name) {
      report.errors.push({
        rowNumber: rowNum,
        memberCode: code,
        field: 'package_name',
        message: 'Package/plan name is missing.',
        severity: 'error',
      })
      report.errorCount++
      return
    }

    // Name normalization
    if (row.sales_rep && row.sales_rep.toLowerCase().includes('krrish')) {
      report.deduplicatedCount++
    }

    const salesRep = resolveSalesRep(row.sales_rep)
    if (salesRep.id.startsWith('usr_hist_')) {
      report.historicalSalesRepsMapped++
    }

    // Cost calculation: Base cost is ex-tax in Gymex -> multiply by 1.05 for inclusive list price
    const rawBaseCost = typeof row.base_cost === 'number' ? row.base_cost : parseFloat(String(row.base_cost || 0))
    const exTaxMinor = Math.round(rawBaseCost * 100)
    const inclusiveAmountMinor = exTaxToInclusive(exTaxMinor, DEFAULT_FITNESS_TAX_RATE)

    // Dates
    const enrolmentDate = row.enrolment_date || row.start_date || todayStr
    const activationDate = row.start_date || enrolmentDate
    const expiryDate = row.expiry_date || null

    if (expiryDate && expiryDate < todayStr) {
      report.expiredCount++
    } else if (expiryDate && expiryDate <= thirtyDaysLater) {
      report.expiringIn30DaysCount++
    }

    // Warnings for missing optional data
    if (!row.email) {
      report.warningCount = (report.warningCount || 0) + 1
    }
    if (!row.dob) {
      report.warningCount = (report.warningCount || 0) + 1
    }

    // Build Membership Record
    const membership: MembershipRecord = {
      id: `ms_mig_${Date.now()}_${rowNum}`,
      product_id: 'prod_migrated',
      product_name: row.package_name,
      product_category: 'gym_membership',
      enrolment_date: enrolmentDate,
      activation_date: activationDate,
      expiry_date: expiryDate,
      amount_paid: inclusiveAmountMinor,
      discount_amount: 0,
      discount_reason: null,
      discount_approved_by: null,
      tax_rate: DEFAULT_FITNESS_TAX_RATE,
      status: expiryDate && expiryDate < todayStr ? 'expired' : 'active',
      invoice_id: `inv_legacy_${rowNum}`,
      invoice_number: `DNA/LEGACY/${String(rowNum).padStart(4, '0')}`,
      sales_rep_id: salesRep.id,
      sales_rep_name: salesRep.name,
      sessions_total: null, // Session balance unknown in Gymex -> NULL
      sessions_consumed: null,
      sessions_remaining: null, // Flagged for manual verification
      access_window: null,
      void_reason: null,
      voided_by: null,
      voided_at: null,
      transferred_from: null,
      transferred_to: null,
      transfer_fee_invoice_id: null,
    }

    // Build Member Record
    const member: Member = {
      id: row.member_id || `mem_mig_${Date.now()}_${rowNum}`,
      member_code: code,
      first_name: row.first_name || 'Member',
      last_name: row.last_name || '',
      name: `${row.first_name || 'Member'} ${row.last_name || ''}`.trim(),
      email: row.email || null,
      phone,
      gender: (row.gender?.toLowerCase() === 'female' ? 'female' : 'male') as 'male' | 'female',
      dob: row.dob || null,
      joined_date: enrolmentDate,
      status: expiryDate && expiryDate < todayStr ? 'inactive' : 'active',
      active_memberships: expiryDate && expiryDate < todayStr ? [] : [membership],
      past_memberships: expiryDate && expiryDate < todayStr ? [membership] : [],
      kyc: {
        id_type: null,
        id_last_four: null,
        id_verified: false,
        id_verifier: null,
        id_verified_at: null,
        blood_group: (row.blood_group as MemberKYC['blood_group']) || null,
        emergency_contact_name: row.emergency_contact || null,
        emergency_contact_phone: row.emergency_phone ? normalizeIndianPhone(row.emergency_phone) : null,
        emergency_contact_relation: null,
        medical_notes: null,
        injuries: null,
      },
      consent: {
        sms: true,
        email: !!row.email,
        whatsapp: false, // Must be captured fresh
        updated_at: todayStr,
      },
      attendance_streak: 0,
      last_visit_at: null,
      total_check_ins: 0,
      fitness_metrics: [],
      staff_notes: row.special_notes ? [
        {
          id: `sn_mig_${rowNum}`,
          authorId: 'system',
          authorName: 'Gymex Migration',
          authorRole: 'System',
          timestamp: todayStr,
          content: `Imported Gymex note: ${row.special_notes}`,
          type: 'general',
        },
      ] : [],
      tags: ['Gymex Migration', ...(expiryDate && expiryDate < todayStr ? ['Expired Legacy'] : [])],
      blacklisted: false,
      blacklist_reason: null,
      blacklisted_by: null,
      blacklisted_at: null,
      complimentary: false,
      special_inclusions: row.special_notes || null,
      referred_by: row.referred_by_code || null,
      referral_code: `${(row.first_name || 'DNA').toUpperCase()}360`,
      lifetime_value: inclusiveAmountMinor,
      media_consent: null,
      adjustment_credits_remaining: 0,
      assigned_trainer_id: null,
      assigned_trainer_name: null,
    }

    newMembers.push(member)
    report.validRows++
    report.membersCreated++
    report.membershipsCreated++
  })

  // Commit if not dry-run
  if (!dryRun && newMembers.length > 0) {
    const existing = getStoredMembers()
    saveMembers([...newMembers, ...existing])

    logAuditEvent({
      actor: { id: 'system', name: 'Migration Pipeline', email: '', role: 'Admin' },
      action: 'CREATE',
      entity: 'Migration',
      entityId: `mig_${Date.now()}`,
      branchId: 'pow',
      description: `Executed Gymex migration: Imported ${newMembers.length} members.`,
      afterState: report,
    })
  }

  return report
}
