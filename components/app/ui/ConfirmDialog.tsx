'use client'

import React, { useEffect, useRef } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import Button from '@/components/app/ui/button'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  isDestructive?: boolean
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = true,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => cancelBtnRef.current?.focus(), 50)
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onCancel()
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onCancel])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
    >
      <div className="w-full max-w-md bg-[#0C0E14] border border-[rgba(255,255,255,0.12)] rounded-[20px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="p-5">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isDestructive
                  ? 'bg-[rgba(239,68,68,0.15)] text-[#EF4444] border border-[rgba(239,68,68,0.3)] shadow-[0_0_12px_rgba(239,68,68,0.2)]'
                  : 'bg-[rgba(59,130,246,0.15)] text-[var(--accent)] border border-[rgba(59,130,246,0.3)]'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 id="confirm-dialog-title" className="font-display font-semibold text-base text-[var(--ink)]">
                {title}
              </h3>
              <p id="confirm-dialog-desc" className="font-ui text-xs text-[var(--muted)] leading-relaxed">
                {description}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-[rgba(255,255,255,0.06)] bg-[#07090E] flex items-center justify-end gap-2.5">
          <button
            ref={cancelBtnRef}
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-xs font-ui font-semibold text-[var(--ink-2)] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <Button
            variant={isDestructive ? 'primary' : 'primary'}
            size="sm"
            onClick={onConfirm}
            disabled={isLoading}
            className={isDestructive ? 'bg-[#DC2626] hover:bg-[#B91C1C] border-[#EF4444] text-white' : ''}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
