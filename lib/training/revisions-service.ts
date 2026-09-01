/* ============================================================
   DNA 360 — Programme Revisions & Schedule Engine (§3, §6, §7)
   Handles forward-only session regeneration, immutable completed
   history, schedule modes (Fixed, Flex, Sequential), and Shift Plan.
   ============================================================ */

import type {
  Program,
  MemberProgram,
  MemberProgramRevision,
  WorkoutSession,
  SessionExercise,
  ScheduleMode,
  AdaptationPolicy,
} from '@/types/training'
import {
  generateCuid,
  saveProgram,
  saveMemberProgram,
  saveWorkoutSession,
  getMemberSessions,
  getActiveMemberProgram,
  getProgramById,
  getExerciseById,
} from './db'
import { auditTrainingEvent } from './auth-guard'
import type { AuthUser } from '@/types/auth'

/**
 * Clones a Gym Library program into a Member-Owned program and activates it.
 */
export function startGymProgram(
  member: AuthUser,
  sourceProgramId: string,
  options?: {
    scheduleMode?: ScheduleMode
    scheduleDays?: number[]
    adaptationPolicy?: AdaptationPolicy
  }
): { program: Program; memberProgram: MemberProgram } {
  const source = getProgramById(sourceProgramId)
  if (!source) throw new Error('Gym program not found')

  // 1. Create cloned member-owned Program
  const clonedProgId = generateCuid('prog_owned')
  const clonedProgram: Program = {
    ...source,
    id: clonedProgId,
    name: source.name,
    ownerType: 'MEMBER',
    ownerId: member.id,
    visibility: 'PRIVATE',
    clonedFromId: source.id,
    days: source.days.map((d, dIdx) => ({
      ...d,
      id: generateCuid('pday'),
      programId: clonedProgId,
      exercises: d.exercises.map((e, eIdx) => ({
        ...e,
        id: generateCuid('pex'),
        programDayId: generateCuid('pday_ref'),
      })),
    })),
  }

  saveProgram(clonedProgram)

  // 2. Deactivate any existing active program for this member
  const existingActive = getActiveMemberProgram(member.id)
  if (existingActive) {
    existingActive.status = 'ARCHIVED'
    saveMemberProgram(existingActive)
  }

  // 3. Create MemberProgram
  const memberProgId = generateCuid('mprog')
  const memberProgram: MemberProgram = {
    id: memberProgId,
    memberId: member.id,
    trainerId: null, // Null for self-coached
    coachingMode: 'SELF_COACHED',
    sourceProgramId: clonedProgId,
    currentVersion: 1,
    snapshot: clonedProgram,
    adaptationPolicy: options?.adaptationPolicy || 'FLEXIBLE',
    scheduleMode: options?.scheduleMode || 'FLEXIBLE',
    scheduleDays: options?.scheduleDays || [1, 3, 5],
    sessionsPerWeek: source.daysPerWeek,
    startDate: new Date().toISOString(),
    status: 'ACTIVE',
    revisions: [
      {
        id: generateCuid('mprev'),
        memberProgramId: memberProgId,
        version: 1,
        snapshot: clonedProgram,
        changedById: member.id,
        changedByRole: 'MEMBER',
        changeNote: 'Initial programme start from Gym Library',
        createdAt: new Date().toISOString(),
      },
    ],
  }

  saveMemberProgram(memberProgram)

  // 4. Generate initial forward sessions
  generateFutureSessions(memberProgram, clonedProgram)

  auditTrainingEvent(
    member,
    'CREATE',
    'MEMBER_PROGRAM',
    memberProgId,
    `Member started program '${source.name}' from Gym Library`
  )

  return { program: clonedProgram, memberProgram }
}

/**
 * Generates forward sessions for a MemberProgram according to scheduleMode.
 */
export function generateFutureSessions(
  memberProgram: MemberProgram,
  program: Program,
  startDateStr?: string
) {
  const startDate = startDateStr ? new Date(startDateStr) : new Date()

  // For sequential mode, create the immediate next session in sequence
  if (memberProgram.scheduleMode === 'SEQUENTIAL') {
    const day = program.days[0]
    if (day) {
      createSessionFromProgramDay(memberProgram, day, 0, 0, startDate)
    }
    return
  }

  // For FIXED_DAYS or FLEXIBLE, generate 4 weeks of forward sessions
  const weeksToGenerate = Math.min(program.weeks || 4, 4)

  for (let w = 0; w < weeksToGenerate; w++) {
    program.days.forEach((day, dIdx) => {
      const scheduledDate = new Date(startDate)
      if (memberProgram.scheduleMode === 'FIXED_DAYS' && memberProgram.scheduleDays.length > 0) {
        // Map dayIndex to scheduleDays (e.g. 1 = Mon, 3 = Wed, 5 = Fri)
        const targetWeekday = memberProgram.scheduleDays[dIdx % memberProgram.scheduleDays.length]
        const currentWeekday = scheduledDate.getDay() // 0 = Sun
        const diff = (targetWeekday - currentWeekday + 7) % 7 + w * 7
        scheduledDate.setDate(scheduledDate.getDate() + diff)
      } else {
        // FLEXIBLE: space out days across the week
        scheduledDate.setDate(scheduledDate.getDate() + w * 7 + dIdx * 2)
      }

      createSessionFromProgramDay(memberProgram, day, w, dIdx, scheduledDate)
    })
  }
}

