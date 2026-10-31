'use client'

import React, { useState, useMemo } from 'react'
import { Sparkles, CreditCard, CheckCircle } from 'lucide-react'
import { Modal } from '@/components/app/ui/modal'
import { Button } from '@/components/app/ui/button'
import { renewOrUpgradePlan } from '@/lib/memberportal'
import { getStoredPlans } from '@/lib/billing'
import type { GymPlan } from '@/types/billing'
import { formatINR, cn } from '@/lib/utils'
import { toast } from '@/components/app/ui/toast'
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

  // Real plans from the official catalog
  const availablePlans = useMemo<GymPlan[]>(() => {
    const plans = getStoredPlans()
    // Present the flagship Annual packages
    const annualPkg1 = plans.find((p) => p.id === 'plan_annual_pkg1') || plans[0]
    const allActivities =
      plans.find((p) => p.id === 'plan_annual_all_activities') || plans[1]
    return [annualPkg1, allActivities].filter(Boolean) as GymPlan[]
  }, [])

  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    availablePlans[0]?.id || 'plan_annual_pkg1'
  )
  const [loading, setLoading] = useState(false)

  const selectedPlan =
    availablePlans.find((p) => p.id === selectedPlanId) || availablePlans[0]

  const handleConfirm = async () => {
    if (loading || !selectedPlan) return
    setLoading(true)

    try {
      // 1. Create server-authoritative Razorpay Order
      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan.id,
          receipt: `rcpt_upg_${Date.now()}`,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.orderId) {
        throw new Error(data.error || 'Failed to initialize payment order.')
      }

      // 2. Launch Razorpay Checkout with server-derived amount and keyId
      await openRazorpayCheckout({
        orderId: data.orderId,
        amountMinor: data.amount,
        keyId: data.keyId,
        name: 'DNA 360 Gym & Wellness',
        description: selectedPlan.name,
        prefill: {
          name: user?.name || 'Member',
          email: user?.email || '',
        },
        onSuccess: async (rzpRes) => {
          // 3. Strict server-side HMAC signature & amount verification
          try {
            const vRes = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: rzpRes.razorpay_order_id,
                paymentId: rzpRes.razorpay_payment_id,
                signature: rzpRes.razorpay_signature,
              }),
            })

            const vData = await vRes.json()
            if (!vRes.ok || !vData.verified) {
              throw new Error(vData.error || 'Payment signature verification failed.')
            }

            // 4. Update member plan only AFTER verification passes
            renewOrUpgradePlan(
              selectedPlan,
              vData.amountMinor || data.amount,
              user?.id,
              rzpRes.razorpay_payment_id
            )

            toast.success('Membership Upgraded!', {
              description: `Payment confirmed via Razorpay (Ref: ${rzpRes.razorpay_payment_id})`,
            })
            setLoading(false)
            if (onUpgraded) onUpgraded()
            onOpenChange(false)
          } catch (vErr: any) {
            console.error('Payment verification failed:', vErr)
            setLoading(false)
            toast.error('Payment Verification Failed', {
              description:
                vErr.message ||
                'Payment captured on gateway but verification failed. Please contact the front desk.',
            })
          }
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
      description="Extend your membership validity or unlock multi-activity and personal training privileges."
      size="md"
    >
      <div className="space-y-4">
        {availablePlans.map((plan) => {
          const isSelected = selectedPlanId === plan.id
          const isAllActivities = plan.slug?.includes('all-activities')

          return (
            <div
              key={plan.id}
              onClick={() => setSelectedPlanId(plan.id)}
              className={cn(
                'p-4 rounded-xl border cursor-pointer transition-all space-y-1',
                isSelected
                  ? 'glass-card border-[var(--aurora-1)] ring-1 ring-[var(--aurora-1)] shadow-md'
                  : 'glass-input border-[var(--app-glass-border)] opacity-80'
              )}
            >
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-xs text-[var(--app-text-primary)] flex items-center gap-1.5">
                  {isAllActivities && <Sparkles className="w-3.5 h-3.5 text-[var(--aurora-1)]" />}
                  <span>{plan.name}</span>
                </h4>
                <span className="font-sans tabular-nums font-bold text-xs text-[var(--aurora-1)]">
                  {formatINR(plan.totalPriceMinor)} (incl. GST)
                </span>
              </div>
              <p className="text-[0.6875rem] text-[var(--app-text-muted)] leading-relaxed">
                {plan.features?.join(' · ') || `${plan.durationMonths} months full access.`}
              </p>
            </div>
          )
        })}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--app-glass-border)]">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            loading={loading}
            onClick={handleConfirm}
            icon={<CreditCard className="w-4 h-4" />}
          >
            Proceed to Payment
          </Button>
        </div>
      </div>
    </Modal>
  )
}
