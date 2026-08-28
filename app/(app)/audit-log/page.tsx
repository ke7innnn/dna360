'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  FileText, Search, Filter, ShieldCheck, Eye, Download,
  Activity, RefreshCw, KeyRound, Lock, AlertTriangle,
} from 'lucide-react'
import GlassCard from '@/components/app/ui/glass-card'
import StatCard from '@/components/app/ui/stat-card'
import { DataTable, type DataTableColumn } from '@/components/app/ui/data-table'
import { Button } from '@/components/app/ui/button'
import { StatusPill } from '@/components/app/ui/badge'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/app/ui/select'
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
  const pageSize = 10

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

  const actionStatusMap: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
    CREATE: 'success',
    LOGIN: 'info',
    UPDATE: 'warning',
    DELETE: 'danger',
    REVOKE_SESSION: 'danger',
    OVERRIDE: 'warning',
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
        <span className="tabular-nums text-xs font-mono text-[var(--app-text-secondary)]">
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
          <p className="font-medium text-xs text-[var(--app-text-primary)]">{row.actor.name}</p>
          <span className="text-[0.6875rem] text-[var(--app-text-muted)]">{row.actor.role}</span>
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
        const action = val as string
        return (
          <StatusPill status={actionStatusMap[action] || 'neutral'}>
            {action}
          </StatusPill>
        )
      },
    },
    {
      id: 'entity',
      header: 'Entity',
      accessorKey: 'entity',
      sortable: true,
      width: '140px',
      cell: (_, row) => (
        <span className="text-xs font-semibold text-[var(--app-text-primary)]">
          {row.entity} <span className="text-[var(--app-text-muted)] font-normal font-mono">#{row.entityId.slice(-6)}</span>
        </span>
      ),
    },
    {
      id: 'description',
      header: 'Description',
      accessorKey: 'description',
      cell: (val) => (
        <p className="text-xs text-[var(--app-text-secondary)] max-w-md truncate">
          {val as string}
        </p>
      ),
    },
    {
      id: 'ipAddress',
      header: 'IP Address',
      accessorKey: 'ipAddress',
      align: 'right',
      width: '130px',
      cell: (val) => (
        <span className="text-xs font-mono text-[var(--app-text-muted)]">
          {val as string}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      width: '90px',
      cell: (_, row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedEntry(row)
            setModalOpen(true)
          }}
          icon={<Eye className="w-3.5 h-3.5" />}
        >
          View
        </Button>
      ),
    },
  ]

  const totalLogins = logs.filter((l) => l.action === 'LOGIN').length
  const totalModifications = logs.filter((l) => ['CREATE', 'UPDATE', 'DELETE'].includes(l.action)).length
  const totalRevocations = logs.filter((l) => l.action === 'REVOKE_SESSION').length

  const paginatedLogs = logs.slice((page - 1) * pageSize, page * pageSize)

  const handleExportCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Timestamp,Actor Name,Actor Email,Actor Role,Action,Entity,Entity ID,Description,IP']
        .concat(
          logs.map(
            (l) =>
              `"${l.timestamp}","${l.actor.name}","${l.actor.email}","${l.actor.role}","${l.action}","${l.entity}","${l.entityId}","${l.description.replace(/"/g, '""')}","${l.ipAddress}"`
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
    toast.success('Audit log CSV exported')
  }

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[var(--app-glass-bg)] border border-[var(--app-glass-border)] text-xs text-[var(--app-text-muted)] mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--app-success)]" />
            <span>Immutable Append-Only Audit Trail</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--app-text-primary)] tracking-tight">
            System Audit Log
          </h1>
          <p className="text-sm text-[var(--app-text-secondary)] mt-1">
            Complete cryptographic audit trail of all administrative events, permission changes, and security actions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={refreshLogs}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleExportCsv}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Audit Records"
          value={logs.length}
          icon={<FileText className="w-5 h-5 text-[var(--aurora-1)]" />}
        />
        <StatCard
          label="Authentication Events"
          value={totalLogins}
          icon={<KeyRound className="w-5 h-5 text-[var(--app-info)]" />}
        />
        <StatCard
          label="Record Modifications"
          value={totalModifications}
          icon={<Activity className="w-5 h-5 text-[var(--app-warning)]" />}
        />
        <StatCard
          label="Session Revocations"
          value={totalRevocations}
          icon={<AlertTriangle className="w-5 h-5 text-[var(--app-danger)]" />}
        />
      </div>

      {/* Filter & Search Bar */}
      <GlassCard padding="sm">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--app-text-muted)]" />
            <input
              type="text"
              placeholder="Search by actor, description, IP, or record ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-4 text-xs glass-input text-[var(--app-text-primary)] placeholder:text-[var(--app-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--app-focus-ring)] transition-all"
            />
          </div>

          {/* Action Filter */}
          <div className="w-full md:w-44">
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Action: All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="revoke_session">Revoke Session</SelectItem>
                <SelectItem value="override">Override</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Entity Filter */}
          <div className="w-full md:w-44">
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Entity: All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                <SelectItem value="role">Role</SelectItem>
                <SelectItem value="session">Session</SelectItem>
                <SelectItem value="auth">Auth</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </GlassCard>

      {/* Table */}
      <DataTable<AuditLogEntry>
        columns={columns}
        data={paginatedLogs}
        status="success"
        page={page}
        pageSize={pageSize}
        total={logs.length}
        onPageChange={setPage}
        getRowId={(row) => row.id}
        emptyTitle="No audit records found"
        emptyDescription="No events match your current filter criteria."
        isFilterActive={actionFilter !== 'all' || entityFilter !== 'all' || !!search}
        onClearFilters={() => {
          setActionFilter('all')
          setEntityFilter('all')
          setSearch('')
        }}
      />

      {/* Audit Event Detail Modal */}
      <AuditDetailModal
        entry={selectedEntry}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  )
}
