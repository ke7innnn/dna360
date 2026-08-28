'use client'

import React, { useState } from 'react'
import { AlertOctagon, ShieldAlert, KeyRound, CheckCircle } from 'lucide-react'
import { Modal } from '@/components/app/ui/modal'
import { Button } from '@/components/app/ui/button'
import { Input } from '@/components/app/ui/input'
import { triggerEmergencyEvacuation, resetEmergencyGates } from '@/lib/attendance'
import { toast } from '@/components/app/ui/toast'

export default function EmergencyModal({
  open,
  onOpenChange,
  isUnlocked,
  branchId = 'pow',
  onTriggered,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  isUnlocked: boolean
  branchId?: string
  onTriggered?: () => void
}) {
  const [confirmPhrase, setConfirmPhrase] = useState('')
  const [loading, setLoading] = useState(false)

  const handleToggle = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (isUnlocked) {
      resetEmergencyGates(branchId)
      toast.success('Emergency mode cleared. Turnstiles locked and online.')
    } else {
      triggerEmergencyEvacuation(branchId)
      toast.error('EMERGENCY EVACUATION ACTIVATED: All turnstiles unlocked.')
    }

    setLoading(false)
    setConfirmPhrase('')
    if (onTriggered) onTriggered()
    onOpenChange(false)
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isUnlocked ? 'Reset Turnstiles to Normal Access' : 'EMERGENCY EVACUATION: Unlock All Gates'}
      description={
        isUnlocked
          ? 'Lock magnetic turnstile gates back to normal RFID/QR access control mode.'
          : 'High-priority emergency safety override. Magnetically releases all physical turnstiles.'
      }
      size="md"
    >
      <form onSubmit={handleToggle} className="space-y-4">
        {!isUnlocked ? (
          <div className="p-4 rounded-xl bg-[var(--app-danger)]/15 border border-[var(--app-danger)]/30 text-xs text-[var(--app-danger)] space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <ShieldAlert className="w-5 h-5 text-[var(--app-danger)] shrink-0" />
              <span>DANGER: PHYSICAL TURNSTILES WILL OPEN</span>
            </div>
            <p className="leading-relaxed">
              Activating emergency evacuation will immediately cut power to all electromagnetic turnstile locks at the Powai branch to allow unimpeded exit during fire or medical emergencies.
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-[var(--app-success)]/15 border border-[var(--app-success)]/30 text-xs text-[var(--app-success)] space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <CheckCircle className="w-5 h-5" />
              <span>Resume Standard Turnstile Access Control</span>
            </div>
            <p className="leading-relaxed">
              Confirm that the facility is secure and all evacuation procedures are complete. Turnstiles will resume barcode and RFID validation.
            </p>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--app-glass-border)]">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant={isUnlocked ? 'primary' : 'danger'}
            loading={loading}
            icon={<AlertOctagon className="w-4 h-4" />}
          >
            {isUnlocked ? 'Confirm Reset to Normal' : 'CONFIRM EMERGENCY UNLOCK'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
