'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps {
  status?: string
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md'
  variant?: string
  shape?: string
  dot?: boolean
}

/**
 * Status Badge — Aurora Dark-Luxe (§2, §5)
 * Status-tinted background with matching text color, Martian Mono font, uppercase tracking.
 */
export function Badge({
  status = 'neutral',
  children,
  className,
  size = 'md',
  dot,
}: BadgeProps) {
  const normalizedStatus = ((): 'green' | 'amber' | 'accent' | 'indigo' | 'neutral' => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'ok':
      case 'success':
      case 'online':
      case 'paid':
        return 'green'
      case 'grace':
      case 'warn':
      case 'warning':
      case 'expiring_soon':
      case 'grace_period':
      case 'pending':
        return 'amber'
      case 'expired':
      case 'blocked':
      case 'danger':
      case 'blacklisted':
      case 'void':
      case 'overdue':
        return 'accent'
      case 'info':
      case 'platinum':
      case 'vip':
        return 'indigo'
      case 'neutral':
      case 'inactive':
      default:
        return 'neutral'
    }
  })()

  const statusStyles: Record<string, string> = {
    green: 'bg-[rgba(52,211,153,0.12)] text-[#34D399] border border-[rgba(52,211,153,0.25)]',
    amber: 'bg-[rgba(245,158,11,0.12)] text-[#F59E0B] border border-[rgba(245,158,11,0.25)]',
    accent: 'bg-[rgba(244,63,94,0.12)] text-[#F43F5E] border border-[rgba(244,63,94,0.25)]',
    indigo: 'bg-[rgba(129,140,248,0.12)] text-[#818CF8] border border-[rgba(129,140,248,0.25)]',
    neutral: 'bg-[var(--surface-2)] text-[var(--muted)] border border-[var(--line)]',
  }

  const dotColors: Record<string, string> = {
    green: 'bg-[#34D399]',
    amber: 'bg-[#F59E0B]',
    accent: 'bg-[#F43F5E]',
    indigo: 'bg-[#818CF8]',
    neutral: 'bg-[var(--muted)]',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-data uppercase font-semibold select-none',
        size === 'sm'
          ? 'px-2 py-0.5 text-[10px] tracking-[0.08em]'
          : 'px-2.5 py-0.5 text-[11px] tracking-[0.10em]',
        statusStyles[normalizedStatus],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full animate-pulse',
            dotColors[normalizedStatus]
          )}
        />
      )}
      {children}
    </span>
  )
}

/** Alias for StatusPill */
export function StatusPill(props: BadgeProps) {
  return <Badge {...props} />
}

export default Badge
