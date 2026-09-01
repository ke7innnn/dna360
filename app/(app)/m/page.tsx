'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Flame,
  Calendar,
  Clock,
  Play,
  Dumbbell,
  ArrowRight,
  TrendingUp,
  Award,
  BookOpen,
  Sparkles,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import { Card } from '@/components/app/ui/glass-card'
import Button from '@/components/app/ui/button'
import Badge, { StatusPill } from '@/components/app/ui/badge'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/components/app/ui/toast'
import type { WorkoutSession, MemberProgram } from '@/types/training'

export default function MemberTrainingHomePage() {
  const router = useRouter()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null)
  const [activeProgram, setActiveProgram] = useState<MemberProgram | null>(null)
  const [history, setHistory] = useState<WorkoutSession[]>([])
  const [isStarting, setIsStarting] = useState(false)

  // Fetch member sessions & active program
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/training/sessions')
        if (res.ok) {
          const data = await res.json()
          setActiveSession(data.activeSession)
          setActiveProgram(data.activeProgram)
          setHistory(data.history || [])
        }
      } catch (err) {
        console.error('Failed to load training home:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Start freestyle workout
  const handleStartFreestyle = async (title?: string) => {
    setIsStarting(true)
    try {
      const res = await fetch('/api/training/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title || 'Freestyle Workout' }),
      })
      if (res.ok) {
        toast.success('Workout session started')
        router.push('/m/session')
      } else {
        toast.error('Failed to start session')
      }
    } catch {
      toast.error('Network error starting session')
    } finally {
      setIsStarting(false)
    }
  }

  // Attendance Heatmap simulation (last 28 days)
  const streakDays = 18
  const daysGrid = Array.from({ length: 28 }, (_, i) => {
    const isAttended = i >= 28 - streakDays || (i % 3 === 0 && i < 10)
    return { day: i + 1, attended: isAttended }
  })

  // Expiry calculation (simulated 14 days remaining for high-retention nudge)
  const daysUntilExpiry = 14
  const expiryDateFormatted = '15 Sep 2026'

  return (
    <div className="space-y-6">
      {/* ─── Hero Answering the Three Questions (§8.1) ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Q1: What's my workout today? */}
        <Card className="md:col-span-2 relative overflow-hidden p-5 sm:p-6 border-[rgba(59,130,246,0.3)] bg-gradient-to-br from-[var(--surface)] via-[var(--surface)] to-[rgba(59,130,246,0.08)]">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#3B82F6] opacity-[0.07] rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[11px] font-mono tracking-wider uppercase text-[#60A5FA] font-semibold flex items-center gap-1.5">
              <Zap className="w-3 h-3" /> Question 1 · Today's Workout
            </span>
            {activeProgram ? (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[rgba(52,211,153,0.15)] text-[#34D399] border border-[rgba(52,211,153,0.3)] font-medium">
                {activeProgram.coachingMode === 'TRAINER_LED' ? 'Trainer-Led' : 'Self-Coached'}
              </span>
            ) : (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--muted)] border border-[var(--line)]">
                Freestyle Mode
              </span>
            )}
          </div>

          {activeSession ? (
            // Active session in progress
            <div className="space-y-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white font-display">
                  {activeSession.title || 'In-Progress Workout'}
                </h3>
                <p className="text-xs text-[var(--muted)] mt-1 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse" />
                  Currently running · {activeSession.exercises.length} exercises logged
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link href="/m/session">
                  <Button variant="primary" className="gap-2 shadow-[0_0_16px_rgba(59,130,246,0.4)]">
                    <Play className="w-4 h-4 fill-white" /> Resume Workout
                  </Button>
                </Link>
              </div>
            </div>
          ) : activeProgram ? (
            // Scheduled program day
            <div className="space-y-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white font-display">
                  {activeProgram.snapshot?.name || 'Assigned Programme'}
                </h3>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Week {activeProgram.currentVersion} · {activeProgram.snapshot?.daysPerWeek || 3} days per week
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  variant="primary"
                  onClick={() => handleStartFreestyle(activeProgram.snapshot?.days?.[0]?.label || 'Scheduled Workout')}
                  disabled={isStarting}
                  className="gap-2 shadow-[0_0_16px_rgba(59,130,246,0.4)]"
                >
                  <Play className="w-4 h-4 fill-white" /> Start Workout
                </Button>
                <Link href="/m/programs">
                  <Button variant="secondary" className="gap-1.5 text-xs">
                    View Plan <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            // Freestyle lifter with no program — high contrast primary CTA (§8.1)
            <div className="space-y-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white font-display">
                  Ready to Train
                </h3>
                <p className="text-xs text-[var(--ink-2)] mt-1">
                  Walk in, lift, and log sets with offline-first tracking and automatic rest timer.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  variant="primary"
                  onClick={() => handleStartFreestyle()}
                  disabled={isStarting}
                  className="gap-2 bg-gradient-to-r from-[#3B82F6] to-[#1D4ED8] text-white shadow-[0_0_20px_rgba(59,130,246,0.5)] font-semibold px-5"
                >
                  <Dumbbell className="w-4 h-4" /> Log a Workout
                </Button>

                {history.length > 0 && (
                  <Button
                    variant="secondary"
                    onClick={() => handleStartFreestyle(`Repeat: ${history[0].title || 'Last Workout'}`)}
                    className="gap-1.5 text-xs text-[var(--ink-2)]"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Repeat Last Session
                  </Button>
                )}

                <Link href="/m/programs">
                  <Button variant="ghost" className="gap-1 text-xs text-[#60A5FA]">
                    Browse Gym Library <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </Card>

        {/* Q2: When does my plan expire? (§8.6) */}
        <Card className="p-5 flex flex-col justify-between border-[rgba(245,158,11,0.25)] bg-gradient-to-br from-[var(--surface)] to-[rgba(245,158,11,0.06)]">
          <div>
            <span className="text-[11px] font-mono tracking-wider uppercase text-[#F59E0B] font-semibold flex items-center gap-1.5 mb-2">
              <Calendar className="w-3 h-3" /> Question 2 · Plan Status
            </span>
            <div className="mt-2">
              <div className="text-3xl font-extrabold text-white font-display flex items-baseline gap-1.5">
                {daysUntilExpiry} <span className="text-sm font-normal text-[var(--muted)]">days left</span>
              </div>
              <p className="text-xs text-[var(--muted)] mt-1">
                Annual Gym Membership · Valid till {expiryDateFormatted}
              </p>
            </div>
          </div>

          <div className="pt-4 mt-auto">
            <button
              onClick={() => toast.success('One-Tap Renewal Initiated', { description: 'Razorpay checkout opening for Annual Plan renew.' })}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-black font-semibold text-xs shadow-[0_0_12px_rgba(245,158,11,0.3)] hover:brightness-110 transition-all flex items-center justify-center gap-1.5"
            >
              Renew Membership <Sparkles className="w-3.5 h-3.5" />
            </button>
          </div>
        </Card>
      </div>

      {/* Q3: Am I on a streak? (§8.5 Turnstile Attendance Heatmap) */}
      <Card className="p-5 sm:p-6 border-[var(--line)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <span className="text-[11px] font-mono tracking-wider uppercase text-[#34D399] font-semibold flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 fill-[#34D399]" /> Question 3 · Consistency & Streak
            </span>
            <h4 className="text-lg font-bold text-white font-display mt-1">
              {streakDays} Day Turnstile Streak
            </h4>
            <p className="text-xs text-[var(--muted)]">
              Verified physical check-ins at DNA 360 Powai Studio
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-[var(--ink-2)]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[rgba(255,255,255,0.06)] border border-[var(--line)]" />
              <span>Rest</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[#34D399] shadow-[0_0_6px_#34D399]" />
              <span>Checked In</span>
            </div>
          </div>
        </div>

        {/* 28-Day Heatmap Grid */}
        <div className="grid grid-cols-7 sm:grid-cols-14 gap-2 pt-2">
          {daysGrid.map((d) => (
            <div
              key={d.day}
              className={`h-7 rounded-lg flex items-center justify-center text-[10px] font-mono transition-all ${
                d.attended
                  ? 'bg-gradient-to-br from-[#34D399] to-[#059669] text-black font-bold shadow-[0_0_8px_rgba(52,211,153,0.3)]'
                  : 'bg-[var(--surface-2)] text-[var(--muted)] border border-[var(--line)]'
              }`}
              title={`Day ${d.day}: ${d.attended ? 'Checked In' : 'Rest'}`}
            >
              {d.day}
            </div>
          ))}
        </div>
      </Card>

      {/* ─── Quick Feature Grid (§8) ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/m/programs">
          <Card className="p-4 hover:border-[rgba(59,130,246,0.4)] transition-all group cursor-pointer h-full flex flex-col justify-between">
            <div className="w-8 h-8 rounded-lg bg-[rgba(59,130,246,0.15)] text-[#60A5FA] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-sm font-semibold text-white group-hover:text-[#60A5FA] transition-colors">
                Gym Library
              </h5>
              <p className="text-[11px] text-[var(--muted)] mt-0.5">
                Browse curated programs & start in 2 taps
              </p>
            </div>
          </Card>
        </Link>

        <Link href="/m/progress">
          <Card className="p-4 hover:border-[rgba(52,211,153,0.4)] transition-all group cursor-pointer h-full flex flex-col justify-between">
            <div className="w-8 h-8 rounded-lg bg-[rgba(52,211,153,0.15)] text-[#34D399] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-sm font-semibold text-white group-hover:text-[#34D399] transition-colors">
                PR Trophy Board
              </h5>
              <p className="text-[11px] text-[var(--muted)] mt-0.5">
                All-time heaviest lifts & 1RM records
              </p>
            </div>
          </Card>
        </Link>

        <Link href="/classes">
          <Card className="p-4 hover:border-[rgba(245,158,11,0.4)] transition-all group cursor-pointer h-full flex flex-col justify-between">
            <div className="w-8 h-8 rounded-lg bg-[rgba(245,158,11,0.15)] text-[#F59E0B] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-sm font-semibold text-white group-hover:text-[#F59E0B] transition-colors">
                Studio Classes
              </h5>
              <p className="text-[11px] text-[var(--muted)] mt-0.5">
                Reformer Pilates, Yoga & Spinning timetable
              </p>
            </div>
          </Card>
        </Link>

        <Link href="/m/ledger">
          <Card className="p-4 hover:border-[rgba(129,140,248,0.4)] transition-all group cursor-pointer h-full flex flex-col justify-between">
            <div className="w-8 h-8 rounded-lg bg-[rgba(129,140,248,0.15)] text-[#818CF8] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-sm font-semibold text-white group-hover:text-[#818CF8] transition-colors">
                PT Balance
              </h5>
              <p className="text-[11px] text-[var(--muted)] mt-0.5">
                Immutable deduction history & entitlements
              </p>
            </div>
          </Card>
        </Link>
      </div>

      {/* ─── Recent Workout Timeline ─── */}
      {history.length > 0 && (
        <Card className="p-5 sm:p-6 border-[var(--line)]">
          <h4 className="text-sm font-bold text-white font-display mb-3 flex items-center justify-between">
            <span>Recent Completed Workouts</span>
            <Link href="/m/progress" className="text-xs font-normal text-[#60A5FA] hover:underline">
              Full History & Charts →
            </Link>
          </h4>

          <div className="divide-y divide-[var(--line)]">
            {history.slice(0, 3).map((s) => (
              <div key={s.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <h6 className="text-sm font-medium text-white">
                    {s.title || 'Workout Session'}
                  </h6>
                  <p className="text-[11px] text-[var(--muted)] mt-0.5">
                    {s.completedAt ? new Date(s.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recent'} · {s.exercises.length} movements · RPE {s.perceivedEffort || 8}/10
                  </p>
                </div>

                <span className="text-xs px-2.5 py-1 rounded-full bg-[rgba(52,211,153,0.1)] text-[#34D399] border border-[rgba(52,211,153,0.2)] flex items-center gap-1 font-mono">
                  <CheckCircle2 className="w-3 h-3" /> Done
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
