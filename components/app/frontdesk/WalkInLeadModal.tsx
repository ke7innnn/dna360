'use client'

import React, { useState } from 'react'
import { UserPlus, Sparkles, QrCode, Phone, CheckCircle } from 'lucide-react'
import { Modal } from '@/components/app/ui/modal'
import { Button } from '@/components/app/ui/button'
import { Input } from '@/components/app/ui/input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/app/ui/select'
import { createWalkInLead } from '@/lib/frontdesk'
import type { WalkInLead } from '@/types/frontdesk'
import { toast } from '@/components/app/ui/toast'

export default function WalkInLeadModal({
  open,
  onOpenChange,
  onLeadCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLeadCreated?: (lead: WalkInLead) => void
}) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('+91')
  const [email, setEmail] = useState('')
  const [goal, setGoal] = useState<WalkInLead['goal']>('Muscle Gain')
  const [source, setSource] = useState<WalkInLead['source']>('Walk In')
  const [issueTrialPass, setIssueTrialPass] = useState(true)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || phone.length < 10) return

    setLoading(true)

    const newLead = createWalkInLead({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      branchId: 'pow',
      branchName: 'Powai',
      goal,
      source,
      issueTrialPass,
      notes: notes.trim() || undefined,
      assignedTo: 'Amit Sharma (Front Desk)',
    })

    setLoading(false)
    toast.success(`Walk-In Lead Recorded: ${newLead.name}`, {
      description: newLead.trialPassCode ? `1-Day Trial Pass ${newLead.trialPassCode} issued.` : undefined,
    })

    if (onLeadCreated) onLeadCreated(newLead)
    onOpenChange(false)

    // Reset fields
    setName('')
    setPhone('+91')
    setEmail('')
    setNotes('')
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Rapid Walk-In Lead & Trial Pass"
      description="Quick 30-second prospect intake and digital turnstile trial pass issuance."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Prospect Full Name"
          placeholder="e.g. Siddharth Rao"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Mobile Phone (+91)"
            placeholder="+9198200XXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />

          <Input
            label="Email Address (Optional)"
            type="email"
            placeholder="siddharth@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--app-text-secondary)]">Primary Goal</label>
            <Select value={goal} onValueChange={(val: any) => setGoal(val)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Muscle Gain">Muscle Gain / Hypertrophy</SelectItem>
                <SelectItem value="Fat Loss">Fat Loss & Toning</SelectItem>
                <SelectItem value="General Fitness">General Fitness</SelectItem>
                <SelectItem value="Athletic Conditioning">Athletic Conditioning</SelectItem>
                <SelectItem value="Rehab / Mobility">Rehab & Mobility</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--app-text-secondary)]">Inquiry Source</label>
            <Select value={source} onValueChange={(val: any) => setSource(val)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Walk In">Walk-In Reception</SelectItem>
                <SelectItem value="Referral">Member Referral</SelectItem>
                <SelectItem value="Phone">Phone Inquiry</SelectItem>
                <SelectItem value="Event">Event / Activation</SelectItem>
                <SelectItem value="Website">Website / Online</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 1-Day Trial Pass Checkbox */}
        <div className="p-4 rounded-xl glass-card border border-[var(--aurora-1)]/30 space-y-2">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={issueTrialPass}
              onChange={(e) => setIssueTrialPass(e.target.checked)}
              className="w-4 h-4 rounded border-[var(--app-glass-border)] text-[var(--aurora-1)] focus:ring-[var(--app-focus-ring)]"
            />
            <span className="font-semibold text-xs text-[var(--app-text-primary)] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[var(--aurora-1)]" />
              Issue Complimentary 1-Day Trial QR Pass
            </span>
          </label>
          {issueTrialPass && (
            <p className="text-[0.6875rem] text-[var(--app-text-muted)] pl-6">
              Authorizes Gate 1 optical scanner entry for today and sends digital pass details to prospect's phone.
            </p>
          )}
        </div>

        <Input
          label="Prospect Requirement Notes"
          placeholder="e.g. Inquired about morning CrossFit and Personal Training"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--app-glass-border)]">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading} icon={<UserPlus className="w-4 h-4" />}>
            Capture Lead & Issue Pass
          </Button>
        </div>
      </form>
    </Modal>
  )
}
