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
  const [addModalOpen, setAddModalOpen] = useState(false)

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
      source: 'PROGRAMMED',
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
      source: 'PROGRAMMED',
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
      source: 'PROGRAMMED',
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
    <div className="max-w-md mx-auto py-2 sm:py-4 px-1 select-none">
      {/* ─── Phone Shell Container ─── */}
      <div className="relative bg-[#08090C] border border-[rgba(255,255,255,0.13)] rounded-[32px] sm:rounded-[38px] p-4 sm:p-5 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9)] overflow-hidden space-y-4">
        <div className="absolute -left-[20%] -bottom-[30%] w-[140%] h-[60%] bg-[radial-gradient(ellipse_at_50%_100%,rgba(255,92,122,0.13),rgba(120,90,220,0.07)_45%,transparent_70%)] pointer-events-none" />

        {/* ─── Nav Header ─── */}
        <div className="flex items-center justify-between pt-1 pb-1">
          <Link href="/dashboard" className="text-white hover:text-[#FF5C7A] transition-colors p-1">
            <X className="w-5 h-5" />
          </Link>
          <span className="font-bold text-sm text-white">Push · W3 D1</span>
          <span className="font-data text-sm font-semibold text-[#FF5C7A]">
            {formatTime(elapsedSeconds)}
          </span>
        </div>

        {/* ─── Top Progress Line ─── */}
        <div>
          <div className="member-bar" style={{ marginTop: 0 }}>
            <i style={{ width: `${Math.round((currentExNum / totalExCount) * 100)}%` }} />
          </div>
          <div className="member-bar-meta" style={{ marginBottom: 12 }}>
            <span>EXERCISE {currentExNum} OF {totalExCount}</span>
            <span>PRESCRIBED BY ROHAN</span>
          </div>
        </div>

        {/* ─── Current Exercise Card (§3) ─── */}
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-card)] p-4 sm:p-5 space-y-3">
          <div className="flex items-baseline justify-between">
            <h3 className="text-lg sm:text-xl font-bold text-white font-display">
              {currentExercise.exercise?.name || 'Barbell bench press'}
            </h3>
          </div>
          <p className="text-xs text-[var(--ink-2)]">
            4 sets · 8 reps · 60 kg · 90 s rest
          </p>

          {/* Set Labels Header */}
          <div className="member-set-labels" style={{ marginTop: 14 }}>
            <span>SET</span>
            <span>KG</span>
            <span>REPS</span>
            <span />
          </div>

          {/* Sets List (1 to 4) */}
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

          {/* Rest Countdown Bar */}
          <div className="member-rest">
            <span className="text-xs text-[var(--ink-3)]">Rest</span>
            <b className="font-data text-base text-[#FF5C7A]">
              0:{String(restSecondsRemaining).padStart(2, '0')}
            </b>
            <button
              onClick={() => setRestTimerActive(false)}
              className="text-xs text-[var(--ink-3)] hover:text-white transition-colors"
            >
              Skip
            </button>
          </div>
        </div>

        {/* ─── Exercise Action Buttons (Swap | Add set) ─── */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenSwap}
            className="flex-1 py-3 rounded-full bg-[var(--surface)] border border-[var(--line)] text-xs text-[var(--ink-2)] hover:text-white hover:border-[var(--line-strong)] transition-all font-medium"
          >
            Swap exercise
          </button>
          <button
            onClick={() => toast.success('Set 5 added to workout')}
            className="flex-1 py-3 rounded-full bg-[var(--surface)] border border-[var(--line)] text-xs text-[var(--ink-2)] hover:text-white hover:border-[var(--line-strong)] transition-all font-medium"
          >
            Add set
          </button>
        </div>

        {/* ─── Up Next Section ─── */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-white mb-2.5">
            <h3>Up next</h3>
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
          </div>
        </div>
      </div>

      {/* Exercise Swap Modal */}
      {swapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#08090C] border border-[var(--line-strong)] rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
              <h4 className="text-sm font-bold text-white">Swap Exercise</h4>
              <button onClick={() => setSwapModalOpen(false)} className="text-[var(--ink-3)] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {['Dumbbell Flat Bench Press', 'Hammer Strength Chest Press', 'Push-Ups (Weighted)'].map((alt) => (
                <div
                  key={alt}
                  onClick={() => {
                    toast.success(`Swapped to ${alt}`)
                    setSwapModalOpen(false)
                  }}
                  className="p-3 rounded-2xl bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--line)] cursor-pointer flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-white">{alt}</span>
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
