/* ============================================================
   DNA 360 — Consent & E-Signing Module
   
   Three templates:
   - membership_tc: 22 clauses, single-party (member)
   - personal_training_tc: 16 clauses, three-party sequential
   - pilates_tc: 16 clauses, single-party, merge field for validity
   
   OTP to registered mobile (100% coverage vs 7% email).
   Rendered text is SNAPSHOT at signing — never re-rendered.
   ============================================================ */

import type {
  ConsentTemplate,
  ConsentDocumentType,
  SignedAgreement,
  SignatureRecord,
  ClauseConsent,
  ConsentClause,
  SignerRole,
} from '@/types/consent'
import { logAuditEvent } from '@/lib/audit'

const TEMPLATES_KEY = 'dna360_consent_templates'
const AGREEMENTS_KEY = 'dna360_signed_agreements'

// ─── Template Management ───

/**
 * Seeded consent templates.
 * Clause text would come from dna360-consent-templates.md in production.
 * These are placeholder structures with the correct metadata.
 */
export const SEEDED_TEMPLATES: ConsentTemplate[] = [
  {
    id: 'tpl_membership_tc_v1',
    type: 'membership_tc',
    version: 1,
    effective_from: '2025-01-01',
    superseded_at: null,
    title: 'DNA 360 Fitness — Membership Terms & Conditions',
    clauses: Array.from({ length: 22 }, (_, i) => ({
      number: i + 1,
      title: `Clause ${i + 1}`,
      body: `[Membership T&C clause ${i + 1} — to be populated from dna360-consent-templates.md]`,
      requires_explicit_consent: false,
      optional: false,
    })),
    signing_order: ['member'],
    blocks_service_until_complete: false,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'tpl_pt_tc_v1',
    type: 'personal_training_tc',
    version: 1,
    effective_from: '2025-01-01',
    superseded_at: null,
    title: 'DNA 360 Fitness — Personal Training Terms & Conditions',
    clauses: [
      ...Array.from({ length: 14 }, (_, i) => ({
        number: i + 1,
        title: `Clause ${i + 1}`,
        body: `[PT T&C clause ${i + 1} — to be populated from dna360-consent-templates.md]`,
        requires_explicit_consent: false,
        optional: false,
      })),
      {
        number: 15,
        title: 'Physical Assistance Consent',
        body: '[PT clause 15 — Physical assistance consent. Build prompt recommends presenting to ALL PT members, not just female clients. Client decision PENDING.]',
        requires_explicit_consent: true,
        optional: true, // Declining does NOT block the sale
      },
      {
        number: 16,
        title: 'Clause 16',
        body: '[PT T&C clause 16]',
        requires_explicit_consent: false,
        optional: false,
      },
    ],
    signing_order: ['member', 'trainer', 'head_coach'], // Three-party sequential
    blocks_service_until_complete: true, // Sessions not bookable until complete
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'tpl_pilates_tc_v1',
    type: 'pilates_tc',
    version: 1,
    effective_from: '2025-01-01',
    superseded_at: null,
    title: 'DNA 360 Fitness — Reformer Pilates Terms & Conditions',
    clauses: [
      ...Array.from({ length: 8 }, (_, i) => ({
        number: i + 1,
        title: `Clause ${i + 1}`,
        body: `[Pilates T&C clause ${i + 1}]`,
        requires_explicit_consent: false,
        optional: false,
        ...(i === 2 ? { merge_fields: ['validity_days'] } : {}), // Clause 3 has blank validity
      })),
      {
        number: 9,
        title: 'Media & Photography Consent',
        body: '[Pilates clause 9 — Media consent. Maps to media_consent flag on member record. Declined members surfaced to marketing.]',
        requires_explicit_consent: true,
        optional: true,
        merge_fields: undefined,
      },
      ...Array.from({ length: 7 }, (_, i) => ({
        number: i + 10,
        title: `Clause ${i + 10}`,
        body: `[Pilates T&C clause ${i + 10}]`,
        requires_explicit_consent: false,
        optional: false,
      })),
    ],
    signing_order: ['member'],
    blocks_service_until_complete: false,
    created_at: '2025-01-01T00:00:00Z',
  },
]

export function getTemplates(): ConsentTemplate[] {
  if (typeof window === 'undefined') return SEEDED_TEMPLATES
  const stored = localStorage.getItem(TEMPLATES_KEY)
  if (!stored) {
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(SEEDED_TEMPLATES))
    return SEEDED_TEMPLATES
  }
  try { return JSON.parse(stored) } catch { return SEEDED_TEMPLATES }
}

export function getCurrentTemplate(type: ConsentDocumentType): ConsentTemplate | null {
  const templates = getTemplates()
  return templates
    .filter(t => t.type === type && t.superseded_at === null)
    .sort((a, b) => b.version - a.version)[0] || null
}

// ─── Document Rendering ───

/**
 * Render a template with merge fields resolved.
 * The rendered text is SNAPSHOT — stored as-is with the signature.
 * Never re-render a historical agreement from the current template.
 */
