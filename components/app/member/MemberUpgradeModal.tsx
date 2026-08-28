'use client'

import React, { useState } from 'react'
import { Sparkles, CheckCircle, CreditCard, ShieldCheck } from 'lucide-react'
import { Modal } from '@/components/app/ui/modal'
import { Button } from '@/components/app/ui/button'
import { renewOrUpgradePlan } from '@/lib/memberportal'
import { formatINR } from '@/lib/utils'
import { toast } from '@/components/app/ui/toast'
import { cn } from '@/lib/utils'

export default function MemberUpgradeModal({
  open,
  onOpenChange,
  onUpgraded,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpgraded?: () => void
}) {
  const [selectedPlan, setSelectedPlan] = useState<'renew' | 'vip_pt'>('renew')
  const [loading, setLoading] = useState(false)

  const handleConfirm = () => {
    setLoading(true)

    if (selectedPlan === 'renew') {
      renewOrUpgradePlan('Annual All-Access Premium (Renewed +365 Days)', 'Platinum All-Access', 5664000)
      toast.success('Membership Renewed for 1 Year!', {
        description: '365 days added to your active validity.',
      })
    } else {
      renewOrUpgradePlan('VIP Multi-Club Platinum + 20 PT Bundle', 'Diamond VIP All-Access', 8850000)
      toast.success('Upgraded to VIP Multi-Club + 20 PT Bundle!', {
        description: 'Unrestricted access to all DNA 360 clubs and 20 PT sessions added.',
      })
    }

    setLoading(false)
    if (onUpgraded) onUpgraded()
    onOpenChange(false)
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Renew or Upgrade Membership"
      description="Extend your membership validity or unlock multi-club personal training privileges."
      size="md"
    >
      <div className="space-y-4">
        {/* Option 1: 1-Year Early Renewal */}
        <div
          onClick={() => setSelectedPlan('renew')}
          className={cn(
            'p-4 rounded-xl border cursor-pointer transition-all space-y-1',
            selectedPlan === 'renew'
              ? 'glass-card border-[var(--aurora-1)] ring-1 ring-[var(--aurora-1)] shadow-md'
              : 'glass-input border-[var(--app-glass-border)] opacity-80'
          )}
        >
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-xs text-[var(--app-text-primary)]">
              Early 1-Year Renewal (+365 Days)
            </h4>
            <span className="font-mono font-bold text-xs text-[var(--aurora-1)]">₹56,640 (incl. GST)</span>
          </div>
          <p className="text-[0.6875rem] text-[var(--app-text-muted)]">
            Lock in your founder's rate and extend your membership by an additional 12 months.
          </p>
        </div>

        {/* Option 2: VIP Upgrade + PT */}
        <div
          onClick={() => setSelectedPlan('vip_pt')}
          className={cn(
            'p-4 rounded-xl border cursor-pointer transition-all space-y-1',
            selectedPlan === 'vip_pt'
              ? 'glass-card border-[var(--aurora-1)] ring-1 ring-[var(--aurora-1)] shadow-md'
              : 'glass-input border-[var(--app-glass-border)] opacity-80'
          )}
        >
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-xs text-[var(--app-text-primary)] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[var(--aurora-1)]" />
              <span>Upgrade to VIP Platinum + 20 PT Bundle</span>
            </h4>
            <span className="font-mono font-bold text-xs text-[var(--aurora-1)]">₹88,500 (incl. GST)</span>
          </div>
          <p className="text-[0.6875rem] text-[var(--app-text-muted)]">
            Unrestricted access across Powai & Andheri clubs + 20 dedicated 1-on-1 PT coaching sessions.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--app-glass-border)]">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="primary" loading={loading} onClick={handleConfirm} icon={<CreditCard className="w-4 h-4" />}>
            Proceed to Payment
          </Button>
        </div>
      </div>
    </Modal>
  )
}
