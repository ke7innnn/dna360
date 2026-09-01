'use client'

import React, { useState } from 'react'
import { Snowflake, Calendar, AlertTriangle, ShieldAlert } from 'lucide-react'
import { Modal } from '@/components/app/ui/modal'
import { Button } from '@/components/app/ui/button'
import { Input } from '@/components/app/ui/input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/app/ui/select'
import { updateMember, addStaffNote } from '@/lib/members'
import type { Member } from '@/types/member'
import { toast } from '@/components/app/ui/toast'

export default function FreezeMemberModal({
  member,
  open,
  onOpenChange,
  onUpdated,
  onFrozen,
}: {
  member?: Member | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated?: () => void
  onFrozen?: () => void
}) {
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  )
  const [reasonCategory, setReasonCategory] = useState('Medical Injury / Doctor Advised')
  const [approverName, setApproverName] = useState('Vikramaditya Shinde (Asst. Sales Head)')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  if (!member) return null

  const handleManagerOverrideFreeze = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const fullReason = `[MANAGER EXCEPTION FREEZE] ${reasonCategory}. Approved By: ${approverName}. Details: ${notes || 'None'}`

    addStaffNote(member.id, {
      authorId: 'usr_mgr_sales_head',
      authorName: approverName,
      authorRole: 'Asst. Sales Head',
      content: fullReason,
      type: 'warning',
    })

    setLoading(false)
    toast.success(`Manager freeze override applied for ${member.name}`, {
      description: `Logged exception under ${approverName}`,
    })
    if (onUpdated) onUpdated()
    onOpenChange(false)
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Manager Freeze Exception Override"
      description={`Member: ${member.name} (${member.member_code})`}
      size="md"
    >
      <form onSubmit={handleManagerOverrideFreeze} className="space-y-4">
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 mt-0.5 text-amber-400 flex-shrink-0" />
          <div>
            <strong className="font-semibold block text-amber-200">DNA 360 Policy Notice:</strong>
            <span>Standard memberships do not permit freezing or pausing. This action constitutes a Manager Override and requires Asst. Sales Head authorization with mandatory audit logging.</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Pause Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="Pause End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--app-text-secondary)]">
            Override Authorizer
          </label>
          <Select value={approverName} onValueChange={setApproverName}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Monica Picholla (Asst. Sales Head)">Monica Picholla (Asst. Sales Head)</SelectItem>
              <SelectItem value="Swapnil Borhade (HR Head)">Swapnil Borhade (HR Head)</SelectItem>
              <SelectItem value="Executive Admin (Owner)">Executive Admin (Owner)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--app-text-secondary)]">
            Exception Reason
          </label>
          <Select value={reasonCategory} onValueChange={setReasonCategory}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Medical Injury / Doctor Advised">Medical Injury / Doctor Advised</SelectItem>
              <SelectItem value="Prolonged Hospitalisation">Prolonged Hospitalisation</SelectItem>
              <SelectItem value="Critical Family Emergency">Critical Family Emergency</SelectItem>
              <SelectItem value="Management Special Sanction">Management Special Sanction</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Input
          label="Medical Certificate / Evidence Reference"
          placeholder="e.g. Med cert attached #MC-9921 from Dr. Mehta"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          required
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--app-glass-border)]">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading} icon={<Snowflake className="w-4 h-4" />}>
            Authorize Manager Freeze
          </Button>
        </div>
      </form>
    </Modal>
  )
}
