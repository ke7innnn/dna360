'use client'

import React, { useState } from 'react'
import { PauseCircle, Calendar, AlertTriangle, ShieldCheck } from 'lucide-react'
import { Modal } from '@/components/app/ui/modal'
import { Button } from '@/components/app/ui/button'
import { Input } from '@/components/app/ui/input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/app/ui/select'
import { submitFreezeRequest } from '@/lib/memberportal'
import type { MemberFreezeRequest } from '@/types/memberportal'
import { toast } from '@/components/app/ui/toast'

export default function MemberFreezeRequestModal({
  open,
  onOpenChange,
  onRequestSubmitted,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRequestSubmitted?: () => void
}) {
  const [startDate, setStartDate] = useState('2026-09-01')
  const [endDate, setEndDate] = useState('2026-09-21')
  const [daysCount, setDaysCount] = useState(21)
  const [reason, setReason] = useState<MemberFreezeRequest['reason']>('Travel / Relocation')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    submitFreezeRequest({
      startDate,
      endDate,
      daysCount,
      reason,
      notes: notes.trim() || undefined,
    })

    setLoading(false)
    toast.success(`Freeze Request Submitted`, {
      description: `Request for ${daysCount} days pause sent to front desk management for approval.`,
    })

    if (onRequestSubmitted) onRequestSubmitted()
    onOpenChange(false)
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Request Temporary Membership Freeze"
      description="Pause your active membership for 14 to 60 days without forfeiting your validity."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Freeze Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />

          <Input
            label="Resume Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--app-text-secondary)]">Pause Duration</label>
            <Select value={String(daysCount)} onValueChange={(val) => setDaysCount(Number(val))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="14">14 Days (2 Weeks)</SelectItem>
                <SelectItem value="21">21 Days (3 Weeks)</SelectItem>
                <SelectItem value="30">30 Days (1 Month)</SelectItem>
                <SelectItem value="60">60 Days (Maximum Allowance)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--app-text-secondary)]">Reason for Pause</label>
            <Select value={reason} onValueChange={(val: any) => setReason(val)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Travel / Relocation">Work Travel / Vacation</SelectItem>
                <SelectItem value="Medical & Injury">Medical Injury / Recovery</SelectItem>
                <SelectItem value="Work / Personal">Work / Exam Commitments</SelectItem>
                <SelectItem value="Other">Other Personal Reason</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Input
          label="Supporting Details (Optional)"
          placeholder="e.g. Traveling to London for 3 weeks on business"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="p-3 rounded-xl bg-[var(--app-glass-bg)] border border-[var(--app-glass-border)] text-xs text-[var(--app-text-muted)] leading-relaxed">
          <strong>Note:</strong> Your membership expiry date will automatically be extended by {daysCount} days upon approval by the branch manager.
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--app-glass-border)]">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading} icon={<PauseCircle className="w-4 h-4" />}>
            Submit Freeze Request
          </Button>
        </div>
      </form>
    </Modal>
  )
}
