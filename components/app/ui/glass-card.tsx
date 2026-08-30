'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'feature' | 'elevated' | 'sunken'
  padding?: 'none' | 'sm' | 'md' | 'lg' | string
}

export function Card({
  children,
  className,
  variant = 'default',
  padding,
  ...props
}: CardProps) {
  const paddingClass = padding === 'none' ? 'p-0' : padding === 'sm' ? 'p-3' : padding === 'md' ? 'p-4 sm:p-5' : padding === 'lg' ? 'p-6 sm:p-8' : ''
  return (
    <div
      className={cn(
        'rounded-[var(--r-xl)] transition-all duration-160',
        variant === 'default' && [
          'bg-[var(--surface)]',
          'border border-[var(--line)]',
          'shadow-[0_20px_40px_-30px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.03)]',
          'backdrop-blur-[4px]',
          'hover:border-[rgba(59,130,246,0.25)]',
        ],
        variant === 'feature' && [
          'card-feature',
          'hover:border-[rgba(59,130,246,0.35)]',
        ],
        variant === 'elevated' && [
          'bg-[var(--bg-elev)]',
          'border border-[var(--line)]',
          'shadow-[0_24px_48px_-24px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.04)]',
        ],
        variant === 'sunken' && [
          'bg-[rgba(0,0,0,0.35)]',
          'border border-[var(--line-soft)]',
        ],
        paddingClass,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/** Alias for legacy GlassCard compatibility */
export function GlassCard(props: CardProps) {
  return <Card {...props} />
}

export default Card
