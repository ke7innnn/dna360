'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck, ShieldAlert, KeyRound, QrCode,
  Users, Clock, AlertTriangle, CheckCircle,
  XCircle, RotateCcw, AlertOctagon, Flame,
  Search, Filter, Smartphone, CreditCard,
  Building2, Radio, UserCheck, Activity,
} from 'lucide-react'
import GlassCard from '@/components/app/ui/glass-card'
import StatCard from '@/components/app/ui/stat-card'
import { DataTable, type DataTableColumn } from '@/components/app/ui/data-table'
import { Button } from '@/components/app/ui/button'
import { StatusPill } from '@/components/app/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/app/ui/tabs'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/app/ui/select'
import OccupancyHeatmap from '@/components/app/attendance/OccupancyHeatmap'
import EmergencyModal from '@/components/app/attendance/EmergencyModal'
import ManualOverrideModal from '@/components/app/attendance/ManualOverrideModal'
import {
  getAccessLogs,
  getStoredGates,
  evaluateAccess,
  getFloorOccupancy,
} from '@/lib/attendance'
import { formatINR, formatDateTime, getInitials } from '@/lib/utils'
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

  const decisionBadgeMap: Record<AccessDecision, { status: 'success' | 'warning' | 'danger' | 'info' | 'neutral'; label: string }> = {
    GRANTED: { status: 'success', label: 'Access Granted' },
    GRANTED_GRACE_PERIOD: { status: 'warning', label: 'Grace Period (7 Days)' },
    DENIED_EXPIRED: { status: 'danger', label: 'Denied (Expired)' },
    DENIED_BLACKLISTED: { status: 'danger', label: 'Denied (Blacklisted)' },
    DENIED_NO_SESSIONS: { status: 'danger', label: 'Denied (No Sessions)' },
    DENIED_OUTSIDE_HOURS: { status: 'warning', label: 'Denied (Happy Hours Violation)' },
    DENIED_NOT_ACTIVATED: { status: 'info', label: 'Denied (Not Activated)' },
    MANUAL_OVERRIDE: { status: 'warning', label: 'Manual Override' },
  }

  const columns: DataTableColumn<AccessLogEntry>[] = [
    {
      id: 'time',
      header: 'Scan Time (IST)',
      sortable: true,
      cell: (_, row) => (
        <span className="font-mono text-xs text-[var(--app-text-secondary)]">
          {formatDateTime(row.timestamp).split(',')[1]?.trim() || formatDateTime(row.timestamp)}
        </span>
      ),
    },
    {
      id: 'member',
      header: 'Member / Visitor',
      sortable: true,
      cell: (_, row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--aurora-1)] to-[var(--aurora-2)] flex items-center justify-center text-white text-xs font-semibold shrink-0">
            {getInitials(row.memberName)}
          </div>
          <div>
            <p className="font-semibold text-xs text-[var(--app-text-primary)]">{row.memberName}</p>
            <p className="font-mono text-[0.6875rem] text-[var(--app-text-muted)]">{row.memberCode}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'gate',
      header: 'Turnstile Gate',
      sortable: true,
      cell: (_, row) => (
        <div>
          <span className="text-xs font-medium text-[var(--app-text-primary)]">{row.gateName}</span>
          <span className="text-[0.625rem] text-[var(--app-text-muted)] uppercase block mt-0.5">
            Method: {row.scanType}
          </span>
        </div>
      ),
    },
    {
      id: 'decision',
      header: 'Access Decision',
      sortable: true,
      cell: (_, row) => {
        const d = decisionBadgeMap[row.decision] || { status: 'neutral', label: row.decision }
        return (
          <StatusPill status={d.status} dot>
            {d.label}
          </StatusPill>
        )
      },
    },
    {
      id: 'reason',
      header: 'Evaluation Details',
      cell: (_, row) => (
        <span className="text-xs text-[var(--app-text-secondary)] truncate max-w-[280px] block">
          {row.reason}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      width: '120px',
      cell: (_, row) => (
        <div className="flex items-center justify-end">
          {row.decision.startsWith('DENIED') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setOverrideMember({ id: row.memberId, name: row.memberName, memberCode: row.memberCode, status: 'past_due' })
                setOverrideModalOpen(true)
              }}
              icon={<KeyRound className="w-3.5 h-3.5" />}
            >
              Override
            </Button>
          )}
        </div>
      ),
    },
  ]

  const totalGranted = logs.filter((l) => l.decision === 'GRANTED').length
  const totalDenied = logs.filter((l) => l.decision.startsWith('DENIED')).length

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--app-text-primary)] tracking-tight">
            Turnstile Access Control & Attendance
          </h1>
          <p className="text-sm text-[var(--app-text-secondary)] mt-1">
            Real-time optical turnstile scanner, RFID access decision engine, past-due blocks, and floor occupancy.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setOverrideMember(null)
              setOverrideModalOpen(true)
            }}
            icon={<KeyRound className="w-3.5 h-3.5" />}
          >
            Staff Override
          </Button>
          <Button
            variant={isEmergencyUnlocked ? 'primary' : 'danger'}
            onClick={() => setEmergencyModalOpen(true)}
            icon={<AlertOctagon className="w-4 h-4" />}
          >
            {isEmergencyUnlocked ? 'Reset Emergency Mode' : 'EMERGENCY EVACUATION'}
          </Button>
        </div>
      </div>

      {/* Emergency Active Alert Banner */}
      {isEmergencyUnlocked && (
        <div className="p-4 rounded-2xl bg-[var(--app-danger)]/20 border border-[var(--app-danger)]/40 text-xs text-[var(--app-danger)] flex items-center justify-between shadow-lg shadow-[var(--app-danger)]/10 animate-pulse">
          <div className="flex items-center gap-3">
            <AlertOctagon className="w-6 h-6 shrink-0" />
            <div>
              <p className="font-bold text-sm">EMERGENCY EVACUATION MODE ACTIVATED</p>
              <p className="mt-0.5">All physical turnstile gates are magnetically unlocked for unrestricted emergency exit.</p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setEmergencyModalOpen(true)}
          >
            Clear & Re-Lock
          </Button>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Live Floor Occupancy"
          value={occupancy.currentCount}
          suffix={` / ${occupancy.maxCapacity}`}
          icon={<Users className="w-5 h-5 text-[var(--aurora-1)]" />}
        />
        <StatCard
          label="Today's Total Scans"
          value={logs.length}
          icon={<CheckCircle className="w-5 h-5 text-[var(--app-success)]" />}
        />
        <StatCard
          label="Denied Access Attempts"
          value={totalDenied}
          icon={<XCircle className="w-5 h-5 text-[var(--app-danger)]" />}
        />
        <StatCard
          label="Gate Hardware Status"
          value={isEmergencyUnlocked ? 'EVACUATION' : '3/3 ONLINE'}
          icon={<Radio className="w-5 h-5 text-[var(--app-info)]" />}
        />
      </div>

      {/* Rapid Turnstile Scanner Simulator Console */}
      <GlassCard padding="md" className="space-y-4 border border-[var(--aurora-1)]/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--app-glass-border)]">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-[var(--aurora-1)]" />
            <h3 className="font-display text-sm font-semibold text-[var(--app-text-primary)]">
              Rapid Optical QR / RFID Turnstile Scanner
            </h3>
          </div>
          <span className="text-[0.6875rem] font-mono text-[var(--app-text-muted)]">
            Connected Gate: Gate 1 Main Entrance (Powai)
          </span>
        </div>

        {/* Scan Input & Quick Simulation Presets */}
        <div className="space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (scanQuery.trim()) handleSimulateScan(scanQuery)
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              placeholder="Scan or enter Member Code, Phone, or Name (e.g. Arjun, Rohan, 9820011111)…"
              value={scanQuery}
              onChange={(e) => setScanQuery(e.target.value)}
              className="flex-1 h-11 px-4 text-xs font-mono glass-input text-[var(--app-text-primary)] placeholder:text-[var(--app-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--app-focus-ring)]"
            />
            <Button type="submit" variant="primary" icon={<QrCode className="w-4 h-4" />}>
              Scan Gate
            </Button>
          </form>

          {/* Quick Simulation Presets */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[0.6875rem] uppercase font-semibold text-[var(--app-text-muted)]">
              Quick Test Simulation:
            </span>
            <button
              type="button"
              onClick={() => handleSimulateScan('mem_001')}
              className="px-2.5 py-1 rounded-lg text-[0.6875rem] font-semibold bg-[var(--app-success)]/10 text-[var(--app-success)] border border-[var(--app-success)]/20 hover:bg-[var(--app-success)]/20 transition-all"
            >
              ✓ Arjun Mehta (Valid Plan)
            </button>
            <button
              type="button"
              onClick={() => handleSimulateScan('mem_004')}
              className="px-2.5 py-1 rounded-lg text-[0.6875rem] font-semibold bg-[var(--app-danger)]/10 text-[var(--app-danger)] border border-[var(--app-danger)]/20 hover:bg-[var(--app-danger)]/20 transition-all"
            >
              ✕ Rohan Deshmukh (Past Due ₹5,310)
            </button>
            <button
              type="button"
              onClick={() => handleSimulateScan('mem_003')}
              className="px-2.5 py-1 rounded-lg text-[0.6875rem] font-semibold bg-[var(--app-info)]/10 text-[var(--app-info)] border border-[var(--app-info)]/20 hover:bg-[var(--app-info)]/20 transition-all"
            >
              ⏸ Vikram Singh (Frozen Pause)
            </button>
            <button
              type="button"
              onClick={() => handleSimulateScan('mem_007')}
              className="px-2.5 py-1 rounded-lg text-[0.6875rem] font-semibold bg-[var(--app-warning)]/10 text-[var(--app-warning)] border border-[var(--app-warning)]/20 hover:bg-[var(--app-warning)]/20 transition-all"
            >
              ⚠ Deepak Verma (Wrong Branch)
            </button>
          </div>
        </div>

        {/* Live Scan Result Card */}
        <AnimatePresence mode="wait">
          {lastScanResult && (
            <motion.div
              key={lastScanResult.entry.id}
              initial={{ opacity: 0, scale: 0.98, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className={cn(
                'p-4 rounded-2xl border transition-all mt-2',
                lastScanResult.entry.decision === 'GRANTED'
                  ? 'glass-card border-[var(--app-success)]/40 shadow-lg shadow-[var(--app-success)]/10'
                  : 'glass-card border-[var(--app-danger)]/40 shadow-lg shadow-[var(--app-danger)]/10'
              )}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-bold shadow-md shrink-0',
                      lastScanResult.entry.decision === 'GRANTED'
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                        : 'bg-gradient-to-br from-rose-500 to-red-600'
                    )}
                  >
                    {lastScanResult.entry.decision === 'GRANTED' ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <XCircle className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-display text-base font-bold text-[var(--app-text-primary)]">
                        {lastScanResult.entry.memberName}
                      </h4>
                      <StatusPill
                        status={decisionBadgeMap[lastScanResult.entry.decision]?.status || 'neutral'}
                        dot
                      >
                        {decisionBadgeMap[lastScanResult.entry.decision]?.label}
                      </StatusPill>
                    </div>
                    <p className="text-xs font-mono text-[var(--app-text-muted)] mt-0.5">
                      {lastScanResult.entry.memberCode} · {lastScanResult.entry.memberPhone}
                    </p>
                    <p className="text-xs text-[var(--app-text-secondary)] mt-1">
                      {lastScanResult.entry.reason}
                    </p>
                  </div>
                </div>

                {/* Instant Actions for Denied Result */}
                {lastScanResult.entry.decision.startsWith('DENIED') && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setOverrideMember(lastScanResult.member)
                        setOverrideModalOpen(true)
                      }}
                      icon={<KeyRound className="w-3.5 h-3.5" />}
                    >
                      Staff Override
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>

      {/* Main Tabs: Live Stream vs Occupancy Heatmap */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="glass-input p-1">
          <TabsTrigger value="live">Live Turnstile Access Logs</TabsTrigger>
          <TabsTrigger value="heatmap">Occupancy & Peak Hours Heatmap</TabsTrigger>
        </TabsList>

        {/* TAB 1: Live Access Stream */}
        <TabsContent value="live" className="space-y-4 pt-4">
          <GlassCard padding="sm">
            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--app-text-muted)]" />
                <input
                  type="text"
                  placeholder="Filter logs by member name, code, or phone…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-10 pl-9 pr-4 text-xs glass-input text-[var(--app-text-primary)] placeholder:text-[var(--app-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--app-focus-ring)] transition-all"
                />
              </div>

              <div className="w-full md:w-44">
                <Select value={decisionFilter} onValueChange={setDecisionFilter}>
                  <SelectTrigger><SelectValue placeholder="Decision: All" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Decisions</SelectItem>
                    <SelectItem value="GRANTED">Granted Only</SelectItem>
                    <SelectItem value="DENIED">All Denied</SelectItem>
                    <SelectItem value="MANUAL_OVERRIDE">Manual Overrides</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full md:w-36">
                <Select value={branchFilter} onValueChange={setBranchFilter}>
                  <SelectTrigger><SelectValue placeholder="Branch: Powai" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pow">Powai</SelectItem>
                    <SelectItem value="and">Andheri</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </GlassCard>

          <DataTable<AccessLogEntry>
            columns={columns}
            data={logs}
            status="success"
            page={1}
            pageSize={logs.length}
            total={logs.length}
            getRowId={(row) => row.id}
            emptyTitle="No access log records match your filter"
            emptyDescription="Turnstile scan evaluations will appear here in real-time."
          />
        </TabsContent>

        {/* TAB 2: Occupancy Heatmap */}
        <TabsContent value="heatmap" className="pt-4">
          <OccupancyHeatmap />
        </TabsContent>
      </Tabs>

      {/* Emergency Evacuation Modal */}
      <EmergencyModal
        open={emergencyModalOpen}
        onOpenChange={setEmergencyModalOpen}
        isUnlocked={isEmergencyUnlocked}
        branchId={branchFilter}
        onTriggered={refreshData}
      />

      {/* Manual Override Modal */}
      <ManualOverrideModal
        member={overrideMember}
        open={overrideModalOpen}
        onOpenChange={setOverrideModalOpen}
        onOverridden={refreshData}
      />
    </div>
  )
}
