'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import StrandMeter from './StrandMeter'

export interface StatCardProps {
  label: string
  value: number | string
  prefix?: string
  suffix?: string
  decimals?: number
  trend?: { value: number; label?: string }
  change?: { value: number; type?: 'increase' | 'decrease' | 'neutral' }
  icon?: React.ReactNode
  strandValue?: number
  strandMax?: number
  className?: string
  formatValue?: (value: number) => string
}

export function StatCard({
  label,
  value,
  prefix = '',
  suffix = '',
  trend,
  change,
  icon,
  strandValue,
  strandMax = 100,
  className,
  formatValue,
}: StatCardProps) {
  const isNumeric = typeof value === 'number'
  const displayValue = !isNumeric
    ? value
    : formatValue
    ? formatValue(value)
    : value.toLocaleString('en-IN')

  const effectiveTrend = trend || (change ? { value: change.value, label: change.type } : undefined)
  const isPositive = effectiveTrend && effectiveTrend.value > 0
  const isNegative = effectiveTrend && effectiveTrend.value < 0

  return (
    <div
      className={cn(
        'card p-4 flex flex-col justify-between select-none min-h-[96px]',
        className
      )}
    >
      {/* Label and Icon */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-ui text-[11px] uppercase tracking-[0.06em] font-semibold text-[var(--text-muted)] truncate">
          {label}
        </span>
        {icon && (
          <span className="text-[var(--text-faint)] shrink-0">
            {icon}
          </span>
        )}
      </div>

      {/* Main Metric */}
      <div className="my-1">
        <div className="font-data text-[26px] leading-[28px] font-medium tracking-[-0.01em] text-[var(--text)] tabular-nums whitespace-nowrap overflow-hidden text-ellipsis">
          {prefix}{displayValue}
        </div>
        {suffix && (
          <div className="font-ui text-[10px] uppercase tracking-wider text-[var(--text-faint)] mt-0.5">
            {suffix}
          </div>
        )}
      </div>

      {/* Bottom Strand or Trend */}
      <div className="flex items-center justify-between gap-2 mt-auto pt-1 min-h-[16px]">
        {typeof strandValue === 'number' ? (
          <StrandMeter value={strandValue} max={strandMax} size="sm" />
        ) : (
          <div />
        )}

        {effectiveTrend && (
          <div
            className={cn(
              'inline-flex items-center gap-1 font-data text-xs tabular-nums font-medium',
              isPositive ? 'text-[var(--ok)]' : isNegative ? 'text-[var(--danger)]' : 'text-[var(--text-faint)]'
            )}
          >
            {isPositive ? <TrendingUp className="w-3 h-3" /> : isNegative ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            <span>{isPositive ? `+${effectiveTrend.value}%` : `${effectiveTrend.value}%`}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default StatCard
