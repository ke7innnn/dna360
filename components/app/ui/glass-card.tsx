'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { cardHover, DURATIONS, EASE_OUT } from '@/lib/motion'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  header?: React.ReactNode
  footer?: React.ReactNode
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  as?: 'div' | 'article' | 'section'
}

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
}

export default function GlassCard({
  children,
  className,
  header,
  footer,
  hover = false,
  padding = 'md',
  as = 'div',
}: GlassCardProps) {
  const Wrapper = hover ? motion.div : (as as unknown as React.ElementType)
  const wrapperProps = hover
    ? {
        initial: 'rest',
        whileHover: 'hover',
        variants: cardHover,
        style: { willChange: 'transform' },
      }
    : {}

  return (
    <Wrapper
      className={cn(
        'glass-card overflow-hidden',
        hover && 'cursor-pointer hover:border-[var(--app-glass-hover-border)]',
        'transition-[border-color] duration-150',
        className
      )}
      {...wrapperProps}
    >
      {header && (
        <div className="px-5 py-4 border-b border-[var(--app-glass-border)]">
          {header}
        </div>
      )}
      <div className={paddingMap[padding]}>
        {children}
      </div>
      {footer && (
        <div className="px-5 py-4 border-t border-[var(--app-glass-border)]">
          {footer}
        </div>
      )}
    </Wrapper>
  )
}
