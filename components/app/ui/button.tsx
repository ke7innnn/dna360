'use client'

import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 font-ui font-medium',
    'rounded-[var(--r-md)] transition-all duration-140 select-none cursor-pointer',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--teal)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg)]',
    'disabled:pointer-events-none disabled:opacity-40',
    'active:scale-[0.98]',
  ].join(' '),
  {
    variants: {
      variant: {
        primary: [
          'bg-gradient-to-b from-[#1BA79C] to-[#2AA8E2]',
          'text-white font-semibold',
          'hover:brightness-105',
          'border border-transparent',
        ].join(' '),
        secondary: [
          'bg-transparent',
          'border border-[var(--line-strong)]',
          'text-[var(--text)]',
          'hover:bg-[var(--surface-raised)] hover:border-[var(--text-faint)]',
        ].join(' '),
        ghost: [
          'bg-transparent',
          'border border-transparent',
          'text-[var(--text-muted)]',
          'hover:bg-[var(--surface-raised)] hover:text-[var(--text)]',
        ].join(' '),
        danger: [
          'bg-[var(--danger-dim)]',
          'border border-transparent',
          'text-[var(--danger)] font-medium',
          'hover:bg-[rgba(222,90,82,0.20)]',
        ].join(' '),
        outline: [
          'bg-transparent',
          'border border-[var(--line-strong)]',
          'text-[var(--text)]',
          'hover:bg-[var(--surface-raised)]',
        ].join(' '),
      },
      size: {
        sm: 'h-[30px] px-2.5 text-xs',
        md: 'h-[34px] px-3.5 text-xs',
        lg: 'h-[40px] px-5 text-sm',
        icon: 'h-[34px] w-[34px] p-0 shrink-0',
      },
    },
    defaultVariants: {
      variant: 'secondary',
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
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {!loading && icon}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button, buttonVariants }
export default Button
