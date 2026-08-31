'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Users, UserPlus, Search, Download,
  CheckCircle2, Clock, AlertTriangle, ShieldAlert,
  ArrowUpDown, Eye, Plus, Lock, MessageSquare,
  X, CheckSquare,
} from 'lucide-react'
import Button from '@/components/app/ui/button'
import Badge from '@/components/app/ui/badge'
import StrandMeter from '@/components/app/ui/StrandMeter'
import DataTable, { type DataTableColumn } from '@/components/app/ui/data-table'
import PageHeader from '@/components/app/ui/PageHeader'
import Breadcrumbs from '@/components/app/ui/Breadcrumbs'
import MemberProfileDrawer from '@/components/app/members/MemberProfileDrawer'
import MemberOnboardingModal from '@/components/app/members/MemberOnboardingModal'
import FreezeMemberModal from '@/components/app/members/FreezeMemberModal'
import RenewMemberModal from '@/components/app/members/RenewMemberModal'
import WhatsAppComposeModal from '@/components/app/whatsapp/WhatsAppComposeModal'
import { useAuth } from '@/context/AuthContext'
import { getMembers } from '@/lib/members'
import { formatINR } from '@/lib/gst'
import { getInitials } from '@/lib/utils'
import { maskPhoneNumber } from '@/lib/auth'
import { logAuditEvent } from '@/lib/audit'
import { formatDualDate } from '@/lib/date-format'
import type { Member } from '@/types/member'
import { toast } from '@/components/app/ui/toast'
import { cn } from '@/lib/utils'

