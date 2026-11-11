/**
 * DNA 360 — Studio Attendance Heatmap Model
 *
 * Models hourly turnstile check-in velocity across all 7 weekdays (6 AM to 10 PM)
 * to optimize trainer floor allocation, cleaning shifts, and class timetables.
 */

import { getStoredAccessLogs } from '@/lib/attendance'

export interface HeatmapHourSlot {
  hour: number // 6 to 21 (6 AM to 9 PM)
  hourLabel: string // "6 AM", "7 AM", etc.
  checkIns: number
  intensity: number // 0 to 1
  isPeak: boolean
}

export interface DayHeatmap {
  dayName: string
  shortDay: string
  slots: HeatmapHourSlot[]
  totalDayCheckIns: number
  peakHourLabel: string
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const FULL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

/**
 * Real heatmap: aggregates granted turnstile entries from the access log
 * by weekday (Mon-Sun) and hour (6 AM - 9 PM). No synthetic traffic.
 */
export function getAttendanceHeatmap(): DayHeatmap[] {
  const granted = getStoredAccessLogs().filter(
    (l) => l.decision === 'GRANTED' || l.decision === 'GRANTED_GRACE_PERIOD' || l.decision === 'MANUAL_OVERRIDE'
  )
  const counts: number[][] = DAYS.map(() => new Array(24).fill(0))
  for (const l of granted) {
    const dt = new Date(l.timestamp)
    const dayIdx = (dt.getDay() + 6) % 7
    counts[dayIdx][dt.getHours()]++
  }
  const globalMax = Math.max(1, ...counts.flatMap((row) => row.slice(6, 22)))

  return DAYS.map((shortDay, dayIdx) => {
    const slots: HeatmapHourSlot[] = []
    let totalDay = 0
    let maxHourCheckIns = 0
    let peakHour = -1
    for (let h = 6; h <= 21; h++) {
      const checkIns = counts[dayIdx][h]
      totalDay += checkIns
      if (checkIns > maxHourCheckIns) {
        maxHourCheckIns = checkIns
        peakHour = h
      }
      const intensity = checkIns / globalMax
      const hourLabel = h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`
      slots.push({ hour: h, hourLabel, checkIns, intensity, isPeak: checkIns > 0 && intensity >= 0.7 })
    }
    const peakHourLabel =
      peakHour < 0 ? '—' : peakHour < 12 ? `${peakHour} AM` : peakHour === 12 ? '12 PM' : `${peakHour - 12} PM`
    return { dayName: FULL_DAYS[dayIdx], shortDay, slots, totalDayCheckIns: totalDay, peakHourLabel }
  })
}
