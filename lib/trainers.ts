/* ============================================================
   DNA 360 — Trainer Coaching & PT Store
   
   - PT Tiers: Premium, Elite, Super Elite
   - PT Commission: 40% (basis PENDING config)
   - Workout Programming & Nutrition Planning
   - 1-on-1 PT session logging & decrementing member PT balances
   ============================================================ */

import type {
  WorkoutProgram,
  NutritionPlan,
  PTSessionLog,
  TrainerCommission,
  PTAppointment,
  PTClient,
} from '@/types/trainer'
import { getStoredMembers, updateMember } from '@/lib/members'
import { getPendingConfig } from '@/lib/settings'
import { isConsentComplete } from '@/lib/consent'
import { logAuditEvent } from '@/lib/audit'

const WORKOUT_PROGRAMS_KEY = 'dna360_workout_programs'
const NUTRITION_PLANS_KEY = 'dna360_nutrition_plans'
const PT_SESSIONS_LOG_KEY = 'dna360_pt_session_logs'
const COMMISSION_LEDGER_KEY = 'dna360_trainer_commission'
const APPOINTMENTS_KEY = 'dna360_pt_appointments'

export const SEEDED_TRAINERS = [
  { id: 'usr_tr_head_01', name: 'Rajesh Poojary', role: 'Head Coach & Performance Specialist', phone: '+919820041001', pt_tier: 'super_elite' },
  { id: 'usr_tr_02', name: 'Krish Rawat', role: 'Strength & Conditioning Coach', phone: '+919820041002', pt_tier: 'elite' },
  { id: 'usr_tr_03', name: 'Sneha Rao', role: 'Reformer Pilates & Yoga Lead', phone: '+919820041003', pt_tier: 'premium' },
  { id: 'usr_tr_04', name: 'Aftab Memon', role: 'Senior RPM Cycling Coach', phone: '+919820041004', pt_tier: 'elite' },
  { id: 'usr_tr_05', name: 'Zeebran Shaikh', role: 'Boxing & Muay Thai Conditioning', phone: '+919820041005', pt_tier: 'premium' },
]

export const SEEDED_PT_CLIENTS: PTClient[] = [
  {
    id: 'mem_001',
    name: 'Arjun Mehta',
    phone: '+919820011111',
    email: 'arjun.mehta@gmail.com',
    memberCode: 'DNA-2025-0892',
    planName: 'Premium PT — 12 Sessions',
    ptSessionsRemaining: 8,
    ptSessionsTotal: 12,
    ptTier: 'premium',
    primaryGoal: 'Hypertrophy / Muscle Gain',
    currentWeightKg: 78.5,
    targetWeightKg: 82.0,
    bodyFatPct: 14.8,
    lastSessionDate: '2026-08-22',
    consentComplete: true,
  },
  {
    id: 'mem_002',
    name: 'Priya Sharma',
    phone: '+919820022222',
    email: 'priya.s@outlook.com',
    memberCode: 'DNA-2025-1043',
    planName: 'Reformer Pilates — 36 Sessions',
    ptSessionsRemaining: 22,
    ptSessionsTotal: 36,
    ptTier: 'premium',
    primaryGoal: 'Mobility & Rehab',
    currentWeightKg: 62.0,
    targetWeightKg: 57.0,
    bodyFatPct: 24.2,
    lastSessionDate: '2026-08-20',
    consentComplete: true,
  },
]