export default function MembersPage() {
  const { user, can } = useAuth()
  const [members, setMembers] = useState<Member[]>(() => getMembers())
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'grace_period' | 'expiring_soon' | 'inactive' | 'blacklisted'>('all')
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [revealedPhones, setRevealedPhones] = useState<Record<string, boolean>>({})
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [freezeMember, setFreezeMember] = useState<Member | null>(null)
  const [renewMember, setRenewMember] = useState<Member | null>(null)

  // Table State
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [sortState, setSortState] = useState<{ column: string; direction: 'asc' | 'desc' }>({
    column: 'name',
    direction: 'asc',
  })
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Bulk WhatsApp modal
  const [waModalOpen, setWaModalOpen] = useState(false)
  const [bulkWaRecipient, setBulkWaRecipient] = useState<any>(null)

  const handleRevealPhone = (e: React.MouseEvent, row: Member) => {
    e.stopPropagation()
    setRevealedPhones((prev) => ({ ...prev, [row.id]: true }))
    logAuditEvent({
      actor: { id: user?.id || 'usr_staff', name: user?.name || 'Staff', email: user?.email || '', role: user?.role.name || 'Staff' },
      action: 'VIEW',
      entity: 'MemberPhonePII',
      entityId: row.id,
      branchId: user?.branchId || 'pow',
      description: `${user?.name || 'Staff'} revealed phone number for member ${row.name} (${row.member_code})`,
    })
    toast.info(`Contact revealed for ${row.name}`)
  }

  const isTrainerScoped = !can('members.view.all') && can('members.view.own')

  const refreshMembers = () => {
    let list = getMembers({
      search,
      status: statusFilter,
    })

    // Scope for Trainers & Masseur (§3: members.view.own)
    if (isTrainerScoped && user?.assignedClientIds) {
      list = list.filter((m) => user.assignedClientIds?.includes(m.id) || m.id === 'mem_001')
    }

    // Apply Sorting
    list = [...list].sort((a, b) => {
      let aVal: any = a.name
      let bVal: any = b.name

      if (sortState.column === 'member_code') {
        aVal = a.member_code
        bVal = b.member_code
      } else if (sortState.column === 'expiry_date') {
        aVal = a.active_memberships[0]?.expiry_date || ''
        bVal = b.active_memberships[0]?.expiry_date || ''
      } else if (sortState.column === 'attendance') {
        aVal = a.stats?.total_visits || 0
        bVal = b.stats?.total_visits || 0
      } else if (sortState.column === 'status') {
        aVal = a.status
        bVal = b.status
      }

      if (aVal < bVal) return sortState.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortState.direction === 'asc' ? 1 : -1
      return 0
    })

    setMembers(list)
  }

  useEffect(() => {
    refreshMembers()
    const handleUpdate = () => refreshMembers()
    window.addEventListener('dna360_members_updated', handleUpdate)
    return () => window.removeEventListener('dna360_members_updated', handleUpdate)
  }, [search, statusFilter, isTrainerScoped, user?.id, sortState])

  // Real Counts for the Filter Chips
  const counts = useMemo(() => {
    const all = getMembers({})
    return {
      all: isTrainerScoped ? members.length : all.length,
      active: all.filter((m) => m.status === 'active').length,
      grace_period: all.filter((m) => m.status === 'grace_period').length,
      expiring_soon: all.filter((m) => m.status === 'expiring_soon').length,
      inactive: all.filter((m) => m.status === 'inactive').length,
      blacklisted: all.filter((m) => m.status === 'blacklisted').length,
    }
  }, [members, isTrainerScoped])

  // Filter Chip Config
  const filterChips: { id: typeof statusFilter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'active', label: 'Active', count: counts.active },
    { id: 'grace_period', label: 'Grace Period', count: counts.grace_period },
    { id: 'expiring_soon', label: 'Expiring 30d', count: counts.expiring_soon },
    { id: 'inactive', label: 'Expired', count: counts.inactive },
    { id: 'blacklisted', label: 'Blocked', count: counts.blacklisted },
  ]

  // Columns for 52px Dense Table
  const columns: DataTableColumn<Member>[] = [
    {
      id: 'member',
      header: 'Member',
      accessorKey: 'name',
      sortable: true,
      cell: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[rgba(59,130,246,0.35)] to-[rgba(99,102,241,0.20)] border border-[rgba(59,130,246,0.4)] flex items-center justify-center font-ui text-[11px] font-bold text-white shrink-0 shadow-sm">
            {getInitials(row.name || 'MB')}
          </div>
          <div>
            <p className="font-ui font-semibold text-[13.5px] text-[var(--ink)] hover:text-[var(--accent)] transition-colors leading-tight">
              {row.name}
            </p>
            <div className="flex items-center gap-1.5 font-data text-[10.5px] text-[var(--muted)] mt-0.5 tabular-nums">
              <span>{row.member_code}</span>
              <span>·</span>
              <span className="cursor-pointer hover:text-[var(--ink)] transition-colors" onClick={(e) => !revealedPhones[row.id] && handleRevealPhone(e, row)}>
                {revealedPhones[row.id] ? row.phone : maskPhoneNumber(row.phone)}
              </span>
              {!revealedPhones[row.id] && (
                <button
                  onClick={(e) => handleRevealPhone(e, row)}
                  className="text-[10px] text-[var(--accent)] hover:underline ml-0.5 focus:outline-none"
                  title="Reveal phone (audit-logged)"
                >
                  (show)
                </button>
              )}
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
        const memberships = row.active_memberships || []
        const primaryPlan = memberships[0]
        return (
          <div className="max-w-[280px]">
            <span className="font-ui text-[13px] font-semibold text-[var(--ink)] block leading-tight">
              {primaryPlan?.product_name || 'No Active Plan'}
            </span>
            <p className="font-data text-[10.5px] text-[var(--muted)] mt-0.5">
              {primaryPlan?.expiry_date ? `Expires: ${formatDualDate(primaryPlan.expiry_date)}` : 'Expired / None'}
            </p>
          </div>
        )
      },
    },
    {
      id: 'sessions',
      header: 'PT / Services',
      cell: (_, row) => {
        const pt = row.active_memberships?.find((m) => m.category === 'personal_training' || m.sessions_total)
        if (!pt || !pt.sessions_total) {
          return <span className="font-data text-xs text-[var(--muted-2)]">—</span>
        }
        return (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-data">
              <span className="text-[var(--ink-2)] font-semibold">
                {pt.sessions_remaining} / {pt.sessions_total}
              </span>
              <span className="text-[10px] text-[var(--muted)]">PT left</span>
            </div>
            <StrandMeter
              value={pt.sessions_remaining || 0}
              max={pt.sessions_total || 12}
              capsules={4}
              color="accent"
              size="sm"
            />
          </div>
        )
      },
    },
    {
      id: 'attendance',
      header: 'Access & Streak',
      align: 'right',
      sortable: true,
      cell: (_, row) => (
        <div>
          <div className="font-data text-xs font-bold text-[var(--ink)] tabular-nums">
            {row.stats?.total_visits ?? 0} visits
          </div>
          <span className="font-data text-[10.5px] text-[var(--green)]">
            🔥 {row.stats?.streak_days ?? 0}d streak
          </span>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (val) => {
        const s = String(val)
        const map: Record<string, { status: string; label: string }> = {
          active: { status: 'ok', label: 'Active' },
          grace_period: { status: 'warn', label: 'Grace' },
          expiring_soon: { status: 'warn', label: 'Expiring' },
          inactive: { status: 'danger', label: 'Expired' },
          blacklisted: { status: 'danger', label: 'Blocked' },
        }
        const item = map[s] || { status: 'neutral', label: s }
        return <Badge status={item.status} size="sm">{item.label}</Badge>
      },
    },
  ]

  // Multi-Select Handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleToggleSelectAll = () => {
    const currentPageIds = members
      .slice((page - 1) * pageSize, page * pageSize)
      .map((m) => m.id)

    const allSelected = currentPageIds.every((id) => selectedIds.includes(id))

    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !currentPageIds.includes(id)))
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...currentPageIds])))
    }
  }

  const handleBulkExport = () => {
    const selectedMembers = members.filter((m) => selectedIds.includes(m.id))
    if (selectedMembers.length === 0) return

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Member Code,Name,Phone,Email,Status,Primary Plan,Expiry Date']
        .concat(
          selectedMembers.map(
            (m) =>
              `"${m.member_code}","${m.name}","${m.phone}","${m.email || ''}","${m.status}","${m.active_memberships?.[0]?.product_name || ''}","${m.active_memberships?.[0]?.expiry_date || ''}"`
          )
        )
        .join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `dna360_selected_members_${selectedMembers.length}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`Exported ${selectedMembers.length} selected member records to CSV`)
  }

  const handleBulkWhatsApp = () => {
    const target = members.find((m) => selectedIds.includes(m.id))
    if (!target) return

    setBulkWaRecipient({
      memberId: target.id,
      memberName: target.name,
      phone: target.phone,
      planName: target.active_memberships[0]?.product_name,
      expiryDate: target.active_memberships[0]?.expiry_date,
    })
    setWaModalOpen(true)
  }

  const handleExportCsv = () => {
    if (!can('members.export') && user?.role.slug.toUpperCase() !== 'OWNER') {
      toast.error('Exporting member PII data is restricted to Club Owner.')
      return
    }

    if (user) {
      logAuditEvent({
        actor: { id: user.id, name: user.name, email: user.email || user.phone, role: user.role.name },
        action: 'EXPORT',
        entity: 'MembersDirectory',
        entityId: 'members_pii_csv',
        branchId: user.branchId,
        description: `${user.name} exported full member directory PII to CSV`,
      })
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Member Code,Name,Phone,Email,Status,Sales Rep,Primary Plan,Expiry Date']
        .concat(
          members.map(
            (m) =>
              `"${m.member_code}","${m.name}","${m.phone}","${m.email || ''}","${m.status}","${m.sales_rep || ''}","${m.active_memberships?.[0]?.product_name || ''}","${m.active_memberships?.[0]?.expiry_date || ''}"`
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
    toast.success('Members PII Directory exported to CSV')
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none">
      <Breadcrumbs items={[{ label: isTrainerScoped ? 'My Assigned Clients' : 'Member Directory' }]} />

      {/* 1. Header with RBAC actions */}
      <PageHeader
        eyebrow={isTrainerScoped ? "TRAINER PORTAL · ASSIGNED CLIENTS" : "MEMBER DIRECTORY · POWAI FLAGSHIP"}
        title={isTrainerScoped ? "My Assigned Clients" : "Member Directory"}
        description={
          isTrainerScoped
            ? "Your assigned 1-on-1 personal training clients, program progressions, and scheduled sessions."
            : "Complete 659 live member directory imported from Gymex with back-calculated GST tariffs, turnstile status, and digital profiles."
        }
        actions={
          <>
            {can('members.export') && (
              <Button
                variant="secondary"
                size="md"
                onClick={handleExportCsv}
                icon={<Download className="w-3.5 h-3.5" />}
              >
                Export all (CSV)
              </Button>
            )}
            {can('members.enrol') && (
              <Button
                variant="primary"
                size="md"
                onClick={() => setOnboardingOpen(true)}
                icon={<UserPlus className="w-3.5 h-3.5" />}
              >
                Add member
              </Button>
            )}
          </>
        }
      />

      {/* Scoped Notice for Trainers */}
      {isTrainerScoped && (
        <div className="p-3.5 rounded-[var(--r-md)] bg-[var(--surface-2)] border border-[var(--line)] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Badge status="info" size="sm">Scoped Access</Badge>
            <span className="font-ui text-[var(--ink)]">
              Displaying assigned coaching clients for {user?.name} ({members.length} clients).
            </span>
          </div>
          <span className="font-data text-[10px] text-[var(--muted)]">members.view.own</span>
        </div>
      )}

      {/* 2. Filter Pills & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {filterChips.map((chip) => (
            <button
              key={chip.id}
              onClick={() => {
                setStatusFilter(chip.id)
                setPage(1)
              }}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-full font-ui text-xs font-semibold transition-all duration-140 shrink-0 cursor-pointer',
                statusFilter === chip.id
                  ? 'bg-[var(--accent-soft)] text-white border border-[rgba(59,130,246,0.35)] shadow-glow-sm'
                  : 'bg-[var(--surface)] border border-[var(--line)] text-[var(--muted)] hover:text-white hover:border-[rgba(255,255,255,0.15)]'
              )}
            >
              <span>{chip.label}</span>
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded-full font-data text-[10px] tabular-nums font-bold',
                  statusFilter === chip.id
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--surface-2)] text-[var(--muted)]'
                )}
              >
                {chip.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search by name, phone, or code..."
            className="w-full h-[36px] pl-9 pr-3.5 font-ui text-xs rounded-[var(--r-sm)] bg-[var(--bg-elev)] border border-[var(--line)] text-[var(--ink)] placeholder:text-[var(--muted-2)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] outline-none"
          />
        </div>
      </div>

      {/* Floating Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="p-3 rounded-2xl bg-[#0F1420] border border-[rgba(59,130,246,0.3)] shadow-2xl flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2 px-2 text-xs font-ui text-white">
            <CheckSquare className="w-4 h-4 text-[var(--accent)]" />
            <span><strong>{selectedIds.length}</strong> members selected</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkWhatsApp}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[rgba(37,211,102,0.15)] hover:bg-[#25D366] hover:text-white text-[#25D366] border border-[rgba(37,211,102,0.3)] text-xs font-ui font-semibold transition-all cursor-pointer shadow-sm"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Send WhatsApp</span>
            </button>

            <button
              onClick={handleBulkExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[rgba(59,130,246,0.15)] hover:bg-[var(--accent)] hover:text-white text-[var(--accent)] border border-[rgba(59,130,246,0.3)] text-xs font-ui font-semibold transition-all cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Selected</span>
            </button>

            <button
              onClick={() => setSelectedIds([])}
              className="p-1.5 rounded-full text-[var(--muted)] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-colors cursor-pointer"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 3. 52px Dense Table with Sorting & Multi-select */}
      <DataTable
        columns={columns}
        data={members.slice((page - 1) * pageSize, page * pageSize)}
        status="success"
        pageSize={pageSize}
        total={members.length}
        page={page}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPage(1)
        }}
        pageSizeOptions={[15, 25, 50]}
        sort={sortState}
        onSort={(col) => {
          setSortState((prev) => ({
            column: col,
            direction: prev.column === col && prev.direction === 'asc' ? 'desc' : 'asc',
          }))
        }}
        selectable
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onToggleSelectAll={handleToggleSelectAll}
        onRowClick={(row) => {
          setSelectedMember(row)
          setDrawerOpen(true)
        }}
      />

      {/* 4. Modals & Drawer */}
      <MemberProfileDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        member={selectedMember}
        onRenew={(m) => {
          setDrawerOpen(false)
          setRenewMember(m)
        }}
        onFreeze={(m) => {
          setDrawerOpen(false)
          setFreezeMember(m)
        }}
      />

      <MemberOnboardingModal
        open={onboardingOpen}
        onOpenChange={setOnboardingOpen}
        onMemberCreated={refreshMembers}
      />

      <FreezeMemberModal
        open={!!freezeMember}
        onOpenChange={(op) => !op && setFreezeMember(null)}
        member={freezeMember}
        onFrozen={refreshMembers}
      />

      <RenewMemberModal
        open={!!renewMember}
        onOpenChange={(op) => !op && setRenewMember(null)}
        member={renewMember}
        onRenewed={refreshMembers}
      />

      {/* Bulk WhatsApp Modal */}
      {bulkWaRecipient && (
        <WhatsAppComposeModal
          isOpen={waModalOpen}
          onClose={() => setWaModalOpen(false)}
          recipient={bulkWaRecipient}
        />
      )}
    </div>
  )
}
