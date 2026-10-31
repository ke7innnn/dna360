/* ============================================================
   Local-calendar date helpers.

   `new Date().toISOString().slice(0, 10)` returns the UTC date, which is
   one day behind in IST between 00:00 and 05:30. Anything that is shown to
   a member or compared against a class date must use these helpers instead.
   ============================================================ */

/** YYYY-MM-DD for the given Date in the device's local timezone. */
export function toLocalDateStr(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Parse a YYYY-MM-DD string as a local-midnight Date (not UTC). */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

/** Local date string `offset` days from today. */
export function localDateOffset(offset: number, from: Date = new Date()): string {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + offset)
  return toLocalDateStr(d)
}

/** Local Date for a session date + "HH:MM" start time. */
export function sessionStartDate(dateStr: string, startTime: string): Date {
  const base = parseLocalDate(dateStr)
  const [hh, mm] = startTime.split(':').map(Number)
  base.setHours(hh || 0, mm || 0, 0, 0)
  return base
}

/** "07:00" -> "7:00 AM" */
export function formatTime12h(hhmm: string): string {
  const [hh, mm] = hhmm.split(':').map(Number)
  const suffix = hh >= 12 ? 'PM' : 'AM'
  const h12 = hh % 12 === 0 ? 12 : hh % 12
  return `${h12}:${String(mm || 0).padStart(2, '0')} ${suffix}`
}
