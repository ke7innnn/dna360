'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps {
  status?: string
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'glass' | 'solid' | 'outline'
  shape?: 'pill' | 'rounded'
  dot?: boolean
}

/**
 * Status Badge — Aurora Dark-Luxe Glass Bubble Pill
 * Soft glassmorphic background with vibrant color accents and refined modern Satoshi typography.
 */
export function Badge({
  status = 'neutral',
  children,
  className,
  size = 'md',
  dot = true,
}: BadgeProps) {
  const normalizedStatus = ((): 'green' | 'amber' | 'accent' | 'indigo' | 'neutral' | 'danger' => {
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
        return 'danger'
      case 'accent':
      case 'primary':
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
    green:
      'bg-[rgba(52,211,153,0.12)] text-[#34D399] border border-[rgba(52,211,153,0.28)] shadow-[0_0_10px_rgba(52,211,153,0.12)]',
    amber:
      'bg-[rgba(245,158,11,0.12)] text-[#FBBF24] border border-[rgba(245,158,11,0.28)] shadow-[0_0_10px_rgba(245,158,11,0.12)]',
    accent:
      'bg-[rgba(59,130,246,0.12)] text-[#60A5FA] border border-[rgba(59,130,246,0.28)] shadow-[0_0_10px_rgba(59,130,246,0.12)]',
    danger:
      'bg-[rgba(239,68,68,0.12)] text-[#F87171] border border-[rgba(239,68,68,0.28)] shadow-[0_0_10px_rgba(239,68,68,0.12)]',
    indigo:
      'bg-[rgba(129,140,248,0.12)] text-[#A5B4FC] border border-[rgba(129,140,248,0.28)] shadow-[0_0_10px_rgba(129,140,248,0.12)]',
    neutral:
      'bg-[rgba(255,255,255,0.05)] text-[var(--muted)] border border-[rgba(255,255,255,0.08)]',
  }

  const dotColors: Record<string, string> = {
    green: 'bg-[#34D399] shadow-[0_0_6px_#34D399]',
    amber: 'bg-[#FBBF24] shadow-[0_0_6px_#FBBF24]',
    accent: 'bg-[#60A5FA] shadow-[0_0_6px_#60A5FA]',
    danger: 'bg-[#F87171] shadow-[0_0_6px_#F87171]',
    indigo: 'bg-[#A5B4FC] shadow-[0_0_6px_#A5B4FC]',
    neutral: 'bg-[var(--muted)]',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-ui font-semibold uppercase backdrop-blur-md transition-colors select-none',
        size === 'sm'
          ? 'px-2.5 py-0.5 text-[10.5px] tracking-wider'
          : size === 'lg'
          ? 'px-3.5 py-1 text-xs tracking-wider'
          : 'px-3 py-0.5 text-[11px] tracking-wider',
        statusStyles[normalizedStatus],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full shrink-0 animate-pulse',
            dotColors[normalizedStatus]
          )}
        />
      )}
      <span>{children}</span>
    </span>
  )
}

/** Alias for StatusPill */
export function StatusPill(props: BadgeProps) {
  return <Badge {...props} />
}

export default Badge
