'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  X,
  Plus,
  Minus,
  Check,
  RotateCcw,
  Dumbbell,
  Flame,
  Trophy,
  ArrowRightLeft,
  Clock,
  Sparkles,
  ChevronRight,
  Calculator,
  Play,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { toast } from '@/components/app/ui/toast'
import { cn } from '@/lib/utils'

interface WorkoutSet {
  id: string
  setNum: number
  kg: string
  reps: string
  isDone: boolean
  last: string
  isWarmup?: boolean
}

export default function ActiveWorkoutSessionPage() {
  const router = useRouter()

  // Session elapsed timer (started 24m 21s ago)
  const [elapsedSeconds, setElapsedSeconds] = useState(1461)

  // Rest timer state
  const [restSecondsRemaining, setRestSecondsRemaining] = useState(44)
  const [restTotalSeconds, setRestTotalSeconds] = useState(90)
  const [restTimerActive, setRestTimerActive] = useState(true)

  // Sets state
  const [sets, setSets] = useState<WorkoutSet[]>([
    { id: 's1', setNum: 1, kg: '60', reps: '8', isDone: true, last: '57.5 kg × 8' },
    { id: 's2', setNum: 2, kg: '60', reps: '8', isDone: true, last: '57.5 kg × 8' },
    { id: 's3', setNum: 3, kg: '60', reps: '8', isDone: false, last: '57.5 kg × 7' },
    { id: 's4', setNum: 4, kg: '60', reps: '8', isDone: false, last: '55.0 kg × 8' },
  ])

  // Modals & Sheets
  const [swapModalOpen, setSwapModalOpen] = useState(false)
  const [plateModalOpen, setPlateModalOpen] = useState(false)
  const [finishModalOpen, setFinishModalOpen] = useState(false)
  const [currentExercise, setCurrentExercise] = useState('Barbell bench press')
  const [selectedSetForPlate, setSelectedSetForPlate] = useState<string>('60')

  // Haptic Feedback Helper
  const triggerHaptic = (duration: number | number[] = 15) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(duration)
      } catch {}
    }
  }

  // Session timer ticker
  useEffect(() => {
    const interval = setInterval(() => setElapsedSeconds((prev) => prev + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  // Rest countdown ticker
  useEffect(() => {
    let interval: any = null
    if (restTimerActive && restSecondsRemaining > 0) {
      interval = setInterval(() => {
        setRestSecondsRemaining((prev) => {
          if (prev <= 1) {
            setRestTimerActive(false)
            triggerHaptic([40, 60, 40])
            toast.success('Rest complete! Time for your next set.', {
              description: 'Next: Set ' + (sets.findIndex((s) => !s.isDone) + 1 || 1),
            })
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [restTimerActive, restSecondsRemaining, sets])

  // Toggle set done
  const handleToggleSet = (index: number) => {
    triggerHaptic(20)
    setSets((prev) =>
      prev.map((s, idx) => {
        if (idx === index) {
          const nextDone = !s.isDone
          if (nextDone) {
            const kgNum = parseFloat(s.kg) || 0
            if (kgNum >= 60) {
              toast.success(`Set ${s.setNum} logged! 🎯 Personal Record detected`, {
                description: `${s.kg} kg × ${s.reps} reps (+2.5 kg over previous session)`,
              })
            } else {
              toast.success(`Set ${s.setNum} logged: ${s.kg} kg × ${s.reps} reps`)
            }
            // Auto start rest timer
            setRestTotalSeconds(90)
            setRestSecondsRemaining(90)
            setRestTimerActive(true)
          }
          return { ...s, isDone: nextDone }
        }
        return s
      })
    )
  }

  // Quick weight adjuster
  const handleAdjustWeight = (index: number, delta: number) => {
    triggerHaptic(10)
    setSets((prev) =>
      prev.map((s, idx) => {
        if (idx === index) {
          const current = parseFloat(s.kg) || 0
          const updated = Math.max(0, current + delta)
          return { ...s, kg: String(updated) }
        }
        return s
      })
    )
  }

  // Quick reps adjuster
  const handleAdjustReps = (index: number, delta: number) => {
    triggerHaptic(10)
    setSets((prev) =>
      prev.map((s, idx) => {
        if (idx === index) {
          const current = parseInt(s.reps, 10) || 0
          const updated = Math.max(1, current + delta)
          return { ...s, reps: String(updated) }
        }
        return s
      })
    )
  }

  // Add new set
  const handleAddSet = () => {
    triggerHaptic(15)
    const nextNum = sets.length + 1
    const lastSet = sets[sets.length - 1]
    const newSet: WorkoutSet = {
      id: `s_${Date.now()}`,
      setNum: nextNum,
      kg: lastSet ? lastSet.kg : '60',
      reps: lastSet ? lastSet.reps : '8',
      isDone: false,
      last: lastSet ? `${lastSet.kg} kg × ${lastSet.reps}` : '57.5 kg × 8',
    }
    setSets([...sets, newSet])
    toast.info(`Added Set ${nextNum}`)
  }

  // Rest timer controls
  const handleSkipRest = () => {
    triggerHaptic(10)
    setRestTimerActive(false)
    setRestSecondsRemaining(0)
    toast.info('Rest skipped')
  }

  const handleAdjustRest = (delta: number) => {
    triggerHaptic(10)
    setRestSecondsRemaining((prev) => Math.max(0, prev + delta))
    setRestTimerActive(true)
  }

  const handleFinishWorkout = () => {
    triggerHaptic(30)
    toast.success('Workout Completed & Synchronized! 🎉', {
      description: 'Logged 4 sets · Total Volume: 1,920 kg · Saved to ledger',
    })
    router.push('/m')
  }

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const completedSetsCount = sets.filter((s) => s.isDone).length
  const totalVolume = sets
    .filter((s) => s.isDone)
    .reduce((sum, s) => sum + (parseFloat(s.kg) || 0) * (parseInt(s.reps, 10) || 0), 0)

  // Calculate plates for Olympic Bar (20 kg)
  const targetWeight = parseFloat(selectedSetForPlate) || 60
  const weightPerSide = Math.max(0, (targetWeight - 20) / 2)

  return (
    <div className="min-h-screen bg-[#06080F] text-[#F3F6FC] select-none flex flex-col justify-between">
      {/* ─── STICKY TOP APP BAR ─── */}
      <header className="sticky top-0 z-30 bg-[#06080F]/90 backdrop-blur-xl border-b border-white/[0.06] px-4 pt-[max(0.75rem,env(safe-area-inset-top,0px))] pb-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          {/* Close / Exit Button */}
          <Link
            href="/m"
            className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-white/80 hover:text-white transition-all active:scale-95"
            aria-label="Minimize workout"
          >
            <X className="w-4 h-4" />
          </Link>

          {/* Title & Live Pulse Indicator */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span className="font-ui font-bold text-[15px] tracking-tight text-white">
                Push Day
              </span>
            </div>
            <span className="font-data text-[9.5px] uppercase tracking-[0.14em] text-[var(--ink-3,#718096)]">
              Studio 1 · Rohan K.
            </span>
          </div>

          {/* Stopwatch Elapsed Timer Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(56,189,248,0.1)] border border-[rgba(56,189,248,0.25)] shadow-[0_0_12px_rgba(56,189,248,0.15)]">
            <Clock className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span className="font-data text-xs font-semibold text-[#38BDF8] tracking-wider tabular-nums">
              {formatTime(elapsedSeconds)}
            </span>
          </div>
        </div>

        {/* Dynamic Exercise Progress Bar */}
        <div className="max-w-md mx-auto mt-2.5 space-y-1">
          <div className="w-full h-1 bg-white/[0.08] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#2563EB] via-[#38BDF8] to-[#34D399] rounded-full transition-all duration-500"
              style={{ width: `${(2 / 6) * 100}%` }}
            />
          </div>
          <div className="flex justify-between items-center font-data text-[9px] text-[var(--ink-3,#818CA3)] uppercase tracking-widest pt-0.5">
            <span>Exercise 2 of 6</span>
            <span>33% Complete</span>
          </div>
        </div>
      </header>

      {/* ─── MAIN WORKOUT LOGGING CONTAINER ─── */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 pt-3 pb-36 space-y-4">
        {/* 1. EXERCISE HERO CARD */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-[#0F1629] to-[#0A0E1A] border border-white/[0.08] shadow-[0_12px_32px_rgba(0,0,0,0.5)] relative overflow-hidden">
          {/* Subtle Ambient Backlight Glow */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-[#38BDF8]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-md bg-[#38BDF8]/15 border border-[#38BDF8]/30 text-[10px] font-bold text-[#38BDF8] uppercase tracking-wider">
                  Chest · Primary
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white/[0.06] text-[10px] font-medium text-white/70">
                  Compound
                </span>
              </div>
              <h1 className="text-xl font-bold font-ui text-white tracking-tight">
                {currentExercise}
              </h1>
              <p className="font-data text-[11px] text-[var(--ink-2,#9FB0CE)] mt-0.5">
                4 Sets · 8 Reps · 60 kg · 90s Rest
              </p>
            </div>

            {/* Quick Action Icons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setSwapModalOpen(true)}
                title="Swap Exercise"
                className="w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] flex items-center justify-center text-white/80 hover:text-white transition-all"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-[#38BDF8]" />
              </button>
              <button
                onClick={() => setPlateModalOpen(true)}
                title="Plate Calculator"
                className="w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] flex items-center justify-center text-white/80 hover:text-white transition-all"
              >
                <Calculator className="w-3.5 h-3.5 text-[#34D399]" />
              </button>
            </div>
          </div>

          {/* Performance Milestone Strip */}
          <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-data">
            <div className="flex items-center gap-1.5 text-amber-400">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>PR: 65 kg × 6</span>
            </div>
            <div className="text-[var(--ink-3,#718096)]">
              Volume so far: <span className="text-white font-semibold">{totalVolume.toLocaleString()} kg</span>
            </div>
          </div>
        </div>

        {/* 2. SET LOGGING TABLE (PERFECT PROPORTIONS & ZERO OVERFLOW) */}
        <div className="rounded-2xl bg-[#0B0F1C]/85 border border-white/[0.08] p-3.5 space-y-2.5 shadow-xl">
          {/* Table Column Headers */}
          <div className="grid grid-cols-[34px_1fr_84px_74px_42px] gap-2 items-center text-center font-data text-[9.5px] uppercase tracking-wider text-[var(--ink-3,#6E7B99)] px-1">
            <span className="text-left pl-1">SET</span>
            <span className="text-left pl-2">PREVIOUS</span>
            <span>KG</span>
            <span>REPS</span>
            <span className="text-right pr-1">DONE</span>
          </div>

          {/* Set Rows */}
          <div className="space-y-2">
            {sets.map((s, idx) => (
              <div
                key={s.id}
                className={cn(
                  'grid grid-cols-[34px_1fr_84px_74px_42px] gap-2 items-center p-2 rounded-xl border transition-all duration-200 min-w-0',
                  s.isDone
                    ? 'bg-[#10B981]/[0.08] border-[#10B981]/30 shadow-[0_0_12px_rgba(16,185,129,0.06)]'
                    : 'bg-white/[0.025] border-white/[0.06] hover:border-white/[0.12]'
                )}
              >
                {/* 1. Set Badge */}
                <div className="flex flex-col items-center justify-center">
                  <span
                    className={cn(
                      'w-7 h-7 rounded-lg flex items-center justify-center font-data text-xs font-bold transition-all',
                      s.isDone
                        ? 'bg-[#10B981] text-black font-black'
                        : 'bg-white/[0.06] text-white/90 border border-white/[0.08]'
                    )}
                  >
                    {s.setNum}
                  </span>
                </div>

                {/* 2. Previous Telemetry (Compact, Tabular) */}
                <div className="min-w-0 pl-1">
                  <p className="font-data text-[11px] font-medium text-white/70 truncate tabular-nums">
                    {s.last}
                  </p>
                  <span className="font-data text-[9px] text-[var(--ink-3,#6B7A99)] uppercase">
                    {s.isDone ? 'Completed' : 'Target'}
                  </span>
                </div>

                {/* 3. KG Input with Stepper */}
                <div className="relative flex items-center">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.5"
                    value={s.kg}
                    onChange={(e) => {
                      const val = e.target.value
                      setSets((prev) =>
                        prev.map((item, i) => (i === idx ? { ...item, kg: val } : item))
                      )
                    }}
                    onFocus={() => setSelectedSetForPlate(s.kg)}
                    className={cn(
                      'w-full h-10 px-2 text-center rounded-xl font-data text-sm font-bold tracking-tight outline-none border transition-all',
                      s.isDone
                        ? 'bg-white/[0.04] text-white/90 border-[#10B981]/30'
                        : 'bg-[#141B2D] text-white border-white/[0.12] focus:border-[#38BDF8] focus:bg-[#18233C]'
                    )}
                  />
                  <span className="absolute right-1.5 pointer-events-none font-data text-[9px] text-white/40 uppercase">
                    kg
                  </span>
                </div>

                {/* 4. Reps Input */}
                <div className="relative flex items-center">
                  <input
                    type="number"
                    inputMode="numeric"
                    step="1"
                    value={s.reps}
                    onChange={(e) => {
                      const val = e.target.value
                      setSets((prev) =>
                        prev.map((item, i) => (i === idx ? { ...item, reps: val } : item))
                      )
                    }}
                    className={cn(
                      'w-full h-10 px-2 text-center rounded-xl font-data text-sm font-bold tracking-tight outline-none border transition-all',
                      s.isDone
                        ? 'bg-white/[0.04] text-white/90 border-[#10B981]/30'
                        : 'bg-[#141B2D] text-white border-white/[0.12] focus:border-[#38BDF8] focus:bg-[#18233C]'
                    )}
                  />
                </div>

                {/* 5. Check Tick Button (Chunky 42x40 Touch Target) */}
                <button
                  onClick={() => handleToggleSet(idx)}
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer active:scale-90',
                    s.isDone
                      ? 'bg-gradient-to-tr from-[#059669] to-[#10B981] text-white shadow-[0_0_16px_rgba(16,185,129,0.5)] border-transparent'
                      : 'bg-white/[0.04] border border-white/[0.12] hover:border-white/[0.25] text-white/30 hover:text-white/80'
                  )}
                  aria-label={`Mark set ${s.setNum} complete`}
                >
                  <Check className={cn('w-4 h-4 stroke-[2.6]', s.isDone ? 'text-white' : '')} />
                </button>
              </div>
            ))}
          </div>

          {/* Quick Increment Row & Add Set Button */}
          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={handleAddSet}
              className="flex-1 h-10 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.09] hover:border-[#38BDF8]/40 flex items-center justify-center gap-2 text-xs font-semibold text-white/80 hover:text-white transition-all active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Add Set</span>
            </button>
            <button
              onClick={() => handleAdjustWeight(sets.length - 1, 2.5)}
              className="h-10 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.09] text-[11px] font-data font-semibold text-white/70 hover:text-white active:scale-95"
            >
              +2.5 kg
            </button>
            <button
              onClick={() => handleAdjustReps(sets.length - 1, 1)}
              className="h-10 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.09] text-[11px] font-data font-semibold text-white/70 hover:text-white active:scale-95"
            >
              +1 Rep
            </button>
          </div>
        </div>

        {/* 3. INTERACTIVE REST TIMER CARD */}
        <div
          className={cn(
            'p-3.5 rounded-2xl border transition-all duration-300 relative overflow-hidden',
            restTimerActive && restSecondsRemaining > 0
              ? 'bg-gradient-to-r from-[#0C192E] via-[#0E2242] to-[#0A172C] border-[#38BDF8]/40 shadow-[0_8px_24px_rgba(56,189,248,0.15)]'
              : 'bg-[#090D18] border-white/[0.07]'
          )}
        >
          {/* Top Row: Label, Countdown, and Skip */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-8 h-8 rounded-xl flex items-center justify-center',
                  restTimerActive ? 'bg-[#38BDF8]/20 text-[#38BDF8]' : 'bg-white/[0.06] text-white/40'
                )}
              >
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="font-ui text-xs font-semibold text-white/90">Rest Countdown</span>
                <p className="font-data text-[9.5px] text-[var(--ink-3,#718096)]">
                  {restTimerActive ? 'Resting between sets' : 'Timer stopped'}
                </p>
              </div>
            </div>

            {/* Countdown Display */}
            <div className="text-right">
              <span className="font-data text-2xl font-black text-[#38BDF8] tracking-wider tabular-nums">
                0:{String(restSecondsRemaining).padStart(2, '0')}
              </span>
            </div>
          </div>

          {/* Rest Progress Slider Bar */}
          <div className="w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden my-2.5">
            <div
              className="h-full bg-gradient-to-r from-[#1D4ED8] to-[#38BDF8] rounded-full transition-all duration-1000"
              style={{
                width: `${restTotalSeconds > 0 ? (restSecondsRemaining / restTotalSeconds) * 100 : 0}%`,
              }}
            />
          </div>

          {/* Quick Adjustment Controls */}
          <div className="flex items-center justify-between pt-1 gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleAdjustRest(-15)}
                className="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] font-data text-[10.5px] text-white/70 hover:text-white transition-all active:scale-95"
              >
                -15s
              </button>
              <button
                onClick={() => handleAdjustRest(30)}
                className="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] font-data text-[10.5px] text-white/70 hover:text-white transition-all active:scale-95"
              >
                +30s
              </button>
            </div>

            <button
              onClick={handleSkipRest}
              className="px-3 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-xs font-medium text-white/80 hover:text-white transition-all active:scale-95"
            >
              Skip rest
            </button>
          </div>
        </div>

        {/* 4. UP NEXT TEASER CARD */}
        <div className="p-3.5 rounded-2xl bg-[#0A0E1B] border border-white/[0.06] space-y-2">
          <div className="flex items-center justify-between text-[11px] font-data text-[var(--ink-3,#6B7A99)] uppercase tracking-wider">
            <span>Up Next (Exercise 3)</span>
            <span className="text-[#38BDF8] font-semibold">Studio 1</span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[rgba(59,130,246,0.15)] border border-[rgba(59,130,246,0.3)] flex items-center justify-center text-[#60A5FA]">
                <Dumbbell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-ui text-sm font-bold text-white">Incline dumbbell press</h4>
                <p className="font-data text-xs text-white/50">3 sets · 10 reps · 22.5 kg</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/30" />
          </div>
        </div>
      </main>

      {/* ─── STICKY BOTTOM ACTION DECK (FIXED & SAFE AREA COMPLIANT) ─── */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-[#06080F]/95 backdrop-blur-2xl border-t border-white/[0.08] px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom,0px))] shadow-[0_-12px_36px_rgba(0,0,0,0.85)]">
        <div className="max-w-md mx-auto flex items-center gap-3">
          {/* Finish Workout Primary Button */}
          <button
            onClick={handleFinishWorkout}
            className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#38BDF8] text-white font-bold text-sm shadow-[0_0_24px_rgba(37,99,235,0.45)] hover:shadow-[0_0_32px_rgba(56,189,248,0.6)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>Finish workout</span>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-[11px] font-data font-semibold">
              {completedSetsCount}/{sets.length} sets
            </span>
          </button>
        </div>
      </footer>

      {/* ─── MODAL: SWAP EXERCISE ─── */}
      {swapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-[#0D1322] border border-white/[0.12] p-5 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <div>
                <h3 className="text-base font-bold text-white">Swap Exercise</h3>
                <p className="text-xs text-white/50">Alternative chest & push movements</p>
              </div>
              <button
                onClick={() => setSwapModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-white/70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {[
                { name: 'Dumbbell Flat Bench Press', equip: 'Dumbbells', focus: 'Chest / Triceps' },
                { name: 'Hammer Strength Chest Press', equip: 'Machine', focus: 'Pectorals Isolation' },
                { name: 'Incline Barbell Bench Press', equip: 'Barbell', focus: 'Upper Chest' },
                { name: 'Weighted Chest Dips', equip: 'Parallel Bars', focus: 'Lower Chest / Triceps' },
              ].map((item) => (
                <button
                  key={item.name}
                  onClick={() => {
                    setCurrentExercise(item.name)
                    setSwapModalOpen(false)
                    toast.success(`Swapped to ${item.name}`, {
                      description: 'Training engine marked structural movement substitution',
                    })
                  }}
                  className="w-full p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] hover:border-[#38BDF8]/40 text-left transition-all flex items-center justify-between group"
                >
                  <div>
                    <h4 className="font-ui text-sm font-bold text-white group-hover:text-[#38BDF8]">
                      {item.name}
                    </h4>
                    <p className="font-data text-xs text-white/40">
                      {item.equip} · {item.focus}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: OLYMPIC BAR PLATE CALCULATOR ─── */}
      {plateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-[#0D1322] border border-white/[0.12] p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-[#38BDF8]" />
                <h3 className="text-base font-bold text-white">Plate Calculator</h3>
              </div>
              <button
                onClick={() => setPlateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-white/70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center space-y-1">
              <span className="font-data text-xs text-white/50 uppercase">Target Weight</span>
              <p className="text-3xl font-black font-data text-[#38BDF8]">{targetWeight} kg</p>
              <p className="font-data text-xs text-white/60">
                20 kg Olympic Bar + <b className="text-white">{weightPerSide} kg</b> per side
              </p>
            </div>

            <div className="space-y-2">
              <span className="font-data text-xs text-white/50 uppercase">Plates each side:</span>
              <div className="grid grid-cols-4 gap-2">
                {weightPerSide >= 20 && (
                  <div className="p-2 rounded-xl bg-[#1E3A8A]/40 border border-[#3B82F6]/30 text-center">
                    <span className="text-sm font-bold text-white">20 kg</span>
                    <p className="text-[10px] text-white/50">Blue Plate</p>
                  </div>
                )}
                {weightPerSide % 20 >= 10 && (
                  <div className="p-2 rounded-xl bg-[#047857]/40 border border-[#10B981]/30 text-center">
                    <span className="text-sm font-bold text-white">10 kg</span>
                    <p className="text-[10px] text-white/50">Green Plate</p>
                  </div>
                )}
                {weightPerSide % 10 >= 5 && (
                  <div className="p-2 rounded-xl bg-white/[0.06] border border-white/[0.1] text-center">
                    <span className="text-sm font-bold text-white">5 kg</span>
                    <p className="text-[10px] text-white/50">White Plate</p>
                  </div>
                )}
                {weightPerSide % 5 >= 2.5 && (
                  <div className="p-2 rounded-xl bg-white/[0.06] border border-white/[0.1] text-center">
                    <span className="text-sm font-bold text-white">2.5 kg</span>
                    <p className="text-[10px] text-white/50">Collars</p>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setPlateModalOpen(false)}
              className="w-full py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-bold transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
