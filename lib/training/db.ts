/* ============================================================
   DNA 360 — Training Store & Database Adapter
   Implements CUID identifiers, seeded library, and atomic persistence.
   ============================================================ */

import crypto from 'crypto'
import type {
  Exercise,
  Program,
  MemberProgram,
  MemberProgramRevision,
  WorkoutSession,
  SessionExercise,
  SetLog,
  BodyMetric,
  CoachNote,
  FormCheck,
  GymTrainingSettings,
  Equipment,
  MuscleGroup,
} from '@/types/training'
import { SEEDED_EXERCISES } from './exercises-seed'
import { SEEDED_GYM_PROGRAMS } from './programs-seed'

// ─── CUID Generator (§1 Rule 5: Sequential integers are an IDOR surface) ───

let cuidCounter = 0
export function generateCuid(prefix: string = 'c'): string {
  cuidCounter = (cuidCounter + 1) % 100000
  const timestamp = Date.now().toString(36)
  const count = cuidCounter.toString(36).padStart(4, '0')
  const random = crypto.randomBytes(4).toString('hex')
  return `${prefix}_${timestamp}${count}${random}`
}

// ─── Storage Keys ───
const EXERCISES_KEY = 'dna360_training_exercises'
const PROGRAMS_KEY = 'dna360_training_programs'
const MEMBER_PROGRAMS_KEY = 'dna360_training_member_programs'
const WORKOUT_SESSIONS_KEY = 'dna360_training_workout_sessions'
const BODY_METRICS_KEY = 'dna360_training_body_metrics'
const COACH_NOTES_KEY = 'dna360_training_coach_notes'
const FORM_CHECKS_KEY = 'dna360_training_form_checks'
const SETTINGS_KEY = 'dna360_training_settings'

// Default Gym Training Settings
export const DEFAULT_TRAINING_SETTINGS: GymTrainingSettings = {
  id: 'settings_powai_training',
  gymId: 'gym_powai',
  weightUnit: 'kg',
  defaultRestSeconds: 90,
  membersCanBuildPrograms: true,
  gymLibraryEnabled: true,
  freestyleLoggingEnabled: true,
  ptUpsellPromptsEnabled: true,
  mediaRetentionDays: 180,
  customExerciseApproval: true,
}

// In-Memory Server Fallback Stores
let memExercises: Exercise[] = [...SEEDED_EXERCISES]
let memPrograms: Program[] = [...SEEDED_GYM_PROGRAMS]
let memMemberPrograms: MemberProgram[] = []
let memSessions: WorkoutSession[] = []
let memBodyMetrics: BodyMetric[] = []
let memCoachNotes: CoachNote[] = []
let memFormChecks: FormCheck[] = []
let memSettings: GymTrainingSettings = { ...DEFAULT_TRAINING_SETTINGS }

