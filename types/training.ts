/* ============================================================
   DNA 360 — Coaching & Training Module Types
   Single Source of Truth for Models, Enums, and Offline State
   ============================================================ */

export type MuscleGroup =
  | 'CHEST'
  | 'BACK'
  | 'SHOULDERS'
  | 'BICEPS'
  | 'TRICEPS'
  | 'QUADS'
  | 'HAMSTRINGS'
  | 'GLUTES'
  | 'CALVES'
  | 'CORE'
  | 'FULL_BODY'
  | 'CARDIO'

export type Equipment =
  | 'BARBELL'
  | 'DUMBBELL'
  | 'MACHINE'
  | 'CABLE'
  | 'BODYWEIGHT'
  | 'KETTLEBELL'
  | 'BAND'
  | 'CARDIO_MACHINE'
  | 'REFORMER'
  | 'OTHER'

export type ProgramGoal =
  | 'FAT_LOSS'
  | 'MUSCLE_GAIN'
  | 'STRENGTH'
  | 'ENDURANCE'
  | 'REHAB'
  | 'GENERAL'

export type ProgramOwner = 'TRAINER' | 'MEMBER' | 'GYM'

export type ProgramVisibility = 'PRIVATE' | 'ASSIGNED_ONLY' | 'GYM_LIBRARY'

export type CoachingMode = 'SELF_COACHED' | 'TRAINER_LED'

export type AdaptationPolicy = 'LOCKED' | 'SWAP_ONLY' | 'FLEXIBLE'

export type ScheduleMode = 'FIXED_DAYS' | 'FLEXIBLE' | 'SEQUENTIAL'

export type SessionStatus =
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'SKIPPED'
  | 'EXPIRED'

export type ExerciseSource = 'PROGRAM' | 'MEMBER_ADDED' | 'SWAPPED'

export interface Exercise {
  id: string
  name: string
  primaryMuscle: MuscleGroup
  secondaryMuscles: MuscleGroup[]
  equipment: Equipment
  instructions?: string | null
  demoMediaKey?: string | null
  isCustom: boolean
  createdById?: string | null
  approvedAt?: string | null
  mergedIntoId?: string | null
  archivedAt?: string | null
}

export interface ProgramExercisePrescription {
  order: number
  sets: number
  repsMin?: number | null
  repsMax?: number | null
  targetWeight?: number | null
  rpe?: number | null
  restSeconds?: number | null
  tempo?: string | null
  supersetTag?: string | null
  coachNote?: string | null
  durationSeconds?: number | null
  isOptional: boolean
}

export interface ProgramExercise extends ProgramExercisePrescription {
  id: string
  programDayId: string
  exerciseId: string
  exercise?: Exercise
}

export interface ProgramDay {
  id: string
  programId: string
  weekIndex: number
  dayIndex: number
  label: string
  exercises: ProgramExercise[]
}

export interface Program {
  id: string
  name: string
  goal: ProgramGoal
  weeks: number
  daysPerWeek: number
  notes?: string | null
  ownerType: ProgramOwner
  ownerId: string
  visibility: ProgramVisibility
  clonedFromId?: string | null
  days: ProgramDay[]
  archivedAt?: string | null
  createdAt?: string
}

export interface MemberProgramRevision {
  id: string
  memberProgramId: string
  version: number
  snapshot: any // Program snapshot
  changedById: string
  changedByRole: 'MEMBER' | 'TRAINER' | 'MANAGER'
  changeNote?: string | null
  createdAt: string
}

export interface MemberProgram {
  id: string
  memberId: string
  trainerId: string | null // NULL for self-coached
  coachingMode: CoachingMode
  sourceProgramId?: string | null
  currentVersion: number
  snapshot: any
  adaptationPolicy: AdaptationPolicy
  scheduleMode: ScheduleMode
  scheduleDays: number[]
  sessionsPerWeek?: number | null
  startDate: string
  endDate?: string | null
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'ARCHIVED'
  revisions?: MemberProgramRevision[]
}

