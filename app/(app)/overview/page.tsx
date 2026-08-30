'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  TrendingUp, Download, Receipt, Users, AlertTriangle,
  Clock, ShieldAlert, FileSignature, ArrowUpRight,
  ChevronRight, Calendar, Sparkles, Lock, ShieldCheck,
} from 'lucide-react'
import Button from '@/components/app/ui/button'
import Badge from '@/components/app/ui/badge'
import Card from '@/components/app/ui/glass-card'
import KpiPanel from '@/components/app/ui/KpiPanel'
import StrandMeter from '@/components/app/ui/StrandMeter'
import PageHeader from '@/components/app/ui/PageHeader'
import { useAuth } from '@/context/AuthContext'
import {
  getExecutiveKpis,
  getRevenueMix,
  getCohortData,
  getGstTaxReport,
} from '@/lib/analytics'
import { formatINR } from '@/lib/gst'
import { logAuditEvent } from '@/lib/audit'
import { toast } from '@/components/app/ui/toast'
import { cn } from '@/lib/utils'

export default function OverviewPage() {
  const { user, can, canRevenue } = useAuth()
  const kpis = getExecutiveKpis()
  const revenueMix = getRevenueMix()
  const cohorts = getCohortData()
  const gst = getGstTaxReport()

  const [dateRange, setDateRange] = useState('Aug 2026')

  // Log revenue access audit event when authorized leaders view financial data
  useEffect(() => {
    if (user && canRevenue) {
      logAuditEvent({
        actor: { id: user.id, name: user.name, email: user.email || user.phone, role: user.role.name },
        action: 'REVENUE_VIEW',
        entity: 'RevenueAnalytics',
        entityId: 'overview_mrr_aug_2026',
        branchId: user.branchId,
        description: `${user.name} viewed executive revenue totals & GST breakdown`,
      })
    }
  }, [user?.id, canRevenue])

  const handleExportGstr1 = () => {
    if (!can('billing.export') && user?.role.slug.toUpperCase() !== 'OWNER') {
      toast.error('Exporting financial tax data is restricted to Club Owner.')
      return
    }

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

  // ─── 4 KPI Cells Data (Gated by canRevenue) ───
  const kpiCells = canRevenue
    ? [
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
          value: '659',
          unit: 'LIVE MEMBERS',
          hoverTitle: '659 Verified Gymex Live Members',
          strand: { value: 659, max: 750, capsules: 5 as const },
          delta: { text: '594 active · 18 grace', type: 'neutral' as const },
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
    : [
        {
          label: 'ACTIVE MEMBERS',
          value: '659',
          unit: 'CLUB ROSTER',
          hoverTitle: '659 Live Members Directory',
          strand: { value: 659, max: 750, capsules: 5 as const },
          delta: { text: 'Full roster', type: 'neutral' as const },
        },
        {
          label: 'TODAY SCHEDULED',
          value: '14',
          unit: 'STUDIO CLASSES',
          hoverTitle: '14 Group & PT slots scheduled today',
          strand: { value: 14, max: 16, capsules: 5 as const },
          delta: { text: 'MWF Master timetable', type: 'ok' as const },
        },
        {
          label: 'TURNSTILE TRAFFIC',
          value: '342',
          unit: 'CHECK-INS TODAY',
          hoverTitle: '342 Gate entries processed today',
          strand: { value: 342, max: 450, capsules: 5 as const },
          delta: { text: 'Peak 6:00 PM – 8:30 PM', type: 'neutral' as const },
        },
        {
          label: 'RENEWAL QUEUE',
          value: '85',
          unit: 'DUE THIS MONTH',
          hoverTitle: '85 memberships due for renewal',
          delta: { text: 'Front desk follow-ups', type: 'warn' as const },
        },
      ]

  // ─── Needs Attention Real Operational Data ───
  const needsAttentionItems = [
    {
      id: 'att_1',
      category: 'MEMBERSHIP EXPIRY',
      badgeStatus: 'warn' as const,
      title: 'Aarav Mehta · Annual Gold',
      subtitle: 'Expires in 3 days (31 Aug 2026) · Renewal follow-up scheduled',
      link: '/members',
      actionLabel: 'Open Member Profile',
    },
    {
      id: 'att_2',
      category: 'ENTITLEMENT EXPIRY',
      badgeStatus: 'neutral' as const,
      title: 'Rhea Kapoor · Tier 1 PT Pack',
      subtitle: 'Unused complimentary fitness assessment expiring soon',
      link: '/classes',
      actionLabel: 'Schedule Session',
    },
    {
      id: 'att_3',
      category: 'LEAD INQUIRY',
      badgeStatus: 'info' as const,
      title: 'Vikram Sethi · Trial Request',
      subtitle: 'Walk-in lead assigned to Swati for trial follow-up',
      link: '/leads',
      actionLabel: 'View CRM Lead',
    },
  ]

  return (
    <div className="space-y-7 max-w-7xl mx-auto select-none">
      {/* 1. Page Header */}
      <PageHeader
        eyebrow="EXECUTIVE DASHBOARD · POWAI FLAGSHIP"
        title="Club Overview,"
        italicWord="Operations"
        description="High-level operational health, turnstile throughput, membership lifecycles, and financial analytics."
        actions={
          canRevenue ? (
            <Button
              variant="secondary"
              size="md"
              onClick={handleExportGstr1}
              icon={<Download className="w-3.5 h-3.5" />}
            >
              Export GSTR-1
            </Button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface-2)] border border-[var(--line)] text-xs text-[var(--muted)]">
              <Lock className="w-3.5 h-3.5 text-[var(--amber)]" />
              <span className="font-data text-[10.5px]">Revenue View Restricted</span>
            </div>
          )
        }
      />

      {/* 2. Unified 4-Cell KPI Panel */}
      <KpiPanel cells={kpiCells} />

      {/* 3. Operational Attention Queue with Glass Bubble Styling */}
      <Card className="p-6">
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[var(--amber)] shadow-[0_0_8px_#F59E0B] animate-pulse" />
            <h2 className="font-display font-semibold text-base text-[var(--ink)] tracking-tight">
              Immediate Attention Items
            </h2>
            {/* Glass Bubble Counter Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[rgba(59,130,246,0.12)] border border-[rgba(59,130,246,0.30)] backdrop-blur-md shadow-[0_0_10px_rgba(59,130,246,0.20)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
              <span className="font-ui text-[11px] font-bold text-[var(--accent)]">
                3 items
              </span>
            </div>
          </div>
          <span className="font-ui text-[10.5px] uppercase tracking-[0.14em] text-[var(--muted)] font-semibold">
            POWAI FLAGSHIP
          </span>
        </div>

        <div className="space-y-3">
          {needsAttentionItems.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-[14px] bg-gradient-to-r from-[rgba(255,255,255,0.03)] to-[rgba(255,255,255,0.015)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[rgba(59,130,246,0.40)] hover:shadow-[0_4px_20px_rgba(59,130,246,0.12)] transition-all duration-200"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center flex-wrap gap-2.5">
                  <Badge status={item.badgeStatus} size="sm">
                    {item.category}
                  </Badge>
                  <span className="font-ui font-bold text-[13.5px] text-[var(--ink)] tracking-tight">
                    {item.title}
                  </span>
                </div>
                <p className="font-ui text-[12px] text-[var(--muted)] pl-0.5 leading-relaxed">
                  {item.subtitle}
                </p>
              </div>

              {/* Glass Bubble Action Button */}
              <Link
                href={item.link}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[rgba(59,130,246,0.10)] border border-[rgba(59,130,246,0.25)] hover:bg-[var(--accent)] hover:border-[var(--accent)] hover:text-white text-[var(--accent)] text-xs font-ui font-semibold transition-all duration-150 shadow-sm group shrink-0 self-start sm:self-center cursor-pointer"
              >
                <span>{item.actionLabel}</span>
                <ChevronRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
              </Link>
            </div>
          ))}
        </div>
      </Card>

      {/* 4. Financial & Revenue Section (The Wall — Exclusive to Owner, HR Head, Marketing Head, Sales Head) */}
      {canRevenue ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Revenue Stream Mix (5 cols) */}
          <div className="lg:col-span-5">
            <Card className="p-6 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-[var(--line)] pb-3 mb-4">
                  <div>
                    <h3 className="font-display font-semibold text-base text-[var(--ink)]">
                      Revenue Stream Mix
                    </h3>
                    <p className="font-ui text-xs text-[var(--muted)] mt-0.5">
                      GST-inclusive breakdown (Aug 2026)
                    </p>
                  </div>
                  <span className="font-ui text-xs font-semibold text-[var(--green)] tabular-nums tracking-tight bg-[rgba(52,211,153,0.10)] border border-[rgba(52,211,153,0.25)] px-2.5 py-0.5 rounded-full">
                    ₹18,40,000 MTD
                  </span>
                </div>

                <div className="space-y-4">
                  {[
                    { stream: 'Memberships (SAC 999723)', percentage: revenueMix.membershipPct, revenueMinor: Math.round(kpis.mrrMinor * (revenueMix.membershipPct / 100)) },
                    { stream: 'Personal Training (PT)', percentage: revenueMix.ptPct, revenueMinor: Math.round(kpis.mrrMinor * (revenueMix.ptPct / 100)) },
                    { stream: 'Lockers & Valet Amenities', percentage: revenueMix.lockersPct, revenueMinor: Math.round(kpis.mrrMinor * (revenueMix.lockersPct / 100)) },
                  ].map((stream) => (
                    <div key={stream.stream} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-ui">
                        <span className="text-[var(--ink-2)] font-medium">
                          {stream.stream}
                        </span>
                        <div className="flex items-center gap-2 font-ui tabular-nums">
                          <span className="text-[var(--ink)] font-semibold text-xs tracking-tight">
                            {formatINR(stream.revenueMinor)}
                          </span>
                          <span className="text-[var(--muted)] text-[11px]">
                            ({stream.percentage}%)
                          </span>
                        </div>
                      </div>
                      <StrandMeter
                        value={stream.percentage}
                        max={100}
                        capsules={5}
                        color="accent"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Cohort Retention Grid (7 cols) */}
          <div className="lg:col-span-7">
            <Card className="p-6">
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-3 mb-4">
                <div>
                  <h3 className="font-display font-semibold text-base text-[var(--ink)]">
                    12-Month Cohort Retention Decay
                  </h3>
                  <p className="font-ui text-xs text-[var(--muted)] mt-0.5">
                    Monthly active renewal decay rate
                  </p>
                </div>
                <Badge status="ok" size="sm">78.4% Average Retention</Badge>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs font-ui tabular-nums">
                  <thead>
                    <tr className="border-b border-[var(--line)] text-[var(--muted)] text-left">
                      <th className="pb-2.5 font-ui font-semibold uppercase tracking-wider text-[10.5px]">Cohort</th>
                      <th className="pb-2.5 font-ui font-semibold uppercase tracking-wider text-[10.5px]">Enrolled</th>
                      <th className="pb-2.5 font-ui font-semibold uppercase tracking-wider text-[10.5px]">M+1</th>
                      <th className="pb-2.5 font-ui font-semibold uppercase tracking-wider text-[10.5px]">M+3</th>
                      <th className="pb-2.5 font-ui font-semibold uppercase tracking-wider text-[10.5px]">M+6</th>
                      <th className="pb-2.5 font-ui font-semibold uppercase tracking-wider text-[10.5px]">M+12</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)] text-[var(--ink-2)]">
                    {cohorts.map((c) => (
                      <tr key={c.cohort} className="hover:bg-[var(--surface-2)] transition-colors">
                        <td className="py-2.5 font-ui font-semibold text-[var(--ink)]">{c.cohort}</td>
                        <td className="py-2.5 font-ui text-[var(--muted)]">{c.size}</td>
                        <td className="py-2.5 font-ui font-medium text-[var(--green)]">{c.month1}%</td>
                        <td className="py-2.5 font-ui font-medium text-[var(--green)]">{c.month3}%</td>
                        <td className="py-2.5 font-ui text-[var(--ink-2)]">{c.month6}%</td>
                        <td className="py-2.5 font-ui text-[var(--amber)]">{c.month12}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        /* Discreet Security Wall Notice for Staff without revenue.view */
        <Card className="p-6 border-dashed border-[var(--line)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(245,158,11,0.12)] border border-[rgba(245,158,11,0.25)] flex items-center justify-center text-[var(--amber)] shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-ui font-semibold text-sm text-[var(--ink)]">
                Financial Analytics & Revenue Stream Isolation
              </h3>
              <p className="font-ui text-xs text-[var(--muted)] mt-0.5">
                Financial ledgers and MRR metrics are strictly restricted to executive leadership (Owner, HR Head, Marketing Head, Sales Head).
              </p>
            </div>
          </div>
          <Badge status="warn" size="sm">
            RBAC Protected
          </Badge>
        </Card>
      )}
    </div>
  )
}
