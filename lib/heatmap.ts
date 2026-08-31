/**
 * DNA 360 — Studio Attendance Heatmap Model
 *
 * Models hourly turnstile check-in velocity across all 7 weekdays (6 AM to 10 PM)
 * to optimize trainer floor allocation, cleaning shifts, and class timetables.
 */

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

export function getAttendanceHeatmap(): DayHeatmap[] {
  return DAYS.map((shortDay, dayIdx) => {
    const slots: HeatmapHourSlot[] = []
    let totalDay = 0
    let maxHourCheckIns = 0
    let peakHour = 19 // Default 7 PM

    for (let h = 6; h <= 21; h++) {
      const isMorningPeak = h >= 6 && h <= 9
      const isEveningPeak = h >= 18 && h <= 20
      const isWeekend = dayIdx >= 5

      let baseTraffic = isWeekend ? 18 : 12
      if (isMorningPeak) baseTraffic += isWeekend ? 25 : 38
      if (isEveningPeak) baseTraffic += isWeekend ? 15 : 46
      if (h >= 13 && h <= 16) baseTraffic -= 6 // Afternoon lull

      // Add day-specific variance
      const checkIns = Math.max(4, Math.round(baseTraffic + ((dayIdx * 7 + h * 3) % 11)))
      totalDay += checkIns

      if (checkIns > maxHourCheckIns) {
        maxHourCheckIns = checkIns
        peakHour = h
      }

      const isPeak = isMorningPeak || isEveningPeak
      const intensity = Math.min(1, Math.max(0.1, checkIns / 65))

      const hourLabel = h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`

      slots.push({
        hour: h,
        hourLabel,
        checkIns,
        intensity,
        isPeak,
      })
    }

    const peakHourLabel = peakHour < 12 ? `${peakHour} AM` : peakHour === 12 ? '12 PM' : `${peakHour - 12} PM`

    return {
      dayName: FULL_DAYS[dayIdx],
      shortDay,
      slots,
      totalDayCheckIns: totalDay,
      peakHourLabel,
    }
  })
}
