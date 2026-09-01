'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp,
  Award,
  Calendar,
  Download,
  Plus,
  Scale,
  Camera,
  ShieldCheck,
  Activity,
  CheckCircle2,
  FileSpreadsheet,
  FileJson,
  Sparkles,
} from 'lucide-react'
import { Card } from '@/components/app/ui/glass-card'
import Button from '@/components/app/ui/button'
import { toast } from '@/components/app/ui/toast'
import type { PersonalRecord, BodyMetric } from '@/types/training'

export default function MemberProgressPage() {
  const [prBoard, setPrBoard] = useState<PersonalRecord[]>([])
  const [volumeTimeline, setVolumeTimeline] = useState<{ date: string; volumeKg: number }[]>([])
  const [bodyMetrics, setBodyMetrics] = useState<BodyMetric[]>([])
  const [loading, setLoading] = useState(true)

  // Log Metric Modal
  const [metricModalOpen, setMetricModalOpen] = useState(false)
  const [weightInput, setWeightInput] = useState('')
  const [bodyFatInput, setBodyFatInput] = useState('')
  const [waistInput, setWaistInput] = useState('')
  const [chestInput, setChestInput] = useState('')
  const [isSavingMetric, setIsSavingMetric] = useState(false)

  const loadProgressData = async () => {
    try {
      const res = await fetch('/api/training/progress')
      if (res.ok) {
        const data = await res.json()
        setPrBoard(data.prBoard || [])
        setVolumeTimeline(data.volumeTimeline || [])
        setBodyMetrics(data.bodyMetrics || [])
      }
    } catch (e) {
      console.error('Failed to load progress', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProgressData()
  }, [])

  const handleRecordMetric = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingMetric(true)
    try {
      const res = await fetch('/api/training/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weightKg: weightInput,
          bodyFatPct: bodyFatInput,
          measurements: {
            waistCm: waistInput ? parseFloat(waistInput) : undefined,
            chestCm: chestInput ? parseFloat(chestInput) : undefined,
          },
        }),
      })

      if (res.ok) {
        toast.success('Body metric recorded')
        setMetricModalOpen(false)
        setWeightInput('')
        setBodyFatInput('')
        await loadProgressData()
      } else {
        toast.error('Failed to save metric')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setIsSavingMetric(false)
    }
  }

  const handleExportData = (format: 'json' | 'csv') => {
    window.location.href = `/api/training/export?format=${format}`
    toast.success(`Exporting your data in ${format.toUpperCase()}`, {
      description: 'DPDP-compliant export initiated.',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header & Export Data Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
        <div>
          <h2 className="text-xl font-bold text-white font-display flex items-center gap-2">
            <Award className="w-5 h-5 text-[#F59E0B]" />
            Personal Records & Analytics
          </h2>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            Epley estimated 1RM, all-time best lifts, and physical metrics.
          </p>
        </div>

        {/* 1-Click DPDP Data Export (§8.14) */}
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => handleExportData('csv')}
            className="text-xs gap-1.5 border-[var(--line)]"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#34D399]" /> Export CSV
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleExportData('json')}
            className="text-xs gap-1.5 border-[var(--line)]"
          >
            <FileJson className="w-3.5 h-3.5 text-[#60A5FA]" /> Export JSON
          </Button>
        </div>
      </div>

      {/* ─── Personal Records Board (§8.8) ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-[var(--muted)]">
            Trophy Board · All-Time Best Lifts
          </span>
          <span className="text-[11px] text-[var(--muted)] font-mono">
            {prBoard.length} PRs Recorded
          </span>
        </div>

        {prBoard.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {prBoard.map((pr) => (
              <Card
                key={pr.exerciseId}
                className="p-4 border-[rgba(245,158,11,0.25)] bg-gradient-to-br from-[var(--surface)] to-[rgba(245,158,11,0.05)] flex items-center justify-between gap-3"
              >
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    {pr.exerciseName}
                  </h4>
                  <p className="text-[10px] text-[var(--muted)] font-mono mt-0.5">
                    {pr.achievedAt ? new Date(pr.achievedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Verified PR'}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xl font-extrabold text-[#F59E0B] font-martian tracking-tight">
                    {pr.value} {pr.unit}
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[rgba(245,158,11,0.15)] text-[#F59E0B] font-mono uppercase">
                    Max Load
                  </span>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-6 text-center text-xs text-[var(--muted)] border-[var(--line)]">
            No personal records logged yet. Complete sets in your workout sessions to unlock PR trophies.
          </Card>
        )}
      </div>

      {/* ─── Volume Progression Timeline Graph (§8.10) ─── */}
      <Card className="p-5 sm:p-6 border-[var(--line)] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-white font-display">
              Total Workout Volume (kg Tonnage)
            </h4>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Accumulated resistance volume per completed session
            </p>
          </div>
        </div>

        {volumeTimeline.length > 0 ? (
          <div className="pt-3">
            {/* Minimal SVG Bar Visualizer */}
            <div className="h-40 flex items-end gap-2 sm:gap-3 border-b border-[var(--line)] pb-2">
              {volumeTimeline.map((v, idx) => {
                const maxVol = Math.max(...volumeTimeline.map((t) => t.volumeKg), 1)
                const heightPct = Math.max(15, Math.round((v.volumeKg / maxVol) * 100))

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-[#0D0C10] border border-[var(--line)] text-white text-[10px] px-2 py-1 rounded font-martian pointer-events-none whitespace-nowrap z-10 shadow-lg">
                      {v.volumeKg.toLocaleString()} kg
                    </div>

                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full rounded-t-lg bg-gradient-to-t from-[#1D4ED8] to-[#3B82F6] group-hover:brightness-125 transition-all"
                    />
                    <span className="text-[9px] font-mono text-[var(--muted)] truncate w-full text-center">
                      {v.date.slice(5)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <p className="text-xs text-[var(--muted)] text-center py-6">
            Log completed sessions to populate your volume progression graph.
          </p>
        )}
      </Card>

      {/* ─── Body Metrics & Measurements (§8.10) ─── */}
      <Card className="p-5 sm:p-6 border-[var(--line)] space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-white font-display flex items-center gap-2">
              <Scale className="w-4 h-4 text-[#34D399]" /> Body Metrics & Measurements
            </h4>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Track weight and body fat percentage over time
            </p>
          </div>

          <Button
            variant="secondary"
            onClick={() => setMetricModalOpen(true)}
            className="text-xs gap-1 border-[var(--line)]"
          >
            <Plus className="w-3.5 h-3.5" /> Log Metric
          </Button>
        </div>

        {bodyMetrics.length > 0 ? (
          <div className="divide-y divide-[var(--line)] text-xs">
            {bodyMetrics.slice(0, 5).map((m) => (
              <div key={m.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-mono text-[var(--muted)] text-[11px]">
                    {new Date(m.recordedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  {m.measurements?.waistCm && (
                    <span className="text-[11px] text-[var(--ink-2)] ml-3">
                      Waist: {m.measurements.waistCm} cm
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 font-martian">
                  {m.weightKg && (
                    <span className="text-white font-bold">{m.weightKg} kg</span>
                  )}
                  {m.bodyFatPct && (
                    <span className="text-[#34D399] text-[11px]">{m.bodyFatPct}% BF</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[var(--muted)] text-center py-4">
            No body metrics logged yet. Record your current weight to begin tracking.
          </p>
        )}
      </Card>

      {/* ─── Log Metric Modal ─── */}
      <AnimatePresence>
        {metricModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0D0C10] border border-[var(--line-strong)] rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4"
            >
              <h3 className="text-base font-bold text-white font-display">Record Body Metric</h3>

              <form onSubmit={handleRecordMetric} className="space-y-3">
                <div>
                  <label className="text-xs text-[var(--ink-2)]">Body Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 78.5"
                    required
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] text-white text-xs font-martian focus:border-[#3B82F6] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-[var(--ink-2)]">Body Fat % (Optional)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 15.2"
                    value={bodyFatInput}
                    onChange={(e) => setBodyFatInput(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] text-white text-xs font-martian focus:border-[#3B82F6] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-[var(--ink-2)]">Waist Circumference (cm, Optional)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="e.g. 82.0"
                    value={waistInput}
                    onChange={(e) => setWaistInput(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] text-white text-xs font-martian focus:border-[#3B82F6] focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <Button variant="secondary" type="button" onClick={() => setMetricModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit" disabled={isSavingMetric}>
                    Save Metric
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