export const SEEDED_WORKOUT_PROGRAMS: WorkoutProgram[] = [
  {
    id: 'wp_001',
    clientId: 'mem_001',
    clientName: 'Arjun Mehta',
    trainerId: 'usr_tr_head_01',
    trainerName: 'Rajesh Poojary',
    title: 'Hypertrophy & Posterior Chain Strength Block',
    splitType: 'PPL',
    startDate: '2026-08-01',
    weeksCount: 6,
    days: [
      {
        id: 'day_push',
        dayName: 'Day 1: Push (Chest & Delts Focus)',
        focus: 'Chest, Front/Side Delts, Triceps Hypertrophy',
        exercises: [
          { id: 'ex_1', name: 'Barbell Incline Bench Press', sets: 4, reps: '8-10', weightKg: 75, restSeconds: 90, rpe: 8 },
          { id: 'ex_2', name: 'Standing DB Lateral Raises', sets: 4, reps: '12-15', weightKg: 14, restSeconds: 60, rpe: 8 },
          { id: 'ex_3', name: 'Cable Overhead Tricep Extension', sets: 3, reps: '12', weightKg: 35, restSeconds: 60, rpe: 7 },
        ],
      },
      {
        id: 'day_pull',
        dayName: 'Day 2: Pull (Lats & Posterior Chain)',
        focus: 'Deadlift, Lat Pulldowns, Biceps',
        exercises: [
          { id: 'ex_4', name: 'Romanian Deadlift (Barbell)', sets: 4, reps: '8', weightKg: 100, restSeconds: 120, rpe: 8 },
          { id: 'ex_5', name: 'Neutral-Grip Lat Pulldown', sets: 4, reps: '10-12', weightKg: 65, restSeconds: 90, rpe: 8 },
        ],
      },
    ],
    notes: 'Focus on 3-second eccentric tempo on RDLs. Keep wrist neutral on pressing movements.',
  },
]

export const SEEDED_NUTRITION_PLANS: NutritionPlan[] = [
  {
    id: 'np_001',
    clientId: 'mem_001',
    clientName: 'Arjun Mehta',
    dailyCalories: 2750,
    proteinGrams: 175,
    carbsGrams: 320,
    fatsGrams: 75,
    waterLitres: 4.0,
    meals: [
      { id: 'm_1', name: 'Meal 1 - Post-Morning Lift', time: '08:30 AM', foods: '4 Egg Whites + 2 Whole Eggs, 80g Rolled Oats, 1 Banana, Whey Shake', calories: 680 },
      { id: 'm_2', name: 'Meal 2 - Clean Lunch', time: '01:30 PM', foods: '200g Grilled Chicken Breast, 150g Brown Rice, Steamed Broccoli & Zucchini', calories: 720 },
      { id: 'm_3', name: 'Meal 3 - Pre-Workout Snack', time: '05:30 PM', foods: 'Whole Wheat Toast with 30g Almond Butter, 1 Apple', calories: 450 },
      { id: 'm_4', name: 'Meal 4 - Dinner & Recovery', time: '09:00 PM', foods: '180g Salmon or Paneer Tikka, 1 Sweet Potato, Green Salad with Olive Oil', calories: 900 },
    ],
    supplements: ['Whey Protein Isolate (30g post-workout)', 'Creatine Monohydrate (5g daily)', 'Omega-3 Fish Oil (2000mg)', 'Vitamin D3 + K2'],
    guidelines: 'Consume 1L water before 10 AM. Limit caffeine past 3 PM.',
  },
]

export const SEEDED_PT_APPOINTMENTS: PTAppointment[] = [
  {
    id: 'pta_001',
    trainerId: 'usr_tr_head_01',
    trainerName: 'Rajesh Poojary',
    clientId: 'mem_001',
    clientName: 'Arjun Mehta',
    clientPhone: '+919820011111',
    date: new Date().toISOString().slice(0, 10),
    startTime: '07:00',
    endTime: '08:00',
    type: '1on1_pt',
    status: 'scheduled',
    ptTier: 'premium',
    consentComplete: true,
  },
  {
    id: 'pta_002',
    trainerId: 'usr_tr_03',
    trainerName: 'Sneha Rao',
    clientId: 'mem_002',
    clientName: 'Priya Sharma',
    clientPhone: '+919820022222',
    date: new Date().toISOString().slice(0, 10),
    startTime: '09:30',
    endTime: '10:30',
    type: '1on1_pt',
    status: 'scheduled',
    ptTier: 'premium',
    consentComplete: true,
  },
]

// ─── Storage Helpers ───

export function getStoredWorkoutPrograms(): WorkoutProgram[] {
  if (typeof window === 'undefined') return SEEDED_WORKOUT_PROGRAMS
  const stored = localStorage.getItem(WORKOUT_PROGRAMS_KEY)
  if (!stored) {
    localStorage.setItem(WORKOUT_PROGRAMS_KEY, JSON.stringify(SEEDED_WORKOUT_PROGRAMS))
    return SEEDED_WORKOUT_PROGRAMS
  }
  try { return JSON.parse(stored) } catch { return SEEDED_WORKOUT_PROGRAMS }
}

