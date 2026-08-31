'use client'

import React, { useState } from 'react'
import { Flame, Clock, Users, Sparkles } from 'lucide-react'
import Card from '@/components/app/ui/glass-card'
import Badge from '@/components/app/ui/badge'
import { getAttendanceHeatmap, type DayHeatmap } from '@/lib/heatmap'

export default function AttendanceHeatmap() {
  const [heatmapData] = useState<DayHeatmap[]>(() => getAttendanceHeatmap())
  const [hoveredSlot, setHoveredSlot] = useState<{ day: string; hour: string; checkIns: number } | null>(null)

  const hours = heatmapData[0]?.slots.map((s) => s.hourLabel) || []

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--line)] pb-4 mb-4 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display font-semibold text-base text-[var(--ink)]">
              Studio Attendance Heatmap
            </h3>
            <Badge status="ok" size="sm">
              Live Gate Telemetry
            </Badge>
          </div>
          <p className="font-ui text-xs text-[var(--muted)] mt-0.5">
            Turnstile check-in density across 16 daily operating hours (6:00 AM – 10:00 PM)
          </p>
        </div>

        {/* Hovered Slot Readout */}
        {hoveredSlot ? (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(59,130,246,0.12)] border border-[rgba(59,130,246,0.30)] text-xs font-ui text-[var(--accent)] font-semibold">
            <span>{hoveredSlot.day} {hoveredSlot.hour}:</span>
            <span className="text-white font-bold">{hoveredSlot.checkIns} check-ins</span>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-[11px] font-ui text-[var(--muted)]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[rgba(59,130,246,0.15)] border border-[rgba(59,130,246,0.3)]" />
              <span>Off-Peak</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[rgba(59,130,246,0.60)] border border-[rgba(59,130,246,0.8)]" />
              <span>Standard</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[#3B82F6] shadow-[0_0_6px_#3B82F6]" />
              <span>Peak (6–9 AM / PM)</span>
            </div>
          </div>
        )}
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[620px] space-y-2">
          {/* Hours Header Row */}
          <div className="grid grid-cols-17 gap-1 text-[10px] font-ui font-semibold text-[var(--muted)] text-center">
            <div className="text-left pl-1">Day</div>
            {hours.map((h) => (
              <div key={h} className="truncate">
                {h.replace(' ', '')}
              </div>
            ))}
          </div>

          {/* Days Rows */}
          {heatmapData.map((day) => (
            <div key={day.dayName} className="grid grid-cols-17 gap-1 items-center">
              {/* Day Label */}
              <div className="font-ui text-xs font-semibold text-[var(--ink)] pl-1 text-left">
                {day.shortDay}
              </div>

              {/* 16 Hourly Heatmap Cells */}
              {day.slots.map((slot) => {
                const opacity = Math.max(0.12, slot.intensity)
                const isHighPeak = slot.intensity > 0.75

                return (
                  <div
                    key={slot.hour}
                    onMouseEnter={() =>
                      setHoveredSlot({
                        day: day.dayName,
                        hour: slot.hourLabel,
                        checkIns: slot.checkIns,
                      })
                    }
                    onMouseLeave={() => setHoveredSlot(null)}
                    style={{
                      backgroundColor: isHighPeak
                        ? 'rgba(59, 130, 246, 0.90)'
                        : `rgba(59, 130, 246, ${opacity})`,
                      boxShadow: isHighPeak ? '0 0 10px rgba(59, 130, 246, 0.5)' : undefined,
                    }}
                    className={`h-7 rounded-md transition-all duration-150 cursor-pointer border ${
                      isHighPeak
                        ? 'border-[rgba(255,255,255,0.4)]'
                        : 'border-[rgba(59,130,246,0.25)] hover:border-white hover:scale-110 z-10'
                    } flex items-center justify-center`}
                  >
                    {isHighPeak && (
                      <span className="text-[9px] font-mono font-bold text-white leading-none">
                        {slot.checkIns}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