// Pre-seed sample active program and completed history for mem_001
function initSeedMemberData() {
  if (memMemberPrograms.length > 0) return

  const sampleProg = SEEDED_GYM_PROGRAMS[0]
  const memberProgId = 'mprog_mem001_seed'

  memMemberPrograms.push({
    id: memberProgId,
    memberId: 'mem_001',
    trainerId: 'usr_staff_03', // Rajesh Poojary (Head Trainer)
    coachingMode: 'TRAINER_LED',
    sourceProgramId: sampleProg.id,
    currentVersion: 1,
    snapshot: sampleProg,
    adaptationPolicy: 'FLEXIBLE',
    scheduleMode: 'FIXED_DAYS',
    scheduleDays: [1, 3, 5],
    sessionsPerWeek: 3,
    startDate: new Date(Date.now() - 14 * 86400000).toISOString(),
    status: 'ACTIVE',
  })

  // Past completed session with historical set logs
  const pastSessionId = 'sess_mem001_past_01'
  const pastExercise1Id = 'sex_past_01'
  const pastExercise2Id = 'sex_past_02'

  const completedSession: WorkoutSession = {
    id: pastSessionId,
    memberId: 'mem_001',
    memberProgramId: memberProgId,
    programVersion: 1,
    weekIndex: 0,
    dayIndex: 0,
    title: 'Full Body A (Squat & Press Focus)',
    scheduledDate: new Date(Date.now() - 3 * 86400000).toISOString(),
    startedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    completedAt: new Date(Date.now() - 3 * 86400000 + 3600000).toISOString(),
    status: 'COMPLETED',
    memberFeedback: 'Great session, bench felt powerful.',
    perceivedEffort: 8,
    ptSessionId: 'pt_sess_001',
    exercises: [
      {
        id: pastExercise1Id,
        sessionId: pastSessionId,
        exerciseId: 'ex_bb_bench_press',
        order: 1,
        source: 'PROGRAM',
        skipped: false,
        setLogs: [
          {
            id: 'set_past_01',
            sessionExerciseId: pastExercise1Id,
            setIndex: 1,
            reps: 8,
            weightKg: 60,
            rpe: 7.5,
            isWarmup: false,
            completedAt: new Date(Date.now() - 3 * 86400000 + 600000).toISOString(),
            clientLogId: 'client_log_001',
          },
          {
            id: 'set_past_02',
            sessionExerciseId: pastExercise1Id,
            setIndex: 2,
            reps: 8,
            weightKg: 62.5,
            rpe: 8.0,
            isWarmup: false,
            completedAt: new Date(Date.now() - 3 * 86400000 + 1200000).toISOString(),
            clientLogId: 'client_log_002',
          },
        ],
      },
      {
        id: pastExercise2Id,
        sessionId: pastSessionId,
        exerciseId: 'ex_bb_back_squat',
        order: 2,
        source: 'PROGRAM',
        skipped: false,
        setLogs: [
          {
            id: 'set_past_03',
            sessionExerciseId: pastExercise2Id,
            setIndex: 1,
            reps: 8,
            weightKg: 80,
            rpe: 8.0,
            isWarmup: false,
            completedAt: new Date(Date.now() - 3 * 86400000 + 1800000).toISOString(),
            clientLogId: 'client_log_003',
          },
        ],
      },
    ],
  }

  memSessions.push(completedSession)

  // Seed a sample coach note
  memCoachNotes.push({
    id: 'cnote_001',
    authorId: 'usr_staff_03',
    memberId: 'mem_001',
    sessionId: pastSessionId,
    body: 'Solid leg drive on the bench press. Keep elbows tucked at 45 degrees next time.',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    authorName: 'Rajesh Poojary',
  })

  // Seed sample body metric
  memBodyMetrics.push({
    id: 'bm_001',
    memberId: 'mem_001',
    recordedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    weightKg: 78.5,
    bodyFatPct: 14.8,
    measurements: {
      chestCm: 104,
      waistCm: 82,
      armsCm: 38,
    },
    photoKeys: [],
    recordedById: 'mem_001',
  })
}

initSeedMemberData()

// ─── Server-Side Prisma Hydration & Write-Through ───

