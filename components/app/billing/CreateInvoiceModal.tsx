'use client'

import React, { useState, useEffect } from 'react'
import {
  CreditCard, Plus, Trash2, CheckCircle,
  Receipt, Building2, User, Sparkles, ShieldAlert,
} from 'lucide-react'
import { Modal } from '@/components/app/ui/modal'
import { Button } from '@/components/app/ui/button'
import { Input } from '@/components/app/ui/input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/app/ui/select'
import { formatINR, backCalculateGst } from '@/lib/gst'
import { getStoredMembers } from '@/lib/members'
import { getProducts } from '@/lib/products'
import { issueInvoice, buildLineItem, validateDiscount } from '@/lib/billing'
import { getSalesReps } from '@/lib/auth'
import type { TaxInvoice, PaymentMode, InvoiceLineItem, PaymentSplit } from '@/types/billing'
import type { Member } from '@/types/member'
import type { Product } from '@/types/product'
import { toast } from '@/components/app/ui/toast'
import { cn } from '@/lib/utils'

export default function CreateInvoiceModal({
  open,
  onOpenChange,
  onInvoiceCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInvoiceCreated?: (invoice: TaxInvoice) => void
}) {
  const [members, setMembers] = useState<Member[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [salesReps, setSalesReps] = useState<{ id: string; name: string }[]>([])

  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [selectedProductId, setSelectedProductId] = useState('')
  const [salesRepId, setSalesRepId] = useState('')
  const [discountMinor, setDiscountMinor] = useState(0) // paise
  const [discountReason, setDiscountReason] = useState('')
  const [discountApprover, setDiscountApprover] = useState('Vikramaditya Shinde (Asst. Sales Head)')
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI')
  const [transactionRef, setPrimaryRef] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      const memberList = getStoredMembers()
      setMembers(memberList)
      if (memberList.length > 0 && !selectedMemberId) {
        setSelectedMemberId(memberList[0].id)
      }

      const productList = getProducts({ active: true })
      setProducts(productList)
      if (productList.length > 0 && !selectedProductId) {
        setSelectedProductId(productList[0].id)
      }

      const reps = getSalesReps()
      setSalesReps(reps)
      if (reps.length > 0 && !salesRepId) {
        setSalesRepId(reps[0].id)
      }
    }
  }, [open])

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0]
  const selectedMember = members.find((m) => m.id === selectedMemberId) || members[0]
  const selectedRep = salesReps.find((r) => r.id === salesRepId) || salesReps[0]

  const listPriceMinor = selectedProduct ? selectedProduct.list_price : 0
  const netPayableMinor = Math.max(0, listPriceMinor - discountMinor)
  const gst = backCalculateGst(netPayableMinor, selectedProduct?.tax_rate || 0.05)

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMember || !selectedProduct) {
      setError('Please select a member and a product')
      return
    }

    // Validate discount against ceiling
    const discountCheck = validateDiscount({
      totalGrossMinor: listPriceMinor,
      discountMinor,
      managerApproval: discountMinor > 0 ? {
        approvedBy: discountApprover,
        reason: discountReason || 'Promotional Override',
      } : undefined,
    })

    if (!discountCheck.allowed) {
      setError(discountCheck.reason || 'Discount ceiling exceeded')
      return
    }

    setLoading(true)

    const lineItem = buildLineItem({
      productId: selectedProduct.id,
      description: selectedProduct.name,
      sacCode: selectedProduct.sac_code,
      unitPriceInclusiveMinor: selectedProduct.list_price,
      quantity: 1,
      discountMinor,
      taxRate: selectedProduct.tax_rate,
    })

    const payments: PaymentSplit[] = [
      {
        id: `pay_${Date.now()}`,
        mode: paymentMode,
        amountMinor: netPayableMinor,
        transactionRef: transactionRef || undefined,
        recordedAt: new Date().toISOString(),
      },
    ]

    const newInvoice = issueInvoice({
      memberId: selectedMember.id,
      memberName: selectedMember.name,
      memberPhone: selectedMember.phone,
      memberEmail: selectedMember.email,
      items: [lineItem],
      payments,
      salesRepId: selectedRep?.id || 'usr_fc_01',
      salesRepName: selectedRep?.name || 'Amit Sharma',
      createdBy: {
        id: 'usr_fc_01',
        name: 'Amit Sharma',
        role: 'Fitness Consultant',
      },
      discountReason: discountMinor > 0 ? discountReason : undefined,
      discountApprovedBy: discountMinor > 0 ? discountApprover : undefined,
      notes: notes || undefined,
    })

    setLoading(false)
    toast.success(`Tax Invoice Generated: ${newInvoice.invoiceNumber}`, {
      description: `Billed to ${selectedMember.name} · ${formatINR(netPayableMinor)}`,
    })

    if (onInvoiceCreated) onInvoiceCreated(newInvoice)
    onOpenChange(false)
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Issue GST Tax Invoice"
      description="Base Fitness Private Limited · Gapless Sequence DNA/2026-27/000X"
      size="lg"
    >
      <form onSubmit={handleCreate} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-[var(--app-danger)]/10 border border-[var(--app-danger)]/20 text-xs text-[var(--app-danger)] font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--app-text-secondary)]">Member / Client *</label>
            <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
              <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} ({m.member_code}) · {m.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--app-text-secondary)]">Sales Rep Attribution *</label>
            <Select value={salesRepId} onValueChange={setSalesRepId}>
              <SelectTrigger><SelectValue placeholder="Select sales consultant" /></SelectTrigger>
              <SelectContent>
                {salesReps.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--app-text-secondary)]">Catalogue Package / Service *</label>
          <Select value={selectedProductId} onValueChange={setSelectedProductId}>
            <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
            <SelectContent>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} — {formatINR(p.list_price)} (Includes {p.tax_rate * 100}% GST)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--app-text-secondary)]">Discount (Paise)</label>
            <Select value={String(discountMinor)} onValueChange={(v) => setDiscountMinor(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">₹0 (Standard)</SelectItem>
                <SelectItem value="100000">₹1,000</SelectItem>
                <SelectItem value="200000">₹2,000</SelectItem>
                <SelectItem value="500000">₹5,000 (Requires Override)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--app-text-secondary)]">Payment Mode</label>
            <Select value={paymentMode} onValueChange={(v: any) => setPaymentMode(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="UPI">UPI (GPay / PhonePe)</SelectItem>
                <SelectItem value="Credit Card">Credit / Debit Card</SelectItem>
                <SelectItem value="Net Banking">Net Banking</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Input
            label="Payment Reference / UTR"
            placeholder="e.g. UPI/2026/99812"
            value={transactionRef}
            onChange={(e) => setPrimaryRef(e.target.value)}
          />
        </div>

        {discountMinor > 0 && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2 text-xs">
            <span className="font-semibold text-amber-300 block">Manager Discount Authorization:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Authorizer (Asst. Sales Head)"
                value={discountApprover}
                onChange={(e) => setDiscountApprover(e.target.value)}
                required
              />
              <Input
                label="Commercial Reason"
                placeholder="e.g. Founder Renewal Privilege"
                value={discountReason}
                onChange={(e) => setDiscountReason(e.target.value)}
                required
              />
            </div>
          </div>
        )}

        {/* GST Calculation Summary */}
        <div className="p-4 rounded-xl glass-input space-y-2 text-xs font-mono">
          <div className="flex justify-between text-[var(--app-text-secondary)]">
            <span>List Price (GST Inclusive):</span>
            <span>{formatINR(listPriceMinor)}</span>
          </div>
          {discountMinor > 0 && (
            <div className="flex justify-between text-[var(--app-success)]">
              <span>Discount Applied:</span>
              <span>-{formatINR(discountMinor)}</span>
            </div>
          )}
          <div className="flex justify-between text-[var(--app-text-secondary)]">
            <span>Taxable Amount (Ex-Tax):</span>
            <span>{formatINR(gst.taxable)}</span>
          </div>
          <div className="flex justify-between text-[var(--app-text-secondary)]">
            <span>GST (5% — 2.5% CGST + 2.5% SGST):</span>
            <span>{formatINR(gst.totalTax)}</span>
          </div>
          <div className="flex justify-between font-bold text-sm text-[var(--app-text-primary)] pt-2 border-t border-[var(--app-glass-border)]">
            <span>Total Payable Amount:</span>
            <span className="text-[var(--aurora-1)]">{formatINR(netPayableMinor)}</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--app-glass-border)]">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading} icon={<CheckCircle className="w-4 h-4" />}>
            Generate Tax Invoice
          </Button>
        </div>
      </form>
    </Modal>
  )
}
