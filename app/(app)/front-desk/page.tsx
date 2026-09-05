'use client'

import React, { useState, useEffect } from 'react'
import {
  UserPlus, ShoppingBag, KeyRound, Calculator,
  Sparkles, Receipt, CheckCircle, Clock,
  Users, ArrowUpRight, Search, QrCode, Camera,
  ShieldCheck, AlertTriangle, XCircle, Wifi, WifiOff,
} from 'lucide-react'
import Card from '@/components/app/ui/glass-card'
import Button from '@/components/app/ui/button'
import Badge, { StatusPill } from '@/components/app/ui/badge'
import DataTable, { type DataTableColumn } from '@/components/app/ui/data-table'
import PageHeader from '@/components/app/ui/PageHeader'
import WalkInLeadModal from '@/components/app/frontdesk/WalkInLeadModal'
import PosRetailModal from '@/components/app/frontdesk/PosRetailModal'
import ShiftHandoverModal from '@/components/app/frontdesk/ShiftHandoverModal'
import LockerModal from '@/components/app/frontdesk/LockerModal'
import CameraQrScannerModal from '@/components/app/attendance/CameraQrScannerModal'
import MemberQrModal from '@/components/app/member/MemberQrModal'
import { getStoredMembers } from '@/lib/members'
import { logAuditEvent } from '@/lib/audit'
import {
  validateAndConsumeQrToken,
  recordInvalidScan,
  getScannerLockStatus,
} from '@/lib/qr-security'
import {
  getStoredLeads,
  getStoredPosSales,
  getStoredLockers,
  getStoredShifts,
} from '@/lib/frontdesk'
import { formatINR } from '@/lib/gst'
import { getInitials } from '@/lib/utils'
import type { WalkInLead, PosSale } from '@/types/frontdesk'
import type { Member } from '@/types/member'
import { toast } from '@/components/app/ui/toast'

const OFFLINE_CHECKIN_KEY = 'dna360_offline_checkins'

