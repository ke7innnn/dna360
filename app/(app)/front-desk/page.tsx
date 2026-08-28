'use client'

import React, { useState, useEffect } from 'react'
import {
  UserPlus, ShoppingBag, KeyRound, Calculator,
  Sparkles, Receipt, CheckCircle, Clock,
  Users, DollarSign, ArrowUpRight, Search,
} from 'lucide-react'
import GlassCard from '@/components/app/ui/glass-card'
import StatCard from '@/components/app/ui/stat-card'
import { DataTable, type DataTableColumn } from '@/components/app/ui/data-table'
import { Button } from '@/components/app/ui/button'
import { StatusPill } from '@/components/app/ui/badge'
import WalkInLeadModal from '@/components/app/frontdesk/WalkInLeadModal'
import PosRetailModal from '@/components/app/frontdesk/PosRetailModal'
import ShiftHandoverModal from '@/components/app/frontdesk/ShiftHandoverModal'
import LockerModal from '@/components/app/frontdesk/LockerModal'
import {
  getStoredLeads,
  getStoredPosSales,
  getStoredLockers,
  getStoredShifts,
} from '@/lib/frontdesk'
import { formatINR, formatDateTime, getInitials } from '@/lib/utils'
import type { WalkInLead, PosSale } from '@/types/frontdesk'

