'use client'

import React, { useState, useMemo } from 'react'
import {
  Clock,
  Users,
  MessageCircle,
  Phone,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  CreditCard,
  UserPlus,
  Dumbbell,
  Check,
} from 'lucide-react'
import { getStoredMembers } from '@/lib/members'
import { getStoredLeads, updateLeadStage } from '@/lib/leads'
import { getTodayBookings, getWhatsAppBookingLink, updateBookingStatus } from '@/lib/bookings'
import { BOOKING_SERVICES, type Booking, type BookingStatus } from '@/types/booking'
import { formatINR } from '@/lib/gst'
import { cn } from '@/lib/utils'
import { toast } from '@/components/app/ui/toast'
import Link from 'next/link'

export type FollowupTab = 'renewals' | 'enquiries' | 'trials'

export default function TodayPendingFollowups({
  className,
  onOpenRenewInvoice,
}: {
  className?: string
  onOpenRenewInvoice?: (memberId: string) => void
}) {
  const [activeTab, setActiveTab] = useState<FollowupTab>('renewals')
  const [contactedMemberIds, setContactedMemberIds] = useState<string[]>([])

  const members = getStoredMembers()
  const leads = getStoredLeads()
  const [bookings, setBookings] = useState<Booking[]>(() => getTodayBookings())

  // ─── 1. Pending Renewal Follow-ups ───
  const pendingRenewals = useMemo(() => {
    return members
      .filter((m) => m.status === 'expiring_soon' || m.status === 'grace_period')
      .slice(0, 8)
      .map((m) => {
        const mem = m.active_memberships?.[0]
        return {
          memberId: m.id,
          name: m.name,
          memberCode: m.member_code,
          phone: m.phone,
          planName: mem?.product_name || 'Annual Gym Membership',
          expiryDate: mem?.expiry_date || new Date().toISOString().slice(0, 10),
          amountMinor: mem?.amount_paid || 4350000,
          isContacted: contactedMemberIds.includes(m.id),
        }
      })
  }, [members, contactedMemberIds])

  // ─── 2. Fresh Enquiries (Leads requiring follow-up today) ───
  const pendingEnquiries = useMemo(() => {
    return leads
      .filter((l) => l.stage === 'inquiry' || l.stage === 'trial_scheduled')
      .slice(0, 8)
  }, [leads])

  // ─── 3. Trials Booked for Today ───
  const pendingTrials = useMemo(() => {
    return bookings
  }, [bookings])

  const toggleContacted = (memberId: string) => {
    if (contactedMemberIds.includes(memberId)) {
      setContactedMemberIds(contactedMemberIds.filter((id) => id !== memberId))
      toast.info('Marked as pending follow-up')
    } else {
      setContactedMemberIds([...contactedMemberIds, memberId])
      toast.success('Marked renewal follow-up as contacted!')
    }
  }

  const sendRenewalWhatsApp = (r: typeof pendingRenewals[0]) => {
    const cleanPhone = r.phone.replace(/\D/g, '')
    const msg = encodeURIComponent(
      `Hello ${r.name}, warm greetings from DNA 360 Gym & Wellness! Your ${r.planName} is due for renewal today (${r.expiryDate}). We have reserved your preferred training slots. To renew today at your current rate (${formatINR(r.amountMinor)}), please reply here or visit the front desk!`
    )
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank')
    if (!contactedMemberIds.includes(r.memberId)) {
      setContactedMemberIds([...contactedMemberIds, r.memberId])
    }
    toast.success(`WhatsApp reminder opened for ${r.name}`)
  }

  const sendLeadWhatsApp = (lead: typeof pendingEnquiries[0]) => {
    const cleanPhone = lead.phone.replace(/\D/g, '')
    const msg = encodeURIComponent(
      `Hi ${lead.name}, thanks for reaching out to DNA 360 Gym & Wellness! We noticed you are interested in ${lead.goal || 'fitness training'}. Would you like to drop by today for a tour of our studio and an initial fitness consultation?`
    )
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank')
    toast.success(`WhatsApp chat opened for ${lead.name}`)
  }

  const handleBookingStatusChange = (bookingId: string, newStatus: BookingStatus) => {
    const updated = updateBookingStatus(bookingId, newStatus)
    if (updated) {
      setBookings(getTodayBookings())
      toast.success(`Booking marked as ${newStatus}`)
    }
  }

  return (
    <div
      className={cn(
        'rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] p-5 space-y-4',
        className
      )}
    >
      {/* ─── Header & Category Tabs ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
        <div>
          <h3 className="font-display font-semibold text-base text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#38BDF8]" />
            <span>Today&apos;s Pending Follow-ups</span>
          </h3>
          <p className="font-ui text-xs text-[var(--ink-3)]">
            Prioritized outreach tasks waiting on desk staff today
          </p>
        </div>

        {/* 3 Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
          <button
            onClick={() => setActiveTab('renewals')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold font-ui transition-all flex items-center gap-1.5 cursor-pointer',
              activeTab === 'renewals'
                ? 'bg-[#38BDF8] text-[#05070E] font-bold shadow-xs'
                : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
            )}
          >
            <span>Renewals</span>
            <span
              className={cn(
                'px-1.5 py-0.2 rounded-full text-[10px] font-bold font-data',
                activeTab === 'renewals'
                  ? 'bg-black/20 text-[#05070E]'
                  : 'bg-white/10 text-white/80'
              )}
            >
              {pendingRenewals.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('enquiries')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold font-ui transition-all flex items-center gap-1.5 cursor-pointer',
              activeTab === 'enquiries'
                ? 'bg-[#38BDF8] text-[#05070E] font-bold shadow-xs'
                : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
            )}
          >
            <span>Fresh Enquiries</span>
            <span
              className={cn(
                'px-1.5 py-0.2 rounded-full text-[10px] font-bold font-data',
                activeTab === 'enquiries'
                  ? 'bg-black/20 text-[#05070E]'
                  : 'bg-white/10 text-white/80'
              )}
            >
              {pendingEnquiries.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('trials')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold font-ui transition-all flex items-center gap-1.5 cursor-pointer',
              activeTab === 'trials'
                ? 'bg-[#38BDF8] text-[#05070E] font-bold shadow-xs'
                : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
            )}
          >
            <span>Trials Booked</span>
            <span
              className={cn(
                'px-1.5 py-0.2 rounded-full text-[10px] font-bold font-data',
                activeTab === 'trials'
                  ? 'bg-black/20 text-[#05070E]'
                  : 'bg-white/10 text-white/80'
              )}
            >
              {pendingTrials.length}
            </span>
          </button>
        </div>
      </div>

      {/* ─── TAB 1: RENEWALS ─── */}
      {activeTab === 'renewals' && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-[var(--ink-3)] font-data">
            <span>MEMBERS EXPIRING TODAY / THIS WEEK</span>
            <Link
              href="/members?filter=expiring_soon"
              className="text-[#38BDF8] hover:underline flex items-center gap-1 text-[11px]"
            >
              <span>View all 82 expiring</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-white/[0.04] rounded-xl border border-white/[0.06] bg-[#070A12] overflow-hidden">
            {pendingRenewals.map((r) => (
              <div
                key={r.memberId}
                className={cn(
                  'p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors',
                  r.isContacted && 'opacity-60 bg-white/[0.01]'
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => toggleContacted(r.memberId)}
                    className={cn(
                      'w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors cursor-pointer',
                      r.isContacted
                        ? 'bg-emerald-500 border-emerald-500 text-black'
                        : 'border-white/20 hover:border-white/50 text-transparent'
                    )}
                    title={r.isContacted ? 'Contacted' : 'Mark as contacted'}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-white truncate">{r.name}</p>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/25 shrink-0">
                        Expires {r.expiryDate}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--ink-3)] truncate mt-0.5">
                      <span>{r.memberCode}</span> ·{' '}
                      <span className="text-white/80">{r.planName}</span> ·{' '}
                      <span className="text-emerald-400 font-semibold font-data">
                        {formatINR(r.amountMinor)}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => sendRenewalWhatsApp(r)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    onClick={() => {
                      if (onOpenRenewInvoice) onOpenRenewInvoice(r.memberId)
                      toast.info(`Opening renewal invoice for ${r.name}`)
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#38BDF8]/15 hover:bg-[#38BDF8]/25 border border-[#38BDF8]/30 text-[#38BDF8] text-xs font-semibold transition-all cursor-pointer"
                  >
                    <CreditCard className="w-3 h-3" />
                    <span>Renew</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 2: FRESH ENQUIRIES ─── */}
      {activeTab === 'enquiries' && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-[var(--ink-3)] font-data">
            <span>INBOUND CRM LEADS WAITING ON FIRST CONTACT</span>
            <Link
              href="/leads"
              className="text-[#38BDF8] hover:underline flex items-center gap-1 text-[11px]"
            >
              <span>View full pipeline</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-white/[0.04] rounded-xl border border-white/[0.06] bg-[#070A12] overflow-hidden">
            {pendingEnquiries.map((lead) => (
              <div
                key={lead.id}
                className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-white truncate">{lead.name}</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/25 shrink-0">
                      {lead.source || 'Walk-in'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/[0.06] text-white/60 shrink-0 capitalize">
                      {lead.stage.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--ink-3)] truncate mt-0.5">
                    <span>{lead.phone}</span> ·{' '}
                    <span className="text-white/80">{lead.goal || 'General Fitness'}</span> ·{' '}
                    <span>Rep: {lead.assignedRepName || 'Unassigned'}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => sendLeadWhatsApp(lead)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>WhatsApp</span>
                  </button>

                  <a
                    href={`tel:${lead.phone}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-white/80 text-xs font-semibold transition-all"
                  >
                    <Phone className="w-3 h-3" />
                    <span>Call</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 3: TRIALS BOOKED ─── */}
      {activeTab === 'trials' && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-[var(--ink-3)] font-data">
            <span>TODAY&apos;S SCHEDULED SESSIONS &amp; TRIALS</span>
            <Link
              href="/bookings"
              className="text-[#38BDF8] hover:underline flex items-center gap-1 text-[11px]"
            >
              <span>Manage all bookings</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-white/[0.04] rounded-xl border border-white/[0.06] bg-[#070A12] overflow-hidden">
            {pendingTrials.length > 0 ? (
              pendingTrials.map((booking) => {
                const serviceDef = BOOKING_SERVICES[booking.serviceType]
                return (
                  <div
                    key={booking.id}
                    className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-data font-bold text-xs text-[#38BDF8] shrink-0">
                          {booking.timeSlot}
                        </span>
                        <p className="font-semibold text-sm text-white truncate">{booking.clientName}</p>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/[0.06] text-white/80 border border-white/[0.1] shrink-0">
                          {booking.serviceName}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--ink-3)] truncate mt-0.5">
                        <span>{booking.clientPhone}</span> ·{' '}
                        <span>Specialist: <b>{booking.assignedStaffName || 'Floor Coach'}</b></span> ·{' '}
                        <span
                          className={cn(
                            'font-semibold capitalize',
                            booking.status === 'attended'
                              ? 'text-emerald-400'
                              : booking.status === 'converted'
                              ? 'text-[#38BDF8]'
                              : booking.status === 'no_show'
                              ? 'text-rose-400'
                              : 'text-amber-300'
                          )}
                        >
                          {booking.status.replace('_', ' ')}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={getWhatsAppBookingLink(booking)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition-all"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>Reminder</span>
                      </a>

                      {booking.status === 'scheduled' && (
                        <button
                          onClick={() => handleBookingStatusChange(booking.id, 'attended')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 text-xs font-semibold transition-all cursor-pointer"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Mark Attended</span>
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="p-6 text-center text-xs text-white/50 space-y-1">
                <Calendar className="w-5 h-5 mx-auto text-white/30" />
                <p>No trials booked for today yet.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