let prismaHydrated = false
function ensurePrismaHydration() {
  if (typeof window !== 'undefined' || prismaHydrated) return
  prismaHydrated = true
  import('@/lib/prisma')
    .then(async ({ prisma }) => {
      const [dbPrograms, dbMetrics, dbNotes, dbChecks] = await Promise.all([
        prisma.memberProgram.findMany({ orderBy: { startDate: 'desc' }, take: 200 }).catch(() => []),
        prisma.bodyMetric.findMany({ orderBy: { recordedAt: 'desc' }, take: 500 }).catch(() => []),
        prisma.coachNote.findMany({ where: { NOT: { authorId: { startsWith: 'SYSTEM_' } } }, orderBy: { createdAt: 'desc' }, take: 300 }).catch(() => []),
        prisma.formCheck.findMany({ orderBy: { createdAt: 'desc' }, take: 200 }).catch(() => []),
      ])
      for (const mp of dbPrograms) {
        if (!memMemberPrograms.some((x) => x.id === mp.id)) {
          memMemberPrograms.push({
            id: mp.id,
            memberId: mp.memberId,
            trainerId: mp.trainerId,
            coachingMode: mp.coachingMode as any,
            sourceProgramId: mp.sourceProgramId,
            currentVersion: mp.currentVersion,
            snapshot: mp.snapshot as any,
            adaptationPolicy: mp.adaptationPolicy as any,
            scheduleMode: mp.scheduleMode as any,
            scheduleDays: mp.scheduleDays,
            sessionsPerWeek: mp.sessionsPerWeek,
            startDate: mp.startDate.toISOString(),
            endDate: mp.endDate ? mp.endDate.toISOString() : null,
            status: mp.status as any,
          })
        }
      }
      for (const bm of dbMetrics) {
        if (!memBodyMetrics.some((x) => x.id === bm.id)) {
          memBodyMetrics.push({
            id: bm.id,
            memberId: bm.memberId,
            recordedAt: bm.recordedAt.toISOString(),
            weightKg: bm.weightKg ?? undefined,
            bodyFatPct: bm.bodyFatPct ?? undefined,
            measurements: (bm.measurements as any) ?? undefined,
            photoKeys: bm.photoKeys || [],
            recordedById: bm.recordedById,
          })
        }
      }
      for (const cn of dbNotes) {
        if (!cn.body.trim().startsWith('{') && !memCoachNotes.some((x) => x.id === cn.id)) {
          memCoachNotes.push({
            id: cn.id,
            authorId: cn.authorId,
            memberId: cn.memberId,
            sessionId: cn.sessionId ?? undefined,
            body: cn.body,
            mediaKey: cn.mediaKey ?? undefined,
            createdAt: cn.createdAt.toISOString(),
            readAt: cn.readAt ? cn.readAt.toISOString() : undefined,
          })
        }
      }
      for (const fc of dbChecks) {
        if (!memFormChecks.some((x) => x.id === fc.id)) {
          memFormChecks.push({
            id: fc.id,
            memberId: fc.memberId,
            trainerId: fc.trainerId,
            exerciseId: fc.exerciseId ?? undefined,
            videoKey: fc.videoKey,
            memberNote: fc.memberNote ?? undefined,
            reviewedAt: fc.reviewedAt ? fc.reviewedAt.toISOString() : null,
            reviewBody: fc.reviewBody ?? null,
            createdAt: fc.createdAt.toISOString(),
          })
        }
      }
    })
    .catch(() => {})
}

ensurePrismaHydration()

// ─── Exercise Queries & Mutations ───

export function getExercises(filters?: {
  search?: string
  primaryMuscle?: MuscleGroup | 'ALL'
  equipment?: Equipment | 'ALL'
  includeCustom?: boolean
}): Exercise[] {
  let list = [...memExercises]
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(EXERCISES_KEY)
    if (local) {
      try { list = JSON.parse(local) } catch {}
    }
  }

  if (filters?.primaryMuscle && filters.primaryMuscle !== 'ALL') {
    list = list.filter(e => e.primaryMuscle === filters.primaryMuscle)
  }
  if (filters?.equipment && filters.equipment !== 'ALL') {
    list = list.filter(e => e.equipment === filters.equipment)
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase().trim()
    list = list.filter(e => e.name.toLowerCase().includes(q) || e.instructions?.toLowerCase().includes(q))
  }
  return list
}

export function getExerciseById(id: string): Exercise | null {
  return getExercises().find(e => e.id === id) || null
}

