'use client'

import React, { useState } from 'react'
import { RefreshCw, CreditCard, CheckCircle, Sparkles, Receipt } from 'lucide-react'
import { Modal } from '@/components/app/ui/modal'
import { Button } from '@/components/app/ui/button'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/app/ui/select'
import { formatINR, backCalculateGst } from '@/lib/gst'
import { updateMember } from '@/lib/members'
import { getProducts } from '@/lib/products'
import { SEEDED_TRAINERS } from '@/lib/trainers'
import { getNextInvoiceNumber, recordMembershipInvoice } from '@/lib/billing'
import type { Member, MembershipRecord } from '@/types/member'
import { toast } from '@/components/app/ui/toast'

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
  const allProducts = React.useMemo(
    () => getProducts({ active: true }),
    []
  )
  const trainers = SEEDED_TRAINERS

  const [selectedPlanId, setSelectedPlanId] = useState(allProducts[0]?.id || 'prod_001')
  const [discountMinor, setDiscountMinor] = useState(0)
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'Card' | 'Cash' | 'NetBanking'>('UPI')
  const [customSessions, setCustomSessions] = useState<string>('')
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>(member?.assigned_trainer_id || '')
  const [customStartDate, setCustomStartDate] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [customExpiryDate, setCustomExpiryDate] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const selectedPlan = allProducts.find((p) => p.id === selectedPlanId) || allProducts[0]

  React.useEffect(() => {
    if (!selectedPlan) return
    setCustomSessions(selectedPlan.session_count ? String(selectedPlan.session_count) : '')
    const startObj = customStartDate ? new Date(customStartDate) : new Date()
    const endObj = new Date(startObj)
    endObj.setDate(endObj.getDate() + (selectedPlan.validity_days || 365))
    setCustomExpiryDate(endObj.toISOString().slice(0, 10))
  }, [selectedPlanId, customStartDate])

  React.useEffect(() => {
    if (member?.assigned_trainer_id) {
      setSelectedTrainerId(member.assigned_trainer_id)
    }
  }, [member?.assigned_trainer_id])

  if (!member || !selectedPlan) return null

  const grossInclusiveMinor = selectedPlan.list_price
  const netInclusiveMinor = Math.max(0, grossInclusiveMinor - discountMinor)
  const gst = backCalculateGst(netInclusiveMinor, selectedPlan.tax_rate || 0.05)
  const parsedSessions = customSessions.trim() !== '' ? Math.max(0, parseInt(customSessions, 10) || 0) : (selectedPlan.session_count || null)
  const chosenTrainer = trainers.find((t) => t.id === selectedTrainerId)

  const processRenewal = (paymentRef?: string, chosenMode?: string) => {
    const todayStr = new Date().toISOString().slice(0, 10)
    const activationDate = customStartDate || todayStr

    const endDateObj = new Date(activationDate)
    endDateObj.setDate(endDateObj.getDate() + (selectedPlan.validity_days || 365))
    const expiryDate = customExpiryDate || endDateObj.toISOString().slice(0, 10)

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
      tax_rate: selectedPlan.tax_rate || 0.05,
      status: 'active',
      invoice_id: `inv_rnw_${Date.now()}`,
      invoice_number: invoiceNumber,
      sales_rep_id: 'usr_fc_01',
      sales_rep_name: 'Rajesh Poojary',
      sessions_total: parsedSessions,
      sessions_consumed: 0,
      sessions_remaining: parsedSessions,
      access_window: selectedPlan.name.includes('Happy Hours') ? { start: '12:00', end: '15:30' } : null,
      void_reason: null,
      voided_by: null,
      voided_at: null,
      transferred_from: null,
      transferred_to: null,
      transfer_fee_invoice_id: null,
    }

    const isAddOnPack =
      selectedPlan.category.includes('pt') ||
      selectedPlan.category.includes('pilates') ||
      Boolean(parsedSessions && parsedSessions > 0)

    const updatedActiveMemberships = isAddOnPack
      ? [newMembership, ...(member.active_memberships || [])]
      : [newMembership]
    const past = isAddOnPack
      ? member.past_memberships
      : [...(member.active_memberships || []), ...(member.past_memberships || [])]

    updateMember(member.id, {
      status: 'active',
      active_memberships: updatedActiveMemberships,
      past_memberships: past,
      ...(chosenTrainer
        ? {
            assigned_trainer_id: chosenTrainer.id,
            assigned_trainer_name: chosenTrainer.name,
          }
        : {}),
      lifetime_value: member.lifetime_value + netInclusiveMinor,
      staff_notes: [
        {
          id: `sn_rnw_${Date.now()}`,
          authorId: 'usr_fc_01',
          authorName: 'Rajesh Poojary',
          authorRole: 'Fitness Consultant',
          timestamp: new Date().toISOString(),
          content: `Added/Renewed ${selectedPlan.name}${parsedSessions ? ` (${parsedSessions} sessions)` : ''}. Valid ${activationDate} to ${expiryDate}. Mode: ${chosenMode || paymentMode}${paymentRef ? ` (Ref: ${paymentRef})` : ''}. Invoice: ${newMembership.invoice_number}`,
          type: 'followup',
        },
        ...member.staff_notes,
      ],
    })

    // Issue legal GST Tax Invoice & ledger entry
    try {
      const actualPaymentMethod: 'UPI' | 'Card' | 'Cash' | 'NetBanking' =
        chosenMode?.toLowerCase().includes('card')
          ? 'Card'
          : chosenMode?.toLowerCase().includes('cash')
          ? 'Cash'
          : chosenMode?.toLowerCase().includes('netbanking')
          ? 'NetBanking'
          : paymentMode

      recordMembershipInvoice({
        memberId: member.id,
        memberName: member.name,
        memberPhone: member.phone,
        memberEmail: member.email || undefined,
        productName: selectedPlan.name,
        totalInclusiveMinor: netInclusiveMinor,
        paymentMethod: actualPaymentMethod,
        invoiceNumber,
        paymentReference: paymentRef,
      })
    } catch (invErr) {
      console.error('Failed to issue billing tax invoice for renewal:', invErr)
    }

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
      const { buildLineItem } = await import('@/lib/billing')
      const lineItem = buildLineItem({
        productId: selectedPlan.id,
        description: selectedPlan.name,
        sacCode: selectedPlan.sac_code || '999723',
        unitPriceInclusiveMinor: selectedPlan.list_price,
        quantity: 1,
        discountMinor: discountMinor,
        taxRate: selectedPlan.tax_rate || 0.05,
      })

      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountMinor: netInclusiveMinor,
          invoiceData: {
            grandTotalMinor: netInclusiveMinor,
            items: [lineItem],
          },
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
      title="Add / Renew Package & Session Slots"
      description={`Member: ${member.name} (${member.member_code})`}
      size="md"
    >
      <form onSubmit={handleRenewManual} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--app-text-secondary)]">
            Select Membership or Session Package (All 43 Official Plans)
          </label>
          <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {allProducts.map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.name} — {formatINR(plan.list_price)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--app-text-secondary)]">
              Start Date
            </label>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="w-full h-10 px-3 rounded-xl glass-input text-xs text-[var(--app-text-primary)]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--app-text-secondary)]">
              Expiry Date
            </label>
            <input
              type="date"
              value={customExpiryDate}
              onChange={(e) => setCustomExpiryDate(e.target.value)}
              className="w-full h-10 px-3 rounded-xl glass-input text-xs text-[var(--app-text-primary)]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--app-text-secondary)]">
              Session Slots (Optional)
            </label>
            <input
              type="number"
              min="0"
              placeholder="Unlimited"
              value={customSessions}
              onChange={(e) => setCustomSessions(e.target.value)}
              className="w-full h-10 px-3 rounded-xl glass-input text-xs text-[var(--app-text-primary)]"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--app-text-secondary)]">
            Assign Personal / Pilates Trainer (Optional)
          </label>
          <Select value={selectedTrainerId || 'none'} onValueChange={(v) => setSelectedTrainerId(v === 'none' ? '' : v)}>
            <SelectTrigger><SelectValue placeholder="No trainer assigned" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No trainer assigned</SelectItem>
              {trainers.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name} ({t.role})
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
        <div className="p-3.5 rounded-xl glass-input space-y-2 text-xs font-sans tabular-nums">
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

        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-[var(--app-glass-border)]">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-wrap">
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
