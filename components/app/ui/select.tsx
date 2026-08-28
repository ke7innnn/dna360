'use client'

import React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Root ───
const Select = SelectPrimitive.Root

// ─── Trigger ───
const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & { label?: string; error?: string }
>(({ className, children, label, error, ...props }, ref) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <span className="text-sm font-medium text-[var(--app-text-secondary)]">{label}</span>
    )}
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        'flex h-10 w-full items-center justify-between px-3 text-sm',
        'glass-input text-[var(--app-text-primary)]',
        'focus:outline-none focus:ring-2 focus:ring-[var(--app-focus-ring)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'transition-all duration-150',
        'placeholder:text-[var(--app-text-muted)]',
        error && 'ring-2 ring-[var(--app-danger)]',
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="w-4 h-4 text-[var(--app-text-muted)]" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
    {error && (
      <p className="text-xs text-[var(--app-danger)]" role="alert">{error}</p>
    )}
  </div>
))
SelectTrigger.displayName = 'SelectTrigger'

// ─── Content ───
const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        'relative z-50 max-h-60 min-w-[8rem] overflow-hidden',
        'glass-card py-1',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        position === 'popper' && 'translate-y-1',
        className
      )}
      position={position}
      {...props}
    >
      <SelectPrimitive.Viewport
        className={cn(
          'p-1',
          position === 'popper' && 'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]'
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = 'SelectContent'

// ─── Item ───
const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 pl-8 pr-2 text-sm',
      'text-[var(--app-text-secondary)] outline-none',
      'focus:bg-[var(--app-sidebar-active)] focus:text-[var(--app-text-primary)]',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="w-4 h-4 text-[var(--aurora-1)]" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = 'SelectItem'

const SelectValue = SelectPrimitive.Value
const SelectGroup = SelectPrimitive.Group
const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn('px-2 py-1.5 text-xs font-semibold text-[var(--app-text-muted)] uppercase tracking-wider', className)}
    {...props}
  />
))
SelectLabel.displayName = 'SelectLabel'

export { Select, SelectTrigger, SelectContent, SelectItem, SelectValue, SelectGroup, SelectLabel }
