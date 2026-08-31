'use client'

import React, { useState } from 'react'
import { TrendingUp, Calendar, DollarSign, Sparkles } from 'lucide-react'
import Card from '@/components/app/ui/glass-card'
import Badge from '@/components/app/ui/badge'
import { getRenewalForecast, type HorizonForecast } from '@/lib/forecast'
import { formatINR } from '@/lib/gst'

export default function RenewalForecast() {
  const [forecasts] = useState<HorizonForecast[]>(() => getRenewalForecast())
  const [selectedScenario, setSelectedScenario] = useState<'low' | 'base' | 'high'>('base')

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--line)] pb-4 mb-4 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display font-semibold text-base text-[var(--ink)]">
              Forward Renewal Collections Projection
            </h3>
            <Badge status="ok" size="sm">
              Predictive Model
            </Badge>
          </div>
          <p className="font-ui text-xs text-[var(--muted)] mt-0.5">
            Scenario forecast across upcoming expiration cohorts
          </p>
        </div>

        {/* Scenario Toggle */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] self-start sm:self-auto">
          <button
            onClick={() => setSelectedScenario('low')}
            className={`px-3 py-1 rounded-lg text-xs font-ui font-semibold transition-all cursor-pointer ${
              selectedScenario === 'low'
                ? 'bg-[var(--amber)] text-black shadow-sm'
                : 'text-[var(--muted)] hover:text-white'
            }`}
          >
            Conservative (65%)
          </button>
          <button
            onClick={() => setSelectedScenario('base')}
            className={`px-3 py-1 rounded-lg text-xs font-ui font-semibold transition-all cursor-pointer ${
              selectedScenario === 'base'
                ? 'bg-[var(--accent)] text-white shadow-sm'
                : 'text-[var(--muted)] hover:text-white'
            }`}
          >
            Historical Base (78%)
          </button>
          <button
            onClick={() => setSelectedScenario('high')}
            className={`px-3 py-1 rounded-lg text-xs font-ui font-semibold transition-all cursor-pointer ${
              selectedScenario === 'high'
                ? 'bg-[var(--green)] text-black shadow-sm'
                : 'text-[var(--muted)] hover:text-white'
            }`}
          >
            Target (90%)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {forecasts.map((f) => {
          const scenario = f.scenarios[selectedScenario]

          return (
            <div
              key={f.days}
              className="p-4 rounded-xl bg-gradient-to-b from-[rgba(255,255,255,0.03)] to-[rgba(255,255,255,0.01)] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(59,130,246,0.3)] space-y-3 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <span className="font-ui font-bold text-xs text-[var(--muted)] uppercase tracking-wider">
                  {f.label}
                </span>
                <span className="text-[11px] font-ui font-semibold text-[var(--accent)] bg-[rgba(59,130,246,0.1)] px-2 py-0.5 rounded-full">
                  {f.expiringCount} expiries
                </span>
              </div>

              <div>
                <span className="font-display font-bold text-2xl text-[var(--ink)] tracking-tight">
                  {formatINR(scenario.projectedCollectionsMinor)}
                </span>
                <span className="font-ui text-xs text-[var(--muted)] block mt-0.5">
                  Projected cash collections ({scenario.ratePct}% conversion)
                </span>
              </div>

              <div className="pt-2 border-t border-[rgba(255,255,255,0.04)] flex items-center justify-between text-[11px] font-data text-[var(--muted)]">
                <span>Gross Value at Risk:</span>
                <span className="text-[var(--ink-2)] font-semibold">
                  {formatINR(f.totalGrossValueMinor)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