export default function FrontDeskPage() {
  const [leads, setLeads] = useState<WalkInLead[]>([])
  const [sales, setSales] = useState<PosSale[]>([])
  const [leadModalOpen, setLeadModalOpen] = useState(false)
  const [posModalOpen, setPosModalOpen] = useState(false)
  const [shiftModalOpen, setShiftModalOpen] = useState(false)
  const [lockerModalOpen, setLockerModalOpen] = useState(false)

  const refreshData = () => {
    setLeads(getStoredLeads())
    setSales(getStoredPosSales())
  }

  useEffect(() => {
    refreshData()

    const handleUpdate = () => refreshData()
    window.addEventListener('dna360_frontdesk_updated', handleUpdate)
    return () => window.removeEventListener('dna360_frontdesk_updated', handleUpdate)
  }, [])

  const lockers = getStoredLockers()
  const occupiedLockers = lockers.filter((l) => l.status === 'occupied').length
  const totalRetailSalesMinor = sales.reduce((acc, s) => acc + s.totalMinor, 0)
  const activeTrialPasses = leads.filter((l) => l.trialPassIssued && l.status === 'trial_active').length

  const leadColumns: DataTableColumn<WalkInLead>[] = [
    {
      id: 'name',
      header: 'Prospect',
      sortable: true,
      cell: (_, row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--aurora-1)] to-[var(--aurora-2)] flex items-center justify-center text-white font-bold text-xs shrink-0">
            {getInitials(row.name)}
          </div>
          <div>
            <p className="font-semibold text-xs text-[var(--app-text-primary)]">{row.name}</p>
            <p className="font-mono text-[0.6875rem] text-[var(--app-text-muted)]">{row.phone}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'goal',
      header: 'Fitness Goal',
      accessorKey: 'goal',
      sortable: true,
      cell: (val) => <span className="text-xs text-[var(--app-text-secondary)]">{val as string}</span>,
    },
    {
      id: 'source',
      header: 'Referral Source',
      accessorKey: 'source',
      sortable: true,
      cell: (val) => <span className="text-xs text-[var(--app-text-muted)]">{val as string}</span>,
    },
    {
      id: 'trial',
      header: 'Trial Pass Code',
      sortable: true,
      cell: (_, row) =>
        row.trialPassCode ? (
          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[var(--aurora-1)]/10 text-[var(--aurora-1)] border border-[var(--aurora-1)]/20">
            {row.trialPassCode}
          </span>
        ) : (
          <span className="text-[0.6875rem] text-[var(--app-text-muted)]">No pass</span>
        ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (val) => (
        <StatusPill status={val === 'trial_active' ? 'success' : val === 'converted' ? 'info' : 'neutral'} dot>
          {val === 'trial_active' ? 'Trial Active' : val === 'converted' ? 'Converted' : 'Inquiry'}
        </StatusPill>
      ),
    },
  ]

  const salesColumns: DataTableColumn<PosSale>[] = [
    {
      id: 'receipt',
      header: 'Receipt #',
      accessorKey: 'receiptNumber',
      sortable: true,
      cell: (val) => <span className="font-mono text-xs font-semibold text-[var(--app-text-primary)]">{val as string}</span>,
    },
    {
      id: 'customer',
      header: 'Customer',
      accessorKey: 'customerName',
      sortable: true,
      cell: (val) => <span className="text-xs font-medium text-[var(--app-text-primary)]">{val as string}</span>,
    },
    {
      id: 'items',
      header: 'Items',
      cell: (_, row) => (
        <span className="text-xs text-[var(--app-text-muted)]">
          {row.items.map((i) => `${i.quantity}x ${i.productName.split(' ')[0]}`).join(', ')}
        </span>
      ),
    },
    {
      id: 'total',
      header: 'Total Paid',
      accessorKey: 'totalMinor',
      align: 'right',
      sortable: true,
      cell: (val) => <span className="font-mono text-xs font-bold text-[var(--app-success)]">{formatINR(val as number)}</span>,
    },
    {
      id: 'mode',
      header: 'Payment Mode',
      accessorKey: 'paymentMode',
      sortable: true,
      cell: (val) => (
        <StatusPill status={val === 'UPI' ? 'success' : 'neutral'}>
          {val as string}
        </StatusPill>
      ),
    },
  ]

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--app-text-primary)] tracking-tight">
            Front Desk Command Console
          </h1>
          <p className="text-sm text-[var(--app-text-secondary)] mt-1">
            Walk-in lead capture, trial turnstile passes, POS retail checkout, cash drawer reconciliation, and lockers.
          </p>
        </div>

        {/* Quick Action Command Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="primary"
            onClick={() => setLeadModalOpen(true)}
            icon={<UserPlus className="w-4 h-4" />}
          >
            Walk-In Lead
          </Button>
          <Button
            variant="secondary"
            onClick={() => setPosModalOpen(true)}
            icon={<ShoppingBag className="w-4 h-4" />}
          >
            POS Retail
          </Button>
          <Button
            variant="secondary"
            onClick={() => setLockerModalOpen(true)}
            icon={<KeyRound className="w-4 h-4" />}
          >
            Lockers ({occupiedLockers}/48)
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShiftModalOpen(true)}
            icon={<Calculator className="w-4 h-4" />}
          >
            Shift Close
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Walk-In Inquiries (Today)"
          value={leads.length}
          suffix=" prospects"
          icon={<Users className="w-5 h-5 text-[var(--aurora-1)]" />}
        />
        <StatCard
          label="Active Turnstile Trial Passes"
          value={activeTrialPasses}
          suffix=" active"
          icon={<Sparkles className="w-5 h-5 text-[var(--app-success)]" />}
        />
        <StatCard
          label="POS Retail & Cafe Sales"
          value={totalRetailSalesMinor}
          prefix="₹"
          formatValue={(v) => formatINR(v).replace('₹', '')}
          icon={<Receipt className="w-5 h-5 text-[var(--app-warning)]" />}
        />
        <StatCard
          label="Locker Keys Out"
          value={occupiedLockers}
          suffix=" / 48 keys"
          icon={<KeyRound className="w-5 h-5 text-[var(--app-info)]" />}
        />
      </div>

      {/* Grid: Walk-In Leads + POS Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Walk-In Leads Table */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-[var(--app-text-primary)]">
              Walk-In Prospects & Trial Passes ({leads.length})
            </h3>
            <button
              type="button"
              onClick={() => setLeadModalOpen(true)}
              className="text-xs font-semibold text-[var(--aurora-1)] hover:underline flex items-center gap-1"
            >
              + Quick Intake
            </button>
          </div>

          <DataTable<WalkInLead>
            columns={leadColumns}
            data={leads}
            status="success"
            page={1}
            pageSize={leads.length}
            total={leads.length}
            getRowId={(row) => row.id}
            emptyTitle="No walk-in inquiries recorded today"
            emptyDescription="Capture walk-in prospects using the Quick Intake button above."
          />
        </div>

        {/* POS Retail Sales Stream */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-[var(--app-text-primary)]">
              Recent Cafe & POS Sales ({sales.length})
            </h3>
            <button
              type="button"
              onClick={() => setPosModalOpen(true)}
              className="text-xs font-semibold text-[var(--aurora-1)] hover:underline flex items-center gap-1"
            >
              + New Sale
            </button>
          </div>

          <DataTable<PosSale>
            columns={salesColumns}
            data={sales}
            status="success"
            page={1}
            pageSize={sales.length}
            total={sales.length}
            getRowId={(row) => row.id}
            emptyTitle="No retail sales recorded"
            emptyDescription="Use the POS Retail counter to ring up protein shakes and gear."
          />
        </div>
      </div>

      {/* Modals */}
      <WalkInLeadModal
        open={leadModalOpen}
        onOpenChange={setLeadModalOpen}
        onLeadCreated={refreshData}
      />

      <PosRetailModal
        open={posModalOpen}
        onOpenChange={setPosModalOpen}
        onSaleCompleted={refreshData}
      />

      <ShiftHandoverModal
        open={shiftModalOpen}
        onOpenChange={setShiftModalOpen}
        onShiftClosed={refreshData}
      />

      <LockerModal
        open={lockerModalOpen}
        onOpenChange={setLockerModalOpen}
        onLockersUpdated={refreshData}
      />
    </div>
  )
}
