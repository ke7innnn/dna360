'use client'

import React, { useState } from 'react'
import {
  ShieldAlert, Send, PhoneCall, Gift,
  CheckCircle, Sparkles, AlertTriangle, MessageSquare,
} from 'lucide-react'
import GlassCard from '@/components/app/ui/glass-card'
import { DataTable, type DataTableColumn } from '@/components/app/ui/data-table'
import { Button } from '@/components/app/ui/button'
import { StatusPill } from '@/components/app/ui/badge'
import { getChurnRiskRadar, triggerRetentionOutreach } from '@/lib/analytics'
import type { ChurnRiskMember } from '@/types/analytics'
import { toast } from '@/components/app/ui/toast'
import { cn } from '@/lib/utils'

export default function ChurnRiskRadar({
  onActionTriggered,
}: {
  onActionTriggered?: () => void
}) {
  const [members, setMembers] = useState<ChurnRiskMember[]>(getChurnRiskRadar())

  const handleOutreach = (member: ChurnRiskMember) => {
    triggerRetentionOutreach(member.memberId, member.recommendedAction)
    toast.success(`Retention Action Triggered: ${member.memberName}`, {
      description: `Dispatched: "${member.recommendedAction}"`,
    })
    setMembers(getChurnRiskRadar())
    if (onActionTriggered) onActionTriggered()
  }

  const columns: DataTableColumn<ChurnRiskMember>[] = [
    {
      id: 'member',
      header: 'At-Risk Member',
      sortable: true,
      cell: (_, row) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs text-[var(--app-text-primary)]">{row.memberName}</span>
            <span className="text-[0.625rem] font-mono text-[var(--app-text-muted)]">{row.memberCode}</span>
          </div>
          <span className="text-[0.6875rem] text-[var(--app-text-muted)]">{row.planName}</span>
        </div>
      ),
    },
    {
      id: 'risk',
      header: 'AI Churn Score',
      sortable: true,
      cell: (_, row) => (
        <div className="flex items-center gap-2">
          <div className="w-12 h-1.5 rounded-full bg-[var(--app-glass-bg)] overflow-hidden border border-[var(--app-glass-border)]">
            <div
              className={cn(
                'h-full rounded-full',
                row.riskLevel === 'High' ? 'bg-[var(--app-danger)]' : row.riskLevel === 'Medium' ? 'bg-[var(--app-warning)]' : 'bg-[var(--app-success)]'
              )}
              style={{ width: `${row.riskScore}%` }}
            />
          </div>
          <span className="font-mono text-xs font-bold">{row.riskScore}%</span>
          <StatusPill status={row.riskLevel === 'High' ? 'danger' : 'warning'}>
            {row.riskLevel}
          </StatusPill>
        </div>
      ),
    },
    {
      id: 'factor',
      header: 'Primary Behavioral Risk Indicator',
      cell: (_, row) => (
        <span className="text-xs text-[var(--app-text-secondary)]">
          {row.primaryRiskFactor}
        </span>
      ),
    },
    {
      id: 'action',
      header: 'Prescribed Retention Action',
      cell: (_, row) => (
        <span className="text-xs font-medium text-[var(--aurora-1)]">
          {row.recommendedAction}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Outreach Status',
      sortable: true,
      width: '140px',
      cell: (_, row) => (
        <div className="flex items-center justify-end">
          {row.retentionStatus === 'uncontacted' ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOutreach(row)}
              icon={<Send className="w-3 h-3" />}
            >
              Trigger Outreach
            </Button>
          ) : (
            <StatusPill status="success" dot>
              Contacted
            </StatusPill>
          )}
        </div>
      ),
    },
  ]

  const highRiskCount = members.filter((m) => m.riskLevel === 'High').length

  return (
    <GlassCard padding="md" className="space-y-4 border border-[var(--app-danger)]/20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--app-glass-border)] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[var(--app-danger)]/10 text-[var(--app-danger)] border border-[var(--app-danger)]/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display text-sm font-semibold text-[var(--app-text-primary)] flex items-center gap-2">
              <span>AI Churn Prediction & Early Warning Radar</span>
              <span className="text-[0.6875rem] font-bold px-2 py-0.5 rounded-full bg-[var(--app-danger)]/15 text-[var(--app-danger)]">
                {highRiskCount} High Risk
              </span>
            </h3>
            <p className="text-xs text-[var(--app-text-muted)] mt-0.5">
              Machine learning detection analyzing turnstile drop-off, pending expiry, and unutilized PT packages.
            </p>
          </div>
        </div>
      </div>

      <DataTable<ChurnRiskMember>
        columns={columns}
        data={members}
        status="success"
        page={1}
        pageSize={members.length}
        total={members.length}
        getRowId={(row) => row.memberId}
        emptyTitle="No members flagged for churn risk"
        emptyDescription="Great job! Member engagement and retention are healthy across all clubs."
      />
    </GlassCard>
  )
}
