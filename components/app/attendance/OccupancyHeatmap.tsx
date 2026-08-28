'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Flame, Clock, Users, Calendar, TrendingUp } from 'lucide-react'
import GlassCard from '@/components/app/ui/glass-card'
import { cn } from '@/lib/utils'

export default function OccupancyHeatmap() {
  // Hourly distribution data (06:00 to 22:00)
  const hourlyData = [
    { hour: '06:00', count: 24, isPeak: false },
    { hour: '07:00', count: 58, isPeak: true, label: 'Morning Peak' },
    { hour: '08:00', count: 64, isPeak: true, label: 'Morning Peak' },
    { hour: '09:00', count: 46, isPeak: false },
    { hour: '10:00', count: 28, isPeak: false },
    { hour: '11:00', count: 18, isPeak: false },
    { hour: '12:00', count: 14, isPeak: false },
    { hour: '13:00', count: 12, isPeak: false },
    { hour: '14:00', count: 15, isPeak: false },
    { hour: '15:00', count: 19, isPeak: false },
    { hour: '16:00', count: 32, isPeak: false },
    { hour: '17:00', count: 52, isPeak: false },
    { hour: '18:00', count: 72, isPeak: true, label: 'Evening Peak' },
    { hour: '19:00', count: 78, isPeak: true, label: 'Max Rush' },
    { hour: '20:00', count: 60, isPeak: true, label: 'Evening Peak' },
    { hour: '21:00', count: 35, isPeak: false },
  ]

  const maxCount = 80

  const dayData = [
    { day: 'Mon', count: 248, pct: 92 },
    { day: 'Tue', count: 265, pct: 98 },
    { day: 'Wed', count: 252, pct: 94 },
    { day: 'Thu', count: 238, pct: 88 },
    { day: 'Fri', count: 215, pct: 80 },
    { day: 'Sat', count: 190, pct: 70 },
    { day: 'Sun', count: 145, pct: 54 },
  ]

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

          <div className="flex items-center gap-2 text-xs">
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
        <div className="h-44 flex items-end justify-between gap-1.5 pt-4">
          {hourlyData.map((item) => {
            const heightPct = Math.round((item.count / maxCount) * 100)
            return (
              <div key={item.hour} className="flex-1 flex flex-col items-center gap-1.5 group h-full justify-end">
                {/* Tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-[0.625rem] text-white px-1.5 py-0.5 rounded font-mono pointer-events-none whitespace-nowrap shadow-lg">
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

                <span className="text-[0.625rem] font-mono text-[var(--app-text-muted)] rotate-[-45deg] sm:rotate-0 mt-1">
                  {item.hour.slice(0, 2)}
                </span>
              </div>
            )
          })}
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
            Average check-ins by day of the week.
          </p>
        </div>

        <div className="space-y-2.5">
          {dayData.map((d) => (
            <div key={d.day} className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
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

        <div className="pt-3 border-t border-[var(--app-glass-border)] flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-[var(--app-text-muted)]">
            <Clock className="w-3.5 h-3.5" />
            <span>Average Dwell Time:</span>
          </div>
          <span className="font-mono font-bold text-[var(--aurora-1)]">74 minutes</span>
        </div>
      </GlassCard>
    </div>
  )
}
