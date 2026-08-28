'use client'

import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { Modal } from './modal'
import { Button } from './button'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel?: () => void
  variant?: 'default' | 'danger'
  loading?: boolean
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'default',
  loading = false,
}: ConfirmDialogProps) {
  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }

  const handleConfirm = () => {
    onConfirm()
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title} size="sm">
      <div className="flex flex-col items-center text-center py-2">
        {variant === 'danger' && (
          <div className="w-12 h-12 rounded-full bg-[var(--app-danger)]/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-[var(--app-danger)]" />
          </div>
        )}

        <p className="text-sm text-[var(--app-text-secondary)] mb-6 max-w-xs">
          {description}
        </p>

        <div className="flex items-center gap-3 w-full">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={handleCancel}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            className="flex-1"
            onClick={handleConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
