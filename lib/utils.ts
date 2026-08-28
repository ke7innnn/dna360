import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format money in INR with Indian grouping (₹1,23,456)
 * Accepts paise (integer minor units) — divides by 100 for display.
 */
export function formatINR(paise: number, showDecimal = false): string {
  const rupees = paise / 100
  const isNegative = rupees < 0
  const abs = Math.abs(rupees)

  const [intPart, decPart] = abs.toFixed(2).split('.')
  const lastThree = intPart.slice(-3)
  const rest = intPart.slice(0, -3)

  const formatted = rest
    ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
    : lastThree

  const sign = isNegative ? '-' : ''
  const decimal = showDecimal ? `.${decPart}` : ''

  return `${sign}₹${formatted}${decimal}`
}

/**
 * Format a Date to a display string in the gym's timezone.
 * Default timezone: Asia/Kolkata
 */
export function formatDate(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
  timezone = 'Asia/Kolkata'
): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-IN', {
    timeZone: timezone,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  })
}

/**
 * Format a Date to include time
 */
export function formatDateTime(
  date: Date | string | number,
  timezone = 'Asia/Kolkata'
): string {
  const d = new Date(date)
  return d.toLocaleString('en-IN', {
    timeZone: timezone,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Generate initials from a name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
