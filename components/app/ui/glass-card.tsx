'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface CardProps {
  children: React.ReactNode
  className?: string
  header?: React.ReactNode
  footer?: React.ReactNode
  hover?: boolean
  floating?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  as?: 'div' | 'article' | 'section'
  onClick?: () => void
}

const paddingMap = {
  none: '',
  sm: 'p-3.5',
  md: 'p-5',
  lg: 'p-6',
}

/**
 * Card / GlassCard — DNA 360 Design System
 * 
 * Rules: Elevation from light, not drop shadows. Solid --surface fill by default
 * with top inner highlight. Glass translucency reserved for floating surfaces.
 */
export function GlassCard({
  children,
  className,
  header,
  footer,
  hover = false,
  floating = false,
  padding = 'md',
  as: Component = 'div',
  onClick,
}: CardProps) {
  return (
    <Component
      onClick={onClick}
      className={cn(
        floating ? 'glass' : 'card',
        'overflow-hidden',
        hover && 'cursor-pointer',
        className
      )}
    >
      {header && (
        <div className="px-5 py-3.5 border-b border-[var(--line)] bg-[var(--surface-sunken)]/50">
          {header}
        </div>
      )}
      <div className={paddingMap[padding]}>
        {children}
      </div>
      {footer && (
        <div className="px-5 py-3 border-t border-[var(--line)] bg-[var(--surface-sunken)]/50">
          {footer}
        </div>
      )}
    </Component>
  )
}

export default GlassCard
