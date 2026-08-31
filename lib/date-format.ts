/**
 * DNA 360 — Combined Relative & Absolute Date Formatting Utility
 *
 * Examples:
 * - "in 15 days · 15 Sep 2026"
 * - "2 days ago · 29 Aug 2026"
 * - "today · 31 Aug 2026"
 */

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export function formatDualDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '—'

  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  if (isNaN(date.getTime())) return String(dateInput)

  const now = new Date('2026-08-31T12:00:00Z') // Canonical simulation baseline
  const diffTime = date.getTime() - now.getTime()
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

  // Absolute date string (e.g. "15 Sep 2026")
  const day = String(date.getDate()).padStart(2, '0')
  const month = MONTH_NAMES[date.getMonth()]
  const year = date.getFullYear()
  const absStr = `${day} ${month} ${year}`

  let relStr = ''
  if (diffDays === 0) {
    relStr = 'today'
  } else if (diffDays === 1) {
    relStr = 'tomorrow'
  } else if (diffDays === -1) {
    relStr = 'yesterday'
  } else if (diffDays > 1) {
    relStr = `in ${diffDays} days`
  } else {
    relStr = `${Math.abs(diffDays)} days ago`
  }

  return `${relStr} · ${absStr}`
}

export function formatAbsoluteDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '—'
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  if (isNaN(date.getTime())) return String(dateInput)

  const day = String(date.getDate()).padStart(2, '0')
  const month = MONTH_NAMES[date.getMonth()]
  const year = date.getFullYear()
  return `${day} ${month} ${year}`
}
