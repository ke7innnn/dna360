'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Users, UserPlus, Search, Download,
  CheckCircle2, Clock, AlertTriangle, ShieldAlert,
  ArrowUpDown, Eye, Plus,
} from 'lucide-react'
import { Button } from '@/components/app/ui/button'
import { Badge } from '@/components/app/ui/badge'
import { StrandMeter } from '@/components/app/ui/StrandMeter'
import { DataTable, type DataTableColumn } from '@/components/app/ui/data-table'
import MemberProfileDrawer from '@/components/app/members/MemberProfileDrawer'
import MemberOnboardingModal from '@/components/app/members/MemberOnboardingModal'
import FreezeMemberModal from '@/components/app/members/FreezeMemberModal'
import RenewMemberModal from '@/components/app/members/RenewMemberModal'
import { getMembers } from '@/lib/members'
import { formatINR } from '@/lib/gst'
import { getInitials } from '@/lib/utils'
import type { Member, MemberStatus } from '@/types/member'
import { toast } from '@/components/app/ui/toast'
import { cn } from '@/lib/utils'

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'grace_period' | 'expiring_soon' | 'inactive' | 'blacklisted'>('all')
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [freezeMember, setFreezeMember] = useState<Member | null>(null)
  const [renewMember, setRenewMember] = useState<Member | null>(null)
  const [page, setPage] = useState(1)
  const pageSize = 15

  const refreshMembers = () => {
    const list = getMembers({
      search,
      status: statusFilter,
    })
    setMembers(list)
  }

  useEffect(() => {
    refreshMembers()
    const handleUpdate = () => refreshMembers()
    window.addEventListener('dna360_members_updated', handleUpdate)
    return () => window.removeEventListener('dna360_members_updated', handleUpdate)
  }, [search, statusFilter])

  // Real Counts for the Filter Chips
  const counts = useMemo(() => {
    const all = getMembers({})
    return {
      all: all.length,
      active: all.filter((m) => m.status === 'active').length,
      grace_period: all.filter((m) => m.status === 'grace_period').length,
      expiring_soon: all.filter((m) => m.status === 'expiring_soon').length,
      inactive: all.filter((m) => m.status === 'inactive').length,
      blacklisted: all.filter((m) => m.status === 'blacklisted').length,
    }
  }, [members])

  // Filter Chip Config
  const filterChips: { id: typeof statusFilter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'active', label: 'Active', count: counts.active },
    { id: 'grace_period', label: 'Grace Period', count: counts.grace_period },
    { id: 'expiring_soon', label: 'Expiring 30d', count: counts.expiring_soon },
    { id: 'inactive', label: 'Expired', count: counts.inactive },
    { id: 'blacklisted', label: 'Blocked', count: counts.blacklisted },
  ]

  // Columns for 44px Dense Table
  const columns: DataTableColumn<Member>[] = [
    {
      id: 'member',
      header: 'Member',
      accessorKey: 'name',
      sortable: true,
      cell: (_, row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[var(--r-sm)] bg-[var(--surface-sunken)] border border-[var(--line-strong)] flex items-center justify-center font-ui text-[11px] font-semibold text-[var(--text)] shrink-0">
            {getInitials(row.name)}
          </div>
          <div>
            <p className="font-ui font-medium text-[13.5px] text-[var(--text)] hover:text-[var(--teal)] transition-colors leading-tight">
              {row.name}
            </p>
            <div className="flex items-center gap-1.5 font-data text-[11px] text-[var(--text-faint)] mt-0.5 tabular-nums">
              <span>{row.member_code}</span>
              <span>·</span>
              <span>{row.phone}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'branchPlan',
      header: 'Package & Expiry',
      sortable: true,
      cell: (_, row) => {
        const primaryPlan = row.active_memberships[0]
        return (
          <div className="max-w-[280px]">
            <span className="font-ui text-[13px] font-medium text-[var(--text)] block leading-tight">
              {primaryPlan?.product_name || 'No Active Plan'}
            </span>
            <p className="font-ui text-[11px] text-[var(--text-faint)] mt-0.5">
              {primaryPlan?.expiry_date ? `Expires: ${primaryPlan.expiry_date}` : 'Expired / None'}
            </p>
          </div>
        )
      },
    },
    {
      id: 'sessions',
      header: 'Sessions Remaining',
      align: 'left',
      cell: (_, row) => {
        const primaryPlan = row.active_memberships[0]
        const remaining = primaryPlan?.sessions_remaining
        const total = primaryPlan?.sessions_total

        if (typeof remaining === 'number' && typeof total === 'number' && total > 0) {
          return (
            <div className="flex items-center gap-2">
              <StrandMeter
                value={remaining}
                max={total}
                capsules={5}
                size="sm"
              />
              <span className="font-data text-xs tabular-nums text-[var(--text)] font-medium">
                {remaining}/{total}
              </span>
            </div>
          )
        }

        return (
          <span className="font-ui text-[11px] text-[var(--text-faint)]">
            Unlimited
          </span>
        )
      },
    },
    {
      id: 'status',
      header: 'Status',
      align: 'left',
      cell: (_, row) => {
        const statusMap: Record<MemberStatus, { status: 'ok' | 'warn' | 'danger' | 'neutral'; label: string }> = {
          active: { status: 'ok', label: 'Active' },
          expiring_soon: { status: 'warn', label: 'Expiring Soon' },
          grace_period: { status: 'warn', label: 'Grace Period' },
          inactive: { status: 'neutral', label: 'Expired' },
          blacklisted: { status: 'danger', label: 'Blocked' },
        }
        const s = statusMap[row.status] || { status: 'neutral', label: row.status }
        return (
          <Badge status={s.status} size="sm">
            {s.label}
          </Badge>
        )
      },
    },
    {
      id: 'streak',
      header: 'Attendance Streak',
      align: 'left',
      cell: (_, row) => {
        const streak = row.attendance_streak || 0
        return (
          <div className="flex items-center gap-2">
            <StrandMeter value={Math.min(streak, 7)} max={7} capsules={7} size="sm" />
            <span className="font-data text-xs tabular-nums text-[var(--text)]">
              {streak}d
            </span>
          </div>
        )
      },
    },
    {
      id: 'ltv',
      header: 'Lifetime Value',
      align: 'right',
      sortable: true,
      cell: (_, row) => (
        <span className="font-data text-[13px] font-medium text-[var(--text)] tabular-nums">
          {formatINR(row.lifetime_value || (row.active_memberships[0]?.amount_paid || 0))}
        </span>
      ),
    },
  ]

  const pagedMembers = members.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <span className="font-ui text-[11px] uppercase tracking-[0.06em] font-semibold text-[var(--text-faint)]">
            Member Operations
          </span>
          <h1 className="font-display text-[28px] sm:text-[30px] leading-[34px] font-semibold text-[var(--text)] tracking-[-0.02em] mt-0.5">
            Member Directory
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setOnboardingOpen(true)}
            icon={<UserPlus className="w-3.5 h-3.5" />}
          >
            Enrol Member
          </Button>
        </div>
      </div>

      {/* Filter Chips & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 select-none">
          {filterChips.map((chip) => {
            const isSelected = statusFilter === chip.id
            return (
              <button
                key={chip.id}
                onClick={() => {
                  setStatusFilter(chip.id)
                  setPage(1)
                }}
                className={cn(
                  'inline-flex items-center gap-1.5 h-[30px] px-3 font-ui text-xs font-medium rounded-full cursor-pointer transition-colors duration-140 whitespace-nowrap',
                  isSelected
                    ? 'bg-[var(--surface-raised)] border border-[var(--line-strong)] text-[var(--text)] shadow-sm'
                    : 'bg-[var(--surface-sunken)] border border-[var(--line)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-raised)]'
                )}
              >
                <span>{chip.label}</span>
                <span className={cn(
                  'font-data text-[11px] tabular-nums font-semibold',
                  isSelected ? 'text-[var(--teal)]' : 'text-[var(--text-faint)]'
                )}>
                  {chip.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-faint)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search by name, phone or code..."
            className="w-full h-[32px] pl-8 pr-3 font-ui text-xs rounded-[var(--r-sm)] bg-[var(--surface-sunken)] border border-[var(--line)] text-[var(--text)] placeholder:text-[var(--text-faint)] focus:border-[var(--line-strong)] focus:ring-[2px] focus:ring-[var(--teal-dim)] outline-none transition-all"
          />
        </div>
      </div>

      {/* 44px Dense Table */}
      <DataTable
        columns={columns}
        data={pagedMembers}
        status="success"
        total={members.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onRowClick={(row) => {
          setSelectedMember(row)
          setDrawerOpen(true)
        }}
        isFilterActive={statusFilter !== 'all' || !!search}
        onClearFilters={() => {
          setStatusFilter('all')
          setSearch('')
          setPage(1)
        }}
      />

      {/* Member Profile Drawer */}
      <MemberProfileDrawer
        member={selectedMember}
        open={drawerOpen}
        onOpenChange={(op) => {
          setDrawerOpen(op)
          if (!op) setSelectedMember(null)
        }}
        onMemberUpdated={() => refreshMembers()}
      />

      {/* Modals */}
      <MemberOnboardingModal
        open={onboardingOpen}
        onOpenChange={setOnboardingOpen}
        onMemberCreated={() => refreshMembers()}
      />

      <FreezeMemberModal
        member={freezeMember}
        open={!!freezeMember}
        onOpenChange={(op) => { if (!op) setFreezeMember(null) }}
        onUpdated={() => {
          setFreezeMember(null)
          refreshMembers()
        }}
      />

      <RenewMemberModal
        member={renewMember}
        open={!!renewMember}
        onOpenChange={(op) => { if (!op) setRenewMember(null) }}
        onUpdated={() => {
          setRenewMember(null)
          refreshMembers()
        }}
      />
    </div>
  )
}