export function createCustomExercise(data: Omit<Exercise, 'id' | 'isCustom' | 'approvedAt'>, createdById: string): Exercise {
  const newExercise: Exercise = {
    ...data,
    id: generateCuid('ex_custom'),
    isCustom: true,
    createdById,
    approvedAt: null,
  }
  memExercises.push(newExercise)
  if (typeof window !== 'undefined') {
    localStorage.setItem(EXERCISES_KEY, JSON.stringify(memExercises))
  }
  return newExercise
}

// ─── Program Queries & Mutations ───

export function getGymPrograms(): Program[] {
  let list = [...memPrograms]
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(PROGRAMS_KEY)
    if (local) {
      try { list = JSON.parse(local) } catch {}
    }
  }
  return list.filter(p => p.visibility === 'GYM_LIBRARY')
}

export function getProgramById(id: string): Program | null {
  let list = [...memPrograms]
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(PROGRAMS_KEY)
    if (local) {
      try { list = JSON.parse(local) } catch {}
    }
  }
  return list.find(p => p.id === id) || null
}

export function saveProgram(prog: Program): Program {
  const idx = memPrograms.findIndex(p => p.id === prog.id)
  if (idx >= 0) {
    memPrograms[idx] = prog
  } else {
    memPrograms.push(prog)
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(PROGRAMS_KEY, JSON.stringify(memPrograms))
  }
  return prog
}

// ─── MemberProgram Queries & Mutations ───

export function getMemberPrograms(memberId: string): MemberProgram[] {
  let list = [...memMemberPrograms]
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(MEMBER_PROGRAMS_KEY)
    if (local) {
      try { list = JSON.parse(local) } catch {}
    }
  }
  return list.filter(mp => mp.memberId === memberId)
}

export function getActiveMemberProgram(memberId: string): MemberProgram | null {
  return getMemberPrograms(memberId).find(mp => mp.status === 'ACTIVE') || null
}

export function saveMemberProgram(mp: MemberProgram): MemberProgram {
  const idx = memMemberPrograms.findIndex(p => p.id === mp.id)
  if (idx >= 0) {
    memMemberPrograms[idx] = mp
  } else {
    memMemberPrograms.push(mp)
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(MEMBER_PROGRAMS_KEY, JSON.stringify(memMemberPrograms))
  } else {
    import('@/lib/prisma')
      .then(({ prisma }) =>
        prisma.memberProgram.upsert({
          where: { id: mp.id },
          update: {
            trainerId: mp.trainerId || null,
            coachingMode: (mp.coachingMode as any) || 'TRAINER_LED',
            currentVersion: mp.currentVersion || 1,
            snapshot: (mp.snapshot as any) || {},
            adaptationPolicy: (mp.adaptationPolicy as any) || 'FLEXIBLE',
            scheduleMode: (mp.scheduleMode as any) || 'FLEXIBLE',
            scheduleDays: mp.scheduleDays || [],
            sessionsPerWeek: mp.sessionsPerWeek ?? null,
            status: mp.status || 'ACTIVE',
            endDate: mp.endDate ? new Date(mp.endDate) : null,
          },
          create: {
            id: mp.id,
            memberId: mp.memberId,
            trainerId: mp.trainerId || null,
            coachingMode: (mp.coachingMode as any) || 'TRAINER_LED',
            sourceProgramId: mp.sourceProgramId || null,
            currentVersion: mp.currentVersion || 1,
            snapshot: (mp.snapshot as any) || {},
            adaptationPolicy: (mp.adaptationPolicy as any) || 'FLEXIBLE',
            scheduleMode: (mp.scheduleMode as any) || 'FLEXIBLE',
            scheduleDays: mp.scheduleDays || [],
            sessionsPerWeek: mp.sessionsPerWeek ?? null,
            startDate: mp.startDate ? new Date(mp.startDate) : new Date(),
            endDate: mp.endDate ? new Date(mp.endDate) : null,
            status: mp.status || 'ACTIVE',
          },
        })
      )
      .catch(() => {})
  }
  return mp
}

