'use client'

import React, { useState } from 'react'
import {
  Phone, Mail, MessageSquare, Send,
  CheckCircle, ArrowRight, UserCheck, Calendar,
  Clock, DollarSign, Tag, UserPlus,
} from 'lucide-react'
import { Drawer } from '@/components/app/ui/drawer'
import { Button } from '@/components/app/ui/button'
import { StatusPill } from '@/components/app/ui/badge'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/app/ui/select'
import { updateLeadStage, addLeadActivity } from '@/lib/leads'
import { formatINR, formatDateTime, getInitials } from '@/lib/utils'
import type { CrmLead, LeadStage } from '@/types/leads'
import { toast } from '@/components/app/ui/toast'
import { cn } from '@/lib/utils'

export default function LeadDetailDrawer({
  lead,
  open,
  onOpenChange,
  onUpdated,
  onConvertToMember,
}: {
  lead: CrmLead | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated?: () => void
  onConvertToMember?: (lead: CrmLead) => void
}) {
  const [newNote, setNewNote] = useState('')
  const [noteType, setNoteType] = useState<'note' | 'call' | 'whatsapp'>('call')

  if (!lead) return null

  const handleStageChange = (newStage: LeadStage) => {
    updateLeadStage(lead.id, newStage)
    toast.success(`Pipeline Stage Updated: ${newStage.toUpperCase()}`)
    if (onUpdated) onUpdated()
  }

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNote.trim()) return

    addLeadActivity(lead.id, noteType, newNote.trim())
    toast.success('Activity Note Logged')
    setNewNote('')
    if (onUpdated) onUpdated()
  }

  const stageOrder: { stage: LeadStage; label: string }[] = [
    { stage: 'inquiry', label: '1. Inquiry' },
    { stage: 'trial_scheduled', label: '2. Trial Booked' },
    { stage: 'trial_attended', label: '3. Attended' },
    { stage: 'negotiating', label: '4. Negotiating' },
    { stage: 'converted', label: '5. Won' },
  ]

  const currentStageIndex = stageOrder.findIndex((s) => s.stage === lead.stage)

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={lead.name}
      description={`Sales Prospect · ${lead.goal} · Source: ${lead.source}`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Header Snapshot Card */}
        <div className="p-4 rounded-2xl glass-card border border-[var(--aurora-1)]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--aurora-1)] to-[var(--aurora-2)] flex items-center justify-center text-white font-display text-lg font-bold shadow-lg shadow-[var(--aurora-1)]/20 shrink-0">
              {getInitials(lead.name)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base font-semibold text-[var(--app-text-primary)]">
                  {lead.name}
                </h3>
                <StatusPill status={lead.stage === 'converted' ? 'success' : lead.stage === 'lost' ? 'danger' : 'info'}>
                  {lead.stage.replace('_', ' ').toUpperCase()}
                </StatusPill>
              </div>
              <p className="text-xs text-[var(--app-text-muted)] font-mono mt-0.5">
                {lead.phone} {lead.email ? `· ${lead.email}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                if (onConvertToMember) onConvertToMember(lead)
                onOpenChange(false)
              }}
              icon={<UserCheck className="w-3.5 h-3.5" />}
            >
              Convert to Member
            </Button>
          </div>
        </div>

        {/* Pipeline Stage Progression Stepper */}
        <div className="p-4 rounded-xl glass-input space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--app-text-muted)]">
              Pipeline Stage Progression
            </span>
            <span className="font-mono text-xs font-bold text-[var(--aurora-1)]">
              Deal Value: {formatINR(lead.expectedDealValueMinor)}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {stageOrder.map((step, idx) => {
              const isPast = currentStageIndex > idx
              const isCurrent = currentStageIndex === idx
              return (
                <button
                  key={step.stage}
                  type="button"
                  onClick={() => handleStageChange(step.stage)}
                  className={cn(
                    'p-2 rounded-lg text-center transition-all text-xs font-semibold',
                    isCurrent
                      ? 'bg-[var(--aurora-1)] text-white shadow-md'
                      : isPast
                      ? 'bg-[var(--app-success)]/20 text-[var(--app-success)] border border-[var(--app-success)]/30'
                      : 'glass-input text-[var(--app-text-muted)] hover:text-[var(--app-text-primary)]'
                  )}
                >
                  <span className="block truncate text-[0.6875rem]">{step.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Quick Communication Simulator */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <a
            href={`tel:${lead.phone}`}
            className="p-3 rounded-xl glass-card flex items-center justify-center gap-2 text-[var(--app-text-primary)] hover:border-[var(--aurora-1)] transition-colors"
          >
            <Phone className="w-4 h-4 text-[var(--app-success)]" />
            <span>Call Lead ({lead.phone})</span>
          </a>
          <a
            href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noreferrer"
            className="p-3 rounded-xl glass-card flex items-center justify-center gap-2 text-[var(--app-text-primary)] hover:border-[var(--aurora-1)] transition-colors"
          >
            <MessageSquare className="w-4 h-4 text-[var(--app-info)]" />
            <span>WhatsApp Message</span>
          </a>
        </div>

        {/* Activity Log Form */}
        <form onSubmit={handleAddActivity} className="p-4 rounded-xl glass-input space-y-3">
          <h4 className="font-semibold text-xs uppercase tracking-wider text-[var(--app-text-muted)]">
            Log Sales Interaction Note
          </h4>

          <div className="flex gap-2">
            <div className="w-36">
              <Select value={noteType} onValueChange={(val: any) => setNoteType(val)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Phone Call</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="note">Internal Note</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <input
              type="text"
              placeholder="e.g. Discussed Annual All-Access discount. Requested follow-up tomorrow."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="flex-1 h-10 px-3 text-xs glass-input text-[var(--app-text-primary)]"
            />
            <Button type="submit" variant="primary" size="sm" icon={<Send className="w-3.5 h-3.5" />}>
              Log
            </Button>
          </div>
        </form>

        {/* Activity Timeline */}
        <div className="space-y-3">
          <h4 className="font-semibold text-xs uppercase tracking-wider text-[var(--app-text-muted)]">
            Interaction History ({lead.activityLog.length})
          </h4>

          <div className="space-y-2">
            {lead.activityLog.map((act) => (
              <div key={act.id} className="p-3 rounded-xl glass-card border border-[var(--app-glass-border)] text-xs space-y-1">
                <div className="flex items-center justify-between font-mono text-[0.6875rem] text-[var(--app-text-muted)]">
                  <span className="font-bold text-[var(--aurora-1)] uppercase">{act.type}</span>
                  <span>{formatDateTime(act.timestamp)} · by {act.actor}</span>
                </div>
                <p className="text-[var(--app-text-primary)]">{act.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Drawer>
  )
}