export interface SetLog {
  id: string
  sessionExerciseId: string
  setIndex: number
  reps?: number | null
  weightKg?: number | null
  durationSeconds?: number | null
  distanceMetres?: number | null
  rpe?: number | null
  isWarmup: boolean
  completedAt: string
  clientLogId: string // Unique idempotency key
}

export interface SessionExercise {
  id: string
  sessionId: string
  exerciseId: string
  order: number
  prescribed?: ProgramExercisePrescription | null
  source: ExerciseSource
  swappedFromId?: string | null
  skipped: boolean
  note?: string | null
  exercise?: Exercise
  setLogs: SetLog[]
}

export interface WorkoutSession {
  id: string
  memberId: string // Always set
  memberProgramId?: string | null
  programVersion?: number | null
  weekIndex?: number | null
  dayIndex?: number | null
  title?: string | null
  scheduledDate?: string | null
  startedAt?: string | null
  completedAt?: string | null
  status: SessionStatus
  memberFeedback?: string | null
  perceivedEffort?: number | null
  ptSessionId?: string | null
  exercises: SessionExercise[]
}

export interface BodyMetric {
  id: string
  memberId: string
  recordedAt: string
  weightKg?: number | null
  bodyFatPct?: number | null
  measurements?: {
    chestCm?: number
    waistCm?: number
    hipsCm?: number
    armsCm?: number
    thighsCm?: number
  } | null
  photoKeys: string[]
  recordedById: string
}

export interface CoachNote {
  id: string
  authorId: string
  memberId: string
  sessionId?: string | null
  body: string
  mediaKey?: string | null
  createdAt: string
  readAt?: string | null
  authorName?: string
}

export interface FormCheck {
  id: string
  memberId: string
  trainerId: string
  exerciseId?: string | null
  videoKey: string
  memberNote?: string | null
  reviewedAt?: string | null
  reviewBody?: string | null
  createdAt: string
  exerciseName?: string
  memberName?: string
}

export interface GymTrainingSettings {
  id: string
  gymId: string
  weightUnit: string
  defaultRestSeconds: number
  membersCanBuildPrograms: boolean
  gymLibraryEnabled: boolean
  freestyleLoggingEnabled: boolean
  ptUpsellPromptsEnabled: boolean
  mediaRetentionDays: number
  customExerciseApproval: boolean
}

// ─── Telemetry & Offline Types ───

export interface LastExercisePerformance {
  weightKg: number | null
  reps: number | null
  completedAt: string
  text: string // e.g. "Last: 60 kg × 8"
}

export interface PersonalRecord {
  exerciseId: string
  exerciseName: string
  category: 'MAX_WEIGHT' | 'MAX_VOLUME' | 'ESTIMATED_1RM'
  value: number
  unit: string
  reps?: number
  achievedAt: string
  sessionId: string
}

export interface OfflineQueuedSet {
  clientLogId: string
  sessionExerciseId: string
  setIndex: number
  reps?: number | null
  weightKg?: number | null
  durationSeconds?: number | null
  distanceMetres?: number | null
  rpe?: number | null
  isWarmup: boolean
  completedAt: string
  synced: boolean
}

export interface TrainerClientSummary {
  memberId: string
  memberName: string
  memberCode: string
  phone: string
  programName: string
  coachingMode: CoachingMode
  weekCurrent: number
  weekTotal: number
  adherencePct: number
  lastLoggedSessionDate?: string | null
  ptSessionsRemaining: number
  ptSessionsTotal: number
  ptTier: string
  deviationCount: number
  hasUnreadNotes: boolean
  pendingFormChecks: number
  plateauAlert?: boolean
}

export interface PTLeadSignal {
  memberId: string
  memberName: string
  memberCode: string
  weeksActive: number
  stalledExerciseName: string
  stalledLiftWeightKg: number
  stalledDurationWeeks: number
  streak: number
  optedIn: boolean
}
