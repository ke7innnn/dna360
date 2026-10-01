'use client'

import React, { useState, useEffect } from 'react'
import {
  Calendar, Clock, User, Phone, CheckCircle2,
  XCircle, ArrowRight, Plus, Sparkles, Filter,
  MessageCircle, ShieldCheck, Dumbbell, Activity,
  Search, RefreshCw, FileText,
} from 'lucide-react'
import Button from '@/components/app/ui/button'
import Card from '@/components/app/ui/glass-card'
import Input from '@/components/app/ui/input'
import PageHeader from '@/components/app/ui/PageHeader'
import Breadcrumbs from '@/components/app/ui/Breadcrumbs'
import BookingModal from '@/components/app/bookings/BookingModal'
import {
  getBookings,
  updateBookingStatus,
  getWhatsAppBookingLink,
  getTodayBookings,
} from '@/lib/bookings'
import { BOOKING_SERVICES, type Booking, type BookingStatus, type BookingServiceType } from '@/types/booking'
import { toast } from '@/components/app/ui/toast'
import { useRouter } from 'next/navigation'

export default function BookingsManagementPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [bookingModalOpen, setBookingModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'today' | 'scheduled' | 'attended' | 'no_show' | 'converted'>('all')
  const [serviceFilter, setServiceFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const loadData = () => {
    setBookings(getBookings())
  }

  useEffect(() => {
    loadData()
  }, [])

  const todayStr = new Date().toISOString().split('T')[0]
  const todayBookings = bookings.filter((b) => b.bookingDate === todayStr)
  const attendedCount = bookings.filter((b) => b.status === 'attended').length
  const convertedCount = bookings.filter((b) => b.status === 'converted').length

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter === 'today' && b.bookingDate !== todayStr) return false
    if (statusFilter !== 'all' && statusFilter !== 'today' && b.status !== statusFilter) return false
    if (serviceFilter !== 'all' && b.serviceType !== serviceFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchName = b.clientName.toLowerCase().includes(q)
      const matchPhone = b.clientPhone.includes(q)
      const matchNum = b.bookingNumber.toLowerCase().includes(q)
      if (!matchName && !matchPhone && !matchNum) return false
    }
    return true
  })

  const handleStatusChange = (id: string, newStatus: BookingStatus) => {
    updateBookingStatus(id, newStatus)
    loadData()
    toast.success(`Booking status updated to ${newStatus.toUpperCase()}`)
  }

  const handleSendWhatsApp = (b: Booking) => {
    const link = getWhatsAppBookingLink(b)
    window.open(link, '_blank')
    toast.success(`Opening WhatsApp confirmation for ${b.clientName}`)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none pb-14">
      <Breadcrumbs items={[{ label: 'Operations' }, { label: 'Bookings & Trials' }]} />

      <PageHeader
        eyebrow="FACILITY & SPECIALIST SCHEDULING · POWAI"
        title="Bookings & Trials"
        italicWord="Direct Management"
        description="Book, confirm, and manage prospective trials, body assessments, and recovery sessions directly in-app instead of WhatsApp manual logs."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="md"
              onClick={loadData}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => setBookingModalOpen(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Book New Trial / Session
            </Button>
          </div>
        }
      />

      {/* ─── 4 Metric Cards Strip ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 space-y-1">
          <span className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
            Trials Booked Today
          </span>
          <p className="font-display font-bold text-3xl text-white tracking-tight">
            {todayBookings.length}
          </p>
          <span className="text-[11px] text-[#60A5FA] font-medium block">
            {todayBookings.filter((b) => b.status === 'scheduled').length} pending attendance
          </span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
            Total Active Bookings
          </span>
          <p className="font-display font-bold text-3xl text-[#38BDF8] tracking-tight">
            {bookings.length}
          </p>
          <span className="text-[11px] text-[var(--muted)] font-medium block">
            Across 7 service categories
          </span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
            Attended &amp; Completed
          </span>
          <p className="font-display font-bold text-3xl text-[#4ADE80] tracking-tight">
            {attendedCount}
          </p>
          <span className="text-[11px] text-[var(--muted)] font-medium block">
            Experienced session
          </span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
            Converted to Members
          </span>
          <p className="font-display font-bold text-3xl text-[#C084FC] tracking-tight">
            {convertedCount}
          </p>
          <span className="text-[11px] text-[#A855F7] font-semibold block">
            {bookings.length > 0 ? Math.round((convertedCount / bookings.length) * 100) : 0}% Conversion Rate
          </span>
        </Card>
      </div>

      {/* ─── Filter Tabs & Controls ─── */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All Bookings' },
              { id: 'today', label: `Today's Schedule (${todayBookings.length})` },
              { id: 'scheduled', label: 'Scheduled' },
              { id: 'attended', label: 'Attended' },
              { id: 'converted', label: 'Converted' },
              { id: 'no_show', label: 'No-Show' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                    : 'bg-white/[0.04] text-[var(--muted)] hover:text-white hover:bg-white/[0.08]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="w-full sm:w-64">
            <Input
              placeholder="Search by name, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-3.5 h-3.5" />}
            />
          </div>
        </div>

        {/* Service Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-t border-white/[0.06] pt-2 text-xs">
          <span className="text-[11px] text-[var(--muted)] uppercase font-semibold shrink-0">
            Offering:
          </span>
          <button
            onClick={() => setServiceFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 cursor-pointer ${
              serviceFilter === 'all' ? 'bg-white/10 text-white font-bold' : 'text-[var(--muted)] hover:text-white'
            }`}
          >
            All (7)
          </button>
          {(Object.keys(BOOKING_SERVICES) as BookingServiceType[]).map((st) => (
            <button
              key={st}
              onClick={() => setServiceFilter(st)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 cursor-pointer ${
                serviceFilter === st ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold' : 'text-[var(--muted)] hover:text-white'
              }`}
            >
              {BOOKING_SERVICES[st].label}
            </button>
          ))}
        </div>
      </Card>

      {/* ─── Bookings List Table ─── */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-white/[0.02] border-b border-white/[0.06] text-[var(--muted)] uppercase text-[10.5px] font-semibold tracking-wider">
              <tr>
                <th className="p-3.5">Booking #</th>
                <th className="p-3.5">Client</th>
                <th className="p-3.5">Offering</th>
                <th className="p-3.5">Date &amp; Time</th>
                <th className="p-3.5">Specialist</th>
                <th className="p-3.5">Source</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-[var(--ink-2)]">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-sm text-[var(--muted)]">
                    No bookings found matching current filters. Click &ldquo;Book New Trial / Session&rdquo; to schedule one!
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const isToday = b.bookingDate === todayStr
                  return (
                    <tr key={b.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-3.5 font-mono text-[11px] text-[#60A5FA] font-medium">
                        {b.bookingNumber}
                      </td>

                      <td className="p-3.5">
                        <p className="font-ui text-xs font-bold text-white leading-tight">
                          {b.clientName}
                        </p>
                        <p className="font-mono text-[11px] text-[var(--muted)] mt-0.5">
                          {b.clientPhone}
                        </p>
                      </td>

                      <td className="p-3.5">
                        <span className="font-ui text-xs font-semibold text-white block">
                          {b.serviceName}
                        </span>
                        {b.notes && (
                          <span className="text-[10.5px] text-[var(--muted)] line-clamp-1 max-w-xs mt-0.5">
                            {b.notes}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 font-mono text-xs text-white">
                          <Calendar className="w-3.5 h-3.5 text-[#38BDF8]" />
                          <span>{b.bookingDate}</span>
                          {isToday && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                              TODAY
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-[11px] text-[var(--muted)] mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[var(--muted)]" />
                          {b.timeSlot}
                        </p>
                      </td>

                      <td className="p-3.5 font-ui text-xs text-[var(--ink-2)]">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3 text-[#60A5FA]" />
                          <span className="font-medium text-white">{b.assignedStaffName}</span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-white/[0.04] border border-white/10 text-[var(--muted)]">
                          {b.source || 'Walk-in'}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            b.status === 'attended'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : b.status === 'converted'
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                              : b.status === 'no_show'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                          }`}
                        >
                          {b.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>

                      <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                        {/* WhatsApp Confirmation */}
                        <button
                          onClick={() => handleSendWhatsApp(b)}
                          title="Send WhatsApp Confirmation & Location Link"
                          className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span className="text-[10.5px] font-semibold">WhatsApp</span>
                        </button>

                        {/* Status toggles */}
                        {b.status === 'scheduled' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(b.id, 'attended')}
                              title="Mark Attended"
                              className="p-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/30 transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span className="text-[10.5px] font-semibold">Attended</span>
                            </button>
                            <button
                              onClick={() => handleStatusChange(b.id, 'no_show')}
                              title="Mark No-Show"
                              className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        {b.status === 'attended' && (
                          <button
                            onClick={() => {
                              handleStatusChange(b.id, 'converted')
                              router.push(`/billing?prospectName=${encodeURIComponent(b.clientName)}&prospectPhone=${encodeURIComponent(b.clientPhone)}`)
                            }}
                            title="Convert to Member (Create Invoice)"
                            className="p-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 transition-colors inline-flex items-center gap-1 cursor-pointer font-bold"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                            <span className="text-[10.5px]">Convert to Member</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Booking Modal */}
      <BookingModal
        open={bookingModalOpen}
        onOpenChange={setBookingModalOpen}
        onBookingCreated={() => {
          loadData()
        }}
      />
    </div>
  )
}
