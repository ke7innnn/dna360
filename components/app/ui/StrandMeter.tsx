'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface StrandMeterProps {
  /** Current value (e.g. sessions used/remaining, streak, occupancy %) */
  value: number
  /** Maximum possible value (defaults to 100) */
  max?: number
  /** Number of capsules in the strand (5 or 7, default: 5) */
  capsules?: 5 | 7
  /** Visual size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Optional inline label/numeric text */
  label?: string
  /** Show tabular numeric readout */
  showValue?: boolean
  /** Format function for value */
  formatValue?: (val: number, max: number) => string
  /** Custom class */
  className?: string
  /** Reverse fill direction (e.g., for remaining balance vs consumed) */
  variant?: 'fill' | 'remaining'
}

/**
 * StrandMeter — Signature visual element of DNA 360.
 * 
 * Replaces generic progress bars across the app with vertical capsule strands
 * derived from the DNA 360 brand mark.
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

  // Number of active filled capsules
  const filledCount = Math.round(percentage * capsules)

  // Height curves for the capsules (echoing DNA 360 strand mark)
  const heightProfiles: Record<5 | 7, number[]> = {
    5: [0.45, 0.75, 1.0, 0.75, 0.45],
    7: [0.35, 0.55, 0.80, 1.0, 0.80, 0.55, 0.35],
  }

  const profile = heightProfiles[capsules]

  // Size dimensions
  const sizeStyles = {
    sm: { height: 14, width: 2.5, gap: 2 },
    md: { height: 28, width: 4, gap: 3 },
    lg: { height: 48, width: 6, gap: 4 },
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
                  ? 'bg-gradient-to-b from-[#1BA79C] to-[#2AA8E2]'
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
        <div className="flex items-baseline gap-1.5 font-data text-xs tabular-nums text-[var(--text)]">
          {showValue && (
            <span className={cn('font-medium', size === 'lg' ? 'text-sm' : 'text-xs')}>
              {formatValue ? formatValue(safeValue, safeMax) : `${safeValue}/${safeMax}`}
            </span>
          )}
          {label && (
            <span className="font-ui text-[11px] uppercase tracking-wider text-[var(--text-faint)]">
              {label}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default StrandMeter