// ─── Workout Sessions Queries & Mutations ───

export function getMemberSessions(memberId: string): WorkoutSession[] {
  let list = [...memSessions]
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(WORKOUT_SESSIONS_KEY)
    if (local) {
      try { list = JSON.parse(local) } catch {}
    }
  }
  return list
    .filter(s => s.memberId === memberId)
    .sort((a, b) => new Date(b.scheduledDate || b.startedAt || 0).getTime() - new Date(a.scheduledDate || a.startedAt || 0).getTime())
}

export function getSessionById(sessionId: string): WorkoutSession | null {
  let list = [...memSessions]
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(WORKOUT_SESSIONS_KEY)
    if (local) {
      try { list = JSON.parse(local) } catch {}
    }
  }
  return list.find(s => s.id === sessionId) || null
}

export function saveWorkoutSession(session: WorkoutSession): WorkoutSession {
  const idx = memSessions.findIndex(s => s.id === session.id)
  if (idx >= 0) {
    memSessions[idx] = session
  } else {
    memSessions.push(session)
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(WORKOUT_SESSIONS_KEY, JSON.stringify(memSessions))
    window.dispatchEvent(new Event('dna360_sessions_updated'))
  } else {
    import('@/lib/prisma')
      .then(({ prisma }) =>
        prisma.workoutSession.upsert({
          where: { id: session.id },
          update: {
            status: (session.status as any) || 'IN_PROGRESS',
            startedAt: session.startedAt ? new Date(session.startedAt) : undefined,
            completedAt: session.completedAt ? new Date(session.completedAt) : undefined,
            memberFeedback: session.memberFeedback ?? undefined,
            perceivedEffort: session.perceivedEffort ?? undefined,
          },
          create: {
            id: session.id,
            memberId: session.memberId,
            memberProgramId: null,
            programVersion: session.programVersion ?? 1,
            weekIndex: session.weekIndex ?? 0,
            dayIndex: session.dayIndex ?? 0,
            title: session.title || 'Workout Session',
            scheduledDate: session.scheduledDate ? new Date(session.scheduledDate) : new Date(),
            startedAt: session.startedAt ? new Date(session.startedAt) : new Date(),
            completedAt: session.completedAt ? new Date(session.completedAt) : null,
            status: (session.status as any) || 'IN_PROGRESS',
            memberFeedback: session.memberFeedback ?? null,
            perceivedEffort: session.perceivedEffort ?? null,
            ptSessionId: session.ptSessionId ?? null,
          },
        })
      )
      .catch(() => {})
  }
  return session
}

// ─── Body Metrics ───

export function getMemberBodyMetrics(memberId: string): BodyMetric[] {
  let list = [...memBodyMetrics]
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(BODY_METRICS_KEY)
    if (local) {
      try { list = JSON.parse(local) } catch {}
    }
  }
  return list
    .filter(m => m.memberId === memberId)
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
}

export function recordBodyMetric(metric: Omit<BodyMetric, 'id'>): BodyMetric {
  const newMetric: BodyMetric = {
    ...metric,
    id: generateCuid('bm'),
  }
  memBodyMetrics.push(newMetric)
  if (typeof window !== 'undefined') {
    localStorage.setItem(BODY_METRICS_KEY, JSON.stringify(memBodyMetrics))
  } else {
    import('@/lib/prisma')
      .then(({ prisma }) =>
        prisma.bodyMetric.create({
          data: {
            id: newMetric.id,
            memberId: newMetric.memberId,
            recordedAt: newMetric.recordedAt ? new Date(newMetric.recordedAt) : new Date(),
            weightKg: newMetric.weightKg ?? null,
            bodyFatPct: newMetric.bodyFatPct ?? null,
            measurements: (newMetric.measurements as any) ?? undefined,
            photoKeys: newMetric.photoKeys || [],
            recordedById: newMetric.recordedById || newMetric.memberId,
          },
        })
      )
      .catch(() => {})
  }
  return newMetric
}

