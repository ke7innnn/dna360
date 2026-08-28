'use client'

import React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Root ───
const Select = SelectPrimitive.Root
const SelectGroup = SelectPrimitive.Group
const SelectValue = SelectPrimitive.Value

// ─── Trigger ───
const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & { label?: string; error?: string }
>(({ className, children, label, error, ...props }, ref) => (
  <div className="flex flex-col gap-1">
    {label && (
      <span className="font-ui text-[11px] uppercase tracking-[0.06em] font-semibold text-[var(--text-muted)] select-none">
        {label}
      </span>
    )}
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        'flex h-[36px] w-full items-center justify-between px-3 font-ui text-[13.5px] rounded-[var(--r-sm)]',
        'bg-[var(--surface-sunken)] border border-[var(--line)] text-[var(--text)]',
        'transition-all duration-140 outline-none',
        'focus:border-[var(--line-strong)] focus:ring-[3px] focus:ring-[var(--teal-dim)]',
        'disabled:cursor-not-allowed disabled:opacity-40',
        'placeholder:text-[var(--text-faint)]',
        error && 'border-[var(--danger)] focus:ring-[var(--danger-dim)]',
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="w-3.5 h-3.5 text-[var(--text-faint)] shrink-0" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
    {error && (
      <p className="font-ui text-[12px] text-[var(--danger)] mt-0.5" role="alert">{error}</p>
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
        'bg-[var(--surface-raised)] border border-[var(--line-strong)] rounded-[var(--r-md)] shadow-xl py-1',
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
      'relative flex w-full cursor-pointer select-none items-center rounded-[var(--r-sm)] py-2 pl-7 pr-2 font-ui text-[13px]',
      'text-[var(--text-muted)] outline-none transition-colors duration-140',
      'focus:bg-[var(--surface-sunken)] focus:text-[var(--text)]',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="w-3.5 h-3.5 text-[var(--teal)]" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = 'SelectItem'

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
}
