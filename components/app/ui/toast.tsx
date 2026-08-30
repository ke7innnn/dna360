'use client'

import { Toaster as SonnerToaster, toast } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: [
            'flex items-start gap-3 p-4 rounded-[var(--r-md)] w-[360px]',
            'bg-[var(--bg-elev)] border border-[var(--line)] shadow-card backdrop-blur-[6px]',
            'text-sm font-ui font-medium text-[var(--ink)]',
          ].join(' '),
          title: 'font-ui text-sm font-semibold text-[var(--ink)]',
          description: 'font-ui text-xs text-[var(--muted)] mt-0.5',
          actionButton: [
            'px-3 py-1.5 rounded-[var(--r-sm)] text-xs font-semibold',
            'bg-gradient-to-r from-[#3B82F6] to-[#1D4ED8] text-white shadow-glow-sm',
            'hover:brightness-110 transition-all',
          ].join(' '),
          cancelButton: [
            'px-3 py-1.5 rounded-[var(--r-sm)] text-xs font-medium',
            'bg-[var(--surface-2)] border border-[var(--line)] text-[var(--ink-2)]',
            'hover:text-[var(--ink)] transition-all',
          ].join(' '),
          success: 'border-l-[3px] border-[var(--green)]',
          error: 'border-l-[3px] border-[var(--danger)]',
          warning: 'border-l-[3px] border-[var(--amber)]',
          info: 'border-l-[3px] border-[var(--indigo)]',
        },
      }}
    />
  )
}

export { toast }
