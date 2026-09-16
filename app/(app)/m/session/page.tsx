'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
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
  ChevronLeft,
  Calculator,
  Play,
  Pause,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Info,
  Trash2,
  Volume2,
  Layers,
  Award,
  Zap,
} from 'lucide-react'
import { toast } from '@/components/app/ui/toast'
import { cn } from '@/lib/utils'

// Types
type SetType = 'NORMAL' | 'WARMUP' | 'DROP' | 'FAILURE'

interface WorkoutSet {
  id: string
  setNum: number
  type: SetType
  kg: string
  reps: string
  rpe?: string
  isDone: boolean
  lastKg: string
  lastReps: string
}

interface PlannedExercise {
  id: string
  name: string
  targetMuscle: string
  category: string
  equipment: string
  targetSets: number
  targetReps: string
  suggestedRestSec: number
  personalRecord: string
  notes: string
  sets: WorkoutSet[]
}

const INITIAL_EXERCISES: PlannedExercise[] = [
  {
    id: 'ex_1',
    name: 'Barbell Flat Bench Press',
    targetMuscle: 'Chest · Primary',
    category: 'Compound Strength',
    equipment: 'Olympic Barbell',
    targetSets: 4,
    targetReps: '8–10',
    suggestedRestSec: 90,
    personalRecord: '65 kg × 6',
    notes: 'Retract scapulae, slight lumbar arch, drive feet into the floor, bar touches lower sternum.',
    sets: [
      { id: 's1', setNum: 1, type: 'WARMUP', kg: '40', reps: '12', isDone: true, lastKg: '40', lastReps: '12' },
      { id: 's2', setNum: 2, type: 'NORMAL', kg: '60', reps: '10', isDone: true, lastKg: '57.5', lastReps: '10' },
      { id: 's3', setNum: 3, type: 'NORMAL', kg: '60', reps: '8', isDone: false, lastKg: '57.5', lastReps: '8' },
      { id: 's4', setNum: 4, type: 'NORMAL', kg: '60', reps: '8', isDone: false, lastKg: '57.5', lastReps: '7' },
    ],
  },
  {
    id: 'ex_2',
    name: 'Incline Dumbbell Press',
    targetMuscle: 'Upper Chest',
    category: 'Hypertrophy',
    equipment: 'Adjustable Bench & DBs',
    targetSets: 3,
    targetReps: '10–12',
    suggestedRestSec: 75,
    personalRecord: '24 kg × 10',
    notes: 'Set bench to 30°, control 3s eccentric descent, full stretch at the bottom.',
    sets: [
      { id: 's5', setNum: 1, type: 'NORMAL', kg: '22', reps: '12', isDone: false, lastKg: '20', lastReps: '12' },
      { id: 's6', setNum: 2, type: 'NORMAL', kg: '22', reps: '10', isDone: false, lastKg: '20', lastReps: '10' },
      { id: 's7', setNum: 3, type: 'NORMAL', kg: '24', reps: '8', isDone: false, lastKg: '22', lastReps: '8' },
    ],
  },
  {
    id: 'ex_3',
    name: 'Standing Overhead Press',
    targetMuscle: 'Anterior Deltoids',
    category: 'Compound Overhead',
    equipment: 'Olympic Barbell',
    targetSets: 3,
    targetReps: '8',
    suggestedRestSec: 90,
    personalRecord: '45 kg × 8',
    notes: 'Lock glutes and core tight, head through the window at lockout.',
    sets: [
      { id: 's8', setNum: 1, type: 'NORMAL', kg: '40', reps: '8', isDone: false, lastKg: '37.5', lastReps: '8' },
      { id: 's9', setNum: 2, type: 'NORMAL', kg: '40', reps: '8', isDone: false, lastKg: '40', lastReps: '7' },
      { id: 's10', setNum: 3, type: 'DROP', kg: '32.5', reps: '10', isDone: false, lastKg: '30', lastReps: '10' },
    ],
  },
  {
    id: 'ex_4',
    name: 'Cable Triceps Rope Pushdown',
    targetMuscle: 'Triceps Lateral Head',
    category: 'Isolation',
    equipment: 'Dual Cable Station',
    targetSets: 3,
    targetReps: '12–15',
    suggestedRestSec: 60,
    personalRecord: '27.5 kg × 15',
    notes: 'Pin elbows to sides, spread the rope apart at full lockout for peak contraction.',
    sets: [
      { id: 's11', setNum: 1, type: 'NORMAL', kg: '25', reps: '15', isDone: false, lastKg: '22.5', lastReps: '15' },
      { id: 's12', setNum: 2, type: 'NORMAL', kg: '25', reps: '14', isDone: false, lastKg: '25', lastReps: '12' },
      { id: 's13', setNum: 3, type: 'FAILURE', kg: '25', reps: '12', isDone: false, lastKg: '25', lastReps: '10' },
    ],
  },
]

