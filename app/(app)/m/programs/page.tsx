'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft,
  Plus,
  Play,
  MoreVertical,
  Clock,
  Dumbbell,
  Activity,
  ArrowUpRight,
  User,
  FastForward,
  Layers,
  BookOpen,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/components/app/ui/toast'
import type { Program, MemberProgram } from '@/types/training'

export default function MemberProgramsPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [activeTab, setActiveTab] = useState<'my_routine' | 'gym_library'>('my_routine')
  const [gymPrograms, setGymPrograms] = useState<Program[]>([])
  const [activeProgram, setActiveProgram] = useState<MemberProgram | null>(null)
  const [loading, setLoading] = useState(true)

  // Shift Plan Modal
  const [shiftModalOpen, setShiftModalOpen] = useState(false)
  const [shiftDays, setShiftDays] = useState(7)
  const [isShifting, setIsShifting] = useState(false)

  const loadPrograms = async () => {
    try {
      const res = await fetch('/api/training/programs')
      if (res.ok) {
        const data = await res.json()
        setGymPrograms(data.gymPrograms || [])
      }

      const sessRes = await fetch('/api/training/sessions')
      if (sessRes.ok) {
        const sessData = await sessRes.json()
        setActiveProgram(sessData.activeProgram || null)
      }
    } catch (e) {
      console.error('Failed to load programs', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPrograms()
  }, [])

  interface RoutineExercise {
    name: string
    sets: number
    reps: number
    load: string
    unit: 'kg' | 'rpe'
    icon: React.ComponentType<{ className?: string }>
  }

  const exercises: RoutineExercise[] = [
    { name: 'Barbell bench press', sets: 4, reps: 8, load: '60', unit: 'kg', icon: Dumbbell },
    { name: 'Incline dumbbell press', sets: 3, reps: 10, load: '22.5', unit: 'kg', icon: Dumbbell },
    { name: 'Cable fly', sets: 3, reps: 12, load: '8', unit: 'rpe', icon: Activity },
    { name: 'Overhead shoulder press', sets: 3, reps: 8, load: '40', unit: 'kg', icon: Dumbbell },
    { name: 'Dumbbell lateral raise', sets: 4, reps: 12, load: '10', unit: 'kg', icon: Dumbbell },
    { name: 'Tricep rope pushdown', sets: 3, reps: 12, load: '25', unit: 'kg', icon: Activity },
  ]

  return (
    <div className="max-w-4xl mx-auto py-2 sm:py-6 px-3 sm:px-6 space-y-6 select-none pb-28 relative">
      {/* ─── Ambient Floating Glass Bubbles & Glows ─── */}
      <div
        className="pointer-events-none absolute top-12 right-4 w-72 h-72 rounded-full opacity-35 -z-10 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(59,130,246,0.35) 0%, rgba(139,92,246,0.2) 50%, transparent 70%)',
        }}
      />
      <div
        className="pointer-events-none absolute top-80 -left-12 w-64 h-64 rounded-full opacity-25 -z-10 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(168,85,247,0.3) 0%, rgba(236,72,153,0.15) 50%, transparent 70%)',
        }}
      />

      {/* ─── Top Header with Actions ─── */}
      <div className="flex items-center justify-between pb-1">
        <button
          onClick={() => router.push('/m')}
          className="w-10 h-10 rounded-full bg-[#111726]/90 backdrop-blur-md border border-white/[0.10] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] flex items-center justify-center text-white hover:border-[#8B5CF6] transition-colors cursor-pointer"
          aria-label="Back to Member Home"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Routine Title */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => toast.info('Custom exercise addition available in session')}
            className="px-3.5 py-1.5 rounded-full bg-[#111726]/90 backdrop-blur-md border border-white/[0.10] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] text-white text-xs font-semibold hover:border-[#3B82F6] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
          <button
            onClick={() => setShiftModalOpen(true)}
            className="w-10 h-10 rounded-full bg-[#111726]/90 backdrop-blur-md border border-white/[0.10] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] flex items-center justify-center text-white hover:border-[#3B82F6] transition-colors cursor-pointer"
            aria-label="Routine Options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Routine Title & Subtitle */}
      <div>
        <h1 className="font-serif text-3xl sm:text-4xl text-white font-normal tracking-tight">
          Push Day
        </h1>
        <p className="font-ui text-xs sm:text-[13px] text-[var(--ink-2)] mt-1">
          Chest, shoulders and triceps. Swap anything that&apos;s occupied.
        </p>
      </div>

      {/* ─── Trainer Prescription Card ─── */}
      <div className="p-5 rounded-[24px] bg-[#0E131F]/90 border border-white/[0.09] shadow-[0_12px_32px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl space-y-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#1D4ED8] to-[#3B82F6] border border-[#60A5FA]/60 flex items-center justify-center text-white font-ui text-xs font-bold shadow-[0_0_14px_rgba(59,130,246,0.35)]">
            RK
          </div>
          <div>
            <h3 className="font-ui text-sm font-bold text-white">
              Rohan Kulkarni
            </h3>
            <p className="font-ui text-xs text-[var(--ink-3)]">
              Elite trainer · assigned 12 Aug
            </p>
          </div>
        </div>

        {/* 3 Telemetry Metrics */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/[0.06] text-xs">
          <div className="px-3 py-2 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md space-y-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <span className="text-[10px] font-ui text-[var(--ink-3)] flex items-center gap-1 font-medium uppercase tracking-wider">
              <Clock className="w-3 h-3 text-[#60A5FA]" /> Duration
            </span>
            <div className="flex items-baseline gap-1 font-sans">
              <span className="font-bold text-white text-sm tabular-nums">52</span>
              <span className="text-[11px] text-[var(--ink-3)] font-medium">mins</span>
            </div>
          </div>

          <div className="px-3 py-2 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md space-y-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <span className="text-[10px] font-ui text-[var(--ink-3)] flex items-center gap-1 font-medium uppercase tracking-wider">
              <Dumbbell className="w-3 h-3 text-[#60A5FA]" /> Volume
            </span>
            <div className="flex items-baseline gap-1 font-sans">
              <span className="font-bold text-white text-sm tabular-nums">~4,200</span>
              <span className="text-[11px] text-[var(--ink-3)] font-medium">kg</span>
            </div>
          </div>

          <div className="px-3 py-2 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md space-y-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <span className="text-[10px] font-ui text-[var(--ink-3)] flex items-center gap-1 font-medium uppercase tracking-wider">
              <Activity className="w-3 h-3 text-[#60A5FA]" /> Level
            </span>
            <span className="font-ui font-bold text-white text-xs block truncate pt-0.5">Intermediate</span>
          </div>
        </div>
      </div>

      {/* ─── Exercise List Queue ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-ui text-sm font-bold text-white tracking-tight">
              Exercises
            </h3>
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-bold font-sans tabular-nums bg-white/[0.07] text-white/90 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_0_10px_rgba(255,255,255,0.05)] backdrop-blur-md">
              {exercises.length}
            </span>
          </div>
          <button
            onClick={() => toast.info('Hold and drag to reorder exercises')}
            className="text-xs text-[var(--ink-3)] hover:text-white transition-colors cursor-pointer"
          >
            Reorder
          </button>
        </div>

        <div className="space-y-2.5">
          {exercises.map((ex, idx) => {
            const Icon = ex.icon
            return (
              <div
                key={idx}
                className="p-3.5 sm:p-4 rounded-[22px] bg-[#0E131F]/90 backdrop-blur-xl border border-white/[0.08] hover:border-[#3B82F6]/50 hover:bg-[#111728] transition-all duration-200 flex items-center justify-between gap-3 group min-w-0 shadow-[0_8px_24px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.04)]"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[rgba(59,130,246,0.18)] to-[rgba(139,92,246,0.10)] border border-[rgba(59,130,246,0.30)] flex items-center justify-center text-[#60A5FA] group-hover:scale-105 group-hover:border-[#60A5FA]/60 shadow-[0_0_14px_rgba(59,130,246,0.2)] transition-all shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <h4 className="font-ui text-sm font-bold text-white group-hover:text-[#60A5FA] transition-colors truncate">
                      {ex.name}
                    </h4>

                    {/* Glass Bubble Pills for Numbers & Telemetry */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Sets Glass Bubble */}
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-sans tabular-nums bg-white/[0.05] border border-white/[0.12] text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_2px_8px_rgba(0,0,0,0.25)] backdrop-blur-md">
                        <span className="font-bold text-white text-[12px]">{ex.sets}</span>
                        <span className="text-[10px] text-[var(--ink-3)] font-semibold uppercase tracking-wider">
                          sets
                        </span>
                      </span>

                      {/* Reps Glass Bubble */}
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-sans tabular-nums bg-white/[0.05] border border-white/[0.12] text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_2px_8px_rgba(0,0,0,0.25)] backdrop-blur-md">
                        <span className="font-bold text-white text-[12px]">{ex.reps}</span>
                        <span className="text-[10px] text-[var(--ink-3)] font-semibold uppercase tracking-wider">
                          reps
                        </span>
                      </span>

                      {/* Load / Weight or RPE Glass Bubble */}
                      {ex.unit === 'rpe' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-sans tabular-nums bg-[rgba(168,85,247,0.14)] border border-[rgba(168,85,247,0.32)] text-[#D8B4FE] shadow-[0_0_12px_rgba(168,85,247,0.18),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-md">
                          <span className="text-[10px] text-[#C084FC] font-bold uppercase tracking-wider">
                            RPE
                          </span>
                          <span className="font-bold text-[#F3E8FF] text-[12px]">{ex.load}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-sans tabular-nums bg-[rgba(59,130,246,0.14)] border border-[rgba(59,130,246,0.32)] text-[#93C5FD] shadow-[0_0_12px_rgba(59,130,246,0.18),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-md">
                          <span className="font-bold text-[#DBEAFE] text-[12px]">{ex.load}</span>
                          <span className="text-[10px] text-[#93C5FD]/80 font-bold uppercase tracking-wider">
                            kg
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => router.push('/m/session')}
                  className="w-8 h-8 rounded-full bg-white/[0.04] border border-white/[0.08] text-[var(--ink-3)] group-hover:text-white group-hover:border-white/20 group-hover:bg-white/[0.08] flex items-center justify-center transition-all cursor-pointer shrink-0"
                  title="View Exercise Telemetry"
                  aria-label={`View details for ${ex.name}`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── Bottom CTA: Start Workout ─── */}
      <div className="pt-2">
        <button
          onClick={() => router.push('/m/session')}
          className="w-full py-4 rounded-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white font-bold font-ui text-sm shadow-[0_0_24px_rgba(37,99,235,0.45),inset_0_1px_0_rgba(255,255,255,0.25)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4 fill-current text-white" />
          Start workout
        </button>
      </div>
    </div>
  )
}
