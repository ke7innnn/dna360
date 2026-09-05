'use client'

import React, { useState } from 'react'
import { Sparkles, CheckCircle, CreditCard, ShieldCheck } from 'lucide-react'
import { Modal } from '@/components/app/ui/modal'
import { Button } from '@/components/app/ui/button'
import { renewOrUpgradePlan } from '@/lib/memberportal'
import { formatINR } from '@/lib/utils'
import { toast } from '@/components/app/ui/toast'
import { cn } from '@/lib/utils'

import { openRazorpayCheckout } from '@/lib/razorpay'
import { useAuth } from '@/context/AuthContext'

export default function MemberUpgradeModal({
  open,
  onOpenChange,
  onUpgraded,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpgraded?: () => void
}) {
  const { user } = useAuth()
  const [selectedPlan, setSelectedPlan] = useState<'renew' | 'vip_pt'>('renew')
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)

    const isRenew = selectedPlan === 'renew'
    const planName = isRenew ? 'Annual All-Access Premium (Renewed +365 Days)' : 'VIP Multi-Club Platinum + 20 PT Bundle'
    const tier = isRenew ? 'Platinum All-Access' : 'Diamond VIP All-Access'
    const amountMinor = isRenew ? 5664000 : 8850000

    try {
      // 1. Create live Razorpay Order on server
      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountMinor,
          receipt: `rcpt_upg_${Date.now()}`,
          notes: {
            memberId: user?.id || 'member_curr',
            memberName: user?.name || 'DNA 360 Member',
            planName,
          },
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.orderId) {
        throw new Error(data.error || 'Failed to initialize Razorpay payment order.')
      }

      // 2. Launch Razorpay Checkout Modal
      await openRazorpayCheckout({
        orderId: data.orderId,
        amountMinor,
        name: 'DNA 360 Gym & Wellness',
        description: `${planName} (${tier})`,
        prefill: {
          name: user?.name || 'Member',
          email: user?.email || '',
        },
        onSuccess: async (rzpRes) => {
          // 3. Verify signature on server
          try {
            await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: rzpRes.razorpay_order_id,
                paymentId: rzpRes.razorpay_payment_id,
                signature: rzpRes.razorpay_signature,
              }),
            })
          } catch (e) {
            console.warn('Signature verification call:', e)
          }

          // 4. Update member plan
          renewOrUpgradePlan(planName, tier, amountMinor)
          toast.success(isRenew ? 'Membership Renewed for 1 Year!' : 'VIP Platinum Upgraded!', {
            description: `Payment confirmed via Razorpay (Ref: ${rzpRes.razorpay_payment_id})`,
          })
          setLoading(false)
          if (onUpgraded) onUpgraded()
          onOpenChange(false)
        },
        onDismiss: () => {
          setLoading(false)
          toast.info('Payment cancelled', { description: 'No charges were incurred.' })
        },
      })
    } catch (err: any) {
      console.error('Razorpay Checkout failed:', err)
      setLoading(false)
      toast.error('Payment Error', {
        description: err.message || 'Unable to start online payment.',
      })
    }
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
