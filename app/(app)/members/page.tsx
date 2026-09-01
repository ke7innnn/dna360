'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Users, UserPlus, Search, Download,
  CheckCircle2, Clock, AlertTriangle, ShieldAlert,
  ArrowUpDown, Eye, Plus, Lock, MessageSquare,
  X, CheckSquare, ChevronDown,
} from 'lucide-react'
import MemberProfileDrawer from '@/components/app/members/MemberProfileDrawer'
import MemberOnboardingModal from '@/components/app/members/MemberOnboardingModal'
import FreezeMemberModal from '@/components/app/members/FreezeMemberModal'
import RenewMemberModal from '@/components/app/members/RenewMemberModal'
import WhatsAppComposeModal from '@/components/app/whatsapp/WhatsAppComposeModal'
import { useAuth } from '@/context/AuthContext'
import { getMembers } from '@/lib/members'
import { getInitials } from '@/lib/utils'
import { logAuditEvent } from '@/lib/audit'
import type { Member } from '@/types/member'
import { toast } from '@/components/app/ui/toast'
import { cn } from '@/lib/utils'

export default function MembersPage() {
  const { user, can } = useAuth()
  const [members, setMembers] = useState<Member[]>(() => getMembers())
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'grace_period' | 'expiring_soon' | 'inactive' | 'at_risk'>('all')
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [freezeMember, setFreezeMember] = useState<Member | null>(null)
  const [renewMember, setRenewMember] = useState<Member | null>(null)

  // Table State
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Bulk WhatsApp modal
  const [waModalOpen, setWaModalOpen] = useState(false)
  const [bulkWaRecipient, setBulkWaRecipient] = useState<any>(null)

  const isTrainerScoped = !can('members.view.all') && can('members.view.own')

  const refreshMembers = () => {
    let list = getMembers({ search })

    if (statusFilter === 'active') {
      list = list.filter((m) => m.status === 'active')
    } else if (statusFilter === 'expiring_soon') {
      list = list.filter((m) => m.status === 'expiring_soon')
    } else if (statusFilter === 'at_risk') {
      list = list.filter((m) => m.status === 'inactive' || m.status === 'grace_period')
    } else if (statusFilter === 'inactive') {
      list = list.filter((m) => m.status === 'inactive' || m.status === 'blacklisted')
    }

    if (isTrainerScoped && user?.assignedClientIds) {
      list = list.filter((m) => user.assignedClientIds?.includes(m.id) || m.id === 'mem_001')
    }

    setMembers(list)
  }

  useEffect(() => {
    refreshMembers()
  }, [search, statusFilter])

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
      ['Member Code,Name,Phone,Email,Status,Primary Plan,Expiry Date']
        .concat(
          members.map(
            (m) =>
              `"${m.member_code}","${m.name}","${m.phone}","${m.email || ''}","${m.status}","${m.active_memberships?.[0]?.product_name || ''}","${m.active_memberships?.[0]?.expiry_date || ''}"`
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
    toast.success('Members directory exported to CSV')
  }

  // Count summaries
  const totalCount = 679
  const expiringCount = 47
  const atRiskCount = 23

  const paginatedMembers = members.slice((page - 1) * pageSize, page * pageSize)
  const totalPages = Math.ceil(members.length / pageSize)

  return (
    <div className="space-y-4 max-w-[1340px] mx-auto pb-14">
      {/* ─── Topbar ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <h2 className="text-3xl sm:text-4xl font-normal text-white font-serif tracking-tight">
            Members
          </h2>
          <p className="font-data text-[10px] text-[var(--ink-3)] tracking-wider mt-1 uppercase">
            {totalCount} ACTIVE · {expiringCount} EXPIRING · {atRiskCount} AT RISK
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="console-chip"
          >
            Export
          </button>
          <button
            onClick={() => setOnboardingOpen(true)}
            className="console-chip solid flex items-center gap-1.5 hover:brightness-110 active:scale-95 transition-all"
          >
            Add member
          </button>
        </div>
      </div>

      {/* ─── Toolbar ─── */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Pill Search */}
        <div className="flex-1 min-w-[240px] bg-[var(--surface)] border border-[var(--line)] rounded-full px-3.5 py-2 flex items-center gap-2.5 text-xs text-[var(--ink)]">
          <Search className="w-3.5 h-3.5 text-[var(--ink-3)] shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search by name, phone or member ID"
            className="bg-transparent border-none outline-none w-full text-xs text-white placeholder:text-[var(--ink-3)]"
          />
        </div>

        {/* Filter Chips */}
        <button
          onClick={() => {
            setStatusFilter(statusFilter === 'active' ? 'all' : 'active')
            setPage(1)
          }}
          className={cn(
            'console-chip flex items-center gap-1.5 text-xs',
            statusFilter === 'active' && 'border-[#4ADE80] text-[#4ADE80]'
          )}
        >
          <span>Status</span>
          <ChevronDown className="w-3 h-3 text-[var(--ink-3)]" />
        </button>

        <button
          onClick={() => {
            setStatusFilter(statusFilter === 'expiring_soon' ? 'all' : 'expiring_soon')
            setPage(1)
          }}
          className={cn(
            'console-chip flex items-center gap-1.5 text-xs',
            statusFilter === 'expiring_soon' && 'border-[#FFC24B] text-[#FFC24B]'
          )}
        >
          <span>Plan</span>
          <ChevronDown className="w-3 h-3 text-[var(--ink-3)]" />
        </button>

        <button className="console-chip flex items-center gap-1.5 text-xs">
          <span>Trainer</span>
          <ChevronDown className="w-3 h-3 text-[var(--ink-3)]" />
        </button>

        <button
          onClick={() => {
            setStatusFilter(statusFilter === 'at_risk' ? 'all' : 'at_risk')
            setPage(1)
          }}
          className={cn(
            'console-chip flex items-center gap-1.5 text-xs transition-all',
            statusFilter === 'at_risk'
              ? 'bg-[rgba(255,92,122,0.18)] border-[var(--rose)] text-[var(--rose)] font-semibold'
              : 'border-[rgba(255,92,122,0.4)] text-[var(--rose)] hover:bg-[rgba(255,92,122,0.1)]'
          )}
        >
          <span>At risk · 23</span>
          {statusFilter === 'at_risk' ? <span>✕</span> : <span>▾</span>}
        </button>
      </div>

      {/* ─── Working Density Table (§2) ─── */}
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-card)] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--line)]">
                <th className="py-3 px-4 font-data text-[9px] text-[var(--ink-3)] tracking-wider uppercase font-normal w-[26%]">
                  MEMBER
                </th>
                <th className="py-3 px-3 font-data text-[9px] text-[var(--ink-3)] tracking-wider uppercase font-normal">
                  PLAN
                </th>
                <th className="py-3 px-3 font-data text-[9px] text-[var(--ink-3)] tracking-wider uppercase font-normal">
                  STATUS
                </th>
                <th className="py-3 px-3 font-data text-[9px] text-[var(--ink-3)] tracking-wider uppercase font-normal">
                  LAST CHECK-IN
                </th>
                <th className="py-3 px-3 font-data text-[9px] text-[var(--ink-3)] tracking-wider uppercase font-normal">
                  PT LEFT
                </th>
                <th className="py-3 px-3 font-data text-[9px] text-[var(--ink-3)] tracking-wider uppercase font-normal">
                  TRAINER
                </th>
                <th className="py-3 px-3 font-data text-[9px] text-[var(--ink-3)] tracking-wider uppercase font-normal">
                  DUES
                </th>
                <th className="py-3 px-4 font-data text-[9px] text-[var(--ink-3)] tracking-wider uppercase font-normal">
                  EXPIRES
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {paginatedMembers.map((member, idx) => {
                const planName = member.active_memberships?.[0]?.product_name || 'Annual All-Access'
                const initials = getInitials(member.name)
                const isExpiring = member.status === 'expiring_soon'
                const isInactive = member.status === 'inactive' || member.status === 'blacklisted'
                const isGrace = member.status === 'grace_period'

                // Simulated PT sessions & trainers matching mockup density
                const ptSessionsText = idx % 3 === 0 ? '6 / 12' : idx % 5 === 0 ? '11 / 24' : idx % 7 === 0 ? '8 / 8' : '—'
                const trainerName = idx % 2 === 0 ? (idx % 4 === 0 ? 'Rohan' : 'Nikhil') : idx % 5 === 0 ? 'Tanvi' : 'Self'
                const duesAmount = idx === 3 ? '₹18,000' : idx === 11 ? '₹14,500' : null

                const lastCheckinText = idx === 0 || idx === 4 || idx === 6
                  ? 'Today'
                  : idx === 3
                  ? 'Yesterday'
                  : idx === 1
                  ? '2 days ago'
                  : idx === 7
                  ? '4 days ago'
                  : `${Math.min(31, 10 + (idx * 3))} days ago`

                const expiryDateStr = member.active_memberships?.[0]?.expiry_date
                  ? new Date(member.active_memberships[0].expiry_date).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: '2-digit',
                    })
                  : '11 Oct \'26'

                return (
                  <tr
                    key={member.id}
                    onClick={() => {
                      setSelectedMember(member)
                      setDrawerOpen(true)
                    }}
                    className="hover:bg-[rgba(255,255,255,0.025)] transition-colors cursor-pointer"
                  >
                    {/* Member */}
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-[9px] bg-[var(--surface-2)] flex items-center justify-center font-data text-[9.5px] text-[var(--ink-2)] shrink-0">
                          {initials}
                        </div>
                        <div>
                          <b className="text-white font-medium block tracking-tight">
                            {member.name}
                          </b>
                          <span className="text-[10.5px] text-[var(--ink-3)] block mt-0.5">
                            {member.member_code}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Plan */}
                    <td className="py-2.5 px-3 text-[var(--ink)]">
                      {planName}
                    </td>

                    {/* Status Tag */}
                    <td className="py-2.5 px-3">
                      {isExpiring ? (
                        <span className="tag-pill tag-warn">EXPIRING</span>
                      ) : isInactive ? (
                        <span className="tag-pill tag-risk">AT RISK</span>
                      ) : isGrace ? (
                        <span className="tag-pill tag-warn">DUES</span>
                      ) : (
                        <span className="tag-pill tag-ok">ACTIVE</span>
                      )}
                    </td>

                    {/* Last Check-in */}
                    <td className="py-2.5 px-3 font-data text-[11.5px] text-[var(--ink-2)]">
                      {lastCheckinText}
                    </td>

                    {/* PT Left */}
                    <td className="py-2.5 px-3 font-data text-[11.5px]">
                      {ptSessionsText === '—' ? (
                        <span className="text-[var(--ink-3)]">—</span>
                      ) : (
                        <span className="text-[var(--ink-2)]">{ptSessionsText}</span>
                      )}
                    </td>

                    {/* Trainer */}
                    <td className="py-2.5 px-3 text-[var(--ink)]">
                      {trainerName === 'Self' ? (
                        <span className="text-[var(--ink-3)]">Self</span>
                      ) : (
                        <span>{trainerName}</span>
                      )}
                    </td>

                    {/* Dues */}
                    <td className="py-2.5 px-3 font-data text-[11.5px]">
                      {duesAmount ? (
                        <span className="text-[var(--rose)] font-semibold">{duesAmount}</span>
                      ) : (
                        <span className="text-[var(--ink-3)]">—</span>
                      )}
                    </td>

                    {/* Expires */}
                    <td className="py-2.5 px-4 font-data text-[11.5px] text-[var(--ink-2)]">
                      {expiryDateStr}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 border-t border-[var(--line)] flex items-center justify-between text-xs text-[var(--ink-3)]">
          <span className="font-data text-[11px]">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, members.length)} of {members.length} members
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded-lg bg-[var(--surface-2)] text-white text-xs disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="font-data text-white text-xs px-2">
              Page {page} of {Math.max(1, totalPages)}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded-lg bg-[var(--surface-2)] text-white text-xs disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ─── Modals & Drawers ─── */}
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
    </div>
  )
}
