'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface StrandMeterProps {
  value: number
  max?: number
  capsules?: number
  size?: 'sm' | 'md' | 'lg'
  label?: string
  color?: string
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
  color = 'accent',
  showValue = false,
  formatValue,
  className,
}: StrandMeterProps) {
  const safeMax = max > 0 ? max : 1
  const safeValue = Math.max(0, Math.min(value, safeMax))
  const percentage = safeValue / safeMax

  const count = Math.max(3, capsules)
  const filledCount = Math.round(percentage * count)

  // Symmetric height profile for any capsule count
  const profile = Array.from({ length: count }, (_, i) => {
    const mid = (count - 1) / 2
    const dist = Math.abs(i - mid) / (mid || 1)
    return Math.max(0.35, 1 - dist * 0.55)
  })

  const sizeStyles = {
    sm: { height: 14, width: 2.5, gap: 2 },
    md: { height: 26, width: 3.5, gap: 3 },
    lg: { height: 44, width: 5.5, gap: 4 },
  }[size] || { height: 26, width: 3.5, gap: 3 }

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
                'rounded-full transition-all duration-300',
                isFilled
                  ? 'bg-gradient-to-t from-[#1D4ED8] to-[#3B82F6] shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                  : 'bg-[var(--surface-2)] border border-[rgba(255,255,255,0.06)]'
              )}
              style={{
                width: `${sizeStyles.width}px`,
                height: `${capsuleH}px`,
              }}
            />
          )
        })}
      </div>

      {/* Optional Label or Formatted Value */}
      {(label || showValue) && (
        <span className="font-data text-[11px] tabular-nums font-semibold text-[var(--muted)]">
          {label || (formatValue ? formatValue(safeValue, safeMax) : `${Math.round(percentage * 100)}%`)}
        </span>
      )}
    </div>
  )
}

export default StrandMeter
