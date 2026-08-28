'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  HeartPulse, Flame, ArrowLeft, Download,
  Activity, Sparkles, Scale, Dumbbell,
  CheckCircle, Plus, Calendar, FileText,
} from 'lucide-react'
import GlassCard from '@/components/app/ui/glass-card'
import StatCard from '@/components/app/ui/stat-card'
import { Button } from '@/components/app/ui/button'
import { StatusPill } from '@/components/app/ui/badge'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/app/ui/select'
import { getStoredMembers } from '@/lib/members'
import { toast } from '@/components/app/ui/toast'
import { cn } from '@/lib/utils'

export default function InBodyAnalyticsPage() {
  const members = getStoredMembers()
  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.id || 'mem_001')

  const selectedMember = members.find((m) => m.id === selectedMemberId) || members[0]

  const scanHistory = [
    { date: '2026-08-20', weight: 78.5, smm: 37.2, bfm: 11.6, pbf: 14.8, bmi: 23.4, vfl: 4, score: 84 },
    { date: '2026-07-15', weight: 80.2, smm: 36.5, bfm: 13.0, pbf: 16.2, bmi: 23.9, vfl: 5, score: 80 },
    { date: '2026-06-10', weight: 82.0, smm: 35.8, bfm: 15.1, pbf: 18.4, bmi: 24.5, vfl: 6, score: 76 },
  ]

  const latest = scanHistory[0]

  const segmentalLean = [
    { segment: 'Right Arm', mass: '3.85 kg', pct: 108, status: 'Normal' },
    { segment: 'Left Arm', mass: '3.82 kg', pct: 107, status: 'Normal' },
    { segment: 'Trunk (Torso)', mass: '28.40 kg', pct: 112, status: 'High' },
    { segment: 'Right Leg', mass: '9.45 kg', pct: 104, status: 'Normal' },
    { segment: 'Left Leg', mass: '9.40 kg', pct: 103, status: 'Normal' },
  ]

  const handleExportPdf = () => {
    toast.success(`InBody 770 Assessment Report Exported`, {
      description: `Downloaded report for ${selectedMember?.name || 'Member'}.`,
    })
  }

  const handleNewScan = () => {
    toast.success('InBody 770 Scan Synchronized via Bluetooth / USB')
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/members"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--app-text-muted)] hover:text-[var(--app-text-secondary)] transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Member Directory
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--app-text-primary)] tracking-tight">
              InBody 770 Body Composition Diagnostics
            </h1>
            <span className="text-xs uppercase font-bold px-2 py-0.5 rounded bg-[var(--app-success)]/10 text-[var(--app-success)] border border-[var(--app-success)]/20">
              Gold Standard BIA
            </span>
          </div>
          <p className="text-xs text-[var(--app-text-muted)] mt-1">
            Segmental lean analysis, visceral fat grading, and skeletal muscle hypertrophy tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-52">
            <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} ({m.memberCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportPdf}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Print PDF Sheet
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleNewScan}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            New InBody Scan
          </Button>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="InBody Overall Score"
          value={latest.score}
          suffix=" / 100"
          icon={<HeartPulse className="w-5 h-5 text-[var(--aurora-1)]" />}
        />
        <StatCard
          label="Skeletal Muscle Mass (SMM)"
          value={latest.smm}
          suffix=" kg"
          icon={<Dumbbell className="w-5 h-5 text-[var(--app-success)]" />}
        />
        <StatCard
          label="Percent Body Fat (PBF)"
          value={`${latest.pbf}%`}
          icon={<Flame className="w-5 h-5 text-[var(--app-warning)]" />}
        />
        <StatCard
          label="Visceral Fat Level"
          value={`Level ${latest.vfl}`}
          icon={<Activity className="w-5 h-5 text-[var(--app-info)]" />}
        />
      </div>

      {/* Grid: Body Composition Analysis + Segmental Lean Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Detailed Body Composition Breakdown */}
        <GlassCard padding="lg" className="lg:col-span-7 space-y-4">
          <div className="border-b border-[var(--app-glass-border)] pb-3 flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-[var(--app-text-primary)]">
              Core Biomarkers Breakdown ({selectedMember?.name})
            </h3>
            <span className="text-xs font-mono text-[var(--app-text-muted)]">
              Latest Scan: {latest.date}
            </span>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[var(--app-text-secondary)]">Total Weight</span>
                <span className="font-bold text-[var(--app-text-primary)]">{latest.weight} kg</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[var(--app-glass-bg)] overflow-hidden border border-[var(--app-glass-border)]">
                <div className="h-full rounded-full bg-[var(--aurora-1)]" style={{ width: '70%' }} />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[var(--app-text-secondary)]">Skeletal Muscle Mass (SMM)</span>
                <span className="font-bold text-[var(--app-success)]">{latest.smm} kg (+1.4kg over 60d)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[var(--app-glass-bg)] overflow-hidden border border-[var(--app-glass-border)]">
                <div className="h-full rounded-full bg-[var(--app-success)]" style={{ width: '82%' }} />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[var(--app-text-secondary)]">Body Fat Mass (BFM)</span>
                <span className="font-bold text-[var(--app-warning)]">{latest.bfm} kg (-3.5kg over 60d)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[var(--app-glass-bg)] overflow-hidden border border-[var(--app-glass-border)]">
                <div className="h-full rounded-full bg-[var(--app-warning)]" style={{ width: '35%' }} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[var(--app-glass-border)] text-center text-xs font-mono">
              <div className="p-2.5 rounded-xl glass-input">
                <span className="text-[0.625rem] text-[var(--app-text-muted)] block">BMI</span>
                <span className="font-bold text-sm text-[var(--app-text-primary)]">{latest.bmi}</span>
              </div>
              <div className="p-2.5 rounded-xl glass-input">
                <span className="text-[0.625rem] text-[var(--app-text-muted)] block">BMR</span>
                <span className="font-bold text-sm text-[var(--aurora-1)]">1,840 kcal</span>
              </div>
              <div className="p-2.5 rounded-xl glass-input">
                <span className="text-[0.625rem] text-[var(--app-text-muted)] block">ECW Ratio</span>
                <span className="font-bold text-sm text-[var(--app-success)]">0.378</span>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Right: Segmental Lean Analysis */}
        <GlassCard padding="lg" className="lg:col-span-5 space-y-4">
          <div className="border-b border-[var(--app-glass-border)] pb-3">
            <h3 className="font-display text-base font-semibold text-[var(--app-text-primary)]">
              Segmental Lean Analysis
            </h3>
            <p className="text-xs text-[var(--app-text-muted)] mt-0.5">
              Muscle mass distribution across body limbs.
            </p>
          </div>

          <div className="space-y-3">
            {segmentalLean.map((seg) => (
              <div key={seg.segment} className="p-3 rounded-xl glass-input space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[var(--app-text-primary)]">{seg.segment}</span>
                  <span className="font-mono font-bold text-[var(--aurora-1)]">{seg.mass}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[var(--app-glass-bg)] overflow-hidden border border-[var(--app-glass-border)]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--aurora-1)] to-[var(--aurora-2)]"
                    style={{ width: `${Math.min(100, seg.pct)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[0.6875rem] font-mono text-[var(--app-text-muted)]">
                  <span>Evaluation: {seg.status}</span>
                  <span>{seg.pct}% of Normal</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Historical Scans Table */}
      <GlassCard padding="lg" className="space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--app-glass-border)] pb-3">
          <h3 className="font-display text-base font-semibold text-[var(--app-text-primary)]">
            Historical Scan Timeline
          </h3>
          <span className="text-xs font-mono text-[var(--app-text-muted)]">
            {scanHistory.length} Recorded Scans
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[var(--app-glass-border)] text-[0.625rem] uppercase tracking-wider text-[var(--app-text-muted)]">
                <th className="py-2.5 px-3">Scan Date</th>
                <th className="py-2.5 px-3">Weight (kg)</th>
                <th className="py-2.5 px-3">SMM (kg)</th>
                <th className="py-2.5 px-3">BFM (kg)</th>
                <th className="py-2.5 px-3">Body Fat %</th>
                <th className="py-2.5 px-3">BMI</th>
                <th className="py-2.5 px-3">Visceral Fat</th>
                <th className="py-2.5 px-3 text-right">InBody Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--app-glass-border)]">
              {scanHistory.map((scan) => (
                <tr key={scan.date}>
                  <td className="py-2.5 px-3 font-sans font-semibold text-[var(--app-text-primary)]">{scan.date}</td>
                  <td className="py-2.5 px-3 font-bold">{scan.weight} kg</td>
                  <td className="py-2.5 px-3 text-[var(--app-success)] font-bold">{scan.smm} kg</td>
                  <td className="py-2.5 px-3 text-[var(--app-warning)]">{scan.bfm} kg</td>
                  <td className="py-2.5 px-3 text-[var(--aurora-1)] font-bold">{scan.pbf}%</td>
                  <td className="py-2.5 px-3">{scan.bmi}</td>
                  <td className="py-2.5 px-3">Level {scan.vfl}</td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="px-2 py-0.5 rounded-full bg-[var(--aurora-1)]/10 text-[var(--aurora-1)] font-bold border border-[var(--aurora-1)]/20">
                      {scan.score} / 100
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  )
}
