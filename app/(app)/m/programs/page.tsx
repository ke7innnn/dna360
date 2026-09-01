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

  const exercises = [
    { name: 'Barbell bench press', setsReps: '4 × 8', weight: '60 KG', icon: Dumbbell },
    { name: 'Incline dumbbell press', setsReps: '3 × 10', weight: '22.5 KG', icon: Dumbbell },
    { name: 'Cable fly', setsReps: '3 × 12', weight: 'RPE 8', icon: Activity },
    { name: 'Overhead shoulder press', setsReps: '3 × 8', weight: '40 KG', icon: Dumbbell },
    { name: 'Dumbbell lateral raise', setsReps: '4 × 12', weight: '10 KG', icon: Dumbbell },
    { name: 'Tricep rope pushdown', setsReps: '3 × 12', weight: '25 KG', icon: Activity },
  ]

  return (
    <div className="max-w-4xl mx-auto py-2 sm:py-6 px-3 sm:px-6 space-y-6 select-none">
      {/* ─── Top Header with Actions ─── */}
      <div className="flex items-center justify-between pb-1">
        <button
          onClick={() => router.push('/dashboard')}
          className="w-10 h-10 rounded-full bg-[#111726] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-white hover:border-[#3B82F6] transition-colors cursor-pointer"
          aria-label="Back to Dashboard"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Routine Title */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => toast.info('Custom exercise addition available in session')}
            className="px-3.5 py-1.5 rounded-full bg-[#111726] border border-[rgba(255,255,255,0.08)] text-white text-xs font-semibold hover:border-[#3B82F6] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
          <button
            onClick={() => setShiftModalOpen(true)}
            className="w-10 h-10 rounded-full bg-[#111726] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-white hover:border-[#3B82F6] transition-colors cursor-pointer"
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
      <div className="p-5 rounded-[22px] bg-[#0E131F] border border-[rgba(255,255,255,0.08)] space-y-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#1D4ED8] to-[#3B82F6] border border-[#60A5FA]/60 flex items-center justify-center text-white font-ui text-xs font-bold shadow-[0_0_12px_rgba(59,130,246,0.3)]">
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
        <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-[rgba(255,255,255,0.06)] text-xs">
          <div className="space-y-0.5">
            <span className="text-[11px] font-ui text-[var(--ink-3)] flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#60A5FA]" /> Duration
            </span>
            <span className="font-data font-bold text-white text-sm">52 mins</span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[11px] font-ui text-[var(--ink-3)] flex items-center gap-1">
              <Dumbbell className="w-3 h-3 text-[#60A5FA]" /> Volume
            </span>
            <span className="font-data font-bold text-white text-sm">~4,200 kg</span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[11px] font-ui text-[var(--ink-3)] flex items-center gap-1">
              <Activity className="w-3 h-3 text-[#60A5FA]" /> Level
            </span>
            <span className="font-data font-bold text-white text-sm">Intermediate</span>
          </div>
        </div>
      </div>

      {/* ─── Exercise List Queue ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-ui text-sm font-bold text-white tracking-tight">
            Exercises (6)
          </h3>
          <span className="text-xs text-[var(--ink-3)]">
            Reorder
          </span>
        </div>

        <div className="space-y-2.5">
          {exercises.map((ex, idx) => {
            const Icon = ex.icon
            return (
              <div
                key={idx}
                className="p-4 rounded-[20px] bg-[#0E131F] border border-[rgba(255,255,255,0.07)] hover:border-[#3B82F6] hover:bg-[#111726] transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[rgba(59,130,246,0.12)] border border-[rgba(59,130,246,0.25)] flex items-center justify-center text-[#60A5FA] group-hover:scale-105 transition-transform">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-ui text-sm font-bold text-white group-hover:text-[#60A5FA] transition-colors">
                      {ex.name}
                    </h4>
                    <p className="font-data text-xs text-[var(--ink-3)] mt-0.5">
                      {ex.setsReps} · {ex.weight}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => router.push('/m/session')}
                  className="p-2 rounded-full text-[var(--ink-3)] group-hover:text-white hover:bg-[rgba(255,255,255,0.08)] transition-all cursor-pointer"
                  title="View Exercise Telemetry"
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
          className="w-full py-4 rounded-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white font-bold font-ui text-sm shadow-[0_0_24px_rgba(37,99,235,0.45)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4 fill-current text-white" />
          Start workout
        </button>
      </div>
    </div>
  )
}
