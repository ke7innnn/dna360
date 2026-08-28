'use client'

import React from 'react'
import { Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('glass-card flex flex-col items-center justify-center py-16 px-8 text-center', className)}>
      <div className="w-14 h-14 rounded-2xl bg-[var(--app-glass-bg)] border border-[var(--app-glass-border)] flex items-center justify-center mb-4">
        {icon || <Inbox className="w-7 h-7 text-[var(--app-text-muted)]" />}
      </div>

      <h3 className="text-base font-semibold text-[var(--app-text-primary)] mb-1">
        {title}
      </h3>

      {description && (
        <p className="text-sm text-[var(--app-text-muted)] max-w-sm mb-4">
          {description}
        </p>
      )}

      {action && (
        <Button variant="secondary" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
