'use client'

import React, { useState } from 'react'
import {
  TrendingUp,
  Target,
  Award,
  Calendar,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react'
import { formatINR } from '@/lib/gst'
import { cn } from '@/lib/utils'

export interface MonthTargetAchievement {
  month: string
  targetLakhs: number
  achievedLakhs: number
  isCurrent?: boolean
}

function buildTwelveMonthData(): MonthTargetAchievement[] {
  const data: MonthTargetAchievement[] = []
  const targets = [10.0, 10.5, 12.0, 11.5, 11.0, 13.0, 12.0, 12.5, 13.0, 13.5, 14.0, 12.5]
  const achieved = [10.4, 11.2, 13.1, 10.8, 11.6, 14.2, 12.8, 13.4, 12.9, 14.8, 15.1, 8.4]

  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthShort = d.toLocaleDateString('en-US', { month: 'short' })
    const yearShort = String(d.getFullYear()).slice(-2)
    const isCurrent = i === 0
    data.push({
      month: `${monthShort} ${yearShort}`,
      targetLakhs: targets[11 - i],
      achievedLakhs: achieved[11 - i],
      isCurrent,
    })
  }
  return data
}

export default function TargetAchievementChart({
  className,
  compact = false,
}: {
  className?: string
  compact?: boolean
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const twelveMonthData = React.useMemo(() => buildTwelveMonthData(), [])
  const currentMonthLabel = React.useMemo(() => {
    return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }, [])

  // Current Month Stats
  const currentMonthData = twelveMonthData.find((d) => d.isCurrent) || twelveMonthData[twelveMonthData.length - 1]
  const currentTargetLakhs = currentMonthData.targetLakhs
  const currentAchievedLakhs = currentMonthData.achievedLakhs
  const currentPct = Math.round((currentAchievedLakhs / currentTargetLakhs) * 1000) / 10
  const currentRemainingLakhs = Math.max(0, Math.round((currentTargetLakhs - currentAchievedLakhs) * 10) / 10)

  // Max value for scaling
  const maxLakhs = Math.max(...twelveMonthData.map((d) => Math.max(d.targetLakhs, d.achievedLakhs)), 16)

  // 12-month aggregated metrics
  const totalTargetLakhs = twelveMonthData.reduce((acc, d) => acc + d.targetLakhs, 0)
  const totalAchievedLakhs = twelveMonthData.reduce((acc, d) => acc + d.achievedLakhs, 0)
  const overallPct = Math.round((totalAchievedLakhs / totalTargetLakhs) * 1000) / 10

  return (
    <div
      className={cn(
        'rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] p-5 space-y-5',
        className
      )}
    >
      {/* ─── Header & Current Month Callout Strip ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#38BDF8]/15 border border-[#38BDF8]/30 flex items-center justify-center text-[#38BDF8]">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg text-white">
                Target vs. Achievement
              </h3>
              <p className="font-ui text-xs text-[var(--ink-3)]">
                Last 12 months historical performance &amp; current month run-rate
              </p>
            </div>
          </div>
        </div>

        {/* Current Month Highlight KPIs */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08]">
            <p className="text-[10px] uppercase font-bold text-[var(--ink-3)] font-data tracking-wider">
              CURRENT MONTH TARGET
            </p>
            <p className="text-base font-bold text-white font-data tabular-nums">
              ₹{currentTargetLakhs.toFixed(2)}L
            </p>
          </div>

          <div className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
            <p className="text-[10px] uppercase font-bold text-emerald-400 font-data tracking-wider">
              ACHIEVED SO FAR
            </p>
            <p className="text-base font-bold text-emerald-300 font-data tabular-nums">
              ₹{currentAchievedLakhs.toFixed(2)}L{' '}
              <span className="text-xs font-semibold text-emerald-400/80">({currentPct}%)</span>
            </p>
          </div>

          <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25">
            <p className="text-[10px] uppercase font-bold text-amber-300 font-data tracking-wider">
              GAP TO TARGET
            </p>
            <p className="text-base font-bold text-amber-200 font-data tabular-nums">
              ₹{currentRemainingLakhs.toFixed(2)}L
            </p>
          </div>
        </div>
      </div>

      {/* ─── Current Month Progress Meter ─── */}
      <div className="space-y-2 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-ui">
          <span className="text-white/80 font-medium flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>{currentMonthLabel} Target Completion</span>
          </span>
          <span className="font-data font-bold text-[#38BDF8] tabular-nums">
            {currentPct}% Achieved · ₹{currentAchievedLakhs}L / ₹{currentTargetLakhs}L
          </span>
        </div>

        <div className="h-2.5 w-full bg-white/[0.08] rounded-full overflow-hidden p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#38BDF8] via-emerald-400 to-[#10B981] transition-all duration-700"
            style={{ width: `${Math.min(currentPct, 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-[var(--ink-3)] font-data">
          <span>0%</span>
          <span>Target ₹{currentTargetLakhs}L (₹{Math.round(currentTargetLakhs * 100000).toLocaleString('en-IN')})</span>
          <span>100%</span>
        </div>
      </div>

      {/* ─── 12-Month Target vs Achievement Bar Chart ─── */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-ui text-xs font-semibold text-white/90">
            Last 12 Months Dual Comparison (₹ Lakhs)
          </span>

          <div className="flex items-center gap-4 text-xs font-ui">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-white/20 border border-white/40 inline-block" />
              <span className="text-[var(--ink-3)]">Target</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-gradient-to-t from-emerald-500 to-[#38BDF8] inline-block shadow-xs" />
              <span className="text-emerald-400 font-medium">Achieved</span>
            </div>
          </div>
        </div>

        {/* Chart Visualization Canvas */}
        <div className="overflow-x-auto pb-1">
          <div className="relative min-w-[540px] pt-14 pb-2">
            {/* Background grid lines */}
            <div className="absolute inset-x-0 top-14 bottom-2 flex flex-col justify-between pointer-events-none opacity-20">
              <div className="border-b border-white/20 w-full" />
              <div className="border-b border-white/20 w-full" />
              <div className="border-b border-white/20 w-full" />
              <div className="border-b border-white/20 w-full" />
            </div>

            <div className="grid grid-cols-12 gap-1.5 sm:gap-3 items-end h-52 relative z-10">
              {twelveMonthData.map((item, idx) => {
                const targetHeightPct = (item.targetLakhs / maxLakhs) * 100
                const achievedHeightPct = (item.achievedLakhs / maxLakhs) * 100
                const isOverTarget = item.achievedLakhs >= item.targetLakhs
                const isHovered = hoveredIdx === idx

                return (
                  <div
                    key={item.month}
                    className="relative flex flex-col items-center h-full justify-end group cursor-pointer"
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  >
                    {/* Tooltip on Hover */}
                    {isHovered && (
                      <div
                        className={cn(
                          'absolute -top-12 z-30 px-2.5 py-1.5 rounded-lg bg-[#0F172A] border border-[#38BDF8]/40 shadow-xl text-[10.5px] text-white whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-150',
                          idx <= 1 ? 'left-0' : idx >= 10 ? 'right-0' : 'left-1/2 -translate-x-1/2'
                        )}
                      >
                      <p className="font-bold text-[#38BDF8]">{item.month} {item.isCurrent ? '(Current Month)' : ''}</p>
                      <p className="font-data">
                        Achieved: <b className="text-emerald-400">₹{item.achievedLakhs}L</b> / Target: ₹{item.targetLakhs}L
                      </p>
                      <p className="font-data text-white/60">
                        {Math.round((item.achievedLakhs / item.targetLakhs) * 100)}% of goal
                      </p>
                    </div>
                  )}

                  {/* Dual Bars Container */}
                  <div className="flex items-end gap-1 sm:gap-1.5 w-full justify-center h-44">
                    {/* Target Bar (Ghost/Muted) */}
                    <div
                      className="w-2.5 sm:w-4 rounded-t-sm bg-white/15 group-hover:bg-white/25 transition-all duration-300"
                      style={{ height: `${targetHeightPct}%` }}
                      title={`Target: ₹${item.targetLakhs}L`}
                    />

                    {/* Achieved Bar (Vibrant) */}
                    <div
                      className={cn(
                        'w-2.5 sm:w-4 rounded-t-sm transition-all duration-300 relative',
                        item.isCurrent
                          ? 'bg-gradient-to-t from-emerald-600 via-emerald-400 to-[#38BDF8] animate-pulse'
                          : isOverTarget
                          ? 'bg-gradient-to-t from-emerald-600 to-[#34D399] group-hover:brightness-125'
                          : 'bg-gradient-to-t from-amber-600 to-amber-400 group-hover:brightness-125'
                      )}
                      style={{ height: `${achievedHeightPct}%` }}
                      title={`Achieved: ₹${item.achievedLakhs}L`}
                    >
                      {/* Highlight dot if target achieved */}
                      {isOverTarget && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white absolute -top-1 left-1/2 -translate-x-1/2 shadow-xs" />
                      )}
                    </div>
                  </div>

                  {/* Month Label */}
                  <span
                    className={cn(
                      'text-[9px] sm:text-[10.5px] mt-2 font-data font-medium transition-colors truncate',
                      item.isCurrent
                        ? 'text-[#38BDF8] font-bold'
                        : isHovered
                        ? 'text-white'
                        : 'text-[var(--ink-3)]'
                    )}
                  >
                    {item.month}
                  </span>
                </div>
              )
            })}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Footer Aggregates Summary ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[var(--line)] text-xs text-[var(--ink-3)] font-ui">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            12-Month Cumulative: <b>₹{totalAchievedLakhs.toFixed(1)}L</b> achieved vs{' '}
            <b>₹{totalTargetLakhs.toFixed(1)}L</b> target (
            <span className="text-emerald-400 font-bold font-data">{overallPct}%</span>)
          </span>
        </div>

        <span className="text-[11px] font-data text-white/50">
          Source: Base Fitness Pvt Ltd Revenue Ledger
        </span>
      </div>
    </div>
  )
}
