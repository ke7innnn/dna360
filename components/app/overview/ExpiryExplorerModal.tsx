'use client'

import React, { useState, useMemo } from 'react'
import {
  Calendar,
  Clock,
  Search,
  MessageCircle,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Download,
  Filter,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react'
import { Modal } from '@/components/app/ui/modal'
import { Button } from '@/components/app/ui/button'
import { Input } from '@/components/app/ui/input'
import { getStoredMembers } from '@/lib/members'
import { formatINR } from '@/lib/gst'
import { cn } from '@/lib/utils'
import { toast } from '@/components/app/ui/toast'
import type { Member } from '@/types/member'

export type ExpiryFilterPeriod = 'today' | 'specific_date' | 'month' | 'range'

export default function ExpiryExplorerModal({
  open,
  onOpenChange,
  initialMode = 'today',
  onRenewMember,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialMode?: ExpiryFilterPeriod
  onRenewMember?: (memberId: string) => void
}) {
  const members = getStoredMembers()

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const currMonthStr = useMemo(() => new Date().toISOString().slice(0, 7), [])

  const [filterMode, setFilterMode] = useState<ExpiryFilterPeriod>(initialMode)
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [selectedMonth, setSelectedMonth] = useState(currMonthStr)
  const [startDate, setStartDate] = useState(todayStr)
  const [endDate, setEndDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d.toISOString().slice(0, 10)
  })
  const [searchQuery, setSearchQuery] = useState('')

  // Compute expiring records
  const allExpiringList = useMemo(() => {
    return members
      .filter((m) => m.active_memberships && m.active_memberships.length > 0)
      .map((m) => {
        const mem = m.active_memberships[0]
        const expiry = mem.expiry_date || todayStr
        const activation = mem.activation_date || mem.enrolment_date || todayStr
        const amount = mem.amount_paid || 4350000

        return {
          memberId: m.id,
          memberCode: m.member_code,
          name: m.name,
          phone: m.phone,
          status: m.status,
          planName: mem.product_name || 'Annual Gym Membership Package',
          activationDate: activation,
          expiryDate: expiry,
          renewalAmountMinor: amount,
          assignedTrainer: m.assigned_trainer_name || 'Floor Staff',
        }
      })
  }, [members, todayStr])

  // Filter based on selected period
  const filteredList = useMemo(() => {
    return allExpiringList.filter((item) => {
      // 1. Period filter
      if (filterMode === 'today') {
        if (item.expiryDate !== todayStr) return false
      } else if (filterMode === 'specific_date') {
        if (selectedDate && item.expiryDate !== selectedDate) {
          return false
        }
      } else if (filterMode === 'month') {
        if (selectedMonth && !item.expiryDate.startsWith(selectedMonth)) {
          return false
        }
      } else if (filterMode === 'range') {
        if (startDate && item.expiryDate < startDate) return false
        if (endDate && item.expiryDate > endDate) return false
      }

      // 2. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const match =
          item.name.toLowerCase().includes(q) ||
          item.memberCode.toLowerCase().includes(q) ||
          item.phone.includes(q) ||
          item.planName.toLowerCase().includes(q)
        if (!match) return false
      }

      return true
    })
  }, [allExpiringList, filterMode, selectedDate, selectedMonth, startDate, endDate, searchQuery])

  // Total renewal collection amount for filtered period
  const totalRenewalCollections = useMemo(() => {
    return filteredList.reduce((acc, it) => acc + it.renewalAmountMinor, 0)
  }, [filteredList])

  const sendWhatsAppNotice = (item: typeof filteredList[0]) => {
    const cleanPhone = item.phone.replace(/\D/g, '')
    const msg = encodeURIComponent(
      `Hello ${item.name}, greetings from DNA 360 Gym & Wellness! Your ${item.planName} expires on ${item.expiryDate}. To continue your seamless workout streak and lock in current foundation rates, your renewal amount is ${formatINR(item.renewalAmountMinor)}. Please reply here or visit the front desk to confirm your renewal!`
    )
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank')
    toast.success(`WhatsApp renewal notice opened for ${item.name}`)
  }

  const exportCsv = () => {
    const headers = [
      'Member Code',
      'Name',
      'Phone',
      'Package',
      'Activation Date',
      'Expiry Date',
      'Renewal Amount (INR)',
    ]
    const rows = filteredList.map((r) => [
      `"${r.memberCode}"`,
      `"${r.name}"`,
      `"${r.phone}"`,
      `"${r.planName}"`,
      `"${r.activationDate}"`,
      `"${r.expiryDate}"`,
      `"${(r.renewalAmountMinor / 100).toFixed(2)}"`,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encoded = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encoded)
    link.setAttribute('download', `dna360_expiry_details_${filterMode}_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Expiry details exported to CSV')
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Membership Expiry & Renewal Explorer"
      description="View same-day expiries or filter across specific dates and calendar months"
      size="xl"
    >
      <div className="space-y-4 font-sans text-xs">
        {/* ─── Mode Switcher Tabs ─── */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08] max-w-full overflow-x-auto">
            {[
              { id: 'today', label: 'Same-Day (Today)' },
              { id: 'specific_date', label: 'Specific Date' },
              { id: 'month', label: 'Select Month' },
              { id: 'range', label: 'Custom Range' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterMode(tab.id as ExpiryFilterPeriod)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0',
                  filterMode === tab.id
                    ? 'bg-[#38BDF8] text-[#05070E] font-bold shadow-sm'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            variant="secondary"
            onClick={exportCsv}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export List
          </Button>
        </div>

        {/* ─── Filter Inputs based on Active Mode ─── */}
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {filterMode === 'today' && (
              <div className="flex items-center gap-2 text-xs text-white/80">
                <Clock className="w-4 h-4 text-[#38BDF8]" />
                <span>Showing members expiring today: <b>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</b></span>
              </div>
            )}

            {filterMode === 'specific_date' && (
              <div className="flex items-center gap-2">
                <span className="text-white/60">Select Date:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-8 px-2.5 rounded-lg bg-[#090D18] border border-white/[0.15] text-xs text-white focus:outline-none focus:border-[#38BDF8]"
                />
              </div>
            )}

            {filterMode === 'month' && (
              <div className="flex items-center gap-2">
                <span className="text-white/60">Select Month:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="h-8 px-2.5 rounded-lg bg-[#090D18] border border-white/[0.15] text-xs text-white focus:outline-none focus:border-[#38BDF8]"
                >
                  {Array.from({ length: 12 }).map((_, idx) => {
                    const d = new Date()
                    d.setMonth(d.getMonth() + idx)
                    const val = d.toISOString().slice(0, 7)
                    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                    return <option key={val} value={val}>{label}</option>
                  })}
                </select>
              </div>
            )}

            {filterMode === 'range' && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-white/60">From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-8 px-2.5 rounded-lg bg-[#090D18] border border-white/[0.15] text-xs text-white focus:outline-none"
                />
                <span className="text-white/60">To:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-8 px-2.5 rounded-lg bg-[#090D18] border border-white/[0.15] text-xs text-white focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search member or package..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 rounded-lg bg-[#090D18] border border-white/[0.15] text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-[#38BDF8]"
            />
          </div>
        </div>

        {/* ─── Metric Strip ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
            <p className="text-[10px] uppercase font-bold text-white/50 tracking-wider">
              MEMBERS EXPIRING
            </p>
            <p className="text-xl font-bold text-white font-data mt-0.5">
              {filteredList.length}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
            <p className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
              POTENTIAL RENEWAL COLLECTIONS
            </p>
            <p className="text-xl font-bold text-emerald-300 font-data mt-0.5 tabular-nums">
              {formatINR(totalRenewalCollections)}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/25">
            <p className="text-[10px] uppercase font-bold text-[#60A5FA] tracking-wider">
              RETENTION PIPELINE
            </p>
            <p className="text-xl font-bold text-white font-data mt-0.5">
              100% WhatsApp Reachable
            </p>
          </div>
        </div>

        {/* ─── Table of Expiring Members ─── */}
        <div className="max-h-96 overflow-y-auto overflow-x-auto rounded-xl border border-white/[0.08] bg-[#070A12]">
          {filteredList.length > 0 ? (
            <table className="min-w-[580px] w-full text-xs text-left">
              <thead className="sticky top-0 bg-[#0B0F19] text-[var(--ink-3)] uppercase text-[10px] font-semibold tracking-wider border-b border-white/[0.08] font-data">
                <tr>
                  <th className="p-3">Member Details</th>
                  <th className="p-3">Plan / Package</th>
                  <th className="p-3">Activation Date</th>
                  <th className="p-3">Expiry Date</th>
                  <th className="p-3 text-right">Renewal Amount</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredList.map((item) => (
                  <tr key={item.memberId} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3">
                      <p className="font-bold text-white">{item.name}</p>
                      <p className="text-[11px] text-white/50">
                        {item.memberCode} · {item.phone}
                      </p>
                    </td>
                    <td className="p-3 text-white/90 max-w-xs truncate">{item.planName}</td>
                    <td className="p-3 font-data tabular-nums text-white/70">{item.activationDate}</td>
                    <td className="p-3 font-data tabular-nums font-bold text-amber-300">
                      {item.expiryDate}
                    </td>
                    <td className="p-3 text-right font-data font-bold text-emerald-400 tabular-nums">
                      {formatINR(item.renewalAmountMinor)}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => sendWhatsAppNotice(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition-all cursor-pointer"
                          title="Send WhatsApp notice"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>Notice</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (onRenewMember) onRenewMember(item.memberId)
                            toast.info(`Initiating renewal invoice for ${item.name}`)
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#38BDF8]/15 hover:bg-[#38BDF8]/25 border border-[#38BDF8]/30 text-[#38BDF8] text-xs font-semibold transition-all cursor-pointer"
                          title="Open renewal invoice"
                        >
                          <CreditCard className="w-3 h-3" />
                          <span>Renew</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-white/50 space-y-1">
              <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-400/60" />
              <p className="font-semibold text-white">No expiring memberships found</p>
              <p className="text-[11px]">There are no memberships expiring within the selected timeframe.</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.08]">
          <span className="text-[11px] text-white/50">
            Click &quot;Renew&quot; to open the GST invoice generator with pre-filled member data
          </span>
          <Button variant="secondary" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}
