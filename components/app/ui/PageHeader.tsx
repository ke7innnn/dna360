'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface PageHeaderProps {
  eyebrow?: string
  title: string
  italicWord?: string
  description?: string
  actions?: React.ReactNode
  className?: string
}

/**
 * PageHeader (Core Primitive — §4, §5)
 *
 * Mono eyebrow → Clash H1 (with optional italic accent word in --ink-2) → supporting line in --muted
 * + Right-aligned actions on the same row.
 */
export function PageHeader({
  eyebrow,
  title,
  italicWord,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none pb-2',
        className
      )}
    >
      <div>
        {eyebrow && (
          <span className="font-data text-[10.5px] uppercase tracking-[0.16em] font-medium text-[var(--muted)] block">
            {eyebrow}
          </span>
        )}
        <h1 className="font-display text-2xl sm:text-[32px] font-semibold text-[var(--ink)] tracking-tight mt-1 leading-tight">
          {title}
          {italicWord && (
            <span className="italic font-normal text-[var(--ink-2)] ml-2">
              {italicWord}
            </span>
          )}
        </h1>
        {description && (
          <p className="font-ui text-sm text-[var(--muted)] mt-1 max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 shrink-0 sm:self-center">
          {actions}
        </div>
      )}
    </div>
  )
}

export default PageHeader
