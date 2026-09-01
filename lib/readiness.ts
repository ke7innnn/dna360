/* ============================================================
   DNA 360 — Daily Readiness Check-In Store (§2 Addendum)
   Captures training readiness (energy 1-5, sleep 1-5, soreness 1-5).
   Strictly training readiness, never emotional health data.
   ============================================================ */

export interface ReadinessCheckInRecord {
  id: string
  memberId: string
  branchId: string
  recordedAt: string
  energy: number // 1–5: 1: Drained, 2: Low, 3: Steady, 4: Good, 5: Strong
  sleep?: number // 1–5
  soreness?: number // 1–5: 1 fresh, 5 very sore
  sessionId?: string
  createdVia: 'HOME_CARD' | 'PRE_WORKOUT'
}

const READINESS_STORAGE_KEY = 'dna360_readiness_checkins'
const READINESS_DISMISSED_KEY = 'dna360_readiness_dismissals'

export const ENERGY_LABELS: Record<number, { label: string; desc: string; color: string }> = {
  1: { label: 'Drained', desc: 'Running on empty', color: '#EF4444' },
  2: { label: 'Low', desc: 'Fatigued, low drive', color: '#F97316' },
  3: { label: 'Steady', desc: 'Ready for standard volume', color: '#3B82F6' },
  4: { label: 'Good', desc: 'Energized and focused', color: '#34D399' },
  5: { label: 'Strong', desc: 'Peak power and readiness', color: '#10B981' },
}

function getStoredCheckIns(): ReadinessCheckInRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(READINESS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveCheckIns(items: ReadinessCheckInRecord[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(READINESS_STORAGE_KEY, JSON.stringify(items))
  } catch {}
}

export function getTodayReadiness(memberId: string): ReadinessCheckInRecord | null {
  const checkIns = getStoredCheckIns()
  const todayStr = new Date().toISOString().slice(0, 10)
  return checkIns.find(c => c.memberId === memberId && c.recordedAt.slice(0, 10) === todayStr) || null
}

export function isReadinessDismissedToday(memberId: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = localStorage.getItem(READINESS_DISMISSED_KEY)
    if (!raw) return false
    const parsed = JSON.parse(raw)
    const todayStr = new Date().toISOString().slice(0, 10)
    return parsed[memberId] === todayStr
  } catch {
    return false
  }
}

export function dismissReadinessToday(memberId: string) {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(READINESS_DISMISSED_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    const todayStr = new Date().toISOString().slice(0, 10)
    parsed[memberId] = todayStr
    localStorage.setItem(READINESS_DISMISSED_KEY, JSON.stringify(parsed))
    window.dispatchEvent(new Event('dna360_readiness_updated'))
  } catch {}
}

export function recordReadiness(params: {
  memberId: string
  branchId?: string
  energy: number
  sleep?: number
  soreness?: number
  sessionId?: string
  createdVia: 'HOME_CARD' | 'PRE_WORKOUT'
}): ReadinessCheckInRecord {
  const checkIns = getStoredCheckIns()
  const todayStr = new Date().toISOString().slice(0, 10)
  const existingIdx = checkIns.findIndex(
    c => c.memberId === params.memberId && c.recordedAt.slice(0, 10) === todayStr
  )

  const record: ReadinessCheckInRecord = {
    id: existingIdx >= 0 ? checkIns[existingIdx].id : `rc_${Date.now()}`,
    memberId: params.memberId,
    branchId: params.branchId || 'pow',
    recordedAt: new Date().toISOString(),
    energy: params.energy,
    sleep: params.sleep,
    soreness: params.soreness,
    sessionId: params.sessionId,
    createdVia: params.createdVia,
  }

  if (existingIdx >= 0) {
    checkIns[existingIdx] = record
  } else {
    checkIns.unshift(record)
  }

  saveCheckIns(checkIns)

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('dna360_readiness_updated'))
  }

  return record
}

/**
 * Computes recommendation based on energy level (1-5)
 */
export function getReadinessRecommendation(energy: number) {
  if (energy <= 2) {
    return {
      type: 'reduced_version',
      title: 'Reduced Volume Suggested',
      description: 'Your energy is low today. We suggest 1 fewer set per exercise and 10% lighter targets.',
      reductionFactor: 0.9,
      setReduction: 1,
    }
  }
  if (energy >= 4) {
    return {
      type: 'peak_ready',
      title: 'Peak Readiness',
      description: 'You are feeling strong. Prime time to attempt a PR if you feel dialed in.',
      reductionFactor: 1.0,
      setReduction: 0,
    }
  }
  return {
    type: 'standard',
    title: 'Standard Volume',
    description: 'Steady energy. Proceed with your prescribed workout plan.',
    reductionFactor: 1.0,
    setReduction: 0,
  }
}
