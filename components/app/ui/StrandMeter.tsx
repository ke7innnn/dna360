'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface StrandMeterProps {
  value: number
  max?: number
  capsules?: 5 | 7
  size?: 'sm' | 'md' | 'lg'
  label?: string
  showValue?: boolean
  formatValue?: (val: number, max: number) => string
  className?: string
  variant?: 'fill' | 'remaining'
}

/**
 * StrandMeter — Signature visual element of DNA 360 Aurora Dark-Luxe.
 */
export function StrandMeter({
  value,
  max = 100,
  capsules = 5,
  size = 'md',
  label,
  showValue = false,
  formatValue,
  className,
}: StrandMeterProps) {
  const safeMax = max > 0 ? max : 1
  const safeValue = Math.max(0, Math.min(value, safeMax))
  const percentage = safeValue / safeMax

  const filledCount = Math.round(percentage * capsules)

  const heightProfiles: Record<5 | 7, number[]> = {
    5: [0.45, 0.75, 1.0, 0.75, 0.45],
    7: [0.35, 0.55, 0.80, 1.0, 0.80, 0.55, 0.35],
  }

  const profile = heightProfiles[capsules]

  const sizeStyles = {
    sm: { height: 14, width: 2.5, gap: 2 },
    md: { height: 26, width: 3.5, gap: 3 },
    lg: { height: 44, width: 5.5, gap: 4 },
  }[size]

  return (
    <div className={cn('inline-flex items-center gap-2 select-none', className)}>
      {/* Capsules Container */}
      <div
        className="flex items-center justify-center shrink-0"
        style={{
          height: `${sizeStyles.height}px`,
          gap: `${sizeStyles.gap}px`,
        }}
        aria-label={`Progress: ${Math.round(percentage * 100)}%`}
        role="progressbar"
        aria-valuenow={safeValue}
        aria-valuemin={0}
        aria-valuemax={safeMax}
      >
        {profile.map((relHeight, idx) => {
          const isFilled = idx < filledCount
          const capsuleH = Math.max(4, Math.round(relHeight * sizeStyles.height))

          return (
            <div
              key={idx}
              className={cn(
                'rounded-full transition-all duration-140',
                isFilled
                  ? 'bg-gradient-to-b from-[#F43F5E] to-[#E11D48] shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                  : 'bg-[var(--line)]'
              )}
              style={{
                width: `${sizeStyles.width}px`,
                height: `${capsuleH}px`,
              }}
            />
          )
        })}
      </div>

      {/* Optional Value or Label */}
      {(showValue || label) && (
        <div className="flex items-baseline gap-1.5 font-data text-xs tabular-nums text-[var(--ink)]">
          {showValue && (
            <span className={cn('font-semibold', size === 'lg' ? 'text-sm' : 'text-xs')}>
              {formatValue ? formatValue(safeValue, safeMax) : `${safeValue}/${safeMax}`}
            </span>
          )}
          {label && (
            <span className="font-data text-[10.5px] uppercase tracking-[0.16em] text-[var(--muted)]">
              {label}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default StrandMeter