// ─── Coach Notes ───

export function getMemberCoachNotes(memberId: string): CoachNote[] {
  let list = [...memCoachNotes]
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(COACH_NOTES_KEY)
    if (local) {
      try { list = JSON.parse(local) } catch {}
    }
  }
  return list
    .filter(n => n.memberId === memberId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function addCoachNote(note: Omit<CoachNote, 'id' | 'createdAt'>): CoachNote {
  const newNote: CoachNote = {
    ...note,
    id: generateCuid('cnote'),
    createdAt: new Date().toISOString(),
  }
  memCoachNotes.push(newNote)
  if (typeof window !== 'undefined') {
    localStorage.setItem(COACH_NOTES_KEY, JSON.stringify(memCoachNotes))
  } else {
    import('@/lib/prisma')
      .then(({ prisma }) =>
        prisma.coachNote.create({
          data: {
            id: newNote.id,
            authorId: newNote.authorId,
            memberId: newNote.memberId,
            sessionId: newNote.sessionId || null,
            body: newNote.body,
            mediaKey: newNote.mediaKey || null,
          },
        })
      )
      .catch(() => {})
  }
  return newNote
}

// ─── Form Checks ───

export function getFormChecks(filters?: { memberId?: string; trainerId?: string }): FormCheck[] {
  let list = [...memFormChecks]
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(FORM_CHECKS_KEY)
    if (local) {
      try { list = JSON.parse(local) } catch {}
    }
  }
  if (filters?.memberId) list = list.filter(f => f.memberId === filters.memberId)
  if (filters?.trainerId) list = list.filter(f => f.trainerId === filters.trainerId)
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function submitFormCheck(data: Omit<FormCheck, 'id' | 'createdAt' | 'reviewedAt' | 'reviewBody'>): FormCheck {
  const newCheck: FormCheck = {
    ...data,
    id: generateCuid('fc'),
    createdAt: new Date().toISOString(),
    reviewedAt: null,
    reviewBody: null,
  }
  memFormChecks.push(newCheck)
  if (typeof window !== 'undefined') {
    localStorage.setItem(FORM_CHECKS_KEY, JSON.stringify(memFormChecks))
  } else {
    import('@/lib/prisma')
      .then(({ prisma }) =>
        prisma.formCheck.create({
          data: {
            id: newCheck.id,
            memberId: newCheck.memberId,
            trainerId: newCheck.trainerId,
            exerciseId: newCheck.exerciseId || null,
            videoKey: newCheck.videoKey,
            memberNote: newCheck.memberNote || null,
          },
        })
      )
      .catch(() => {})
  }
  return newCheck
}

export function reviewFormCheck(formCheckId: string, reviewBody: string): FormCheck | null {
  const check = memFormChecks.find(f => f.id === formCheckId)
  if (!check) return null
  check.reviewBody = reviewBody
  check.reviewedAt = new Date().toISOString()
  if (typeof window !== 'undefined') {
    localStorage.setItem(FORM_CHECKS_KEY, JSON.stringify(memFormChecks))
  } else {
    import('@/lib/prisma')
      .then(({ prisma }) =>
        prisma.formCheck.update({
          where: { id: formCheckId },
          data: {
            reviewBody,
            reviewedAt: new Date(check.reviewedAt!),
          },
        })
      )
      .catch(() => {})
  }
  return check
}

// ─── Settings ───

export function getGymTrainingSettings(): GymTrainingSettings {
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(SETTINGS_KEY)
    if (local) {
      try { return JSON.parse(local) } catch {}
    }
  }
  return memSettings
}

export function updateGymTrainingSettings(updates: Partial<GymTrainingSettings>): GymTrainingSettings {
  memSettings = { ...memSettings, ...updates }
  if (typeof window !== 'undefined') {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(memSettings))
  }
  return memSettings
}
