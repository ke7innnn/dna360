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
  Clock,
  Calendar,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react'
import { Modal } from '@/components/app/ui/modal'
import { Button } from '@/components/app/ui/button'
import { Input } from '@/components/app/ui/input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/app/ui/select'
import { formatINR, backCalculateGst } from '@/lib/gst'
import { getStoredMembers } from '@/lib/members'
import { getProducts } from '@/lib/products'
import { issueInvoice, buildLineItem, validateDiscount, recordPayment } from '@/lib/billing'
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
  const [isSearchingMember, setIsSearchingMember] = useState(true)
  const [memberStatusFilter, setMemberStatusFilter] = useState<'all' | 'active' | 'expiring_soon' | 'grace'>('all')
  const memberSearchInputRef = useRef<HTMLInputElement>(null)

  // Product Selection & Category Filter
  const [selectedProductCategory, setSelectedProductCategory] = useState<string>('all')
  const [selectedProductId, setSelectedProductId] = useState('')

  // Commercials & Discounts
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
        } else {
          setSelectedMember(null)
          setIsSearchingMember(true)
        }
      } else {
        setSelectedMember(null)
        setIsSearchingMember(true)
        setMemberSearchQuery('')
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

  // Filter members by search query and quick status filter
  const filteredMembers = useMemo(() => {
    let list = members

    if (memberStatusFilter === 'active') {
      list = list.filter((m) => m.status === 'active')
    } else if (memberStatusFilter === 'expiring_soon') {
      list = list.filter((m) => m.status === 'expiring_soon')
    } else if (memberStatusFilter === 'grace') {
      list = list.filter((m) => m.status === 'grace_period')
    }

    if (!memberSearchQuery.trim()) {
      return list.slice(0, 8)
    }

    const q = memberSearchQuery.toLowerCase().trim()
    const digitsOnly = q.replace(/\D/g, '')

    return list
      .filter((m) => {
        const nameMatch = m.name?.toLowerCase().includes(q)
        const phoneMatch = digitsOnly ? m.phone?.replace(/\D/g, '').includes(digitsOnly) : m.phone?.includes(q)
        const codeMatch = m.member_code?.toLowerCase().includes(q)
        const emailMatch = m.email?.toLowerCase().includes(q)
        return nameMatch || phoneMatch || codeMatch || emailMatch
      })
      .slice(0, 10)
  }, [members, memberSearchQuery, memberStatusFilter])

  // Available Product categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category)))
    return ['all', ...cats]
  }, [products])

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
    toast.info(`Selected ${member.name} (${member.member_code})`)
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
      setError('Please search and select a member to bill.')
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
    if (!selectedMember) {
      setError('Please search and select a member first.')
      setIsSearchingMember(true)
      return
    }
    if (!selectedProduct) {
      setError('Please select a package or fitness service.')
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
    if (!selectedMember) {
      setError('Please search and select a member first.')
      setIsSearchingMember(true)
      return
    }
    if (!selectedProduct) {
      setError('Please select a package or fitness service.')
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
      // 1. Issue the pending invoice first to obtain server-persisted invoiceId
      const lineItem = buildLineItem({
        productId: selectedProduct.id,
        description: selectedProduct.name,
        sacCode: selectedProduct.sac_code,
        unitPriceInclusiveMinor: selectedProduct.list_price,
        quantity: 1,
        discountMinor,
        taxRate: selectedProduct.tax_rate,
      })

      const pendingInvoice = issueInvoice({
        memberId: selectedMember.id,
        memberName: selectedMember.name,
        memberPhone: selectedMember.phone,
        memberEmail: selectedMember.email,
        items: [lineItem],
        payments: [], // Empty payments -> status: 'pending'
        salesRepId: selectedRep?.id || 'usr_fc_01',
        salesRepName: selectedRep?.name || 'Amit Sharma',
        createdBy: {
          id: 'usr_fc_01',
          name: 'Amit Sharma',
          role: 'Fitness Consultant',
        },
        discountReason: discountMinor > 0 ? discountReason : undefined,
        discountApprovedBy: discountMinor > 0 ? discountApprover : undefined,
        notes: notes ? `${notes} · Razorpay Checkout Initiated` : 'Razorpay Checkout Initiated',
      })

      // 2. Call server /api/razorpay/create-order with verified invoiceId
      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: pendingInvoice.id,
          receipt: `rcpt_${pendingInvoice.id}`,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.orderId) {
        throw new Error(data.error || 'Failed to initialize Razorpay checkout order.')
      }

      // 3. Open Razorpay Checkout modal
      const { openRazorpayCheckout } = await import('@/lib/razorpay')
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
            console.warn('Payment verification logged:', e)
          }

          // Record payment against the created invoice
          recordPayment(pendingInvoice.id, {
            mode: 'UPI',
            amountMinor: netPayableMinor,
            transactionRef: rzpRes.razorpay_payment_id,
          })

          setLoading(false)
          toast.success(`Tax Invoice Settled: ${pendingInvoice.invoiceNumber}`, {
            description: `Paid via Razorpay Live · ${formatINR(netPayableMinor)} (Ref: ${rzpRes.razorpay_payment_id})`,
          })

          if (onInvoiceCreated) onInvoiceCreated(pendingInvoice)
          onOpenChange(false)
        },
        onDismiss: () => {
          setLoading(false)
          toast.info('Checkout cancelled', {
            description: `Draft invoice ${pendingInvoice.invoiceNumber} saved as Pending.`,
          })
          if (onInvoiceCreated) onInvoiceCreated(pendingInvoice)
          onOpenChange(false)
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
      title="Generate GST Tax Invoice"
      description="Base Fitness Private Limited · SAC 999723 Fitness Services Tariff"
      size="xl"
    >
      <form onSubmit={handleCreate} className="space-y-4 max-h-[82vh] overflow-y-auto pr-1 font-sans">
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center gap-2.5 text-xs text-red-400 font-medium">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ─── 1. MEMBER SEARCH & SELECTION SECTION ─── */}
        <div className="space-y-2.5 p-3.5 rounded-2xl bg-white/[0.025] border border-white/[0.08]">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-white/80 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>1. Select Member *</span>
            </label>

            {selectedMember && !isSearchingMember ? (
              <button
                type="button"
                onClick={() => {
                  setIsSearchingMember(true)
                  setTimeout(() => memberSearchInputRef.current?.focus(), 50)
                }}
                className="text-xs font-semibold text-[#38BDF8] hover:text-[#60A5FA] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Search className="w-3 h-3" />
                <span>Search / Change Member</span>
              </button>
            ) : (
              <span className="text-[11px] text-white/50">
                {members.length} registered members
              </span>
            )}
          </div>

          {/* Selected Member Display Card */}
          {selectedMember && !isSearchingMember ? (
            <div className="p-3 rounded-xl bg-gradient-to-r from-[#0F172A] to-[#0D1527] border border-[#38BDF8]/35 flex items-center justify-between gap-3 shadow-[0_0_20px_rgba(56,189,248,0.1)]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1E40AF] to-[#38BDF8] flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                  {getInitials(selectedMember.name)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-white truncate">
                      {selectedMember.name}
                    </h4>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase shrink-0',
                        selectedMember.status === 'active'
                          ? 'bg-[#10B981]/15 text-[#34D399] border-[#10B981]/30'
                          : selectedMember.status === 'expiring_soon'
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : 'bg-white/[0.06] text-white/70 border-white/[0.1]'
                      )}
                    >
                      {selectedMember.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-white/60 mt-0.5 truncate">
                    <span className="text-white/85 font-medium">{selectedMember.member_code}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1 text-white/70">
                      <Phone className="w-3 h-3 text-white/40" />
                      {selectedMember.phone}
                    </span>
                    {selectedMember.active_memberships?.[0]?.product_name && (
                      <>
                        <span>·</span>
                        <span className="text-[#38BDF8] truncate">
                          {selectedMember.active_memberships[0].product_name}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsSearchingMember(true)
                  setTimeout(() => memberSearchInputRef.current?.focus(), 50)
                }}
                className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xs font-semibold text-white/80 hover:text-white shrink-0 transition-all cursor-pointer"
              >
                Change
              </button>
            </div>
          ) : (
            /* Search Interface with Quick Filter Pills */
            <div className="space-y-2">
              {/* Search Box */}
              <div className="relative">
                <Search className="w-4 h-4 text-[#38BDF8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={memberSearchInputRef}
                  type="text"
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  placeholder="Type member name, phone (+91), code, or email..."
                  className="w-full h-11 pl-10 pr-9 rounded-xl bg-[#090D18] border border-[#38BDF8]/40 text-sm text-white placeholder:text-white/40 focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8]/30 outline-none transition-all shadow-inner"
                  autoFocus
                />
                {memberSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setMemberSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-0.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <span className="text-[11px] text-white/40 font-medium shrink-0">Filter:</span>
                {[
                  { id: 'all', label: 'All Members' },
                  { id: 'active', label: 'Active' },
                  { id: 'expiring_soon', label: 'Expiring Soon' },
                  { id: 'grace', label: 'Grace Period' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setMemberStatusFilter(tab.id as any)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all shrink-0',
                      memberStatusFilter === tab.id
                        ? 'bg-[#38BDF8]/20 text-[#38BDF8] border-[#38BDF8]/40 shadow-xs'
                        : 'bg-white/[0.03] text-white/50 border-white/[0.06] hover:text-white'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Live Search Results List */}
              <div className="max-h-56 overflow-y-auto rounded-xl bg-[#070A12] border border-white/[0.1] divide-y divide-white/[0.04] shadow-xl">
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleSelectMember(m)}
                      className="w-full p-2.5 text-left hover:bg-[#1A2338]/60 transition-colors flex items-center justify-between gap-3 group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-white/[0.08] group-hover:bg-[#38BDF8]/20 flex items-center justify-center text-xs font-bold text-white group-hover:text-[#38BDF8] shrink-0 transition-colors">
                          {getInitials(m.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white group-hover:text-[#38BDF8] truncate transition-colors">
                            {m.name}
                          </p>
                          <p className="text-[11px] text-white/50 truncate">
                            {m.member_code} · {m.phone}
                            {m.active_memberships?.[0]?.product_name && ` · ${m.active_memberships[0].product_name}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase',
                            m.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : m.status === 'expiring_soon'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                              : 'bg-white/[0.05] text-white/60 border-white/[0.08]'
                          )}
                        >
                          {m.status.replace('_', ' ')}
                        </span>
                        <ChevronDown className="w-3.5 h-3.5 -rotate-90 text-white/30 group-hover:text-white transition-transform" />
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-5 text-center text-xs text-white/50 space-y-1">
                    <AlertCircle className="w-5 h-5 mx-auto text-white/30" />
                    <p>No members found matching &quot;{memberSearchQuery}&quot;</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ─── 2. PACKAGE / SERVICE SELECTION ─── */}
        <div className="space-y-2.5 p-3.5 rounded-2xl bg-white/[0.025] border border-white/[0.08]">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-white/80 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>2. Package / Fitness Service *</span>
            </label>
            <span className="text-[11px] text-white/50">
              SAC 999723 · 5% GST Included
            </span>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedProductCategory(cat)}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-semibold capitalize border transition-all shrink-0',
                  selectedProductCategory === cat
                    ? 'bg-[#38BDF8]/20 text-[#38BDF8] border-[#38BDF8]/40 shadow-xs'
                    : 'bg-white/[0.03] text-white/60 border-white/[0.06] hover:text-white'
                )}
              >
                {cat === 'all' ? 'All Packages' : cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Product Dropdown */}
            <div className="space-y-1">
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger className="h-11 bg-[#0B0F19] border-white/[0.12] rounded-xl text-xs text-white font-medium">
                  <SelectValue placeholder="Select product or plan" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {filteredProducts.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      {p.name} — {formatINR(p.list_price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sales Consultant Attribution */}
            <div className="space-y-1">
              <Select value={salesRepId} onValueChange={setSalesRepId}>
                <SelectTrigger className="h-11 bg-[#0B0F19] border-white/[0.12] rounded-xl text-xs text-white font-medium">
                  <SelectValue placeholder="Sales Consultant" />
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
        </div>

        {/* ─── 3. COMMERCIAL DISCOUNT SHORTCUTS ─── */}
        <div className="space-y-2.5 p-3.5 rounded-2xl bg-white/[0.025] border border-white/[0.08]">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-white/80 flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-amber-400" />
              <span>3. Commercial Discount</span>
            </label>
            {discountMinor > 0 && (
              <span className="text-xs font-bold text-emerald-400 tabular-nums">
                -{formatINR(discountMinor)} discount applied
              </span>
            )}
          </div>

          {/* Quick Preset Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: '₹0 (Standard)', value: 0 },
              { label: '₹500', value: 50000 },
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
                    'px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer tabular-nums',
                    isSelected
                      ? 'bg-amber-400/20 text-amber-300 border-amber-400/50 shadow-xs'
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
                'px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer',
                isCustomDiscount
                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/50 shadow-xs'
                  : 'bg-white/[0.04] text-white/70 border-white/[0.08] hover:bg-white/[0.08]'
              )}
            >
              Custom ₹
            </button>
          </div>

          {/* Custom Discount Input */}
          {isCustomDiscount && (
            <div className="pt-1.5">
              <Input
                label="Custom Discount Amount (₹)"
                type="number"
                placeholder="e.g. 3500"
                value={customDiscountText}
                onChange={(e) => handleCustomDiscountChange(e.target.value)}
                className="h-10"
              />
            </div>
          )}

          {/* Manager Authorization (if discount > 0) */}
          {discountMinor > 0 && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-2 text-xs mt-2">
              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Manager Discount Override:</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                  label="Authorizing Officer"
                  value={discountApprover}
                  onChange={(e) => setDiscountApprover(e.target.value)}
                  required
                />
                <Input
                  label="Commercial Justification"
                  placeholder="e.g. Corporate Referral / Privilege"
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  required
                />
              </div>
            </div>
          )}
        </div>

        {/* ─── 4. PAYMENT INSTRUMENT ─── */}
        <div className="space-y-2.5 p-3.5 rounded-2xl bg-white/[0.025] border border-white/[0.08]">
          <label className="text-xs font-bold uppercase tracking-wider text-white/80 block">
            4. Payment Mode & Reference *
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {(['UPI', 'Credit Card', 'Cash', 'Net Banking', 'Cheque'] as PaymentMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setPaymentMode(mode)}
                className={cn(
                  'py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center truncate',
                  paymentMode === mode
                    ? 'bg-[#38BDF8]/20 text-[#38BDF8] border-[#38BDF8]/50 shadow-xs'
                    : 'bg-white/[0.04] text-white/60 border-white/[0.08] hover:bg-white/[0.08]'
                )}
              >
                {mode}
              </button>
            ))}
          </div>

          <div className="pt-1">
            <Input
              label="Transaction UTR / Bank Ref / Cheque #"
              placeholder="e.g. UPI/2026/88921 or POS Terminal Txn ID"
              value={transactionRef}
              onChange={(e) => setPrimaryRef(e.target.value)}
              className="h-10"
            />
          </div>
        </div>

        {/* ─── 5. GST SAC 999723 TAX BREAKDOWN SUMMARY CARD ─── */}
        <div className="p-3.5 rounded-2xl bg-[#090D18] border border-white/[0.09] space-y-2 text-xs">
          <div className="flex justify-between text-white/60">
            <span>List Tariff (Inclusive of GST):</span>
            <span className="tabular-nums">{formatINR(listPriceMinor)}</span>
          </div>

          {discountMinor > 0 && (
            <div className="flex justify-between text-emerald-400 font-semibold">
              <span>Commercial Discount:</span>
              <span className="tabular-nums">-{formatINR(discountMinor)}</span>
            </div>
          )}

          <div className="flex justify-between text-white/60">
            <span>Taxable Value (Ex-Tax SAC 999723):</span>
            <span className="tabular-nums">{formatINR(gst.taxable)}</span>
          </div>

          <div className="flex justify-between text-white/60">
            <span>GST (5% Total — 2.5% CGST + 2.5% SGST):</span>
            <span className="tabular-nums">{formatINR(gst.totalTax)}</span>
          </div>

          <div className="flex justify-between items-center font-bold text-sm text-white pt-2.5 border-t border-white/[0.08]">
            <span className="text-white/90">Net Payable Amount:</span>
            <span className="text-xl text-[#38BDF8] font-black tabular-nums">{formatINR(netPayableMinor)}</span>
          </div>
        </div>

        {/* ─── 6. ACTION BUTTONS ─── */}
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
