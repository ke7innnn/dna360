'use client'

import React, { useState } from 'react'
import { RefreshCw, CreditCard, CheckCircle, Sparkles, Receipt } from 'lucide-react'
import { Modal } from '@/components/app/ui/modal'
import { Button } from '@/components/app/ui/button'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/app/ui/select'
import { formatINR, backCalculateGst } from '@/lib/gst'
import { updateMember } from '@/lib/members'
import { getNextInvoiceNumber } from '@/lib/billing'
import type { Member, MembershipRecord } from '@/types/member'
import { toast } from '@/components/app/ui/toast'

const RENEWAL_PLANS = [
  { id: 'prod_001', name: 'Annual Gym Membership Package 1', durationMonths: 12, validityDays: 365, priceInclusiveMinor: 4350000, category: 'gym_membership' },
  { id: 'prod_002', name: 'Annual Gym — Ice Bath Included', durationMonths: 12, validityDays: 365, priceInclusiveMinor: 5500000, category: 'gym_membership' },
  { id: 'prod_003', name: 'Annual Gym — All Activities', durationMonths: 12, validityDays: 365, priceInclusiveMinor: 6549900, category: 'gym_membership' },
  { id: 'prod_004', name: 'Annual Happy Hours Gym Membership', durationMonths: 12, validityDays: 365, priceInclusiveMinor: 2999900, category: 'gym_membership' },
  { id: 'prod_029', name: 'Reformer Pilates — 36 Sessions (3 Months)', durationMonths: 3, validityDays: 90, priceInclusiveMinor: 4463700, category: 'reformer_pilates' },
]

