'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck, ShieldAlert, KeyRound, QrCode,
  Users, Clock, AlertTriangle, CheckCircle,
  XCircle, RotateCcw, AlertOctagon,
  Search, Filter, Smartphone, CreditCard,
  Building2, Radio, UserCheck, Activity,
} from 'lucide-react'
import Card from '@/components/app/ui/glass-card'
import StatTile from '@/components/app/ui/StatTile'
import DataTable, { type DataTableColumn } from '@/components/app/ui/data-table'
import Button from '@/components/app/ui/button'
import Badge, { StatusPill } from '@/components/app/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/app/ui/tabs'
import PageHeader from '@/components/app/ui/PageHeader'
import OccupancyHeatmap from '@/components/app/attendance/OccupancyHeatmap'
import EmergencyModal from '@/components/app/attendance/EmergencyModal'
import ManualOverrideModal from '@/components/app/attendance/ManualOverrideModal'
import {
  getAccessLogs,
  getStoredGates,
  evaluateAccess,
  getFloorOccupancy,
} from '@/lib/attendance'
import { formatDateTime, getInitials } from '@/lib/utils'
import type { AccessLogEntry, GateDevice, AccessDecision } from '@/types/attendance'
import { toast } from '@/components/app/ui/toast'
import { cn } from '@/lib/utils'

