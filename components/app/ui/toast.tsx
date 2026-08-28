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
            'flex items-start gap-3 p-4 rounded-2xl w-[356px]',
            'glass-card',
            'text-sm font-medium text-[var(--app-text-primary)]',
          ].join(' '),
          title: 'text-sm font-semibold text-[var(--app-text-primary)]',
          description: 'text-sm text-[var(--app-text-secondary)] mt-0.5',
          actionButton: [
            'px-3 py-1.5 rounded-lg text-xs font-semibold',
            'bg-[var(--aurora-1)] text-white',
            'hover:brightness-110 transition-all',
          ].join(' '),
          cancelButton: [
            'px-3 py-1.5 rounded-lg text-xs font-semibold',
            'glass-input text-[var(--app-text-secondary)]',
            'hover:text-[var(--app-text-primary)] transition-all',
          ].join(' '),
          success: 'border-l-2 border-[var(--app-success)]',
          error: 'border-l-2 border-[var(--app-danger)]',
          warning: 'border-l-2 border-[var(--app-warning)]',
          info: 'border-l-2 border-[var(--app-info)]',
        },
      }}
    />
  )
}

export { toast }
