'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ShieldCheck,
  Calendar,
  CheckCircle2,
  Lock,
  User,
  Sparkles,
  ChevronLeft,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getMemberPortalState } from '@/lib/memberportal'

export default function MemberPTLedgerPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [remainingSessions, setRemainingSessions] = useState(8)
  const [totalSessions, setTotalSessions] = useState(12)
  const [ptTier, setPtTier] = useState('Premium PT (₹1,699 / Session)')
  const [trainerName, setTrainerName] = useState('Rajesh Poojary')

  useEffect(() => {
    const ps = getMemberPortalState(user?.id || user?.name)
    if (ps.ptSessionsRemaining !== undefined && ps.ptSessionsRemaining !== null) {
      setRemainingSessions(ps.ptSessionsRemaining)
    }
    if (ps.ptSessionsTotal !== undefined && ps.ptSessionsTotal !== null) {
      setTotalSessions(ps.ptSessionsTotal)
    }
    if (ps.assignedTrainer) {
      setTrainerName(ps.assignedTrainer)
    }
  }, [user?.id, user?.name])

  // Sample Immutable Deduction History (§8.7)
  const deductionHistory = [
    {
      id: 'pt_deduct_005',
      date: '7 Sep 2026',
      time: '08:00 AM',
      trainer: 'Rajesh Poojary',
      workoutFocus: 'Posterior Chain & Reformer Jumpboard Drills',
      sessionsDeducted: 1,
      balanceAfter: 7,
      status: 'VERIFIED',
    },
    {
      id: 'pt_deduct_004',
      date: '5 Sep 2026',
      time: '08:30 AM',
      trainer: 'Rajesh Poojary',
      workoutFocus: 'Upper Body Hypertrophy & Rotator Stability',
      sessionsDeducted: 1,
      balanceAfter: 8,
      status: 'VERIFIED',
    },
    {
      id: 'pt_deduct_003',
      date: '2 Sep 2026',
      time: '08:00 AM',
      trainer: 'Rajesh Poojary',
      workoutFocus: 'Quad Hypertrophy & Allegro Reformer Jumpboard',
      sessionsDeducted: 1,
      balanceAfter: 9,
      status: 'VERIFIED',
    },
    {
      id: 'pt_deduct_002',
      date: '28 Aug 2026',
      time: '08:15 AM',
      trainer: 'Rajesh Poojary',
      workoutFocus: 'Deadlift Form Calibration & Core Bracing',
      sessionsDeducted: 1,
      balanceAfter: 10,
      status: 'VERIFIED',
    },
  ]

  const completedSessions = Math.max(0, totalSessions - remainingSessions)
  const progressPercent = Math.min(100, Math.round((remainingSessions / totalSessions) * 100))

  return (
    <div className="w-full max-w-lg mx-auto py-2 sm:py-6 px-3 sm:px-6 space-y-6 select-none pb-28 relative">
      {/* ─── Ambient Floating Glass Bubbles & Glows ─── */}
      <div
        className="pointer-events-none absolute top-12 right-2 w-72 h-72 rounded-full opacity-30 -z-10 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(52,211,153,0.3) 0%, rgba(59,130,246,0.18) 50%, transparent 70%)',
        }}
      />
      <div
        className="pointer-events-none absolute top-96 -left-12 w-64 h-64 rounded-full opacity-25 -z-10 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(168,85,247,0.25) 0%, rgba(59,130,246,0.12) 50%, transparent 70%)',
        }}
      />

      {/* ─── Top Header with Actions ─── */}
      <div className="flex items-center justify-between pb-1">
        <button
          onClick={() => router.push('/m')}
          className="w-10 h-10 rounded-full bg-[#111726]/90 backdrop-blur-md border border-white/[0.10] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] flex items-center justify-center text-white hover:border-[#34D399] transition-colors cursor-pointer"
          aria-label="Back to Member Home"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[11px] font-sans font-semibold tracking-wide backdrop-blur-md">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          Immutable Ledger
        </span>
      </div>

      {/* ─── Title & Subtitle ─── */}
      <div className="space-y-1.5">
        <h1 className="font-serif text-3xl sm:text-4xl text-white font-normal tracking-tight">
          PT Balance &amp; Ledger
        </h1>
        <p className="font-ui text-xs sm:text-[13px] text-[var(--ink-2)] leading-relaxed">
          Dual-signed session ledger. Always synchronized between member and trainer.
        </p>
      </div>

      {/* ─── Hero Sessions Balance Card ─── */}
      <div className="p-5 sm:p-6 rounded-[24px] bg-[#0E131F]/90 border border-emerald-500/25 shadow-[0_16px_36px_rgba(0,0,0,0.35),0_0_24px_rgba(16,185,129,0.08),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl space-y-4">
        {/* Eyebrow & Status */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-sans font-semibold tracking-wider text-emerald-400 uppercase">
            Sessions Balance
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10.5px] font-sans font-semibold tracking-wide backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Active Package
          </span>
        </div>

        {/* Big Minimal Number & Progress */}
        <div className="flex items-baseline justify-between pt-1">
          <div className="flex items-baseline gap-2 font-sans">
            <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight tabular-nums">
              {remainingSessions}
            </span>
            <span className="text-base sm:text-lg font-medium text-[var(--ink-3)] tabular-nums">
              / {totalSessions} left
            </span>
          </div>

          <div className="text-right">
            <span className="text-xs font-sans font-medium text-[var(--ink-2)] block">
              {completedSessions} completed
            </span>
            <span className="text-[11px] font-sans text-emerald-400 font-semibold tabular-nums mt-0.5 block">
              {progressPercent}% remaining
            </span>
          </div>
        </div>

        {/* Minimal Progress Track */}
        <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(52,211,153,0.5)] transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Bottom Micro Details */}
        <p className="text-[11.5px] text-[var(--ink-3)] font-ui leading-relaxed pt-0.5">
          {completedSessions} sessions delivered &amp; cryptographically signed off.
        </p>
      </div>

      {/* ─── Compact Trainer & Tier Grid ─── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Trainer Tile */}
        <div className="p-4 rounded-[22px] bg-[#0E131F]/90 border border-white/[0.08] backdrop-blur-xl shadow-[0_8px_20px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.04)] space-y-2">
          <div className="flex items-center gap-1.5 text-[10.5px] font-sans font-semibold tracking-wider text-[var(--ink-3)] uppercase">
            <User className="w-3.5 h-3.5 text-[#60A5FA]" />
            Trainer
          </div>
          <div>
            <h4 className="font-ui text-sm font-bold text-white truncate">
              {trainerName}
            </h4>
            <p className="font-ui text-[11px] text-[var(--ink-3)] truncate mt-0.5">
              Reformer &amp; Strength Lead
            </p>
          </div>
        </div>

        {/* Tier Tile */}
        <div className="p-4 rounded-[22px] bg-[#0E131F]/90 border border-white/[0.08] backdrop-blur-xl shadow-[0_8px_20px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.04)] space-y-2">
          <div className="flex items-center gap-1.5 text-[10.5px] font-sans font-semibold tracking-wider text-[var(--ink-3)] uppercase">
            <Sparkles className="w-3.5 h-3.5 text-[#C084FC]" />
            Entitlement
          </div>
          <div>
            <h4 className="font-ui text-sm font-bold text-white truncate">
              Premium PT
            </h4>
            <p className="font-sans tabular-nums text-[11px] text-[#60A5FA] font-medium truncate mt-0.5">
              ₹1,699 / session
            </p>
          </div>
        </div>
      </div>

      {/* ─── Immutable Deduction History ─── */}
      <div className="space-y-3.5 pt-1">
        <div className="flex items-center justify-between pb-0.5">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="font-ui text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#60A5FA]" />
                Deduction History
              </h3>
              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-bold font-sans tabular-nums bg-white/[0.07] text-white/90 border border-white/10 backdrop-blur-md">
                {deductionHistory.length}
              </span>
            </div>
            <p className="font-ui text-[11.5px] text-[var(--ink-3)] leading-relaxed">
              Cryptographically verified sign-offs generated upon each completed session.
            </p>
          </div>

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[rgba(59,130,246,0.12)] text-[#93C5FD] border border-[rgba(59,130,246,0.25)] text-[10.5px] font-sans font-semibold tracking-wide backdrop-blur-md shrink-0">
            <ShieldCheck className="w-3 h-3 text-[#60A5FA]" />
            Verified
          </span>
        </div>

        {/* List of Deduction Items */}
        <div className="space-y-3">
          {deductionHistory.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-[22px] bg-[#0E131F]/90 backdrop-blur-xl border border-white/[0.08] hover:border-white/[0.16] hover:bg-[#121828] transition-all duration-200 shadow-[0_8px_24px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.04)] space-y-3 group"
            >
              {/* Card Header: Date & Signed Pill */}
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11.5px] font-sans tabular-nums text-[var(--ink-2)] font-medium">
                  <Calendar className="w-3.5 h-3.5 text-[#60A5FA]" />
                  {item.date} · {item.time}
                </span>

                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shadow-[0_0_8px_rgba(52,211,153,0.15)] text-[10.5px] font-sans font-semibold tracking-wide uppercase backdrop-blur-md shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Signed
                </span>
              </div>

              {/* Workout Focus Title */}
              <div>
                <h4 className="font-ui text-sm font-semibold text-white group-hover:text-[#60A5FA] transition-colors leading-snug">
                  {item.workoutFocus}
                </h4>
                <p className="font-ui text-xs text-[var(--ink-3)] mt-1 flex items-center gap-1.5">
                  <User className="w-3 h-3 text-[var(--ink-3)]" />
                  Coach {item.trainer}
                </p>
              </div>

              {/* Bottom Metrics: Deduction & Remaining Balance as Glass Bubble Pills */}
              <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between">
                <span className="text-[10px] font-sans uppercase tracking-wider text-[var(--ink-3)] font-medium">
                  Audit #{item.id.replace('pt_deduct_', '')}
                </span>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-sans tabular-nums font-semibold bg-rose-500/10 border border-rose-500/25 text-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.15)] backdrop-blur-md">
                    -{item.sessionsDeducted} session
                  </span>

                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-sans tabular-nums font-medium bg-white/[0.06] border border-white/[0.12] text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-md">
                    <span className="text-[10.5px] text-[var(--ink-3)] font-normal">Bal:</span>
                    <span className="font-bold text-white">{item.balanceAfter}</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
