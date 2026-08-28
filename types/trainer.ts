/* ============================================================
   DNA 360 — Trainer Types
   
   PT tiers: Premium / Elite / Super Elite (+ couple variants).
   Commission: 40%, basis PENDING.
   Trainer → tier mapping: PENDING.
   ============================================================ */

export interface ExerciseItem {
  id: string
  name: string
  sets: number
  reps: string // e.g. "8-10" or "12"
  weightKg: number
  restSeconds: number
  rpe?: number // Rate of Perceived Exertion (1-10)
  notes?: string
}

export interface WorkoutDay {
  id: string
  dayName: string
  focus: string
  exercises: ExerciseItem[]
}

export interface WorkoutProgram {
  id: string
  clientId: string
  clientName: string
  trainerId: string
  trainerName: string
  title: string
  splitType: 'PPL' | 'Upper/Lower' | 'Full Body' | 'Bro Split' | 'Conditioning'
  startDate: string
  weeksCount: number
  days: WorkoutDay[]
  notes?: string
}

export interface NutritionPlan {
  id: string
  clientId: string
  clientName: string
  dailyCalories: number
  proteinGrams: number
  carbsGrams: number
  fatsGrams: number
  waterLitres: number
  meals: {
    id: string
    name: string
    time: string
    foods: string
    calories: number
  }[]
  supplements: string[]
  guidelines?: string
}

/**
 * PT Session Log — records a completed personal training session.
 * Commission is calculated based on config (PENDING basis).
 */
export interface PTSessionLog {
  id: string
  clientId: string
  clientName: string
  trainerId: string
  trainerName: string
  date: string
  durationMinutes: number
  workoutFocus: string
  rating: number // 1-5
  clientFeedback?: string
  /** Commission earned — may be 0 if basis is not yet configured */
  commissionEarnedMinor: number
  status: 'completed' | 'cancelled' | 'no_show'
  /** Which entitlement was decremented */
  entitlementId?: string
  /** PT tier of this session */
  ptTier: 'premium' | 'elite' | 'super_elite' | 'general' | null
}

/**
 * Trainer Commission — ledger entry.
 * 
 * Commission is 40% but basis is PENDING:
 * - Gross vs net of GST
 * - Pre vs post discount
 * - On sale vs on delivery
 * 
 * All three are config switches. Do not compute payouts until set.
 */
export interface TrainerCommission {
  id: string
  trainerId: string
  trainerName: string
  sessionId: string
  clientName: string
  date: string
  /** Session value before commission */
  sessionValueMinor: number
  /** Commission amount */
  amountMinor: number
  /** Commission basis used for this calculation */
  basisUsed: 'gross' | 'net_of_gst' | 'post_discount' | 'not_configured'
  payoutStatus: 'accrued' | 'paid' | 'blocked_pending_config'
}

export interface PTAppointment {
  id: string
  trainerId: string
  trainerName: string
  clientId: string
  clientName: string
  clientPhone: string
  date: string
  startTime: string
  endTime: string
  type: '1on1_pt' | 'consultation' | 'assessment' | 'couple_pt'
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  /** PT tier */
  ptTier: 'premium' | 'elite' | 'super_elite' | 'general' | null
  /** Whether consent documents are complete (PT T&C requires 3-party signing) */
  consentComplete: boolean
}

/**
 * PT Client — a member assigned to this trainer.
 * 
 * Note: Which trainer can deliver which tier is PENDING.
 * Products are tiered Premium/Elite/Super Elite but staff records
 * only distinguish Head Trainer from General Trainer.
 */
export interface PTClient {
  id: string
  name: string
  phone: string
  email: string | null
  memberCode: string
  planName: string
  ptSessionsRemaining: number
  ptSessionsTotal: number
  ptTier: 'premium' | 'elite' | 'super_elite' | 'general' | null
  primaryGoal: 'Fat Loss' | 'Hypertrophy / Muscle Gain' | 'Strength & Power' | 'Mobility & Rehab' | 'Endurance'
  currentWeightKg: number
  targetWeightKg: number
  bodyFatPct: number
  lastSessionDate?: string
  /** Whether PT T&C consent is complete (3-party sequential signing) */
  consentComplete: boolean
}
