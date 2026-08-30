'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, icon, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="font-data text-[10.5px] uppercase tracking-[0.16em] font-medium text-[var(--muted)] select-none"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-2)] pointer-events-none flex items-center">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full h-[38px] px-3.5 font-ui text-[13.5px] rounded-[var(--r-sm)]',
              'bg-[var(--bg-elev)] border border-[var(--line)] text-[var(--ink)] placeholder:text-[var(--muted-2)]',
              'transition-all duration-140 outline-none',
              'focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              icon && 'pl-9',
              error && 'border-[var(--accent)] focus:ring-[var(--accent-soft)]',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
        </div>
        {error && (
          <p id={`${inputId}-error`} className="font-ui text-[12px] text-[var(--accent)] mt-0.5" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="font-ui text-[12px] text-[var(--muted)] mt-0.5">
            {hint}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
export default Input