export default function AttendancePage() {
  const [logs, setLogs] = useState<AccessLogEntry[]>([])
  const [gates, setGates] = useState<GateDevice[]>([])
  const [search, setSearch] = useState('')
  const [decisionFilter, setDecisionFilter] = useState('all')
  const [branchFilter, setBranchFilter] = useState('pow')
  const [selectedGateId, setSelectedGateId] = useState('gate_pow_01')
  const [scanQuery, setScanQuery] = useState('')
  const [activeTab, setActiveTab] = useState('live')

  const [lastScanResult, setLastScanResult] = useState<{
    entry: AccessLogEntry
    member: any | null
  } | null>(null)

  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false)
  const [overrideModalOpen, setOverrideModalOpen] = useState(false)
  const [overrideMember, setOverrideMember] = useState<any | null>(null)

  const refreshData = () => {
    const list = getAccessLogs({
      search,
      decision: decisionFilter,
      branchId: branchFilter,
    })
    setLogs(list)
    setGates(getStoredGates())
  }

  useEffect(() => {
    refreshData()
    const handleUpdate = () => refreshData()
    window.addEventListener('dna360_attendance_updated', handleUpdate)
    return () => window.removeEventListener('dna360_attendance_updated', handleUpdate)
  }, [search, decisionFilter, branchFilter])

  const occupancy = getFloorOccupancy(branchFilter)
  const isEmergencyUnlocked = gates.some((g) => g.status === 'emergency_unlocked')

  const handleSimulateScan = (query: string) => {
    const result = evaluateAccess(query, selectedGateId, 'QR')
    setLastScanResult(result)
    setScanQuery('')
    refreshData()

    if (result.entry.decision === 'GRANTED') {
      toast.success(`Access Granted: ${result.entry.memberName}`, {
        description: result.entry.reason,
      })
    } else {
      toast.error(`Access Denied: ${result.entry.memberName}`, {
        description: result.entry.reason,
      })
    }
  }

  const decisionBadgeMap: Record<AccessDecision, { status: string; label: string }> = {
    GRANTED: { status: 'ok', label: 'Access Granted' },
    GRANTED_GRACE_PERIOD: { status: 'warn', label: 'Grace Period (7 Days)' },
    DENIED_EXPIRED: { status: 'danger', label: 'Denied (Expired)' },
    DENIED_BLACKLISTED: { status: 'danger', label: 'Denied (Blacklisted)' },
    DENIED_NO_SESSIONS: { status: 'danger', label: 'Denied (No Sessions)' },
    DENIED_OUTSIDE_HOURS: { status: 'warn', label: 'Denied (Hours Violation)' },
    DENIED_NOT_ACTIVATED: { status: 'info', label: 'Denied (Not Activated)' },
    MANUAL_OVERRIDE: { status: 'warn', label: 'Manual Override' },
  }

  const columns: DataTableColumn<AccessLogEntry>[] = [
    {
      id: 'timestamp',
      header: 'Time',
      accessorKey: 'timestamp',
      sortable: true,
      cell: (v) => (
        <span className="font-data text-xs text-[var(--muted)] tabular-nums">
          {formatDateTime(v as string)}
        </span>
      ),
    },
    {
      id: 'member',
      header: 'Member / Identity',
      cell: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[rgba(59,130,246,0.35)] to-[rgba(99,102,241,0.20)] border border-[rgba(59,130,246,0.4)] flex items-center justify-center font-ui text-xs font-bold text-white shrink-0 shadow-sm">
            {getInitials(row.memberName || 'MB')}
          </div>
          <div>
            <span className="font-ui font-semibold text-[13.5px] text-[var(--ink)] block">
              {row.memberName}
            </span>
            <span className="font-data text-[10.5px] text-[var(--muted)] tabular-nums">
              {row.memberCode}
            </span>
          </div>
        </div>
      ),
    },
    {
      id: 'gate',
      header: 'Device / Gate',
      cell: (_, row) => (
        <div>
          <span className="font-ui text-xs font-medium text-[var(--ink)] block">
            {row.gateName}
          </span>
          <span className="font-data text-[10px] uppercase text-[var(--muted)]">
            Scan Type: {row.scanType}
          </span>
        </div>
      ),
    },
    {
      id: 'decision',
      header: 'Access Decision',
      cell: (v) => {
        const item = decisionBadgeMap[v as AccessDecision] || { status: 'neutral', label: String(v) }
        return <Badge status={item.status} size="sm">{item.label}</Badge>
      },
    },
    {
      id: 'reason',
      header: 'Reason / Rule Fired',
      accessorKey: 'reason',
      cell: (v) => (
        <span className="font-ui text-xs text-[var(--muted)] line-clamp-1 max-w-[280px]">
          {v as string}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none">
      {/* 1. Header */}
      <PageHeader
        eyebrow="OPERATIONS · TURNSTILE & ACCESS CONTROL"
        title="Turnstile & Gate Access"
        description="Real-time optical turnstile monitoring, rolling OTP verification, access policies, and automated emergency overrides."
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant={isEmergencyUnlocked ? 'danger' : 'secondary'}
              size="md"
              onClick={() => setEmergencyModalOpen(true)}
              icon={<AlertOctagon className="w-4 h-4" />}
            >
              {isEmergencyUnlocked ? 'Emergency Lockdown Active' : 'Emergency Gate Control'}
            </Button>
          </div>
        }
      />

      {/* 2. Stat Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="FLOOR OCCUPANCY"
          value={occupancy.currentCount}
          unit={`/ ${occupancy.maxCapacity}`}
          icon={<Users className="w-4 h-4 text-[var(--accent)]" />}
          delta={{
            text: `${Math.round((occupancy.currentCount / occupancy.maxCapacity) * 100)}% floor capacity`,
            type: Math.round((occupancy.currentCount / occupancy.maxCapacity) * 100) > 85 ? 'danger' : 'ok',
          }}
        />
        <StatTile
          label="GRANTED TODAY"
          value={logs.filter((l) => l.decision === 'GRANTED' || l.decision === 'GRANTED_GRACE_PERIOD').length}
          icon={<ShieldCheck className="w-4 h-4 text-[var(--green)]" />}
          delta={{ text: 'Optical turnstile normal', type: 'ok' }}
        />
        <StatTile
          label="DENIED / EXCEPTIONS"
          value={logs.filter((l) => l.decision.startsWith('DENIED')).length}
          icon={<ShieldAlert className="w-4 h-4 text-[var(--accent)]" />}
          delta={{ text: 'Expired or blacklisted', type: 'danger' }}
        />
        <StatTile
          label="LIVE GATE HARDWARE"
          value={`${gates.filter((g) => g.status === 'online').length} / ${gates.length}`}
          unit="ONLINE"
          icon={<Radio className="w-4 h-4 text-[var(--green)]" />}
          delta={{ text: 'Turnstile Gate 1 & 2', type: 'ok' }}
        />
      </div>

      {/* 3. Scan Console & Simulator Card */}
      <Card className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--line)] pb-4">
          <div>
            <h3 className="font-display text-base font-semibold text-[var(--ink)]">
              Live Gate Access Simulator
            </h3>
            <p className="font-ui text-xs text-[var(--muted)] mt-0.5">
              Simulate member turnstile badge scan, rolling OTP, or QR entry code
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--green)] shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
            <span className="font-data text-xs text-[var(--green)] font-semibold uppercase tracking-wider">
              Turnstile Ready
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
            <input
              type="text"
              value={scanQuery}
              onChange={(e) => setScanQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && scanQuery && handleSimulateScan(scanQuery)}
              placeholder="Scan QR token, member code (DNA-2025-0001), or phone..."
              className="w-full h-[40px] pl-10 pr-4 font-ui text-xs rounded-[var(--r-sm)] bg-[var(--bg-elev)] border border-[var(--line)] text-[var(--ink)] placeholder:text-[var(--muted-2)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] outline-none"
            />
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => scanQuery && handleSimulateScan(scanQuery)}
            icon={<QrCode className="w-4 h-4" />}
            disabled={!scanQuery.trim()}
          >
            Simulate scan
          </Button>
        </div>
      </Card>

      {/* 4. Logs DataTable */}
      <Card className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-display text-base font-semibold text-[var(--ink)]">
            Access Verification Audit Log
          </h3>

          <div className="flex items-center gap-2">
            <select
              value={decisionFilter}
              onChange={(e) => setDecisionFilter(e.target.value)}
              className="h-[34px] px-3 font-ui text-xs rounded-[var(--r-sm)] bg-[var(--bg-elev)] border border-[var(--line)] text-[var(--ink)] outline-none"
            >
              <option value="all">All Decisions</option>
              <option value="GRANTED">Access Granted</option>
              <option value="DENIED_EXPIRED">Denied (Expired)</option>
              <option value="DENIED_BLACKLISTED">Denied (Blacklisted)</option>
              <option value="MANUAL_OVERRIDE">Manual Override</option>
            </select>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={logs}
          status="success"
          pageSize={10}
          total={logs.length}
        />
      </Card>

      {/* Modals */}
      <EmergencyModal
        open={emergencyModalOpen}
        onOpenChange={setEmergencyModalOpen}
        onUpdated={refreshData}
      />
      <ManualOverrideModal
        open={overrideModalOpen}
        onOpenChange={setOverrideModalOpen}
        member={overrideMember}
        gateId={selectedGateId}
        onOverridden={refreshData}
      />
    </div>
  )
}
