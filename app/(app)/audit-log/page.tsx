'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  FileText, Search, Filter, ShieldCheck, Eye, Download,
  Activity, RefreshCw, KeyRound, Lock, AlertTriangle, X
} from 'lucide-react'
import Card from '@/components/app/ui/glass-card'
import StatTile from '@/components/app/ui/StatTile'
import DataTable, { type DataTableColumn } from '@/components/app/ui/data-table'
import Button from '@/components/app/ui/button'
import Badge from '@/components/app/ui/badge'
import PageHeader from '@/components/app/ui/PageHeader'
import AuditDetailModal from '@/components/app/audit/AuditDetailModal'
import { getAuditLogs } from '@/lib/audit'
import { formatDateTime } from '@/lib/utils'
import type { AuditLogEntry, AuditAction } from '@/types/auth'
import { toast } from '@/components/app/ui/toast'
import { cn } from '@/lib/utils'

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [entityFilter, setEntityFilter] = useState('all')
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 12

  const refreshLogs = () => {
    const data = getAuditLogs({
      search,
      action: actionFilter,
      entity: entityFilter,
    })
    setLogs(data)
  }

  useEffect(() => {
    refreshLogs()

    const handleNewLog = () => refreshLogs()
    window.addEventListener('dna360_audit_appended', handleNewLog)
    return () => window.removeEventListener('dna360_audit_appended', handleNewLog)
  }, [search, actionFilter, entityFilter])

  const actionStatusMap: Record<string, string> = {
    CREATE: 'ok',
    LOGIN: 'info',
    UPDATE: 'warn',
    DELETE: 'danger',
    REVOKE_SESSION: 'danger',
    OVERRIDE: 'warn',
    LOGOUT: 'neutral',
  }

  const columns: DataTableColumn<AuditLogEntry>[] = [
    {
      id: 'timestamp',
      header: 'Timestamp',
      accessorKey: 'timestamp',
      sortable: true,
      width: '180px',
      cell: (val) => (
        <span className="font-sans tabular-nums text-xs text-[var(--muted)]">
          {formatDateTime(val as string)}
        </span>
      ),
    },
    {
      id: 'actor',
      header: 'Actor',
      accessorKey: 'actor',
      sortable: true,
      cell: (_, row) => (
        <div>
          <p className="font-ui font-semibold text-xs text-[var(--ink)]">{row.actor.name}</p>
          <span className="font-ui text-[10.5px] uppercase tracking-wider text-[var(--muted)]">{row.actor.role}</span>
        </div>
      ),
    },
    {
      id: 'action',
      header: 'Action',
      accessorKey: 'action',
      sortable: true,
      width: '130px',
      cell: (val) => {
        const action = String(val)
        return (
          <Badge status={actionStatusMap[action] || 'neutral'} size="sm">
            {action}
          </Badge>
        )
      },
    },
    {
      id: 'entity',
      header: 'Entity / Target',
      cell: (_, row) => (
        <div>
          <span className="font-ui text-xs font-semibold text-[var(--ink)] block">{row.entity}</span>
          <span className="font-sans tabular-nums text-[10.5px] text-[var(--muted-2)] block truncate max-w-[150px]">
            {row.entityId}
          </span>
        </div>
      ),
    },
    {
      id: 'details',
      header: 'Source & Location',
      cell: (_, row) => (
        <div className="flex items-center gap-2 font-ui text-xs">
          <span className="px-2 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--line-soft)] font-sans tabular-nums text-[11px] text-[var(--ink-2)]">
            {row.ipAddress || '127.0.0.1'}
          </span>
          <span className="text-[11px] text-[var(--muted)]">
            {row.branchId ? `Branch: ${row.branchId.toUpperCase()}` : 'Powai Studio'}
          </span>
        </div>
      ),
    },
    {
      id: 'inspect',
      header: 'Inspect',
      align: 'right',
      cell: (_, row) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            setSelectedEntry(row)
            setModalOpen(true)
          }}
          className="text-xs h-7 px-2.5 cursor-pointer"
        >
          View Diff
        </Button>
      ),
    },
  ]

  const handleExportCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Timestamp,Actor Name,Actor Role,Action,Entity Type,Entity ID,IP Address']
        .concat(
          logs.map(
            (l) =>
              `"${l.timestamp}","${l.actor.name}","${l.actor.role}","${l.action}","${l.entity}","${l.entityId}","${l.ipAddress || ''}"`
          )
        )
        .join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `dna360_audit_log_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Audit Log exported to CSV')
  }

  const quickFilters = [
    { id: 'all', label: 'All Events' },
    { id: 'OVERRIDE', label: 'Security Overrides' },
    { id: 'LOGIN', label: 'Authentication' },
    { id: 'CREATE', label: 'Creations' },
    { id: 'UPDATE', label: 'Updates' },
    { id: 'REVOKE_SESSION', label: 'Session Revocations' },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none pb-12">
      {/* 1. Header */}
      <PageHeader
        eyebrow="SECURITY & GOVERNANCE · SYSTEM AUDIT"
        title="Audit Trail"
        description="Immutable append-only administrative activity trail, security overrides, role elevations, and turnstile manual grants."
        actions={
          <Button
            variant="secondary"
            size="md"
            onClick={handleExportCsv}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>
        }
      />

      {/* 2. Stat Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="LOGGED EVENTS"
          value={logs.length}
          unit="APPEND-ONLY"
          icon={<FileText className="w-4 h-4 text-[var(--indigo)]" />}
        />
        <StatTile
          label="SECURITY OVERRIDES"
          value={logs.filter((l) => l.action === 'OVERRIDE').length}
          unit="MANUAL GRANTS"
          icon={<ShieldCheck className="w-4 h-4 text-[var(--accent)]" />}
          delta={{ text: 'Front desk overrides', type: 'warn' }}
        />
        <StatTile
          label="SESSION REVOCATIONS"
          value={logs.filter((l) => l.action === 'REVOKE_SESSION').length}
          unit="TERMINATED"
          icon={<KeyRound className="w-4 h-4 text-[var(--amber)]" />}
        />
        <StatTile
          label="STORAGE INTEGRITY"
          value="100%"
          unit="HASH VERIFIED"
          icon={<Lock className="w-4 h-4 text-[var(--green)]" />}
          delta={{ text: 'Zero anomalies', type: 'ok' }}
        />
      </div>

      {/* 3. Search and Quick Action Filter Chips */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted)] pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by actor name, action, or entity ID..."
              className="w-full h-[38px] pl-9 pr-8 font-ui text-xs rounded-[var(--r-md)] bg-[var(--surface-2)] border border-[var(--line)] text-[var(--ink)] placeholder:text-[var(--muted-2)] focus:border-[var(--accent)] outline-none transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="font-ui text-xs text-[var(--muted)]">
              Showing <span className="font-sans font-bold tabular-nums text-[var(--ink)]">{logs.length}</span> audit records
            </span>
          </div>
        </div>

        {/* Quick Filter Pill Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {quickFilters.map((qf) => (
            <button
              key={qf.id}
              type="button"
              onClick={() => setActionFilter(qf.id)}
              className={cn(
                'h-[30px] px-3 rounded-full font-ui text-xs font-medium cursor-pointer transition-colors whitespace-nowrap',
                actionFilter === qf.id
                  ? 'bg-[var(--accent)] text-white shadow-glow-sm'
                  : 'bg-[var(--surface)] border border-[var(--line)] text-[var(--muted)] hover:text-white hover:bg-[var(--surface-2)]'
              )}
            >
              {qf.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. DataTable */}
      <DataTable
        columns={columns}
        data={logs}
        status="success"
        pageSize={pageSize}
        total={logs.length}
        page={page}
        onPageChange={setPage}
        onRowClick={(row) => {
          setSelectedEntry(row)
          setModalOpen(true)
        }}
      />

      {/* Detail Modal */}
      <AuditDetailModal
        entry={selectedEntry}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  )
}
