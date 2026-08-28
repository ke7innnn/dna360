'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import type { SemanticStatus } from '@/types'

export interface BadgeProps {
  status?: string
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md'
  // Support legacy props gracefully
  variant?: string
  shape?: string
  dot?: boolean
}

/**
 * Status Badge — DNA 360 Design System
 * 
 * Rules: --r-full, 2px/8px padding, label uppercase font, tinted background with matching text colour.
 * Text only — no dot, no border. One shape, one meaning.
 */
export function Badge({
  status = 'neutral',
  children,
  className,
  size = 'md',
}: BadgeProps) {
  const normalizedStatus = ((): string => {
    switch (status) {
      case 'active':
      case 'ok':
      case 'success':
        return 'ok'
      case 'grace':
      case 'warn':
      case 'warning':
      case 'expiring_soon':
      case 'grace_period':
        return 'warn'
      case 'expired':
      case 'blocked':
      case 'danger':
      case 'blacklisted':
        return 'danger'
      case 'info':
        return 'info'
      case 'pending':
      case 'neutral':
      case 'inactive':
      default:
        return 'neutral'
    }
  })()

  const statusStyles: Record<string, string> = {
    ok: 'bg-[var(--ok-dim)] text-[var(--ok)]',
    warn: 'bg-[var(--warn-dim)] text-[var(--warn)]',
    danger: 'bg-[var(--danger-dim)] text-[var(--danger)]',
    info: 'bg-[var(--blue-dim)] text-[var(--blue)]',
    neutral: 'bg-[var(--surface-sunken)] text-[var(--text-muted)]',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-ui uppercase font-semibold tracking-[0.06em] select-none',
        size === 'sm' ? 'px-2 py-0.5 text-[10px] leading-[13px]' : 'px-2.5 py-0.5 text-[11px] leading-[14px]',
        statusStyles[normalizedStatus],
        className
      )}
    >
      {children}
    </span>
  )
}

/** Alias for semantic clarity */
export function StatusPill(props: BadgeProps) {
  return <Badge {...props} />
}

export default Badge
