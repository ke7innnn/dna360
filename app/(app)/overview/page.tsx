'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  TrendingUp, Download, Receipt, Users, AlertTriangle,
  Clock, ShieldAlert, FileSignature, ArrowUpRight,
  ChevronRight, Calendar, Sparkles, Lock, ShieldCheck,
  CreditCard, Dumbbell, ShoppingBag, Zap, Check, ArrowRight,
  ChevronDown, Cake,
} from 'lucide-react'
import Button from '@/components/app/ui/button'
import MemberOnboardingModal from '@/components/app/members/MemberOnboardingModal'
import MembershipStatusReportGraph from '@/components/app/overview/MembershipStatusReportGraph'
import BirthdayReminderModal from '@/components/app/overview/BirthdayReminderModal'
import ExpiryExplorerModal, { type ExpiryFilterPeriod } from '@/components/app/overview/ExpiryExplorerModal'
import TodayPendingFollowups from '@/components/app/overview/TodayPendingFollowups'
import TargetAchievementChart from '@/components/app/analytics/TargetAchievementChart'
import CreateInvoiceModal from '@/components/app/billing/CreateInvoiceModal'
import { useAuth } from '@/context/AuthContext'
import { getSystemMetrics } from '@/lib/metrics'
import { logAuditEvent } from '@/lib/audit'
import { toast } from '@/components/app/ui/toast'

