'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  KeyRound,
  CheckCircle2,
  Lock,
  Unlock,
  User,
  Search,
  Wrench,
  Clock,
  Phone,
  Calendar,
  X,
  Tag,
  Zap,
  RotateCcw,
  Sparkles,
  LayoutGrid,
  List,
  AlertCircle,
  Plus,
} from 'lucide-react'
import { Modal } from '@/components/app/ui/modal'
import { Button } from '@/components/app/ui/button'
import { Input } from '@/components/app/ui/input'
import {
  getStoredLockers,
  assignLocker,
  releaseLocker,
  toggleLockerMaintenance,
  autoAssignNextLocker,
} from '@/lib/frontdesk'
import { getStoredMembers } from '@/lib/members'
import type { Locker } from '@/types/frontdesk'
import type { Member } from '@/types/member'
import { toast } from '@/components/app/ui/toast'
import { cn, getInitials } from '@/lib/utils'

interface LockerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLockersUpdated?: () => void
}

type ViewMode = 'grid' | 'table'
type StatusFilter = 'all' | 'available' | 'occupied' | 'dedicated_rental' | 'maintenance'

export default function LockerModal({
  open,
  onOpenChange,
  onLockersUpdated,
}: LockerModalProps) {
  const [lockers, setLockers] = useState<Locker[]>([])
  const [members, setMembers] = useState<Member[]>([])

  // Filters & Views
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selectedZone, setSelectedZone] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Assign Drawer / Form State
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [targetLocker, setTargetLocker] = useState<Locker | null>(null)
  const [assignmentType, setAssignmentType] = useState<'daily' | 'rental'>('daily')
  const [rentalMonths, setRentalMonths] = useState<number>(1)
  const [keyTagInput, setKeyTagInput] = useState('')

  // Member Search within Assignment Drawer
  const [isGuestMode, setIsGuestMode] = useState(false)
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [memberSearchQuery, setMemberSearchQuery] = useState('')
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)

  // Maintenance Reason Dialog State
  const [maintPromptLocker, setMaintPromptLocker] = useState<Locker | null>(null)
  const [maintReason, setMaintReason] = useState('')

  const reloadData = () => {
    setLockers(getStoredLockers())
    setMembers(getStoredMembers())
  }

  useEffect(() => {
    if (open) {
      reloadData()
    }
  }, [open])

  // KPIs
  const stats = useMemo(() => {
    const total = lockers.length
    const available = lockers.filter((l) => l.status === 'available').length
    const dailyInUse = lockers.filter((l) => l.status === 'occupied').length
    const rentals = lockers.filter((l) => l.status === 'dedicated_rental').length
    const maintenance = lockers.filter((l) => l.status === 'maintenance').length
    return { total, available, dailyInUse, rentals, maintenance }
  }, [lockers])

  // Filtered Lockers
  const filteredLockers = useMemo(() => {
    return lockers.filter((lck) => {
      // Zone filter
      if (selectedZone !== 'all') {
        if (selectedZone === 'Male' && lck.zone !== 'Male') return false
        if (selectedZone === 'Female' && lck.zone !== 'Female') return false
        if (selectedZone === 'VIP' && lck.zone !== 'VIP') return false
      }

      // Status filter
      if (statusFilter !== 'all' && lck.status !== statusFilter) return false

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesNum = String(lck.number).includes(q)
        const matchesName = lck.assignedMemberName?.toLowerCase().includes(q) ?? false
        const matchesPhone = lck.assignedMemberPhone?.includes(q) ?? false
        const matchesKey = lck.keyTag?.toLowerCase().includes(q) ?? false
        if (!matchesNum && !matchesName && !matchesPhone && !matchesKey) return false
      }

      return true
    })
  }, [lockers, selectedZone, statusFilter, searchQuery])

  // Member search results for assignment
  const filteredMembers = useMemo(() => {
    if (!memberSearchQuery.trim()) return members.slice(0, 6)
    const q = memberSearchQuery.toLowerCase()
    return members
      .filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.phone.includes(q) ||
          m.member_code.toLowerCase().includes(q) ||
          m.email?.toLowerCase().includes(q)
      )
      .slice(0, 8)
  }, [members, memberSearchQuery])

  // 1-Click Return / Check-in
  const handleQuickRelease = (locker: Locker) => {
    const memberName = locker.assignedMemberName || 'Guest'
    releaseLocker(locker.id)
    reloadData()
    if (onLockersUpdated) onLockersUpdated()
    toast.success(`Locker #${locker.number} returned by ${memberName} · Now Available`)
  }

  // Open Assign Flow
  const openAssignForLocker = (locker: Locker) => {
    setTargetLocker(locker)
    setAssignmentType('daily')
    setRentalMonths(1)
    setKeyTagInput(locker.keyTag || `KEY-${locker.zone.charAt(0).toUpperCase()}-${String(locker.number).slice(-2)}`)
    setSelectedMember(null)
    setMemberSearchQuery('')
    setIsGuestMode(false)
    setGuestName('')
    setGuestPhone('')
    setAssignModalOpen(true)
  }

  // Auto Assign Next Free Locker
  const handleAutoAssign = (zone: 'Male' | 'Female' | 'VIP') => {
    const free = lockers.find((l) => l.zone === zone && l.status === 'available')
    if (!free) {
      toast.error(`No free lockers available on ${zone} floor!`)
      return
    }
    openAssignForLocker(free)
  }

  // Confirm Assignment
  const handleConfirmAssign = (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetLocker) return

    let memberName = ''
    let memberPhone = ''
    let memberId: string | undefined = undefined

    if (isGuestMode) {
      if (!guestName.trim()) {
        toast.error('Please enter the guest / visitor name')
        return
      }
      memberName = `${guestName.trim()} (Visitor)`
      memberPhone = guestPhone.trim() || '+91 0000000000'
    } else {
      if (!selectedMember) {
        toast.error('Please search and select a gym member')
        return
      }
      memberName = selectedMember.name
      memberPhone = selectedMember.phone
      memberId = selectedMember.id
    }

    assignLocker({
      lockerId: targetLocker.id,
      memberId,
      memberName,
      memberPhone,
      assignmentType,
      durationMonths: assignmentType === 'rental' ? rentalMonths : 0,
      keyTag: keyTagInput.trim() || undefined,
    })

    reloadData()
    if (onLockersUpdated) onLockersUpdated()
    setAssignModalOpen(false)
    setTargetLocker(null)

    toast.success(
      `Locker #${targetLocker.number} (${targetLocker.zone}) checked out to ${memberName} · ${
        assignmentType === 'rental' ? `${rentalMonths}-Month Dedicated Rental` : 'Daily Floor Session'
      }`
    )
  }

  // Toggle Maintenance
  const handleToggleMaintenance = (locker: Locker) => {
    if (locker.status === 'maintenance') {
      toggleLockerMaintenance(locker.id)
      reloadData()
      if (onLockersUpdated) onLockersUpdated()
      toast.success(`Locker #${locker.number} restored to Available`)
    } else {
      setMaintPromptLocker(locker)
      setMaintReason('')
    }
  }

  const confirmMaintenance = () => {
    if (!maintPromptLocker) return
    toggleLockerMaintenance(maintPromptLocker.id, maintReason.trim() || 'Lock maintenance / repair needed')
    reloadData()
    if (onLockersUpdated) onLockersUpdated()
    setMaintPromptLocker(null)
    toast.info(`Locker #${maintPromptLocker.number} marked Under Maintenance`)
  }

  return (
    <>
      <Modal
        open={open}
        onOpenChange={onOpenChange}
        title="Floor Locker Operations & Key Management"
        description="Real-time key issuance, daily workout check-outs, dedicated member rentals, and 1-tap releases."
        size="4xl"
      >
        <div className="space-y-4">
          {/* ─── TOP KPI SUMMARY BAR ─── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-[#080B12] border border-white/[0.08]">
            <div className="flex items-center gap-3 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Unlock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400/90 block">
                  Available
                </span>
                <span className="font-mono text-lg font-black text-emerald-300">
                  {stats.available} <span className="text-xs font-normal text-white/50">/ {stats.total}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2 rounded-xl bg-[#38BDF8]/10 border border-[#38BDF8]/20">
              <div className="w-9 h-9 rounded-xl bg-[#38BDF8]/20 flex items-center justify-center text-[#38BDF8]">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#38BDF8]/90 block">
                  Daily Keys Out
                </span>
                <span className="font-mono text-lg font-black text-[#38BDF8]">
                  {stats.dailyInUse}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400/90 block">
                  Dedicated Rentals
                </span>
                <span className="font-mono text-lg font-black text-amber-300">
                  {stats.rentals}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2 rounded-xl bg-red-500/10 border border-red-500/20">
              <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400">
                <Wrench className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-red-400/90 block">
                  Maintenance
                </span>
                <span className="font-mono text-lg font-black text-red-300">
                  {stats.maintenance}
                </span>
              </div>
            </div>
          </div>

          {/* ─── FILTER & ACTION TOOLBAR ─── */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search locker #, member name, phone, or key tag..."
                className="w-full bg-[#080B12] border border-white/[0.12] focus:border-[#38BDF8] text-white text-xs rounded-xl pl-9.5 pr-8 py-2.5 focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Auto-Assign Buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] font-semibold text-white/50 hidden sm:inline">
                Auto-Assign Next:
              </span>
              <button
                type="button"
                onClick={() => handleAutoAssign('Male')}
                className="px-2.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-semibold text-white flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Zap className="w-3 h-3 text-[#38BDF8]" />
                <span>Male Free</span>
              </button>
              <button
                type="button"
                onClick={() => handleAutoAssign('Female')}
                className="px-2.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-semibold text-white flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Zap className="w-3 h-3 text-pink-400" />
                <span>Female Free</span>
              </button>
              <button
                type="button"
                onClick={() => handleAutoAssign('VIP')}
                className="px-2.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-semibold text-white flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Zap className="w-3 h-3 text-amber-400" />
                <span>VIP Free</span>
              </button>

              {/* View Mode Toggle */}
              <div className="flex items-center p-1 rounded-xl bg-white/[0.05] border border-white/[0.08] ml-1">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-1 rounded-lg transition-all',
                    viewMode === 'grid' ? 'bg-[#38BDF8]/20 text-[#38BDF8]' : 'text-white/40 hover:text-white'
                  )}
                  title="Grid Map View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={cn(
                    'p-1 rounded-lg transition-all',
                    viewMode === 'table' ? 'bg-[#38BDF8]/20 text-[#38BDF8]' : 'text-white/40 hover:text-white'
                  )}
                  title="Active Key Registry List"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* ─── ZONE TABS & STATUS PILLS ─── */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
            {/* Zone Selector */}
            <div className="flex gap-1 p-1 rounded-xl bg-[#080B12] border border-white/[0.08]">
              {[
                { id: 'all', label: `All (${lockers.length})` },
                { id: 'Male', label: `Male Floor (20)` },
                { id: 'Female', label: `Female Floor (20)` },
                { id: 'VIP', label: `Executive VIP (8)` },
              ].map((zone) => (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => setSelectedZone(zone.id)}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer',
                    selectedZone === zone.id
                      ? 'bg-[#38BDF8]/20 text-[#38BDF8] shadow-xs'
                      : 'text-white/50 hover:text-white/80'
                  )}
                >
                  {zone.label}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              {[
                { id: 'all', label: 'All' },
                { id: 'available', label: 'Available', dot: 'bg-emerald-400' },
                { id: 'occupied', label: 'In Session', dot: 'bg-[#38BDF8]' },
                { id: 'dedicated_rental', label: 'Rentals', dot: 'bg-amber-400' },
                { id: 'maintenance', label: 'Maint.', dot: 'bg-red-400' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setStatusFilter(pill.id as StatusFilter)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer border',
                    statusFilter === pill.id
                      ? 'bg-white/[0.12] text-white border-white/[0.2]'
                      : 'bg-transparent text-white/50 border-transparent hover:text-white/80'
                  )}
                >
                  {pill.dot && <span className={cn('w-1.5 h-1.5 rounded-full', pill.dot)} />}
                  <span>{pill.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ─── VIEW MODE: 1. GRID MAP ─── */}
          {viewMode === 'grid' && (
            <div className="max-h-[50vh] overflow-y-auto pr-1">
              {filteredLockers.length === 0 ? (
                <div className="py-12 text-center text-xs text-white/40 space-y-2">
                  <KeyRound className="w-8 h-8 mx-auto text-white/20" />
                  <p>No lockers match the current filter or search criteria.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                  {filteredLockers.map((lck) => {
                    const isAvailable = lck.status === 'available'
                    const isDaily = lck.status === 'occupied'
                    const isRental = lck.status === 'dedicated_rental'
                    const isMaint = lck.status === 'maintenance'

                    return (
                      <div
                        key={lck.id}
                        className={cn(
                          'p-3 rounded-2xl border transition-all flex flex-col justify-between relative group',
                          isAvailable && 'bg-emerald-500/[0.04] border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-500/[0.08]',
                          isDaily && 'bg-[#38BDF8]/[0.05] border-[#38BDF8]/30 hover:border-[#38BDF8]/60 shadow-sm',
                          isRental && 'bg-amber-500/[0.05] border-amber-500/30 hover:border-amber-500/60 shadow-sm',
                          isMaint && 'bg-red-500/[0.05] border-red-500/30 opacity-80'
                        )}
                      >
                        {/* Top Row: Locker Number + Zone + Status Dot */}
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="font-mono text-sm font-black text-white">
                            #{lck.number}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={cn(
                                'text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border',
                                lck.zone === 'Male' && 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                                lck.zone === 'Female' && 'bg-pink-500/10 text-pink-400 border-pink-500/20',
                                lck.zone === 'VIP' && 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                              )}
                            >
                              {lck.zone}
                            </span>
                            <span
                              className={cn(
                                'w-2 h-2 rounded-full shrink-0',
                                isAvailable && 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]',
                                isDaily && 'bg-[#38BDF8] shadow-[0_0_8px_rgba(56,189,248,0.5)]',
                                isRental && 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]',
                                isMaint && 'bg-red-400'
                              )}
                            />
                          </div>
                        </div>

                        {/* Middle Content */}
                        <div className="my-2.5 min-h-[36px]">
                          {isAvailable && (
                            <div className="text-[11px] text-emerald-400/80 flex items-center gap-1.5">
                              <Unlock className="w-3 h-3 text-emerald-400" />
                              <span className="font-medium">Open &amp; Ready</span>
                            </div>
                          )}

                          {isDaily && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full bg-[#38BDF8]/20 flex items-center justify-center text-[9px] font-bold text-[#38BDF8]">
                                  {getInitials(lck.assignedMemberName || 'U')}
                                </div>
                                <span className="text-xs font-semibold text-white truncate">
                                  {lck.assignedMemberName}
                                </span>
                              </div>
                              {lck.keyTag && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#38BDF8]/80 bg-[#38BDF8]/10 px-1.5 py-0.5 rounded">
                                  <Tag className="w-2.5 h-2.5" />
                                  {lck.keyTag}
                                </span>
                              )}
                            </div>
                          )}

                          {isRental && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[9px] font-bold text-amber-400">
                                  {getInitials(lck.assignedMemberName || 'R')}
                                </div>
                                <span className="text-xs font-semibold text-white truncate">
                                  {lck.assignedMemberName}
                                </span>
                              </div>
                              <span className="text-[10px] text-amber-300/80 block truncate">
                                Exp: {lck.rentalExpiryDate || 'Active'}
                              </span>
                            </div>
                          )}

                          {isMaint && (
                            <div className="text-[10.5px] text-red-400/90 leading-tight flex items-start gap-1">
                              <Wrench className="w-3 h-3 shrink-0 mt-0.5" />
                              <span className="truncate">{lck.notes || 'Out of order'}</span>
                            </div>
                          )}
                        </div>

                        {/* Bottom Actions */}
                        <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-1.5">
                          {isAvailable && (
                            <>
                              <button
                                type="button"
                                onClick={() => openAssignForLocker(lck)}
                                className="flex-1 py-1 px-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Issue Key</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleMaintenance(lck)}
                                className="p-1 rounded-lg text-white/30 hover:text-red-400 transition-colors cursor-pointer"
                                title="Mark Maintenance"
                              >
                                <Wrench className="w-3 h-3" />
                              </button>
                            </>
                          )}

                          {(isDaily || isRental) && (
                            <button
                              type="button"
                              onClick={() => handleQuickRelease(lck)}
                              className="w-full py-1 px-2 rounded-lg bg-white/[0.08] hover:bg-emerald-500/20 hover:text-emerald-300 text-white/90 text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 border border-white/[0.08]"
                            >
                              <RotateCcw className="w-3 h-3 text-emerald-400" />
                              <span>Return Key</span>
                            </button>
                          )}

                          {isMaint && (
                            <button
                              type="button"
                              onClick={() => handleToggleMaintenance(lck)}
                              className="w-full py-1 px-2 rounded-lg bg-red-500/20 hover:bg-emerald-500/20 hover:text-emerald-300 text-red-300 text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Set Available</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ─── VIEW MODE: 2. ACTIVE KEY REGISTRY (TABLE) ─── */}
          {viewMode === 'table' && (
            <div className="max-h-[50vh] overflow-y-auto rounded-xl border border-white/[0.08] bg-[#080B12]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-white/[0.02] text-white/50 font-semibold text-[11px]">
                    <th className="py-2.5 px-3">Locker #</th>
                    <th className="py-2.5 px-3">Zone</th>
                    <th className="py-2.5 px-3">Member / Visitor</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Key Tag</th>
                    <th className="py-2.5 px-3">Checked Out / Expiry</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {filteredLockers.filter((l) => l.status !== 'available').length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-white/40">
                        No active locker assignments matching current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredLockers
                      .filter((l) => l.status !== 'available')
                      .map((lck) => (
                        <tr key={lck.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-white">
                            #{lck.number}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="text-[10px] font-semibold uppercase text-white/60">
                              {lck.zone}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <div>
                              <span className="font-semibold text-white block">
                                {lck.assignedMemberName || (lck.status === 'maintenance' ? 'Locker Offline' : 'Guest')}
                              </span>
                              {lck.assignedMemberPhone && (
                                <span className="font-mono text-[10px] text-white/40">
                                  {lck.assignedMemberPhone}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            {lck.status === 'occupied' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30">
                                Daily Floor Key
                              </span>
                            )}
                            {lck.status === 'dedicated_rental' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                Dedicated Rental
                              </span>
                            )}
                            {lck.status === 'maintenance' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/15 text-red-300 border border-red-500/30">
                                Maintenance
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-white/60">
                            {lck.keyTag || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-white/50 text-[11px]">
                            {lck.status === 'dedicated_rental' ? (
                              <span>Expires {lck.rentalExpiryDate}</span>
                            ) : lck.assignedAt ? (
                              <span>{new Date(lck.assignedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {lck.status === 'maintenance' ? (
                              <button
                                type="button"
                                onClick={() => handleToggleMaintenance(lck)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 font-semibold text-[11px] transition-all cursor-pointer"
                              >
                                Restore
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleQuickRelease(lck)}
                                className="px-2.5 py-1 rounded-lg bg-white/[0.08] hover:bg-emerald-500/20 hover:text-emerald-300 text-white font-semibold text-[11px] transition-all cursor-pointer inline-flex items-center gap-1"
                              >
                                <RotateCcw className="w-3 h-3 text-emerald-400" />
                                <span>Return Key</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer Note */}
          <div className="flex items-center justify-between text-[11px] text-white/40 pt-2 border-t border-white/[0.08]">
            <span>Powai Flagship · 48 Smart Floor Lockers</span>
            <span>Keys automatically clear upon return and update front desk reception</span>
          </div>
        </div>
      </Modal>

      {/* ─── ASSIGN KEY MODAL / DRAWER ─── */}
      {targetLocker && (
        <Modal
          open={assignModalOpen}
          onOpenChange={setAssignModalOpen}
          title={`Check Out Locker #${targetLocker.number} (${targetLocker.zone} Floor)`}
          description="Allocate physical locker key or token to member or walk-in guest."
          size="lg"
        >
          <form onSubmit={handleConfirmAssign} className="space-y-4">
            {/* Mode: Member vs Guest */}
            <div className="flex items-center justify-between p-1 rounded-xl bg-[#090D18] border border-white/[0.08]">
              <button
                type="button"
                onClick={() => setIsGuestMode(false)}
                className={cn(
                  'flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                  !isGuestMode ? 'bg-[#38BDF8]/20 text-[#38BDF8] shadow-xs' : 'text-white/50 hover:text-white'
                )}
              >
                Existing Member
              </button>
              <button
                type="button"
                onClick={() => setIsGuestMode(true)}
                className={cn(
                  'flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                  isGuestMode ? 'bg-[#38BDF8]/20 text-[#38BDF8] shadow-xs' : 'text-white/50 hover:text-white'
                )}
              >
                Walk-In Guest / Visitor
              </button>
            </div>

            {/* Member Selection Flow */}
            {!isGuestMode ? (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white/80 block">
                  Search Member *
                </label>

                {selectedMember ? (
                  /* Selected Member Chip */
                  <div className="p-3 rounded-xl bg-[#0B101E] border border-[#38BDF8]/40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#38BDF8] to-blue-600 flex items-center justify-center font-bold text-white text-xs">
                        {getInitials(selectedMember.name)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white">
                            {selectedMember.name}
                          </span>
                          <span className="font-mono text-[10px] text-white/50">
                            {selectedMember.member_code}
                          </span>
                        </div>
                        <span className="text-[11px] text-white/60 font-mono">
                          {selectedMember.phone}
                        </span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedMember(null)}
                      className="text-xs h-7 px-2.5"
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  /* Search Autocomplete */
                  <div className="space-y-1.5">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                      <input
                        type="text"
                        value={memberSearchQuery}
                        onChange={(e) => setMemberSearchQuery(e.target.value)}
                        placeholder="Type member name, phone, or code (e.g. Kabir, 98200)..."
                        className="w-full bg-[#080B12] border border-white/[0.15] focus:border-[#38BDF8] text-white text-xs rounded-xl pl-9 pr-3 py-2.5 focus:outline-none"
                        autoFocus
                      />
                    </div>

                    {/* Quick Member List */}
                    <div className="max-h-40 overflow-y-auto rounded-xl border border-white/[0.08] bg-[#080B12] divide-y divide-white/[0.05]">
                      {filteredMembers.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setSelectedMember(m)
                            setMemberSearchQuery('')
                          }}
                          className="w-full p-2 text-left hover:bg-white/[0.05] transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-white/[0.08] flex items-center justify-center text-[10px] font-bold text-white">
                              {getInitials(m.name)}
                            </div>
                            <div>
                              <span className="text-xs font-semibold text-white block">
                                {m.name}
                              </span>
                              <span className="font-mono text-[10px] text-white/40">
                                {m.phone} · {m.member_code}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-semibold text-[#38BDF8]">
                            Select
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Guest Form */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Guest / Visitor Name *"
                  placeholder="e.g. Sameer Jain"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  required
                />
                <Input
                  label="Phone Number"
                  placeholder="+91 98200 00000"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                />
              </div>
            )}

            {/* Assignment Type Chips */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/80 block">
                Key Allocation Type *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAssignmentType('daily')}
                  className={cn(
                    'p-2.5 rounded-xl border text-left transition-all cursor-pointer',
                    assignmentType === 'daily'
                      ? 'bg-[#38BDF8]/20 border-[#38BDF8] text-white'
                      : 'bg-white/[0.04] border-white/[0.08] text-white/60 hover:bg-white/[0.08]'
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#38BDF8]" />
                    <span className="font-bold text-xs">Daily Workout Session</span>
                  </div>
                  <span className="text-[10px] text-white/40 block mt-0.5">
                    Floor key returned after workout
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setAssignmentType('rental')}
                  className={cn(
                    'p-2.5 rounded-xl border text-left transition-all cursor-pointer',
                    assignmentType === 'rental'
                      ? 'bg-amber-500/20 border-amber-500 text-white'
                      : 'bg-white/[0.04] border-white/[0.08] text-white/60 hover:bg-white/[0.08]'
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-bold text-xs">Dedicated Rental</span>
                  </div>
                  <span className="text-[10px] text-white/40 block mt-0.5">
                    Monthly reserved personal locker
                  </span>
                </button>
              </div>
            </div>

            {/* Rental Duration Selector */}
            {assignmentType === 'rental' && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-2">
                <label className="text-xs font-bold text-amber-300 block">
                  Dedicated Rental Duration:
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { m: 1, label: '1 Mo (₹1k)' },
                    { m: 3, label: '3 Mo (₹3k)' },
                    { m: 6, label: '6 Mo (₹5.5k)' },
                    { m: 12, label: '1 Yr (₹10k)' },
                  ].map((dur) => (
                    <button
                      key={dur.m}
                      type="button"
                      onClick={() => setRentalMonths(dur.m)}
                      className={cn(
                        'py-1.5 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer text-center',
                        rentalMonths === dur.m
                          ? 'bg-amber-500 text-black border-amber-400 shadow-sm'
                          : 'bg-white/[0.05] text-white/60 border-white/[0.08] hover:bg-white/[0.1]'
                      )}
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Key Tag / Token # */}
            <div className="space-y-1.5">
              <Input
                label="Physical Key Tag / Wristband Token #"
                placeholder="e.g. KEY-M-04 or RFID-881"
                value={keyTagInput}
                onChange={(e) => setKeyTagInput(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setAssignModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                icon={<KeyRound className="w-4 h-4 text-white" />}
                className="bg-gradient-to-r from-emerald-600 to-[#00C8C8] hover:opacity-90 font-bold"
              >
                Confirm &amp; Issue Key
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── MAINTENANCE REASON MODAL ─── */}
      {maintPromptLocker && (
        <Modal
          open={Boolean(maintPromptLocker)}
          onOpenChange={(op) => !op && setMaintPromptLocker(null)}
          title={`Mark Locker #${maintPromptLocker.number} Under Maintenance`}
          description="Take locker offline for repair, deep cleaning, or lock replacement."
          size="md"
        >
          <div className="space-y-3 pt-1">
            <Input
              label="Maintenance Reason"
              placeholder="e.g. Jammed latch / Key lost / Battery dead"
              value={maintReason}
              onChange={(e) => setMaintReason(e.target.value)}
              autoFocus
            />
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setMaintPromptLocker(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={confirmMaintenance}
                icon={<Wrench className="w-4 h-4" />}
              >
                Mark Maintenance
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
