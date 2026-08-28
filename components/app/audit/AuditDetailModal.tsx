'use client'

import React, { useState } from 'react'
import { Copy, Check, FileJson, Clock, User, ShieldAlert, Monitor } from 'lucide-react'
import { Modal } from '@/components/app/ui/modal'
import { Button } from '@/components/app/ui/button'
import { StatusPill } from '@/components/app/ui/badge'
import { formatDateTime } from '@/lib/utils'
import type { AuditLogEntry } from '@/types/auth'
import { toast } from '@/components/app/ui/toast'

export default function AuditDetailModal({
  entry,
  open,
  onOpenChange,
}: {
  entry: AuditLogEntry | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [copied, setCopied] = useState(false)

  if (!entry) return null

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(entry, null, 2))
    setCopied(true)
    toast.success('Audit log JSON copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  const actionStatusMap: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
    CREATE: 'success',
    LOGIN: 'info',
    UPDATE: 'warning',
    DELETE: 'danger',
    REVOKE_SESSION: 'danger',
    OVERRIDE: 'warning',
    LOGOUT: 'neutral',
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Audit Log Event Details"
      description={`Record ID: ${entry.id}`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Top Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl glass-input text-xs">
          <div>
            <span className="text-[var(--app-text-muted)] block mb-1">Action</span>
            <StatusPill status={actionStatusMap[entry.action] || 'neutral'}>
              {entry.action}
            </StatusPill>
          </div>
          <div>
            <span className="text-[var(--app-text-muted)] block mb-1">Entity</span>
            <span className="font-semibold text-[var(--app-text-primary)]">
              {entry.entity} ({entry.entityId})
            </span>
          </div>
          <div>
            <span className="text-[var(--app-text-muted)] block mb-1">Actor</span>
            <span className="font-medium text-[var(--app-text-primary)]">
              {entry.actor.name} ({entry.actor.role})
            </span>
          </div>
          <div>
            <span className="text-[var(--app-text-muted)] block mb-1">Timestamp</span>
            <span className="tabular-nums text-[var(--app-text-secondary)]">
              {formatDateTime(entry.timestamp)}
            </span>
          </div>
        </div>

        {/* Description */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--app-text-muted)] mb-1">
            Description
          </h4>
          <p className="text-sm text-[var(--app-text-primary)] glass-input p-3">
            {entry.description}
          </p>
        </div>

        {/* Before vs After JSON Diffs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--app-text-muted)] mb-1">
              Before State
            </h4>
            <div className="rounded-xl glass-input p-3 h-48 overflow-y-auto font-mono text-[0.6875rem] text-[var(--app-text-secondary)]">
              {entry.beforeState ? (
                <pre>{JSON.stringify(entry.beforeState, null, 2)}</pre>
              ) : (
                <span className="text-[var(--app-text-muted)] italic">null (Initial creation)</span>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--app-text-muted)] mb-1">
              After State
            </h4>
            <div className="rounded-xl glass-input p-3 h-48 overflow-y-auto font-mono text-[0.6875rem] text-[var(--app-text-primary)] border border-[var(--aurora-1)]/20">
              {entry.afterState ? (
                <pre>{JSON.stringify(entry.afterState, null, 2)}</pre>
              ) : (
                <span className="text-[var(--app-text-muted)] italic">null (Deletion)</span>
              )}
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--app-glass-border)] text-xs text-[var(--app-text-muted)]">
          <div className="flex items-center gap-4">
            <span>IP: <strong className="font-mono text-[var(--app-text-secondary)]">{entry.ipAddress}</strong></span>
            <span>Branch: <strong className="text-[var(--app-text-secondary)]">{entry.branchName || entry.branchId}</strong></span>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopyJson}
            icon={copied ? <Check className="w-3.5 h-3.5 text-[var(--app-success)]" /> : <Copy className="w-3.5 h-3.5" />}
          >
            {copied ? 'Copied JSON' : 'Copy JSON'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
