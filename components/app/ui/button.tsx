'use client'

import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 font-ui font-semibold',
    'rounded-[var(--r-sm)] transition-all duration-140 select-none cursor-pointer',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg)]',
    'disabled:pointer-events-none disabled:opacity-40',
    'active:translate-y-[1px]',
  ].join(' '),
  {
    variants: {
      variant: {
        primary: [
          'bg-gradient-to-r from-[#3B82F6] to-[#1D4ED8]',
          'text-white font-semibold',
          'shadow-[0_8px_24px_-8px_rgba(59,130,246,0.7)]',
          'hover:brightness-110 hover:shadow-[0_10px_28px_-6px_rgba(59,130,246,0.85)]',
          'border border-transparent',
        ].join(' '),
        secondary: [
          'bg-[var(--surface)]',
          'border border-[var(--line)]',
          'text-[var(--ink)] font-medium',
          'hover:bg-[var(--surface-2)] hover:border-[rgba(255,255,255,0.15)] hover:text-white',
          'shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]',
        ].join(' '),
        ghost: [
          'bg-transparent',
          'border border-transparent',
          'text-[var(--ink-2)] font-medium',
          'hover:bg-[var(--surface-2)] hover:text-[var(--ink)]',
        ].join(' '),
        danger: [
          'bg-[rgba(239,68,68,0.12)]',
          'border border-[rgba(239,68,68,0.30)]',
          'text-[#EF4444] font-medium',
          'hover:bg-[rgba(239,68,68,0.22)]',
        ].join(' '),
        outline: [
          'bg-transparent',
          'border border-[var(--line)]',
          'text-[var(--ink)] font-medium',
          'hover:bg-[var(--surface-2)] hover:border-[rgba(255,255,255,0.15)]',
        ].join(' '),
      },
      size: {
        sm: 'h-[32px] px-3 text-[12.5px]',
        md: 'h-[36px] px-4 text-[13.5px]',
        lg: 'h-[42px] px-5 text-[14.5px]',
        icon: 'h-[36px] w-[36px] p-0 shrink-0',
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
