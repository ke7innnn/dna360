'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Flame, Activity, Dumbbell, Droplets, Calendar,
  Clock, CheckCircle2, Plus, FileText, PauseCircle,
  Sparkles, ArrowRight, ShieldCheck, Download,
  CreditCard, Smartphone, CheckSquare, Square,
  Check, ArrowUpRight,
} from 'lucide-react'
import Card from '@/components/app/ui/glass-card'
import StatTile from '@/components/app/ui/StatTile'
import Button from '@/components/app/ui/button'
import Badge, { StatusPill } from '@/components/app/ui/badge'
import TokenReadout from '@/components/app/ui/TokenReadout'
import PageHeader from '@/components/app/ui/PageHeader'
import MemberFreezeRequestModal from '@/components/app/member/MemberFreezeRequestModal'
import MemberUpgradeModal from '@/components/app/member/MemberUpgradeModal'
import {
  getMemberPortalState,
  getMemberBookings,
  addWaterIntake,
  cancelMemberBooking,
} from '@/lib/memberportal'
import { formatINR } from '@/lib/gst'
import type { MemberPortalState, MemberClassBooking } from '@/types/memberportal'
import { toast } from '@/components/app/ui/toast'
import { cn } from '@/lib/utils'

export default function MemberDashboardPage() {
  const [state, setState] = useState<MemberPortalState>(() => getMemberPortalState())
  const [bookings, setBookings] = useState<MemberClassBooking[]>([])
  const [completedSets, setCompletedSets] = useState<Record<string, boolean>>({
    'ex1_s1': true,
    'ex1_s2': true,
    'ex1_s3': false,
    'ex1_s4': false,
  })

  const [freezeModalOpen, setFreezeModalOpen] = useState(false)
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)

  const refreshData = () => {
    setState(getMemberPortalState())
    setBookings(getMemberBookings())
  }

  useEffect(() => {
    refreshData()
    const handleUpdate = () => refreshData()
    window.addEventListener('dna360_memberportal_updated', handleUpdate)
    return () => window.removeEventListener('dna360_memberportal_updated', handleUpdate)
  }, [])

  const handleAddWater = (ml: number) => {
    const updated = addWaterIntake(ml)
    setState(updated)
    toast.success(`Logged +${ml}ml Hydration`, {
      description: `Daily total: ${updated.waterIntakeMl} / ${updated.waterTargetMl} ml`,
    })
  }

  const toggleSet = (setId: string) => {
    setCompletedSets((prev) => ({
      ...prev,
      [setId]: !prev[setId],
    }))
  }

  const targetWater = state?.waterTargetMl || 3500
  const currentWater = state?.waterIntakeMl || 0
  const waterPct = Math.min(100, Math.round((currentWater / targetWater) * 100))
  const memberPhone = state?.phone || '+91 98200 11111'
  const maskedPhone = memberPhone.replace(/(\+91\d{2})\d{4}(\d{4})/, '$1•• ••$2')

  return (
    <div className="space-y-8 select-none">
      {/* Header Member Greeting */}
      <PageHeader
        eyebrow={`MEMBER PORTAL · ${(state?.branchName || 'POWAI FLAGSHIP').toUpperCase()}`}
        title="Welcome back,"
        italicWord={state?.memberName?.split(' ')[0] || 'Aarav'}
        description="Your check-in, plan and today's programming — all live. Tap the gate token at the turnstile to enter."
        actions={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setFreezeModalOpen(true)}
            >
              Pause membership
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => setUpgradeModalOpen(true)}
            >
              Renew / Upgrade
            </Button>
          </>
        }
      />

      {/* Main Grid: 2-Column with Right Rail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Main Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Member Feature Card with Signature TokenReadout */}
          <Card variant="feature" className="p-6 sm:p-7 relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              {/* Left Details */}
              <div className="space-y-4">
                {/* Plan Badge */}
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-data font-bold tracking-[0.10em] uppercase bg-[rgba(244,63,94,0.14)] text-[var(--accent)] border border-[rgba(244,63,94,0.30)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
                    {state?.planTier || 'PLATINUM ALL-ACCESS'} · {state?.daysRemaining ?? 218} DAYS LEFT
                  </span>
                </div>

                {/* Member Name & Code */}
                <div>
                  <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--ink)] tracking-tight">
                    {state?.memberName || 'Aarav Shah'}
                  </h2>
                  <p className="font-data text-xs text-[var(--muted)] mt-1 tracking-wide">
                    {state?.memberCode || 'DNA-POW-2025-0892'} · {maskedPhone}
                  </p>
                </div>

                {/* Sub Metadata Row */}
                <div className="pt-2 flex flex-wrap items-center gap-6 sm:gap-10 text-xs">
                  <div>
                    <span className="font-data text-[10px] uppercase tracking-[0.14em] text-[var(--muted)] block">
                      VALID THRU
                    </span>
                    <span className="font-data text-[13px] font-semibold text-[var(--ink)] mt-0.5 block">
                      {state?.expiryDate || '15 Mar 2027'}
                    </span>
                  </div>

                  <div>
                    <span className="font-data text-[10px] uppercase tracking-[0.14em] text-[var(--muted)] block">
                      ACCESS
                    </span>
                    <span className="font-ui text-[13px] font-medium text-[var(--ink)] mt-0.5 block">
                      Turnstile Gate 1 & 2
                    </span>
                  </div>

                  <div>
                    <span className="font-data text-[10px] uppercase tracking-[0.14em] text-[var(--muted)] block">
                      STATUS
                    </span>
                    <span className="font-data text-[12px] font-bold text-[var(--green)] mt-0.5 block">
                      Active
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Signature TokenReadout */}
              <div className="pt-4 md:pt-0 md:border-l md:border-[var(--line)] md:pl-8 flex flex-col justify-center">
                <TokenReadout initialTtlSeconds={30} />
              </div>
            </div>
          </Card>

          {/* 4 Stat Tiles Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatTile
              label="STREAK"
              value={state?.attendanceStreak ?? 14}
              unit="days"
              icon={<Flame className="w-4 h-4 text-[var(--accent)]" />}
            />
            <StatTile
              label="TOTAL VISITS"
              value={state?.totalVisits ?? 142}
              icon={<Activity className="w-4 h-4 text-[var(--accent)]" />}
            />
            <StatTile
              label="PT BALANCE"
              value={`${state?.ptSessionsRemaining ?? 8} / ${state?.ptSessionsTotal ?? 12}`}
              icon={<Dumbbell className="w-4 h-4 text-[var(--accent)]" />}
            />
            <StatTile
              label="HYDRATION"
              value={currentWater}
              unit="ml"
              icon={<Droplets className="w-4 h-4 text-[var(--accent)]" />}
            />
          </div>

          {/* Daily Water Hydration Tracker Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-ui text-base font-semibold text-[var(--ink)]">
                Daily Water Hydration
              </h3>
              <span className="font-data text-xs font-semibold text-[var(--muted)] tracking-wider">
                {waterPct}% OF {(targetWater / 1000).toFixed(1)}L
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mt-4 h-2.5 w-full rounded-full bg-[var(--surface-2)] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#F43F5E] to-[#E11D48] transition-all duration-500 shadow-[0_0_12px_rgba(244,63,94,0.6)]"
                style={{ width: `${waterPct}%` }}
              />
            </div>

            {/* Quick Actions & Target Subtext */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <p className="font-data text-xs text-[var(--muted)]">
                <span className="font-semibold text-[var(--ink)]">{currentWater} ml</span> logged · goal {targetWater} ml
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleAddWater(250)}
                >
                  +250 ml
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleAddWater(500)}
                >
                  +500 ml
                </Button>
              </div>
            </div>
          </Card>

          {/* Today's Routine Card */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-ui text-base font-semibold text-[var(--ink)]">
                  Today's Routine
                </h3>
                <p className="font-ui text-xs text-[var(--muted)] mt-0.5">
                  Day 1 · Upper Body Push — Coach Rajesh Poojary
                </p>
              </div>
              <Button variant="secondary" size="sm">
                Full routine
              </Button>
            </div>

            {/* Routine Item */}
            <div className="p-4 rounded-[var(--r-md)] bg-[var(--surface-2)] border border-[var(--line)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="font-ui text-sm font-semibold text-[var(--ink)] block">
                  Barbell Incline Bench Press
                </span>
                <span className="font-ui text-xs text-[var(--muted)] mt-0.5 block">
                  3-sec eccentric tempo
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs font-data">
                <span className="text-[var(--ink-2)] font-semibold">75 kg</span>
                <span className="text-[var(--muted)]">4 × 8–10</span>
                <div className="flex items-center gap-1.5">
                  {(['ex1_s1', 'ex1_s2', 'ex1_s3', 'ex1_s4'] as const).map((setId, i) => (
                    <button
                      key={setId}
                      onClick={() => toggleSet(setId)}
                      className={cn(
                        'w-6 h-6 rounded flex items-center justify-center font-data text-[10.5px] font-bold transition-all cursor-pointer',
                        completedSets[setId]
                          ? 'bg-[var(--accent)] text-white shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                          : 'bg-[var(--surface)] border border-[var(--line)] text-[var(--muted)] hover:text-white'
                      )}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Rail Column (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: Access This Week */}
          <Card className="p-6 space-y-4">
            <div>
              <span className="font-data text-[10.5px] uppercase tracking-[0.16em] font-medium text-[var(--muted)] block">
                ACCESS · THIS WEEK
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-display text-4xl font-semibold text-[var(--ink)] tabular-nums">
                  5
                </span>
                <span className="font-ui text-xs text-[var(--muted)]">
                  Gym visits logged
                </span>
              </div>
            </div>

            {/* Weekly Bar Graph */}
            <div className="pt-2 flex items-end justify-between gap-2 h-24 px-1">
              {[
                { day: 'M', h: 65, active: true },
                { day: 'T', h: 80, active: true },
                { day: 'W', h: 50, active: true },
                { day: 'T', h: 100, active: true },
                { day: 'F', h: 90, active: true },
                { day: 'S', h: 30, active: false },
                { day: 'S', h: 15, active: false },
              ].map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div
                    className={cn(
                      'w-full rounded-t-[4px] transition-all duration-300',
                      item.active
                        ? 'bg-gradient-to-t from-[#E11D48] to-[#F43F5E] shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                        : 'bg-[var(--surface-2)]'
                    )}
                    style={{ height: `${item.h}%` }}
                  />
                  <span className="font-data text-[10.5px] text-[var(--muted)] font-medium">
                    {item.day}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Card 2: Gate Status */}
          <Card className="p-6 space-y-2.5">
            <span className="font-data text-[10.5px] uppercase tracking-[0.16em] font-medium text-[var(--muted)] block">
              GATE STATUS
            </span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--green)] shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
              <span className="font-ui text-sm font-semibold text-[var(--ink)]">
                Turnstile online · ready
              </span>
            </div>
            <p className="font-ui text-xs text-[var(--muted)] leading-relaxed">
              Token rotates every 30s. Present the code above at Gate 1 or 2.
            </p>
          </Card>

          {/* Card 3: PT Coaching */}
          <Card className="p-6 space-y-3">
            <span className="font-data text-[10.5px] uppercase tracking-[0.16em] font-medium text-[var(--muted)] block">
              PT COACHING
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-semibold text-[var(--ink)] tabular-nums">
                8
              </span>
              <span className="font-ui text-xs text-[var(--muted)]">
                of 12 sessions left
              </span>
            </div>
            {/* Progress bar */}
            <div className="h-2 w-full rounded-full bg-[var(--surface-2)] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#F43F5E] to-[#E11D48]"
                style={{ width: `${(8 / 12) * 100}%` }}
              />
            </div>
          </Card>

          {/* Card 4: Tax Invoice */}
          <Card className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-data text-[10.5px] uppercase tracking-[0.16em] font-medium text-[var(--muted)]">
                TAX INVOICE · 2026-27
              </span>
              <Button variant="secondary" size="sm" icon={<FileText className="w-3.5 h-3.5" />}>
                PDF
              </Button>
            </div>
            <div>
              <div className="font-display text-2xl font-semibold text-[var(--ink)] tabular-nums">
                ₹56,640
              </div>
              <p className="font-data text-[11px] text-[var(--muted)] mt-1">
                SAC 999723 · 18% GST (₹8,640)
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <MemberFreezeRequestModal
        open={freezeModalOpen}
        onOpenChange={setFreezeModalOpen}
        onRequested={() => refreshData()}
      />
      <MemberUpgradeModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        onUpgraded={() => refreshData()}
      />
    </div>
  )
}