const ALTERNATIVE_EXERCISES = [
  { name: 'Dumbbell Flat Bench Press', equip: 'Dumbbells', focus: 'Pectoralis Major & Triceps' },
  { name: 'Hammer Strength Chest Press', equip: 'Plate Loaded Machine', focus: 'Pectoral Hypertrophy' },
  { name: 'Incline Barbell Bench Press', equip: 'Olympic Barbell', focus: 'Clavicular Upper Head' },
  { name: 'Weighted Chest Dips', equip: 'Dip Bars / Belt', focus: 'Lower Pectorals & Front Delts' },
  { name: 'Seated Cable Chest Flyes', equip: 'Dual Cable Column', focus: 'Adduction & Squeeze' },
]

export default function ActiveWorkoutSessionPage() {
  const router = useRouter()

  // Exercise plan state
  const [exercises, setExercises] = useState<PlannedExercise[]>(INITIAL_EXERCISES)
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0)

  const activeExercise = exercises[currentExerciseIdx] || exercises[0]

  // Session elapsed stopwatch
  const [elapsedSeconds, setElapsedSeconds] = useState(1485) // started ~24 min ago
  const [isSessionPaused, setIsSessionPaused] = useState(false)

  // Rest timer
  const [restRemaining, setRestRemaining] = useState(48)
  const [restTotal, setRestTotal] = useState(90)
  const [isRestActive, setIsRestActive] = useState(true)

  // Modals
  const [plateModalOpen, setPlateModalOpen] = useState(false)
  const [swapModalOpen, setSwapModalOpen] = useState(false)
  const [notesModalOpen, setNotesModalOpen] = useState(false)
  const [finishModalOpen, setFinishModalOpen] = useState(false)

  // Plate calculator target state
  const [barWeight, setBarWeight] = useState<number>(20)
  const [customPlateWeight, setCustomPlateWeight] = useState<string>('60')

  // Haptic feedback trigger
  const haptic = (pattern: number | number[] = 15) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern)
      } catch {}
    }
  }

  // Stopwatch timer
  useEffect(() => {
    if (isSessionPaused) return
    const timer = setInterval(() => setElapsedSeconds((prev) => prev + 1), 1000)
    return () => clearInterval(timer)
  }, [isSessionPaused])

  // Rest countdown ticker
  useEffect(() => {
    let timer: any = null
    if (isRestActive && restRemaining > 0) {
      timer = setInterval(() => {
        setRestRemaining((prev) => {
          if (prev <= 1) {
            setIsRestActive(false)
            haptic([40, 80, 40])
            toast.success('Rest interval complete! Ready for your next set.', {
              description: `${activeExercise.name} · Next Set`,
            })
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [isRestActive, restRemaining, activeExercise.name])

  // Format MM:SS
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  // Calculations across workout
  const totalSetsAcrossWorkout = useMemo(() => {
    return exercises.reduce((sum, ex) => sum + ex.sets.length, 0)
  }, [exercises])

  const completedSetsAcrossWorkout = useMemo(() => {
    return exercises.reduce((sum, ex) => sum + ex.sets.filter((s) => s.isDone).length, 0)
  }, [exercises])

  const totalVolumeAcrossWorkout = useMemo(() => {
    return exercises.reduce((sum, ex) => {
      return (
        sum +
        ex.sets
          .filter((s) => s.isDone)
          .reduce((sSum, s) => sSum + (parseFloat(s.kg) || 0) * (parseInt(s.reps, 10) || 0), 0)
      )
    }, 0)
  }, [exercises])

  const workoutProgressPercent = Math.round(
    totalSetsAcrossWorkout > 0 ? (completedSetsAcrossWorkout / totalSetsAcrossWorkout) * 100 : 0
  )

  // Set mutation handlers
  const handleToggleSet = (setId: string) => {
    haptic(20)
    setExercises((prev) =>
      prev.map((ex, exIdx) => {
        if (exIdx !== currentExerciseIdx) return ex
        const updatedSets = ex.sets.map((s) => {
          if (s.id !== setId) return s
          const willBeDone = !s.isDone
          if (willBeDone) {
            const kgNum = parseFloat(s.kg) || 0
            const lastKgNum = parseFloat(s.lastKg) || 0
            if (kgNum > lastKgNum && lastKgNum > 0) {
              toast.success(`🎯 Set ${s.setNum} Completed! New PR Lifted`, {
                description: `${s.kg} kg × ${s.reps} reps (+${(kgNum - lastKgNum).toFixed(1)} kg progress)`,
              })
            } else {
              toast.success(`Set ${s.setNum} logged: ${s.kg} kg × ${s.reps} reps`)
            }
            // Auto start rest countdown
            setRestTotal(ex.suggestedRestSec || 90)
            setRestRemaining(ex.suggestedRestSec || 90)
            setIsRestActive(true)
          }
          return { ...s, isDone: willBeDone }
        })
        return { ...ex, sets: updatedSets }
      })
    )
  }

  const handleUpdateSetValue = (setId: string, field: 'kg' | 'reps', value: string) => {
    setExercises((prev) =>
      prev.map((ex, exIdx) => {
        if (exIdx !== currentExerciseIdx) return ex
        return {
          ...ex,
          sets: ex.sets.map((s) => (s.id === setId ? { ...s, [field]: value } : s)),
        }
      })
    )
  }

  const handleNudgeSet = (setId: string, field: 'kg' | 'reps', delta: number) => {
    haptic(10)
    setExercises((prev) =>
      prev.map((ex, exIdx) => {
        if (exIdx !== currentExerciseIdx) return ex
        return {
          ...ex,
          sets: ex.sets.map((s) => {
            if (s.id !== setId) return s
            if (field === 'kg') {
              const current = parseFloat(s.kg) || 0
              const nextVal = Math.max(0, current + delta)
              return { ...s, kg: String(nextVal % 1 === 0 ? nextVal : nextVal.toFixed(1)) }
            } else {
              const current = parseInt(s.reps, 10) || 0
              const nextVal = Math.max(1, current + delta)
              return { ...s, reps: String(nextVal) }
            }
          }),
        }
      })
    )
  }

  const handleCycleSetType = (setId: string) => {
    haptic(10)
    const types: SetType[] = ['NORMAL', 'WARMUP', 'DROP', 'FAILURE']
    setExercises((prev) =>
      prev.map((ex, exIdx) => {
        if (exIdx !== currentExerciseIdx) return ex
        return {
          ...ex,
          sets: ex.sets.map((s) => {
            if (s.id !== setId) return s
            const currentIdx = types.indexOf(s.type)
            const nextType = types[(currentIdx + 1) % types.length]
            return { ...s, type: nextType }
          }),
        }
      })
    )
  }

  const handleAddSet = () => {
    haptic(15)
    setExercises((prev) =>
      prev.map((ex, exIdx) => {
        if (exIdx !== currentExerciseIdx) return ex
        const nextNum = ex.sets.length + 1
        const prevSet = ex.sets[ex.sets.length - 1]
        const newSet: WorkoutSet = {
          id: `s_${Date.now()}_${nextNum}`,
          setNum: nextNum,
          type: 'NORMAL',
          kg: prevSet ? prevSet.kg : '60',
          reps: prevSet ? prevSet.reps : '8',
          isDone: false,
          lastKg: prevSet ? prevSet.kg : '57.5',
          lastReps: prevSet ? prevSet.reps : '8',
        }
        return { ...ex, sets: [...ex.sets, newSet] }
      })
    )
    toast.info(`Added Set ${activeExercise.sets.length + 1}`)
  }

  const handleDeleteSet = (setId: string) => {
    haptic(15)
    setExercises((prev) =>
      prev.map((ex, exIdx) => {
        if (exIdx !== currentExerciseIdx) return ex
        if (ex.sets.length <= 1) {
          toast.error('Cannot remove the only set in an exercise.')
          return ex
        }
        const filtered = ex.sets.filter((s) => s.id !== setId)
        const renumbered = filtered.map((s, idx) => ({ ...s, setNum: idx + 1 }))
        return { ...ex, sets: renumbered }
      })
    )
    toast.info('Set deleted')
  }

  // Plate Calculator computation
  const plateTargetNum = parseFloat(customPlateWeight) || 60
  const platePerSideWeight = Math.max(0, (plateTargetNum - barWeight) / 2)

  const calculatePlateStack = (weightNeeded: number) => {
    const availablePlates = [
      { weight: 25, color: 'bg-[#DC2626]', text: '25kg', ring: 'border-[#EF4444]' },
      { weight: 20, color: 'bg-[#2563EB]', text: '20kg', ring: 'border-[#3B82F6]' },
      { weight: 15, color: 'bg-[#D97706]', text: '15kg', ring: 'border-[#F59E0B]' },
      { weight: 10, color: 'bg-[#059669]', text: '10kg', ring: 'border-[#10B981]' },
      { weight: 5, color: 'bg-white/30', text: '5kg', ring: 'border-white/40' },
      { weight: 2.5, color: 'bg-[#4B5563]', text: '2.5kg', ring: 'border-[#6B7280]' },
      { weight: 1.25, color: 'bg-[#9CA3AF]/40', text: '1.25kg', ring: 'border-[#D1D5DB]' },
    ]

    let rem = weightNeeded
    const result: typeof availablePlates = []
    for (const p of availablePlates) {
      while (rem >= p.weight - 0.001) {
        result.push(p)
        rem -= p.weight
      }
    }
    return { plates: result, remainder: Math.round(rem * 100) / 100 }
  }

  const { plates: plateStack } = useMemo(
    () => calculatePlateStack(platePerSideWeight),
    [platePerSideWeight]
  )

  const openPlateCalculatorForSet = (weight: string) => {
    setCustomPlateWeight(weight)
    setPlateModalOpen(true)
  }

  // Finish Workout confirmation
  const handleFinishWorkoutConfirmed = () => {
    haptic([30, 60, 90])
    setFinishModalOpen(false)
    toast.success('Workout Logged & Synchronized! 🏆', {
      description: `Total Volume: ${totalVolumeAcrossWorkout.toLocaleString()} kg · ${completedSetsAcrossWorkout} Sets Completed`,
    })
    router.push('/m')
  }

  return (
    <div className="min-h-screen bg-[#07090E] text-[#F3F6FC] font-sans flex flex-col justify-between selection:bg-[#3B82F6]/30">
      {/* ─── 1. TOP STICKY APPLICATION BAR ─── */}
      <header className="sticky top-0 z-40 bg-[#07090E]/95 backdrop-blur-2xl border-b border-white/[0.07] px-3.5 pt-[max(0.75rem,env(safe-area-inset-top,0px))] pb-2.5 shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
        <div className="max-w-md mx-auto">
          {/* Top Line: Minimize Button, Session Info, Stopwatch Timer */}
          <div className="flex items-center justify-between gap-2">
            <Link
              href="/m"
              className="w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] active:scale-95 border border-white/[0.08] flex items-center justify-center text-white/75 hover:text-white transition-all shrink-0"
              aria-label="Minimize workout"
            >
              <X className="w-4 h-4" />
            </Link>

            <div className="flex-1 text-center min-w-0 px-2">
              <div className="flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                <h1 className="text-sm font-bold text-white truncate tracking-tight">
                  Push Strength & Hypertrophy
                </h1>
              </div>
              <p className="text-[10px] text-white/50 tracking-wider uppercase truncate">
                Studio 1 · Rohan K.
              </p>
            </div>

            {/* Stopwatch Elapsed Timer Badge */}
            <button
              onClick={() => {
                setIsSessionPaused(!isSessionPaused)
                toast.info(isSessionPaused ? 'Workout stopwatch resumed' : 'Workout stopwatch paused')
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#3B82F6]/10 border border-[#3B82F6]/30 active:scale-95 transition-all shrink-0"
              title={isSessionPaused ? 'Resume Timer' : 'Pause Timer'}
            >
              {isSessionPaused ? (
                <Play className="w-3 h-3 text-[#38BDF8] fill-[#38BDF8]" />
              ) : (
                <Clock className="w-3 h-3 text-[#38BDF8]" />
              )}
              <span className="text-xs font-semibold text-[#38BDF8] tabular-nums tracking-tight">
                {formatTime(elapsedSeconds)}
              </span>
            </button>
          </div>

          {/* Exercise Horizontal Stepper Tabs */}
          <div className="mt-2.5 pt-2 border-t border-white/[0.05] flex items-center justify-between gap-1">
            <button
              onClick={() => {
                haptic(10)
                setCurrentExerciseIdx((prev) => Math.max(0, prev - 1))
              }}
              disabled={currentExerciseIdx === 0}
              className="w-7 h-7 rounded-lg bg-white/[0.04] disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-white/70 active:scale-90"
              aria-label="Previous exercise"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Segmented Exercise Pills */}
            <div className="flex-1 flex items-center gap-1 px-1 overflow-x-auto no-scrollbar">
              {exercises.map((ex, idx) => {
                const exCompletedSets = ex.sets.filter((s) => s.isDone).length
                const isAllDone = exCompletedSets === ex.sets.length && ex.sets.length > 0
                const isCurrent = idx === currentExerciseIdx

                return (
                  <button
                    key={ex.id}
                    onClick={() => {
                      haptic(10)
                      setCurrentExerciseIdx(idx)
                    }}
                    className={cn(
                      'flex-1 min-w-[50px] py-1 px-1.5 rounded-lg text-center transition-all border text-[10px] font-semibold truncate',
                      isCurrent
                        ? 'bg-[#3B82F6] text-white border-[#60A5FA] shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                        : isAllDone
                        ? 'bg-[#10B981]/15 text-[#34D399] border-[#10B981]/30'
                        : 'bg-white/[0.03] text-white/50 border-white/[0.06] hover:text-white/80'
                    )}
                  >
                    <span className="tabular-nums">Ex {idx + 1}</span>
                    {isAllDone && <Check className="w-2.5 h-2.5 inline-block ml-0.5" />}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => {
                haptic(10)
                setCurrentExerciseIdx((prev) => Math.min(exercises.length - 1, prev + 1))
              }}
              disabled={currentExerciseIdx === exercises.length - 1}
              className="w-7 h-7 rounded-lg bg-white/[0.04] disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-white/70 active:scale-90"
              aria-label="Next exercise"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ─── 2. MAIN SCROLLABLE CONTENT ─── */}
      <main className="flex-1 w-full max-w-md mx-auto px-3.5 pt-3 pb-36 space-y-3.5">
        {/* EXERCISE HERO CARD */}
        <section className="relative p-4 rounded-2xl bg-gradient-to-b from-[#0F1523] to-[#0A0E18] border border-white/[0.09] shadow-[0_12px_32px_rgba(0,0,0,0.5)] overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#3B82F6]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Muscle Tags & Action Controls */}
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-[#3B82F6]/15 border border-[#3B82F6]/30 text-[10px] font-bold text-[#60A5FA] uppercase tracking-wider">
                  {activeExercise.targetMuscle}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-[10px] text-white/70">
                  {activeExercise.equipment}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight leading-snug">
                {activeExercise.name}
              </h2>
              <p className="text-xs text-white/60">
                Target: <span className="text-white font-medium">{activeExercise.targetSets} sets</span> ×{' '}
                <span className="text-white font-medium">{activeExercise.targetReps} reps</span> ·{' '}
                {activeExercise.suggestedRestSec}s rest
              </p>
            </div>

            {/* Quick Utility Buttons */}
            <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
              <button
                onClick={() => setNotesModalOpen(true)}
                title="Exercise Technique Cues"
                className="w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] active:scale-95 border border-white/[0.08] flex items-center justify-center text-white/80 transition-all"
              >
                <Info className="w-3.5 h-3.5 text-amber-400" />
              </button>
              <button
                onClick={() => openPlateCalculatorForSet(activeExercise.sets[0]?.kg || '60')}
                title="Barbell Plate Calculator"
                className="w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] active:scale-95 border border-white/[0.08] flex items-center justify-center text-white/80 transition-all"
              >
                <Calculator className="w-3.5 h-3.5 text-[#34D399]" />
              </button>
              <button
                onClick={() => setSwapModalOpen(true)}
                title="Swap Exercise Variation"
                className="w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] active:scale-95 border border-white/[0.08] flex items-center justify-center text-white/80 transition-all"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-[#60A5FA]" />
              </button>
            </div>
          </div>

          {/* Personal Record & Session Volume Banner */}
          <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-amber-400 font-medium">
              <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-[11px] truncate">Record: {activeExercise.personalRecord}</span>
            </div>
            <div className="text-[11px] text-white/60">
              Volume: <b className="text-white font-semibold tabular-nums">{totalVolumeAcrossWorkout.toLocaleString()} kg</b>
            </div>
          </div>
        </section>

        {/* ─── 3. THE SET LOGGER TABLE (PERFECTLY ALIGNED & USER-FRIENDLY) ─── */}
        <section className="rounded-2xl bg-[#0B0F1A]/90 border border-white/[0.08] p-3 shadow-xl space-y-2.5">
          {/* Table Header Columns */}
          <div className="grid grid-cols-[38px_1fr_94px_74px_44px] gap-2 items-center text-center text-[10px] font-bold text-white/45 uppercase tracking-wider px-1">
            <span className="text-left pl-1">SET</span>
            <span className="text-left pl-1.5">PREV</span>
            <span className="text-center">KG</span>
            <span className="text-center">REPS</span>
            <span className="text-center">DONE</span>
          </div>

          {/* Set Rows List */}
          <div className="space-y-2">
            {activeExercise.sets.map((set, idx) => {
              const typeBadge =
                set.type === 'WARMUP'
                  ? { label: 'W', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30' }
                  : set.type === 'DROP'
                  ? { label: 'D', bg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' }
                  : set.type === 'FAILURE'
                  ? { label: 'F', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/30' }
                  : { label: String(set.setNum), bg: 'bg-white/[0.05] text-white/90 border-white/[0.08]' }

              return (
                <div
                  key={set.id}
                  className={cn(
                    'grid grid-cols-[38px_1fr_94px_74px_44px] gap-2 items-center p-2 rounded-xl border transition-all duration-200',
                    set.isDone
                      ? 'bg-[#10B981]/[0.09] border-[#10B981]/35 shadow-[0_0_16px_rgba(16,185,129,0.08)]'
                      : 'bg-white/[0.025] border-white/[0.06] hover:border-white/[0.12]'
                  )}
                >
                  {/* 1. Set Badge (Tap to toggle Warmup/Normal/Drop/Failure) */}
                  <div className="flex justify-start">
                    <button
                      onClick={() => handleCycleSetType(set.id)}
                      title="Tap to cycle: Normal / Warmup / Dropset / Failure"
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border transition-all active:scale-95 shrink-0',
                        set.isDone
                          ? 'bg-[#10B981] text-black font-black border-[#10B981]'
                          : typeBadge.bg
                      )}
                    >
                      {set.isDone ? set.setNum : typeBadge.label}
                    </button>
                  </div>

                  {/* 2. Previous Performance Telemetry */}
                  <div className="min-w-0 pl-1 text-left">
                    <p className="text-xs font-medium text-white/75 truncate tabular-nums">
                      {set.lastKg}kg × {set.lastReps}
                    </p>
                    <span className="text-[9.5px] uppercase tracking-wider text-white/40 block">
                      {set.type === 'WARMUP' ? 'Warm-up' : set.isDone ? 'Completed' : 'Last Session'}
                    </span>
                  </div>

                  {/* 3. KG Weight Box with Inline Stepper */}
                  <div className="relative flex items-center justify-between rounded-xl bg-[#121726] border border-white/[0.12] p-0.5 focus-within:border-[#3B82F6] focus-within:ring-1 focus-within:ring-[#3B82F6]/30">
                    <button
                      onClick={() => handleNudgeSet(set.id, 'kg', -2.5)}
                      className="w-6 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] active:scale-90 flex items-center justify-center text-white/60 hover:text-white transition-all shrink-0"
                      aria-label="Decrease 2.5 kg"
                    >
                      <Minus className="w-3 h-3" />
                    </button>

                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.5"
                      value={set.kg}
                      onChange={(e) => handleUpdateSetValue(set.id, 'kg', e.target.value)}
                      onFocus={() => setCustomPlateWeight(set.kg)}
                      className="w-full h-8 text-center bg-transparent text-white font-bold text-xs outline-none tabular-nums px-0.5"
                    />

                    <button
                      onClick={() => handleNudgeSet(set.id, 'kg', 2.5)}
                      className="w-6 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] active:scale-90 flex items-center justify-center text-white/60 hover:text-white transition-all shrink-0"
                      aria-label="Increase 2.5 kg"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* 4. Reps Box with Inline Stepper */}
                  <div className="relative flex items-center justify-between rounded-xl bg-[#121726] border border-white/[0.12] p-0.5 focus-within:border-[#3B82F6] focus-within:ring-1 focus-within:ring-[#3B82F6]/30">
                    <button
                      onClick={() => handleNudgeSet(set.id, 'reps', -1)}
                      className="w-5 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] active:scale-90 flex items-center justify-center text-white/60 hover:text-white transition-all shrink-0"
                      aria-label="Decrease 1 rep"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>

                    <input
                      type="number"
                      inputMode="numeric"
                      step="1"
                      value={set.reps}
                      onChange={(e) => handleUpdateSetValue(set.id, 'reps', e.target.value)}
                      className="w-full h-8 text-center bg-transparent text-white font-bold text-xs outline-none tabular-nums px-0.5"
                    />

                    <button
                      onClick={() => handleNudgeSet(set.id, 'reps', 1)}
                      className="w-5 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] active:scale-90 flex items-center justify-center text-white/60 hover:text-white transition-all shrink-0"
                      aria-label="Increase 1 rep"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  {/* 5. Done Checkmark Button (Tactile 44px touch target) */}
                  <button
                    onClick={() => handleToggleSet(set.id)}
                    className={cn(
                      'w-11 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer active:scale-90 shrink-0',
                      set.isDone
                        ? 'bg-gradient-to-tr from-[#059669] to-[#10B981] text-black shadow-[0_0_18px_rgba(16,185,129,0.5)] border border-[#34D399]/40'
                        : 'bg-white/[0.04] border border-white/[0.12] hover:border-white/[0.25] text-white/30 hover:text-white/80'
                    )}
                    aria-label={`Mark set ${set.setNum} complete`}
                  >
                    <Check className={cn('w-5 h-5 stroke-[2.8]', set.isDone ? 'text-black' : '')} />
                  </button>
                </div>
              )
            })}
          </div>

          {/* Set Logger Actions Strip */}
          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={handleAddSet}
              className="flex-1 h-10 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-[0.98] border border-white/[0.09] hover:border-[#3B82F6]/40 flex items-center justify-center gap-2 text-xs font-semibold text-white/85 transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-[#60A5FA]" />
              <span>Add Set</span>
            </button>

            {/* Quick Set Multiplier Shortcuts */}
            <button
              onClick={() => {
                const last = activeExercise.sets[activeExercise.sets.length - 1]
                if (last) handleNudgeSet(last.id, 'kg', 5)
              }}
              className="h-10 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-95 border border-white/[0.09] text-xs font-semibold text-white/70 hover:text-white"
            >
              +5 kg
            </button>

            {activeExercise.sets.length > 1 && (
              <button
                onClick={() => {
                  const last = activeExercise.sets[activeExercise.sets.length - 1]
                  if (last) handleDeleteSet(last.id)
                }}
                className="h-10 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 border border-rose-500/25 text-xs text-rose-400 flex items-center justify-center"
                title="Remove last set"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </section>

        {/* ─── 4. REST TIMER CARD ─── */}
        <section
          className={cn(
            'p-3.5 rounded-2xl border transition-all duration-300 relative overflow-hidden',
            isRestActive && restRemaining > 0
              ? 'bg-gradient-to-r from-[#0C1628] via-[#0E203C] to-[#0A1628] border-[#3B82F6]/45 shadow-[0_8px_28px_rgba(59,130,246,0.18)]'
              : 'bg-[#0A0E18] border-white/[0.07]'
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center transition-all',
                  isRestActive ? 'bg-[#3B82F6]/20 text-[#60A5FA]' : 'bg-white/[0.05] text-white/40'
                )}
              >
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">
                  {isRestActive ? 'Rest Interval' : 'Rest Timer'}
                </h4>
                <p className="text-[10px] text-white/50">
                  {isRestActive ? 'Recovery between sets' : 'Standby'}
                </p>
              </div>
            </div>

            {/* Huge Tabular Countdown */}
            <div className="text-right">
              <span className="text-2xl font-bold text-[#60A5FA] tabular-nums tracking-wider">
                0:{String(restRemaining).padStart(2, '0')}
              </span>
            </div>
          </div>

          {/* Smooth Linear Progress Bar */}
          <div className="w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden my-2.5">
            <div
              className="h-full bg-gradient-to-r from-[#2563EB] to-[#38BDF8] rounded-full transition-all duration-1000"
              style={{
                width: `${restTotal > 0 ? (restRemaining / restTotal) * 100 : 0}%`,
              }}
            />
          </div>

          {/* Rest Controls */}
          <div className="flex items-center justify-between pt-0.5 gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  haptic(10)
                  setRestRemaining((prev) => Math.max(0, prev - 15))
                  setIsRestActive(true)
                }}
                className="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-[11px] font-semibold text-white/70 active:scale-95"
              >
                -15s
              </button>
              <button
                onClick={() => {
                  haptic(10)
                  setRestRemaining((prev) => prev + 30)
                  setIsRestActive(true)
                }}
                className="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-[11px] font-semibold text-white/70 active:scale-95"
              >
                +30s
              </button>
            </div>

            <button
              onClick={() => {
                haptic(10)
                setIsRestActive(false)
                setRestRemaining(0)
                toast.info('Rest skipped')
              }}
              className="px-3 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-xs font-semibold text-white/80 active:scale-95"
            >
              Skip rest
            </button>
          </div>
        </section>

        {/* ─── 5. UP NEXT TEASER CARD ─── */}
        {currentExerciseIdx < exercises.length - 1 && (
          <div className="p-3.5 rounded-2xl bg-[#090D18] border border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between text-[10px] font-bold text-white/45 uppercase tracking-wider">
              <span>Up Next (Exercise {currentExerciseIdx + 2})</span>
              <span className="text-[#60A5FA]">Studio 1</span>
            </div>

            <button
              onClick={() => {
                haptic(10)
                setCurrentExerciseIdx(currentExerciseIdx + 1)
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/[0.025] hover:bg-white/[0.06] border border-white/[0.06] text-left transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#3B82F6]/15 border border-[#3B82F6]/30 flex items-center justify-center text-[#60A5FA] shrink-0">
                  <Dumbbell className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate group-hover:text-[#60A5FA] transition-colors">
                    {exercises[currentExerciseIdx + 1].name}
                  </h4>
                  <p className="text-[11px] text-white/50 truncate">
                    {exercises[currentExerciseIdx + 1].targetSets} sets ·{' '}
                    {exercises[currentExerciseIdx + 1].targetReps} reps ·{' '}
                    {exercises[currentExerciseIdx + 1].equipment}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white transition-colors shrink-0" />
            </button>
          </div>
        )}
      </main>

      {/* ─── 6. STICKY BOTTOM ACTION DECK ─── */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-[#07090E]/95 backdrop-blur-2xl border-t border-white/[0.08] px-3.5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom,0px))] shadow-[0_-12px_36px_rgba(0,0,0,0.85)]">
        <div className="max-w-md mx-auto flex items-center gap-2.5">
          {/* Quick Exercise Switcher Button */}
          <button
            onClick={() => setSwapModalOpen(true)}
            className="w-12 h-12 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] active:scale-95 border border-white/[0.09] flex flex-col items-center justify-center text-white/70 hover:text-white transition-all shrink-0"
            title="Swap Exercise"
          >
            <ArrowRightLeft className="w-4 h-4 text-[#60A5FA]" />
            <span className="text-[9px] uppercase tracking-tighter mt-0.5">Swap</span>
          </button>

          {/* Primary Finish Workout Button */}
          <button
            onClick={() => setFinishModalOpen(true)}
            className="flex-1 h-12 rounded-xl bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#38BDF8] text-white font-bold text-xs shadow-[0_0_24px_rgba(37,99,235,0.4)] hover:shadow-[0_0_32px_rgba(56,189,248,0.55)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
            <span className="tracking-wide">Finish workout</span>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-semibold tabular-nums">
              {completedSetsAcrossWorkout}/{totalSetsAcrossWorkout} sets
            </span>
          </button>
        </div>
      </footer>

      {/* ─── MODAL 1: OLYMPIC BAR PLATE CALCULATOR ─── */}
      {plateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-[#0D1220] border border-white/[0.12] p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-[#34D399]" />
                <h3 className="text-sm font-bold text-white">Barbell Plate Calculator</h3>
              </div>
              <button
                onClick={() => setPlateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-white/70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Weight Display & Bar Selector */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.07] text-center space-y-2">
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
                Target Load
              </span>
              <p className="text-3xl font-bold text-[#60A5FA] tabular-nums">
                {plateTargetNum} kg
              </p>
              <div className="flex items-center justify-center gap-2 pt-1 text-xs">
                <span className="text-white/60">Bar:</span>
                {[20, 15, 10].map((w) => (
                  <button
                    key={w}
                    onClick={() => setBarWeight(w)}
                    className={cn(
                      'px-2 py-0.5 rounded-lg border text-xs font-semibold transition-all',
                      barWeight === w
                        ? 'bg-[#3B82F6] text-white border-[#60A5FA]'
                        : 'bg-white/[0.05] text-white/60 border-white/[0.08]'
                    )}
                  >
                    {w}kg
                  </button>
                ))}
              </div>
              <p className="text-xs text-white/70 pt-1">
                Load <b className="text-white font-bold">{platePerSideWeight} kg</b> on each side
              </p>
            </div>

            {/* Visual Barbell Graphic */}
            <div className="py-3 px-2 rounded-2xl bg-[#080B14] border border-white/[0.06] flex items-center justify-center overflow-x-auto">
              <div className="flex items-center gap-1">
                {/* Collar */}
                <div className="w-3 h-14 bg-white/30 rounded-l border-r-2 border-white/50 shrink-0" />
                {/* Plates loaded inside-out */}
                {plateStack.map((p, i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-16 px-1.5 rounded-md flex flex-col items-center justify-center text-[10px] font-bold text-white border shadow-md shrink-0',
                      p.color,
                      p.ring
                    )}
                    style={{ minWidth: '32px' }}
                  >
                    <span>{p.text}</span>
                  </div>
                ))}
                {plateStack.length === 0 && (
                  <span className="text-xs text-white/40 italic px-4">Bar only (no plates needed)</span>
                )}
                {/* Bar tip */}
                <div className="w-10 h-4 bg-white/20 rounded-r shrink-0" />
              </div>
            </div>

            {/* Quick Weight Adjuster in Modal */}
            <div className="grid grid-cols-4 gap-2 pt-1">
              {[50, 60, 70, 80, 90, 100, 110, 120].map((quick) => (
                <button
                  key={quick}
                  onClick={() => setCustomPlateWeight(String(quick))}
                  className={cn(
                    'py-2 rounded-xl text-xs font-bold border transition-all',
                    plateTargetNum === quick
                      ? 'bg-[#3B82F6] text-white border-[#60A5FA]'
                      : 'bg-white/[0.03] text-white/70 border-white/[0.06] hover:text-white'
                  )}
                >
                  {quick} kg
                </button>
              ))}
            </div>

            <button
              onClick={() => setPlateModalOpen(false)}
              className="w-full py-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-white text-xs font-bold transition-all"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: SWAP EXERCISE MODAL ─── */}
      {swapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-[#0D1220] border border-white/[0.12] p-5 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <div>
                <h3 className="text-sm font-bold text-white">Substitute Movement</h3>
                <p className="text-xs text-white/50">Bio-mechanically equivalent push variations</p>
              </div>
              <button
                onClick={() => setSwapModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-white/70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {ALTERNATIVE_EXERCISES.map((item) => (
                <button
                  key={item.name}
                  onClick={() => {
                    setExercises((prev) =>
                      prev.map((ex, idx) =>
                        idx === currentExerciseIdx ? { ...ex, name: item.name, equipment: item.equip } : ex
                      )
                    )
                    setSwapModalOpen(false)
                    toast.success(`Swapped to ${item.name}`, {
                      description: 'Training progression updated to substituted movement.',
                    })
                  }}
                  className="w-full p-3 rounded-xl bg-white/[0.025] hover:bg-white/[0.08] border border-white/[0.06] hover:border-[#3B82F6]/40 text-left transition-all flex items-center justify-between group"
                >
                  <div className="min-w-0 pr-2">
                    <h4 className="text-xs font-bold text-white group-hover:text-[#60A5FA] truncate">
                      {item.name}
                    </h4>
                    <p className="text-[11px] text-white/45 truncate mt-0.5">
                      {item.equip} · {item.focus}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: EXERCISE TECHNIQUE NOTES ─── */}
      {notesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-[#0D1220] border border-white/[0.12] p-5 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Technique & Form Cues</h3>
              </div>
              <button
                onClick={() => setNotesModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-white/70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2">
              <h4 className="text-xs font-bold text-white">{activeExercise.name}</h4>
              <p className="text-xs text-white/80 leading-relaxed">{activeExercise.notes}</p>
            </div>

            <div className="space-y-2 text-xs">
              <h5 className="text-[10px] font-bold text-white/45 uppercase tracking-wider">Coach Checklist</h5>
              <div className="flex items-center gap-2 text-white/70">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                <span>Keep shoulder blades pinched throughout movement</span>
              </div>
              <div className="flex items-center gap-2 text-white/70">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                <span>Maintain 45° elbow angle relative to torso</span>
              </div>
              <div className="flex items-center gap-2 text-white/70">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                <span>Control 2-second descent, explosive 1-second press</span>
              </div>
            </div>

            <button
              onClick={() => setNotesModalOpen(false)}
              className="w-full py-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-white text-xs font-bold transition-all"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: FINISH WORKOUT CONFIRMATION / SUMMARY ─── */}
      {finishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-[#0D1220] border border-white/[0.12] p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Complete Workout</h3>
              </div>
              <button
                onClick={() => setFinishModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-white/70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Session Stats Grid */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[10px] text-white/50 uppercase block">Duration</span>
                <span className="text-sm font-bold text-white tabular-nums">
                  {formatTime(elapsedSeconds)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[10px] text-white/50 uppercase block">Sets Done</span>
                <span className="text-sm font-bold text-[#34D399] tabular-nums">
                  {completedSetsAcrossWorkout}/{totalSetsAcrossWorkout}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[10px] text-white/50 uppercase block">Volume</span>
                <span className="text-sm font-bold text-[#60A5FA] tabular-nums">
                  {totalVolumeAcrossWorkout.toLocaleString()} kg
                </span>
              </div>
            </div>

            {completedSetsAcrossWorkout < totalSetsAcrossWorkout && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  You have {totalSetsAcrossWorkout - completedSetsAcrossWorkout} unlogged sets. Unlogged
                  sets will be omitted from your workout log.
                </span>
              </div>
            )}

            <div className="space-y-2 pt-1">
              <button
                onClick={handleFinishWorkoutConfirmed}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#38BDF8] text-white font-bold text-xs shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Save Workout & Return to Portal</span>
              </button>
              <button
                onClick={() => setFinishModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/70 text-xs font-semibold"
              >
                Resume Workout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
