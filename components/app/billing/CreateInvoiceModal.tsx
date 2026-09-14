'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  CreditCard,
  Plus,
  Trash2,
  CheckCircle,
  Receipt,
  Building2,
  User,
  Sparkles,
  ShieldAlert,
  Search,
  X,
  ChevronDown,
  Phone,
  Tag,
  Check,
  Percent,
  Layers,
  ArrowRight,
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
import { cn, getInitials } from '@/lib/utils'

export default function CreateInvoiceModal({
  open,
  onOpenChange,
  onInvoiceCreated,
  initialMemberId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInvoiceCreated?: (invoice: TaxInvoice) => void
  initialMemberId?: string
}) {
  const [members, setMembers] = useState<Member[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [salesReps, setSalesReps] = useState<{ id: string; name: string }[]>([])

  // Member Search State
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [memberSearchQuery, setMemberSearchQuery] = useState('')
  const [isSearchingMember, setIsSearchingMember] = useState(false)
  const memberSearchInputRef = useRef<HTMLInputElement>(null)

  // Product Selection & Category Filter
  const [selectedProductCategory, setSelectedProductCategory] = useState<string>('all')
  const [selectedProductId, setSelectedProductId] = useState('')

  // Sales & Commercial
  const [salesRepId, setSalesRepId] = useState('')
  const [discountMinor, setDiscountMinor] = useState(0) // paise
  const [customDiscountText, setCustomDiscountText] = useState('')
  const [isCustomDiscount, setIsCustomDiscount] = useState(false)
  const [discountReason, setDiscountReason] = useState('')
  const [discountApprover, setDiscountApprover] = useState('Vikramaditya Shinde (Asst. Sales Head)')
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI')
  const [transactionRef, setPrimaryRef] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize data on modal open
  useEffect(() => {
    if (open) {
      const memberList = getStoredMembers()
      setMembers(memberList)

      if (initialMemberId) {
        const found = memberList.find((m) => m.id === initialMemberId)
        if (found) {
          setSelectedMember(found)
          setIsSearchingMember(false)
        }
      } else if (memberList.length > 0 && !selectedMember) {
        setSelectedMember(memberList[0])
        setIsSearchingMember(false)
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

      setError(null)
    }
  }, [open, initialMemberId])

  // Filter members by query (Name, Phone, Code, or Email)
  const filteredMembers = useMemo(() => {
    if (!memberSearchQuery.trim()) {
      return members.slice(0, 8)
    }
    const q = memberSearchQuery.toLowerCase().trim()
    return members
      .filter((m) => {
        const nameMatch = m.name?.toLowerCase().includes(q)
        const phoneMatch = m.phone?.replace(/\D/g, '').includes(q.replace(/\D/g, '')) || m.phone?.includes(q)
        const codeMatch = m.member_code?.toLowerCase().includes(q)
        const emailMatch = m.email?.toLowerCase().includes(q)
        return nameMatch || phoneMatch || codeMatch || emailMatch
      })
      .slice(0, 10)
  }, [members, memberSearchQuery])

  // Filter products by category
  const filteredProducts = useMemo(() => {
    if (selectedProductCategory === 'all') return products
    return products.filter((p) => p.category === selectedProductCategory)
  }, [products, selectedProductCategory])

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0]
  const selectedRep = salesReps.find((r) => r.id === salesRepId) || salesReps[0]

  const listPriceMinor = selectedProduct ? selectedProduct.list_price : 0
  const netPayableMinor = Math.max(0, listPriceMinor - discountMinor)
  const gst = backCalculateGst(netPayableMinor, selectedProduct?.tax_rate || 0.05)

  // Handle selecting a member from search results
  const handleSelectMember = (member: Member) => {
    setSelectedMember(member)
    setIsSearchingMember(false)
    setMemberSearchQuery('')
    setError(null)
  }

  // Handle quick discount pill clicks
  const handleSelectDiscountPreset = (amountMinor: number) => {
    setIsCustomDiscount(false)
    setDiscountMinor(amountMinor)
    setCustomDiscountText('')
  }

  const handleCustomDiscountChange = (valStr: string) => {
    setCustomDiscountText(valStr)
    const num = parseFloat(valStr) || 0
    setDiscountMinor(Math.round(num * 100))
  }

  const executeIssueInvoice = (ref?: string, mode?: PaymentMode) => {
    if (!selectedMember) {
      setError('Please select a member to bill.')
      return
    }

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
        mode: mode || paymentMode,
        amountMinor: netPayableMinor,
        transactionRef: ref || transactionRef || undefined,
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
      description: `Billed to ${selectedMember.name} · ${formatINR(netPayableMinor)}${ref ? ` (Ref: ${ref})` : ''}`,
    })

    if (onInvoiceCreated) onInvoiceCreated(newInvoice)
    onOpenChange(false)
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMember || !selectedProduct) {
      setError('Please select a member and a package/service.')
      return
    }

    // Validate discount against ceiling
    const discountCheck = validateDiscount({
      totalGrossMinor: listPriceMinor,
      discountMinor,
      managerApproval:
        discountMinor > 0
          ? {
              approvedBy: discountApprover,
              reason: discountReason || 'Promotional Override',
            }
          : undefined,
    })

    if (!discountCheck.allowed) {
      setError(discountCheck.reason || 'Discount ceiling exceeded')
      return
    }

    setLoading(true)
    executeIssueInvoice()
  }

  const handleRazorpayCollect = async () => {
    if (!selectedMember || !selectedProduct) {
      setError('Please select a member and a package/service.')
      return
    }

    const discountCheck = validateDiscount({
      totalGrossMinor: listPriceMinor,
      discountMinor,
      managerApproval:
        discountMinor > 0
          ? {
              approvedBy: discountApprover,
              reason: discountReason || 'Promotional Override',
            }
          : undefined,
    })

    if (!discountCheck.allowed) {
      setError(discountCheck.reason || 'Discount ceiling exceeded')
      return
    }

    setLoading(true)
    try {
      const { openRazorpayCheckout } = await import('@/lib/razorpay')
      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountMinor: netPayableMinor,
          receipt: `rcpt_inv_${Date.now()}`,
          notes: {
            memberId: selectedMember.id,
            memberName: selectedMember.name,
            productId: selectedProduct.id,
            productName: selectedProduct.name,
          },
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.orderId) {
        throw new Error(data.error || 'Failed to initialize Razorpay checkout order.')
      }

      await openRazorpayCheckout({
        orderId: data.orderId,
        amountMinor: netPayableMinor,
        name: 'DNA 360 Gym & Wellness',
        description: selectedProduct.name,
        prefill: {
          name: selectedMember.name,
          email: selectedMember.email || '',
          contact: selectedMember.phone || '',
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
            console.warn('Verification call:', e)
          }

          executeIssueInvoice(rzpRes.razorpay_payment_id, 'UPI')
        },
        onDismiss: () => {
          setLoading(false)
          toast.info('Checkout cancelled', { description: 'Razorpay checkout was dismissed.' })
        },
      })
    } catch (err: any) {
      console.error('Razorpay collection error:', err)
      setLoading(false)
      toast.error('Payment Error', { description: err.message || 'Razorpay checkout could not start.' })
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Issue GST Tax Invoice"
      description="Base Fitness Private Limited · Gapless Sequence DNA/2026-27/000X"
      size="xl"
    >
      <form onSubmit={handleCreate} className="space-y-4 max-h-[82vh] overflow-y-auto pr-1">
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center gap-2.5 text-xs text-red-400 font-medium">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ─── 1. MEMBER SEARCH & SELECTION SECTION ─── */}
        <div className="space-y-2 p-3.5 rounded-2xl bg-white/[0.025] border border-white/[0.08]">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-white/80 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Bill to Member *</span>
            </label>
            {selectedMember && !isSearchingMember && (
              <button
                type="button"
                onClick={() => {
                  setIsSearchingMember(true)
                  setTimeout(() => memberSearchInputRef.current?.focus(), 50)
                }}
                className="text-xs font-semibold text-[#38BDF8] hover:text-[#60A5FA] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Search className="w-3 h-3" />
                <span>Change Member</span>
              </button>
            )}
          </div>

          {/* If Member is Selected: Display Rich Member Card */}
          {selectedMember && !isSearchingMember ? (
            <div className="p-3 rounded-xl bg-[#0F172A]/80 border border-[#38BDF8]/30 flex items-center justify-between gap-3 shadow-[0_0_15px_rgba(56,189,248,0.08)]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1E40AF] to-[#38BDF8] flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                  {getInitials(selectedMember.name)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-ui font-bold text-sm text-white truncate">
                      {selectedMember.name}
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-data font-bold bg-[#10B981]/15 text-[#34D399] border border-[#10B981]/30 uppercase shrink-0">
                      {selectedMember.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-white/60 font-data mt-0.5 truncate">
                    <span className="text-white/80">{selectedMember.member_code}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-white/40" />
                      {selectedMember.phone}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsSearchingMember(true)
                  setTimeout(() => memberSearchInputRef.current?.focus(), 50)
                }}
                className="px-2.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-xs font-medium text-white/80 shrink-0 transition-all cursor-pointer"
              >
                Change
              </button>
            </div>
          ) : (
            /* Search Input & Live Filter Dropdown */
            <div className="space-y-2 relative">
              <div className="relative">
                <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={memberSearchInputRef}
                  type="text"
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  placeholder="Search by member name, phone (+91), email, or code..."
                  className="w-full h-11 pl-9 pr-8 rounded-xl bg-[#0B0F19] border border-white/[0.15] text-sm text-white placeholder:text-white/40 focus:border-[#38BDF8] focus:bg-[#0E1524] outline-none transition-all shadow-inner"
                  autoFocus
                />
                {memberSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setMemberSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Live Member Results List */}
              <div className="max-h-48 overflow-y-auto rounded-xl bg-[#090D18] border border-white/[0.1] divide-y divide-white/[0.05] shadow-2xl">
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleSelectMember(m)}
                      className="w-full p-2.5 text-left hover:bg-[#1E293B]/70 transition-colors flex items-center justify-between gap-3 group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-white/[0.08] group-hover:bg-[#38BDF8]/20 flex items-center justify-center text-xs font-bold text-white group-hover:text-[#38BDF8] shrink-0 transition-colors">
                          {getInitials(m.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white group-hover:text-[#38BDF8] truncate transition-colors">
                            {m.name}
                          </p>
                          <p className="text-[11px] font-data text-white/50 truncate">
                            {m.member_code} · {m.phone}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-data font-bold px-2 py-0.5 rounded-full bg-white/[0.06] text-white/70 uppercase">
                          {m.status.replace('_', ' ')}
                        </span>
                        <ChevronDown className="w-3.5 h-3.5 -rotate-90 text-white/30 group-hover:text-white transition-transform" />
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-white/50">
                    No members found matching &quot;{memberSearchQuery}&quot;
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ─── 2. PACKAGE & SALES ATTRIBUTION ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Package Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-white/80 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Package / Service *</span>
            </label>
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger className="h-11 bg-[#0B0F19] border-white/[0.12] rounded-xl text-xs text-white">
                <SelectValue placeholder="Select product package" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs">
                    {p.name} — {formatINR(p.list_price)} (Includes {p.tax_rate * 100}% GST)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sales Rep Attribution */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-white/80 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Sales Consultant *</span>
            </label>
            <Select value={salesRepId} onValueChange={setSalesRepId}>
              <SelectTrigger className="h-11 bg-[#0B0F19] border-white/[0.12] rounded-xl text-xs text-white">
                <SelectValue placeholder="Attributed Consultant" />
              </SelectTrigger>
              <SelectContent>
                {salesReps.map((r) => (
                  <SelectItem key={r.id} value={r.id} className="text-xs">
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ─── 3. DISCOUNT ENGINE WITH QUICK PRESETS ─── */}
        <div className="space-y-2 p-3 rounded-xl bg-white/[0.025] border border-white/[0.06]">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-white/80 flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-amber-400" />
              <span>Commercial Discount</span>
            </label>
            {discountMinor > 0 && (
              <span className="text-xs font-data font-bold text-emerald-400">
                -{formatINR(discountMinor)} discount applied
              </span>
            )}
          </div>

          {/* Quick Preset Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: '₹0 (Standard)', value: 0 },
              { label: '₹1,000', value: 100000 },
              { label: '₹2,500', value: 250000 },
              { label: '₹5,000', value: 500000 },
            ].map((preset) => {
              const isSelected = !isCustomDiscount && discountMinor === preset.value
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handleSelectDiscountPreset(preset.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-data font-semibold border transition-all cursor-pointer',
                    isSelected
                      ? 'bg-amber-400/20 text-amber-300 border-amber-400/50 shadow-sm'
                      : 'bg-white/[0.04] text-white/70 border-white/[0.08] hover:bg-white/[0.08]'
                  )}
                >
                  {preset.label}
                </button>
              )
            })}

            <button
              type="button"
              onClick={() => setIsCustomDiscount(true)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-data font-semibold border transition-all cursor-pointer',
                isCustomDiscount
                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/50 shadow-sm'
                  : 'bg-white/[0.04] text-white/70 border-white/[0.08] hover:bg-white/[0.08]'
              )}
            >
              Custom ₹
            </button>
          </div>

          {/* Custom Discount Input */}
          {isCustomDiscount && (
            <div className="pt-2">
              <Input
                label="Custom Discount Amount (₹)"
                type="number"
                placeholder="e.g. 3500"
                value={customDiscountText}
                onChange={(e) => handleCustomDiscountChange(e.target.value)}
              />
            </div>
          )}

          {/* Manager Authorization (if discount > 0) */}
          {discountMinor > 0 && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-2.5 text-xs mt-2">
              <span className="font-bold text-amber-300 block flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Manager Discount Authorization Required:</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <Input
                  label="Authorizing Officer"
                  value={discountApprover}
                  onChange={(e) => setDiscountApprover(e.target.value)}
                  required
                />
                <Input
                  label="Commercial Justification"
                  placeholder="e.g. Founder Annual Privilege / Referral"
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  required
                />
              </div>
            </div>
          )}
        </div>

        {/* ─── 4. PAYMENT MODE & TRANSACTION REF ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-white/80">
              Payment Instrument *
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['UPI', 'Credit Card', 'Net Banking', 'Cash', 'Cheque'] as PaymentMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPaymentMode(mode)}
                  className={cn(
                    'py-2 px-1.5 rounded-xl font-ui text-[11px] font-bold border transition-all cursor-pointer truncate',
                    paymentMode === mode
                      ? 'bg-[#38BDF8]/20 text-[#38BDF8] border-[#38BDF8]/50 shadow-sm'
                      : 'bg-white/[0.04] text-white/60 border-white/[0.08] hover:bg-white/[0.08]'
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-white/80">
              Bank Ref / UTR / Cheque #
            </label>
            <Input
              placeholder="e.g. UPI/2026/88921 or CHQ-0021"
              value={transactionRef}
              onChange={(e) => setPrimaryRef(e.target.value)}
              className="h-11"
            />
          </div>
        </div>

        {/* ─── 5. GST CALCULATION SUMMARY CARD (SAC 999723) ─── */}
        <div className="p-3.5 rounded-xl bg-[#090D18] border border-white/[0.09] space-y-2 text-xs font-mono">
          <div className="flex justify-between text-white/60">
            <span>List Price (GST Inclusive):</span>
            <span>{formatINR(listPriceMinor)}</span>
          </div>

          {discountMinor > 0 && (
            <div className="flex justify-between text-emerald-400 font-semibold">
              <span>Commercial Discount:</span>
              <span>-{formatINR(discountMinor)}</span>
            </div>
          )}

          <div className="flex justify-between text-white/60">
            <span>Taxable Amount (Ex-Tax SAC 999723):</span>
            <span>{formatINR(gst.taxable)}</span>
          </div>

          <div className="flex justify-between text-white/60">
            <span>GST (5% — 2.5% CGST + 2.5% SGST):</span>
            <span>{formatINR(gst.totalTax)}</span>
          </div>

          <div className="flex justify-between items-center font-bold text-sm text-white pt-2 border-t border-white/[0.08]">
            <span>Net Payable Amount:</span>
            <span className="text-lg text-[#38BDF8] font-black">{formatINR(netPayableMinor)}</span>
          </div>
        </div>

        {/* ─── 6. ACTION FOOTER BUTTONS ─── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-white/[0.08]">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            className="h-11 rounded-xl"
          >
            Cancel
          </Button>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Button
              type="submit"
              variant="outline"
              loading={loading}
              icon={<Receipt className="w-4 h-4 text-[#38BDF8]" />}
              className="h-11 rounded-xl border-white/[0.15] hover:bg-white/[0.06] text-xs font-semibold"
            >
              Record Manual Invoice
            </Button>

            <Button
              type="button"
              variant="primary"
              loading={loading}
              onClick={handleRazorpayCollect}
              icon={<CreditCard className="w-4 h-4 text-white" />}
              className="h-11 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-[#00C8C8] hover:opacity-90 shadow-lg shadow-emerald-500/20 text-white font-bold text-xs"
            >
              Collect via Razorpay Live (UPI / QR / Card)
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