function createSessionFromProgramDay(
  memberProgram: MemberProgram,
  day: any,
  weekIndex: number,
  dayIndex: number,
  scheduledDate: Date
): WorkoutSession {
  const sessionId = generateCuid('sess')
  const session: WorkoutSession = {
    id: sessionId,
    memberId: memberProgram.memberId,
    memberProgramId: memberProgram.id,
    programVersion: memberProgram.currentVersion,
    weekIndex,
    dayIndex,
    title: day.label,
    scheduledDate: scheduledDate.toISOString(),
    startedAt: null,
    completedAt: null,
    status: 'SCHEDULED',
    exercises: day.exercises.map((pe: any, idx: number) => {
      const exercise = getExerciseById(pe.exerciseId)
      return {
        id: generateCuid('sex'),
        sessionId,
        exerciseId: pe.exerciseId,
        order: pe.order || idx + 1,
        prescribed: {
          order: pe.order || idx + 1,
          sets: pe.sets,
          repsMin: pe.repsMin,
          repsMax: pe.repsMax,
          targetWeight: pe.targetWeight,
          rpe: pe.rpe,
          restSeconds: pe.restSeconds,
          tempo: pe.tempo,
          supersetTag: pe.supersetTag,
          coachNote: pe.coachNote,
          isOptional: pe.isOptional ?? false,
        },
        source: 'PROGRAM',
        skipped: false,
        note: null,
        exercise,
        setLogs: [],
      } as SessionExercise
    }),
  }

  saveWorkoutSession(session)
  return session
}

/**
 * Revisions Engine (§2, §7):
 * Mutating a program writes a new revision, bumps currentVersion,
 * and regenerates ONLY future uncompleted sessions.
 * Completed sessions are left completely immutable!
 */
export function reviseMemberProgram(
  memberProgramId: string,
  updatedSnapshot: any,
  author: AuthUser,
  changeNote?: string
): MemberProgram {
  const memberPrograms = getActiveMemberProgram(author.id)
  let mp: MemberProgram | null = null

  // Find target program
  const allSessions = getMemberSessions(author.id)
  const targetSession = allSessions.find(s => s.memberProgramId === memberProgramId)
  if (targetSession && memberPrograms && memberPrograms.id === memberProgramId) {
    mp = memberPrograms
  } else {
    // If trainer/owner revising
    mp = getActiveMemberProgram(targetSession?.memberId || author.id)
  }

  if (!mp) throw new Error('Active member program not found')

  const nextVersion = mp.currentVersion + 1
  const revision: MemberProgramRevision = {
    id: generateCuid('mprev'),
    memberProgramId: mp.id,
    version: nextVersion,
    snapshot: updatedSnapshot,
    changedById: author.id,
    changedByRole: author.role?.slug.toUpperCase() === 'MEMBER' ? 'MEMBER' : 'TRAINER',
    changeNote: changeNote || `Updated program revision to v${nextVersion}`,
    createdAt: new Date().toISOString(),
  }

  mp.currentVersion = nextVersion
  mp.snapshot = updatedSnapshot
  if (!mp.revisions) mp.revisions = []
  mp.revisions.push(revision)
  saveMemberProgram(mp)

  // Regenerate future uncompleted sessions only
  const existingSessions = getMemberSessions(mp.memberId).filter(
    s => s.memberProgramId === mp!.id
  )

  const futureUncompleted = existingSessions.filter(
    s => s.status === 'SCHEDULED' && (!s.completedAt)
  )

  // Remove existing uncompleted future sessions
  for (const s of futureUncompleted) {
    s.status = 'EXPIRED'
    saveWorkoutSession(s)
  }

  // Generate new future sessions under nextVersion
  generateFutureSessions(mp, updatedSnapshot)

  auditTrainingEvent(
    author,
    'UPDATE',
    'MEMBER_PROGRAM',
    mp.id,
    `Revised program '${updatedSnapshot.name}' to version ${nextVersion}`,
    { changeNote }
  )

  return mp
}

/**
 * Shift Plan Action (§3)
 * Pushes forward all future scheduled sessions by N days.
 * Preserves completed sessions intact without turning missed workouts red.
 */
export function shiftPlanSchedule(
  memberProgramId: string,
  daysForward: number,
  actor: AuthUser
): { shiftedCount: number } {
  const sessions = getMemberSessions(actor.id).filter(
    s => s.memberProgramId === memberProgramId && s.status === 'SCHEDULED'
  )

  let shiftedCount = 0
  const now = new Date()

  for (const session of sessions) {
    if (session.scheduledDate) {
      const orig = new Date(session.scheduledDate)
      orig.setDate(orig.getDate() + daysForward)
      session.scheduledDate = orig.toISOString()
      saveWorkoutSession(session)
      shiftedCount++
    }
  }

  auditTrainingEvent(
    actor,
    'UPDATE',
    'MEMBER_PROGRAM',
    memberProgramId,
    `Shifted plan schedule forward by ${daysForward} days (${shiftedCount} sessions adjusted)`
  )

  return { shiftedCount }
}