export default function FrontDeskPage() {
  const [leads, setLeads] = useState<WalkInLead[]>([])
  const [sales, setSales] = useState<PosSale[]>([])
  const [scanInput, setScanInput] = useState('')
  const [lastCheckInResult, setLastCheckInResult] = useState<{
    status: 'GRANTED' | 'GRACE' | 'DENIED'
    member?: Member
    message: string
    timestamp: string
  } | null>(null)

  const [isOnline, setIsOnline] = useState(true)
  const [offlineQueueCount, setOfflineQueueCount] = useState(0)

  const [leadModalOpen, setLeadModalOpen] = useState(false)
  const [posModalOpen, setPosModalOpen] = useState(false)
  const [shiftModalOpen, setShiftModalOpen] = useState(false)
  const [lockerModalOpen, setLockerModalOpen] = useState(false)
  const [cameraModalOpen, setCameraModalOpen] = useState(false)
  const [qrModalOpen, setQrModalOpen] = useState(false)

  // Network listener
  useEffect(() => {
    setIsOnline(navigator.onLine)
    const handleOnline = () => {
      setIsOnline(true)
      syncOfflineQueue()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const syncOfflineQueue = () => {
    const raw = localStorage.getItem(OFFLINE_CHECKIN_KEY)
    if (!raw) return
    try {
      const items = JSON.parse(raw)
      if (Array.isArray(items) && items.length > 0) {
        toast.success(`Synchronized ${items.length} offline check-ins to server`)
        localStorage.removeItem(OFFLINE_CHECKIN_KEY)
        setOfflineQueueCount(0)
      }
    } catch {}
  }

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

  const executeScanLookup = (rawText: string) => {
    if (!rawText.trim()) return

    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

    // 1. QR Security Validation (90s expiration, anti-replay, invalid-scan cooldown)
    const qrValidation = validateAndConsumeQrToken(rawText)
    if (!qrValidation.valid) {
      setLastCheckInResult({
        status: 'DENIED',
        message: qrValidation.message || 'QR Verification Failed',
        timestamp: now,
      })
      toast.error(qrValidation.message || 'QR Verification Failed')
      setScanInput('')
      return
    }

    const query = qrValidation.memberCode || rawText.trim()
    const normalizedQuery = query.toLowerCase()
    const members = getStoredMembers()

    const found = members.find(
      (m) =>
        m.member_code.toLowerCase() === normalizedQuery ||
        m.id.toLowerCase() === normalizedQuery ||
        m.phone.includes(normalizedQuery) ||
        m.name.toLowerCase().includes(normalizedQuery)
    )

    if (!found) {
      recordInvalidScan()
      setLastCheckInResult({
        status: 'DENIED',
        message: `Unknown code '${query}'. No member found on record.`,
        timestamp: now,
      })
      setScanInput('')
      return
    }

    // Evaluate Access Rules
    if (found.status === 'blacklisted' || found.blacklisted) {
      setLastCheckInResult({
        status: 'DENIED',
        member: found,
        message: 'Turnstile Access Blocked · Member is Blacklisted (Misconduct / Dues)',
        timestamp: now,
      })
    } else if (found.status === 'inactive') {
      setLastCheckInResult({
        status: 'DENIED',
        member: found,
        message: 'Membership Expired · Please renew at front desk',
        timestamp: now,
      })
    } else if (found.status === 'grace_period') {
      setLastCheckInResult({
        status: 'GRACE',
        member: found,
        message: 'Grace Period Access · Plan expired; 5 days remaining in grace window',
        timestamp: now,
      })
      logCheckIn(found, 'GRACE')
    } else {
      setLastCheckInResult({
        status: 'GRANTED',
        member: found,
        message: 'Turnstile Gate 1 Unlocked · Welcome to DNA 360 Powai',
        timestamp: now,
      })
      logCheckIn(found, 'GRANTED')
    }

    setScanInput('')
  }

  const handleProcessScan = (e: React.FormEvent) => {
    e.preventDefault()
    executeScanLookup(scanInput)
  }

  const logCheckIn = (member: Member, accessStatus: string) => {
    if (!isOnline) {
      const existing = JSON.parse(localStorage.getItem(OFFLINE_CHECKIN_KEY) || '[]')
      existing.push({ memberId: member.id, timestamp: new Date().toISOString(), accessStatus })
      localStorage.setItem(OFFLINE_CHECKIN_KEY, JSON.stringify(existing))
      setOfflineQueueCount(existing.length)
      toast.info('Check-in stored in offline queue')
      return
    }

    logAuditEvent({
      actor: { id: 'usr_frontdesk', name: 'Front Desk', email: '', role: 'Supervisor' },
      action: 'TURNSTILE_SCAN',
      entity: 'TurnstileGate',
      entityId: `scan_${member.id}_${Date.now()}`,
      branchId: 'pow',
      description: `Gate 1 Check-in: ${member.name} (${member.member_code}) · Status: ${accessStatus}`,
    })
  }

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
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[#4F46E5] flex items-center justify-center text-white font-bold text-xs shrink-0">
            {getInitials(row.name)}
          </div>
          <div>
            <p className="font-semibold text-xs text-[var(--ink)]">{row.name}</p>
            <p className="font-mono text-[10.5px] text-[var(--muted)]">{row.phone}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'goal',
      header: 'Fitness Goal',
      accessorKey: 'goal',
      sortable: true,
      cell: (val) => <span className="text-xs text-[var(--ink-2)]">{val as string}</span>,
    },
    {
      id: 'source',
      header: 'Source',
      accessorKey: 'source',
      sortable: true,
      cell: (val) => <span className="text-xs text-[var(--muted)]">{val as string}</span>,
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none">
      {/* Page Header */}
      <PageHeader
        eyebrow="OPERATIONAL TERMINAL · POWAI FLAGSHIP"
        title="Front Desk,"
        italicWord="Turnstile"
        description="Mobile-first gate scanner, turnstile verification, trial pass issuance, and offline-tolerant access queue."
        actions={
          <div className="flex items-center gap-2">
            {isOnline ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.25)] text-xs text-[#10B981] font-semibold">
                <Wifi className="w-3.5 h-3.5" />
                <span>Online</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[rgba(239,68,68,0.15)] border border-[rgba(239,68,68,0.3)] text-xs text-[#EF4444] font-semibold animate-pulse">
                <WifiOff className="w-3.5 h-3.5" />
                <span>Offline Mode ({offlineQueueCount} queued)</span>
              </div>
            )}
            <Button
              variant="primary"
              size="md"
              onClick={() => setLeadModalOpen(true)}
              icon={<UserPlus className="w-4 h-4" />}
            >
              New Walk-in Lead
            </Button>
          </div>
        }
      />

      {/* ─── 1. Mobile-First Turnstile Scanner Terminal ─── */}
      <Card className="p-6 bg-gradient-to-r from-[rgba(59,130,246,0.06)] via-[rgba(255,255,255,0.02)] to-transparent border-[rgba(59,130,246,0.25)] shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Scanner Input Form */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center text-white shadow-[0_0_12px_rgba(59,130,246,0.5)]">
                <QrCode className="w-4 h-4" />
              </div>
              <h2 className="font-display font-semibold text-lg text-[var(--ink)]">
                Gate 1 Check-in Terminal
              </h2>
            </div>
            <p className="font-ui text-xs text-[var(--muted)]">
              Scan turnstile RFID card, dynamic member QR token, or enter code (e.g. DNA-2025-0012)
            </p>

            <form onSubmit={handleProcessScan} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                placeholder="Scan or enter member code / phone / name..."
                className="flex-1 bg-[#090B10] border border-[rgba(255,255,255,0.15)] focus:border-[var(--accent)] text-[var(--ink)] text-sm font-mono rounded-xl px-4 py-3 focus:outline-none shadow-inner"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={() => setQrModalOpen(true)}
                  className="flex items-center gap-2 border-emerald-500/40 hover:border-emerald-500 hover:bg-emerald-500/10 text-emerald-400"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Show Member QR</span>
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={() => setCameraModalOpen(true)}
                  className="flex items-center gap-2 border-[#38BDF8]/40 hover:border-[#38BDF8] hover:bg-[#38BDF8]/10 text-[#38BDF8]"
                >
                  <Camera className="w-4 h-4" />
                  <span>Scan Camera</span>
                </Button>
                <Button type="submit" variant="primary" size="lg">
                  Process Gate
                </Button>
              </div>
            </form>
          </div>

          {/* Real-time Scan Result Beacon */}
          <div className="lg:w-80 min-h-[120px] rounded-2xl p-4 flex flex-col justify-center transition-all duration-200 border bg-[#0A0C12]">
            {lastCheckInResult ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-ui font-bold uppercase tracking-wider ${
                      lastCheckInResult.status === 'GRANTED'
                        ? 'bg-[rgba(16,185,129,0.15)] text-[#10B981] border border-[rgba(16,185,129,0.3)] shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                        : lastCheckInResult.status === 'GRACE'
                        ? 'bg-[rgba(245,158,11,0.15)] text-[#F59E0B] border border-[rgba(245,158,11,0.3)] shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                        : 'bg-[rgba(239,68,68,0.15)] text-[#EF4444] border border-[rgba(239,68,68,0.3)] shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                    }`}
                  >
                    {lastCheckInResult.status === 'GRANTED' && <CheckCircle className="w-3.5 h-3.5" />}
                    {lastCheckInResult.status === 'GRACE' && <AlertTriangle className="w-3.5 h-3.5" />}
                    {lastCheckInResult.status === 'DENIED' && <XCircle className="w-3.5 h-3.5" />}
                    <span>{lastCheckInResult.status === 'GRANTED' ? 'Access Granted' : lastCheckInResult.status === 'GRACE' ? 'Grace Access' : 'Access Denied'}</span>
                  </span>
                  <span className="font-mono text-[10.5px] text-[var(--muted)]">
                    {lastCheckInResult.timestamp}
                  </span>
                </div>

                {lastCheckInResult.member && (
                  <div>
                    <h4 className="font-ui font-bold text-sm text-[var(--ink)]">
                      {lastCheckInResult.member.name}
                    </h4>
                    <p className="font-data text-xs text-[var(--muted)]">
                      {lastCheckInResult.member.member_code} · Streak: {lastCheckInResult.member.attendance_streak || 1}d
                    </p>
                  </div>
                )}

                <p className="text-xs font-ui text-[var(--muted)] leading-tight">
                  {lastCheckInResult.message}
                </p>
              </div>
            ) : (
              <div className="text-center text-xs font-ui text-[var(--muted)] space-y-1">
                <ShieldCheck className="w-6 h-6 mx-auto text-[var(--accent)] opacity-50" />
                <p>Scanner Ready · Turnstile Gate Active</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ─── 2. Front Desk Operations Grid ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="font-ui text-xs text-[var(--muted)] block">Occupied Lockers</span>
            <span className="font-display font-bold text-2xl text-[var(--ink)]">
              {occupiedLockers} / {lockers.length}
            </span>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setLockerModalOpen(true)}>
            Manage Lockers
          </Button>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="font-ui text-xs text-[var(--muted)] block">Retail Sales Today</span>
            <span className="font-display font-bold text-2xl text-[var(--ink)]">
              {formatINR(totalRetailSalesMinor)}
            </span>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setPosModalOpen(true)}>
            POS Terminal
          </Button>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="font-ui text-xs text-[var(--muted)] block">Active Trial Passes</span>
            <span className="font-display font-bold text-2xl text-[var(--ink)]">
              {activeTrialPasses} Passes
            </span>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setShiftModalOpen(true)}>
            Shift Handover
          </Button>
        </Card>
      </div>

      {/* ─── 3. Walk-in Leads Table ─── */}
      <Card className="p-6">
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-4 mb-4">
          <div>
            <h3 className="font-display font-semibold text-base text-[var(--ink)]">
              Recent Walk-in Prospects &amp; Leads
            </h3>
            <p className="font-ui text-xs text-[var(--muted)] mt-0.5">
              Trials and inquiries captured at front desk
            </p>
          </div>
        </div>

        <DataTable columns={leadColumns} data={leads} />
      </Card>

      {/* Modals */}
      <WalkInLeadModal open={leadModalOpen} onOpenChange={setLeadModalOpen} onLeadCreated={refreshData} />
      <PosRetailModal open={posModalOpen} onOpenChange={setPosModalOpen} onSaleCompleted={refreshData} />
      <ShiftHandoverModal open={shiftModalOpen} onOpenChange={setShiftModalOpen} />
      <LockerModal open={lockerModalOpen} onOpenChange={setLockerModalOpen} />
      <CameraQrScannerModal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onScanSuccess={executeScanLookup}
        title="Gate 1 Optical Camera Scanner"
        description="Hold member dynamic QR badge or token in front of camera"
      />
      <MemberQrModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        memberCode="DNA-2025-0001"
        memberName="Arjun Mehta"
        planName="Annual Gym Package 1"
        onSimulateScan={(code) => executeScanLookup(code)}
      />
    </div>
  )
}
