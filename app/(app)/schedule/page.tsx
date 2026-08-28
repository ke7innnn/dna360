'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Calendar as CalendarIcon, Clock, Users, Dumbbell,
  CheckCircle, Plus, Sparkles, Trophy,
  IndianRupee, Activity, ChevronRight, UserCheck,
} from 'lucide-react'
import GlassCard from '@/components/app/ui/glass-card'
import StatCard from '@/components/app/ui/stat-card'
import { DataTable, type DataTableColumn } from '@/components/app/ui/data-table'
import { Button } from '@/components/app/ui/button'
import { StatusPill } from '@/components/app/ui/badge'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/app/ui/select'
import ClientProgramDrawer from '@/components/app/trainers/ClientProgramDrawer'
import LogSessionModal from '@/components/app/trainers/LogSessionModal'
import {
  SEEDED_TRAINERS,
  getTrainerClients,
  getTrainerAppointments,
  getStoredPTSessions,
  getCommissionLedger,
} from '@/lib/trainers'
import { formatINR, formatDateTime, getInitials } from '@/lib/utils'
import type { PTClient, PTAppointment } from '@/types/trainer'
import { cn } from '@/lib/utils'

export default function TrainerWorkspacePage() {
  const [selectedTrainerId, setSelectedTrainerId] = useState('usr_trainer_01')
  const [clients, setClients] = useState<PTClient[]>([])
  const [appointments, setAppointments] = useState<PTAppointment[]>([])

  const [selectedClient, setSelectedClient] = useState<PTClient | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [logModalOpen, setLogModalOpen] = useState(false)
  const [logModalClient, setLogModalClient] = useState<PTClient | null>(null)

  const refreshData = () => {
    setClients(getTrainerClients(selectedTrainerId))
    setAppointments(getTrainerAppointments(selectedTrainerId))
  }

  useEffect(() => {
    refreshData()

    const handleUpdate = () => refreshData()
    window.addEventListener('dna360_trainers_updated', handleUpdate)
    return () => window.removeEventListener('dna360_trainers_updated', handleUpdate)
  }, [selectedTrainerId])

  const selectedTrainer = SEEDED_TRAINERS.find((t) => t.id === selectedTrainerId) || SEEDED_TRAINERS[0]
  const completedSessions = getStoredPTSessions().filter((s) => s.trainerId === selectedTrainerId)
  const commissions = getCommissionLedger(selectedTrainerId)
  const totalCommissionMinor = commissions.reduce((acc, c) => acc + c.amountMinor, 0)
  const remainingTotalSessions = clients.reduce((acc, c) => acc + c.ptSessionsRemaining, 0)

  const clientColumns: DataTableColumn<PTClient>[] = [
    {
      id: 'client',
      header: 'Client',
      sortable: true,
      cell: (_, row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--aurora-1)] to-[var(--aurora-2)] flex items-center justify-center text-white font-bold text-xs shrink-0">
            {getInitials(row.name)}
          </div>
          <div>
            <p className="font-semibold text-xs text-[var(--app-text-primary)] hover:text-[var(--aurora-1)] transition-colors">
              {row.name}
            </p>
            <p className="font-mono text-[0.6875rem] text-[var(--app-text-muted)]">
              {row.memberCode} · {row.phone}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'goal',
      header: 'Primary Goal',
      accessorKey: 'primaryGoal',
      sortable: true,
      cell: (val) => (
        <span className="text-xs font-medium text-[var(--app-text-primary)]">{val as string}</span>
      ),
    },
    {
      id: 'allowance',
      header: 'PT Allowance Remaining',
      sortable: true,
      cell: (_, row) => (
        <div className="space-y-1 w-32">
          <div className="flex justify-between text-xs font-mono">
            <span className="font-bold text-[var(--aurora-1)]">{row.ptSessionsRemaining} left</span>
            <span className="text-[0.6875rem] text-[var(--app-text-muted)]">of {row.ptSessionsTotal}</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[var(--app-glass-bg)] overflow-hidden border border-[var(--app-glass-border)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--aurora-1)] to-[var(--aurora-2)]"
              style={{ width: `${(row.ptSessionsRemaining / row.ptSessionsTotal) * 100}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      id: 'metrics',
      header: 'Body Weight / Fat',
      sortable: true,
      cell: (_, row) => (
        <div className="text-xs font-mono">
          <span className="font-bold text-[var(--app-text-primary)] block">{row.currentWeightKg} kg</span>
          <span className="text-[0.6875rem] text-[var(--app-success)]">{row.bodyFatPct}% Body Fat</span>
        </div>
      ),
    },
    {
      id: 'lastSession',
      header: 'Last Session',
      accessorKey: 'lastSessionDate',
      sortable: true,
      cell: (val) => (
        <span className="text-xs font-mono text-[var(--app-text-secondary)]">
          {(val as string) || 'No sessions'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      width: '140px',
      cell: (_, row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedClient(row)
              setDrawerOpen(true)
            }}
          >
            Program
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setLogModalClient(row)
              setLogModalOpen(true)
            }}
            title="Log Completed PT Session"
            icon={<CheckCircle className="w-3.5 h-3.5 text-[var(--app-success)]" />}
          />
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--app-text-primary)] tracking-tight">
            Trainer Workspace & Client Programming
          </h1>
          <p className="text-sm text-[var(--app-text-secondary)] mt-1">
            1-on-1 PT appointments, workout splits, macro targets, session logs, and commission payouts.
          </p>
        </div>

        {/* Trainer Selector & Commission Link */}
        <div className="flex items-center gap-3">
          <div className="w-56">
            <Select value={selectedTrainerId} onValueChange={setSelectedTrainerId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SEEDED_TRAINERS.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} ({t.role.split('&')[0]})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Link href="/trainers/commission">
            <Button variant="secondary" size="sm" icon={<IndianRupee className="w-3.5 h-3.5" />}>
              Commission Ledger
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active PT Clients"
          value={clients.length}
          suffix=" clients"
          icon={<Users className="w-5 h-5 text-[var(--aurora-1)]" />}
        />
        <StatCard
          label="Delivered Sessions (MTD)"
          value={completedSessions.length}
          suffix=" sessions"
          icon={<CheckCircle className="w-5 h-5 text-[var(--app-success)]" />}
        />
        <StatCard
          label="Client Session Balance"
          value={remainingTotalSessions}
          suffix=" available"
          icon={<Activity className="w-5 h-5 text-[var(--app-warning)]" />}
        />
        <StatCard
          label="Accrued Commission (MTD)"
          value={totalCommissionMinor}
          prefix="₹"
          formatValue={(v) => formatINR(v).replace('₹', '')}
          icon={<Trophy className="w-5 h-5 text-[var(--app-info)]" />}
        />
      </div>

      {/* Daily Appointment Timeline */}
      <GlassCard padding="md" className="space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--app-glass-border)] pb-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-[var(--aurora-1)]" />
            <h3 className="font-display text-sm font-semibold text-[var(--app-text-primary)]">
              Today's Appointment Schedule ({appointments.length})
            </h3>
          </div>
          <span className="text-xs font-mono text-[var(--app-text-muted)]">
            Coach: {selectedTrainer.name}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {appointments.map((apt) => (
            <div
              key={apt.id}
              className="p-3.5 rounded-xl glass-input space-y-2 border border-[var(--app-glass-border)] hover:border-[var(--aurora-1)]/30 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[var(--aurora-1)]">
                  {apt.startTime} - {apt.endTime} IST
                </span>
                <StatusPill status="success">{apt.type.replace('_', ' ').toUpperCase()}</StatusPill>
              </div>

              <div>
                <p className="font-bold text-xs text-[var(--app-text-primary)]">{apt.clientName}</p>
                <p className="text-[0.6875rem] font-mono text-[var(--app-text-muted)]">{apt.clientPhone}</p>
              </div>

              <div className="pt-2 border-t border-[var(--app-glass-border)] flex items-center justify-between">
                <span className="text-[0.6875rem] text-[var(--app-text-muted)]">1-on-1 PT Floor</span>
                <button
                  type="button"
                  onClick={() => {
                    const found = clients.find((c) => c.name === apt.clientName)
                    setLogModalClient(found || null)
                    setLogModalOpen(true)
                  }}
                  className="text-[0.6875rem] font-semibold text-[var(--aurora-1)] hover:underline"
                >
                  Log Session →
                </button>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* PT Client Roster DataTable */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-semibold text-[var(--app-text-primary)]">
            Assigned Personal Training Clients ({clients.length})
          </h3>
          <p className="text-xs text-[var(--app-text-muted)]">
            Click any client to view or edit their workout split, macro target, and session history.
          </p>
        </div>

        <DataTable<PTClient>
          columns={clientColumns}
          data={clients}
          status="success"
          page={1}
          pageSize={clients.length}
          total={clients.length}
          onRowClick={(row) => {
            setSelectedClient(row)
            setDrawerOpen(true)
          }}
          getRowId={(row) => row.id}
          emptyTitle="No clients assigned to this trainer"
          emptyDescription="Assign members from the Member Management directory."
        />
      </div>

      {/* Client Program Slide-Over Drawer */}
      <ClientProgramDrawer
        client={selectedClient}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onUpdated={refreshData}
      />

      {/* Log Session Modal */}
      <LogSessionModal
        client={logModalClient}
        open={logModalOpen}
        onOpenChange={setLogModalOpen}
        onSessionLogged={refreshData}
      />
    </div>
  )
}
