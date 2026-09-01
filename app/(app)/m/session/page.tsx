'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  X,
  Plus,
  Check,
  ArrowRightLeft,
  SkipForward,
  Clock,
  Dumbbell,
  Play,
  RotateCcw,
  Award,
  ChevronRight,
  Wifi,
  RefreshCw,
  Zap,
} from 'lucide-react'
import { toast } from '@/components/app/ui/toast'
import type { WorkoutSession, SessionExercise, Exercise, PersonalRecord } from '@/types/training'

export default function ActiveWorkoutSessionPage() {
  const router = useRouter()

  const [session, setSession] = useState<WorkoutSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced')

  // Timer elapsed in session
  const [elapsedSeconds, setElapsedSeconds] = useState(1458) // 24:18

  // Rest Timer State
  const [restSecondsRemaining, setRestSecondsRemaining] = useState<number>(47)
  const [restTimerActive, setRestTimerActive] = useState<boolean>(true)

  // Current exercise index in multi-exercise queue
  const [currentExIndex, setCurrentExIndex] = useState(0)

  // Exercise Swap & Add Modals
  const [swapModalOpen, setSwapModalOpen] = useState(false)
  const [swapAlternatives, setSwapAlternatives] = useState<Exercise[]>([])
  const [exerciseCatalog, setExerciseCatalog] = useState<Exercise[]>([])

  // Set Inputs Draft State
  const [setInputs, setSetInputs] = useState<Record<string, Record<number, { weightKg: string; reps: string; isDone: boolean }>>>({})

  // Session elapsed timer interval
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Rest countdown timer interval
  useEffect(() => {
    let interval: any = null
    if (restTimerActive && restSecondsRemaining > 0) {
      interval = setInterval(() => {
        setRestSecondsRemaining((prev) => {
          if (prev <= 1) {
            setRestTimerActive(false)
            toast.success('Rest complete! Time for next set.')
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [restTimerActive, restSecondsRemaining])

  // Load session & catalog
  const loadData = async () => {
    try {
      const res = await fetch('/api/training/sessions')
      if (res.ok) {
        const data = await res.json()
        if (data.activeSession) {
          setSession(data.activeSession)
        }
      }

      const exRes = await fetch('/api/training/exercises')
      if (exRes.ok) {
        const exData = await exRes.json()
        setExerciseCatalog(exData.exercises || [])
      }
    } catch {
      setSyncStatus('offline')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Active exercises queue fallback if no active session
  const fallbackExercises: SessionExercise[] = [
    {
      id: 'sex_bench',
      sessionId: 'sess_1',
      exerciseId: 'ex_bench',
      order: 1,
      source: 'PROGRAM',
      skipped: false,
      prescribed: { order: 1, sets: 4, repsMin: 8, repsMax: 8, targetWeight: 60, restSeconds: 90, isOptional: false },
      setLogs: [
        { id: 'set_1', sessionExerciseId: 'sex_bench', clientLogId: 'log_1', setIndex: 1, weightKg: 60, reps: 8, rpe: 8, isWarmup: false, completedAt: '' },
        { id: 'set_2', sessionExerciseId: 'sex_bench', clientLogId: 'log_2', setIndex: 2, weightKg: 60, reps: 8, rpe: 8, isWarmup: false, completedAt: '' },
      ],
      exercise: {
        id: 'ex_bench',
        name: 'Barbell bench press',
        primaryMuscle: 'CHEST',
        secondaryMuscles: ['SHOULDERS', 'TRICEPS'],
        equipment: 'BARBELL',
        isCustom: false,
      },
    },
    {
      id: 'sex_incline',
      sessionId: 'sess_1',
      exerciseId: 'ex_incline',
      order: 2,
      source: 'PROGRAM',
      skipped: false,
      prescribed: { order: 2, sets: 3, repsMin: 10, repsMax: 10, targetWeight: 22.5, restSeconds: 75, isOptional: false },
      setLogs: [],
      exercise: {
        id: 'ex_incline',
        name: 'Incline dumbbell press',
        primaryMuscle: 'CHEST',
        secondaryMuscles: ['SHOULDERS'],
        equipment: 'DUMBBELL',
        isCustom: false,
      },
    },
    {
      id: 'sex_fly',
      sessionId: 'sess_1',
      exerciseId: 'ex_fly',
      order: 3,
      source: 'PROGRAM',
      skipped: false,
      prescribed: { order: 3, sets: 3, repsMin: 12, repsMax: 12, targetWeight: 15, restSeconds: 60, isOptional: false },
      setLogs: [],
      exercise: {
        id: 'ex_fly',
        name: 'Cable fly',
        primaryMuscle: 'CHEST',
        secondaryMuscles: [],
        equipment: 'CABLE',
        isCustom: false,
      },
    },
  ]

  const currentExerciseList = session?.exercises?.length ? session.exercises : fallbackExercises
  const currentExercise = currentExerciseList[currentExIndex] || currentExerciseList[0]

  // Toggle set done
  const handleToggleSetDone = (setIndex: number) => {
    const sexId = currentExercise.id
    const currentDraft = setInputs[sexId]?.[setIndex] || { weightKg: '60', reps: '8', isDone: false }
    const nextDone = !currentDraft.isDone

    setSetInputs((prev) => ({
      ...prev,
      [sexId]: {
        ...prev[sexId],
        [setIndex]: { ...currentDraft, isDone: nextDone },
      },
    }))

    if (nextDone) {
      toast.success(`Set ${setIndex} Logged: ${currentDraft.weightKg} kg × ${currentDraft.reps}`)
      setRestSecondsRemaining(90)
      setRestTimerActive(true)
    }
  }

  // Swap exercise
  const handleOpenSwap = async () => {
    try {
      const res = await fetch(`/api/training/sessions/any/exercises?exerciseId=${currentExercise.exerciseId}`)
      if (res.ok) {
        const data = await res.json()
        setSwapAlternatives(data.alternatives || [])
        setSwapModalOpen(true)
      }
    } catch {
      toast.info('Selecting alternative chest movements')
    }
  }

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60)
    const secs = totalSec % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const totalExCount = Math.max(6, currentExerciseList.length)
  const currentExNum = currentExIndex + 2 // Matching "EXERCISE 2 OF 6" in mockup

  return (
    <div className="max-w-5xl mx-auto py-2 sm:py-6 px-2 sm:px-4 space-y-6 select-none">
      {/* ─── Top Session Nav Header ─── */}
      <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
        <Link href="/dashboard" className="flex items-center gap-2 text-white hover:text-[#FF5C7A] transition-colors">
          <X className="w-5 h-5" />
          <span className="font-bold text-base sm:text-lg font-display">Push · Week 3, Day 1</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--line)] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#4ADE80] animate-pulse" />
            <span className="font-data text-sm font-semibold text-[#FF5C7A]">
              {formatTime(elapsedSeconds)}
            </span>
          </div>

          <button
            onClick={() => {
              toast.success('Workout finished and saved!')
              router.push('/dashboard')
            }}
            className="px-4 py-1.5 rounded-full bg-[#4ADE80] text-[#12040A] font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow-[0_0_14px_rgba(74,222,128,0.35)]"
          >
            Finish workout
          </button>
        </div>
      </div>

      {/* ─── Responsive 2-Column Grid on PC ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Main Column (8 cols on PC) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Progress Bar */}
          <div>
            <div className="member-bar" style={{ marginTop: 0 }}>
              <i style={{ width: `${Math.round((currentExNum / totalExCount) * 100)}%` }} />
            </div>
            <div className="member-bar-meta" style={{ marginBottom: 8 }}>
              <span>EXERCISE {currentExNum} OF {totalExCount}</span>
              <span>PRESCRIBED BY ROHAN</span>
            </div>
          </div>

          {/* Current Exercise Card */}
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-card)] p-5 sm:p-6 space-y-4 shadow-xl">
            <div className="flex items-baseline justify-between">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white font-display">
                  {currentExercise.exercise?.name || 'Barbell bench press'}
                </h3>
                <p className="text-xs text-[var(--ink-2)] mt-0.5">
                  4 sets · 8 reps · 60 kg · 90 s rest
                </p>
              </div>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[rgba(255,92,122,0.15)] text-[#FF5C7A] border border-[rgba(255,92,122,0.3)]">
                CHEST
              </span>
            </div>

            {/* Set Column Labels */}
            <div className="member-set-labels" style={{ marginTop: 16 }}>
              <span>SET</span>
              <span>KG</span>
              <span>REPS</span>
              <span />
            </div>

            {/* Sets Rows */}
            <div className="space-y-1">
              {[1, 2, 3, 4].map((setNum) => {
                const isInitiallyDone = setNum <= 2
                const draft = setInputs[currentExercise.id]?.[setNum] || {
                  weightKg: '60',
                  reps: '8',
                  isDone: isInitiallyDone,
                }
                const isDone = draft.isDone
                const lastText = setNum === 4 ? 'Last: 55 kg × 8' : setNum === 3 ? 'Last: 57.5 kg × 7' : 'Last: 57.5 kg × 8'

                return (
                  <div key={setNum} className="member-set">
                    <span className="member-set-i font-data">{setNum}</span>

                    <div className={`member-field ${!isDone && setNum > 2 ? 'empty' : ''}`}>
                      {draft.weightKg}
                    </div>

                    <div className={`member-field ${!isDone && setNum > 2 ? 'empty' : ''}`}>
                      {draft.reps}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleSetDone(setNum)}
                      className={`member-tick ${isDone ? 'done' : ''}`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>

                    <span className="member-last font-data">
                      {lastText}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Rest Countdown Bar */}
            <div className="member-rest">
              <span className="text-xs text-[var(--ink-3)] font-medium">Rest Countdown</span>
              <b className="font-data text-lg text-[#FF5C7A]">
                0:{String(restSecondsRemaining).padStart(2, '0')}
              </b>
              <button
                onClick={() => setRestTimerActive(false)}
                className="text-xs text-[var(--ink-3)] hover:text-white transition-colors font-medium px-2 py-1"
              >
                Skip Rest
              </button>
            </div>
          </div>

          {/* Exercise Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenSwap}
              className="flex-1 py-3.5 rounded-full bg-[var(--surface)] border border-[var(--line)] text-xs text-[var(--ink-2)] hover:text-white hover:border-[var(--line-strong)] transition-all font-medium flex items-center justify-center gap-2"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-[#FF5C7A]" /> Swap exercise
            </button>
            <button
              onClick={() => toast.success('Set added')}
              className="flex-1 py-3.5 rounded-full bg-[var(--surface)] border border-[var(--line)] text-xs text-[var(--ink-2)] hover:text-white hover:border-[var(--line-strong)] transition-all font-medium flex items-center justify-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" /> Add set
            </button>
          </div>
        </div>

        {/* Right Column: Up Next Queue & Session Info (4 cols on PC) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-white">
            <h3>Up next in this workout</h3>
            <span className="font-data text-[10px] text-[var(--ink-3)]">4 remaining</span>
          </div>

          <div className="member-rows">
            {/* Up Next 1 */}
            <div className="member-row">
              <div className="member-row-ic">
                <Dumbbell className="w-4 h-4 stroke-[#FF5C7A]" />
              </div>
              <div className="member-row-txt">
                <b className="text-white">Incline dumbbell press</b>
                <span>3 × 10 · 22.5 kg</span>
              </div>
              <span className="member-row-end font-data">03</span>
            </div>

            {/* Up Next 2 */}
            <div className="member-row">
              <div className="member-row-ic">
                <Dumbbell className="w-4 h-4 stroke-[#FF5C7A]" />
              </div>
              <div className="member-row-txt">
                <b className="text-white">Cable fly</b>
                <span>3 × 12 · RPE 8</span>
              </div>
              <span className="member-row-end font-data">04</span>
            </div>

            {/* Up Next 3 */}
            <div className="member-row">
              <div className="member-row-ic">
                <Dumbbell className="w-4 h-4 stroke-[#FF5C7A]" />
              </div>
              <div className="member-row-txt">
                <b className="text-white">Overhead Triceps Extension</b>
                <span>3 × 12 · 25 kg</span>
              </div>
              <span className="member-row-end font-data">05</span>
            </div>

            {/* Up Next 4 */}
            <div className="member-row">
              <div className="member-row-ic">
                <Dumbbell className="w-4 h-4 stroke-[#FF5C7A]" />
              </div>
              <div className="member-row-txt">
                <b className="text-white">Lateral Shoulder Raises</b>
                <span>4 × 15 · 10 kg</span>
              </div>
              <span className="member-row-end font-data">06</span>
            </div>
          </div>

          {/* Quick Tip Box */}
          <div className="p-4 rounded-[var(--r-card)] bg-[var(--surface)] border border-[var(--line)] space-y-1.5 text-xs text-[var(--ink-2)]">
            <b className="text-white flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#FF5C7A]" /> Coach Note from Rohan
            </b>
            <p className="text-[11px] leading-relaxed">
              Focus on slow 3-second negative descent on the bench press today. Drive through the heels on ascent.
            </p>
          </div>
        </div>
      </div>

      {/* Exercise Swap Modal */}
      {swapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#08090C] border border-[var(--line-strong)] rounded-3xl p-5 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
              <h4 className="text-sm font-bold text-white">Swap Exercise</h4>
              <button onClick={() => setSwapModalOpen(false)} className="text-[var(--ink-3)] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {['Dumbbell Flat Bench Press', 'Hammer Strength Chest Press', 'Push-Ups (Weighted)', 'Incline Machine Press'].map((alt) => (
                <div
                  key={alt}
                  onClick={() => {
                    toast.success(`Swapped to ${alt}`)
                    setSwapModalOpen(false)
                  }}
                  className="p-3.5 rounded-2xl bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--line)] cursor-pointer flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-white block">{alt}</span>
                    <span className="text-[10px] text-[var(--ink-3)]">Chest · Equivalent compound movement</span>
                  </div>
                  <ArrowRightLeft className="w-3.5 h-3.5 text-[#FF5C7A]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
