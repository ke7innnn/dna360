'use client'

import React, { useState, useMemo, useEffect, useRef } from 'react'
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
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Filter,
} from 'lucide-react'
import { Modal } from '@/components/app/ui/modal'
import { Button } from '@/components/app/ui/button'
import { Input } from '@/components/app/ui/input'
import {
  getStoredLockers,
  assignLocker,
  releaseLocker,
  toggleLockerMaintenance,
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

  // Integrated Inline Allocation Drawer State (No Nested Modals!)
  const [activeLockerForAssign, setActiveLockerForAssign] = useState<Locker | null>(null)
  const [assignmentType, setAssignmentType] = useState<'daily' | 'rental'>('daily')
  const [rentalMonths, setRentalMonths] = useState<number>(1)
  const [keyTagInput, setKeyTagInput] = useState('')

  // Member Search within Drawer
  const [isGuestMode, setIsGuestMode] = useState(false)
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [memberSearchQuery, setMemberSearchQuery] = useState('')
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const memberSearchInputRef = useRef<HTMLInputElement>(null)

  // Fast Inline Maintenance Toggle State
  const [maintLockerId, setMaintLockerId] = useState<string | null>(null)
  const [maintReason, setMaintReason] = useState('')

  const reloadData = () => {
    setLockers(getStoredLockers())
    setMembers(getStoredMembers())
  }

  useEffect(() => {
    if (open) {
      reloadData()
      setActiveLockerForAssign(null)
      setMaintLockerId(null)
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
      .slice(0, 6)
  }, [members, memberSearchQuery])

  // 1-Click Return / Check-in
  const handleQuickRelease = (locker: Locker) => {
    const memberName = locker.assignedMemberName || 'Guest'
    releaseLocker(locker.id)
    reloadData()
    if (onLockersUpdated) onLockersUpdated()
    toast.success(`Locker #${locker.number} returned by ${memberName} · Now Available`)
  }

  // Open Inline Allocation Drawer
  const openAssignDrawer = (locker: Locker) => {
    setActiveLockerForAssign(locker)
    setAssignmentType('daily')
    setRentalMonths(1)
    setKeyTagInput(
      locker.keyTag ||
        `KEY-${locker.zone.charAt(0).toUpperCase()}-${String(locker.number).slice(-2)}`
    )
    setSelectedMember(null)
    setMemberSearchQuery('')
    setIsGuestMode(false)
    setGuestName('')
    setGuestPhone('')
    setMaintLockerId(null)
  }

  // Auto Assign Next Free Locker
  const handleAutoAssign = (zone: 'Male' | 'Female' | 'VIP') => {
    const free = lockers.find((l) => l.zone === zone && l.status === 'available')
    if (!free) {
      toast.error(`No available lockers in ${zone} zone!`)
      return
    }
    openAssignDrawer(free)
  }

  // Confirm Assignment
  const handleConfirmAssign = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeLockerForAssign) return

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
      lockerId: activeLockerForAssign.id,
      memberId,
      memberName,
      memberPhone,
      assignmentType,
      durationMonths: assignmentType === 'rental' ? rentalMonths : 0,
      keyTag: keyTagInput.trim() || undefined,
    })

    reloadData()
    if (onLockersUpdated) onLockersUpdated()
    const issuedNumber = activeLockerForAssign.number
    const issuedZone = activeLockerForAssign.zone
    setActiveLockerForAssign(null)

    toast.success(
      `Locker #${issuedNumber} (${issuedZone}) allocated to ${memberName} · ${
        assignmentType === 'rental' ? `${rentalMonths}-Month Rental` : 'Daily Floor Session'
      }`
    )
  }

  // Inline Maintenance Execution
  const handleToggleMaintenance = (locker: Locker) => {
    if (locker.status === 'maintenance') {
      toggleLockerMaintenance(locker.id)
      reloadData()
      if (onLockersUpdated) onLockersUpdated()
      setMaintLockerId(null)
      toast.success(`Locker #${locker.number} restored to Available`)
    } else {
      setMaintLockerId(locker.id)
      setMaintReason('')
    }
  }

  const confirmMaintenance = (lockerId: string) => {
    const reason = maintReason.trim() || 'Lock maintenance / repair needed'
    toggleLockerMaintenance(lockerId, reason)
    reloadData()
    if (onLockersUpdated) onLockersUpdated()
    setMaintLockerId(null)
    toast.info(`Locker updated to Under Maintenance`)
  }

  return (
    <Modal
      open={open}
      onOpenChange={(val) => {
        if (!val) {
          setActiveLockerForAssign(null)
          setMaintLockerId(null)
        }
        onOpenChange(val)
      }}
      title="Floor Locker Operations & Key Registry"
      description="Powai Flagship · 48 Smart Floor Lockers with instant 1-click issuance & returns"
      size="xl"
    >
      <div className="space-y-3 font-sans">
        {/* ─── 1. SLIM HIGH-EFFICIENCY STATUS RIBBON ─── */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-[#080D18] border border-white/[0.08]">
          {/* Quick Metrics */}
          <div className="flex items-center gap-2 overflow-x-auto text-xs py-0.5">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 font-semibold">
              <Unlock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Available:</span>
              <span className="font-bold tabular-nums text-emerald-200">
                {stats.available} / {stats.total}
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#38BDF8]/10 border border-[#38BDF8]/25 text-[#38BDF8] font-semibold">
              <KeyRound className="w-3.5 h-3.5" />
              <span>In Session:</span>
              <span className="font-bold tabular-nums text-white">
                {stats.dailyInUse}
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-300 font-semibold">
              <Lock className="w-3.5 h-3.5" />
              <span>Rentals:</span>
              <span className="font-bold tabular-nums text-white">
                {stats.rentals}
              </span>
            </div>

            {stats.maintenance > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/25 text-red-300 font-semibold">
                <Wrench className="w-3.5 h-3.5" />
                <span>Offline:</span>
                <span className="font-bold tabular-nums text-white">
                  {stats.maintenance}
                </span>
              </div>
            )}
          </div>

          {/* Rapid Auto-Assign Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-semibold text-white/40 hidden sm:inline">
              Quick Assign:
            </span>
            <button
              type="button"
              onClick={() => handleAutoAssign('Male')}
              className="px-2.5 py-1 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-xs font-semibold text-blue-300 flex items-center gap-1 transition-all cursor-pointer"
            >
              <Zap className="w-3 h-3 text-blue-400" />
              <span>+ Male</span>
            </button>
            <button
              type="button"
              onClick={() => handleAutoAssign('Female')}
              className="px-2.5 py-1 rounded-lg bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/30 text-xs font-semibold text-pink-300 flex items-center gap-1 transition-all cursor-pointer"
            >
              <Zap className="w-3 h-3 text-pink-400" />
              <span>+ Female</span>
            </button>
            <button
              type="button"
              onClick={() => handleAutoAssign('VIP')}
              className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-xs font-semibold text-amber-300 flex items-center gap-1 transition-all cursor-pointer"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>+ VIP</span>
            </button>
          </div>
        </div>

        {/* ─── 2. TOOLBAR: SEARCH & FILTERS ─── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          {/* Instant Search Bar */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search locker number (e.g. 104), member name, phone, or key..."
              className="w-full bg-[#080B12] border border-white/[0.12] focus:border-[#38BDF8] text-white text-xs rounded-xl pl-8.5 pr-8 py-2 focus:outline-none transition-all shadow-inner"
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

          {/* Floor Zone Tabs */}
          <div className="flex items-center gap-1 p-0.5 rounded-xl bg-[#080B12] border border-white/[0.08] shrink-0">
            {[
              { id: 'all', label: `All (${lockers.length})` },
              { id: 'Male', label: 'Male' },
              { id: 'Female', label: 'Female' },
              { id: 'VIP', label: 'VIP' },
            ].map((zone) => (
              <button
                key={zone.id}
                type="button"
                onClick={() => setSelectedZone(zone.id)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                  selectedZone === zone.id
                    ? 'bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/30 shadow-xs'
                    : 'text-white/50 hover:text-white border border-transparent'
                )}
              >
                {zone.label}
              </button>
            ))}
          </div>

          {/* Status Filter & View Toggle */}
          <div className="flex items-center gap-1.5 shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="h-8 px-2.5 rounded-xl bg-[#080B12] border border-white/[0.12] text-xs text-white/80 focus:border-[#38BDF8] outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="available">Available Only</option>
              <option value="occupied">In Session</option>
              <option value="dedicated_rental">Rentals</option>
              <option value="maintenance">Maintenance</option>
            </select>

            <div className="flex items-center p-0.5 rounded-xl bg-[#080B12] border border-white/[0.08]">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-1.5 rounded-lg transition-all',
                  viewMode === 'grid'
                    ? 'bg-[#38BDF8]/20 text-[#38BDF8]'
                    : 'text-white/40 hover:text-white'
                )}
                title="Visual Floor Grid"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={cn(
                  'p-1.5 rounded-lg transition-all',
                  viewMode === 'table'
                    ? 'bg-[#38BDF8]/20 text-[#38BDF8]'
                    : 'text-white/40 hover:text-white'
                )}
                title="Active Key Registry"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ─── 3. MAIN WORKSPACE: SPLIT GRID & ALLOCATION PANEL ─── */}
        <div className="relative flex gap-3 min-h-[460px] max-h-[62vh] overflow-hidden">
          {/* LEFT: LOCKER TILES OR REGISTRY LIST */}
          <div
            className={cn(
              'flex-1 overflow-y-auto pr-1 transition-all duration-200',
              activeLockerForAssign ? 'hidden md:block md:w-3/5' : 'w-full'
            )}
          >
            {filteredLockers.length === 0 ? (
              <div className="py-16 text-center text-xs text-white/40 space-y-2">
                <KeyRound className="w-8 h-8 mx-auto text-white/20" />
                <p>No lockers found matching &quot;{searchQuery}&quot;.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setStatusFilter('all')
                    setSelectedZone('all')
                  }}
                  className="text-xs text-[#38BDF8] hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              /* CLEAN RESPONSIVE LOCKER CARDS */
              <div
                className={cn(
                  'grid gap-2.5',
                  activeLockerForAssign
                    ? 'grid-cols-2 lg:grid-cols-3'
                    : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
                )}
              >
                {filteredLockers.map((lck) => {
                  const isAvailable = lck.status === 'available'
                  const isDaily = lck.status === 'occupied'
                  const isRental = lck.status === 'dedicated_rental'
                  const isMaint = lck.status === 'maintenance'
                  const isCurrentlyActive = activeLockerForAssign?.id === lck.id

                  return (
                    <div
                      key={lck.id}
                      className={cn(
                        'p-3 rounded-xl border transition-all flex flex-col justify-between relative group',
                        isCurrentlyActive &&
                          'ring-2 ring-[#38BDF8] border-[#38BDF8] bg-[#38BDF8]/10 shadow-md',
                        !isCurrentlyActive &&
                          isAvailable &&
                          'bg-emerald-500/[0.03] border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-500/[0.06]',
                        !isCurrentlyActive &&
                          isDaily &&
                          'bg-[#38BDF8]/[0.04] border-[#38BDF8]/25 hover:border-[#38BDF8]/50',
                        !isCurrentlyActive &&
                          isRental &&
                          'bg-amber-500/[0.04] border-amber-500/25 hover:border-amber-500/50',
                        !isCurrentlyActive &&
                          isMaint &&
                          'bg-red-500/[0.04] border-red-500/25 opacity-85'
                      )}
                    >
                      {/* Top Header: Locker # & Zone Tag */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-white tabular-nums">
                            #{lck.number}
                          </span>
                          <span
                            className={cn(
                              'text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border',
                              lck.zone === 'Male' &&
                                'bg-blue-500/10 text-blue-300 border-blue-500/20',
                              lck.zone === 'Female' &&
                                'bg-pink-500/10 text-pink-300 border-pink-500/20',
                              lck.zone === 'VIP' &&
                                'bg-amber-500/10 text-amber-300 border-amber-500/20'
                            )}
                          >
                            {lck.zone}
                          </span>
                        </div>

                        {/* Status Indicator */}
                        <div className="flex items-center gap-1">
                          <span
                            className={cn(
                              'w-2 h-2 rounded-full shrink-0',
                              isAvailable && 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]',
                              isDaily && 'bg-[#38BDF8] shadow-[0_0_6px_rgba(56,189,248,0.5)]',
                              isRental && 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]',
                              isMaint && 'bg-red-400'
                            )}
                          />
                          <span
                            className={cn(
                              'text-[10px] font-semibold capitalize',
                              isAvailable && 'text-emerald-400',
                              isDaily && 'text-[#38BDF8]',
                              isRental && 'text-amber-300',
                              isMaint && 'text-red-400'
                            )}
                          >
                            {isAvailable
                              ? 'Open'
                              : isDaily
                              ? 'Daily'
                              : isRental
                              ? 'Rental'
                              : 'Offline'}
                          </span>
                        </div>
                      </div>

                      {/* Middle Body */}
                      <div className="my-2 min-h-[38px] flex flex-col justify-center">
                        {isAvailable && (
                          <div className="text-[11px] text-emerald-400/80 flex items-center gap-1.5">
                            <Unlock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="font-medium">Ready for allocation</span>
                          </div>
                        )}

                        {isDaily && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <div className="w-5 h-5 rounded-full bg-[#38BDF8]/20 flex items-center justify-center text-[10px] font-bold text-[#38BDF8] shrink-0">
                                {getInitials(lck.assignedMemberName || 'U')}
                              </div>
                              <span className="text-xs font-bold text-white truncate">
                                {lck.assignedMemberName}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-white/50">
                              {lck.keyTag && (
                                <span className="bg-[#38BDF8]/10 text-[#38BDF8] px-1 py-0.5 rounded font-medium tabular-nums">
                                  {lck.keyTag}
                                </span>
                              )}
                              {lck.assignedAt && (
                                <span className="tabular-nums">
                                  {new Date(lck.assignedAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {isRental && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px] font-bold text-amber-300 shrink-0">
                                {getInitials(lck.assignedMemberName || 'R')}
                              </div>
                              <span className="text-xs font-bold text-white truncate">
                                {lck.assignedMemberName}
                              </span>
                            </div>
                            <span className="text-[10px] text-amber-300/80 block tabular-nums">
                              Expires: {lck.rentalExpiryDate || 'Active'}
                            </span>
                          </div>
                        )}

                        {isMaint && (
                          <div className="text-[10.5px] text-red-300/90 leading-tight flex items-start gap-1">
                            <Wrench className="w-3 h-3 shrink-0 mt-0.5 text-red-400" />
                            <span className="truncate">{lck.notes || 'Out of order'}</span>
                          </div>
                        )}
                      </div>

                      {/* Bottom Action Row */}
                      <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-1.5">
                        {isAvailable && (
                          <>
                            <button
                              type="button"
                              onClick={() => openAssignDrawer(lck)}
                              className="flex-1 py-1 px-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Issue Key</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleMaintenance(lck)}
                              className="p-1 rounded-lg text-white/30 hover:text-red-400 transition-colors cursor-pointer"
                              title="Mark Offline for Maintenance"
                            >
                              <Wrench className="w-3 h-3" />
                            </button>
                          </>
                        )}

                        {(isDaily || isRental) && (
                          <button
                            type="button"
                            onClick={() => handleQuickRelease(lck)}
                            className="w-full py-1 px-2 rounded-lg bg-white/[0.08] hover:bg-emerald-500/25 hover:text-emerald-200 text-white font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-white/[0.08]"
                          >
                            <RotateCcw className="w-3 h-3 text-emerald-400" />
                            <span>Return Key</span>
                          </button>
                        )}

                        {isMaint && (
                          <button
                            type="button"
                            onClick={() => handleToggleMaintenance(lck)}
                            className="w-full py-1 px-2 rounded-lg bg-red-500/20 hover:bg-emerald-500/25 hover:text-emerald-300 text-red-200 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Set Available</span>
                          </button>
                        )}
                      </div>

                      {/* Inline Maintenance Prompt if clicked */}
                      {maintLockerId === lck.id && (
                        <div className="absolute inset-0 bg-[#090D18] z-20 rounded-xl p-2.5 flex flex-col justify-between border border-red-500/40">
                          <div className="space-y-1">
                            <span className="text-[11px] font-bold text-red-300 block">
                              Reason for Offline:
                            </span>
                            <input
                              type="text"
                              value={maintReason}
                              onChange={(e) => setMaintReason(e.target.value)}
                              placeholder="e.g. Battery dead / Jammed"
                              className="w-full h-7 px-2 rounded bg-black/40 border border-white/[0.1] text-xs text-white outline-none"
                              autoFocus
                            />
                          </div>
                          <div className="flex items-center justify-end gap-1 pt-1">
                            <button
                              type="button"
                              onClick={() => setMaintLockerId(null)}
                              className="px-2 py-0.5 rounded text-[10px] text-white/50 hover:text-white"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => confirmMaintenance(lck.id)}
                              className="px-2 py-0.5 rounded bg-red-500/30 hover:bg-red-500/50 text-red-200 text-[10px] font-bold"
                            >
                              Mark Offline
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              /* ACTIVE KEY REGISTRY TABLE */
              <div className="rounded-xl border border-white/[0.08] bg-[#080B12] overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.08] bg-white/[0.02] text-white/50 font-semibold text-[11px]">
                      <th className="py-2 px-3">Locker #</th>
                      <th className="py-2 px-3">Zone</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Member / Visitor</th>
                      <th className="py-2 px-3">Key Tag</th>
                      <th className="py-2 px-3">Timing / Expiry</th>
                      <th className="py-2 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {filteredLockers.map((lck) => (
                      <tr
                        key={lck.id}
                        className={cn(
                          'hover:bg-white/[0.02] transition-colors',
                          activeLockerForAssign?.id === lck.id && 'bg-[#38BDF8]/10'
                        )}
                      >
                        <td className="py-2 px-3 font-bold text-white tabular-nums">
                          #{lck.number}
                        </td>
                        <td className="py-2 px-3">
                          <span className="text-[10px] font-semibold uppercase text-white/60">
                            {lck.zone}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase',
                              lck.status === 'available' &&
                                'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                              lck.status === 'occupied' &&
                                'bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/30',
                              lck.status === 'dedicated_rental' &&
                                'bg-amber-500/15 text-amber-300 border-amber-500/30',
                              lck.status === 'maintenance' &&
                                'bg-red-500/15 text-red-300 border-red-500/30'
                            )}
                          >
                            {lck.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span className="font-semibold text-white block truncate">
                            {lck.assignedMemberName ||
                              (lck.status === 'available'
                                ? '—'
                                : lck.status === 'maintenance'
                                ? 'Offline'
                                : 'Guest')}
                          </span>
                          {lck.assignedMemberPhone && (
                            <span className="text-[10px] text-white/40 tabular-nums">
                              {lck.assignedMemberPhone}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-white/70 tabular-nums">
                          {lck.keyTag || '—'}
                        </td>
                        <td className="py-2 px-3 text-white/50 text-[11px] tabular-nums">
                          {lck.status === 'dedicated_rental' ? (
                            <span>Expires {lck.rentalExpiryDate}</span>
                          ) : lck.assignedAt ? (
                            <span>
                              {new Date(lck.assignedAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {lck.status === 'available' ? (
                            <button
                              type="button"
                              onClick={() => openAssignDrawer(lck)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 font-bold text-xs transition-all cursor-pointer"
                            >
                              Issue Key
                            </button>
                          ) : lck.status === 'maintenance' ? (
                            <button
                              type="button"
                              onClick={() => handleToggleMaintenance(lck)}
                              className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-300 hover:bg-emerald-500/20 hover:text-emerald-300 font-bold text-xs transition-all cursor-pointer"
                            >
                              Restore
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleQuickRelease(lck)}
                              className="px-2.5 py-1 rounded-lg bg-white/[0.08] hover:bg-emerald-500/20 hover:text-emerald-300 text-white font-bold text-xs transition-all cursor-pointer inline-flex items-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3 text-emerald-400" />
                              <span>Return</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* RIGHT: INTEGRATED INLINE ALLOCATION PANEL (NO NESTED MODAL OVERLAY) */}
          {activeLockerForAssign && (
            <div className="w-full md:w-2/5 p-3.5 rounded-2xl bg-gradient-to-b from-[#090E1A] to-[#070A12] border border-[#38BDF8]/40 shadow-2xl flex flex-col justify-between overflow-y-auto z-10 animate-in fade-in slide-in-from-right-2 duration-200">
              <div className="space-y-3">
                {/* Header with Close */}
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#38BDF8]/20 text-[#38BDF8] flex items-center justify-center font-bold text-xs tabular-nums">
                      #{activeLockerForAssign.number}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
                        <span>Check Out Locker #{activeLockerForAssign.number}</span>
                      </h4>
                      <span className="text-[10px] text-white/50">
                        {activeLockerForAssign.zone} Floor Locker Room
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveLockerForAssign(null)}
                    className="p-1 rounded-lg text-white/40 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleConfirmAssign} className="space-y-3">
                  {/* Mode: Member vs Walk-in Guest */}
                  <div className="grid grid-cols-2 gap-1 p-0.5 rounded-xl bg-black/40 border border-white/[0.08]">
                    <button
                      type="button"
                      onClick={() => setIsGuestMode(false)}
                      className={cn(
                        'py-1 rounded-lg text-xs font-bold transition-all cursor-pointer',
                        !isGuestMode
                          ? 'bg-[#38BDF8]/25 text-[#38BDF8] shadow-xs'
                          : 'text-white/50 hover:text-white'
                      )}
                    >
                      Gym Member
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsGuestMode(true)}
                      className={cn(
                        'py-1 rounded-lg text-xs font-bold transition-all cursor-pointer',
                        isGuestMode
                          ? 'bg-[#38BDF8]/25 text-[#38BDF8] shadow-xs'
                          : 'text-white/50 hover:text-white'
                      )}
                    >
                      Walk-In Visitor
                    </button>
                  </div>

                  {/* Member Autocomplete Search */}
                  {!isGuestMode ? (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-white/80 block">
                        Search Member *
                      </label>

                      {selectedMember ? (
                        <div className="p-2.5 rounded-xl bg-[#0F172A] border border-[#38BDF8]/40 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-[#38BDF8]/20 text-[#38BDF8] flex items-center justify-center font-bold text-xs shrink-0">
                              {getInitials(selectedMember.name)}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-xs text-white block truncate">
                                {selectedMember.name}
                              </span>
                              <span className="text-[10px] text-white/50 block truncate tabular-nums">
                                {selectedMember.member_code} · {selectedMember.phone}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedMember(null)}
                            className="text-xs text-[#38BDF8] hover:underline font-semibold shrink-0"
                          >
                            Change
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                            <input
                              ref={memberSearchInputRef}
                              type="text"
                              value={memberSearchQuery}
                              onChange={(e) => setMemberSearchQuery(e.target.value)}
                              placeholder="Name, phone, or code (e.g. Kabir)..."
                              className="w-full bg-[#080B12] border border-white/[0.15] focus:border-[#38BDF8] text-white text-xs rounded-xl pl-8.5 pr-2.5 py-2 focus:outline-none"
                              autoFocus
                            />
                          </div>

                          <div className="max-h-36 overflow-y-auto rounded-xl border border-white/[0.08] bg-[#080B12] divide-y divide-white/[0.04]">
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
                                <div className="min-w-0">
                                  <span className="text-xs font-semibold text-white block truncate">
                                    {m.name}
                                  </span>
                                  <span className="text-[10px] text-white/40 block truncate tabular-nums">
                                    {m.member_code} · {m.phone}
                                  </span>
                                </div>
                                <span className="text-[10px] font-bold text-[#38BDF8] shrink-0">
                                  Select
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Guest Walk-in Inputs */
                    <div className="space-y-2">
                      <Input
                        label="Visitor / Guest Name *"
                        placeholder="e.g. Rohan Verma"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="h-8.5 text-xs"
                        required
                      />
                      <Input
                        label="Phone Number"
                        placeholder="+91 98200 00000"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        className="h-8.5 text-xs"
                      />
                    </div>
                  )}

                  {/* Allocation Type: Daily vs Dedicated Rental */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-white/80 block">
                      Key Allocation Type *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAssignmentType('daily')}
                        className={cn(
                          'p-2 rounded-xl border text-left transition-all cursor-pointer',
                          assignmentType === 'daily'
                            ? 'bg-[#38BDF8]/20 border-[#38BDF8] text-white'
                            : 'bg-white/[0.03] border-white/[0.08] text-white/60 hover:bg-white/[0.06]'
                        )}
                      >
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#38BDF8]" />
                          <span className="font-bold text-xs">Daily Session</span>
                        </div>
                        <span className="text-[10px] text-white/40 block mt-0.5">
                          Return after workout
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAssignmentType('rental')}
                        className={cn(
                          'p-2 rounded-xl border text-left transition-all cursor-pointer',
                          assignmentType === 'rental'
                            ? 'bg-amber-500/20 border-amber-500 text-white'
                            : 'bg-white/[0.03] border-white/[0.08] text-white/60 hover:bg-white/[0.06]'
                        )}
                      >
                        <div className="flex items-center gap-1">
                          <Lock className="w-3 h-3 text-amber-400" />
                          <span className="font-bold text-xs">Dedicated Rental</span>
                        </div>
                        <span className="text-[10px] text-white/40 block mt-0.5">
                          Monthly personal locker
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Dedicated Rental Options */}
                  {assignmentType === 'rental' && (
                    <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1.5">
                      <label className="text-[11px] font-bold text-amber-300 block">
                        Rental Period:
                      </label>
                      <div className="grid grid-cols-4 gap-1">
                        {[
                          { m: 1, label: '1 Mo' },
                          { m: 3, label: '3 Mo' },
                          { m: 6, label: '6 Mo' },
                          { m: 12, label: '1 Yr' },
                        ].map((dur) => (
                          <button
                            key={dur.m}
                            type="button"
                            onClick={() => setRentalMonths(dur.m)}
                            className={cn(
                              'py-1 rounded text-xs font-bold border transition-all cursor-pointer text-center tabular-nums',
                              rentalMonths === dur.m
                                ? 'bg-amber-500 text-black border-amber-400'
                                : 'bg-white/[0.05] text-white/60 border-white/[0.08]'
                            )}
                          >
                            {dur.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Physical Key Token Tag */}
                  <div>
                    <label className="text-[11px] font-semibold text-white/70 block mb-1">
                      Key Token / RFID Tag #
                    </label>
                    <input
                      type="text"
                      value={keyTagInput}
                      onChange={(e) => setKeyTagInput(e.target.value)}
                      placeholder="e.g. KEY-M-04"
                      className="w-full h-8 px-2.5 rounded-lg bg-[#080B12] border border-white/[0.15] text-xs text-white font-medium outline-none focus:border-[#38BDF8] tabular-nums"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/[0.08]">
                    <button
                      type="button"
                      onClick={() => setActiveLockerForAssign(null)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white/60 hover:text-white"
                    >
                      Cancel
                    </button>
                    <Button
                      type="submit"
                      variant="primary"
                      icon={<KeyRound className="w-3.5 h-3.5" />}
                      className="bg-gradient-to-r from-emerald-600 to-[#00C8C8] hover:opacity-90 font-bold text-xs"
                    >
                      Confirm &amp; Issue Key
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-[11px] text-white/40 pt-2 border-t border-white/[0.08]">
          <span>Powai Flagship · 48 Smart Floor Lockers</span>
          <span>Keys instantly sync with reception desk attendance &amp; turnstile</span>
        </div>
      </div>
    </Modal>
  )
}
