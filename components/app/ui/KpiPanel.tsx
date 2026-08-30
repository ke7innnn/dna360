'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import StrandMeter from './StrandMeter'

export interface KpiCellItem {
  id?: string
  label: string
  value: string | number
  unit?: string
  hoverTitle?: string
  strand?: {
    value: number
    max?: number
    capsules?: 5 | 7
  }
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
 * KpiPanel — Aurora Dark-Luxe Unified KPI Strip
 * Clean, minimal typography with modern tabular figures.
 */
export function KpiPanel({ cells, className }: KpiPanelProps) {
  const displayCells = cells.slice(0, 4)

  return (
    <div
      className={cn(
        'w-full bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-xl)]',
        'shadow-card backdrop-blur-[4px]',
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[var(--line)]',
        className
      )}
    >
      {displayCells.map((cell, idx) => {
        const deltaColor = {
          ok: 'text-[var(--green)]',
          warn: 'text-[var(--amber)]',
          danger: 'text-[var(--accent)]',
          neutral: 'text-[var(--muted)]',
        }[cell.delta?.type || 'neutral']

        return (
          <div
            key={cell.id || idx}
            className="p-5 flex flex-col justify-between min-h-[115px] select-none group hover:bg-[var(--surface-2)] transition-colors duration-140"
            title={cell.hoverTitle}
          >
            {/* Label */}
            <div className="font-ui text-[11px] uppercase tracking-[0.12em] font-semibold text-[var(--muted)] truncate">
              {cell.label}
            </div>

            {/* Metric Value & Unit */}
            <div className="my-1.5">
              <div className="font-display text-[28px] sm:text-[32px] leading-tight font-semibold tracking-tight text-[var(--ink)] tabular-nums whitespace-nowrap overflow-hidden text-ellipsis">
                {cell.value}
              </div>
              {cell.unit && (
                <div className="font-ui text-[10.5px] uppercase tracking-[0.10em] text-[var(--muted)] mt-0.5 font-medium">
                  {cell.unit}
                </div>
              )}
            </div>

            {/* Bottom Row: Strand Meter or Delta */}
            <div className="flex items-center justify-between gap-2 mt-auto pt-1.5 min-h-[18px]">
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
                <span className={cn('font-ui text-[11px] tabular-nums font-semibold tracking-normal', deltaColor)}>
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
