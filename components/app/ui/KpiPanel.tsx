'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import StrandMeter from './StrandMeter'

export interface KpiCellItem {
  id?: string
  /** Upper label (e.g. "MRR", "ACTIVE MEMBERS") */
  label: string
  /** Primary metric value (formatted with tabular figures, e.g. "₹18.4L", "679") */
  value: string | number
  /** Unit beneath value in label font (e.g. "MEMBERS", "INR MTD") */
  unit?: string
  /** Optional hover title for precise uncompacted figure (e.g. "₹18,40,000") */
  hoverTitle?: string
  /** Strand meter config */
  strand?: {
    value: number
    max?: number
    capsules?: 5 | 7
  }
  /** Optional text delta/helper (e.g. "+14% MTD", "Next 7 days") */
  delta?: {
    text: string
    type?: 'ok' | 'warn' | 'danger' | 'neutral'
  }
}

export interface KpiPanelProps {
  cells: KpiCellItem[]
  className?: string
}

/**
 * KpiPanel — DNA 360 Unified KPI Strip
 * 
 * Replaces disconnected floating card grids with a single bordered panel
 * divided by hairline separators. Maximum 4 cells per row.
 */
export function KpiPanel({ cells, className }: KpiPanelProps) {
  // Cap cells at 4 per row per design system spec
  const displayCells = cells.slice(0, 4)

  return (
    <div
      className={cn(
        'w-full bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-md)]',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.045)]',
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[var(--line)]',
        className
      )}
    >
      {displayCells.map((cell, idx) => {
        const deltaColor = {
          ok: 'text-[var(--ok)]',
          warn: 'text-[var(--warn)]',
          danger: 'text-[var(--danger)]',
          neutral: 'text-[var(--text-faint)]',
        }[cell.delta?.type || 'neutral']

        return (
          <div
            key={cell.id || idx}
            className="p-4 sm:p-5 flex flex-col justify-between min-h-[105px] select-none"
            title={cell.hoverTitle}
          >
            {/* Label */}
            <div className="font-ui text-[11px] uppercase tracking-[0.06em] font-semibold text-[var(--text-muted)] truncate">
              {cell.label}
            </div>

            {/* Metric Value & Unit */}
            <div className="my-1">
              <div className="font-data text-[26px] leading-[28px] font-medium tracking-[-0.01em] text-[var(--text)] tabular-nums whitespace-nowrap overflow-hidden text-ellipsis">
                {cell.value}
              </div>
              {cell.unit && (
                <div className="font-ui text-[10px] uppercase tracking-wider text-[var(--text-faint)] mt-0.5">
                  {cell.unit}
                </div>
              )}
            </div>

            {/* Bottom Row: Strand Meter or Delta */}
            <div className="flex items-center justify-between gap-2 mt-auto pt-1 min-h-[16px]">
              {cell.strand ? (
                <StrandMeter
                  value={cell.strand.value}
                  max={cell.strand.max || 100}
                  capsules={cell.strand.capsules || 5}
                  size="sm"
                />
              ) : (
                <div />
              )}

              {cell.delta && (
                <span className={cn('font-data text-[12px] tabular-nums font-medium', deltaColor)}>
                  {cell.delta.text}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default KpiPanel
