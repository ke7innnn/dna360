'use client'

import React, { useState } from 'react'
import { DayPicker } from 'react-day-picker'
import * as Popover from '@radix-ui/react-popover'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  label?: string
  placeholder?: string
  error?: string
  disabled?: boolean
  className?: string
}

export function DatePicker({
  value,
  onChange,
  label,
  placeholder = 'Pick a date',
  error,
  disabled,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <span className="text-sm font-medium text-[var(--app-text-secondary)]">{label}</span>
      )}
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            disabled={disabled}
            className={cn(
              'flex items-center gap-2 h-10 px-3 w-full text-sm text-left',
              'glass-input',
              'focus:outline-none focus:ring-2 focus:ring-[var(--app-focus-ring)]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-all duration-150',
              !value && 'text-[var(--app-text-muted)]',
              value && 'text-[var(--app-text-primary)]',
              error && 'ring-2 ring-[var(--app-danger)]',
              className
            )}
          >
            <CalendarIcon className="w-4 h-4 text-[var(--app-text-muted)] shrink-0" />
            {value ? format(value, 'dd MMM yyyy') : placeholder}
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            className="z-50 glass-card p-3 mt-2"
            align="start"
            sideOffset={4}
          >
            <DayPicker
              mode="single"
              selected={value}
              onSelect={(day) => {
                onChange?.(day)
                setOpen(false)
              }}
              showOutsideDays
              classNames={{
                months: 'flex flex-col',
                month: 'space-y-3',
                month_caption: 'flex justify-between items-center px-1',
                caption_label: 'text-sm font-semibold text-[var(--app-text-primary)]',
                nav: 'flex items-center gap-1',
                button_previous: cn(
                  'h-7 w-7 inline-flex items-center justify-center rounded-lg',
                  'text-[var(--app-text-muted)] hover:text-[var(--app-text-primary)]',
                  'hover:bg-[var(--app-glass-bg)] transition-colors'
                ),
                button_next: cn(
                  'h-7 w-7 inline-flex items-center justify-center rounded-lg',
                  'text-[var(--app-text-muted)] hover:text-[var(--app-text-primary)]',
                  'hover:bg-[var(--app-glass-bg)] transition-colors'
                ),
                month_grid: 'w-full border-collapse',
                weekdays: 'flex',
                weekday: 'w-9 text-center text-[0.6875rem] font-medium text-[var(--app-text-muted)] uppercase',
                week: 'flex w-full mt-0.5',
                day: 'relative p-0 text-center',
                day_button: cn(
                  'h-9 w-9 inline-flex items-center justify-center rounded-lg text-sm',
                  'text-[var(--app-text-secondary)] hover:bg-[var(--app-sidebar-active)]',
                  'hover:text-[var(--app-text-primary)] transition-colors',
                  'focus-visible:outline-2 focus-visible:outline-[var(--app-focus-ring)]'
                ),
                selected: 'bg-[var(--aurora-1)] text-white hover:bg-[var(--aurora-1)] font-semibold rounded-lg',
                today: 'font-bold text-[var(--aurora-1)]',
                outside: 'text-[var(--app-text-muted)] opacity-50',
                disabled: 'text-[var(--app-text-muted)] opacity-30',
              }}
            />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      {error && (
        <p className="text-xs text-[var(--app-danger)]" role="alert">{error}</p>
      )}
    </div>
  )
}
