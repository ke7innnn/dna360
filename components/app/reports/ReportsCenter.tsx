'use client'

import React, { useState, useMemo } from 'react'
import {
  FileText,
  Download,
  Filter,
  Calendar,
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  MessageCircle,
  TrendingUp,
  DollarSign,
  UserCheck,
} from 'lucide-react'
import { Button } from '@/components/app/ui/button'
import { Input } from '@/components/app/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/app/ui/select'
import { getStoredInvoices } from '@/lib/billing'
import { getStoredMembers } from '@/lib/members'
import { formatINR } from '@/lib/gst'
import { cn } from '@/lib/utils'
import { toast } from '@/components/app/ui/toast'
import type { TaxInvoice } from '@/types/billing'
import type { Member } from '@/types/member'

export type ReportTab = 'collection' | 'trainer' | 'expiry'

interface TrainerStat {
  trainerId: string
  trainerName: string
  specialization: string
  activeClientsCount: number
  sessionsDelivered: number
  ptCollectionMinor: number
  topPackage: string
  commissionPct: number
}

const TRAINER_REPORTS_DATA: TrainerStat[] = [
  {
    trainerId: 'tr_01',
    trainerName: 'Rohan Sawant',
    specialization: 'Senior Strength & Hypertrophy',
    activeClientsCount: 18,
    sessionsDelivered: 142,
    ptCollectionMinor: 38400000, // ₹3,84,000
    topPackage: 'Elite Personal Training (36 Sessions)',
    commissionPct: 20,
  },
  {
    trainerId: 'tr_02',
    trainerName: 'Pooja Deshmukh',
    specialization: 'Reformer Pilates Master Instructor',
    activeClientsCount: 22,
    sessionsDelivered: 168,
    ptCollectionMinor: 44637000, // ₹4,46,370
    topPackage: 'Reformer Pilates — 36 Sessions',
    commissionPct: 22,
  },
  {
    trainerId: 'tr_03',
    trainerName: 'Nikhil Kadam',
    specialization: 'CrossFit & Functional Movement',
    activeClientsCount: 14,
    sessionsDelivered: 118,
    ptCollectionMinor: 27500000, // ₹2,75,000
    topPackage: 'Functional 1-on-1 (24 Sessions)',
    commissionPct: 18,
  },
  {
    trainerId: 'tr_04',
    trainerName: 'Kunal Shinde',
    specialization: 'Body Composition & Fat Loss',
    activeClientsCount: 16,
    sessionsDelivered: 130,
    ptCollectionMinor: 31200000, // ₹3,12,000
    topPackage: 'Premium PT (24 Sessions)',
    commissionPct: 18,
  },
  {
    trainerId: 'tr_05',
    trainerName: 'Tanvi Joshi',
    specialization: 'Mat Pilates & Mobility Therapy',
    activeClientsCount: 12,
    sessionsDelivered: 96,
    ptCollectionMinor: 21800000, // ₹2,18,000
    topPackage: 'Pilates Semi-Private Pack',
    commissionPct: 18,
  },
]

