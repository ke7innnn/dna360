'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  TrendingUp, Download, Receipt, Users, AlertTriangle,
  Clock, ShieldAlert, FileSignature, ArrowUpRight,
  ChevronRight, Calendar, Sparkles, Lock, ShieldCheck,
  CreditCard, Dumbbell, ShoppingBag, Zap, Check, ArrowRight,
  ChevronDown,
} from 'lucide-react'
import Button from '@/components/app/ui/button'
import MemberOnboardingModal from '@/components/app/members/MemberOnboardingModal'
import MembershipStatusReportGraph from '@/components/app/overview/MembershipStatusReportGraph'
import { useAuth } from '@/context/AuthContext'
import { getSystemMetrics } from '@/lib/metrics'
import { logAuditEvent } from '@/lib/audit'
import { toast } from '@/components/app/ui/toast'

export default function FloorOverviewPage() {
  const router = useRouter()
  const { user, canRevenue } = useAuth()
  const metrics = getSystemMetrics()

  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState('This month')
  const [currentTime, setCurrentTime] = useState('POWAI · TUESDAY 1 SEPTEMBER · 6:42 PM')

  // Live timestamp formatting
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
      const dayNum = now.getDate()
      const monthName = now.toLocaleDateString('en-US', { month: 'long' }).toUpperCase()
      const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      setCurrentTime(`POWAI · ${dayName} ${dayNum} ${monthName} · ${timeStr}`)
    }
    updateTime()
    const timer = setInterval(updateTime, 60000)
    return () => clearInterval(timer)
  }, [])

  // Days in current calendar month for the Month Activity calendar
  const calendarDays = [
    { day: 31, isMute: true, hasCheckin: true, hasPT: false },
    { day: 1, isToday: true, hasCheckin: true, hasPT: true },
    { day: 2, hasCheckin: false, hasPT: false },
    { day: 3, hasCheckin: false, hasPT: false },
    { day: 4, hasCheckin: false, hasPT: false },
    { day: 5, hasCheckin: false, hasPT: false },
    { day: 6, hasCheckin: false, hasPT: false },
    { day: 7, hasCheckin: false, hasPT: false },
    { day: 8, hasCheckin: false, hasPT: false },
    { day: 9, hasCheckin: false, hasPT: false },
    { day: 10, hasCheckin: false, hasPT: false },
    { day: 11, hasCheckin: false, hasPT: false },
    { day: 12, hasCheckin: false, hasPT: false },
    { day: 13, hasCheckin: false, hasPT: false },
    { day: 14, hasCheckin: false, hasPT: false },
    { day: 15, hasCheckin: false, hasPT: false },
    { day: 16, hasCheckin: false, hasPT: false },
    { day: 17, hasCheckin: false, hasPT: false },
    { day: 18, hasCheckin: false, hasPT: false },
    { day: 19, hasCheckin: false, hasPT: false },
    { day: 20, hasCheckin: false, hasPT: false },
    { day: 21, hasCheckin: false, hasPT: false },
    { day: 22, hasCheckin: false, hasPT: false },
    { day: 23, hasCheckin: false, hasPT: false },
    { day: 24, hasCheckin: false, hasPT: false },
    { day: 25, hasCheckin: false, hasPT: false },
    { day: 26, hasCheckin: false, hasPT: false },
    { day: 27, hasCheckin: false, hasPT: false },
    { day: 28, hasCheckin: false, hasPT: false },
    { day: 29, hasCheckin: false, hasPT: false },
    { day: 30, hasCheckin: false, hasPT: false },
    { day: 1, isMute: true, hasCheckin: false, hasPT: false },
    { day: 2, isMute: true, hasCheckin: false, hasPT: false },
    { day: 3, isMute: true, hasCheckin: false, hasPT: false },
    { day: 4, isMute: true, hasCheckin: false, hasPT: false },
  ]

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="text-3xl sm:text-4xl font-normal text-white font-serif tracking-tight">
            Floor overview
          </h1>
          <p className="font-data text-[10.5px] text-[var(--ink-3)] tracking-[0.14em] uppercase mt-1">
            {currentTime}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative group">
            <button className="console-chip flex items-center gap-1.5">
              <span>{selectedPeriod}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--ink-3)]" />
            </button>
          </div>

          <button
            onClick={() => setOnboardingOpen(true)}
            className="console-chip solid flex items-center gap-1.5 hover:brightness-110 active:scale-95 transition-all"
          >
            Add member
          </button>
        </div>
      </div>

      {/* ─── 4 Stat Strip ─── */}
      <div className="console-strip">
        <div className="console-stat">
          <p className="eyebrow text-[9px] text-[var(--ink-3)] tracking-wider font-data uppercase">
            CHECKED IN TODAY
          </p>
          <p className="v text-white">184</p>
          <p className="d text-[#4ADE80] font-data">▲ 12% vs last Tue</p>
        </div>

        <div className="console-stat">
          <p className="eyebrow text-[9px] text-[var(--ink-3)] tracking-wider font-data uppercase">
            ACTIVE MEMBERS
          </p>
          <p className="v text-white">{metrics.totalMembers || 679}</p>
          <p className="d text-[#4ADE80] font-data">▲ 9 this week</p>
        </div>

        <div className="console-stat">
          <p className="eyebrow text-[9px] text-[var(--ink-3)] tracking-wider font-data uppercase">
            REVENUE · SEPTEMBER
          </p>
          <p className="v text-white">₹8.4L</p>
          <p className="d text-[var(--ink-3)] font-data">68% of target</p>
        </div>

        <div className="console-stat">
          <p className="eyebrow text-[9px] text-[var(--ink-3)] tracking-wider font-data uppercase">
            EXPIRING IN 30 DAYS
          </p>
          <p className="v text-white">47</p>
          <p className="d text-[var(--rose)] font-data">▼ 11 unreached</p>
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
                      <i className="dr" style={c.isToday ? { background: '#12040A' } : undefined} />
                    )}
                    {c.hasPT && (
                      <i className="dv" style={c.isToday ? { background: '#12040A' } : undefined} />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4 mt-3 text-[10.5px] text-[var(--ink-3)]">
              <span className="flex items-center gap-1.5">
                <i className="w-1.5 h-1.5 rounded-full bg-[var(--rose)] inline-block" /> Check-ins
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
              REVENUE MIX · SEPTEMBER
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
                <Clock className="w-3.5 h-3.5 stroke-[var(--rose)]" />
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
                <span>Rohan · 3, Nikhil · 1</span>
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
              <p className="v text-white font-display">12</p>
              <p className="l font-medium">PT sessions today</p>
              <p className="s">4 done · 8 upcoming</p>
            </div>
          </div>

          {/* Mini 2: Class Fill Rate with Wave */}
          <div className="console-mini">
            <div className="console-mini-ic">
              <Calendar className="w-4 h-4 stroke-[var(--blue)]" />
            </div>
            <div>
              <p className="v text-white font-display">78%</p>
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

      {/* ─── Membership Status Report Graph ─── */}
      <MembershipStatusReportGraph className="mt-5" />

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
