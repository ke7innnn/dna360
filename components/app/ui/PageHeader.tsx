'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface PageHeaderProps {
  eyebrow?: string
  title: string
  italicWord?: string
  badge?: React.ReactNode
  description?: string
  actions?: React.ReactNode
  className?: string
  variant?: 'card' | 'plain'
}

/**
 * PageHeader (Core Primitive — §4, §5)
 *
 * Premium luxury header with ambient aurora radial glow and top-edge accent light.
 */
export function PageHeader({
  eyebrow,
  title,
  italicWord,
  badge,
  description,
  actions,
  className,
  variant = 'plain',
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'relative select-none transition-all',
        variant === 'card'
          ? [
              'p-6 sm:p-7 rounded-[var(--r-xl)] overflow-hidden',
              'bg-gradient-to-r from-[rgba(59,130,246,0.10)] via-[rgba(255,255,255,0.02)] to-[rgba(99,102,241,0.04)]',
              'border border-[var(--line)] shadow-card backdrop-blur-md',
              'before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-gradient-to-r before:from-[#3B82F6] before:via-[rgba(59,130,246,0.5)] before:to-transparent',
            ]
          : [
              'pb-2 relative',
            ],
        className
      )}
    >
      {/* Ambient Aurora Blue Light Bloom behind header */}
      <div
        className="absolute -top-12 -left-8 w-[500px] h-[220px] rounded-full blur-[90px] pointer-events-none opacity-45 -z-10"
        style={{
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.45) 0%, rgba(99, 102, 241, 0.20) 50%, transparent 80%)',
        }}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="space-y-1.5">
          {(eyebrow || badge) && (
            <div className="flex flex-wrap items-center gap-2.5">
              {eyebrow && (
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_6px_rgba(59,130,246,0.9)]" />
                  <span className="font-ui text-[10.5px] uppercase tracking-[0.14em] font-semibold text-[var(--muted)]">
                    {eyebrow}
                  </span>
                </div>
              )}
              {badge && (
                <div className="shrink-0 flex items-center">
                  {badge}
                </div>
              )}
            </div>
          )}
          <h1 className="font-display text-2xl sm:text-[34px] font-semibold text-[var(--ink)] tracking-tight leading-tight">
            {title}
            {italicWord && (
              <span className="italic font-normal text-[var(--ink-2)] ml-2">
                {italicWord}
              </span>
            )}
          </h1>
          {description && (
            <p className="font-ui text-sm text-[var(--muted)] max-w-2xl leading-relaxed">
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
    </div>
  )
}

export default PageHeader
