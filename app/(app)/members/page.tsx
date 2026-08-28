'use client'

import React, { useState, useEffect } from 'react'
import {
  Users, UserPlus, Search, Filter, Download,
  CheckCircle, Clock, Snowflake, AlertTriangle,
  RefreshCw, Eye, Flame, ShieldAlert,
} from 'lucide-react'
import GlassCard from '@/components/app/ui/glass-card'
import StatCard from '@/components/app/ui/stat-card'
import { DataTable, type DataTableColumn } from '@/components/app/ui/data-table'
import { Button } from '@/components/app/ui/button'
import { StatusPill } from '@/components/app/ui/badge'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/app/ui/select'
import MemberProfileDrawer from '@/components/app/members/MemberProfileDrawer'
import MemberOnboardingModal from '@/components/app/members/MemberOnboardingModal'
import FreezeMemberModal from '@/components/app/members/FreezeMemberModal'
import RenewMemberModal from '@/components/app/members/RenewMemberModal'
import { ConfirmDialog } from '@/components/app/ui/confirm-dialog'
import { getMembers, updateMember } from '@/lib/members'
import { formatINR } from '@/lib/gst'
import { formatDateTime, getInitials } from '@/lib/utils'
import type { Member, MemberStatus } from '@/types/member'
import { toast } from '@/components/app/ui/toast'
import { cn } from '@/lib/utils'

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [freezeMember, setFreezeMember] = useState<Member | null>(null)
  const [renewMember, setRenewMember] = useState<Member | null>(null)
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null)
  const [page, setPage] = useState(1)
  const pageSize = 10

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

  const statusMap: Record<MemberStatus, { status: 'success' | 'warning' | 'danger' | 'info' | 'neutral'; label: string }> = {
    active: { status: 'success', label: 'Active' },
    expiring_soon: { status: 'warning', label: 'Expiring Soon' },
    grace_period: { status: 'warning', label: 'Grace Period' },
    inactive: { status: 'neutral', label: 'Inactive' },
    blacklisted: { status: 'danger', label: 'Blacklisted' },
  }

  const columns: DataTableColumn<Member>[] = [
    {
      id: 'member',
      header: 'Member',
      accessorKey: 'name',
      sortable: true,
      cell: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--aurora-1)] to-[var(--aurora-2)] flex items-center justify-center text-white text-xs font-semibold shrink-0">
            {getInitials(row.name)}
          </div>
          <div>
            <p className="font-semibold text-xs text-[var(--app-text-primary)] hover:text-[var(--aurora-1)] transition-colors">
              {row.name}
            </p>
            <div className="flex items-center gap-2 text-[0.6875rem] text-[var(--app-text-muted)] font-mono">
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
          <div>
            <span className="text-xs font-medium text-[var(--app-text-primary)] truncate max-w-[200px] block">
              {primaryPlan?.product_name || 'No Active Plan'}
            </span>
            <p className="text-[0.6875rem] text-[var(--app-text-muted)] mt-0.5">
              {primaryPlan?.expiry_date ? `Expires: ${primaryPlan.expiry_date}` : 'Expired / None'}
            </p>
          </div>
        )
      },
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      width: '130px',
      cell: (val, row) => {
        if (row.blacklisted) {
          return <StatusPill status="danger" dot>Blacklisted</StatusPill>
        }
        const s = statusMap[val as MemberStatus] || { status: 'neutral', label: val as string }
        return (
          <StatusPill status={s.status} dot>
            {s.label}
          </StatusPill>
        )
      },
    },
    {
      id: 'attendance',
      header: 'Streak / Last Visit',
      sortable: true,
      cell: (_, row) => (
        <div>
          <div className="flex items-center gap-1 text-xs">
            {row.attendance_streak > 0 && <Flame className="w-3.5 h-3.5 text-[var(--app-warning)]" />}
            <span className="font-semibold text-[var(--app-text-primary)]">
              {row.attendance_streak > 0 ? `${row.attendance_streak}d streak` : '0 days'}
            </span>
          </div>
          <span className="text-[0.6875rem] text-[var(--app-text-muted)]">
            {row.last_visit_at ? formatDateTime(row.last_visit_at).slice(0, 12) : 'No visits'}
          </span>
        </div>
      ),
    },
    {
      id: 'ltv',
      header: 'Lifetime Value',
      accessorKey: 'lifetime_value',
      align: 'right',
      sortable: true,
      width: '130px',
      cell: (val) => (
        <span className="font-mono text-xs font-semibold text-[var(--aurora-1)]">
          {formatINR(val as number || 0)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      width: '130px',
      cell: (_, row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedMember(row)
              setDrawerOpen(true)
            }}
            icon={<Eye className="w-3.5 h-3.5" />}
          >
            Profile
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRenewMember(row)}
            title="Renew Plan"
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          />
        </div>
      ),
    },
  ]

  const activeCount = members.filter((m) => m.status === 'active').length
  const expiringCount = members.filter((m) => m.status === 'expiring_soon' || m.status === 'grace_period').length
  const blacklistedCount = members.filter((m) => m.blacklisted).length
  const complimentaryCount = members.filter((m) => m.complimentary).length

  const paginatedMembers = members.slice((page - 1) * pageSize, page * pageSize)

  const handleExportCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Member ID,Name,Phone,Email,Package,Status,Streak,LTV,Joined Date']
        .concat(
          members.map(
            (m) =>
              `"${m.member_code}","${m.name}","${m.phone}","${m.email || ''}","${m.active_memberships[0]?.product_name || 'None'}","${m.status}","${m.attendance_streak}","${formatINR(m.lifetime_value)}","${m.joined_date}"`
          )
        )
        .join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `dna360_members_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Member directory exported as CSV')
  }

  const handleDeleteMember = () => {
    if (!memberToDelete) return
    updateMember(memberToDelete.id, { status: 'inactive' })
    toast.success(`Member ${memberToDelete.name} deactivated`)
    setMemberToDelete(null)
  }

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--app-text-primary)] tracking-tight">
            Member Directory
          </h1>
          <p className="text-sm text-[var(--app-text-secondary)] mt-1">
            Hiranandani Gardens Powai member records, concurrent memberships, KYC verification, and lifecycle management.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportCsv}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>
          <Button
            variant="primary"
            onClick={() => setOnboardingOpen(true)}
            icon={<UserPlus className="w-4 h-4" />}
          >
            New Member
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Members"
          value={members.length}
          icon={<Users className="w-5 h-5 text-[var(--aurora-1)]" />}
        />
        <StatCard
          label="Active Memberships"
          value={activeCount}
          icon={<CheckCircle className="w-5 h-5 text-[var(--app-success)]" />}
        />
        <StatCard
          label="Expiring / Grace Period"
          value={expiringCount}
          icon={<Clock className="w-5 h-5 text-[var(--app-warning)]" />}
        />
        <StatCard
          label="Blacklisted / Blocked"
          value={blacklistedCount}
          icon={<ShieldAlert className="w-5 h-5 text-[var(--app-danger)]" />}
        />
      </div>

      {/* Filter Toolbar */}
      <GlassCard padding="sm">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--app-text-muted)]" />
            <input
              type="text"
              placeholder="Search by name, phone, email, or member code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-4 text-xs glass-input text-[var(--app-text-primary)] placeholder:text-[var(--app-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--app-focus-ring)] transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="Status: All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="grace_period">Grace Period (7 Days)</SelectItem>
                <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
                <SelectItem value="blacklisted">Blacklisted</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </GlassCard>

      {/* Members DataTable */}
      <DataTable<Member>
        columns={columns}
        data={paginatedMembers}
        status="success"
        page={page}
        pageSize={pageSize}
        total={members.length}
        onPageChange={setPage}
        onRowClick={(row) => {
          setSelectedMember(row)
          setDrawerOpen(true)
        }}
        getRowId={(row) => row.id}
        emptyTitle="No members match your criteria"
        emptyDescription="Try clearing filters or search terms to see member records."
        isFilterActive={statusFilter !== 'all' || !!search}
        onClearFilters={() => {
          setStatusFilter('all')
          setSearch('')
        }}
      />

      {/* Member Profile Slide-Over Drawer */}
      <MemberProfileDrawer
        member={selectedMember}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onMemberUpdated={refreshMembers}
      />

      {/* 4-Step Onboarding Modal */}
      <MemberOnboardingModal
        open={onboardingOpen}
        onOpenChange={setOnboardingOpen}
        onMemberCreated={refreshMembers}
      />

      {/* Freeze / Pause Modal */}
      <FreezeMemberModal
        member={freezeMember}
        open={!!freezeMember}
        onOpenChange={(open) => !open && setFreezeMember(null)}
        onUpdated={refreshMembers}
      />

      {/* Renew Modal */}
      <RenewMemberModal
        member={renewMember}
        open={!!renewMember}
        onOpenChange={(open) => !open && setRenewMember(null)}
        onUpdated={refreshMembers}
      />

      {/* Delete/Deactivate Confirmation */}
      <ConfirmDialog
        open={!!memberToDelete}
        onOpenChange={(open) => !open && setMemberToDelete(null)}
        title="Deactivate Member Profile"
        description={`Are you sure you want to mark ${memberToDelete?.name} as inactive?`}
        variant="danger"
        confirmLabel="Deactivate"
        onConfirm={handleDeleteMember}
      />
    </div>
  )
}
