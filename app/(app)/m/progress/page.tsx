'use client'

import React, { useState } from 'react'
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
  Flame,
  Clock,
  Dumbbell,
  Check,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react'
import { toast } from '@/components/app/ui/toast'
import { cn } from '@/lib/utils'

export default function MemberProgressPage() {
  const [activeSegment, setActiveSegment] = useState<'strength' | 'body' | 'attendance'>('strength')
  const [metricModalOpen, setMetricModalOpen] = useState(false)
  const [weightInput, setWeightInput] = useState('')
  const [bodyFatInput, setBodyFatInput] = useState('')
  const [muscleMassInput, setMuscleMassInput] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Dynamic user-logged metrics state
  const [currentWeight, setCurrentWeight] = useState('68.2')
  const [currentBodyFat, setCurrentBodyFat] = useState('16.8')
  const [currentMuscleMass, setCurrentMuscleMass] = useState('33.4')

  // PR Records (Strength)
  const prs = [
    { label: 'Bench press', value: '62.5', unit: 'kg', delta: '▲ 5 KG · 6 WKS' },
    { label: 'Squat', value: '85.0', unit: 'kg', delta: '▲ 10 KG · 6 WKS' },
    { label: 'Deadlift', value: '100.0', unit: 'kg', delta: '▲ 7.5 KG · 6 WKS' },
    { label: 'Sessions', value: '38', unit: 'total', delta: 'LAST 90 DAYS' },
  ]

  // Weekly Volume Bars W1 - W8 (Strength)
  const volumeBars = [
    { label: 'W1', heightPct: 38, kg: '12,400', isCurrent: false },
    { label: 'W2', heightPct: 52, kg: '14,100', isCurrent: false },
    { label: 'W3', heightPct: 44, kg: '13,200', isCurrent: false },
    { label: 'W4', heightPct: 66, kg: '15,800', isCurrent: false },
    { label: 'W5', heightPct: 59, kg: '15,100', isCurrent: false },
    { label: 'W6', heightPct: 74, kg: '16,900', isCurrent: false },
    { label: 'W7', heightPct: 81, kg: '17,500', isCurrent: false },
    { label: 'W8', heightPct: 94, kg: '18,400', isCurrent: true },
  ]

  // Body Composition Trend (W1 - W8)
  const bodyTrendBars = [
    { label: 'W1', weight: 70.6, heightPct: 95 },
    { label: 'W2', weight: 70.2, heightPct: 90 },
    { label: 'W3', weight: 69.8, heightPct: 85 },
    { label: 'W4', weight: 69.4, heightPct: 78 },
    { label: 'W5', weight: 69.1, heightPct: 74 },
    { label: 'W6', weight: 68.8, heightPct: 70 },
    { label: 'W7', weight: 68.5, heightPct: 66 },
    { label: 'W8', weight: 68.2, heightPct: 62 },
  ]

  // 35-Day Attendance Heatmap (August - September)
  const attendanceCalendar = Array.from({ length: 35 }).map((_, i) => {
    const day = (i % 31) + 1
    // Specific workout attendances
    const attended = [1, 3, 4, 6, 8, 10, 11, 13, 15, 17, 18, 20, 22, 24, 25, 27, 29, 31, 32, 34].includes(i)
    const type = i % 3 === 0 ? 'floor' : i % 3 === 1 ? 'class' : 'pt'
    return { day, attended, type }
  })

  const handleSaveMetric = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      if (weightInput) setCurrentWeight(parseFloat(weightInput).toFixed(1))
      if (bodyFatInput) setCurrentBodyFat(parseFloat(bodyFatInput).toFixed(1))
      if (muscleMassInput) setCurrentMuscleMass(parseFloat(muscleMassInput).toFixed(1))
      setMetricModalOpen(false)
      toast.success('Body metric recorded successfully', {
        description: `Logged weight: ${weightInput || currentWeight} kg · Body fat: ${bodyFatInput || currentBodyFat}%`,
      })
      setWeightInput('')
      setBodyFatInput('')
      setMuscleMassInput('')
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
              'flex-1 py-2 text-center rounded-full text-xs transition-all capitalize cursor-pointer font-medium',
              activeSegment === seg
                ? 'bg-gradient-to-r from-[#1E40AF] via-[#3B82F6] to-[#38BDF8] text-white font-bold shadow-[0_4px_12px_rgba(59,130,246,0.5)]'
                : 'text-[var(--ink-3)] hover:text-white'
            )}
          >
            {seg}
          </button>
        ))}
      </div>

      {/* ─── SEGMENT 1: STRENGTH ─── */}
      <AnimatePresence mode="wait">
        {activeSegment === 'strength' && (
          <motion.div
            key="strength"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="grid grid-cols-1 md:grid-cols-12 gap-5"
          >
            {/* Left / Top: PR Cards */}
            <div className="md:col-span-6 space-y-4">
              <div className="member-sec">
                <h3>Personal bests</h3>
                <span className="text-xs text-[#38BDF8] font-mono">Epley 1RM</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {prs.map((p) => (
                  <div
                    key={p.label}
                    className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-md)] p-4 flex flex-col justify-between hover:border-[rgba(56,189,248,0.3)] transition-colors"
                  >
                    <p className="text-xs text-[var(--ink-3)] font-ui font-medium">{p.label}</p>
                    <div className="flex items-baseline gap-1 my-1.5">
                      <span className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight leading-none">
                        {p.value}
                      </span>
                      <span className="text-xs text-[var(--ink-3)] font-ui font-medium">
                        {p.unit}
                      </span>
                    </div>
                    <p className="font-data text-[9px] text-[var(--ok)] font-semibold tracking-wider">
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
                  className="text-xs text-[#38BDF8] hover:underline cursor-pointer"
                >
                  Export log
                </button>
              </div>

              <div className="space-y-2">
                <div className="member-lrow">
                  <div className="member-lic" style={{ background: 'var(--t4)' }}>
                    <Dumbbell className="w-4 h-4 text-[#5EE7C4]" />
                  </div>
                  <div className="member-lt">
                    <b>Bench press · 62.5 kg × 5</b>
                    <span>29 August · Powai Flagship</span>
                  </div>
                </div>

                <div className="member-lrow">
                  <div className="member-lic" style={{ background: 'var(--t2)' }}>
                    <Award className="w-4 h-4 text-[#38BDF8]" />
                  </div>
                  <div className="member-lt">
                    <b>Back Squat · 85 kg × 5</b>
                    <span>24 August · Leg Hypertrophy</span>
                  </div>
                </div>

                <div className="member-lrow">
                  <div className="member-lic" style={{ background: 'rgba(99,102,241,0.15)' }}>
                    <Activity className="w-4 h-4 text-[#818CF8]" />
                  </div>
                  <div className="member-lt">
                    <b>Conventional Deadlift · 100 kg × 3</b>
                    <span>18 August · Posterior Chain</span>
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
                <div className="flex items-end gap-2 sm:gap-3 h-36 sm:h-44 pt-4">
                  {volumeBars.map((b) => (
                    <div
                      key={b.label}
                      className="flex-1 flex flex-col items-center gap-2 justify-end h-full group cursor-pointer"
                      title={`${b.label}: ${b.kg} kg`}
                    >
                      <div
                        style={{ height: `${b.heightPct}%` }}
                        className={cn(
                          'w-full max-w-[26px] rounded-lg transition-all duration-300',
                          b.isCurrent
                            ? 'bg-gradient-to-t from-[#1E40AF] via-[#3B82F6] to-[#38BDF8] shadow-[0_0_15px_rgba(59,130,246,0.6)]'
                            : 'bg-[rgba(255,255,255,0.08)] group-hover:bg-[rgba(255,255,255,0.22)]'
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
                  <span className="font-bold text-white font-display text-sm sm:text-base">
                    18,400 kg
                  </span>
                </div>
              </div>

              {/* Volume Load Insights Card */}
              <div className="member-card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[rgba(56,189,248,0.12)] border border-[rgba(56,189,248,0.25)] flex items-center justify-center text-[#38BDF8]">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Progressive Overload</p>
                    <p className="text-[11px] text-[var(--ink-3)]">+14% load volume over 6 weeks</p>
                  </div>
                </div>
                <button
                  onClick={() => handleExportData('json')}
                  className="text-xs text-[#38BDF8] hover:underline font-medium cursor-pointer"
                >
                  Raw telemetry
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── SEGMENT 2: BODY COMPOSITION ─── */}
        {activeSegment === 'body' && (
          <motion.div
            key="body"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="grid grid-cols-1 md:grid-cols-12 gap-5"
          >
            {/* Left: InBody Biometrics */}
            <div className="md:col-span-6 space-y-4">
              <div className="member-sec">
                <h3>InBody Biometrics</h3>
                <span className="text-xs text-[#38BDF8] font-mono">InBody 570 tested</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-md)] p-4 flex flex-col justify-between hover:border-[rgba(56,189,248,0.3)] transition-colors">
                  <p className="text-xs text-[var(--ink-3)] font-ui font-medium">Body weight</p>
                  <div className="flex items-baseline gap-1 my-1.5">
                    <span className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight leading-none">
                      {currentWeight}
                    </span>
                    <span className="text-xs text-[var(--ink-3)] font-ui font-medium">kg</span>
                  </div>
                  <p className="font-data text-[9px] text-[var(--ok)] font-semibold tracking-wider">
                    ▼ -2.4 KG · STARTED 70.6
                  </p>
                </div>

                <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-md)] p-4 flex flex-col justify-between hover:border-[rgba(56,189,248,0.3)] transition-colors">
                  <p className="text-xs text-[var(--ink-3)] font-ui font-medium">Body fat</p>
                  <div className="flex items-baseline gap-1 my-1.5">
                    <span className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight leading-none">
                      {currentBodyFat}
                    </span>
                    <span className="text-xs text-[var(--ink-3)] font-ui font-medium">%</span>
                  </div>
                  <p className="font-data text-[9px] text-[var(--ok)] font-semibold tracking-wider">
                    ▼ -3.2% · TARGET 15.0%
                  </p>
                </div>

                <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-md)] p-4 flex flex-col justify-between hover:border-[rgba(56,189,248,0.3)] transition-colors">
                  <p className="text-xs text-[var(--ink-3)] font-ui font-medium">Skeletal muscle</p>
                  <div className="flex items-baseline gap-1 my-1.5">
                    <span className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight leading-none">
                      {currentMuscleMass}
                    </span>
                    <span className="text-xs text-[var(--ink-3)] font-ui font-medium">kg</span>
                  </div>
                  <p className="font-data text-[9px] text-[#38BDF8] font-semibold tracking-wider">
                    ▲ +1.1 KG LEAN MASS
                  </p>
                </div>

                <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-md)] p-4 flex flex-col justify-between hover:border-[rgba(56,189,248,0.3)] transition-colors">
                  <p className="text-xs text-[var(--ink-3)] font-ui font-medium">Visceral fat</p>
                  <div className="flex items-baseline gap-1 my-1.5">
                    <span className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight leading-none">
                      Level 4
                    </span>
                  </div>
                  <p className="font-data text-[9px] text-[var(--ok)] font-semibold tracking-wider">
                    OPTIMAL (RANGE 1–9)
                  </p>
                </div>
              </div>

              {/* Circumference Measurements */}
              <div className="member-sec pt-3">
                <h3>Circumference (cm)</h3>
                <span className="text-xs text-[var(--ink-3)]">Tape tracking</span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Waist', val: '78', delta: '-4.0' },
                  { label: 'Chest', val: '98', delta: '-1.5' },
                  { label: 'Hips', val: '94', delta: '-2.0' },
                  { label: 'Arms', val: '34.5', delta: '+0.8' },
                ].map((item) => (
                  <div key={item.label} className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--line)] text-center">
                    <p className="text-[10.5px] text-[var(--ink-3)]">{item.label}</p>
                    <p className="font-display font-semibold text-white text-base mt-0.5">{item.val}</p>
                    <p className="text-[9px] font-mono text-[#38BDF8]">{item.delta} cm</p>
                  </div>
                ))}
              </div>

              {/* Recent Scan Log */}
              <div className="space-y-2 pt-2">
                <div className="member-lrow">
                  <div className="member-lic" style={{ background: 'var(--t2)' }}>
                    <Scale className="w-4 h-4 text-[#38BDF8]" />
                  </div>
                  <div className="member-lt">
                    <b>InBody Scan · 68.2 kg (16.8% BF)</b>
                    <span>28 August · Powai Scanner #2</span>
                  </div>
                </div>

                <div className="member-lrow">
                  <div className="member-lic" style={{ background: 'var(--t1)' }}>
                    <Scale className="w-4 h-4 text-[#4D8DFF]" />
                  </div>
                  <div className="member-lt">
                    <b>InBody Scan · 68.9 kg (17.4% BF)</b>
                    <span>14 August · Powai Scanner #2</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Body Trend Chart & Action */}
            <div className="md:col-span-6 space-y-4">
              <div className="member-sec">
                <h3>Weight trend</h3>
                <span className="text-xs text-[var(--ink-2)]">8 check-ins</span>
              </div>

              <div className="member-card p-4 sm:p-5">
                <div className="flex items-end gap-2 sm:gap-3 h-36 sm:h-44 pt-4">
                  {bodyTrendBars.map((b) => (
                    <div
                      key={b.label}
                      className="flex-1 flex flex-col items-center gap-2 justify-end h-full group cursor-pointer"
                      title={`${b.label}: ${b.weight} kg`}
                    >
                      <div
                        style={{ height: `${b.heightPct}%` }}
                        className={cn(
                          'w-full max-w-[26px] rounded-lg transition-all duration-300',
                          b.label === 'W8'
                            ? 'bg-gradient-to-t from-[#1E40AF] via-[#3B82F6] to-[#38BDF8] shadow-[0_0_15px_rgba(59,130,246,0.6)]'
                            : 'bg-[rgba(255,255,255,0.08)] group-hover:bg-[rgba(255,255,255,0.2)]'
                        )}
                      />
                      <span className="text-[10px] font-mono text-[var(--ink-3)]">
                        {b.label}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--line)] text-xs">
                  <span className="text-[var(--ink-3)]">Current weight</span>
                  <span className="font-bold text-white font-display text-sm sm:text-base">
                    {currentWeight} kg
                  </span>
                </div>
              </div>

              {/* Composition Distribution */}
              <div className="member-card p-4 space-y-3">
                <p className="text-xs font-semibold text-white">Body composition distribution</p>
                <div className="h-2 w-full bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden flex">
                  <div className="h-full bg-[#3B82F6] w-[49%]" title="Muscle Mass 49%" />
                  <div className="h-full bg-[#38BDF8] w-[17%]" title="Fat Mass 17%" />
                  <div className="h-full bg-slate-500 w-[34%]" title="Water & Minerals 34%" />
                </div>
                <div className="flex items-center justify-between text-[10.5px] text-[var(--ink-3)] font-ui">
                  <span className="flex items-center gap-1.5">
                    <i className="w-2 h-2 rounded-full bg-[#3B82F6]" /> Muscle 49%
                  </span>
                  <span className="flex items-center gap-1.5">
                    <i className="w-2 h-2 rounded-full bg-[#38BDF8]" /> Fat 17%
                  </span>
                  <span className="flex items-center gap-1.5">
                    <i className="w-2 h-2 rounded-full bg-slate-500" /> Other 34%
                  </span>
                </div>
              </div>

              {/* Action Tile */}
              <div className="member-card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[rgba(56,189,248,0.12)] border border-[rgba(56,189,248,0.25)] flex items-center justify-center text-[#38BDF8]">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Log new measurement</p>
                    <p className="text-[11px] text-[var(--ink-3)]">Update weight, fat %, or tape data</p>
                  </div>
                </div>
                <button
                  onClick={() => setMetricModalOpen(true)}
                  className="px-4 py-2 rounded-full bg-[#3B82F6] text-white font-bold text-xs hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                >
                  Record
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── SEGMENT 3: ATTENDANCE ─── */}
        {activeSegment === 'attendance' && (
          <motion.div
            key="attendance"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="grid grid-cols-1 md:grid-cols-12 gap-5"
          >
            {/* Left: Attendance Highlights & Timeline */}
            <div className="md:col-span-6 space-y-4">
              <div className="member-sec">
                <h3>Studio Consistency</h3>
                <span className="text-xs text-[#38BDF8] font-mono">Turnstile authenticated</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-md)] p-4 flex flex-col justify-between hover:border-[rgba(56,189,248,0.3)] transition-colors">
                  <p className="text-xs text-[var(--ink-3)] font-ui font-medium">Active streak</p>
                  <div className="flex items-baseline gap-1 my-1.5">
                    <span className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight leading-none">
                      12
                    </span>
                    <span className="text-xs text-[var(--ink-3)] font-ui font-medium">days</span>
                  </div>
                  <p className="font-data text-[9px] text-[#F59E0B] font-semibold tracking-wider flex items-center gap-1">
                    <Flame className="w-3 h-3 text-[#F59E0B]" /> ALL-TIME BEST: 19 DAYS
                  </p>
                </div>

                <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-md)] p-4 flex flex-col justify-between hover:border-[rgba(56,189,248,0.3)] transition-colors">
                  <p className="text-xs text-[var(--ink-3)] font-ui font-medium">Total visits (90D)</p>
                  <div className="flex items-baseline gap-1 my-1.5">
                    <span className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight leading-none">
                      38
                    </span>
                    <span className="text-xs text-[var(--ink-3)] font-ui font-medium">visits</span>
                  </div>
                  <p className="font-data text-[9px] text-[var(--ok)] font-semibold tracking-wider">
                    ▲ TOP 10% ATTENDANCE
                  </p>
                </div>

                <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-md)] p-4 flex flex-col justify-between hover:border-[rgba(56,189,248,0.3)] transition-colors">
                  <p className="text-xs text-[var(--ink-3)] font-ui font-medium">Weekly frequency</p>
                  <div className="flex items-baseline gap-1 my-1.5">
                    <span className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight leading-none">
                      4.2
                    </span>
                    <span className="text-xs text-[var(--ink-3)] font-ui font-medium">/ week</span>
                  </div>
                  <p className="font-data text-[9px] text-[#38BDF8] font-semibold tracking-wider">
                    TARGET: 4.0 SESSIONS
                  </p>
                </div>

                <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-md)] p-4 flex flex-col justify-between hover:border-[rgba(56,189,248,0.3)] transition-colors">
                  <p className="text-xs text-[var(--ink-3)] font-ui font-medium">Turnstile success</p>
                  <div className="flex items-baseline gap-1 my-1.5">
                    <span className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight leading-none">
                      100%
                    </span>
                  </div>
                  <p className="font-data text-[9px] text-[var(--ok)] font-semibold tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-[var(--ok)]" /> ZERO NFC FAILURES
                  </p>
                </div>
              </div>

              {/* Recent Visits Timeline */}
              <div className="member-sec pt-3">
                <h3>Recent studio entries</h3>
                <span className="text-xs text-[var(--ink-3)]">Powai Flagship</span>
              </div>

              <div className="space-y-2">
                <div className="member-lrow">
                  <div className="member-lic" style={{ background: 'var(--t2)' }}>
                    <CheckCircle2 className="w-4 h-4 text-[#38BDF8]" />
                  </div>
                  <div className="member-lt">
                    <b>Gym Floor Check-in · 7:15 PM</b>
                    <span>Tuesday, 1 Sep · Turnstile 01</span>
                  </div>
                </div>

                <div className="member-lrow">
                  <div className="member-lic" style={{ background: 'rgba(167,139,250,0.15)' }}>
                    <Activity className="w-4 h-4 text-[#A78BFA]" />
                  </div>
                  <div className="member-lt">
                    <b>Reformer Pilates with Hemant · 10:00 AM</b>
                    <span>Sunday, 30 Aug · Studio B</span>
                  </div>
                </div>

                <div className="member-lrow">
                  <div className="member-lic" style={{ background: 'var(--t1)' }}>
                    <Award className="w-4 h-4 text-[#4D8DFF]" />
                  </div>
                  <div className="member-lt">
                    <b>PT Session with Rohan · 6:45 PM</b>
                    <span>Friday, 28 Aug · Studio A</span>
                  </div>
                </div>

                <div className="member-lrow">
                  <div className="member-lic" style={{ background: 'var(--t2)' }}>
                    <CheckCircle2 className="w-4 h-4 text-[#38BDF8]" />
                  </div>
                  <div className="member-lt">
                    <b>Gym Floor Check-in · 7:30 PM</b>
                    <span>Wednesday, 26 Aug · Turnstile 02</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: 35-Day Heatmap & Peak Hours */}
            <div className="md:col-span-6 space-y-4">
              <div className="member-sec">
                <h3>35-Day activity heatmap</h3>
                <span className="text-xs text-[var(--ink-2)]">Aug – Sep &apos;26</span>
              </div>

              <div className="member-card p-4 sm:p-5">
                <div className="grid grid-cols-7 gap-1.5 text-center">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                    <span key={i} className="text-[10px] text-[var(--ink-3)] font-ui font-medium py-1">
                      {d}
                    </span>
                  ))}
                  {attendanceCalendar.map((c, i) => (
                    <div
                      key={i}
                      className={cn(
                        'aspect-square rounded-lg flex items-center justify-center text-[10px] font-mono transition-all',
                        c.attended
                          ? c.type === 'floor'
                            ? 'bg-[#38BDF8] text-[#05070E] font-bold shadow-[0_0_8px_rgba(56,189,248,0.5)]'
                            : c.type === 'class'
                            ? 'bg-[#A78BFA] text-[#05070E] font-bold shadow-[0_0_8px_rgba(167,139,250,0.5)]'
                            : 'bg-[#3B82F6] text-white font-bold shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                          : 'bg-[rgba(255,255,255,0.04)] text-[var(--ink-3)]'
                      )}
                      title={`Day ${c.day}: ${c.attended ? 'Attended' : 'Rest day'}`}
                    >
                      {c.day}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--line)] text-[11px] text-[var(--ink-3)]">
                  <span className="flex items-center gap-1.5">
                    <i className="w-2 h-2 rounded-full bg-[#38BDF8]" /> Gym Floor
                  </span>
                  <span className="flex items-center gap-1.5">
                    <i className="w-2 h-2 rounded-full bg-[#A78BFA]" /> Class
                  </span>
                  <span className="flex items-center gap-1.5">
                    <i className="w-2 h-2 rounded-full bg-[#3B82F6]" /> PT Session
                  </span>
                </div>
              </div>

              {/* Peak Hours & Routine */}
              <div className="member-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-white">Your Studio Habits</p>
                  <span className="text-[10.5px] font-data text-[#38BDF8]">POWAI FLAGSHIP</span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[var(--line)]">
                    <span className="text-[10px] text-[var(--ink-3)] block uppercase">Peak Hour</span>
                    <span className="text-sm font-display font-semibold text-white mt-0.5 block">7:00 – 8:30 PM</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[var(--line)]">
                    <span className="text-[10px] text-[var(--ink-3)] block uppercase">Busiest Days</span>
                    <span className="text-sm font-display font-semibold text-white mt-0.5 block">Mon &amp; Thu</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  className="p-1 text-[var(--muted)] hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveMetric} className="space-y-4 pt-4">
                <div>
                  <label className="block text-xs text-[var(--ink-2)] mb-1 font-medium">
                    Body Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 68.2"
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    required
                    className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-xl px-3.5 py-2.5 text-white font-ui text-sm outline-none focus:border-[#38BDF8]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[var(--ink-2)] mb-1 font-medium">
                    Body Fat Percentage (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 16.8"
                    value={bodyFatInput}
                    onChange={(e) => setBodyFatInput(e.target.value)}
                    className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-xl px-3.5 py-2.5 text-white font-ui text-sm outline-none focus:border-[#38BDF8]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[var(--ink-2)] mb-1 font-medium">
                    Skeletal Muscle Mass (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 33.4"
                    value={muscleMassInput}
                    onChange={(e) => setMuscleMassInput(e.target.value)}
                    className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-xl px-3.5 py-2.5 text-white font-ui text-sm outline-none focus:border-[#38BDF8]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-3 rounded-full bg-gradient-to-r from-[#1E40AF] via-[#3B82F6] to-[#38BDF8] text-white font-bold text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
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
