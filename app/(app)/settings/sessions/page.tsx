'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Monitor, Smartphone, Tablet, ArrowLeft, LogOut,
  ShieldCheck, AlertTriangle, Clock, MapPin, Building2,
} from 'lucide-react'
import GlassCard from '@/components/app/ui/glass-card'
import { DataTable, type DataTableColumn } from '@/components/app/ui/data-table'
import { Button } from '@/components/app/ui/button'
import { StatusPill } from '@/components/app/ui/badge'
import { ConfirmDialog } from '@/components/app/ui/confirm-dialog'
import { useAuth } from '@/context/AuthContext'
import { formatDateTime } from '@/lib/utils'
import type { UserSession } from '@/types/auth'
import { toast } from '@/components/app/ui/toast'
import Breadcrumbs from '@/components/app/ui/Breadcrumbs'

export default function SessionsSettingsPage() {
  const { sessions, revokeSession, user } = useAuth()
  const [selectedSession, setSelectedSession] = useState<UserSession | null>(null)

  const handleRevoke = () => {
    if (!selectedSession) return
    revokeSession(selectedSession.id)
    toast.success(`Session for ${selectedSession.userName} has been revoked`, {
      description: 'Employee terminal disconnected and logged in audit log.',
    })
    setSelectedSession(null)
  }

  const columns: DataTableColumn<UserSession>[] = [
    {
      id: 'device',
      header: 'Device & Station',
      sortable: true,
      cell: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--app-glass-bg)] border border-[var(--app-glass-border)] flex items-center justify-center text-[var(--app-text-muted)]">
            {row.deviceType === 'Mobile' ? (
              <Smartphone className="w-4 h-4" />
            ) : row.deviceType === 'Tablet' ? (
              <Tablet className="w-4 h-4" />
            ) : (
              <Monitor className="w-4 h-4" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-xs text-[var(--app-text-primary)]">
                {row.userName}
              </span>
              {row.isCurrent && (
                <span className="text-[0.625rem] px-1.5 py-0.2 rounded-full bg-[var(--app-success)]/10 text-[var(--app-success)] font-medium">
                  Your session
                </span>
              )}
            </div>
            <span className="text-[0.6875rem] text-[var(--app-text-muted)]">{row.userRole} · {row.userAgent}</span>
          </div>
        </div>
      ),
    },
    {
      id: 'ipAddress',
      header: 'IP & Network',
      accessorKey: 'ipAddress',
      sortable: true,
      cell: (val, row) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-[var(--app-text-secondary)]">{val as string}</span>
          <span className="text-[0.6875rem] text-[var(--app-text-muted)]">({row.location})</span>
        </div>
      ),
    },
    {
      id: 'branch',
      header: 'Branch',
      accessorKey: 'branchName',
      sortable: true,
      cell: (val) => (
        <div className="flex items-center gap-1.5 text-xs text-[var(--app-text-secondary)]">
          <Building2 className="w-3.5 h-3.5 text-[var(--app-text-muted)]" />
          <span>{val as string}</span>
        </div>
      ),
    },
    {
      id: 'lastActive',
      header: 'Last Active',
      accessorKey: 'lastActiveAt',
      sortable: true,
      cell: (val) => (
        <span className="tabular-nums text-xs font-mono text-[var(--app-text-secondary)]">
          {formatDateTime(val as string)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      width: '120px',
      cell: (_, row) =>
        row.isCurrent ? (
          <span className="text-xs text-[var(--app-text-muted)] italic">Active Now</span>
        ) : (
          <Button
            variant="danger"
            size="sm"
            onClick={() => setSelectedSession(row)}
            icon={<LogOut className="w-3.5 h-3.5" />}
          >
            Force Logout
          </Button>
        ),
    },
  ]

  return (
    <div className="space-y-8 max-w-6xl">
      <Breadcrumbs
        items={[
          { label: 'Club Settings', href: '/settings' },
          { label: 'Active Sessions & Terminals' },
        ]}
      />

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--app-text-primary)] tracking-tight">
          Active Staff Sessions & Security
        </h1>
        <p className="text-sm text-[var(--app-text-secondary)] mt-1">
          Monitor all active gym terminals and remote sessions. Revoke access immediately when employees depart.
        </p>
      </div>

      {/* Sessions Table */}
      <DataTable<UserSession>
        columns={columns}
        data={sessions}
        status="success"
        total={sessions.length}
        getRowId={(row) => row.id}
        emptyTitle="No active sessions found"
      />

      {/* Revoke Confirmation */}
      <ConfirmDialog
        open={!!selectedSession}
        onOpenChange={(open) => !open && setSelectedSession(null)}
        title="Revoke Staff Session"
        description={`Are you sure you want to terminate ${selectedSession?.userName}'s session on ${selectedSession?.userAgent}? They will be immediately logged out.`}
        variant="danger"
        confirmLabel="Revoke & Logout"
        onConfirm={handleRevoke}
      />
    </div>
  )
}
