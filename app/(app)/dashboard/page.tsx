'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Bell,
  Plus,
  Calendar,
  Clock,
  Play,
  Dumbbell,
  Check,
  ChevronRight,
  Pause,
  ArrowUp,
  Sparkles,
  Award,
  FileText,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  ArrowRight,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/components/app/ui/toast'
import FreezeMemberModal from '@/components/app/members/FreezeMemberModal'
import RenewMemberModal from '@/components/app/members/RenewMemberModal'

export default function MemberDashboardPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [freezeModalOpen, setFreezeModalOpen] = useState(false)
  const [renewModalOpen, setRenewModalOpen] = useState(false)
  const [currentDateStr, setCurrentDateStr] = useState('TUE, 1 SEPTEMBER')
  const [greetingTime, setGreetingTime] = useState('Good afternoon')

  // Dynamic date & greeting
  useEffect(() => {
    const now = new Date()
    const dayName = now.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
    const dayNum = now.getDate()
    const monthName = now.toLocaleDateString('en-US', { month: 'long' }).toUpperCase()
    setCurrentDateStr(`${dayName}, ${dayNum} ${monthName}`)

    const hour = now.getHours()
    if (hour < 12) setGreetingTime('Good morning')
    else if (hour < 17) setGreetingTime('Good afternoon')
    else setGreetingTime('Good evening')
  }, [])

  const memberName = user?.name || 'Aarav Mehta'
  const memberFirstName = memberName.split(' ')[0]

  return (
    <div className="max-w-7xl mx-auto py-2 sm:py-6 px-2 sm:px-4 space-y-6">
      {/* ─── Top Brand & Greeting Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-end gap-[2.5px]">
              <i className="w-[3px] h-[9px] rounded-[2px] bg-[#FF5C7A] block" />
              <i className="w-[3px] h-[13px] rounded-[2px] bg-[#F0699C] block" />
              <i className="w-[3px] h-[17px] rounded-[2px] bg-[#C86DD7] block" />
              <i className="w-[3px] h-[13px] rounded-[2px] bg-[#9B7BE8] block" />
              <i className="w-[3px] h-[9px] rounded-[2px] bg-[#6E8CF0] block" />
            </div>
            <p className="eyebrow text-[10px] text-[var(--ink-3)] font-data tracking-wider uppercase">
              {currentDateStr} · POWAI FLAGSHIP STUDIO
            </p>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-display tracking-tight">
            {greetingTime}, {memberFirstName}
          </h1>
        </div>

        {/* Quick Member Status Badges */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="px-3.5 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--line)] flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-[#4ADE80] animate-pulse" />
            <span className="text-[var(--ink-2)]">Streak:</span>
            <span className="font-data font-bold text-white">12 days</span>
          </div>

          <div className="px-3.5 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--line)] flex items-center gap-2 text-xs">
            <span className="text-[var(--ink-2)]">PT Balance:</span>
            <span className="font-data font-bold text-[#FF5C7A]">6 / 12 left</span>
          </div>

          <Link href="/m/session">
            <button className="px-4 py-1.5 rounded-full bg-[#FF5C7A] text-[#12040A] font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow-[0_0_14px_rgba(255,92,122,0.35)] flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 fill-current" /> Live workout
            </button>
          </Link>
        </div>
      </div>

      {/* ─── Wide PC Bento Grid (Responsive 12-Column) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ─── LEFT / MAIN COLUMN (8 COLS ON PC) ─── */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Signature Circular Strand Meter Card */}
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-card)] p-5 sm:p-6 relative overflow-hidden">
            <div className="absolute -left-[10%] -bottom-[20%] w-[120%] h-[50%] bg-[radial-gradient(ellipse_at_50%_100%,rgba(255,92,122,0.1),rgba(120,90,220,0.05)_45%,transparent_70%)] pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-6">
              {/* Strand Meter Ring */}
              <div className="member-meter-ring shrink-0">
                <svg viewBox="0 0 120 120" width="118" height="118">
                  <defs>
                    <linearGradient id="strandGradientWide" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#FF5C7A" />
                      <stop offset="50%" stopColor="#C86DD7" />
                      <stop offset="100%" stopColor="#6E8CF0" />
                    </linearGradient>
                  </defs>
                  <g transform="rotate(-90 60 60)">
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="none"
                      stroke="rgba(255,255,255,.07)"
                      strokeWidth="9"
                      strokeLinecap="round"
                      strokeDasharray="57.4 8"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="none"
                      stroke="url(#strandGradientWide)"
                      strokeWidth="9"
                      strokeLinecap="round"
                      strokeDasharray="57.4 8"
                      pathLength={326.7}
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="none"
                      stroke="#111318"
                      strokeWidth="11"
                      strokeDasharray="130.7 196"
                      strokeDashoffset="-196"
                    />
                  </g>
                </svg>
                <div className="member-meter-val">
                  <b className="text-white">3</b>
                  <span className="text-[10.5px] text-[var(--ink-3)] font-data">of 5 this week</span>
                </div>
              </div>

              {/* Weekly Performance Info & 7-Day Streak Bars */}
              <div className="flex-1 flex flex-col justify-between space-y-4 w-full">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white font-display">
                    Weekly Training Target
                  </h3>
                  <p className="text-xs text-[var(--ink-2)] mt-1">
                    Two sessions left to close your 5-day training goal. Your last workout was on <strong className="text-white font-bold">Saturday</strong>.
                  </p>
                </div>

                {/* 7-Day Streak Bars */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-[var(--ink-3)] mb-1.5">
                    <span>Turnstile & Workout Streak</span>
                    <span className="font-data text-white font-semibold">12 days active</span>
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {[
                      { day: 'M', active: true, today: false },
                      { day: 'T', active: true, today: false },
                      { day: 'W', active: false, today: false },
                      { day: 'T', active: true, today: false },
                      { day: 'F', active: true, today: false },
                      { day: 'S', active: true, today: false },
                      { day: 'S', active: true, today: true },
                    ].map((s, idx) => (
                      <div key={idx} className="flex flex-col items-center gap-1">
                        <div
                          className={`w-full h-7 rounded-lg transition-all ${
                            s.today
                              ? 'bg-[#FF5C7A] shadow-[0_0_10px_rgba(255,92,122,0.5)]'
                              : s.active
                              ? 'bg-[rgba(255,92,122,0.18)] border border-[rgba(255,92,122,0.35)]'
                              : 'bg-[var(--surface-2)] border border-[var(--line)]'
                          }`}
                        />
                        <span className="text-[9px] font-mono text-[var(--ink-3)]">{s.day}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Today's Scheduled Workout Hero Card */}
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-card)] p-5 sm:p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="eyebrow text-[9.5px] text-[var(--ink-3)] font-data tracking-wider uppercase">
                    TODAY · WEEK 3, DAY 1
                  </p>
                  <span className="member-pill member-pill-live">
                    SCHEDULED
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white font-display tracking-tight mt-1">
                  Push Hypertrophy Routine
                </h2>
                <p className="text-xs text-[var(--ink-2)] mt-0.5">
                  6 exercises · about 52 min · Prescribed by Coach Rohan
                </p>
              </div>

              <Link href="/m/session">
                <button className="hidden sm:flex px-6 py-3 rounded-full bg-[#FF5C7A] text-[#12040A] font-bold text-sm hover:brightness-110 active:scale-95 transition-all shadow-[0_0_18px_rgba(255,92,122,0.35)] items-center gap-2">
                  <Play className="w-4 h-4 fill-current" /> Start workout
                </button>
              </Link>
            </div>

            {/* Exercise preview pills in Martian Mono */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--line)]">
                <span className="text-[10px] text-[var(--ink-3)] font-mono block">EXERCISE 1</span>
                <b className="text-xs text-white block mt-0.5 truncate">Barbell Bench Press</b>
                <span className="text-[11px] font-data text-[#FF5C7A] mt-1 block">4 × 8 · 60 kg</span>
              </div>

              <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--line)]">
                <span className="text-[10px] text-[var(--ink-3)] font-mono block">EXERCISE 2</span>
                <b className="text-xs text-white block mt-0.5 truncate">Incline Dumbbell Press</b>
                <span className="text-[11px] font-data text-[#FF5C7A] mt-1 block">3 × 10 · 22.5 kg</span>
              </div>

              <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--line)]">
                <span className="text-[10px] text-[var(--ink-3)] font-mono block">EXERCISE 3</span>
                <b className="text-xs text-white block mt-0.5 truncate">Cable Fly Isolation</b>
                <span className="text-[11px] font-data text-[#FF5C7A] mt-1 block">3 × 12 · RPE 8</span>
              </div>
            </div>

            <div className="sm:hidden pt-2">
              <Link href="/m/session" className="block">
                <button className="w-full py-3.5 rounded-full bg-[#FF5C7A] text-[#12040A] font-bold text-sm hover:brightness-110 active:scale-[0.99] transition-all shadow-[0_0_20px_rgba(255,92,122,0.35)] flex items-center justify-center gap-2">
                  <Play className="w-4 h-4 fill-current" /> Start workout
                </button>
              </Link>
            </div>
          </div>

          {/* 3. 3-Tile Wide Action Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link href="/m/session">
              <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-tile)] p-4 flex flex-col justify-between h-full hover:border-[rgba(255,92,122,0.4)] transition-all cursor-pointer group">
                <div className="w-8 h-8 rounded-lg bg-[var(--surface-2)] flex items-center justify-center text-[var(--ink-2)] group-hover:text-white mb-2 transition-colors">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <b className="text-sm font-semibold text-white block">Log a workout</b>
                  <p className="text-[11px] text-[var(--ink-3)] mt-0.5">Freestyle tracking & rest timer</p>
                </div>
              </div>
            </Link>

            <Link href="/classes">
              <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-tile)] p-4 flex flex-col justify-between h-full hover:border-[rgba(110,140,240,0.4)] transition-all cursor-pointer group">
                <div className="w-8 h-8 rounded-lg bg-[var(--surface-2)] flex items-center justify-center text-[var(--ink-2)] group-hover:text-white mb-2 transition-colors">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <b className="text-sm font-semibold text-white block">Book a class</b>
                  <p className="text-[11px] text-[var(--ink-3)] mt-0.5">Reformer Pilates, Yoga, Spin</p>
                </div>
              </div>
            </Link>

            <Link href="/m/progress">
              <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-tile)] p-4 flex flex-col justify-between h-full hover:border-[rgba(74,222,128,0.4)] transition-all cursor-pointer group">
                <div className="w-8 h-8 rounded-lg bg-[var(--surface-2)] flex items-center justify-center text-[var(--ink-2)] group-hover:text-white mb-2 transition-colors">
                  <Award className="w-4 h-4 text-[#4ADE80]" />
                </div>
                <div>
                  <b className="text-sm font-semibold text-white block">PR Trophy Board</b>
                  <p className="text-[11px] text-[var(--ink-3)] mt-0.5">All-time 1RM & strength records</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* ─── RIGHT COLUMN: Membership, Entitlements & Studio Card (4 COLS ON PC) ─── */}
        <div className="lg:col-span-4 space-y-6">
          {/* Membership Status Card (Screen 2 Direction) */}
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-card)] p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="member-pill member-pill-live">
                ACTIVE PLAN
              </span>
              <span className="font-data text-[10px] text-[var(--ink-3)] uppercase">
                POWAI STUDIO
              </span>
            </div>

            <div className="flex items-start justify-between gap-3 pt-1">
              <div>
                <h3 className="text-lg font-bold text-white font-display leading-tight">
                  12 Months<br />Premium Annual
                </h3>
                <p className="text-xs text-[var(--ink-3)] mt-0.5">DNA-POW-2025-0892</p>
              </div>

              {/* 5 Capsule Brand Bars */}
              <div className="flex items-end gap-[2.5px]">
                <i className="w-[3px] h-[12px] rounded-[2px] bg-[#FF5C7A]/60 block" />
                <i className="w-[3px] h-[17px] rounded-[2px] bg-[#F0699C]/70 block" />
                <i className="w-[3px] h-[22px] rounded-[2px] bg-[#C86DD7]/80 block" />
                <i className="w-[3px] h-[17px] rounded-[2px] bg-[#9B7BE8]/70 block" />
                <i className="w-[3px] h-[12px] rounded-[2px] bg-[#6E8CF0]/60 block" />
              </div>
            </div>

            {/* Validity Bar */}
            <div>
              <div className="member-bar">
                <i style={{ width: '71%' }} />
              </div>
              <div className="member-bar-meta">
                <span>STARTS 12 OCT &apos;25</span>
                <span>ENDS 11 OCT &apos;26</span>
              </div>
            </div>

            {/* Split Actions (Freeze | Upgrade) */}
            <div className="member-card-split">
              <button onClick={() => setFreezeModalOpen(true)}>
                <Pause className="w-3.5 h-3.5" /> Freeze
              </button>
              <div className="divider" />
              <button onClick={() => setRenewModalOpen(true)}>
                <ArrowUp className="w-3.5 h-3.5" /> Upgrade
              </button>
            </div>
          </div>

          {/* Entitlement Rows */}
          <div className="member-rows">
            <Link href="/m/ledger">
              <div className="member-row cursor-pointer">
                <div className="member-row-ic">
                  <Dumbbell className="w-4 h-4 stroke-[#FF5C7A]" />
                </div>
                <div className="member-row-txt">
                  <b className="text-white">6 of 12 PT sessions left</b>
                  <span>Elite tier · with Rohan</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--ink-3)]" />
              </div>
            </Link>

            <div
              onClick={() => setFreezeModalOpen(true)}
              className="member-row cursor-pointer"
            >
              <div className="member-row-ic">
                <Clock className="w-4 h-4 stroke-[#FF5C7A]" />
              </div>
              <div className="member-row-txt">
                <b className="text-white">18 of 30 freeze days left</b>
                <span>Resets on renewal</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--ink-3)]" />
            </div>

            <Link href="/billing">
              <div className="member-row cursor-pointer">
                <div className="member-row-ic">
                  <FileText className="w-4 h-4 stroke-[#FF5C7A]" />
                </div>
                <div className="member-row-txt">
                  <b className="text-white">Invoices & GST Receipts</b>
                  <span>11 receipts available</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--ink-3)]" />
              </div>
            </Link>
          </div>

          {/* Plan Expiry Nudge Tile */}
          <div className="p-4 rounded-[var(--r-card)] bg-[rgba(255,92,122,0.06)] border border-[rgba(255,92,122,0.25)] flex items-center justify-between gap-3">
            <div>
              <b className="text-xs font-semibold text-white block">
                47 days left on your plan
              </b>
              <span className="text-[11px] text-[var(--ink-2)] block mt-0.5">
                Renew early to lock in current rate and save ₹4,000.
              </span>
            </div>

            <button
              onClick={() => setRenewModalOpen(true)}
              className="px-3.5 py-1.5 rounded-full bg-[#FF5C7A] text-[#12040A] text-xs font-bold shrink-0 hover:brightness-110 active:scale-95 transition-all"
            >
              Renew
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <FreezeMemberModal
        open={freezeModalOpen}
        onOpenChange={setFreezeModalOpen}
        member={null}
        onFrozen={() => toast.success('Membership frozen')}
      />

      <RenewMemberModal
        open={renewModalOpen}
        onOpenChange={setRenewModalOpen}
        member={null}
        onRenewed={() => toast.success('Membership renewed')}
      />
    </div>
  )
}
