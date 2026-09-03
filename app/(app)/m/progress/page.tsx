'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp,
  Award,
  Plus,
  Scale,
  Calendar,
  Download,
  CheckCircle2,
  FileSpreadsheet,
  FileJson,
  Activity,
  X,
} from 'lucide-react'
import { toast } from '@/components/app/ui/toast'
import { cn } from '@/lib/utils'

export default function MemberProgressPage() {
  const [activeSegment, setActiveSegment] = useState<'strength' | 'body' | 'attendance'>('strength')
  const [metricModalOpen, setMetricModalOpen] = useState(false)
  const [weightInput, setWeightInput] = useState('')
  const [bodyFatInput, setBodyFatInput] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // PR Records
  const prs = [
    { label: 'Bench press', value: '62.5', delta: '▲ 5 KG · 6 WKS' },
    { label: 'Squat', value: '85', delta: '▲ 10 KG · 6 WKS' },
    { label: 'Deadlift', value: '100', delta: '▲ 7.5 KG · 6 WKS' },
    { label: 'Sessions', value: '38', delta: 'LAST 90 DAYS' },
  ]

  // Weekly Volume Bars W1 - W8
  const volumeBars = [
    { label: 'W1', heightPct: 38, isCurrent: false },
    { label: 'W2', heightPct: 52, isCurrent: false },
    { label: 'W3', heightPct: 44, isCurrent: false },
    { label: 'W4', heightPct: 66, isCurrent: false },
    { label: 'W5', heightPct: 59, isCurrent: false },
    { label: 'W6', heightPct: 74, isCurrent: false },
    { label: 'W7', heightPct: 81, isCurrent: false },
    { label: 'W8', heightPct: 94, isCurrent: true },
  ]

  const handleSaveMetric = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      setMetricModalOpen(false)
      toast.success('Body metric recorded successfully', {
        description: `Logged weight: ${weightInput || '68'} kg · Body fat: ${bodyFatInput || '14.2'}%`,
      })
      setWeightInput('')
      setBodyFatInput('')
    }, 400)
  }

  const handleExportData = (format: 'csv' | 'json') => {
    window.location.href = `/api/training/export?format=${format}`
    toast.success(`Exporting fitness telemetry in ${format.toUpperCase()}`, {
      description: 'DPDP-compliant biometric export ready.',
    })
  }

  return (
    <div className="w-full max-w-5xl mx-auto pt-1 pb-24 px-4 select-none">
      {/* Header */}
      <div className="member-hdr">
        <div>
          <p className="hi">Your</p>
          <h1 className="nm text-2xl sm:text-3xl text-white">Progress</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMetricModalOpen(true)}
            className="member-icbtn"
            title="Add Metric"
          >
            <Plus className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Segments Bar */}
      <div className="flex bg-[var(--surface)] border border-[var(--line)] rounded-full p-1 mb-5 max-w-md mx-auto sm:max-w-none">
        {(['strength', 'body', 'attendance'] as const).map((seg) => (
          <button
            key={seg}
            onClick={() => setActiveSegment(seg)}
            className={cn(
              'flex-1 py-2 text-center rounded-full text-xs transition-all capitalize cursor-pointer',
              activeSegment === seg
                ? 'bg-gradient-to-r from-[#1E40AF] via-[#3B82F6] to-[#38BDF8] text-white font-bold shadow-[0_4px_12px_rgba(59,130,246,0.5)]'
                : 'text-[var(--ink-3)] hover:text-white'
            )}
          >
            {seg}
          </button>
        ))}
      </div>

      {/* Main Grid: 1 col on mobile, 2 cols on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Left / Top: PR Cards */}
        <div className="md:col-span-6 space-y-4">
          <div className="member-sec">
            <h3>Personal bests</h3>
            <span className="text-xs text-[var(--ink-2)] font-mono">Epley 1RM</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {prs.map((p) => (
              <div
                key={p.label}
                className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-md)] p-3.5 flex flex-col justify-between hover:border-[rgba(77,141,255,0.3)] transition-colors"
              >
                <p className="text-[11px] text-[var(--ink-3)]">{p.label}</p>
                <p className="font-display text-2xl font-bold text-white tracking-tight my-1.5">
                  {p.value}
                </p>
                <p className="font-data text-[8.5px] text-[var(--ok)] font-semibold tracking-wider">
                  {p.delta}
                </p>
              </div>
            ))}
          </div>

          {/* Recent records */}
          <div className="member-sec pt-3">
            <h3>Recent records</h3>
            <button
              onClick={() => handleExportData('csv')}
              className="text-xs text-[#38BDF8] hover:underline"
            >
              Export log
            </button>
          </div>

          <div className="space-y-2">
            <div className="member-lrow">
              <div className="member-lic" style={{ background: 'var(--t4)' }}>
                <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-[#5EE7C4] fill-none" strokeWidth="1.8">
                  <path d="M12 3l2.5 5.5L20 10l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-1.5z" />
                </svg>
              </div>
              <div className="member-lt">
                <b>Bench press · 62.5 kg × 5</b>
                <span>29 August · Powai Flagship</span>
              </div>
            </div>

            <div className="member-lrow">
              <div className="member-lic" style={{ background: 'var(--t2)' }}>
                <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-[#38BDF8] fill-none" strokeWidth="1.8">
                  <path d="M12 3l2.5 5.5L20 10l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-1.5z" />
                </svg>
              </div>
              <div className="member-lt">
                <b>Back Squat · 85 kg × 5</b>
                <span>24 August · Leg Hypertrophy</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right / Bottom: Weekly Volume Histogram */}
        <div className="md:col-span-6 space-y-4">
          <div className="member-sec">
            <h3>Weekly volume</h3>
            <span className="text-xs text-[var(--ink-2)]">8 weeks</span>
          </div>

          <div className="member-card p-4 sm:p-5">
            <div className="flex items-end gap-2 sm:gap-3 h-32 sm:h-40 pt-4">
              {volumeBars.map((b) => (
                <div
                  key={b.label}
                  className="flex-1 flex flex-col items-center gap-2 justify-end h-full group"
                >
                  <div
                    style={{ height: `${b.heightPct}%` }}
                    className={cn(
                      'w-full max-w-[24px] rounded-lg transition-all duration-300',
                      b.isCurrent
                        ? 'bg-gradient-to-t from-[#1E40AF] via-[#3B82F6] to-[#38BDF8] shadow-[0_0_15px_rgba(59,130,246,0.6)]'
                        : 'bg-[rgba(255,255,255,0.08)] group-hover:bg-[rgba(255,255,255,0.18)]'
                    )}
                  />
                  <span className="text-[10px] font-mono text-[var(--ink-3)]">
                    {b.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--line)] text-xs">
              <span className="text-[var(--ink-3)]">This week</span>
              <span className="font-bold text-white font-data text-sm">
                18,400 kg
              </span>
            </div>
          </div>

          {/* Biometrics Preview Card */}
          <div className="member-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[rgba(52,211,153,0.12)] border border-[rgba(52,211,153,0.25)] flex items-center justify-center text-[#34D399]">
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Body composition</p>
                <p className="text-[11px] text-[var(--ink-3)]">68.2 kg · 14.4% BF</p>
              </div>
            </div>
            <button
              onClick={() => setMetricModalOpen(true)}
              className="text-xs text-[#38BDF8] hover:underline font-medium"
            >
              Log weight
            </button>
          </div>
        </div>
      </div>

      {/* Log Metric Modal */}
      <AnimatePresence>
        {metricModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-[24px] bg-[#05070E] border border-[rgba(255,255,255,0.1)] p-5 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
                <h3 className="font-display font-semibold text-white text-base">
                  Record Body Metric
                </h3>
                <button
                  onClick={() => setMetricModalOpen(false)}
                  className="p-1 text-[var(--muted)] hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveMetric} className="space-y-4 pt-4">
                <div>
                  <label className="block text-xs text-[var(--ink-2)] mb-1">
                    Body Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 68.5"
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    required
                    className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-xl px-3.5 py-2.5 text-white font-data text-sm outline-none focus:border-[#3B82F6]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[var(--ink-2)] mb-1">
                    Body Fat Percentage (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 14.2"
                    value={bodyFatInput}
                    onChange={(e) => setBodyFatInput(e.target.value)}
                    className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-xl px-3.5 py-2.5 text-white font-data text-sm outline-none focus:border-[#3B82F6]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-3 rounded-full bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] text-white font-bold text-xs shadow-lg hover:brightness-110 transition-all cursor-pointer"
                >
                  {isSaving ? 'Saving...' : 'Save Metric'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
