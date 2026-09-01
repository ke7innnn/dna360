'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Calendar,
  Clock,
  Play,
  Dumbbell,
  ChevronRight,
  Pause,
  ArrowUp,
  Award,
  FileText,
  Zap,
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
  const [currentDateStr, setCurrentDateStr] = useState('TUE 1 SEP · POWAI')
  const [greetingTime, setGreetingTime] = useState('Good afternoon')

  // Dynamic date & time-aware greeting
  useEffect(() => {
    const now = new Date()
    const dayName = now.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
    const dayNum = now.getDate()
    const monthName = now.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
    setCurrentDateStr(`${dayName} ${dayNum} ${monthName} · POWAI`)

    const hour = now.getHours()
    if (hour < 12) setGreetingTime('Good morning')
    else if (hour < 17) setGreetingTime('Good afternoon')
    else setGreetingTime('Good evening')
  }, [])

  const memberName = user?.name || 'Aarav'
  const memberFirstName = memberName.split(' ')[0]

  return (
    <div className="max-w-6xl mx-auto py-1 sm:py-4 px-2 sm:px-4 space-y-5 select-none">
      {/* ─── Top Header (Aligned & Minimal) ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 pb-1">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex items-end gap-[2px]">
              <i className="w-[2.5px] h-[8px] rounded-[1px] bg-[#FF5C7A] block" />
              <i className="w-[2.5px] h-[11px] rounded-[1px] bg-[#F0699C] block" />
              <i className="w-[2.5px] h-[14px] rounded-[1px] bg-[#C86DD7] block" />
              <i className="w-[2.5px] h-[11px] rounded-[1px] bg-[#9B7BE8] block" />
              <i className="w-[2.5px] h-[8px] rounded-[1px] bg-[#6E8CF0] block" />
            </div>
            <span className="font-data text-[10px] text-[var(--ink-3)] tracking-wider uppercase">
              {currentDateStr}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-semibold text-white font-display tracking-tight mt-1">
            {greetingTime}, {memberFirstName}
          </h1>
        </div>

        {/* Minimal Right Badges & Live Workout CTA */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          <div className="px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--line)] flex items-center gap-2 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse" />
            <span className="text-[var(--ink-3)] text-[11px]">Streak:</span>
            <span className="font-data text-xs text-white font-semibold">12 days</span>
          </div>

          <div className="px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--line)] flex items-center gap-2 text-xs">
            <span className="text-[var(--ink-3)] text-[11px]">PT:</span>
            <span className="font-data text-xs text-[#FF5C7A] font-semibold">6 / 12 left</span>
          </div>

          <button
            onClick={() => router.push('/m/session')}
            className="px-4 py-1.5 rounded-full bg-[#FF5C7A] text-[#12040A] font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow-[0_0_14px_rgba(255,92,122,0.35)] flex items-center gap-1.5 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> Live workout
          </button>
        </div>
      </div>

      {/* ─── Main 12-Column Grid (Aligned Left & Right) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* ─── LEFT COLUMN (8 COLS) ─── */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          {/* 1. Weekly Target & Strand Meter Card */}
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-card)] p-5 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute -left-[10%] -bottom-[20%] w-[120%] h-[50%] bg-[radial-gradient(ellipse_at_50%_100%,rgba(255,92,122,0.08),rgba(120,90,220,0.04)_45%,transparent_70%)] pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-5">
              {/* Strand Meter Ring */}
              <div className="relative w-[110px] h-[110px] shrink-0">
                <svg viewBox="0 0 120 120" width="110" height="110">
                  <defs>
                    <linearGradient id="strandGradientAligned" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#FF5C7A" />
                      <stop offset="50%" stopColor="#C86DD7" />
                      <stop offset="100%" stopColor="#6E8CF0" />
                    </linearGradient>
                  </defs>
                  <g transform="rotate(-90 60 60)">
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="rgba(255,255,255,.07)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray="55 8"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="url(#strandGradientAligned)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray="55 8"
                      pathLength={314.16}
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="#111318"
                      strokeWidth="10"
                      strokeDasharray="125.6 188.5"
                      strokeDashoffset="-188.5"
                    />
                  </g>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <b className="text-white text-3xl font-display font-semibold leading-none">3</b>
                  <span className="text-[10px] text-[var(--ink-3)] font-data mt-0.5">of 5 this week</span>
                </div>
              </div>

              {/* Weekly Performance Info & Streak */}
              <div className="flex-1 flex flex-col justify-between space-y-3 w-full">
                <div>
                  <h3 className="text-base font-semibold text-white font-display tracking-tight">
                    Weekly Training Target
                  </h3>
                  <p className="text-xs text-[var(--ink-2)] mt-0.5 leading-relaxed">
                    Two sessions left to complete your 5-day goal. Last completed on <strong className="text-white font-medium">Saturday</strong>.
                  </p>
                </div>

                {/* 7-Day Minimal Streak Bars */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-[var(--ink-3)] mb-1.5">
                    <span>Turnstile & Workout Streak</span>
                    <span className="font-data text-white text-[11px]">12 days</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1.5">
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
                          className={`w-full h-6 rounded-md transition-all ${
                            s.today
                              ? 'bg-[#FF5C7A] shadow-[0_0_8px_rgba(255,92,122,0.4)]'
                              : s.active
                              ? 'bg-[rgba(255,92,122,0.18)] border border-[rgba(255,92,122,0.3)]'
                              : 'bg-[var(--surface-2)] border border-[var(--line)]'
                          }`}
                        />
                        <span className="text-[8.5px] font-mono text-[var(--ink-3)]">{s.day}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Today's Scheduled Routine Card */}
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-card)] p-5 space-y-3.5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-data text-[9.5px] text-[var(--ink-3)] tracking-wider uppercase">
                    TODAY · WEEK 3, DAY 1
                  </span>
                  <span className="tag-pill tag-ok text-[9px] px-2 py-0.5">
                    SCHEDULED
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-white font-display tracking-tight mt-1">
                  Push Hypertrophy Routine
                </h2>
                <p className="text-xs text-[var(--ink-2)] mt-0.5">
                  6 exercises · 52m · Prescribed by Rohan
                </p>
              </div>

              <button
                onClick={() => router.push('/m/session')}
                className="px-5 py-2.5 rounded-full bg-[#FF5C7A] text-[#12040A] font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow-[0_0_16px_rgba(255,92,122,0.35)] flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Start workout
              </button>
            </div>

            {/* Clickable Minimal Exercise Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div
                onClick={() => router.push('/m/session')}
                className="p-3 rounded-xl bg-[var(--surface-2)] hover:bg-[rgba(255,92,122,0.06)] border border-[var(--line)] hover:border-[rgba(255,92,122,0.3)] transition-all cursor-pointer group"
              >
                <span className="text-[9.5px] text-[var(--ink-3)] font-mono block">EXERCISE 1</span>
                <b className="text-xs text-white block mt-0.5 group-hover:text-[#FF5C7A] transition-colors truncate">
                  Barbell Bench Press
                </b>
                <span className="text-[11px] font-data text-[#FF5C7A] mt-0.5 block">4 × 8 · 60 kg</span>
              </div>

              <div
                onClick={() => router.push('/m/session')}
                className="p-3 rounded-xl bg-[var(--surface-2)] hover:bg-[rgba(255,92,122,0.06)] border border-[var(--line)] hover:border-[rgba(255,92,122,0.3)] transition-all cursor-pointer group"
              >
                <span className="text-[9.5px] text-[var(--ink-3)] font-mono block">EXERCISE 2</span>
                <b className="text-xs text-white block mt-0.5 group-hover:text-[#FF5C7A] transition-colors truncate">
                  Incline DB Press
                </b>
                <span className="text-[11px] font-data text-[#FF5C7A] mt-0.5 block">3 × 10 · 22.5 kg</span>
              </div>

              <div
                onClick={() => router.push('/m/session')}
                className="p-3 rounded-xl bg-[var(--surface-2)] hover:bg-[rgba(255,92,122,0.06)] border border-[var(--line)] hover:border-[rgba(255,92,122,0.3)] transition-all cursor-pointer group"
              >
                <span className="text-[9.5px] text-[var(--ink-3)] font-mono block">EXERCISE 3</span>
                <b className="text-xs text-white block mt-0.5 group-hover:text-[#FF5C7A] transition-colors truncate">
                  Cable Fly Isolation
                </b>
                <span className="text-[11px] font-data text-[#FF5C7A] mt-0.5 block">3 × 12 · RPE 8</span>
              </div>
            </div>
          </div>

          {/* 3. Minimal 3-Tile Action Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div
              onClick={() => router.push('/m/session')}
              className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-tile)] p-4 flex flex-col justify-between hover:border-[rgba(255,92,122,0.4)] transition-all cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-[var(--surface-2)] flex items-center justify-center text-[var(--ink-2)] group-hover:text-white mb-2 transition-colors">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <b className="text-xs font-semibold text-white block">Log a workout</b>
                <p className="text-[11px] text-[var(--ink-3)] mt-0.5">Freestyle tracking</p>
              </div>
            </div>

            <div
              onClick={() => router.push('/classes')}
              className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-tile)] p-4 flex flex-col justify-between hover:border-[rgba(110,140,240,0.4)] transition-all cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-[var(--surface-2)] flex items-center justify-center text-[var(--ink-2)] group-hover:text-white mb-2 transition-colors">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <b className="text-xs font-semibold text-white block">Book a class</b>
                <p className="text-[11px] text-[var(--ink-3)] mt-0.5">Reformer Pilates & Yoga</p>
              </div>
            </div>

            <div
              onClick={() => router.push('/m/progress')}
              className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-tile)] p-4 flex flex-col justify-between hover:border-[rgba(74,222,128,0.4)] transition-all cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-[var(--surface-2)] flex items-center justify-center text-[var(--ink-2)] group-hover:text-white mb-2 transition-colors">
                <Award className="w-4 h-4 text-[#4ADE80]" />
              </div>
              <div>
                <b className="text-xs font-semibold text-white block">PR Trophy Board</b>
                <p className="text-[11px] text-[var(--ink-3)] mt-0.5">All-time strength records</p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── RIGHT COLUMN (4 COLS - ALIGNED HEIGHT) ─── */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* Active Plan Card */}
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-card)] p-5 space-y-3 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="tag-pill tag-ok text-[9px] px-2 py-0.5">
                  ACTIVE PLAN
                </span>
                <span className="font-data text-[9.5px] text-[var(--ink-3)] uppercase">
                  POWAI STUDIO
                </span>
              </div>

              <div className="flex items-start justify-between gap-3 pt-2">
                <div>
                  <h3 className="text-lg font-bold text-white font-display leading-tight">
                    12 Months<br />Premium Annual
                  </h3>
                  <p className="text-[11px] text-[var(--ink-3)] mt-0.5 font-mono">DNA-POW-0892</p>
                </div>

                {/* 5 Capsule Brand Bars */}
                <div className="flex items-end gap-[2px]">
                  <i className="w-[2.5px] h-[11px] rounded-[1px] bg-[#FF5C7A]/60 block" />
                  <i className="w-[2.5px] h-[15px] rounded-[1px] bg-[#F0699C]/70 block" />
                  <i className="w-[2.5px] h-[20px] rounded-[1px] bg-[#C86DD7]/80 block" />
                  <i className="w-[2.5px] h-[15px] rounded-[1px] bg-[#9B7BE8]/70 block" />
                  <i className="w-[2.5px] h-[11px] rounded-[1px] bg-[#6E8CF0]/60 block" />
                </div>
              </div>

              {/* Minimal Progress Bar */}
              <div className="mt-3">
                <div className="member-bar" style={{ margin: '10px 0 6px' }}>
                  <i style={{ width: '71%' }} />
                </div>
                <div className="member-bar-meta text-[9px]">
                  <span>STARTS 12 OCT &apos;25</span>
                  <span>ENDS 11 OCT &apos;26</span>
                </div>
              </div>
            </div>

            {/* Split Actions (Freeze | Upgrade) */}
            <div className="member-card-split" style={{ marginTop: 12 }}>
              <button onClick={() => setFreezeModalOpen(true)} className="cursor-pointer">
                <Pause className="w-3.5 h-3.5" /> Freeze
              </button>
              <div className="divider" />
              <button onClick={() => setRenewModalOpen(true)} className="cursor-pointer">
                <ArrowUp className="w-3.5 h-3.5" /> Upgrade
              </button>
            </div>
          </div>

          {/* Entitlement Rows */}
          <div className="member-rows">
            <div
              onClick={() => router.push('/m/ledger')}
              className="member-row cursor-pointer"
            >
              <div className="member-row-ic">
                <Dumbbell className="w-3.5 h-3.5 stroke-[#FF5C7A]" />
              </div>
              <div className="member-row-txt">
                <b className="text-white text-xs">6 of 12 PT sessions left</b>
                <span className="text-[11px]">Elite tier · with Rohan</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[var(--ink-3)]" />
            </div>

            <div
              onClick={() => setFreezeModalOpen(true)}
              className="member-row cursor-pointer"
            >
              <div className="member-row-ic">
                <Clock className="w-3.5 h-3.5 stroke-[#FF5C7A]" />
              </div>
              <div className="member-row-txt">
                <b className="text-white text-xs">18 of 30 freeze days left</b>
                <span className="text-[11px]">Resets on renewal</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[var(--ink-3)]" />
            </div>

            <div
              onClick={() => router.push('/billing')}
              className="member-row cursor-pointer"
            >
              <div className="member-row-ic">
                <FileText className="w-3.5 h-3.5 stroke-[#FF5C7A]" />
              </div>
              <div className="member-row-txt">
                <b className="text-white text-xs">Invoices & Receipts</b>
                <span className="text-[11px]">11 receipts</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[var(--ink-3)]" />
            </div>
          </div>

          {/* Plan Expiry Renewal Banner */}
          <div className="p-3.5 rounded-[var(--r-card)] bg-[rgba(255,92,122,0.06)] border border-[rgba(255,92,122,0.22)] flex items-center justify-between gap-3">
            <div>
              <b className="text-xs font-semibold text-white block">
                47 days left on plan
              </b>
              <span className="text-[11px] text-[var(--ink-2)] block mt-0.5">
                Renew early & save ₹4,000.
              </span>
            </div>

            <button
              onClick={() => setRenewModalOpen(true)}
              className="px-3.5 py-1.5 rounded-full bg-[#FF5C7A] text-[#12040A] text-xs font-bold shrink-0 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              Renew
            </button>
          </div>
        </div>
      </div>

      {/* Fully Functional Modals */}
      <FreezeMemberModal
        open={freezeModalOpen}
        onOpenChange={setFreezeModalOpen}
        member={null}
        onFrozen={() => toast.success('Membership freeze submitted')}
      />

      <RenewMemberModal
        open={renewModalOpen}
        onOpenChange={setRenewModalOpen}
        member={null}
        onRenewed={() => toast.success('Renewal confirmed')}
      />
    </div>
  )
}
