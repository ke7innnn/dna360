'use client'

import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 text-sm font-medium',
    'rounded-xl transition-all duration-150',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--app-focus-ring)]',
    'disabled:pointer-events-none disabled:opacity-50',
    'active:scale-[0.98]',
  ].join(' '),
  {
    variants: {
      variant: {
        primary: [
          'bg-gradient-to-r from-[var(--aurora-1)] to-[var(--aurora-2)]',
          'text-white font-semibold',
          'hover:brightness-110',
          'shadow-lg shadow-[var(--aurora-1)]/20',
        ].join(' '),
        secondary: [
          'glass-input',
          'text-[var(--app-text-primary)]',
          'hover:border-[var(--app-glass-hover-border)] hover:bg-[rgba(255,255,255,0.06)]',
        ].join(' '),
        ghost: [
          'text-[var(--app-text-secondary)]',
          'hover:bg-[var(--app-glass-bg)] hover:text-[var(--app-text-primary)]',
        ].join(' '),
        danger: [
          'bg-[var(--app-danger)] text-white font-semibold',
          'hover:brightness-110',
          'shadow-lg shadow-[var(--app-danger)]/20',
        ].join(' '),
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
  icon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, icon, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {!loading && icon}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button, buttonVariants }
