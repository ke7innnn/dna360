'use client'

import React, { useState } from 'react'
import { KeyRound, ShieldCheck, User } from 'lucide-react'
import { Modal } from '@/components/app/ui/modal'
import { Button } from '@/components/app/ui/button'
import { Input } from '@/components/app/ui/input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/app/ui/select'
import { getStoredMembers } from '@/lib/members'
import { triggerManualOverride } from '@/lib/attendance'
import { toast } from '@/components/app/ui/toast'
import type { Member } from '@/types/member'

export default function ManualOverrideModal({
  member: initialMember,
  open,
  onOpenChange,
  gateId: initialGateId,
  onOverridden,
}: {
  member: Member | null
  open: boolean
  onOpenChange: (open: boolean) => void
  gateId?: string
  onOverridden?: () => void
}) {
  const members = getStoredMembers()
  const [selectedMemberId, setSelectedMemberId] = useState(initialMember?.id || (members[0]?.id ?? ''))
  const [gateId, setGateId] = useState('gate_pow_01')
  const [reason, setReason] = useState('Member promise to clear pending dues after workout')
  const [customNote, setCustomNote] = useState('')
  const [loading, setLoading] = useState(false)

  const handleOverride = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMemberId) return

    setLoading(true)
    const finalReason = customNote.trim() ? `${reason} (${customNote.trim()})` : reason
    const result = triggerManualOverride(selectedMemberId, gateId, finalReason)
    setLoading(false)

    if (result) {
      toast.success(`Turnstile Override Granted for ${result.memberName}`, {
        description: `Gate: ${result.gateName}. Logged to audit trail.`,
      })
      if (onOverridden) onOverridden()
      onOpenChange(false)
    } else {
      toast.error('Failed to execute override')
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Staff Turnstile Manual Override"
      description="Authorize a single entry bypass for a member with an audited justification."
      size="md"
    >
      <form onSubmit={handleOverride} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--app-text-secondary)]">Member</label>
          <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
            <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
            <SelectContent>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name} ({m.memberCode}) · {m.status.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--app-text-secondary)]">Turnstile Gate</label>
          <Select value={gateId} onValueChange={setGateId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="gate_pow_01">Gate 1 - Main Entrance Turnstile</SelectItem>
              <SelectItem value="gate_pow_02">Gate 2 - Steam & Locker Zone Turnstile</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--app-text-secondary)]">Override Justification Reason</label>
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Member promise to clear pending dues after workout">
                Pending dues — Member clearing post-session
              </SelectItem>
              <SelectItem value="Phone battery drained / Forgot physical RFID card">
                Device issue / Forgot RFID card
              </SelectItem>
              <SelectItem value="VIP Guest Pass / Trial Workout approved by Manager">
                VIP Trial Pass approved by Manager
              </SelectItem>
              <SelectItem value="Turnstile barcode optical scanner misread">
                Turnstile optical scanner hardware misread
              </SelectItem>
              <SelectItem value="Other exception">Other Staff Discretion Exception</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Input
          label="Additional Reference Note"
          placeholder="e.g. Approved by Sneha Rao for morning workout"
          value={customNote}
          onChange={(e) => setCustomNote(e.target.value)}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--app-glass-border)]">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading} icon={<KeyRound className="w-4 h-4" />}>
            Execute Gate Override
          </Button>
        </div>
      </form>
    </Modal>
  )
}
