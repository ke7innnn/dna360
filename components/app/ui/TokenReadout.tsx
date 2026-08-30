'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

export interface TokenReadoutProps {
  initialTtlSeconds?: number
  className?: string
  label?: string
}

/**
 * TokenReadout (Signature Primitive — §5)
 *
 * Martian Mono digits + animated countdown sweep ring.
 * Value generated client-side for authenticated user only; never server-rendered.
 * Rotates on TTL expiration.
 */
export function TokenReadout({
  initialTtlSeconds = 30,
  className,
  label = 'GATE ACCESS TOKEN',
}: TokenReadoutProps) {
  const [secondsLeft, setSecondsLeft] = useState(28)
  const [tokenCode, setTokenCode] = useState('3496 3886')
  const [isClient, setIsClient] = useState(false)

  // Generate random 8-digit token (XXXX XXXX) on client
  const generateNewToken = () => {
    const part1 = Math.floor(1000 + Math.random() * 9000)
    const part2 = Math.floor(1000 + Math.random() * 9000)
    return `${part1} ${part2}`
  }

  useEffect(() => {
    setIsClient(true)
    setTokenCode(generateNewToken())

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setTokenCode(generateNewToken())
          return initialTtlSeconds
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [initialTtlSeconds])

  const circumference = 2 * Math.PI * 18
  const progress = (secondsLeft / initialTtlSeconds) * circumference

  if (!isClient) {
    return (
      <div className={cn('flex items-center gap-3 select-none', className)}>
        <div className="w-11 h-11 rounded-full bg-[var(--surface-2)] animate-pulse" />
        <div className="space-y-1">
          <div className="h-3 w-24 bg-[var(--surface-2)] rounded" />
          <div className="h-6 w-32 bg-[var(--surface-2)] rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-3.5 select-none', className)}>
      {/* Circular Animated SVG Sweep Ring */}
      <div className="relative w-[46px] h-[46px] flex items-center justify-center shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 44 44">
          {/* Background circle */}
          <circle
            cx="22"
            cy="22"
            r="18"
            className="stroke-[rgba(255,255,255,0.08)] fill-transparent"
            strokeWidth="3"
          />
          {/* Active sweeping ring */}
          <circle
            cx="22"
            cy="22"
            r="18"
            className="stroke-[var(--accent)] fill-transparent transition-all duration-1000 ease-linear"
            strokeWidth="3.2"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            style={{
              filter: 'drop-shadow(0 0 6px rgba(244, 63, 94, 0.6))',
            }}
          />
        </svg>
        {/* Seconds remaining in center */}
        <span className="absolute font-data text-xs font-bold text-[var(--ink)] tabular-nums">
          {secondsLeft}
        </span>
      </div>

      {/* Token details */}
      <div>
        <span className="font-data text-[10.5px] uppercase tracking-[0.16em] font-medium text-[var(--muted)] block">
          {label}
        </span>
        <span className="font-data text-xl sm:text-2xl font-bold tracking-[0.08em] text-[var(--ink)] tabular-nums mt-0.5 block">
          {tokenCode}
        </span>
      </div>
    </div>
  )
}

export default TokenReadout
