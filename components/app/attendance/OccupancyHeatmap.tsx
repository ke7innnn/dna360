'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Flame, Clock, Users, Calendar, TrendingUp } from 'lucide-react'
import GlassCard from '@/components/app/ui/glass-card'
import { cn } from '@/lib/utils'
import { getStoredAccessLogs } from '@/lib/attendance'

export default function OccupancyHeatmap() {
  const [logs, setLogs] = React.useState(() => getStoredAccessLogs())
  React.useEffect(() => {
    const refresh = () => setLogs(getStoredAccessLogs())
    refresh()
    window.addEventListener('dna360_access_logs_updated', refresh)
    return () => window.removeEventListener('dna360_access_logs_updated', refresh)
  }, [])

  const granted = logs.filter(
    (l) => l.decision === 'GRANTED' || l.decision === 'GRANTED_GRACE_PERIOD' || l.decision === 'MANUAL_OVERRIDE'
  )
  const todayStr = new Date().toISOString().slice(0, 10)
  const todays = granted.filter((l) => l.timestamp.startsWith(todayStr))

  // Real hourly distribution for today (06:00 to 21:00)
  const hourCounts: number[] = new Array(24).fill(0)
  for (const l of todays) hourCounts[new Date(l.timestamp).getHours()]++
  const maxCount = Math.max(1, ...hourCounts.slice(6, 22))
  const hourlyData = Array.from({ length: 16 }, (_, i) => {
    const h = i + 6
    const count = hourCounts[h]
    return { hour: String(h).padStart(2, '0') + ':00', count, isPeak: count > 0 && count / maxCount >= 0.7 }
  })

  // Real weekday distribution (all recorded entries)
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const dayCounts: number[] = new Array(7).fill(0)
  for (const l of granted) dayCounts[(new Date(l.timestamp).getDay() + 6) % 7]++
  const dayMax = Math.max(1, ...dayCounts)
  const dayData = dayNames.map((day, i) => ({
    day,
    count: dayCounts[i],
    pct: Math.round((dayCounts[i] / dayMax) * 100),
  }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Hourly Footfall Chart */}
      <GlassCard padding="md" className="lg:col-span-2 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--app-glass-border)] pb-3">
          <div>
            <h3 className="font-display text-sm font-semibold text-[var(--app-text-primary)] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[var(--aurora-1)]" />
              <span>Hourly Footfall Distribution (Today)</span>
            </h3>
            <p className="text-xs text-[var(--app-text-muted)] mt-0.5">
              Live turnstile entry volume across opening hours (06:00 - 22:00 IST).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="flex items-center gap-1 text-[var(--aurora-1)]">
              <span className="w-2.5 h-2.5 rounded-sm bg-[var(--aurora-1)]" />
              <span>Regular</span>
            </span>
            <span className="flex items-center gap-1 text-[var(--app-danger)]">
              <span className="w-2.5 h-2.5 rounded-sm bg-[var(--app-danger)]" />
              <span>Peak Rush (&gt; 70%)</span>
            </span>
          </div>
        </div>

        {/* Bar Chart Container */}
        <div className="overflow-x-auto pb-1">
          <div className="h-44 min-w-[440px] flex items-end justify-between gap-1.5 pt-4">
            {hourlyData.map((item) => {
              const heightPct = Math.round((item.count / maxCount) * 100)
              return (
                <div key={item.hour} className="flex-1 flex flex-col items-center gap-1.5 group h-full justify-end">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-[0.625rem] text-white px-1.5 py-0.5 rounded font-sans tabular-nums pointer-events-none whitespace-nowrap shadow-lg">
                    {item.count} check-ins
                  </div>

                  {/* Animated bar */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPct}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className={cn(
                      'w-full rounded-t-md transition-all',
                      item.isPeak
                        ? 'bg-gradient-to-t from-[var(--app-danger)]/80 to-[var(--app-danger)] shadow-sm shadow-[var(--app-danger)]/20'
                        : 'bg-gradient-to-t from-[var(--aurora-1)]/60 to-[var(--aurora-1)]'
                    )}
                  />

                  <span className="text-[0.625rem] font-sans tabular-nums text-[var(--app-text-muted)] mt-1">
                    {item.hour.slice(0, 2)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </GlassCard>

      {/* Day of Week & Dwell Time Analytics */}
      <GlassCard padding="md" className="space-y-4">
        <div className="border-b border-[var(--app-glass-border)] pb-3">
          <h3 className="font-display text-sm font-semibold text-[var(--app-text-primary)] flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[var(--aurora-1)]" />
            <span>Weekly Rush Distribution</span>
          </h3>
          <p className="text-xs text-[var(--app-text-muted)] mt-0.5">
            Total recorded check-ins by day of the week.
          </p>
        </div>

        <div className="space-y-2.5">
          {dayData.map((d) => (
            <div key={d.day} className="space-y-1">
              <div className="flex justify-between text-xs font-sans tabular-nums">
                <span className="text-[var(--app-text-secondary)] font-medium">{d.day}</span>
                <span className="font-bold text-[var(--app-text-primary)]">{d.count} visits</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[var(--app-glass-bg)] overflow-hidden border border-[var(--app-glass-border)]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--aurora-1)] to-[var(--aurora-2)]"
                  style={{ width: `${d.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        </GlassCard>
    </div>
  )
}