export default function FloorOverviewPage() {
  const router = useRouter()
  const { user, canRevenue } = useAuth()
  const [metrics, setMetrics] = useState(getSystemMetrics())
  const [livePtDoneToday, setLivePtDoneToday] = useState(4)
  const [liveClassFillRate, setLiveClassFillRate] = useState(78)

  useEffect(() => {
    const handleSync = () => {
      setMetrics(getSystemMetrics())
    }
    window.addEventListener('dna360_members_updated', handleSync)
    window.addEventListener('storage', handleSync)

    // Hydrate live class occupancy and PT logs from Supabase
    fetch('/api/classes')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.sessions && Array.isArray(data.sessions) && data.sessions.length > 0) {
          const totalCap = data.sessions.reduce((acc: number, s: any) => acc + (s.capacity || 20), 0)
          const totalBooked = data.sessions.reduce((acc: number, s: any) => acc + (s.bookedCount || 0), 0)
          if (totalCap > 0 && totalBooked > 0) {
            setLiveClassFillRate(Math.min(100, Math.max(65, Math.round((totalBooked / totalCap) * 100))))
          }
        }
      })
      .catch(() => {})

    fetch('/api/pt-ledger')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.logs && Array.isArray(data.logs) && data.logs.length > 0) {
          const todayStr = new Date().toISOString().slice(0, 10)
          const todayDone = data.logs.filter((l: any) => String(l.sessionDate || l.trialDate || l.createdAt || '').startsWith(todayStr)).length
          if (todayDone > 0) setLivePtDoneToday(todayDone)
        }
      })
      .catch(() => {})

    return () => {
      window.removeEventListener('dna360_members_updated', handleSync)
      window.removeEventListener('storage', handleSync)
    }
  }, [])

  const isMember = user?.type === 'MEMBER' || String(user?.role?.slug).toLowerCase() === 'member'

  // Guard: Members belong exclusively to the mobile member app (/m)
  useEffect(() => {
    if (isMember) {
      router.replace('/m')
    }
  }, [isMember, router])

  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState('This month')
  const [currentTime, setCurrentTime] = useState('')
  
  // Modals for new requirements
  const [birthdayModalOpen, setBirthdayModalOpen] = useState(false)
  const [expiryModalOpen, setExpiryModalOpen] = useState(false)
  const [expiryModalMode, setExpiryModalMode] = useState<ExpiryFilterPeriod>('today')
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false)
  const [selectedMemberIdForInvoice, setSelectedMemberIdForInvoice] = useState<string | undefined>(undefined)

  if (isMember) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#05070E]">
        <div className="w-7 h-7 border-2 border-[#38BDF8] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Live timestamp formatting (1s real-time tick)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
      const dayNum = now.getDate()
      const monthName = now.toLocaleDateString('en-US', { month: 'long' }).toUpperCase()
      const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })
      setCurrentTime(`POWAI · ${dayName} ${dayNum} ${monthName} · ${timeStr}`)
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  // Days in current calendar month for the Month Activity calendar
  const calendarDays = React.useMemo(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const todayNum = now.getDate()

    // Monday-indexed day of week: 0=Mon, ..., 6=Sun
    const firstDay = new Date(year, month, 1).getDay()
    const startOffset = (firstDay + 6) % 7

    const daysInPrevMonth = new Date(year, month, 0).getDate()
    const daysInCurrMonth = new Date(year, month + 1, 0).getDate()

    const days: { day: number; isMute?: boolean; isToday?: boolean; hasCheckin?: boolean; hasPT?: boolean }[] = []

    // Previous month trailing days
    for (let i = startOffset - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        isMute: true,
        hasCheckin: true,
        hasPT: false,
      })
    }

    // Current month days
    for (let d = 1; d <= daysInCurrMonth; d++) {
      const isPastOrToday = d <= todayNum
      const isToday = d === todayNum
      days.push({
        day: d,
        isToday,
        hasCheckin: isPastOrToday && d % 2 === 1,
        hasPT: isPastOrToday && (d % 4 === 1 || isToday),
      })
    }

    // Trailing days of next month
    const remaining = (7 - (days.length % 7)) % 7
    for (let d = 1; d <= remaining; d++) {
      days.push({
        day: d,
        isMute: true,
        hasCheckin: false,
        hasPT: false,
      })
    }

    return days
  }, [])

  // Weekly bar comparison: This week vs Last week
  const weeklyData = [
    { day: 'Mon', ghostHeight: 88, fillHeight: 74 },
    { day: 'Tue', ghostHeight: 70, fillHeight: 81 },
    { day: 'Wed', ghostHeight: 62, fillHeight: 66 },
    { day: 'Thu', ghostHeight: 74, fillHeight: 59 },
    { day: 'Fri', ghostHeight: 80, fillHeight: 71 },
    { day: 'Sat', ghostHeight: 52, fillHeight: 44 },
    { day: 'Sun', ghostHeight: 34, fillHeight: 28 },
  ]

  return (
    <div className="space-y-4 max-w-[1340px] mx-auto pb-14">
      {/* ─── Topbar ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-normal text-white font-serif tracking-tight">
            Floor overview
          </h1>
          <p className="font-data text-[10.5px] text-[var(--ink-3)] tracking-[0.14em] uppercase mt-1">
            {currentTime}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Birthday Reminder Quick Chip */}
          <button
            onClick={() => setBirthdayModalOpen(true)}
            className="console-chip flex items-center gap-1.5 text-rose-300 border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 transition-all cursor-pointer"
            title="Today's Birthday Reminders"
          >
            <Cake className="w-3.5 h-3.5 text-rose-400" />
            <span className="font-semibold">Birthdays (3)</span>
          </button>

          {/* Expiry Explorer Quick Chip */}
          <button
            onClick={() => {
              setExpiryModalMode('month')
              setExpiryModalOpen(true)
            }}
            className="console-chip flex items-center gap-1.5 text-[#38BDF8] border-[#38BDF8]/30 bg-[#38BDF8]/10 hover:bg-[#38BDF8]/20 transition-all cursor-pointer"
            title="Expiry & Renewal Explorer"
          >
            <Calendar className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span className="font-semibold">Expiry Explorer</span>
          </button>

          <div className="relative group">
            <button
              type="button"
              onClick={() => {
                const modes = ['This month', 'This week', 'Today']
                const next = modes[(modes.indexOf(selectedPeriod) + 1) % modes.length]
                setSelectedPeriod(next)
              }}
              className="console-chip flex items-center gap-1.5 cursor-pointer"
            >
              <span>{selectedPeriod}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--ink-3)]" />
            </button>
          </div>

          <button
            onClick={() => setOnboardingOpen(true)}
            className="console-chip solid flex items-center gap-1.5 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            Add member
          </button>
        </div>
      </div>

      {/* ─── 6 Stat Executive Financial & Operational Strip ─── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* Stat 1: Today's Collection */}
        <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--line)] space-y-1">
          <p className="eyebrow text-[9px] text-emerald-400 tracking-wider font-data uppercase font-bold">
            TODAY&apos;S COLLECTION
          </p>
          <p className="v text-2xl font-bold text-white font-data tabular-nums">
            {canRevenue ? '₹1,24,500' : '••••••'}
          </p>
          <p className="d text-[11px] text-[var(--ink-3)] font-data">
            {canRevenue ? '₹98.5K UPI · ₹26K POS' : 'Restricted to Finance / Owner'}
          </p>
        </div>

        {/* Stat 2: Monthly Upcoming Renewal Collection Amount */}
        <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--line)] space-y-1">
          <p className="eyebrow text-[9px] text-[#38BDF8] tracking-wider font-data uppercase font-bold">
            UPCOMING RENEWALS ({new Date().toLocaleDateString('en-US', { month: 'short' }).toUpperCase()})
          </p>
          <p className="v text-2xl font-bold text-white font-data tabular-nums">
            {canRevenue ? '₹6,85,000' : '38 Due'}
          </p>
          <p className="d text-[11px] text-[#38BDF8] font-data">38 renewals in pipeline</p>
        </div>

        {/* Stat 3: Same-Day Expiries */}
        <div
          onClick={() => {
            setExpiryModalMode('today')
            setExpiryModalOpen(true)
          }}
          className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1 cursor-pointer hover:border-amber-400 transition-all group"
        >
          <div className="flex items-center justify-between">
            <p className="eyebrow text-[9px] text-amber-300 tracking-wider font-data uppercase font-bold">
              EXPIRING TODAY
            </p>
            <Clock className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="v text-2xl font-bold text-amber-200 font-data tabular-nums">4 Members</p>
          <p className="d text-[11px] text-amber-300/80 font-data underline decoration-dotted">
            ₹1.74L at risk · View list &rarr;
          </p>
        </div>

        {/* Stat 4: Today's Birthdays */}
        <div
          onClick={() => setBirthdayModalOpen(true)}
          className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 space-y-1 cursor-pointer hover:border-rose-400 transition-all group"
        >
          <div className="flex items-center justify-between">
            <p className="eyebrow text-[9px] text-rose-300 tracking-wider font-data uppercase font-bold">
              BIRTHDAYS TODAY
            </p>
            <Cake className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="v text-2xl font-bold text-rose-200 font-data tabular-nums">3 Celebrants</p>
          <p className="d text-[11px] text-rose-300/80 font-data underline decoration-dotted">
            Send WhatsApp wishes &rarr;
          </p>
        </div>

        {/* Stat 5: Checked In Today */}
        <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--line)] space-y-1">
          <p className="eyebrow text-[9px] text-[var(--ink-3)] tracking-wider font-data uppercase">
            CHECKED IN TODAY
          </p>
          <p className="v text-2xl font-bold text-white font-data tabular-nums">184</p>
          <p className="d text-[#4ADE80] font-data text-[11px]">▲ 12% vs last Tue</p>
        </div>

        {/* Stat 6: Active Members */}
        <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--line)] space-y-1">
          <p className="eyebrow text-[9px] text-[var(--ink-3)] tracking-wider font-data uppercase">
            ACTIVE MEMBERS
          </p>
          <p className="v text-2xl font-bold text-white font-data tabular-nums">{metrics.activeMembers || metrics.totalMembers || 512}</p>
          <p className="d text-[#4ADE80] font-data text-[11px]">▲ 9 this week</p>
        </div>
      </div>

      {/* ─── Bento Layout: 400px | 1fr | 250px ─── */}
      <div className="console-bento">
        {/* ─── LEFT COLUMN: Month Activity (400px) ─── */}
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-card)] p-5 space-y-4">
          <div className="flex items-start justify-between">
            <h3 className="text-xl sm:text-2xl font-normal text-white font-display tracking-tight">
              Month activity
            </h3>
            <Link href="/attendance">
              <ArrowUpRight className="w-4 h-4 text-[var(--ink-3)] hover:text-white transition-colors cursor-pointer" />
            </Link>
          </div>

          {/* Month Calendar */}
          <div>
            <div className="console-cal">
              <span className="wd">Mo</span>
              <span className="wd">Tu</span>
              <span className="wd">We</span>
              <span className="wd">Th</span>
              <span className="wd">Fr</span>
              <span className="wd">Sa</span>
              <span className="wd">Su</span>

              {calendarDays.map((c, idx) => (
                <div
                  key={idx}
                  className={`d ${c.isMute ? 'mute' : ''} ${c.isToday ? 'today' : ''}`}
                >
                  <span>{c.day}</span>
                  <div className="console-dots">
                    {c.hasCheckin && (
                      <i className="dr" style={c.isToday ? { background: '#FFFFFF' } : undefined} />
                    )}
                    {c.hasPT && (
                      <i className="dv" style={c.isToday ? { background: '#FFFFFF' } : undefined} />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4 mt-3 text-[10.5px] text-[var(--ink-3)]">
              <span className="flex items-center gap-1.5">
                <i className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] inline-block" /> Check-ins
              </span>
              <span className="flex items-center gap-1.5">
                <i className="w-1.5 h-1.5 rounded-full bg-[var(--blue)] inline-block" /> PT sessions
              </span>
            </div>
          </div>

          {/* Tri Stats */}
          <div className="console-tri">
            <div>
              <p className="l">Peak hour</p>
              <p className="v text-white font-display">7–8 pm</p>
            </div>
            <div>
              <p className="l">Avg. daily</p>
              <p className="v text-white font-display">171</p>
            </div>
            <div>
              <p className="l">Busiest day</p>
              <p className="v text-white font-display">Monday</p>
            </div>
          </div>

          {/* Revenue Mix Progress Rows */}
          <div>
            <p className="eyebrow text-[9px] text-[var(--ink-3)] tracking-wider font-data uppercase mb-2.5">
              REVENUE MIX · {new Date().toLocaleDateString('en-US', { month: 'long' }).toUpperCase()}
            </p>

            <div className="space-y-2">
              <div className="console-grow g1">
                <div className="console-grow-ic">
                  <CreditCard className="w-3.5 h-3.5 stroke-white" />
                </div>
                <div className="console-grow-t">
                  <b>Memberships</b>
                  <span className="text-white">₹5.2L</span>
                </div>
                <span className="console-grow-p font-data text-white">62%</span>
              </div>

              <div className="console-grow g2">
                <div className="console-grow-ic">
                  <Users className="w-3.5 h-3.5 stroke-white" />
                </div>
                <div className="console-grow-t">
                  <b>Personal training</b>
                  <span className="text-white">₹2.4L</span>
                </div>
                <span className="console-grow-p font-data text-white">29%</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── MIDDLE COLUMN: Needs Attention + This Week ─── */}
        <div className="space-y-4">
          {/* Needs Attention Card */}
          <div className="console-att">
            <div className="console-att-head">
              <div>
                <h3 className="text-white">Needs attention</h3>
                <p>
                  Nine things are waiting on someone today. Cleared items drop off this list automatically.
                </p>
              </div>
              <span className="console-att-count">9</span>
            </div>

            {/* Row 1: Memberships Expiring */}
            <div className="console-arow">
              <div className="console-arow-ic">
                <Clock className="w-3.5 h-3.5 stroke-[#38BDF8]" />
              </div>
              <div className="console-arow-t">
                <b className="text-white">Memberships expiring this week</b>
                <span>None contacted yet</span>
              </div>
              <span className="console-arow-n">11</span>
              <button
                onClick={() => router.push('/members?filter=expiring_soon')}
                className="console-arow-go"
              >
                Open
              </button>
            </div>

            {/* Row 2: Unpaid Dues */}
            <div className="console-arow">
              <div className="console-arow-ic">
                <AlertTriangle className="w-3.5 h-3.5 stroke-[var(--warn)]" />
              </div>
              <div className="console-arow-t">
                <b className="text-white">Unpaid dues over 15 days</b>
                <span>₹1,42,000 outstanding</span>
              </div>
              <span className="console-arow-n">6</span>
              <button
                onClick={() => router.push('/billing')}
                className="console-arow-go"
              >
                Open
              </button>
            </div>

            {/* Row 3: Churn Risk */}
            <div className="console-arow">
              <div className="console-arow-ic">
                <ActivityIcon className="w-3.5 h-3.5 stroke-[var(--violet)]" />
              </div>
              <div className="console-arow-t">
                <b className="text-white">No check-in in 14 days</b>
                <span>Churn risk · assign a call</span>
              </div>
              <span className="console-arow-n">23</span>
              <button
                onClick={() => router.push('/attendance')}
                className="console-arow-go"
              >
                Open
              </button>
            </div>

            {/* Row 4: PT Sessions Awaiting Sign-off */}
            <div className="console-arow">
              <div className="console-arow-ic">
                <Check className="w-3.5 h-3.5 stroke-[var(--blue)]" />
              </div>
              <div className="console-arow-t">
                <b className="text-white">PT sessions awaiting sign-off</b>
                <span>Rajesh Poojary · 3, Aftab Memon · 1</span>
              </div>
              <span className="console-arow-n">4</span>
              <button
                onClick={() => router.push('/my-clients')}
                className="console-arow-go"
              >
                Open
              </button>
            </div>
          </div>

          {/* This Week Bar Chart Card */}
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-card)] p-5">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-lg font-normal text-white font-display">
                This week
              </h3>
              <div className="console-chart-legend">
                <i /> Last week
              </div>
            </div>

            <div className="console-bars">
              {weeklyData.map((item) => (
                <div key={item.day} className="console-bcol">
                  <div
                    className="console-bghost"
                    style={{ height: `${item.ghostHeight}px` }}
                  />
                  <div
                    className="console-bfill"
                    style={{ height: `${item.fillHeight}px` }}
                  />
                  <span className="console-blab">{item.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── RIGHT COLUMN: 3 Mini Tiles (250px) ─── */}
        <div className="space-y-4">
          {/* Mini 1: PT Sessions Today */}
          <div className="console-mini">
            <div className="console-mini-ic">
              <Zap className="w-4 h-4 stroke-[var(--warn)]" />
            </div>
            <div>
              <p className="v text-white font-display">{livePtDoneToday + 8}</p>
              <p className="l font-medium">PT sessions today</p>
              <p className="s">{livePtDoneToday} done · 8 upcoming</p>
            </div>
          </div>

          {/* Mini 2: Class Fill Rate with Wave */}
          <div className="console-mini">
            <div className="console-mini-ic">
              <Calendar className="w-4 h-4 stroke-[var(--blue)]" />
            </div>
            <div>
              <p className="v text-white font-display">{liveClassFillRate}%</p>
              <p className="l font-medium">Class fill rate</p>
              <p className="s">Spin 7 pm nearly full</p>
            </div>
            <div className="console-wave" />
          </div>

          {/* Mini 3: Staff on Roster */}
          <div className="console-mini">
            <div className="console-mini-ic">
              <ActivityIcon className="w-4 h-4 stroke-[var(--ok)]" />
            </div>
            <div>
              <p className="v text-white font-display">34</p>
              <p className="l font-medium">Staff on roster</p>
              <p className="s">9 on floor now</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Today's Pending Follow-ups (Renewals, Fresh Enquiries, Trials Booked) ─── */}
      <TodayPendingFollowups
        className="mt-5"
        onOpenRenewInvoice={(id) => {
          setSelectedMemberIdForInvoice(id)
          setCreateInvoiceOpen(true)
        }}
      />

      {/* ─── Target & Achievement: 12-Month Bar Graph & Current Month Pacing ─── */}
      <TargetAchievementChart className="mt-5" />

      {/* ─── Membership Status Report Graph ─── */}
      <MembershipStatusReportGraph className="mt-5" />

      {/* ─── Modals ─── */}
      {/* Birthday Reminder Pop-up */}
      <BirthdayReminderModal
        open={birthdayModalOpen}
        onOpenChange={setBirthdayModalOpen}
      />

      {/* Same-Day & Period Expiry Explorer Modal */}
      <ExpiryExplorerModal
        open={expiryModalOpen}
        onOpenChange={setExpiryModalOpen}
        initialMode={expiryModalMode}
        onRenewMember={(id) => {
          setSelectedMemberIdForInvoice(id)
          setExpiryModalOpen(false)
          setCreateInvoiceOpen(true)
        }}
      />

      {/* Create / Renewal Invoice Modal */}
      <CreateInvoiceModal
        open={createInvoiceOpen}
        onOpenChange={setCreateInvoiceOpen}
        initialMemberId={selectedMemberIdForInvoice}
      />

      {/* Member Onboarding Modal */}
      <MemberOnboardingModal
        open={onboardingOpen}
        onOpenChange={setOnboardingOpen}
        onMemberCreated={() => {
          setOnboardingOpen(false)
          toast.success('Member onboarded successfully')
        }}
      />
    </div>
  )
}

function ActivityIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} {...props}>
      <path d="M3 12h4l3 8 4-16 3 8h4" />
    </svg>
  )
}
