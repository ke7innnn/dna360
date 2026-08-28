'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  TrendingUp, DollarSign, Users, Activity,
  PieChart, Building2, Download, ShieldCheck,
  Calendar, Trophy, Sparkles, ArrowUpRight,
  Receipt, Dumbbell, ShoppingBag, Flame,
} from 'lucide-react'
import GlassCard from '@/components/app/ui/glass-card'
import StatCard from '@/components/app/ui/stat-card'
import { DataTable, type DataTableColumn } from '@/components/app/ui/data-table'
import { Button } from '@/components/app/ui/button'
import { StatusPill } from '@/components/app/ui/badge'
import ChurnRiskRadar from '@/components/app/analytics/ChurnRiskRadar'
import {
  getExecutiveKpis,
  getBranchPerformance,
  getRevenueMix,
  getCohortData,
  getGstTaxReport,
} from '@/lib/analytics'
import { formatINR } from '@/lib/utils'
import { toast } from '@/components/app/ui/toast'
import { cn } from '@/lib/utils'

export default function OverviewPage() {
  const kpis = getExecutiveKpis()
  const branches = getBranchPerformance()
  const revenueMix = getRevenueMix()
  const cohorts = getCohortData()
  const gst = getGstTaxReport()

  const handleExportGstr1 = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['SAC Code,Description,Taxable Value (INR),CGST (9%),SGST (9%),Total 18% GST (INR),Invoice Count']
        .concat(
          `"${gst.sacCode}","Gymnasium & Fitness Centre Services","${gst.taxableValueMinor / 100}","${gst.cgstMinor / 100}","${gst.sgstMinor / 100}","${gst.totalTaxMinor / 100}","${gst.invoiceCount}"`
        )

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `dna360_gstr1_report_aug_2026.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('GSTR-1 Tax Summary CSV exported successfully')
  }

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-[var(--aurora-1)]">
            Executive Command Suite
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--app-text-primary)] tracking-tight mt-0.5">
            Executive Overview & Financial Intelligence
          </h1>
          <p className="text-sm text-[var(--app-text-secondary)] mt-1">
            Real-time MRR/ARR analytics, branch performance, cohort retention curves, and AI churn radar.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportGstr1}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export GSTR-1 Report
          </Button>
          <Link href="/billing">
            <Button variant="primary" size="sm" icon={<Receipt className="w-3.5 h-3.5" />}>
              Billing & Invoices Hub
            </Button>
          </Link>
        </div>
      </div>

      {/* Top 6 Macro KPI StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          label="Monthly Rec. Revenue"
          value={kpis.mrrMinor}
          prefix="₹"
          formatValue={(v) => formatINR(v).replace('₹', '')}
          change={{ value: kpis.mrrGrowthPct, type: 'increase' }}
          icon={<TrendingUp className="w-5 h-5 text-[var(--aurora-1)]" />}
        />
        <StatCard
          label="Annual Run Rate (ARR)"
          value={kpis.arrMinor}
          prefix="₹"
          formatValue={(v) => formatINR(v).replace('₹', '')}
          icon={<DollarSign className="w-5 h-5 text-[var(--app-success)]" />}
        />
        <StatCard
          label="Total Active Members"
          value={kpis.totalActiveMembers}
          suffix=" members"
          change={{ value: 8.2, type: 'increase' }}
          icon={<Users className="w-5 h-5 text-[var(--app-info)]" />}
        />
        <StatCard
          label="Avg Revenue / Member"
          value={kpis.arpmMinor}
          prefix="₹"
          formatValue={(v) => formatINR(v).replace('₹', '')}
          icon={<Activity className="w-5 h-5 text-[var(--aurora-2)]" />}
        />
        <StatCard
          label="Monthly Churn Rate"
          value={`${kpis.churnRatePct}%`}
          change={{ value: 0.9, type: 'decrease' }}
          icon={<Flame className="w-5 h-5 text-[var(--app-warning)]" />}
        />
        <StatCard
          label="18% GST Liability MTD"
          value={kpis.gstCollectedMinor}
          prefix="₹"
          formatValue={(v) => formatINR(v).replace('₹', '')}
          icon={<Receipt className="w-5 h-5 text-[var(--app-text-muted)]" />}
        />
      </div>

      {/* Grid: Multi-Branch Performance + Revenue Mix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Branch Comparison Cards */}
        <GlassCard padding="md" className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--app-glass-border)] pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[var(--aurora-1)]" />
              <h3 className="font-display text-sm font-semibold text-[var(--app-text-primary)]">
                Multi-Branch Performance Comparison
              </h3>
            </div>
            <span className="text-xs font-mono text-[var(--app-text-muted)]">2 Active Clubs</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {branches.map((branch) => (
              <div
                key={branch.branchId}
                className="p-4 rounded-2xl glass-input space-y-3 border border-[var(--app-glass-border)]"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-display text-sm font-bold text-[var(--app-text-primary)]">
                    {branch.branchName}
                  </h4>
                  <span className="text-xs font-mono font-bold text-[var(--app-success)]">
                    +{branch.growthPct}% MoM
                  </span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-[var(--app-text-secondary)]">Monthly Billed:</span>
                    <span className="font-bold text-[var(--app-text-primary)]">
                      {formatINR(branch.monthlyRevenueMinor)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--app-text-secondary)]">Active Members:</span>
                    <span>{branch.memberCount} members</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--app-text-secondary)]">PT Sessions Delivered:</span>
                    <span>{branch.ptSessionsDelivered} sessions</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--app-text-secondary)]">Peak Occupancy:</span>
                    <span className="text-[var(--aurora-1)]">{branch.occupancyPct}% full</span>
                  </div>
                </div>

                <div className="w-full h-1.5 rounded-full bg-[var(--app-glass-bg)] overflow-hidden border border-[var(--app-glass-border)]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--aurora-1)] to-[var(--aurora-2)]"
                    style={{ width: `${branch.occupancyPct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Revenue Stream Mix */}
        <GlassCard padding="md" className="lg:col-span-4 space-y-4">
          <div className="border-b border-[var(--app-glass-border)] pb-3">
            <h3 className="font-display text-sm font-semibold text-[var(--app-text-primary)] flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[var(--aurora-1)]" />
              <span>Revenue Stream Mix</span>
            </h3>
            <p className="text-xs text-[var(--app-text-muted)] mt-0.5">
              Income distribution by business vertical.
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-[var(--app-text-secondary)] flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[var(--aurora-1)]" />
                  Membership Plans
                </span>
                <span className="font-mono font-bold text-[var(--app-text-primary)]">{revenueMix.membershipPct}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[var(--app-glass-bg)] overflow-hidden border border-[var(--app-glass-border)]">
                <div className="h-full rounded-full bg-[var(--aurora-1)]" style={{ width: `${revenueMix.membershipPct}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-[var(--app-text-secondary)] flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[var(--app-success)]" />
                  Personal Training
                </span>
                <span className="font-mono font-bold text-[var(--app-text-primary)]">{revenueMix.ptPct}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[var(--app-glass-bg)] overflow-hidden border border-[var(--app-glass-border)]">
                <div className="h-full rounded-full bg-[var(--app-success)]" style={{ width: `${revenueMix.ptPct}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-[var(--app-text-secondary)] flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[var(--app-warning)]" />
                  Retail Cafe & POS
                </span>
                <span className="font-mono font-bold text-[var(--app-text-primary)]">{revenueMix.retailPct}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[var(--app-glass-bg)] overflow-hidden border border-[var(--app-glass-border)]">
                <div className="h-full rounded-full bg-[var(--app-warning)]" style={{ width: `${revenueMix.retailPct}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-[var(--app-text-secondary)] flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[var(--app-info)]" />
                  Lockers & Guest Passes
                </span>
                <span className="font-mono font-bold text-[var(--app-text-primary)]">{revenueMix.lockersPct}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[var(--app-glass-bg)] overflow-hidden border border-[var(--app-glass-border)]">
                <div className="h-full rounded-full bg-[var(--app-info)]" style={{ width: `${revenueMix.lockersPct}%` }} />
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* 12-Month Cohort Retention Heatmap */}
      <GlassCard padding="md" className="space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--app-glass-border)] pb-3">
          <div>
            <h3 className="font-display text-sm font-semibold text-[var(--app-text-primary)] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[var(--aurora-1)]" />
              <span>12-Month Member Cohort Retention Curves</span>
            </h3>
            <p className="text-xs text-[var(--app-text-muted)] mt-0.5">
              Percentage of members retained after 1, 3, 6, and 12 months from join date.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[var(--app-glass-border)] text-[0.625rem] uppercase tracking-wider text-[var(--app-text-muted)]">
                <th className="py-2.5 px-3">Join Cohort</th>
                <th className="py-2.5 px-3">Cohort Size</th>
                <th className="py-2.5 px-3 text-center">Month 1</th>
                <th className="py-2.5 px-3 text-center">Month 3</th>
                <th className="py-2.5 px-3 text-center">Month 6</th>
                <th className="py-2.5 px-3 text-center">Month 12</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--app-glass-border)]">
              {cohorts.map((c) => (
                <tr key={c.cohort}>
                  <td className="py-2.5 px-3 font-sans font-semibold text-[var(--app-text-primary)]">{c.cohort}</td>
                  <td className="py-2.5 px-3 text-[var(--app-text-muted)]">{c.size} members</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2 py-0.5 rounded bg-[var(--app-success)]/10 text-[var(--app-success)] font-bold">
                      {c.month1}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2 py-0.5 rounded bg-[var(--aurora-1)]/10 text-[var(--aurora-1)] font-bold">
                      {c.month3}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2 py-0.5 rounded bg-[var(--app-warning)]/10 text-[var(--app-warning)] font-bold">
                      {c.month6}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2 py-0.5 rounded bg-[var(--app-info)]/10 text-[var(--app-info)] font-bold">
                      {c.month12}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* AI Churn Risk Radar */}
      <ChurnRiskRadar />
    </div>
  )
}
