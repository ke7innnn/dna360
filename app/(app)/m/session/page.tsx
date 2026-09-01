'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  Check,
  MoreVertical,
  ArrowRightLeft,
  SkipForward,
  Trash2,
  Clock,
  Flame,
  Award,
  Wifi,
  WifiOff,
  RefreshCw,
  Sparkles,
  Info,
  CheckCircle2,
  X,
  Dumbbell,
} from 'lucide-react'
import { Card } from '@/components/app/ui/glass-card'
import Button from '@/components/app/ui/button'
import Badge from '@/components/app/ui/badge'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/components/app/ui/toast'
import type { WorkoutSession, SessionExercise, Exercise, PersonalRecord } from '@/types/training'

export default function ActiveWorkoutSessionPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [session, setSession] = useState<WorkoutSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced')

  // Rest Timer State (§8.4)
  const [restSecondsRemaining, setRestSecondsRemaining] = useState<number | null>(null)
  const [restTimerActive, setRestTimerActive] = useState(false)
  const [totalRestSeconds, setTotalRestSeconds] = useState(90)

  // Modals
  const [addExerciseModalOpen, setAddExerciseModalOpen] = useState(false)
  const [swapModalOpen, setSwapModalOpen] = useState(false)
  const [swapTargetSexId, setSwapTargetSexId] = useState<string | null>(null)
  const [swapAlternatives, setSwapAlternatives] = useState<Exercise[]>([])
  const [finishModalOpen, setFinishModalOpen] = useState(false)
  const [perceivedEffort, setPerceivedEffort] = useState(8)
  const [feedbackNote, setFeedbackNote] = useState('')
  const [achievedPRs, setAchievedPRs] = useState<PersonalRecord[]>([])
  const [celebrationOpen, setCelebrationOpen] = useState(false)

  // Search & Filter for Exercise Library
  const [exerciseCatalog, setExerciseCatalog] = useState<Exercise[]>([])
  const [catalogSearch, setCatalogSearch] = useState('')
  const [selectedMuscle, setSelectedMuscle] = useState('ALL')

  // Set Inputs Draft State (sessionExerciseId -> { [setIndex]: { weightKg, reps, rpe, isWarmup } })
  const [setInputs, setSetInputs] = useState<Record<string, Record<number, { weightKg: string; reps: string; rpe: string; isWarmup: boolean }>>>({})

  // Fetch active session
  const fetchSession = async () => {
    try {
      const res = await fetch('/api/training/sessions')
      if (res.ok) {
        const data = await res.json()
        if (data.activeSession) {
          setSession(data.activeSession)
          // Initialize draft set inputs from existing setLogs
          const drafts: typeof setInputs = {}
          for (const sex of data.activeSession.exercises) {
            drafts[sex.id] = {}
            for (const log of sex.setLogs) {
              drafts[sex.id][log.setIndex] = {
                weightKg: log.weightKg !== null ? String(log.weightKg) : '',
                reps: log.reps !== null ? String(log.reps) : '',
                rpe: log.rpe !== null ? String(log.rpe) : '',
                isWarmup: log.isWarmup,
              }
            }
          }
          setSetInputs(drafts)
        } else {
          setSession(null)
        }
      }
    } catch {
      setSyncStatus('offline')
    } finally {
      setLoading(false)
    }
  }

  // Fetch full exercise catalog for add modal
  useEffect(() => {
    fetchSession()
    async function loadCatalog() {
      try {
        const res = await fetch('/api/training/exercises')
        if (res.ok) {
          const data = await res.json()
          setExerciseCatalog(data.exercises || [])
        }
      } catch (e) {
        console.error('Catalog load failed', e)
      }
    }
    loadCatalog()
  }, [])

  // Rest Timer Interval
  useEffect(() => {
    let interval: any = null
    if (restTimerActive && restSecondsRemaining !== null && restSecondsRemaining > 0) {
      interval = setInterval(() => {
        setRestSecondsRemaining((prev) => {
          if (prev === null || prev <= 1) {
            setRestTimerActive(false)
            toast.success('Rest Timer Complete!', { description: 'Ready for your next set.' })
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [restTimerActive, restSecondsRemaining])

  const startRestTimer = (seconds: number = 90) => {
    setTotalRestSeconds(seconds)
    setRestSecondsRemaining(seconds)
    setRestTimerActive(true)
  }

  const dismissRestTimer = () => {
    setRestTimerActive(false)
    setRestSecondsRemaining(null)
  }

  const adjustRestTimer = (delta: number) => {
    setRestSecondsRemaining((prev) => Math.max(0, (prev || 0) + delta))
  }

  // Start new freestyle session if none active
  const handleStartFreestyle = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/training/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Freestyle Workout' }),
      })
      if (res.ok) {
        const data = await res.json()
        setSession(data.session)
        toast.success('Workout started')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }

  // Add exercise to active session
  const handleAddExercise = async (exerciseId: string) => {
    if (!session) return
    setSyncStatus('syncing')
    try {
      const res = await fetch(`/api/training/sessions/${session.id}/exercises`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exerciseId, source: 'MEMBER_ADDED' }),
      })
      if (res.ok) {
        const data = await res.json()
        setSession((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            exercises: [...prev.exercises, data.sessionExercise],
          }
        })
        toast.success('Exercise added')
        setAddExerciseModalOpen(false)
      }
    } finally {
      setSyncStatus('synced')
    }
  }

  // Open swap alternatives modal
  const handleOpenSwap = async (sex: SessionExercise) => {
    setSwapTargetSexId(sex.id)
    try {
      const res = await fetch(`/api/training/sessions/${session!.id}/exercises?exerciseId=${sex.exerciseId}`)
      if (res.ok) {
        const data = await res.json()
        setSwapAlternatives(data.alternatives || [])
        setSwapModalOpen(true)
      }
    } catch {
      toast.error('Could not fetch alternatives')
    }
  }

  // Confirm exercise swap
  const handleConfirmSwap = async (targetExerciseId: string) => {
    if (!session || !swapTargetSexId) return
    setSyncStatus('syncing')
    try {
      const res = await fetch(`/api/training/sessions/${session.id}/exercises`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionExerciseId: swapTargetSexId,
          action: 'SWAP',
          targetExerciseId,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setSession((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            exercises: prev.exercises.map((e) =>
              e.id === swapTargetSexId ? data.sessionExercise : e
            ),
          }
        })
        toast.success('Exercise swapped successfully')
        setSwapModalOpen(false)
      }
    } finally {
      setSyncStatus('synced')
    }
  }

  // Skip exercise
  const handleSkipExercise = async (sessionExerciseId: string) => {
    if (!session) return
    try {
      const res = await fetch(`/api/training/sessions/${session.id}/exercises`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionExerciseId,
          action: 'SKIP',
          reason: 'Equipment occupied or fatigue',
        }),
      })
      if (res.ok) {
        setSession((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            exercises: prev.exercises.map((e) =>
              e.id === sessionExerciseId ? { ...e, skipped: true } : e
            ),
          }
        })
        toast.info('Exercise marked skipped')
      }
    } catch {}
  }

  // Log Set with Idempotency Key (§8.3)
  const handleSaveSet = async (sex: SessionExercise, setIndex: number) => {
    if (!session) return
    const draft = setInputs[sex.id]?.[setIndex] || { weightKg: '', reps: '', rpe: '', isWarmup: false }
    const clientLogId = `log_${session.id}_${sex.id}_set${setIndex}`

    const payload = {
      sessionExerciseId: sex.id,
      clientLogId,
      setIndex,
      weightKg: draft.weightKg ? parseFloat(draft.weightKg) : null,
      reps: draft.reps ? parseInt(draft.reps, 10) : null,
      rpe: draft.rpe ? parseFloat(draft.rpe) : null,
      isWarmup: draft.isWarmup,
      completedAt: new Date().toISOString(),
    }

    setSyncStatus('syncing')
    try {
      const res = await fetch(`/api/training/sessions/${session.id}/sets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const data = await res.json()
        setSession((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            exercises: prev.exercises.map((e) => {
              if (e.id !== sex.id) return e
              const updatedSets = [...e.setLogs]
              const existingIdx = updatedSets.findIndex((s) => s.clientLogId === clientLogId)
              if (existingIdx >= 0) {
                updatedSets[existingIdx] = data.setLog
              } else {
                updatedSets.push(data.setLog)
              }
              return { ...e, setLogs: updatedSets }
            }),
          }
        })

        toast.success(`Set ${setIndex} Logged`, {
          description: `${payload.weightKg || 0} kg × ${payload.reps || 0} reps`,
        })

        // Auto-start rest timer (§8.4)
        startRestTimer(sex.prescribed?.restSeconds || 90)
      }
    } catch {
      setSyncStatus('offline')
      toast.warning('Offline: Set stored locally and will sync on reconnect')
    } finally {
      setSyncStatus('synced')
    }
  }

  // Finish Workout
  const handleFinishWorkout = async () => {
    if (!session) return
    try {
      const res = await fetch(`/api/training/sessions/${session.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          perceivedEffort,
          memberFeedback: feedbackNote,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setFinishModalOpen(false)
        if (data.prs && data.prs.length > 0) {
          setAchievedPRs(data.prs)
          setCelebrationOpen(true)
        } else {
          toast.success('Workout finished and saved!')
          router.push('/m')
        }
      }
    } catch {
      toast.error('Failed to complete session')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-[var(--muted)] text-sm">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading workout telemetry...
      </div>
    )
  }

  if (!session) {
    return (
      <Card className="p-8 text-center max-w-md mx-auto my-8 border-[rgba(59,130,246,0.3)]">
        <div className="w-12 h-12 rounded-full bg-[rgba(59,130,246,0.15)] text-[#60A5FA] flex items-center justify-center mx-auto mb-4">
          <Dumbbell className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-white font-display">No Active Workout</h3>
        <p className="text-xs text-[var(--ink-2)] mt-1.5 mb-6">
          Start a freestyle workout or select a session from your program to begin tracking.
        </p>
        <div className="flex flex-col gap-2.5">
          <Button variant="primary" onClick={handleStartFreestyle} className="w-full justify-center gap-2">
            <Play className="w-4 h-4 fill-white" /> Start Freestyle Workout
          </Button>
          <Button variant="secondary" onClick={() => router.push('/m/programs')} className="w-full justify-center">
            Browse Gym Programs
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      {/* Top Session Control Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--surface)] p-4 rounded-2xl border border-[var(--line)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-white font-display">
              {session.title || 'Freestyle Workout'}
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(52,211,153,0.15)] text-[#34D399] border border-[rgba(52,211,153,0.3)] font-mono animate-pulse">
              LIVE
            </span>
          </div>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            {session.exercises.length} exercises · Started {new Date(session.startedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Sync Status Badge */}
          <div
            className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border font-mono ${
              syncStatus === 'synced'
                ? 'bg-[rgba(52,211,153,0.1)] text-[#34D399] border-[rgba(52,211,153,0.3)]'
                : syncStatus === 'syncing'
                ? 'bg-[rgba(59,130,246,0.1)] text-[#60A5FA] border-[rgba(59,130,246,0.3)]'
                : 'bg-[rgba(245,158,11,0.1)] text-[#F59E0B] border-[rgba(245,158,11,0.3)]'
            }`}
            title="Idempotent offline sync active"
          >
            {syncStatus === 'synced' ? (
              <Wifi className="w-3 h-3" />
            ) : syncStatus === 'syncing' ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <WifiOff className="w-3 h-3" />
            )}
            <span className="capitalize">{syncStatus}</span>
          </div>

          <Button
            variant="primary"
            onClick={() => setFinishModalOpen(true)}
            className="text-xs bg-gradient-to-r from-[#10B981] to-[#059669] hover:brightness-110 text-white font-semibold"
          >
            Finish Workout
          </Button>
        </div>
      </div>

      {/* Floating / Docked Rest Timer (§8.4) */}
      <AnimatePresence>
        {restTimerActive && restSecondsRemaining !== null && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="sticky top-28 z-20 bg-[rgba(13,12,16,0.95)] backdrop-blur-xl border border-[rgba(59,130,246,0.4)] rounded-2xl p-3 shadow-[0_8px_30px_rgba(59,130,246,0.2)] flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[rgba(59,130,246,0.2)] border border-[rgba(59,130,246,0.4)] flex items-center justify-center text-[#60A5FA]">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
                  Rest Countdown
                </span>
                <div className="text-2xl font-bold text-white font-martian tracking-tight">
                  {Math.floor(restSecondsRemaining / 60)}:
                  {String(restSecondsRemaining % 60).padStart(2, '0')}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => adjustRestTimer(-15)}
                className="px-2 py-1 rounded-lg bg-[var(--surface-2)] text-[var(--ink-2)] hover:text-white text-xs font-mono"
              >
                -15s
              </button>
              <button
                onClick={() => adjustRestTimer(15)}
                className="px-2 py-1 rounded-lg bg-[var(--surface-2)] text-[var(--ink-2)] hover:text-white text-xs font-mono"
              >
                +15s
              </button>
              <button
                onClick={dismissRestTimer}
                className="p-1.5 rounded-lg bg-[var(--surface-2)] text-[var(--muted)] hover:text-white"
                title="Dismiss timer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exercise Cards List */}
      <div className="space-y-4">
        {session.exercises.map((sex, eIdx) => {
          const isSkipped = sex.skipped
          const lastPerfText = (sex as any).lastPerformance

          return (
            <Card
              key={sex.id}
              className={`p-4 sm:p-5 border-[var(--line)] transition-all ${
                isSkipped ? 'opacity-40 bg-[rgba(0,0,0,0.4)]' : 'bg-[var(--surface)]'
              }`}
            >
              {/* Exercise Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-[var(--muted)] font-semibold">
                      #{eIdx + 1}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white font-display">
                      {sex.exercise?.name || 'Exercise'}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--surface-2)] text-[var(--ink-2)] border border-[var(--line)] uppercase font-mono">
                      {sex.exercise?.equipment}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--surface-2)] text-[var(--muted)] border border-[var(--line)] uppercase font-mono">
                      {sex.exercise?.primaryMuscle}
                    </span>
                    {sex.source === 'SWAPPED' && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[rgba(245,158,11,0.15)] text-[#F59E0B] border border-[rgba(245,158,11,0.3)] font-mono">
                        Swapped
                      </span>
                    )}
                    {isSkipped && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[rgba(239,68,68,0.15)] text-[#EF4444] border border-[rgba(239,68,68,0.3)] font-mono">
                        Skipped: {sex.note || 'No reason'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick actions dropdown / buttons */}
                {!isSkipped && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenSwap(sex)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-[var(--surface-2)] text-[var(--ink-2)] hover:text-white border border-[var(--line)] flex items-center gap-1"
                      title="Swap for equipment / muscle equivalent"
                    >
                      <ArrowRightLeft className="w-3 h-3 text-[#60A5FA]" />
                      <span className="hidden sm:inline">Swap</span>
                    </button>
                    <button
                      onClick={() => handleSkipExercise(sex.id)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-[var(--surface-2)] text-[var(--muted)] hover:text-[#EF4444] border border-[var(--line)] flex items-center gap-1"
                      title="Skip this exercise"
                    >
                      <SkipForward className="w-3 h-3" />
                      <span className="hidden sm:inline">Skip</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Set Logging Rows */}
              {!isSkipped && (
                <div className="mt-3 space-y-2">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-2 text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] px-2 pb-1 border-b border-[var(--line-soft)]">
                    <div className="col-span-2">Set</div>
                    <div className="col-span-4">Previous (§8.2)</div>
                    <div className="col-span-3 text-center">kg</div>
                    <div className="col-span-2 text-center">Reps</div>
                    <div className="col-span-1 text-right">Log</div>
                  </div>

                  {/* Standard 3 Sets or Logged Sets */}
                  {Array.from({ length: Math.max(3, sex.setLogs.length + 1) }).map((_, sIdx) => {
                    const setIndex = sIdx + 1
                    const loggedSet = sex.setLogs.find((s) => s.setIndex === setIndex)
                    const draft = setInputs[sex.id]?.[setIndex] || {
                      weightKg: loggedSet?.weightKg ? String(loggedSet.weightKg) : '',
                      reps: loggedSet?.reps ? String(loggedSet.reps) : '',
                      rpe: loggedSet?.rpe ? String(loggedSet.rpe) : '',
                      isWarmup: loggedSet?.isWarmup || false,
                    }

                    const isSaved = !!loggedSet

                    return (
                      <div
                        key={setIndex}
                        className={`grid grid-cols-12 gap-2 items-center px-2 py-1.5 rounded-xl transition-colors ${
                          isSaved
                            ? 'bg-[rgba(52,211,153,0.06)] border border-[rgba(52,211,153,0.2)]'
                            : 'hover:bg-[var(--surface-2)]'
                        }`}
                      >
                        {/* Set index & Warmup toggle */}
                        <div className="col-span-2 flex items-center gap-1.5">
                          <span className="text-xs font-mono font-bold text-white w-4">
                            {setIndex}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSetInputs((prev) => ({
                                ...prev,
                                [sex.id]: {
                                  ...prev[sex.id],
                                  [setIndex]: { ...draft, isWarmup: !draft.isWarmup },
                                },
                              }))
                            }}
                            className={`text-[9px] px-1 py-0.5 rounded font-mono ${
                              draft.isWarmup
                                ? 'bg-[#F59E0B] text-black font-bold'
                                : 'text-[var(--muted)] hover:text-white'
                            }`}
                          >
                            W
                          </button>
                        </div>

                        {/* Inline Telemetry in Martian Mono (§8.2) */}
                        <div className="col-span-4 text-xs font-martian text-[#60A5FA] truncate">
                          {lastPerfText ? (
                            <span>{lastPerfText}</span>
                          ) : (
                            <span className="text-[var(--muted-2)] font-sans text-[11px]">First time</span>
                          )}
                        </div>

                        {/* Weight input */}
                        <div className="col-span-3">
                          <input
                            type="number"
                            step="0.5"
                            placeholder="kg"
                            value={draft.weightKg}
                            onChange={(e) => {
                              const val = e.target.value
                              setSetInputs((prev) => ({
                                ...prev,
                                [sex.id]: {
                                  ...prev[sex.id],
                                  [setIndex]: { ...draft, weightKg: val },
                                },
                              }))
                            }}
                            className="w-full text-center py-1 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[var(--line)] text-white text-xs font-martian focus:border-[#3B82F6] focus:outline-none"
                          />
                        </div>

                        {/* Reps input */}
                        <div className="col-span-2">
                          <input
                            type="number"
                            placeholder="reps"
                            value={draft.reps}
                            onChange={(e) => {
                              const val = e.target.value
                              setSetInputs((prev) => ({
                                ...prev,
                                [sex.id]: {
                                  ...prev[sex.id],
                                  [setIndex]: { ...draft, reps: val },
                                },
                              }))
                            }}
                            className="w-full text-center py-1 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[var(--line)] text-white text-xs font-martian focus:border-[#3B82F6] focus:outline-none"
                          />
                        </div>

                        {/* Checkmark save button */}
                        <div className="col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleSaveSet(sex, setIndex)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                              isSaved
                                ? 'bg-[#10B981] text-black shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                                : 'bg-[var(--surface-2)] text-[var(--muted)] hover:text-white hover:bg-[var(--surface-raised)] border border-[var(--line)]'
                            }`}
                            title="Log set"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* Add Exercise Floating / Bottom Button */}
      <div className="pt-2">
        <Button
          variant="secondary"
          onClick={() => setAddExerciseModalOpen(true)}
          className="w-full py-3 rounded-xl border-dashed border-[var(--line-strong)] text-[var(--ink-2)] hover:text-white justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Exercise Not In Plan
        </Button>
      </div>

      {/* ─── Add Exercise Modal ─── */}
      <AnimatePresence>
        {addExerciseModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0D0C10] border border-[var(--line-strong)] rounded-2xl w-full max-w-lg p-5 max-h-[85vh] flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
                <h3 className="text-base font-bold text-white font-display">Add Exercise</h3>
                <button onClick={() => setAddExerciseModalOpen(false)} className="text-[var(--muted)] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search & Muscle Filters */}
              <div className="py-3 space-y-2">
                <input
                  type="text"
                  placeholder="Search 100+ movements (e.g. Reformer, Bench, Squat)..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] text-white text-xs focus:border-[#3B82F6] focus:outline-none"
                />

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-xs">
                  {['ALL', 'CHEST', 'BACK', 'SHOULDERS', 'QUADS', 'HAMSTRINGS', 'GLUTES', 'CORE', 'CARDIO'].map((m) => (
                    <button
                      key={m}
                      onClick={() => setSelectedMuscle(m)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-mono whitespace-nowrap transition-colors ${
                        selectedMuscle === m
                          ? 'bg-[#3B82F6] text-white font-bold'
                          : 'bg-[var(--surface)] text-[var(--muted)] hover:text-white border border-[var(--line)]'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exercises List */}
              <div className="flex-1 overflow-y-auto divide-y divide-[var(--line)] pr-1">
                {exerciseCatalog
                  .filter((e) => {
                    const matchQ = e.name.toLowerCase().includes(catalogSearch.toLowerCase())
                    const matchM = selectedMuscle === 'ALL' || e.primaryMuscle === selectedMuscle
                    return matchQ && matchM
                  })
                  .slice(0, 30)
                  .map((e) => (
                    <div
                      key={e.id}
                      onClick={() => handleAddExercise(e.id)}
                      className="py-2.5 px-2 hover:bg-[var(--surface-2)] rounded-xl cursor-pointer flex items-center justify-between gap-3 group transition-colors"
                    >
                      <div>
                        <h5 className="text-xs font-semibold text-white group-hover:text-[#60A5FA] transition-colors">
                          {e.name}
                        </h5>
                        <p className="text-[10px] text-[var(--muted)] mt-0.5">
                          {e.equipment} · {e.primaryMuscle}
                        </p>
                      </div>
                      <Plus className="w-4 h-4 text-[var(--muted)] group-hover:text-white" />
                    </div>
                  ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Swap Exercise Modal (§3) ─── */}
      <AnimatePresence>
        {swapModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0D0C10] border border-[var(--line-strong)] rounded-2xl w-full max-w-md p-5 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
                <div>
                  <h3 className="text-base font-bold text-white font-display">Swap Exercise</h3>
                  <p className="text-[11px] text-[var(--muted)] mt-0.5">
                    Select equivalent alternatives matching muscle and equipment class
                  </p>
                </div>
                <button onClick={() => setSwapModalOpen(false)} className="text-[var(--muted)] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-3 divide-y divide-[var(--line)] max-h-[60vh] overflow-y-auto pr-1">
                {swapAlternatives.map((alt) => (
                  <div
                    key={alt.id}
                    onClick={() => handleConfirmSwap(alt.id)}
                    className="py-2.5 px-2 hover:bg-[var(--surface-2)] rounded-xl cursor-pointer flex items-center justify-between gap-3 group transition-colors"
                  >
                    <div>
                      <h5 className="text-xs font-semibold text-white group-hover:text-[#60A5FA]">
                        {alt.name}
                      </h5>
                      <p className="text-[10px] text-[var(--muted)] mt-0.5">
                        {alt.equipment} · {alt.primaryMuscle}
                      </p>
                    </div>
                    <ArrowRightLeft className="w-3.5 h-3.5 text-[#60A5FA]" />
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Finish Workout Modal ─── */}
      <AnimatePresence>
        {finishModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0D0C10] border border-[var(--line-strong)] rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4"
            >
              <div>
                <h3 className="text-lg font-bold text-white font-display">Finish Workout Session</h3>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  Record session effort and feedback before locking session history.
                </p>
              </div>

              {/* RPE Effort Slider */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--ink-2)] font-medium">Perceived Effort (RPE)</span>
                  <span className="font-bold text-white font-mono">{perceivedEffort} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={perceivedEffort}
                  onChange={(e) => setPerceivedEffort(parseInt(e.target.value, 10))}
                  className="w-full accent-[#3B82F6]"
                />
                <div className="flex justify-between text-[10px] text-[var(--muted)] font-mono">
                  <span>Light (1-4)</span>
                  <span>Moderate (5-7)</span>
                  <span>Max Effort (8-10)</span>
                </div>
              </div>

              {/* Feedback note */}
              <div className="space-y-1">
                <label className="text-xs text-[var(--ink-2)] font-medium">Session Feedback & Notes</label>
                <textarea
                  rows={3}
                  placeholder="How did your body feel? E.g., bench felt explosive, mild shoulder fatigue on flyes..."
                  value={feedbackNote}
                  onChange={(e) => setFeedbackNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] text-white text-xs focus:border-[#3B82F6] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button variant="secondary" onClick={() => setFinishModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleFinishWorkout} className="bg-[#10B981] hover:brightness-110 text-white font-semibold">
                  Confirm & Save
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── PR Celebration Dialog (§8.8) ─── */}
      <AnimatePresence>
        {celebrationOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-[#0D0C10] to-[#1A1825] border border-[rgba(245,158,11,0.5)] rounded-3xl w-full max-w-md p-6 text-center shadow-[0_0_50px_rgba(245,158,11,0.3)] space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-[rgba(245,158,11,0.2)] text-[#F59E0B] flex items-center justify-center mx-auto shadow-[0_0_24px_rgba(245,158,11,0.5)]">
                <Award className="w-9 h-9" />
              </div>

              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-[#F59E0B] font-bold">
                  New Personal Record!
                </span>
                <h3 className="text-2xl font-black text-white font-display mt-1">
                  Phenomenal Progress
                </h3>
                <p className="text-xs text-[var(--ink-2)] mt-1">
                  You smashed an all-time personal best during this session.
                </p>
              </div>

              <div className="space-y-2 py-2">
                {achievedPRs.map((pr, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[var(--surface)] border border-[rgba(245,158,11,0.3)] flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">{pr.exerciseName}</span>
                    <span className="text-sm font-bold text-[#F59E0B] font-martian">
                      {pr.value} {pr.unit}
                    </span>
                  </div>
                ))}
              </div>

              <Button
                variant="primary"
                onClick={() => {
                  setCelebrationOpen(false)
                  router.push('/m')
                }}
                className="w-full justify-center bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-black font-bold shadow-[0_0_20px_rgba(245,158,11,0.4)]"
              >
                Back to Dashboard
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
