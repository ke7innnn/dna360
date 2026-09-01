'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Layers,
  BookOpen,
  Plus,
  Play,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Dumbbell,
  ShieldCheck,
  ChevronRight,
  Info,
  FastForward,
} from 'lucide-react'
import { Card } from '@/components/app/ui/glass-card'
import Button from '@/components/app/ui/button'
import Badge from '@/components/app/ui/badge'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/components/app/ui/toast'
import type { Program, MemberProgram } from '@/types/training'

export default function MemberProgramsPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [activeTab, setActiveTab] = useState<'my_plan' | 'gym_library' | 'builder'>('my_plan')
  const [gymPrograms, setGymPrograms] = useState<Program[]>([])
  const [activeProgram, setActiveProgram] = useState<MemberProgram | null>(null)
  const [loading, setLoading] = useState(true)

  // Shift Plan Modal (§3)
  const [shiftModalOpen, setShiftModalOpen] = useState(false)
  const [shiftDays, setShiftDays] = useState(7)
  const [isShifting, setIsShifting] = useState(false)

  // Selected Program for Inspection
  const [inspectedProgram, setInspectedProgram] = useState<Program | null>(null)
  const [isCloning, setIsCloning] = useState(false)

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

  // Start / Clone Gym Program in 2 Taps (§5)
  const handleStartGymProgram = async (programId: string) => {
    setIsCloning(true)
    try {
      const res = await fetch('/api/training/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CLONE_GYM',
          programId,
          scheduleMode: 'FLEXIBLE',
        }),
      })

      if (res.ok) {
        toast.success('Program Cloned & Activated', {
          description: 'This program is now 100% yours to adapt, reorder, or edit.',
        })
        await loadPrograms()
        setActiveTab('my_plan')
        setInspectedProgram(null)
      } else {
        toast.error('Failed to clone program')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setIsCloning(false)
    }
  }

  // Shift Plan execution (§3)
  const handleExecuteShiftPlan = async () => {
    if (!activeProgram) return
    setIsShifting(true)
    try {
      const res = await fetch(`/api/training/programs/${activeProgram.id}/shift`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: shiftDays }),
      })

      if (res.ok) {
        const data = await res.json()
        toast.success(`Plan Shifted Forward by ${shiftDays} Days`, {
          description: `${data.shiftedCount} upcoming sessions adjusted without penalty.`,
        })
        setShiftModalOpen(false)
        await loadPrograms()
      } else {
        toast.error('Failed to shift plan')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setIsShifting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between gap-4 border-b border-[var(--line)] pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('my_plan')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'my_plan'
                ? 'bg-gradient-to-r from-[#3B82F6] to-[#1D4ED8] text-white shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                : 'text-[var(--muted)] hover:text-white'
            }`}
          >
            My Active Plan
          </button>
          <button
            onClick={() => setActiveTab('gym_library')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'gym_library'
                ? 'bg-gradient-to-r from-[#3B82F6] to-[#1D4ED8] text-white shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                : 'text-[var(--muted)] hover:text-white'
            }`}
          >
            Gym Library ({gymPrograms.length})
          </button>
        </div>

        {activeProgram && (
          <Button
            variant="secondary"
            onClick={() => setShiftModalOpen(true)}
            className="text-xs gap-1.5 border-[rgba(59,130,246,0.3)] text-[#93C5FD]"
          >
            <FastForward className="w-3.5 h-3.5" /> Shift Plan
          </Button>
        )}
      </div>

      {/* ─── Tab 1: My Active Plan ─── */}
      {activeTab === 'my_plan' && (
        <div className="space-y-5">
          {activeProgram ? (
            <div className="space-y-4">
              <Card className="p-5 sm:p-6 border-[rgba(59,130,246,0.3)] bg-gradient-to-br from-[var(--surface)] to-[rgba(59,130,246,0.06)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-[rgba(52,211,153,0.15)] text-[#34D399] border border-[rgba(52,211,153,0.3)] font-mono font-medium">
                        {activeProgram.coachingMode === 'TRAINER_LED' ? 'Trainer-Led' : 'Self-Coached'}
                      </span>
                      <span className="text-xs text-[var(--muted)] font-mono">
                        v{activeProgram.currentVersion} · {activeProgram.scheduleMode}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white font-display mt-1">
                      {activeProgram.snapshot?.name || 'Active Workout Programme'}
                    </h2>
                    <p className="text-xs text-[var(--muted)] mt-1 max-w-2xl">
                      {activeProgram.snapshot?.notes || 'Follow your prescribed progression or adapt exercises mid-session.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      onClick={() => router.push('/m/session')}
                      className="gap-2 shadow-[0_0_14px_rgba(59,130,246,0.4)]"
                    >
                      <Play className="w-4 h-4 fill-white" /> Start Workout
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Days List */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-wider text-[var(--muted)]">
                  Programme Schedule ({activeProgram.snapshot?.days?.length || 0} Routine Days)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeProgram.snapshot?.days?.map((day: any, dIdx: number) => (
                    <Card key={day.id || dIdx} className="p-4 border-[var(--line)] space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="text-sm font-bold text-white font-display">
                          {day.label}
                        </h5>
                        <span className="text-[10px] font-mono text-[var(--muted)]">
                          {day.exercises?.length || 0} exercises
                        </span>
                      </div>

                      <div className="divide-y divide-[var(--line-soft)] text-xs">
                        {day.exercises?.map((e: any, eIdx: number) => (
                          <div key={e.id || eIdx} className="py-1.5 flex items-center justify-between text-[var(--ink-2)]">
                            <span className="truncate pr-2">{eIdx + 1}. {e.exerciseId?.replace('ex_', '').replace(/_/g, ' ')}</span>
                            <span className="text-[11px] font-martian text-[#60A5FA] shrink-0">
                              {e.sets} × {e.repsMin || 8}-{e.repsMax || 10}
                            </span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <Card className="p-8 text-center max-w-md mx-auto my-8 border-[var(--line)]">
              <div className="w-12 h-12 rounded-full bg-[rgba(59,130,246,0.15)] text-[#60A5FA] flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white font-display">No Active Programme</h3>
              <p className="text-xs text-[var(--muted)] mt-1 mb-5">
                Select a curated programme from the Gym Library or freestyle-log your workouts anytime.
              </p>
              <Button variant="primary" onClick={() => setActiveTab('gym_library')} className="w-full justify-center">
                Browse Gym Library
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* ─── Tab 2: Gym Library (§5) ─── */}
      {activeTab === 'gym_library' && (
        <div className="space-y-4">
          <div className="bg-[rgba(59,130,246,0.08)] border border-[rgba(59,130,246,0.25)] p-4 rounded-2xl flex items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-semibold text-white">DNA 360 Gym Library</h4>
              <p className="text-xs text-[var(--ink-2)] mt-0.5">
                Head trainer-curated routines. Starting one clones it into a programme you own and can edit freely (§5).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gymPrograms.map((prog) => (
              <Card
                key={prog.id}
                className="p-5 border-[var(--line)] hover:border-[rgba(59,130,246,0.35)] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--muted)] uppercase font-mono">
                      {prog.goal}
                    </span>
                    <span className="text-xs text-[var(--muted)] font-mono">
                      {prog.daysPerWeek} days / wk · {prog.weeks} weeks
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-white font-display">
                    {prog.name}
                  </h3>
                  <p className="text-xs text-[var(--muted)] mt-1 line-clamp-2">
                    {prog.notes}
                  </p>

                  <div className="mt-3 space-y-1">
                    {prog.days?.slice(0, 3).map((d) => (
                      <div key={d.id} className="text-[11px] text-[var(--ink-2)] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                        <span className="truncate">{d.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-[var(--line-soft)] flex items-center justify-between gap-3">
                  <button
                    onClick={() => setInspectedProgram(prog)}
                    className="text-xs text-[var(--muted)] hover:text-white font-medium"
                  >
                    View Details
                  </button>

                  <Button
                    variant="primary"
                    onClick={() => handleStartGymProgram(prog.id)}
                    disabled={isCloning}
                    className="text-xs gap-1.5"
                  >
                    Start Programme <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ─── Shift Plan Modal (§3) ─── */}
      <AnimatePresence>
        {shiftModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0D0C10] border border-[var(--line-strong)] rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4"
            >
              <div>
                <h3 className="text-lg font-bold text-white font-display">Shift Plan Schedule</h3>
                <p className="text-xs text-[var(--ink-2)] mt-1">
                  Missed a week on holiday in Goa? Push all future sessions forward without watching them turn red (§3). Past completed workouts remain intact.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-xs text-[var(--muted)] font-medium">Days to Shift Forward</label>
                <div className="grid grid-cols-3 gap-2">
                  {[3, 7, 14].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setShiftDays(d)}
                      className={`py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                        shiftDays === d
                          ? 'bg-[#3B82F6] text-white shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                          : 'bg-[var(--surface-2)] text-[var(--muted)] hover:text-white border border-[var(--line)]'
                      }`}
                    >
                      +{d} Days
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button variant="secondary" onClick={() => setShiftModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleExecuteShiftPlan}
                  disabled={isShifting}
                  className="bg-[#3B82F6] text-white font-semibold"
                >
                  {isShifting ? 'Shifting...' : 'Apply Shift'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Program Inspection Modal ─── */}
      <AnimatePresence>
        {inspectedProgram && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0D0C10] border border-[var(--line-strong)] rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
            >
              <div>
                <span className="text-[10px] uppercase font-mono text-[#60A5FA]">
                  {inspectedProgram.goal}
                </span>
                <h3 className="text-xl font-bold text-white font-display mt-0.5">
                  {inspectedProgram.name}
                </h3>
                <p className="text-xs text-[var(--muted)] mt-1">
                  {inspectedProgram.notes}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {inspectedProgram.days?.map((d, dIdx) => (
                  <div key={d.id || dIdx} className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--line)]">
                    <h5 className="text-xs font-bold text-white font-display mb-1.5">{d.label}</h5>
                    <div className="space-y-1">
                      {d.exercises?.map((e: any, eIdx: number) => (
                        <div key={e.id || eIdx} className="text-[11px] text-[var(--ink-2)] flex items-center justify-between">
                          <span className="truncate pr-2">{eIdx + 1}. {e.exerciseId?.replace('ex_', '').replace(/_/g, ' ')}</span>
                          <span className="text-[10px] font-martian text-[#60A5FA]">
                            {e.sets} sets · {e.repsMin || 8}-{e.repsMax || 10} reps
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--line)]">
                <Button variant="secondary" onClick={() => setInspectedProgram(null)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleStartGymProgram(inspectedProgram.id)}
                  disabled={isCloning}
                >
                  Start This Programme
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