export default function RenewMemberModal({
  member,
  open,
  onOpenChange,
  onUpdated,
  onRenewed,
}: {
  member: Member | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated?: () => void
  onRenewed?: () => void
}) {
  const [selectedPlanId, setSelectedPlanId] = useState('prod_001')
  const [discountMinor, setDiscountMinor] = useState(200000) // ₹2,000 renewal loyalty discount
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'Card' | 'Cash' | 'NetBanking'>('UPI')
  const [loading, setLoading] = useState(false)

  if (!member) return null

  const selectedPlan = RENEWAL_PLANS.find((p) => p.id === selectedPlanId) || RENEWAL_PLANS[0]
  const grossInclusiveMinor = selectedPlan.priceInclusiveMinor
  const netInclusiveMinor = Math.max(0, grossInclusiveMinor - discountMinor)
  const gst = backCalculateGst(netInclusiveMinor, 0.05)

  const processRenewal = (paymentRef?: string, chosenMode?: string) => {
    const todayStr = new Date().toISOString().slice(0, 10)
    const primaryMembership = member.active_memberships[0]
    const currentEnd = primaryMembership?.expiry_date ? new Date(primaryMembership.expiry_date) : new Date()
    const startDateObj = currentEnd > new Date() ? currentEnd : new Date()
    const activationDate = startDateObj.toISOString().slice(0, 10)

    const endDateObj = new Date(startDateObj)
    endDateObj.setDate(endDateObj.getDate() + selectedPlan.validityDays)
    const expiryDate = endDateObj.toISOString().slice(0, 10)

    const invoiceNumber = getNextInvoiceNumber()

    const newMembership: MembershipRecord = {
      id: `ms_rnw_${Date.now()}`,
      product_id: selectedPlan.id,
      product_name: selectedPlan.name,
      product_category: selectedPlan.category,
      enrolment_date: todayStr,
      activation_date: activationDate,
      expiry_date: expiryDate,
      amount_paid: netInclusiveMinor,
      discount_amount: discountMinor,
      discount_reason: discountMinor > 0 ? 'Member Renewal Privilege' : null,
      discount_approved_by: null,
      tax_rate: 0.05,
      status: 'active',
      invoice_id: `inv_rnw_${Date.now()}`,
      invoice_number: invoiceNumber,
      sales_rep_id: 'usr_fc_01',
      sales_rep_name: 'Amit Sharma',
      sessions_total: selectedPlan.category === 'reformer_pilates' ? 36 : null,
      sessions_consumed: 0,
      sessions_remaining: selectedPlan.category === 'reformer_pilates' ? 36 : null,
      access_window: selectedPlan.name.includes('Happy Hours') ? { start: '12:00', end: '15:30' } : null,
      void_reason: null,
      voided_by: null,
      voided_at: null,
      transferred_from: null,
      transferred_to: null,
      transfer_fee_invoice_id: null,
    }

    const past = [...member.active_memberships, ...member.past_memberships]

    updateMember(member.id, {
      status: 'active',
      active_memberships: [newMembership],
      past_memberships: past,
      lifetime_value: member.lifetime_value + netInclusiveMinor,
      staff_notes: [
        {
          id: `sn_rnw_${Date.now()}`,
          authorId: 'usr_fc_01',
          authorName: 'Amit Sharma',
          authorRole: 'Fitness Consultant',
          timestamp: new Date().toISOString(),
          content: `Renewed with ${selectedPlan.name}. Valid until ${expiryDate}. Mode: ${chosenMode || paymentMode}${paymentRef ? ` (Ref: ${paymentRef})` : ''}. Invoice: ${newMembership.invoice_number}`,
          type: 'followup',
        },
        ...member.staff_notes,
      ],
    })

    setLoading(false)
    toast.success(`Membership renewed for ${member.name}!`, {
      description: `New validity extended to ${expiryDate}${paymentRef ? ` · Payment Ref: ${paymentRef}` : ''}`,
    })
    if (onUpdated) onUpdated()
    if (onRenewed) onRenewed()
    onOpenChange(false)
  }

  const handleRenewManual = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    processRenewal()
  }

  const handleRenewRazorpay = async () => {
    setLoading(true)
    try {
      const { openRazorpayCheckout } = await import('@/lib/razorpay')
      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountMinor: netInclusiveMinor,
          receipt: `rcpt_rnw_${Date.now()}`,
          notes: {
            memberId: member.id,
            memberName: member.name,
            planName: selectedPlan.name,
          },
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.orderId) {
        throw new Error(data.error || 'Failed to create Razorpay payment order')
      }

      await openRazorpayCheckout({
        orderId: data.orderId,
        amountMinor: netInclusiveMinor,
        name: 'DNA 360 Gym & Wellness',
        description: `Renewal: ${selectedPlan.name}`,
        prefill: {
          name: member.name,
          email: member.email || '',
          contact: member.phone || '',
        },
        onSuccess: async (rzpRes) => {
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
            console.warn('Verification warning:', e)
          }

          processRenewal(rzpRes.razorpay_payment_id, 'Razorpay Live')
        },
        onDismiss: () => {
          setLoading(false)
          toast.info('Payment cancelled', { description: 'Razorpay checkout was dismissed.' })
        },
      })
    } catch (err: any) {
      console.error('Razorpay renewal error:', err)
      setLoading(false)
      toast.error('Payment Error', {
        description: err.message || 'Could not initiate Razorpay checkout.',
      })
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Renew Membership Plan"
      description={`Member: ${member.name} (${member.member_code})`}
      size="md"
    >
      <form onSubmit={handleRenewManual} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--app-text-secondary)]">
            Select Renewal Package (GST Inclusive)
          </label>
          <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {RENEWAL_PLANS.map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.name} — {formatINR(plan.priceInclusiveMinor)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--app-text-secondary)]">
              Renewal Discount (Loyalty)
            </label>
            <Select
              value={String(discountMinor)}
              onValueChange={(val) => setDiscountMinor(Number(val))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">₹0 (No Discount)</SelectItem>
                <SelectItem value="100000">₹1,000 (Early Bird)</SelectItem>
                <SelectItem value="200000">₹2,000 (Loyalty Perk)</SelectItem>
                <SelectItem value="500000">₹5,000 (Corporate Promo)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--app-text-secondary)]">
              Payment Method
            </label>
            <Select value={paymentMode} onValueChange={(val: any) => setPaymentMode(val)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="UPI">UPI (GPay / PhonePe)</SelectItem>
                <SelectItem value="Card">Credit / Debit Card</SelectItem>
                <SelectItem value="Cash">Cash at Register</SelectItem>
                <SelectItem value="NetBanking">Net Banking</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* GST Invoice Ledger Summary */}
        <div className="p-3.5 rounded-xl glass-input space-y-2 text-xs font-mono">
          <div className="flex justify-between text-[var(--app-text-secondary)]">
            <span>List Price (GST Inclusive):</span>
            <span>{formatINR(grossInclusiveMinor)}</span>
          </div>
          {discountMinor > 0 && (
            <div className="flex justify-between text-[var(--app-success)]">
              <span>Loyalty Discount:</span>
              <span>-{formatINR(discountMinor)}</span>
            </div>
          )}
          <div className="flex justify-between text-[var(--app-text-secondary)]">
            <span>Taxable Value (Ex-Tax):</span>
            <span>{formatINR(gst.taxable)}</span>
          </div>
          <div className="flex justify-between text-[var(--app-text-secondary)]">
            <span>GST (5% — 2.5% CGST + 2.5% SGST):</span>
            <span>{formatINR(gst.totalTax)}</span>
          </div>
          <div className="flex justify-between font-bold text-sm text-[var(--app-text-primary)] pt-2 border-t border-[var(--app-glass-border)]">
            <span>Total Payable:</span>
            <span className="text-[var(--aurora-1)]">{formatINR(netInclusiveMinor)}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-[var(--app-glass-border)]">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={handleRenewManual}
              icon={<Receipt className="w-4 h-4" />}
            >
              Manual / Cash
            </Button>
            <Button
              type="button"
              variant="primary"
              loading={loading}
              onClick={handleRenewRazorpay}
              icon={<CreditCard className="w-4 h-4 text-white" />}
              className="bg-gradient-to-r from-emerald-500 to-[#00c8c8] hover:opacity-90 shadow-lg shadow-emerald-500/20 text-white font-medium"
            >
              Pay via Razorpay Live (UPI / Card)
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
