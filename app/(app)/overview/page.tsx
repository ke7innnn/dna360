'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  TrendingUp, Download, Receipt, Users, AlertTriangle,
  Clock, ShieldAlert, FileSignature, ArrowUpRight,
  ChevronRight, Calendar, Sparkles,
} from 'lucide-react'
import { Button } from '@/components/app/ui/button'
import { Badge } from '@/components/app/ui/badge'
import { KpiPanel } from '@/components/app/ui/KpiPanel'
import { StrandMeter } from '@/components/app/ui/StrandMeter'
import {
  getExecutiveKpis,
  getRevenueMix,
  getCohortData,
  getGstTaxReport,
} from '@/lib/analytics'
import { formatINR } from '@/lib/utils'
import { toast } from '@/components/app/ui/toast'
import { cn } from '@/lib/utils'

export default function OverviewPage() {
  const kpis = getExecutiveKpis()
  const revenueMix = getRevenueMix()
  const cohorts = getCohortData()
  const gst = getGstTaxReport()

  const [dateRange, setDateRange] = useState('Aug 2026')

  const handleExportGstr1 = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['SAC Code,Description,Taxable Value (INR),CGST (2.5%),SGST (2.5%),Total 5% GST (INR),Invoice Count']
        .concat(
          `"${gst.sacCode}","Gymnasium & Fitness Centre Services","${(gst.taxableValueMinor / 100).toFixed(2)}","${(gst.cgstMinor / 100).toFixed(2)}","${(gst.sgstMinor / 100).toFixed(2)}","${(gst.totalTaxMinor / 100).toFixed(2)}","${gst.invoiceCount}"`
        )

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `dna360_gstr1_summary_aug_2026.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('GSTR-1 Tax Summary CSV exported successfully')
  }

  // ─── 4 KPI Cells Data ───
  const kpiCells = [
    {
      label: 'MRR',
      value: '₹18.4L',
      unit: 'MONTHLY BILLED',
      hoverTitle: '₹18,40,000 (Current Month)',
      strand: { value: 85, max: 100, capsules: 5 as const },
      delta: { text: '+14.2% MTD', type: 'ok' as const },
    },
    {
      label: 'ACTIVE MEMBERS',
      value: '679',
      unit: 'LIVE MEMBERS',
      hoverTitle: '679 Verified Gymex Live Members',
      strand: { value: 679, max: 750, capsules: 5 as const },
      delta: { text: '614 active · 18 grace', type: 'neutral' as const },
    },
    {
      label: 'EXPIRING IN 30 DAYS',
      value: '85',
      unit: 'RENEWAL QUEUE',
      hoverTitle: '85 Memberships up for renewal',
      strand: { value: 85, max: 120, capsules: 5 as const },
      delta: { text: '18 in next 7 days', type: 'warn' as const },
    },
    {
      label: 'GST LIABILITY MTD',
      value: '₹92.0K',
      unit: '5% FITNESS SAC 999723',
      hoverTitle: '₹92,000 Total Tax Back-Calculated',
      delta: { text: 'CGST 2.5% + SGST 2.5%', type: 'neutral' as const },
    },
  ]

  // ─── Needs Attention Real Operational Data ───
  const needsAttentionItems = [
    {
      id: 'att_1',
      category: 'MEMBERSHIP EXPIRY',
      badgeStatus: 'warn' as const,
      title: 'Aarav Mehta · Annual Gold',
      subtitle: 'Expires in 3 days (31 Aug 2026) · ₹28,500 renewal pending',
      link: '/members',
      actionLabel: 'Open Member Profile',
    },
    {
      id: 'att_2',
      category: 'ENTITLEMENT EXPIRY',
      badgeStatus: 'warn' as const,
      title: 'Priya Sharma · Complementary Massage Therapy (60 Min)',
      subtitle: '2-month complimentary window expires in 8 days (unclaimed)',
      link: '/members',
      actionLabel: 'Schedule Assessment',
    },
    {
      id: 'att_3',
      category: 'UNSIGNED PT AGREEMENT',
      badgeStatus: 'danger' as const,
      title: 'Vikram Sethi · Elite Trainer 24-Pack (Trainer: Rajesh Poojary)',
      subtitle: '3-party sequential sign pending Fitness Consultant counter-sign',
      link: '/consent',
      actionLabel: 'View Agreement',
    },
    {
      id: 'att_4',
      category: 'OVERDUE LEAD FOLLOW-UP',
      badgeStatus: 'warn' as const,
      title: 'Kavita Nair · Reformer Studio Walk-In Inquiry',
      subtitle: 'Trial pass completed 48 hrs ago · Sales Rep: Sameer K.',
      link: '/leads',
      actionLabel: 'Open CRM Lead',
    },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header: Display Type & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <span className="font-ui text-[11px] uppercase tracking-[0.06em] font-semibold text-[var(--text-faint)]">
            Command & Operations Hub
          </span>
          <h1 className="font-display text-[28px] sm:text-[30px] leading-[34px] font-semibold text-[var(--text)] tracking-[-0.02em] mt-0.5">
            Executive Overview
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--r-sm)] bg-[var(--surface-sunken)] border border-[var(--line)] font-data text-xs text-[var(--text)] select-none">
            <Calendar className="w-3.5 h-3.5 text-[var(--text-faint)]" />
            <span>{dateRange}</span>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportGstr1}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export GSTR-1
          </Button>

          <Link href="/billing">
            <Button
              variant="primary"
              size="sm"
              icon={<Receipt className="w-3.5 h-3.5" />}
            >
              Billing Hub
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Four KPI Cells in One Bordered Panel */}
      <KpiPanel cells={kpiCells} />

      {/* 3. Needs Attention Panel — Full Width Direct Operations Action */}
      <div className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-md)] shadow-[inset_0_1px_0_rgba(255,255,255,0.045)] overflow-hidden">
        {/* Panel Header */}
        <div className="px-4 py-3 bg-[var(--surface-sunken)] border-b border-[var(--line)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[var(--warn)]" />
            <h2 className="font-ui text-xs uppercase tracking-[0.06em] font-semibold text-[var(--text)]">
              Needs Immediate Attention ({needsAttentionItems.length})
            </h2>
          </div>
          <span className="font-ui text-[11px] text-[var(--text-faint)]">
            Expiring memberships, unclaimed entitlements & unsigned waivers
          </span>
        </div>

        {/* Attention Items List */}
        <div className="divide-y divide-[var(--line)]">
          {needsAttentionItems.map((item) => (
            <div
              key={item.id}
              className="p-3.5 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[var(--surface-raised)] transition-colors duration-140"
            >
              <div className="flex items-start sm:items-center gap-3">
                <Badge status={item.badgeStatus} size="sm">
                  {item.category}
                </Badge>
                <div>
                  <p className="font-ui text-[13.5px] font-medium text-[var(--text)]">
                    {item.title}
                  </p>
                  <p className="font-ui text-[12px] text-[var(--text-faint)] mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
              </div>

              <Link
                href={item.link}
                className="inline-flex items-center gap-1.5 font-ui text-xs font-medium text-[var(--teal)] hover:text-[var(--blue)] hover:underline whitespace-nowrap self-end sm:self-center"
              >
                <span>{item.actionLabel}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Below the Fold: Revenue Mix & Cohort Retention */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Stream Breakdown */}
        <div className="card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3 mb-4">
              <h3 className="font-ui text-[14px] font-semibold text-[var(--text)]">
                Revenue Streams Mix
              </h3>
              <span className="font-ui text-[11px] uppercase tracking-wider text-[var(--text-faint)]">
                MTD Actuals
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between font-ui text-xs mb-1.5">
                  <span className="text-[var(--text-muted)]">Gym & Studio Memberships</span>
                  <span className="font-data tabular-nums text-[var(--text)] font-medium">74% · ₹13.61L</span>
                </div>
                <StrandMeter value={74} max={100} capsules={7} size="sm" />
              </div>

              <div>
                <div className="flex items-center justify-between font-ui text-xs mb-1.5">
                  <span className="text-[var(--text-muted)]">Personal Training Tiers</span>
                  <span className="font-data tabular-nums text-[var(--text)] font-medium">22% · ₹4.04L</span>
                </div>
                <StrandMeter value={22} max={100} capsules={7} size="sm" />
              </div>

              <div>
                <div className="flex items-center justify-between font-ui text-xs mb-1.5">
                  <span className="text-[var(--text-muted)]">Lockers & Ancillary</span>
                  <span className="font-data tabular-nums text-[var(--text)] font-medium">4% · ₹73.6K</span>
                </div>
                <StrandMeter value={4} max={100} capsules={7} size="sm" />
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[var(--line)] flex items-center justify-between font-data text-xs text-[var(--text-faint)] tabular-nums">
            <span>Total Gross Invoiced</span>
            <span className="font-medium text-[var(--text)]">₹18,40,000</span>
          </div>
        </div>

        {/* Member Retention & Cohort Decay Matrix */}
        <div className="card p-5 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3 mb-4">
              <div>
                <h3 className="font-ui text-[14px] font-semibold text-[var(--text)]">
                  Monthly Member Retention Curves
                </h3>
                <p className="font-ui text-[12px] text-[var(--text-faint)] mt-0.5">
                  Cohort survival rate after 1, 3, 6, and 12 months
                </p>
              </div>
              <Badge status="ok" size="sm">
                Average M12: 73%
              </Badge>
            </div>

            {/* Dense Cohort Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-[var(--line)] font-ui text-[11px] uppercase tracking-[0.06em] font-semibold text-[var(--text-muted)] h-7">
                    <th className="text-left pb-1">Cohort</th>
                    <th className="text-right pb-1">Size</th>
                    <th className="text-right pb-1">Month 1</th>
                    <th className="text-right pb-1">Month 3</th>
                    <th className="text-right pb-1">Month 6</th>
                    <th className="text-right pb-1">Month 12</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {cohorts.map((c) => (
                    <tr key={c.cohort} className="h-9 hover:bg-[var(--surface-raised)] transition-colors">
                      <td className="font-ui text-xs font-medium text-[var(--text)]">{c.cohort}</td>
                      <td className="font-data text-xs text-right tabular-nums text-[var(--text-muted)]">{c.size}</td>
                      <td className="font-data text-xs text-right tabular-nums text-[var(--ok)]">{c.month1}%</td>
                      <td className="font-data text-xs text-right tabular-nums text-[var(--ok)]">{c.month3}%</td>
                      <td className="font-data text-xs text-right tabular-nums text-[var(--text)]">{c.month6}%</td>
                      <td className="font-data text-xs text-right tabular-nums text-[var(--text-faint)]">{c.month12}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--line)] flex items-center justify-between text-xs font-ui text-[var(--text-faint)]">
            <span>Industry Benchmark: 62% M12</span>
            <span className="text-[var(--ok)] font-medium">+11% Above Target</span>
          </div>
        </div>
      </div>
    </div>
  )
}
