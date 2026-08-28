'use client'

import React, { useState } from 'react'
import { KeyRound, CheckCircle, Lock, User, RefreshCw } from 'lucide-react'
import { Modal } from '@/components/app/ui/modal'
import { Button } from '@/components/app/ui/button'
import { Input } from '@/components/app/ui/input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/app/ui/select'
import { getStoredLockers, assignLocker, releaseLocker } from '@/lib/frontdesk'
import { getStoredMembers } from '@/lib/members'
import type { Locker } from '@/types/frontdesk'
import { toast } from '@/components/app/ui/toast'
import { cn } from '@/lib/utils'

export default function LockerModal({
  open,
  onOpenChange,
  onLockersUpdated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLockersUpdated?: () => void
}) {
  const lockers = getStoredLockers()
  const members = getStoredMembers()

  const [selectedZone, setSelectedZone] = useState<string>('all')
  const [selectedLocker, setSelectedLocker] = useState<Locker | null>(null)
  const [assignMemberId, setAssignMemberId] = useState(members[0]?.id || '')

  const filteredLockers = selectedZone === 'all'
    ? lockers
    : lockers.filter((l) => l.zone === selectedZone)

  const handleLockerClick = (locker: Locker) => {
    setSelectedLocker(locker)
  }

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLocker || !assignMemberId) return

    const member = members.find((m) => m.id === assignMemberId)
    if (!member) return

    assignLocker(selectedLocker.id, member.id, member.name, member.phone)
    toast.success(`Locker #${selectedLocker.number} Key Assigned to ${member.name}`)

    setSelectedLocker(null)
    if (onLockersUpdated) onLockersUpdated()
  }

  const handleRelease = (locker: Locker) => {
    releaseLocker(locker.id)
    toast.success(`Locker #${locker.number} Key Checked In & Released`)

    setSelectedLocker(null)
    if (onLockersUpdated) onLockersUpdated()
  }

  const statusColorMap: Record<Locker['status'], { bg: string; text: string; border: string }> = {
    available: { bg: 'bg-[var(--app-success)]/10', text: 'text-[var(--app-success)]', border: 'border-[var(--app-success)]/30' },
    occupied: { bg: 'bg-[var(--aurora-1)]/10', text: 'text-[var(--aurora-1)]', border: 'border-[var(--aurora-1)]/30' },
    dedicated_rental: { bg: 'bg-[var(--app-warning)]/10', text: 'text-[var(--app-warning)]', border: 'border-[var(--app-warning)]/30' },
    maintenance: { bg: 'bg-[var(--app-danger)]/10', text: 'text-[var(--app-danger)]', border: 'border-[var(--app-danger)]/30' },
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Floor Locker Key Management"
      description="Track and allocate 48 studio lockers across Male, Female, and VIP zones."
      size="lg"
    >
      <div className="space-y-4">
        {/* Zone Selector */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--app-glass-border)] pb-3">
          <div className="flex gap-1.5 p-1 rounded-xl glass-input">
            {[
              { id: 'all', label: 'All Zones (48)' },
              { id: 'Male Floor', label: 'Male Floor (20)' },
              { id: 'Female Floor', label: 'Female Floor (20)' },
              { id: 'Executive VIP', label: 'Executive VIP (8)' },
            ].map((zone) => (
              <button
                key={zone.id}
                type="button"
                onClick={() => setSelectedZone(zone.id)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all',
                  selectedZone === zone.id
                    ? 'bg-[var(--app-sidebar-active)] text-[var(--app-text-primary)] shadow-xs'
                    : 'text-[var(--app-text-muted)] hover:text-[var(--app-text-secondary)]'
                )}
              >
                {zone.label}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 text-[0.6875rem]">
            <span className="flex items-center gap-1 text-[var(--app-success)]">
              <span className="w-2 h-2 rounded-full bg-[var(--app-success)]" /> Available
            </span>
            <span className="flex items-center gap-1 text-[var(--aurora-1)]">
              <span className="w-2 h-2 rounded-full bg-[var(--aurora-1)]" /> Occupied
            </span>
            <span className="flex items-center gap-1 text-[var(--app-warning)]">
              <span className="w-2 h-2 rounded-full bg-[var(--app-warning)]" /> Dedicated Rental
            </span>
          </div>
        </div>

        {/* Locker Grid */}
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2 max-h-[45vh] overflow-y-auto pr-1">
          {filteredLockers.map((lck) => {
            const style = statusColorMap[lck.status]
            return (
              <button
                key={lck.id}
                type="button"
                onClick={() => handleLockerClick(lck)}
                className={cn(
                  'p-2 rounded-xl border text-center transition-all hover:scale-105',
                  style.bg,
                  style.text,
                  style.border,
                  selectedLocker?.id === lck.id ? 'ring-2 ring-[var(--aurora-1)] ring-offset-2' : ''
                )}
              >
                <span className="font-mono text-xs font-bold block">#{lck.number}</span>
                <span className="text-[0.5625rem] truncate uppercase block mt-0.5 opacity-80">
                  {lck.status === 'available' ? 'Open' : lck.status === 'occupied' ? 'Key Out' : 'Rental'}
                </span>
              </button>
            )
          })}
        </div>

        {/* Selected Locker Detail / Assignment Panel */}
        {selectedLocker && (
          <div className="p-4 rounded-xl glass-input space-y-3 border border-[var(--aurora-1)]/30 mt-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-display text-sm font-bold text-[var(--app-text-primary)]">
                  Locker #{selectedLocker.number} · {selectedLocker.zone}
                </h4>
                <p className="text-xs text-[var(--app-text-muted)]">
                  Status: {selectedLocker.status.toUpperCase()}
                </p>
              </div>

              {selectedLocker.status === 'occupied' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleRelease(selectedLocker)}
                  icon={<CheckCircle className="w-3.5 h-3.5" />}
                >
                  Check In & Release Key
                </Button>
              )}
            </div>

            {selectedLocker.status === 'available' ? (
              <form onSubmit={handleAssign} className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1">
                  <Select value={assignMemberId} onValueChange={setAssignMemberId}>
                    <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                    <SelectContent>
                      {members.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name} ({m.memberCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" variant="primary" icon={<KeyRound className="w-4 h-4" />}>
                  Check Out Key
                </Button>
              </form>
            ) : selectedLocker.assignedMemberName ? (
              <div className="text-xs font-mono text-[var(--app-text-secondary)]">
                Assigned to: <strong className="text-[var(--app-text-primary)]">{selectedLocker.assignedMemberName}</strong> ({selectedLocker.assignedMemberPhone})
              </div>
            ) : null}
          </div>
        )}
      </div>
    </Modal>
  )
}
