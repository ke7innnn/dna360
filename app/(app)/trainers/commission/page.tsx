'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  DollarSign, ArrowLeft, Download, Trophy,
  CheckCircle, Clock, Calendar, Users,
} from 'lucide-react'
import GlassCard from '@/components/app/ui/glass-card'
import StatCard from '@/components/app/ui/stat-card'
import { DataTable, type DataTableColumn } from '@/components/app/ui/data-table'
import { Button } from '@/components/app/ui/button'
import { StatusPill } from '@/components/app/ui/badge'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/app/ui/select'
import { SEEDED_TRAINERS, getCommissionLedger } from '@/lib/trainers'
import { formatINR, formatDateTime } from '@/lib/utils'
import type { TrainerCommission } from '@/types/trainer'
import { toast } from '@/components/app/ui/toast'

export default function TrainerCommissionPage() {
  const [selectedTrainerId, setSelectedTrainerId] = useState('usr_trainer_01')
  const [commissions, setCommissions] = useState<TrainerCommission[]>([])

  const refreshCommissions = () => {
    setCommissions(getCommissionLedger(selectedTrainerId))
  }

  useEffect(() => {
    refreshCommissions()

    const handleUpdate = () => refreshCommissions()
    window.addEventListener('dna360_trainers_updated', handleUpdate)
    return () => window.removeEventListener('dna360_trainers_updated', handleUpdate)
  }, [selectedTrainerId])

  const selectedTrainer = SEEDED_TRAINERS.find((t) => t.id === selectedTrainerId) || SEEDED_TRAINERS[0]
  const totalAccruedMinor = commissions.reduce((acc, c) => acc + (c.payoutStatus === 'accrued' ? c.amountMinor : 0), 0)
  const totalPaidMinor = commissions.reduce((acc, c) => acc + (c.payoutStatus === 'paid' ? c.amountMinor : 0), 0)

  const columns: DataTableColumn<TrainerCommission>[] = [
    {
      id: 'date',
      header: 'Session Date',
      accessorKey: 'date',
      sortable: true,
      cell: (val) => <span className="font-mono text-xs text-[var(--app-text-primary)]">{val as string}</span>,
    },
    {
      id: 'client',
      header: 'PT Client',
      accessorKey: 'clientName',
      sortable: true,
      cell: (val) => <span className="font-semibold text-xs text-[var(--app-text-primary)]">{val as string}</span>,
    },
    {
      id: 'ref',
      header: 'Session Ref ID',
      accessorKey: 'sessionId',
      cell: (val) => <span className="font-mono text-[0.6875rem] text-[var(--app-text-muted)]">{val as string}</span>,
    },
    {
      id: 'amount',
      header: 'Commission Payout',
      accessorKey: 'amountMinor',
      align: 'right',
      sortable: true,
      cell: (val) => (
        <span className="font-mono text-xs font-bold text-[var(--app-success)]">
          {formatINR(val as number)}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Payout Status',
      accessorKey: 'payoutStatus',
      sortable: true,
      width: '120px',
      cell: (val) => (
        <StatusPill status={val === 'paid' ? 'success' : 'warning'}>
          {val === 'paid' ? 'Paid Out' : 'Accrued MTD'}
        </StatusPill>
      ),
    },
  ]

  const handleExportCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Trainer,Session Date,Client Name,Session Ref,Commission Amount (INR),Payout Status']
        .concat(
          commissions.map(
            (c) =>
              `"${c.trainerName}","${c.date}","${c.clientName}","${c.sessionId}","${c.amountMinor / 100}","${c.payoutStatus}"`
          )
        )
        .join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `dna360_trainer_commission_${selectedTrainer.name.replace(/\s+/g, '_')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Commission ledger exported as CSV')
  }

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/schedule"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--app-text-muted)] hover:text-[var(--app-text-secondary)] transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Trainer Workspace
          </Link>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--app-text-primary)] tracking-tight">
            Trainer Commission Ledger
          </h1>
          <p className="text-sm text-[var(--app-text-secondary)] mt-1">
            Track per-session 1-on-1 PT commission accruals, payroll breakdowns, and settlement history.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-56">
            <Select value={selectedTrainerId} onValueChange={setSelectedTrainerId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SEEDED_TRAINERS.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button variant="secondary" size="sm" onClick={handleExportCsv} icon={<Download className="w-3.5 h-3.5" />}>
            Export Payroll CSV
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Accrued Commission (MTD)"
          value={totalAccruedMinor}
          prefix="₹"
          formatValue={(v) => formatINR(v).replace('₹', '')}
          icon={<DollarSign className="w-5 h-5 text-[var(--aurora-1)]" />}
        />
        <StatCard
          label="Total Settled / Paid Out"
          value={totalPaidMinor}
          prefix="₹"
          formatValue={(v) => formatINR(v).replace('₹', '')}
          icon={<CheckCircle className="w-5 h-5 text-[var(--app-success)]" />}
        />
        <StatCard
          label="Delivered Sessions"
          value={commissions.length}
          suffix=" sessions"
          icon={<Trophy className="w-5 h-5 text-[var(--app-warning)]" />}
        />
        <StatCard
          label="Standard Rate / Session"
          value={80000}
          prefix="₹"
          formatValue={(v) => formatINR(v).replace('₹', '')}
          icon={<Users className="w-5 h-5 text-[var(--app-info)]" />}
        />
      </div>

      {/* Commission DataTable */}
      <DataTable<TrainerCommission>
        columns={columns}
        data={commissions}
        status="success"
        page={1}
        pageSize={commissions.length}
        total={commissions.length}
        getRowId={(row) => row.id}
        emptyTitle="No commission entries recorded for this coach"
        emptyDescription="Logged 1-on-1 PT sessions will credit commissions here automatically."
      />
    </div>
  )
}
