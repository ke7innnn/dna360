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
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="font-ui text-[11px] uppercase tracking-[0.06em] font-semibold text-[var(--text-muted)] select-none"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)] pointer-events-none flex items-center">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full h-[36px] px-3 font-ui text-[13.5px] rounded-[var(--r-sm)]',
              'bg-[var(--surface-sunken)] border border-[var(--line)] text-[var(--text)] placeholder:text-[var(--text-faint)]',
              'transition-all duration-140 outline-none',
              'focus:border-[var(--line-strong)] focus:ring-[3px] focus:ring-[var(--teal-dim)]',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              icon && 'pl-9',
              error && 'border-[var(--danger)] focus:ring-[var(--danger-dim)] focus:border-[var(--danger)]',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
        </div>
        {error && (
          <p id={`${inputId}-error`} className="font-ui text-[12px] text-[var(--danger)] mt-0.5" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="font-ui text-[12px] text-[var(--text-faint)] mt-0.5">
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
