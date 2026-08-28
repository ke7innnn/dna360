'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatCardProps {
  label: string
  value: number | string
  prefix?: string
  suffix?: string
  decimals?: number
  trend?: { value: number; label?: string }
  change?: { value: number; type?: 'increase' | 'decrease' | 'neutral' }
  icon?: React.ReactNode
  className?: string
  formatValue?: (value: number) => string
}

/**
 * Count-up animation — only on first mount, never on re-render.
 */
function useCountUp(end: number, duration = 1200, decimals = 0, shouldAnimate = true) {
  const [current, setCurrent] = useState(shouldAnimate ? 0 : end)
  const hasAnimated = useRef(false)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!shouldAnimate || hasAnimated.current || !inView) {
      setCurrent(end)
      return
    }

    hasAnimated.current = true
    const startTime = performance.now()
    const startValue = 0

    function animate(time: number) {
      const elapsed = time - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const value = startValue + (end - startValue) * eased

      setCurrent(Number(value.toFixed(decimals)))

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [end, duration, decimals, shouldAnimate, inView])

  return { current, ref }
}

export default function StatCard({
  label,
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  trend,
  change,
  icon,
  className,
  formatValue,
}: StatCardProps) {
  const prefersReducedMotion = useReducedMotion()
  const isNumeric = typeof value === 'number'
  const { current, ref } = useCountUp(isNumeric ? value : 0, 1200, decimals, !prefersReducedMotion && isNumeric)

  const displayValue = !isNumeric
    ? value
    : formatValue
    ? formatValue(current)
    : current.toLocaleString('en-IN')

  const effectiveTrend = trend || (change ? { value: change.value, label: change.type } : undefined)

  const trendDirection = effectiveTrend
    ? change?.type === 'increase'
      ? 'up'
      : change?.type === 'decrease'
      ? 'down'
      : effectiveTrend.value > 0
      ? 'up'
      : effectiveTrend.value < 0
      ? 'down'
      : 'neutral'
    : null

  const TrendIcon = trendDirection === 'up' ? TrendingUp : trendDirection === 'down' ? TrendingDown : Minus

  return (
    <motion.div
      className={cn('glass-card p-5 flex flex-col gap-3', className)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-start justify-between">
        <p className="text-sm text-[var(--app-text-secondary)] font-medium">{label}</p>
        {icon && (
          <div className="w-9 h-9 rounded-xl bg-[var(--app-glass-bg)] border border-[var(--app-glass-border)] flex items-center justify-center text-[var(--app-text-muted)]">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-end gap-2">
        <span
          ref={ref}
          className="font-display text-[1.75rem] font-semibold text-[var(--app-text-primary)] leading-none tabular-nums tracking-tight"
        >
          {prefix}{displayValue}{suffix}
        </span>

        {trend && trendDirection && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium tabular-nums',
              trendDirection === 'up' && 'text-[var(--app-success)] bg-[var(--app-success)]/10',
              trendDirection === 'down' && 'text-[var(--app-danger)] bg-[var(--app-danger)]/10',
              trendDirection === 'neutral' && 'text-[var(--app-text-muted)] bg-[var(--app-glass-bg)]',
            )}
          >
            <TrendIcon className="w-3 h-3" />
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>

      {trend?.label && (
        <p className="text-xs text-[var(--app-text-muted)]">{trend.label}</p>
      )}
    </motion.div>
  )
}
