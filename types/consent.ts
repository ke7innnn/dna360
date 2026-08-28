/* ============================================================
   DNA 360 — Consent & E-Signing Types
   
   Three separate agreements:
   - membership_tc: 22 clauses, single-party
   - personal_training_tc: 16 clauses, three-party sequential
   - pilates_tc: 16 clauses, single-party, merge field for validity
   ============================================================ */

/** The three consent document types */
export type ConsentDocumentType =
  | 'membership_tc'
  | 'personal_training_tc'
  | 'pilates_tc'

/** Who signs this type of document */
export type SignerRole = 'member' | 'trainer' | 'head_coach'

/** A single clause in a consent template */
export interface ConsentClause {
  number: number
  title: string
  /** The clause text. May contain merge fields like {{validity_days}} */
  body: string
  /** Whether this clause requires separate explicit consent (e.g., PT physical assistance) */
  requires_explicit_consent: boolean
  /** If true, declining this clause does NOT block the sale */
  optional: boolean
  /** Merge field keys this clause uses, if any */
  merge_fields?: string[]
}

/**
 * ConsentTemplate — versioned template for an agreement.
 * Templates are never mutated; new versions are created.
 * Signed agreements point at a specific version.
 */
export interface ConsentTemplate {
  id: string
  type: ConsentDocumentType
  version: number
  /** When this version became effective (YYYY-MM-DD) */
  effective_from: string
  /** When this version was superseded (null if current) */
  superseded_at: string | null
  /** Title of the agreement */
  title: string
  /** All clauses in this template */
  clauses: ConsentClause[]
  /**
   * Required signers and their order.
   * membership_tc: ['member']
   * personal_training_tc: ['member', 'trainer', 'head_coach'] — sequential
   * pilates_tc: ['member']
   */
  signing_order: SignerRole[]
  /** Whether all signatures must be collected before services begin */
  blocks_service_until_complete: boolean
  /** Created timestamp */
  created_at: string
}

/**
 * SignedAgreement — a specific instance of a signed consent document.
 * 
 * CRITICAL: The rendered_text is a SNAPSHOT captured at signing time.
 * Never re-render a historical agreement from the current template.
 */
export interface SignedAgreement {
  id: string
  /** FK to the template */
  template_id: string
  /** Version of the template at signing time */
  template_version: number
  /** Full rendered text with merge fields resolved — immutable snapshot */
  rendered_text: string
  /** SHA-256 hash of the rendered text */
  document_hash: string
  /** All signatures collected (may be partial for PT sequential signing) */
  signatures: SignatureRecord[]
  /** FK to the member */
  member_id: string
  /** FK to the membership this agreement is for */
  membership_id: string
  /** Whether all required signatures have been collected */
  is_complete: boolean
  /** Individual clause consents (for optional/explicit clauses) */
  clause_consents: ClauseConsent[]
  /** Created timestamp */
  created_at: string
}

/**
 * SignatureRecord — evidence record for a single signature.
 * 
 * OTP to registered mobile is the signing method (100% mobile
 * coverage vs 7% email).
 */
export interface SignatureRecord {
  id: string
  /** Who signed */
  signer_id: string
  signer_name: string
  /** Role in which they signed */
  signer_role: SignerRole
  /** When they signed (ISO timestamp) */
  timestamp: string
  /** IP address at signing time */
  ip_address: string
  /** Device/user-agent at signing time */
  device: string
  /** OTP delivery reference (for audit trail) */
  otp_reference: string
  /** SHA-256 hash of the document at the moment of this signature */
  document_hash: string
}

/**
 * ClauseConsent — records explicit consent/decline for specific clauses.
 * 
 * Example: PT clause 15 (physical assistance) is captured separately.
 * Declining it does NOT block the sale.
 * 
 * Pilates clause 9 becomes a media_consent flag on the member record.
 */
export interface ClauseConsent {
  clause_number: number
  clause_title: string
  consented: boolean
  /** Maps to a member flag, e.g. 'media_consent' for Pilates clause 9 */
  member_flag?: string
}
