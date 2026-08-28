'use client'

import React, { useState } from 'react'
import { UserPlus, Sparkles, Phone, Mail, DollarSign } from 'lucide-react'
import { Modal } from '@/components/app/ui/modal'
import { Button } from '@/components/app/ui/button'
import { Input } from '@/components/app/ui/input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/app/ui/select'
import { createLead } from '@/lib/leads'
import type { CrmLead, LeadSource, LeadStage } from '@/types/leads'
import { toast } from '@/components/app/ui/toast'

export default function LeadModal({
  open,
  onOpenChange,
  onLeadCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLeadCreated?: (lead: CrmLead) => void
}) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('+91')
  const [email, setEmail] = useState('')
  const [goal, setGoal] = useState('Muscle Gain / Hypertrophy')
  const [source, setSource] = useState<LeadSource>('Instagram')
  const [stage, setStage] = useState<LeadStage>('inquiry')
  const [dealValue, setDealValue] = useState(56640) // ₹56,640
  const [assignedRep, setAssignedRep] = useState('Amit Sharma')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || phone.length < 10) return

    setLoading(true)

    const newLead = createLead({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      branchId: 'pow',
      branchName: 'Powai Flagship',
      goal,
      source,
      stage,
      expectedDealValueMinor: dealValue * 100,
      assignedRepId: 'usr_fd_01',
      assignedRepName: assignedRep,
      notes: notes.trim() || undefined,
    })

    setLoading(false)
    toast.success(`New CRM Lead Created: ${newLead.name}`)

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
      title="Create New Sales Prospect"
      description="Add a prospective lead into the DNA 360 sales conversion pipeline."
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
            label="Email Address"
            type="email"
            placeholder="siddharth@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--app-text-secondary)]">Lead Source</label>
            <Select value={source} onValueChange={(val: any) => setSource(val)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Instagram">Instagram / Meta</SelectItem>
                <SelectItem value="Facebook">Facebook Ads</SelectItem>
                <SelectItem value="Google">Google Search / Maps</SelectItem>
                <SelectItem value="Word Of Mouth">Word Of Mouth</SelectItem>
                <SelectItem value="Referral">Member Referral</SelectItem>
                <SelectItem value="Passing By">Passing By (Walk-By)</SelectItem>
                <SelectItem value="Corporate">Corporate Wellness</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--app-text-secondary)]">Fitness Goal</label>
            <Select value={goal} onValueChange={setGoal}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Muscle Gain / Hypertrophy">Muscle Gain / Hypertrophy</SelectItem>
                <SelectItem value="Fat Loss & Toning">Fat Loss & Toning</SelectItem>
                <SelectItem value="CrossFit & Conditioning">CrossFit & Conditioning</SelectItem>
                <SelectItem value="Power Yoga & Pilates">Power Yoga & Pilates</SelectItem>
                <SelectItem value="Strength & Power">Strength & Power</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Expected Deal Value (₹)"
            type="number"
            value={dealValue}
            onChange={(e) => setDealValue(Number(e.target.value))}
            required
          />

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--app-text-secondary)]">Assigned Sales Rep</label>
            <Select value={assignedRep} onValueChange={setAssignedRep}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Amit Sharma">Amit Sharma (Front Desk Lead)</SelectItem>
                <SelectItem value="Sneha Rao">Sneha Rao (Yoga Specialist)</SelectItem>
                <SelectItem value="Rajesh Poojary">Rajesh Poojary (Head Coach)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Input
          label="Prospect Requirements & Notes"
          placeholder="e.g. Interested in evening classes and personal training sessions"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--app-glass-border)]">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading} icon={<UserPlus className="w-4 h-4" />}>
            Add to Pipeline
          </Button>
        </div>
      </form>
    </Modal>
  )
}