export function renderTemplate(
  template: ConsentTemplate,
  mergeData: Record<string, string>
): string {
  let rendered = `${template.title}\nVersion ${template.version} — Effective from ${template.effective_from}\n\n`

  for (const clause of template.clauses) {
    let body = clause.body
    // Replace merge fields
    if (clause.merge_fields) {
      for (const field of clause.merge_fields) {
        body = body.replace(new RegExp(`\\{\\{${field}\\}\\}`, 'g'), mergeData[field] || `[${field}]`)
      }
    }
    rendered += `${clause.number}. ${clause.title}\n${body}\n\n`
  }

  return rendered
}

/**
 * Generate a SHA-256 hash of the document text.
 * Used for tamper detection in the signature evidence.
 */
export async function hashDocument(text: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    // Fallback for SSR: simple hash
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash |= 0
    }
    return `fallback-${Math.abs(hash).toString(16)}`
  }

  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// ─── Agreement Creation & Signing ───

export function getSignedAgreements(): SignedAgreement[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(AGREEMENTS_KEY)
  if (!stored) return []
  try { return JSON.parse(stored) } catch { return [] }
}

function saveAgreements(agreements: SignedAgreement[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(AGREEMENTS_KEY, JSON.stringify(agreements))
}

/**
 * Create a new agreement from a template.
 * Renders the text, hashes it, and stores the snapshot.
 */
export async function createAgreement(
  template: ConsentTemplate,
  memberId: string,
  membershipId: string,
  mergeData: Record<string, string> = {}
): Promise<SignedAgreement> {
  const renderedText = renderTemplate(template, mergeData)
  const documentHash = await hashDocument(renderedText)

  const agreement: SignedAgreement = {
    id: `agree_${Date.now()}`,
    template_id: template.id,
    template_version: template.version,
    rendered_text: renderedText,
    document_hash: documentHash,
    signatures: [],
    member_id: memberId,
    membership_id: membershipId,
    is_complete: false,
    clause_consents: template.clauses
      .filter(c => c.requires_explicit_consent)
      .map(c => ({
        clause_number: c.number,
        clause_title: c.title,
        consented: false,
        member_flag: c.number === 9 && template.type === 'pilates_tc' ? 'media_consent' : undefined,
      })),
    created_at: new Date().toISOString(),
  }

  const agreements = getSignedAgreements()
  agreements.push(agreement)
  saveAgreements(agreements)

  return agreement
}

/**
 * Record a signature on an agreement.
 * 
 * For PT T&C: member signs first, then trainer, then head coach (sequential).
 * Sessions are not bookable until all three have signed.
 * 
 * Evidence: signer, role, timestamp, IP, device, OTP reference, document hash.
 */
export async function recordSignature(
  agreementId: string,
  signerId: string,
  signerName: string,
  signerRole: SignerRole,
  otpReference: string,
  ipAddress: string = '127.0.0.1',
  device: string = 'Web Browser'
): Promise<SignedAgreement | null> {
  const agreements = getSignedAgreements()
  const index = agreements.findIndex(a => a.id === agreementId)
  if (index === -1) return null

  const agreement = agreements[index]

  // Verify signing order (for PT sequential signing)
  const template = getTemplates().find(t => t.id === agreement.template_id)
  if (template) {
    const nextSignerRole = template.signing_order[agreement.signatures.length]
    if (nextSignerRole && signerRole !== nextSignerRole) {
      throw new Error(`Signing order violation. Expected ${nextSignerRole}, got ${signerRole}`)
    }
  }

  const signature: SignatureRecord = {
    id: `sig_${Date.now()}`,
    signer_id: signerId,
    signer_name: signerName,
    signer_role: signerRole,
    timestamp: new Date().toISOString(),
    ip_address: ipAddress,
    device,
    otp_reference: otpReference,
    document_hash: agreement.document_hash,
  }

  agreement.signatures.push(signature)

  // Check if all required signatures are collected
  if (template) {
    agreement.is_complete = agreement.signatures.length >= template.signing_order.length
  }

  agreements[index] = agreement
  saveAgreements(agreements)

  logAuditEvent({
    actor: { id: signerId, name: signerName, email: '', role: signerRole },
    action: 'CREATE',
    entity: 'Signature',
    entityId: signature.id,
    branchId: 'pow',
    description: `${signerName} (${signerRole}) signed ${template?.title || 'agreement'} for membership ${agreement.membership_id}`,
    afterState: signature,
  })

  return agreement
}

/**
 * Record clause-level consent (for optional/explicit clauses).
 */
export function recordClauseConsent(
  agreementId: string,
  clauseNumber: number,
  consented: boolean
): SignedAgreement | null {
  const agreements = getSignedAgreements()
  const index = agreements.findIndex(a => a.id === agreementId)
  if (index === -1) return null

  const agreement = agreements[index]
  const clauseIndex = agreement.clause_consents.findIndex(c => c.clause_number === clauseNumber)
  if (clauseIndex === -1) return null

  agreement.clause_consents[clauseIndex].consented = consented
  agreements[index] = agreement
  saveAgreements(agreements)

  return agreement
}

/**
 * Check if a membership's required consent is complete.
 * Used to block PT session booking if PT T&C is incomplete.
 */
export function isConsentComplete(
  membershipId: string,
  documentType: ConsentDocumentType
): boolean {
  const agreements = getSignedAgreements()
  const agreement = agreements.find(
    a => a.membership_id === membershipId &&
    getTemplates().find(t => t.id === a.template_id)?.type === documentType
  )

  if (!agreement) return false
  return agreement.is_complete
}
