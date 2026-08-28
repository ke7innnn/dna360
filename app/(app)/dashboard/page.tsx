'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  QrCode, Flame, Trophy, Activity,
  Droplets, Calendar, Dumbbell, Clock,
  CheckCircle, Plus, FileText, PauseCircle,
  Sparkles, ArrowRight, ShieldCheck, Download,
  CreditCard, Smartphone, CheckSquare, Square,
} from 'lucide-react'
import GlassCard from '@/components/app/ui/glass-card'
import StatCard from '@/components/app/ui/stat-card'
import { Button } from '@/components/app/ui/button'
import { StatusPill } from '@/components/app/ui/badge'
import MemberFreezeRequestModal from '@/components/app/member/MemberFreezeRequestModal'
import MemberUpgradeModal from '@/components/app/member/MemberUpgradeModal'
import {
  getMemberPortalState,
  getMemberBookings,
  addWaterIntake,
  cancelMemberBooking,
} from '@/lib/memberportal'
import { formatINR, formatDateTime, getInitials } from '@/lib/utils'
import type { MemberPortalState, MemberClassBooking } from '@/types/memberportal'
import { toast } from '@/components/app/ui/toast'
import { cn } from '@/lib/utils'

export default function MemberDashboardPage() {
  const [state, setState] = useState<MemberPortalState>(getMemberPortalState())
  const [bookings, setBookings] = useState<MemberClassBooking[]>([])
  const [countdown, setCountdown] = useState(28)
  const [completedSets, setCompletedSets] = useState<Record<string, boolean>>({
    'ex1_s1': true,
    'ex1_s2': true,
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

  // Rolling OTP QR countdown simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return 30
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleAddWater = (ml: number) => {
    const updated = addWaterIntake(ml)
    setState(updated)
    toast.success(`Logged +${ml}ml Hydration!`, {
      description: `Daily Total: ${updated.waterIntakeMl} / ${updated.waterTargetMl} ml`,
    })
  }

  const handleCancelBooking = (bookingId: string) => {
    cancelMemberBooking(bookingId)
    toast.success('Class reservation cancelled')
    refreshData()
  }

  const toggleSet = (setId: string) => {
    setCompletedSets((prev) => ({
      ...prev,
      [setId]: !prev[setId],
    }))
  }

  const waterPct = Math.min(100, Math.round((state.waterIntakeMl / state.waterTargetMl) * 100))

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Member Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-[var(--aurora-1)]">
            Member Portal · {state.branchName}
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--app-text-primary)] tracking-tight mt-0.5">
            Welcome back, {state.memberName}
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setFreezeModalOpen(true)}
            icon={<PauseCircle className="w-3.5 h-3.5" />}
          >
            Pause Membership
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setUpgradeModalOpen(true)}
            icon={<Sparkles className="w-3.5 h-3.5" />}
          >
            Renew / Upgrade
          </Button>
        </div>
      </div>

      {/* Signature Rolling QR Digital Turnstile Pass Card */}
      <div className="p-6 sm:p-8 rounded-3xl glass-card border border-[var(--aurora-1)]/40 relative overflow-hidden shadow-2xl shadow-[var(--aurora-1)]/10">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-gradient-to-br from-[var(--aurora-1)]/15 to-transparent blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          {/* Member Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--aurora-1)]/15 text-[var(--aurora-1)] border border-[var(--aurora-1)]/30">
                {state.planTier}
              </span>
              <span className="text-xs text-[var(--app-text-muted)] font-mono">
                {state.daysRemaining} days remaining
              </span>
            </div>

            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--app-text-primary)] tracking-tight">
                {state.memberName}
              </h2>
              <p className="font-mono text-xs text-[var(--app-text-secondary)] mt-0.5">
                {state.memberCode} · {state.phone}
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono text-[var(--app-text-muted)]">
              <span>Valid Thru: <strong className="text-[var(--app-text-primary)]">{state.expiryDate}</strong></span>
              <span>·</span>
              <span>Access: <strong className="text-[var(--aurora-1)]">Turnstile Gate 1 & 2</strong></span>
            </div>
          </div>

          {/* Dynamic Rolling QR Box */}
          <div className="flex flex-col items-center gap-2.5 bg-black/40 p-4 rounded-2xl border border-[var(--aurora-1)]/30 backdrop-blur-md">
            <div className="w-36 h-36 rounded-xl bg-white p-2.5 flex items-center justify-center shadow-inner relative">
              {/* Animated QR Code pattern mockup */}
              <div className="w-full h-full border-2 border-black p-1 flex flex-col justify-between">
                <div className="flex justify-between">
                  <div className="w-7 h-7 bg-black rounded-xs" />
                  <div className="w-7 h-7 bg-black rounded-xs" />
                </div>
                <div className="flex items-center justify-center font-mono text-[0.625rem] font-black text-black">
                  DNA 360
                </div>
                <div className="flex justify-between items-end">
                  <div className="w-7 h-7 bg-black rounded-xs" />
                  <div className="w-4 h-4 bg-black rounded-xs" />
                </div>
              </div>
            </div>

            {/* Rolling 30s Countdown Timer Ring */}
            <div className="flex items-center gap-2 text-xs font-mono text-[var(--app-text-muted)]">
              <span className="w-2 h-2 rounded-full bg-[var(--app-success)] animate-ping" />
              <span>Token: <strong className="text-[var(--aurora-1)]">{state.qrToken}</strong></span>
              <span>({countdown}s)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Attendance Streak"
          value={`${state.attendanceStreak} Days`}
          icon={<Flame className="w-5 h-5 text-amber-500 fill-amber-500 animate-pulse" />}
        />
        <StatCard
          label="Total Gym Visits"
          value={state.totalVisits}
          suffix=" visits"
          icon={<Trophy className="w-5 h-5 text-[var(--aurora-1)]" />}
        />
        <StatCard
          label="PT Coaching Balance"
          value={state.ptSessionsRemaining ?? 0}
          suffix={` / ${state.ptSessionsTotal ?? 0} left`}
          icon={<Dumbbell className="w-5 h-5 text-[var(--app-info)]" />}
        />
        <StatCard
          label="Daily Hydration"
          value={`${state.waterIntakeMl} ml`}
          suffix={` / ${state.waterTargetMl}`}
          icon={<Droplets className="w-5 h-5 text-[var(--app-success)]" />}
        />
      </div>

      {/* Hydration Quick-Log & Progress Bar */}
      <GlassCard padding="md" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-[var(--aurora-1)]" />
            <h3 className="font-display text-sm font-semibold text-[var(--app-text-primary)]">
              Daily Water Hydration Tracker
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => handleAddWater(250)} icon={<Plus className="w-3 h-3" />}>
              +250ml
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleAddWater(500)} icon={<Plus className="w-3 h-3" />}>
              +500ml
            </Button>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-[var(--app-text-secondary)]">{state.waterIntakeMl} ml logged</span>
            <span className="font-bold text-[var(--aurora-1)]">{waterPct}% of 3.5L goal</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[var(--app-glass-bg)] overflow-hidden border border-[var(--app-glass-border)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--aurora-1)] to-[var(--aurora-2)] transition-all duration-500"
              style={{ width: `${waterPct}%` }}
            />
          </div>
        </div>
      </GlassCard>

      {/* Grid: Today's Workout Routine + Upcoming Group Classes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Today's Workout Checklist */}
        <GlassCard padding="md" className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--app-glass-border)] pb-3">
            <div>
              <h3 className="font-display text-base font-semibold text-[var(--app-text-primary)]">
                Today's Workout Routine
              </h3>
              <p className="text-xs text-[var(--app-text-muted)]">
                Day 1: Upper Body Push · Coach: Rajesh Poojary
              </p>
            </div>
            <Link href="/trainers/clients/mem_001">
              <Button variant="ghost" size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />}>
                Full Routine
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {[
              { id: 'ex1', name: 'Barbell Incline Bench Press', sets: '4 Sets', reps: '8-10 Reps', weight: '75 kg', note: '3-sec eccentric tempo' },
              { id: 'ex2', name: 'Flat Dumbbell Press', sets: '3 Sets', reps: '10-12 Reps', weight: '32 kg', note: 'Full chest stretch' },
              { id: 'ex3', name: 'Standing Cable Lateral Raises', sets: '4 Sets', reps: '12-15 Reps', weight: '12.5 kg', note: 'Constant tension' },
              { id: 'ex4', name: 'Overhead Rope Tricep Extension', sets: '3 Sets', reps: '12-15 Reps', weight: '25 kg', note: 'Lockout contraction' },
            ].map((ex) => (
              <div key={ex.id} className="p-3 rounded-xl glass-input space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-semibold text-[var(--app-text-primary)]">{ex.name}</h5>
                    <span className="text-[0.6875rem] text-[var(--app-text-muted)]">{ex.note}</span>
                  </div>
                  <span className="font-mono font-bold text-[var(--aurora-1)]">{ex.weight}</span>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-[var(--app-glass-border)]">
                  <span className="text-[0.6875rem] text-[var(--app-text-muted)] font-mono">{ex.sets} × {ex.reps}</span>
                  <div className="flex-1" />
                  <button
                    type="button"
                    onClick={() => toggleSet(`${ex.id}_s1`)}
                    className="flex items-center gap-1 text-[0.6875rem] font-semibold text-[var(--app-text-secondary)] hover:text-[var(--aurora-1)]"
                  >
                    {completedSets[`${ex.id}_s1`] ? (
                      <CheckSquare className="w-3.5 h-3.5 text-[var(--app-success)]" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-[var(--app-text-muted)]" />
                    )}
                    <span>Set 1</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSet(`${ex.id}_s2`)}
                    className="flex items-center gap-1 text-[0.6875rem] font-semibold text-[var(--app-text-secondary)] hover:text-[var(--aurora-1)]"
                  >
                    {completedSets[`${ex.id}_s2`] ? (
                      <CheckSquare className="w-3.5 h-3.5 text-[var(--app-success)]" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-[var(--app-text-muted)]" />
                    )}
                    <span>Set 2</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Right: Upcoming Group Classes */}
        <GlassCard padding="md" className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--app-glass-border)] pb-3">
            <h3 className="font-display text-base font-semibold text-[var(--app-text-primary)]">
              My Class Bookings ({bookings.length})
            </h3>
            <Link href="/classes">
              <Button variant="ghost" size="sm">
                Book Class
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {bookings.length > 0 ? (
              bookings.map((booking) => (
                <div key={booking.id} className="p-3.5 rounded-xl glass-input space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[var(--aurora-1)]">{booking.time}</span>
                    <StatusPill status="success">{booking.status.toUpperCase()}</StatusPill>
                  </div>

                  <div>
                    <h5 className="font-semibold text-[var(--app-text-primary)]">{booking.classTitle}</h5>
                    <p className="text-[0.6875rem] text-[var(--app-text-muted)] mt-0.5">
                      Coach: {booking.instructorName} · {booking.studioName}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[var(--app-glass-border)] flex items-center justify-between">
                    <span className="font-mono text-[0.6875rem] text-[var(--app-text-muted)]">{booking.date}</span>
                    <button
                      type="button"
                      onClick={() => handleCancelBooking(booking.id)}
                      className="text-[0.6875rem] text-[var(--app-danger)] hover:underline"
                    >
                      Cancel Spot
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-[var(--app-text-muted)] text-center py-8">
                No active class reservations.
              </p>
            )}
          </div>

          {/* Membership & Tax Invoice Quick Download */}
          <div className="p-4 rounded-xl glass-card border border-[var(--app-glass-border)] space-y-2 pt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[var(--app-text-primary)]">Tax Invoice (2026-27)</span>
              <Link href="/billing/invoices/inv_001">
                <span className="font-mono text-[var(--aurora-1)] flex items-center gap-1 hover:underline">
                  <Download className="w-3 h-3" />
                  PDF (₹56,640)
                </span>
              </Link>
            </div>
            <p className="text-[0.6875rem] text-[var(--app-text-muted)]">
              SAC 999723 · 18% GST (₹8,640) breakdown available for personal income tax / corporate reimbursement.
            </p>
          </div>
        </GlassCard>
      </div>

      {/* Modals */}
      <MemberFreezeRequestModal
        open={freezeModalOpen}
        onOpenChange={setFreezeModalOpen}
        onRequestSubmitted={refreshData}
      />

      <MemberUpgradeModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        onUpgraded={refreshData}
      />
    </div>
  )
}