export function saveWorkoutPrograms(programs: WorkoutProgram[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(WORKOUT_PROGRAMS_KEY, JSON.stringify(programs))
}

export function getStoredNutritionPlans(): NutritionPlan[] {
  if (typeof window === 'undefined') return SEEDED_NUTRITION_PLANS
  const stored = localStorage.getItem(NUTRITION_PLANS_KEY)
  if (!stored) {
    localStorage.setItem(NUTRITION_PLANS_KEY, JSON.stringify(SEEDED_NUTRITION_PLANS))
    return SEEDED_NUTRITION_PLANS
  }
  try { return JSON.parse(stored) } catch { return SEEDED_NUTRITION_PLANS }
}

export function saveNutritionPlans(plans: NutritionPlan[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(NUTRITION_PLANS_KEY, JSON.stringify(plans))
}

export function getStoredPTSessions(): PTSessionLog[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(PT_SESSIONS_LOG_KEY)
  if (!stored) return []
  try { return JSON.parse(stored) } catch { return [] }
}

export function savePTSessions(logs: PTSessionLog[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(PT_SESSIONS_LOG_KEY, JSON.stringify(logs))
}

export function getStoredCommissions(): TrainerCommission[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(COMMISSION_LEDGER_KEY)
  if (!stored) return []
  try { return JSON.parse(stored) } catch { return [] }
}

export function saveCommissions(comms: TrainerCommission[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(COMMISSION_LEDGER_KEY, JSON.stringify(comms))
}

export function getStoredAppointments(): PTAppointment[] {
  if (typeof window === 'undefined') return SEEDED_PT_APPOINTMENTS
  const stored = localStorage.getItem(APPOINTMENTS_KEY)
  if (!stored) {
    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(SEEDED_PT_APPOINTMENTS))
    return SEEDED_PT_APPOINTMENTS
  }
  try { return JSON.parse(stored) } catch { return SEEDED_PT_APPOINTMENTS }
}

export function saveAppointments(apps: PTAppointment[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(apps))
}

// ─── Queries & Operations ───

export function getTrainerClients(trainerId?: string): PTClient[] {
  const members = getStoredMembers()
  const matchingMembers = members.filter(
    m => (!trainerId || m.assigned_trainer_id === trainerId) &&
         m.active_memberships.some(ms => ms.product_category.includes('pt') || ms.product_category.includes('pilates') || ms.sessions_remaining !== null)
  )

  return matchingMembers.map(m => {
    const ptMembership = m.active_memberships.find(ms => ms.sessions_remaining !== null)
    return {
      id: m.id,
      name: m.name,
      phone: m.phone,
      email: m.email,
      memberCode: m.member_code,
      planName: ptMembership?.product_name || 'Personal Training',
      ptSessionsRemaining: ptMembership?.sessions_remaining ?? 0,
      ptSessionsTotal: ptMembership?.sessions_total ?? 0,
      ptTier: 'premium',
      primaryGoal: 'Hypertrophy / Muscle Gain',
      currentWeightKg: m.fitness_metrics[m.fitness_metrics.length - 1]?.weightKg || 75,
      targetWeightKg: 80,
      bodyFatPct: m.fitness_metrics[m.fitness_metrics.length - 1]?.bodyFatPct || 15,
      lastSessionDate: m.last_visit_at?.slice(0, 10),
      consentComplete: isConsentComplete(ptMembership?.id || '', 'personal_training_tc'),
    }
  })
}

export function logPTSession(data: {
  clientId: string
  clientName: string
  trainerId: string
  trainerName: string
  workoutFocus: string
  rating: number
  clientFeedback?: string
  durationMinutes?: number
}): PTSessionLog {
  const id = `ptlog_${Date.now()}`
  const config = getPendingConfig()

  // Commission calculation (40% default, basis PENDING)
  const sessionValueMinor = 169900 // Default ₹1,699 per session
  let commissionEarnedMinor = 0
  let basisUsed: TrainerCommission['basisUsed'] = 'not_configured'
  let payoutStatus: TrainerCommission['payoutStatus'] = 'blocked_pending_config'

  if (config.pt_commission_basis) {
    basisUsed = config.pt_commission_basis
    commissionEarnedMinor = Math.round((sessionValueMinor * config.pt_commission_pct) / 100)
    payoutStatus = 'accrued'
  }

  const newLog: PTSessionLog = {
    id,
    clientId: data.clientId,
    clientName: data.clientName,
    trainerId: data.trainerId,
    trainerName: data.trainerName,
    date: new Date().toISOString().slice(0, 10),
    durationMinutes: data.durationMinutes || 60,
    workoutFocus: data.workoutFocus,
    rating: data.rating,
    clientFeedback: data.clientFeedback,
    commissionEarnedMinor,
    status: 'completed',
    ptTier: 'premium',
  }

  const logs = getStoredPTSessions()
  savePTSessions([newLog, ...logs])

  const newCommission: TrainerCommission = {
    id: `comm_${Date.now()}`,
    trainerId: data.trainerId,
    trainerName: data.trainerName,
    sessionId: id,
    clientName: data.clientName,
    date: new Date().toISOString().slice(0, 10),
    sessionValueMinor,
    amountMinor: commissionEarnedMinor,
    basisUsed,
    payoutStatus,
  }
  const comms = getStoredCommissions()
  saveCommissions([newCommission, ...comms])

  // Decrement remaining sessions on member's active PT membership
  const members = getStoredMembers()
  const member = members.find(m => m.id === data.clientId)
  if (member) {
    const updatedMemberships = member.active_memberships.map(ms => {
      if (ms.sessions_remaining !== null && ms.sessions_remaining > 0) {
        return {
          ...ms,
          sessions_consumed: (ms.sessions_consumed || 0) + 1,
          sessions_remaining: ms.sessions_remaining - 1,
        }
      }
      return ms
    })

    updateMember(member.id, {
      active_memberships: updatedMemberships,
    })
  }

  logAuditEvent({
    actor: { id: data.trainerId, name: data.trainerName, email: '', role: 'Trainer' },
    action: 'CREATE',
    entity: 'PTSessionLog',
    entityId: id,
    branchId: 'pow',
    description: `Logged PT session for ${data.clientName}: "${data.workoutFocus}".`,
    afterState: newLog,
  })

  return newLog
}

export function getTrainerAppointments(trainerId?: string): PTAppointment[] {
  const apps = getStoredAppointments()
  if (!trainerId) return apps
  return apps.filter(a => a.trainerId === trainerId)
}

export function getCommissionLedger(trainerId?: string): TrainerCommission[] {
  const comms = getStoredCommissions()
  if (!trainerId) return comms
  return comms.filter(c => c.trainerId === trainerId)
}

export function getClientProgram(clientId: string): WorkoutProgram | null {
  return getStoredWorkoutPrograms().find(p => p.clientId === clientId) || null
}

export function getClientNutrition(clientId: string): NutritionPlan | null {
  return getStoredNutritionPlans().find(p => p.clientId === clientId) || null
}

export function saveWorkoutProgram(program: Omit<WorkoutProgram, 'id'> & { id?: string }): WorkoutProgram {
  const programs = getStoredWorkoutPrograms()
  const id = program.id || `wp_${Date.now()}`
  const existingIndex = programs.findIndex(p => p.id === id || p.clientId === program.clientId)
  const fullProgram: WorkoutProgram = {
    ...program,
    id,
  }
  if (existingIndex >= 0) {
    programs[existingIndex] = fullProgram
  } else {
    programs.push(fullProgram)
  }
  saveWorkoutPrograms(programs)
  return fullProgram
}

export function saveNutritionPlan(plan: Omit<NutritionPlan, 'id'> & { id?: string }): NutritionPlan {
  const plans = getStoredNutritionPlans()
  const id = plan.id || `np_${Date.now()}`
  const existingIndex = plans.findIndex(p => p.id === id || p.clientId === plan.clientId)
  const fullPlan: NutritionPlan = {
    ...plan,
    id,
  }
  if (existingIndex >= 0) {
    plans[existingIndex] = fullPlan
  } else {
    plans.push(fullPlan)
  }
  saveNutritionPlans(plans)
  return fullPlan
}