export default function ReportsCenter({
  className,
  defaultTab = 'collection',
}: {
  className?: string
  defaultTab?: ReportTab
}) {
  const [activeTab, setActiveTab] = useState<ReportTab>(defaultTab)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('all') // 'all', 'today', 'this_month'
  const [renewalFilter, setRenewalFilter] = useState('all') // 'all', 'new', 'renewal'

  const invoices = getStoredInvoices()
  const members = getStoredMembers()

  // ─── 1. Collection Report Data ───
  const collectionRows = useMemo(() => {
    return invoices.map((inv) => {
      const primaryItem = inv.items[0] || {
        description: 'Gym Membership Package',
        unitPriceInclusiveMinor: inv.grandTotalMinor,
        discountMinor: 0,
      }
      const isRenewal =
        inv.notes?.toLowerCase().includes('renewal') ||
        primaryItem.description.toLowerCase().includes('renewal') ||
        inv.items.some((i) => i.productId.includes('ren'))

      const member = members.find((m) => m.id === inv.memberId)
      const activation = inv.activationDate || inv.issueDate
      const expiry = inv.expiryDate || '2027-09-28'

      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        billingDate: inv.issueDate,
        memberName: inv.memberName,
        memberPhone: inv.memberPhone,
        membershipDetails: primaryItem.description,
        activationDate: activation,
        expiryDate: expiry,
        amountMinor: inv.grandTotalMinor,
        type: isRenewal ? 'Renewal' : 'New',
        paymentMode: inv.payments[0]?.mode || 'UPI',
        status: inv.status,
      }
    })
  }, [invoices, members])

  const filteredCollectionRows = useMemo(() => {
    return collectionRows.filter((row) => {
      if (renewalFilter !== 'all' && row.type.toLowerCase() !== renewalFilter) {
        return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matches =
          row.memberName.toLowerCase().includes(q) ||
          row.invoiceNumber.toLowerCase().includes(q) ||
          row.membershipDetails.toLowerCase().includes(q) ||
          row.memberPhone.includes(q)
        if (!matches) return false
      }
      return true
    })
  }, [collectionRows, renewalFilter, searchQuery])

  // ─── 2. Expiry Report Data with Expected Payment Amount ───
  const expiryRows = useMemo(() => {
    return members
      .filter((m) => m.status === 'expiring_soon' || m.status === 'grace_period' || m.status === 'active')
      .map((m) => {
        const activeMem = m.active_memberships?.[0]
        const expiryDate = activeMem?.expiry_date || '2026-10-15'
        const activationDate = activeMem?.activation_date || activeMem?.enrolment_date || '2025-10-15'
        const productName = activeMem?.product_name || 'Annual Gym Membership Package'
        
        // Expected renewal amount calculation
        const expectedAmountMinor = activeMem?.amount_paid || 4350000

        const today = new Date('2026-09-29').getTime()
        const expTime = new Date(expiryDate).getTime()
        const daysLeft = Math.round((expTime - today) / (1000 * 60 * 60 * 24))

        return {
          memberId: m.id,
          memberCode: m.member_code,
          memberName: m.name,
          phone: m.phone,
          productName,
          activationDate,
          expiryDate,
          daysLeft,
          status: m.status,
          expectedPaymentMinor: expectedAmountMinor,
          assignedTrainer: m.assigned_trainer_name || 'General Floor',
        }
      })
      .sort((a, b) => a.daysLeft - b.daysLeft)
  }, [members])

  const filteredExpiryRows = useMemo(() => {
    return expiryRows.filter((row) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        return (
          row.memberName.toLowerCase().includes(q) ||
          row.memberCode.toLowerCase().includes(q) ||
          row.phone.includes(q) ||
          row.productName.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [expiryRows, searchQuery])

  // ─── Export CSV Helpers ───
  const exportCollectionCsv = () => {
    const headers = [
      'Billing Date',
      'Invoice Number',
      'Member Name',
      'Phone',
      'Membership Details',
      'Activation Date',
      'Expiry Date',
      'Type (New/Renewal)',
      'Payment Mode',
      'Amount (INR)',
    ]
    const rows = filteredCollectionRows.map((r) => [
      `"${r.billingDate}"`,
      `"${r.invoiceNumber}"`,
      `"${r.memberName}"`,
      `"${r.phone}"`,
      `"${r.membershipDetails}"`,
      `"${r.activationDate}"`,
      `"${r.expiryDate}"`,
      `"${r.type}"`,
      `"${r.paymentMode}"`,
      `"${(r.amountMinor / 100).toFixed(2)}"`,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encoded = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encoded)
    link.setAttribute('download', `dna360_collection_report_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Collection Report CSV exported')
  }

  const exportTrainerCsv = () => {
    const headers = [
      'Trainer Name',
      'Specialization',
      'Active PT Clients',
      'Sessions Delivered',
      'PT Collections Generated (INR)',
      'Top Package',
      'Commission Split (%)',
    ]
    const rows = TRAINER_REPORTS_DATA.map((t) => [
      `"${t.trainerName}"`,
      `"${t.specialization}"`,
      `"${t.activeClientsCount}"`,
      `"${t.sessionsDelivered}"`,
      `"${(t.ptCollectionMinor / 100).toFixed(2)}"`,
      `"${t.topPackage}"`,
      `"${t.commissionPct}%"`,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encoded = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encoded)
    link.setAttribute('download', `dna360_trainer_collection_report.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Trainer-wise Collection Report CSV exported')
  }

  const exportExpiryCsv = () => {
    const headers = [
      'Member Code',
      'Member Name',
      'Phone',
      'Current Membership',
      'Activation Date',
      'Expiry Date',
      'Days Left',
      'Status',
      'Expected Renewal Amount (INR)',
    ]
    const rows = filteredExpiryRows.map((r) => [
      `"${r.memberCode}"`,
      `"${r.memberName}"`,
      `"${r.phone}"`,
      `"${r.productName}"`,
      `"${r.activationDate}"`,
      `"${r.expiryDate}"`,
      `"${r.daysLeft}"`,
      `"${r.status}"`,
      `"${(r.expectedPaymentMinor / 100).toFixed(2)}"`,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encoded = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encoded)
    link.setAttribute('download', `dna360_expiry_expected_payment_report.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Expiry & Expected Payment Report CSV exported')
  }

  const sendWhatsAppReminder = (name: string, phone: string, plan: string, expDate: string, amountMinor: number) => {
    const cleanPhone = phone.replace(/\D/g, '')
    const msg = encodeURIComponent(
      `Hello ${name}, warm greetings from DNA 360 Gym & Wellness! Your ${plan} is due for renewal on ${expDate}. Your renewal tariff is ${formatINR(amountMinor)}. Please connect with front desk or reply here to confirm your slot.`
    )
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank')
  }

  return (
    <div className={cn('rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] p-5 space-y-5', className)}>
      {/* ─── Header & Tab Switcher ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
        <div>
          <h3 className="font-display font-semibold text-lg text-white">
            Operational &amp; Financial Reports
          </h3>
          <p className="font-ui text-xs text-[var(--ink-3)]">
            Auditable GST collection ledgers, personal trainer performance, and pipeline renewals
          </p>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08] overflow-x-auto">
          {[
            { id: 'collection', label: 'Collection Report' },
            { id: 'trainer', label: 'Trainer-wise Collection' },
            { id: 'expiry', label: 'Expiry & Expected Dues' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ReportTab)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold font-ui transition-all whitespace-nowrap cursor-pointer',
                activeTab === tab.id
                  ? 'bg-[#38BDF8] text-[#05070E] shadow-sm font-bold'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Filters & Search Strip ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search member, phone, package, invoice..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-xl bg-white/[0.03] border border-white/[0.1] text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-[#38BDF8]"
          />
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'collection' && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[var(--ink-3)]">Type:</span>
              <select
                value={renewalFilter}
                onChange={(e) => setRenewalFilter(e.target.value)}
                className="h-9 px-2.5 rounded-xl bg-white/[0.03] border border-white/[0.1] text-xs text-white focus:outline-none"
              >
                <option value="all">All (New &amp; Renewal)</option>
                <option value="new">New Memberships</option>
                <option value="renewal">Renewals</option>
              </select>
            </div>
          )}

          <Button
            size="sm"
            variant="secondary"
            onClick={
              activeTab === 'collection'
                ? exportCollectionCsv
                : activeTab === 'trainer'
                ? exportTrainerCsv
                : exportExpiryCsv
            }
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* ─── TAB 1: COLLECTION REPORT ─── */}
      {activeTab === 'collection' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-[var(--ink-3)] font-data">
            <span>SHOWING {filteredCollectionRows.length} TAX INVOICES</span>
            <span>
              TOTAL COLLECTED:{' '}
              <b className="text-white font-bold">
                {formatINR(filteredCollectionRows.reduce((acc, r) => acc + r.amountMinor, 0))}
              </b>
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
            <table className="w-full text-xs text-left">
              <thead className="bg-white/[0.03] text-[var(--ink-3)] uppercase font-semibold text-[10px] tracking-wider border-b border-[var(--line)] font-data">
                <tr>
                  <th className="p-3">Billing Date</th>
                  <th className="p-3">Invoice #</th>
                  <th className="p-3">Member Details</th>
                  <th className="p-3">Membership Package</th>
                  <th className="p-3">Activation Date</th>
                  <th className="p-3">Expiry Date</th>
                  <th className="p-3">New / Renewal</th>
                  <th className="p-3 text-right">Amount (Inc GST)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)] font-ui">
                {filteredCollectionRows.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3 font-data tabular-nums text-white/80">{r.billingDate}</td>
                    <td className="p-3 font-data text-[#38BDF8] font-semibold">{r.invoiceNumber}</td>
                    <td className="p-3">
                      <p className="font-semibold text-white">{r.memberName}</p>
                      <p className="text-[11px] text-[var(--ink-3)]">{r.memberPhone}</p>
                    </td>
                    <td className="p-3 text-white/90 max-w-xs truncate">{r.membershipDetails}</td>
                    <td className="p-3 font-data tabular-nums text-emerald-400">{r.activationDate}</td>
                    <td className="p-3 font-data tabular-nums text-amber-300">{r.expiryDate}</td>
                    <td className="p-3">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase',
                          r.type === 'Renewal'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/25'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                        )}
                      >
                        {r.type}
                      </span>
                    </td>
                    <td className="p-3 text-right font-data font-bold text-white tabular-nums">
                      {formatINR(r.amountMinor)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 2: TRAINER-WISE COLLECTION REPORT ─── */}
      {activeTab === 'trainer' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-[var(--ink-3)] font-data">
            <span>5 ACCREDITED PERSONAL TRAINERS</span>
            <span>
              TOTAL PT REVENUE:{' '}
              <b className="text-white font-bold">
                {formatINR(TRAINER_REPORTS_DATA.reduce((acc, t) => acc + t.ptCollectionMinor, 0))}
              </b>
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
            <table className="w-full text-xs text-left">
              <thead className="bg-white/[0.03] text-[var(--ink-3)] uppercase font-semibold text-[10px] tracking-wider border-b border-[var(--line)] font-data">
                <tr>
                  <th className="p-3">Trainer Name</th>
                  <th className="p-3">Specialization</th>
                  <th className="p-3 text-center">Active Clients</th>
                  <th className="p-3 text-center">Sessions Delivered</th>
                  <th className="p-3">Top Selling Package</th>
                  <th className="p-3 text-right">Commission Split</th>
                  <th className="p-3 text-right">PT Collections Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)] font-ui">
                {TRAINER_REPORTS_DATA.map((t) => (
                  <tr key={t.trainerId} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3 font-semibold text-white flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-500/20 text-[#38BDF8] flex items-center justify-center text-[10px] font-bold">
                        {t.trainerName[0]}
                      </div>
                      <span>{t.trainerName}</span>
                    </td>
                    <td className="p-3 text-white/70">{t.specialization}</td>
                    <td className="p-3 text-center font-data tabular-nums text-white">{t.activeClientsCount}</td>
                    <td className="p-3 text-center font-data tabular-nums text-emerald-400 font-semibold">
                      {t.sessionsDelivered}
                    </td>
                    <td className="p-3 text-white/80 max-w-xs truncate">{t.topPackage}</td>
                    <td className="p-3 text-right font-data tabular-nums text-amber-300 font-medium">
                      {t.commissionPct}%
                    </td>
                    <td className="p-3 text-right font-data font-bold text-white tabular-nums">
                      {formatINR(t.ptCollectionMinor)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 3: EXPIRY REPORT WITH EXPECTED PAYMENT AMOUNT ─── */}
      {activeTab === 'expiry' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-[var(--ink-3)] font-data">
            <span>SHOWING {filteredExpiryRows.length} UPCOMING EXPIRIES</span>
            <span>
              TOTAL EXPECTED RENEWAL AMOUNT:{' '}
              <b className="text-emerald-400 font-bold">
                {formatINR(filteredExpiryRows.reduce((acc, r) => acc + r.expectedPaymentMinor, 0))}
              </b>
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
            <table className="w-full text-xs text-left">
              <thead className="bg-white/[0.03] text-[var(--ink-3)] uppercase font-semibold text-[10px] tracking-wider border-b border-[var(--line)] font-data">
                <tr>
                  <th className="p-3">Member</th>
                  <th className="p-3">Current Membership</th>
                  <th className="p-3">Activation Date</th>
                  <th className="p-3">Expiry Date</th>
                  <th className="p-3">Status / Days Left</th>
                  <th className="p-3 text-right">Expected Payment</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)] font-ui">
                {filteredExpiryRows.slice(0, 50).map((r) => (
                  <tr key={r.memberId} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3">
                      <p className="font-semibold text-white">{r.memberName}</p>
                      <p className="text-[11px] text-[var(--ink-3)]">
                        {r.memberCode} · {r.phone}
                      </p>
                    </td>
                    <td className="p-3 text-white/90 max-w-xs truncate">{r.productName}</td>
                    <td className="p-3 font-data tabular-nums text-white/70">{r.activationDate}</td>
                    <td className="p-3 font-data tabular-nums font-semibold text-amber-300">{r.expiryDate}</td>
                    <td className="p-3">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase font-data',
                          r.daysLeft <= 0
                            ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                            : r.daysLeft <= 7
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                        )}
                      >
                        {r.daysLeft <= 0 ? 'Expiring Today' : `${r.daysLeft} Days Left`}
                      </span>
                    </td>
                    <td className="p-3 text-right font-data font-bold text-emerald-400 tabular-nums">
                      {formatINR(r.expectedPaymentMinor)}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() =>
                          sendWhatsAppReminder(
                            r.memberName,
                            r.phone,
                            r.productName,
                            r.expiryDate,
                            r.expectedPaymentMinor
                          )
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition-all cursor-pointer"
                        title="Send WhatsApp renewal reminder"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>WhatsApp Notice</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
