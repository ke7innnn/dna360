'use client'

import React, { useState } from 'react'
import { Calendar, User, Users, CheckCircle, AlertTriangle, Clock } from 'lucide-react'
import { Modal } from '@/components/app/ui/modal'
import { Button } from '@/components/app/ui/button'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/app/ui/select'
import { bookClassSession } from '@/lib/classes'
import { getStoredMembers } from '@/lib/members'
import type { ClassSession } from '@/types/class'
import { toast } from '@/components/app/ui/toast'
import { cn } from '@/lib/utils'

export default function BookClassModal({
  session,
  sessions = [],
  open,
  onOpenChange,
  onBookingCreated,
}: {
  session: ClassSession | null
  sessions?: ClassSession[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onBookingCreated?: () => void
}) {
  const members = getStoredMembers().filter((m) => !m.blacklisted)
  const [selectedSessionId, setSelectedSessionId] = useState<string>(session?.id || sessions[0]?.id || '')
  const [selectedMemberId, setSelectedMemberId] = useState<string>(members[0]?.id || '')
  const [useAdjustmentCredit, setUseAdjustmentCredit] = useState(false)
  const [loading, setLoading] = useState(false)

  const selectedSession = sessions.find((s) => s.id === selectedSessionId) || session
  const selectedMember = members.find((m) => m.id === selectedMemberId)
  const capacity = selectedSession?.capacity ?? 10
  const isFull = selectedSession ? selectedSession.bookedCount >= capacity : false

  const isPilates = selectedSession?.category === 'reformer_pilates' || selectedSession?.category === 'reformer_pilates_pt'

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSession || !selectedMemberId) return

    setLoading(true)
    const res = bookClassSession({
      sessionId: selectedSession.id,
      memberId: selectedMemberId,
      useAdjustmentCredit,
    })

    setLoading(false)

    if (res.success) {
      if (res.isWaitlisted) {
        toast.info(`Added to Waitlist (#${res.booking?.waitlistPosition})`, {
          description: `${selectedMember?.name} will be auto-promoted if a spot opens.`,
        })
      } else {
        toast.success(`Booking Confirmed for ${selectedMember?.name}`, {
          description: `${selectedSession.title} (${selectedSession.date} at ${selectedSession.startTime})`,
        })
      }
      if (onBookingCreated) onBookingCreated()
      onOpenChange(false)
    } else {
      toast.error(res.error || 'Failed to book class')
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Book Member into Class"
      description="Reserve a spot or add a member to the class waitlist."
      size="md"
    >
      <form onSubmit={handleBook} className="space-y-4">
        {/* Class Selection */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--app-text-secondary)]">Class Session</label>
          <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
            <SelectTrigger><SelectValue placeholder="Select class session" /></SelectTrigger>
            <SelectContent>
              {sessions.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.title} ({s.date} · {s.startTime}) — {s.bookedCount}/{s.capacity ?? 10} spots
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Member Selection */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--app-text-secondary)]">Active Member</label>
          <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
            <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
            <SelectContent>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name} ({m.member_code}) · {m.active_memberships[0]?.product_name || 'Active Plan'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Pilates Adjustment Credit Toggle */}
        {isPilates && selectedMember && (
          <div className="p-3 rounded-xl glass-input flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-teal-300 block">Missed Session Adjustment Credit</span>
              <span className="text-[var(--app-text-muted)]">
                {selectedMember.adjustment_credits_remaining} of 2 credits available on tenure
              </span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useAdjustmentCredit}
                onChange={(e) => setUseAdjustmentCredit(e.target.checked)}
                disabled={selectedMember.adjustment_credits_remaining <= 0}
                className="rounded"
              />
              <span className="font-medium text-xs">Apply Credit</span>
            </label>
          </div>
        )}

        {/* Real-time Class Capacity Status Box */}
        {selectedSession && (
          <div
            className={cn(
              'p-4 rounded-xl text-xs space-y-1.5 border',
              isFull
                ? 'bg-[var(--app-warning)]/10 border-[var(--app-warning)]/20 text-[var(--app-warning)]'
                : 'glass-card border-[var(--aurora-1)]/20'
            )}
          >
            <div className="flex items-center justify-between font-semibold">
              <span className="flex items-center gap-1.5">
                {isFull ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4 text-[var(--app-success)]" />}
                {isFull ? 'Class at Max Capacity' : 'Spots Available'}
              </span>
              <span className="font-mono">
                {selectedSession.bookedCount} / {capacity} booked
              </span>
            </div>
            <p className="text-[var(--app-text-muted)]">
              {isFull
                ? `Booking will place the member on waitlist position #${selectedSession.waitlistCount + 1}. Auto-promoted if a cancellation occurs 4h prior.`
                : `${capacity - selectedSession.bookedCount} spots remaining in ${selectedSession.studioName}.`}
            </p>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--app-glass-border)]">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading} icon={<Calendar className="w-4 h-4" />}>
            {isFull ? 'Add to Waitlist' : 'Confirm Class Booking'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
