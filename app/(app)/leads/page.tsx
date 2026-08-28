'use client'

import React, { useState, useEffect } from 'react'
import {
  UserPlus, Kanban, List, Filter,
  Phone, Mail, MessageSquare, IndianRupee,
  TrendingUp, Sparkles, CheckCircle, Clock,
  Users, ArrowRight, CheckSquare, Search,
} from 'lucide-react'
import GlassCard from '@/components/app/ui/glass-card'
import StatCard from '@/components/app/ui/stat-card'
import { DataTable, type DataTableColumn } from '@/components/app/ui/data-table'
import { Button } from '@/components/app/ui/button'
import { StatusPill } from '@/components/app/ui/badge'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/app/ui/select'
import LeadModal from '@/components/app/leads/LeadModal'
import LeadDetailDrawer from '@/components/app/leads/LeadDetailDrawer'
import MemberOnboardingModal from '@/components/app/members/MemberOnboardingModal'
import {
  getLeads,
  getCrmKpis,
  updateLeadStage,
} from '@/lib/leads'
import { formatINR, formatDateTime, getInitials } from '@/lib/utils'
import type { CrmLead, LeadStage } from '@/types/leads'
import { toast } from '@/components/app/ui/toast'
import { cn } from '@/lib/utils'

export default function LeadsPage() {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [leads, setLeads] = useState<CrmLead[]>([])
  const [search, setSearch] = useState('')

  const [leadModalOpen, setLeadModalOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<CrmLead | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [onboardingOpen, setOnboardingOpen] = useState(false)

  const refreshData = () => {
    setLeads(getLeads({ search }))
  }

  useEffect(() => {
    refreshData()

    const handleUpdate = () => refreshData()
    window.addEventListener('dna360_leads_updated', handleUpdate)
    return () => window.removeEventListener('dna360_leads_updated', handleUpdate)
  }, [search])

  const kpis = getCrmKpis()

  const pipelineColumns: { stage: LeadStage; label: string; color: string }[] = [
    { stage: 'inquiry', label: 'New Inquiries', color: 'border-[var(--blue)]/30' },
    { stage: 'trial_scheduled', label: 'Trial Scheduled', color: 'border-[var(--teal)]/30' },
    { stage: 'trial_attended', label: 'Trial Attended', color: 'border-[var(--teal)]/50' },
    { stage: 'negotiating', label: 'Negotiating', color: 'border-[var(--warn)]/30' },
    { stage: 'converted', label: 'Won (Converted)', color: 'border-[var(--ok)]/30' },
    { stage: 'lost', label: 'Lost / Closed', color: 'border-[var(--danger)]/30' },
  ]

  const handleAdvanceStage = (leadId: string, currentStage: LeadStage) => {
    const stageFlow: Record<LeadStage, LeadStage> = {
      inquiry: 'trial_scheduled',
      trial_scheduled: 'trial_attended',
      trial_attended: 'negotiating',
      negotiating: 'converted',
      converted: 'converted',
      lost: 'inquiry',
    }
    const next = stageFlow[currentStage]
    updateLeadStage(leadId, next)
    toast.success(`Advanced to ${next.toUpperCase()}`)
    refreshData()
  }

  const listColumns: DataTableColumn<CrmLead>[] = [
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
      header: 'Goal & Source',
      cell: (_, row) => (
        <div>
          <span className="text-xs font-medium text-[var(--app-text-primary)] block">{row.goal}</span>
          <span className="text-[0.6875rem] text-[var(--app-text-muted)]">{row.source}</span>
        </div>
      ),
    },
    {
      id: 'stage',
      header: 'Pipeline Stage',
      accessorKey: 'stage',
      sortable: true,
      cell: (val) => (
        <StatusPill
          status={val === 'converted' ? 'success' : val === 'lost' ? 'danger' : val === 'negotiating' ? 'warning' : 'info'}
          dot
        >
          {(val as string).replace('_', ' ').toUpperCase()}
        </StatusPill>
      ),
    },
    {
      id: 'value',
      header: 'Deal Value',
      accessorKey: 'expectedDealValueMinor',
      align: 'right',
      sortable: true,
      cell: (val) => <span className="font-mono text-xs font-bold text-[var(--aurora-1)]">{formatINR(val as number)}</span>,
    },
    {
      id: 'rep',
      header: 'Sales Rep',
      accessorKey: 'assignedRepName',
      sortable: true,
      cell: (val) => <span className="text-xs text-[var(--app-text-secondary)]">{val as string}</span>,
    },
  ]

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--app-text-primary)] tracking-tight">
            Leads & Sales CRM Pipeline
          </h1>
          <p className="text-sm text-[var(--app-text-secondary)] mt-1">
            Track inquiries, trial pass turnstile conversions, sales rep assignments, and member onboarding.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-xl glass-input">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={cn(
                'p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all',
                viewMode === 'kanban'
                  ? 'bg-[var(--app-sidebar-active)] text-[var(--app-text-primary)] shadow-xs'
                  : 'text-[var(--app-text-muted)] hover:text-[var(--app-text-secondary)]'
              )}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={cn(
                'p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all',
                viewMode === 'list'
                  ? 'bg-[var(--app-sidebar-active)] text-[var(--app-text-primary)] shadow-xs'
                  : 'text-[var(--app-text-muted)] hover:text-[var(--app-text-secondary)]'
              )}
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          <Button
            variant="primary"
            onClick={() => setLeadModalOpen(true)}
            icon={<UserPlus className="w-4 h-4" />}
          >
            Create Lead
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Pipeline Value"
          value={kpis.pipelineValueMinor}
          prefix="₹"
          formatValue={(v) => formatINR(v).replace('₹', '')}
          icon={<IndianRupee className="w-4 h-4 text-[var(--teal)]" />}
        />
        <StatCard
          label="Total Leads (MTD)"
          value={kpis.totalLeadsMtd}
          suffix=" prospects"
          icon={<Users className="w-5 h-5 text-[var(--app-info)]" />}
        />
        <StatCard
          label="Trial Conversion Rate"
          value={`${kpis.conversionRatePct}%`}
          icon={<CheckCircle className="w-5 h-5 text-[var(--app-success)]" />}
        />
        <StatCard
          label="Avg Days to Close"
          value={`${kpis.avgDaysToClose} Days`}
          icon={<Clock className="w-5 h-5 text-[var(--app-warning)]" />}
        />
      </div>

      {/* Search & Filter Toolbar */}
      <GlassCard padding="sm">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--app-text-muted)]" />
            <input
              type="text"
              placeholder="Search leads by prospect name or phone (+91)…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-4 text-xs glass-input text-[var(--app-text-primary)] placeholder:text-[var(--app-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--app-focus-ring)] transition-all"
            />
          </div>
        </div>
      </GlassCard>

      {/* Main View: Kanban Board vs DataTable */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 overflow-x-auto pb-4">
          {pipelineColumns.map((col) => {
            const columnLeads = leads.filter((l) => l.stage === col.stage)
            const columnTotal = columnLeads.reduce((a, c) => a + c.expectedDealValueMinor, 0)
            return (
              <div key={col.stage} className="space-y-3 min-w-[220px]">
                {/* Column Header */}
                <div className="p-3 rounded-xl glass-input flex items-center justify-between border-b border-[var(--app-glass-border)]">
                  <div>
                    <h4 className="font-semibold text-xs text-[var(--app-text-primary)]">{col.label}</h4>
                    <span className="font-mono text-[0.625rem] text-[var(--app-text-muted)]">
                      {formatINR(columnTotal)}
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-[var(--app-glass-bg)] border border-[var(--app-glass-border)]">
                    {columnLeads.length}
                  </span>
                </div>

                {/* Lead Cards */}
                <div className="space-y-2.5">
                  {columnLeads.map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() => {
                        setSelectedLead(lead)
                        setDrawerOpen(true)
                      }}
                      className={cn(
                        'p-3.5 rounded-2xl glass-card border hover:border-[var(--aurora-1)] cursor-pointer transition-all space-y-2.5 shadow-sm group',
                        col.color
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[var(--app-text-primary)] group-hover:text-[var(--aurora-1)] transition-colors">
                          {lead.name}
                        </span>
                        <span className="font-mono font-bold text-xs text-[var(--aurora-1)]">
                          {formatINR(lead.expectedDealValueMinor)}
                        </span>
                      </div>

                      <p className="text-[0.6875rem] text-[var(--app-text-muted)] line-clamp-1">
                        {lead.goal} · {lead.source.split('/')[0]}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-[var(--app-glass-border)] text-[0.625rem] font-mono text-[var(--app-text-muted)]">
                        <span>Rep: {lead.assignedRepName.split(' ')[0]}</span>
                        {lead.stage !== 'converted' && lead.stage !== 'lost' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAdvanceStage(lead.id, lead.stage)
                            }}
                            className="text-[var(--aurora-1)] font-bold hover:underline flex items-center gap-0.5"
                          >
                            Advance →
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <DataTable<CrmLead>
          columns={listColumns}
          data={leads}
          status="success"
          page={1}
          pageSize={leads.length}
          total={leads.length}
          onRowClick={(row) => {
            setSelectedLead(row)
            setDrawerOpen(true)
          }}
          getRowId={(row) => row.id}
        />
      )}

      {/* Modals & Drawers */}
      <LeadModal
        open={leadModalOpen}
        onOpenChange={setLeadModalOpen}
        onLeadCreated={refreshData}
      />

      <LeadDetailDrawer
        lead={selectedLead}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onUpdated={refreshData}
        onConvertToMember={(lead) => {
          setOnboardingOpen(true)
        }}
      />

      <MemberOnboardingModal
        open={onboardingOpen}
        onOpenChange={setOnboardingOpen}
        onMemberCreated={refreshData}
      />
    </div>
  )
}
