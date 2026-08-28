'use client'

import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import type { SemanticStatus } from '@/types'

const badgeVariants = cva(
  'inline-flex items-center gap-1 font-medium tabular-nums transition-colors',
  {
    variants: {
      variant: {
        filled: '',
        ghost: '',
      },
      size: {
        sm: 'px-2 py-0.5 text-[0.6875rem]',
        md: 'px-2.5 py-1 text-xs',
      },
      shape: {
        badge: 'rounded-md',
        pill: 'rounded-full',
      },
    },
    defaultVariants: {
      variant: 'ghost',
      size: 'md',
      shape: 'pill',
    },
  }
)

const statusColors: Record<SemanticStatus, { filled: string; ghost: string }> = {
  success: {
    filled: 'bg-[var(--app-success)] text-white',
    ghost: 'bg-[var(--app-success)]/10 text-[var(--app-success)] border border-[var(--app-success)]/20',
  },
  warning: {
    filled: 'bg-[var(--app-warning)] text-black',
    ghost: 'bg-[var(--app-warning)]/10 text-[var(--app-warning)] border border-[var(--app-warning)]/20',
  },
  danger: {
    filled: 'bg-[var(--app-danger)] text-white',
    ghost: 'bg-[var(--app-danger)]/10 text-[var(--app-danger)] border border-[var(--app-danger)]/20',
  },
  info: {
    filled: 'bg-[var(--app-info)] text-white',
    ghost: 'bg-[var(--app-info)]/10 text-[var(--app-info)] border border-[var(--app-info)]/20',
  },
  neutral: {
    filled: 'bg-[var(--app-glass-bg)] text-[var(--app-text-secondary)] border border-[var(--app-glass-border)]',
    ghost: 'bg-[var(--app-glass-bg)] text-[var(--app-text-muted)] border border-[var(--app-glass-border)]',
  },
}

export interface BadgeProps extends VariantProps<typeof badgeVariants> {
  status?: SemanticStatus
  children: React.ReactNode
  className?: string
  dot?: boolean
}

export function Badge({
  status = 'neutral',
  variant = 'ghost',
  size,
  shape,
  children,
  className,
  dot,
}: BadgeProps) {
  const colorClass = statusColors[status]?.[variant || 'ghost'] || statusColors.neutral.ghost

  return (
    <span className={cn(badgeVariants({ variant, size, shape }), colorClass, className)}>
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            status === 'success' && 'bg-[var(--app-success)]',
            status === 'warning' && 'bg-[var(--app-warning)]',
            status === 'danger' && 'bg-[var(--app-danger)]',
            status === 'info' && 'bg-[var(--app-info)]',
            status === 'neutral' && 'bg-[var(--app-text-muted)]',
          )}
        />
      )}
      {children}
    </span>
  )
}

/** Alias for semantic clarity */
export function StatusPill(props: BadgeProps) {
  return <Badge shape="pill" {...props} />
}
