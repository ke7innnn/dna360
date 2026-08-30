'use client'

import React, { useState, useEffect } from 'react'
import {
  UserPlus, Kanban, List, Filter,
  Phone, Mail, MessageSquare, IndianRupee,
  TrendingUp, Sparkles, CheckCircle, Clock,
  Users, ArrowRight, CheckSquare, Search, Plus,
} from 'lucide-react'
import Card from '@/components/app/ui/glass-card'
import StatTile from '@/components/app/ui/StatTile'
import DataTable, { type DataTableColumn } from '@/components/app/ui/data-table'
import Button from '@/components/app/ui/button'
import Badge, { StatusPill } from '@/components/app/ui/badge'
import PageHeader from '@/components/app/ui/PageHeader'
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

  const pipelineColumns: { stage: LeadStage; label: string; borderAccent: string }[] = [
    { stage: 'inquiry', label: 'New Inquiries', borderAccent: 'border-t-2 border-t-[var(--indigo)]' },
    { stage: 'trial_scheduled', label: 'Trial Scheduled', borderAccent: 'border-t-2 border-t-[var(--accent)]' },
    { stage: 'trial_attended', label: 'Trial Attended', borderAccent: 'border-t-2 border-t-[var(--accent-deep)]' },
    { stage: 'negotiating', label: 'Negotiating', borderAccent: 'border-t-2 border-t-[var(--amber)]' },
    { stage: 'converted', label: 'Won (Converted)', borderAccent: 'border-t-2 border-t-[var(--green)]' },
    { stage: 'lost', label: 'Lost / Closed', borderAccent: 'border-t-2 border-t-[var(--muted-2)]' },
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
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[rgba(59,130,246,0.35)] to-[rgba(99,102,241,0.20)] border border-[rgba(59,130,246,0.4)] flex items-center justify-center text-white font-ui text-xs font-bold shrink-0 shadow-sm">
            {getInitials(row.name)}
          </div>
          <div>
            <p className="font-ui font-semibold text-[13.5px] text-[var(--ink)]">{row.name}</p>
            <p className="font-ui text-[10.5px] text-[var(--muted)] tabular-nums">{row.phone}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'goal',
      header: 'Goal & Source',
      cell: (_, row) => (
        <div>
          <span className="font-ui text-xs font-semibold text-[var(--ink)] block">{row.goal}</span>
          <span className="font-ui text-[10px] uppercase text-[var(--muted)] font-medium">{row.source}</span>
        </div>
      ),
    },
    {
      id: 'stage',
      header: 'Pipeline Stage',
      cell: (v) => {
        const stage = String(v)
        const statusMap: Record<string, 'ok' | 'warn' | 'danger' | 'info' | 'neutral'> = {
          converted: 'ok',
          negotiating: 'warn',
          lost: 'danger',
          trial_scheduled: 'info',
          trial_attended: 'info',
          inquiry: 'neutral',
        }
        return <Badge status={statusMap[stage] || 'neutral'} size="sm">{stage.replace('_', ' ')}</Badge>
      },
    },
    {
      id: 'value',
      header: 'Target Value',
      align: 'right',
      cell: (_, row) => (
        <span className="font-ui font-semibold text-xs text-[var(--ink)] tabular-nums">
          {formatINR(row.potentialValueMinor)}
        </span>
      ),
    },
    {
      id: 'rep',
      header: 'Assigned Consultant',
      cell: (_, row) => (
        <span className="font-ui text-xs text-[var(--muted)]">{row.assignedStaffName || 'Unassigned'}</span>
      ),
    },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none">
      {/* 1. Header */}
      <PageHeader
        eyebrow="GROWTH · CRM & PIPELINE"
        title="Leads & CRM"
        description="Walk-in lead capture, trial booking funnel, conversion pipeline, and automated WhatsApp follow-up workflows."
        actions={
          <div className="flex items-center gap-2.5">
            <div className="flex items-center rounded-[var(--r-sm)] bg-[var(--surface)] border border-[var(--line)] p-0.5">
              <button
                onClick={() => setViewMode('kanban')}
                className={cn(
                  'px-3 py-1.5 rounded-[var(--r-sm)] font-ui text-xs font-semibold transition-colors cursor-pointer',
                  viewMode === 'kanban'
                    ? 'bg-[var(--accent-soft)] text-[var(--accent)] border border-[rgba(59,130,246,0.30)]'
                    : 'text-[var(--muted)] hover:text-white'
                )}
              >
                <Kanban className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'px-3 py-1.5 rounded-[var(--r-sm)] font-ui text-xs font-semibold transition-colors cursor-pointer',
                  viewMode === 'list'
                    ? 'bg-[var(--accent-soft)] text-[var(--accent)] border border-[rgba(59,130,246,0.30)]'
                    : 'text-[var(--muted)] hover:text-white'
                )}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={() => setLeadModalOpen(true)}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Add walk-in lead
            </Button>
          </div>
        }
      />

      {/* 2. Stat Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="ACTIVE PIPELINE"
          value={kpis.totalLeads}
          unit="LEADS"
          icon={<Users className="w-4 h-4 text-[var(--accent)]" />}
        />
        <StatTile
          label="PIPELINE VALUE"
          value={formatINR(kpis.pipelineValueMinor)}
          icon={<IndianRupee className="w-4 h-4 text-[var(--accent)]" />}
        />
        <StatTile
          label="CONVERSION RATE"
          value={`${kpis.conversionRate}%`}
          icon={<TrendingUp className="w-4 h-4 text-[var(--green)]" />}
          delta={{ text: 'Target: 28%', type: 'ok' }}
        />
        <StatTile
          label="TRIALS SCHEDULED"
          value={kpis.trialsThisWeek}
          unit="THIS WEEK"
          icon={<Clock className="w-4 h-4 text-[var(--indigo)]" />}
        />
      </div>

      {/* 3. Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by prospect name, phone, or fitness goal..."
          className="w-full h-[36px] pl-9 pr-3.5 font-ui text-xs rounded-[var(--r-sm)] bg-[var(--bg-elev)] border border-[var(--line)] text-[var(--ink)] placeholder:text-[var(--muted-2)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] outline-none"
        />
      </div>

      {/* 4. Kanban or List View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3.5 items-start">
          {pipelineColumns.map(({ stage, label, borderAccent }) => {
            const columnLeads = leads.filter((l) => l.stage === stage)

            return (
              <Card
                key={stage}
                className={cn('p-3.5 flex flex-col min-h-[440px] space-y-3', borderAccent)}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
                  <span className="font-data text-[10.5px] uppercase tracking-[0.14em] font-semibold text-[var(--ink)] truncate">
                    {label}
                  </span>
                  <span className="font-data text-xs px-1.5 py-0.5 rounded-full bg-[var(--surface-2)] border border-[var(--line)] text-[var(--muted)] tabular-nums font-bold">
                    {columnLeads.length}
                  </span>
                </div>

                {/* Lead Cards */}
                <div className="space-y-2.5 flex-1 overflow-y-auto pr-0.5">
                  {columnLeads.map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() => {
                        setSelectedLead(lead)
                        setDrawerOpen(true)
                      }}
                      className="p-3 rounded-[var(--r-md)] bg-[var(--surface-2)] border border-[var(--line)] cursor-pointer hover:border-[rgba(59,130,246,0.35)] transition-all duration-140 space-y-2 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-ui text-xs font-semibold text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors line-clamp-1">
                          {lead.name}
                        </span>
                        <span className="font-data text-[11px] font-bold text-[var(--ink)] tabular-nums">
                          {formatINR(lead.potentialValueMinor)}
                        </span>
                      </div>

                      <p className="font-ui text-[11px] text-[var(--muted)] line-clamp-1">
                        {lead.goal}
                      </p>

                      <div className="pt-1.5 border-t border-[var(--line-soft)] flex items-center justify-between text-[10px] font-data text-[var(--muted-2)]">
                        <span>{lead.source}</span>
                        {stage !== 'converted' && stage !== 'lost' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAdvanceStage(lead.id, lead.stage)
                            }}
                            className="font-ui text-[10.5px] text-[var(--accent)] hover:underline font-semibold cursor-pointer"
                          >
                            Advance →
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <DataTable
          columns={listColumns}
          data={leads}
          status="success"
          pageSize={12}
          total={leads.length}
          onRowClick={(row) => {
            setSelectedLead(row)
            setDrawerOpen(true)
          }}
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
        onLeadUpdated={refreshData}
        onConvert={() => {
          setDrawerOpen(false)
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
