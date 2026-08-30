'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Card } from './glass-card'

export interface StatTileProps {
  label: string
  value: string | number
  unit?: string
  icon?: React.ReactNode
  delta?: {
    text: string
    type?: 'ok' | 'warn' | 'danger' | 'neutral'
  }
  className?: string
  variant?: 'default' | 'feature'
}

export function StatTile({
  label,
  value,
  unit,
  icon,
  delta,
  className,
  variant = 'default',
}: StatTileProps) {
  return (
    <Card
      variant={variant}
      className={cn(
        'p-5 flex flex-col justify-between select-none relative overflow-hidden group',
        className
      )}
    >
      {/* Top row: Mono eyebrow label + Lucide Icon */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-data text-[11px] uppercase tracking-[0.16em] font-medium text-[var(--muted)] truncate">
          {label}
        </span>
        {icon && (
          <div className="text-[var(--accent)] shrink-0 transition-transform duration-140 group-hover:scale-110">
            {icon}
          </div>
        )}
      </div>

      {/* Main Metric: Big Clash Number + Mono Unit */}
      <div className="mt-3.5 flex items-baseline gap-2">
        <span className="font-display text-3xl sm:text-4xl font-semibold text-[var(--ink)] tabular-nums tracking-tight">
          {value}
        </span>
        {unit && (
          <span className="font-data text-xs text-[var(--muted)] font-medium">
            {unit}
          </span>
        )}
      </div>

      {/* Delta or context line */}
      {delta && (
        <div className="mt-2.5 flex items-center gap-1.5 text-xs font-ui">
          <span
            className={cn(
              'font-data text-[11px] font-semibold tabular-nums',
              delta.type === 'ok' && 'text-[var(--green)]',
              delta.type === 'warn' && 'text-[var(--amber)]',
              delta.type === 'danger' && 'text-[var(--accent)]',
              (!delta.type || delta.type === 'neutral') && 'text-[var(--muted)]'
            )}
          >
            {delta.text}
          </span>
        </div>
      )}
    </Card>
  )
}

/** Alias for StatCard legacy compatibility */
export function StatCard(props: StatTileProps) {
  return <StatTile {...props} />
}

export default StatTile
