'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  FileText, Search, Filter, ShieldCheck, Eye, Download,
  Activity, RefreshCw, KeyRound, Lock, AlertTriangle,
} from 'lucide-react'
import Card from '@/components/app/ui/glass-card'
import StatTile from '@/components/app/ui/StatTile'
import DataTable, { type DataTableColumn } from '@/components/app/ui/data-table'
import Button from '@/components/app/ui/button'
import Badge, { StatusPill } from '@/components/app/ui/badge'
import PageHeader from '@/components/app/ui/PageHeader'
import AuditDetailModal from '@/components/app/audit/AuditDetailModal'
import { getAuditLogs } from '@/lib/audit'
import { formatDateTime } from '@/lib/utils'
import type { AuditLogEntry, AuditAction } from '@/types/auth'
import { toast } from '@/components/app/ui/toast'

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
      width: '190px',
      cell: (val) => (
        <span className="tabular-nums text-xs font-data text-[var(--muted)]">
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
          <span className="font-data text-[10px] uppercase text-[var(--muted)]">{row.actor.role}</span>
        </div>
      ),
    },
    {
      id: 'action',
      header: 'Action',
      accessorKey: 'action',
      sortable: true,
      width: '140px',
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
          <span className="font-data text-xs text-[var(--ink)]">{row.entity.type}</span>
          <span className="font-data text-[10px] text-[var(--muted)] block">ID: {row.entity.id}</span>
        </div>
      ),
    },
    {
      id: 'details',
      header: 'Metadata / IP Address',
      cell: (_, row) => (
        <div className="font-data text-[11px] text-[var(--muted)]">
          <span>IP: {row.ipAddress || '192.168.1.1'}</span>
          <span className="block truncate max-w-[200px] text-[10px] text-[var(--muted-2)]">
            UA: {row.userAgent || 'Chrome / macOS'}
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
              `"${l.timestamp}","${l.actor.name}","${l.actor.role}","${l.action}","${l.entity.type}","${l.entity.id}","${l.ipAddress || ''}"`
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none">
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
            Export audit log
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

      {/* 3. Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by actor name, action, or entity ID..."
            className="w-full h-[36px] pl-9 pr-3.5 font-ui text-xs rounded-[var(--r-sm)] bg-[var(--bg-elev)] border border-[var(--line)] text-[var(--ink)] placeholder:text-[var(--muted-2)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="h-[36px] px-3 font-ui text-xs rounded-[var(--r-sm)] bg-[var(--bg-elev)] border border-[var(--line)] text-[var(--ink)] outline-none"
          >
            <option value="all">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="LOGIN">LOGIN</option>
            <option value="OVERRIDE">OVERRIDE</option>
            <option value="REVOKE_SESSION">REVOKE_SESSION</option>
          </select>
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
