'use client'

import React, { useState } from 'react'
import {
  TrendingUp, Download, Receipt, Users, Lock,
  Calendar, ShieldCheck, DollarSign, FileText,
  BarChart3, CheckCircle2,
} from 'lucide-react'
import Button from '@/components/app/ui/button'
import Badge from '@/components/app/ui/badge'
import Card from '@/components/app/ui/glass-card'
import StrandMeter from '@/components/app/ui/StrandMeter'
import PageHeader from '@/components/app/ui/PageHeader'
import RenewalForecast from '@/components/app/overview/RenewalForecast'
import Breadcrumbs from '@/components/app/ui/Breadcrumbs'
import { useAuth } from '@/context/AuthContext'
import {
  getRevenueMix,
  getCohortData,
  getGstTaxReport,
} from '@/lib/analytics'
import { getSystemMetrics } from '@/lib/metrics'
import { formatINR } from '@/lib/gst'
import { toast } from '@/components/app/ui/toast'

export default function AnalyticsPage() {
  const { user, can, canRevenue } = useAuth()
  const metrics = getSystemMetrics()
  const revenueMix = getRevenueMix()
  const cohorts = getCohortData()
  const gst = getGstTaxReport()

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
    link.setAttribute('download', `dna360_gstr1_returns_aug_2026.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('GSTR-1 Official Tax Return CSV exported successfully')
  }

  if (!canRevenue) {
    return (
      <div className="max-w-4xl mx-auto py-12 select-none">
        <Card className="p-8 text-center space-y-4 border-dashed border-[var(--line)]">
          <div className="w-12 h-12 rounded-2xl bg-[rgba(245,158,11,0.12)] border border-[rgba(245,158,11,0.25)] flex items-center justify-center text-[var(--amber)] mx-auto shadow-sm">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="font-display font-semibold text-lg text-[var(--ink)]">
            Revenue Analytics &amp; GST Wall Protected
          </h2>
          <p className="font-ui text-xs text-[var(--muted)] max-w-md mx-auto leading-relaxed">
            Financial revenue ledgers, deferred revenue accounting, and GSTR-1 tax filings are strictly restricted to executive leadership (Owner, HR Head, Marketing Head, Sales Head).
          </p>
          <Badge status="warn" size="md">
            Role: {user?.role.name || 'Restricted Staff'} · No revenue.view
          </Badge>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-7 max-w-7xl mx-auto select-none">
      <Breadcrumbs items={[{ label: 'Financial Analytics & GST' }]} />

      {/* Page Header */}
      <PageHeader
        eyebrow="EXECUTIVE FINANCIAL LEDGER · POWAI FLAGSHIP"
        title="Revenue Analytics,"
        italicWord="Tax Accounting"
        description="Deferred revenue accounting, SAC 999723 5% GST liability, and 12-month cohort retention decay."
        actions={
          <Button
            variant="secondary"
            size="md"
            onClick={handleExportGstr1}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export GSTR-1 Return
          </Button>
        }
      />

      {/* ─── 1. Revenue & Collections Breakdown Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 space-y-1">
          <span className="font-ui text-xs text-[var(--muted)] uppercase tracking-wider font-semibold">
            Collections MTD (Cash)
          </span>
          <span className="font-display font-bold text-2xl text-[var(--ink)] block tracking-tight">
            {formatINR(metrics.collectionsMtdMinor)}
          </span>
          <span className="text-[11px] font-ui text-[var(--green)]">
            Total upfront cash received
          </span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="font-ui text-xs text-[var(--muted)] uppercase tracking-wider font-semibold">
            Recognised Revenue MTD
          </span>
          <span className="font-display font-bold text-2xl text-[#60A5FA] block tracking-tight">
            {formatINR(metrics.recognisedRevenueMtdMinor)}
          </span>
          <span className="text-[11px] font-ui text-[var(--muted)]">
            1/12th annual delivery period
          </span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="font-ui text-xs text-[var(--muted)] uppercase tracking-wider font-semibold">
            Deferred Revenue Balance
          </span>
          <span className="font-display font-bold text-2xl text-[var(--amber)] block tracking-tight">
            {formatINR(metrics.deferredRevenueBalanceMinor)}
          </span>
          <span className="text-[11px] font-ui text-[var(--muted)]">
            Unearned forward balance
          </span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="font-ui text-xs text-[var(--muted)] uppercase tracking-wider font-semibold">
            5% GST Liability MTD
          </span>
          <span className="font-display font-bold text-2xl text-[#34D399] block tracking-tight">
            {formatINR(metrics.gstLiabilityMinor)}
          </span>
          <span className="text-[11px] font-ui text-[var(--muted)]">
            CGST ₹43.8K + SGST ₹43.8K
          </span>
        </Card>
      </div>

      {/* ─── 2. GST SAC 999723 Tax Ledger Audit Card ─── */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--line)] pb-4 mb-4 gap-2">
          <div>
            <h3 className="font-display font-semibold text-base text-[var(--ink)]">
              Statutory GST Compliance Report (SAC 999723)
            </h3>
            <p className="font-ui text-xs text-[var(--muted)] mt-0.5">
              Fitness centre &amp; gymnasium services · GST-inclusive 5% back-calculation (Amount &times; 5 / 105)
            </p>
          </div>
          <Badge status="ok" size="sm">
            412 Invoices MTD
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-ui">
          <div className="p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] space-y-1">
            <span className="text-xs text-[var(--muted)]">Taxable Value (Ex-Tax)</span>
            <span className="font-display font-bold text-xl text-[var(--ink)] block">
              {formatINR(metrics.taxableRevenueMinor)}
            </span>
            <span className="text-[11px] text-[var(--muted)]">Formula: Collections &minus; GST</span>
          </div>

          <div className="p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] space-y-1">
            <span className="text-xs text-[var(--muted)]">Central GST (CGST 2.5%)</span>
            <span className="font-display font-bold text-xl text-[#60A5FA] block">
              {formatINR(metrics.cgstMinor)}
            </span>
            <span className="text-[11px] text-[var(--muted)]">State: Maharashtra (27)</span>
          </div>

          <div className="p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] space-y-1">
            <span className="text-xs text-[var(--muted)]">State GST (SGST 2.5%)</span>
            <span className="font-display font-bold text-xl text-[#60A5FA] block">
              {formatINR(metrics.sgstMinor)}
            </span>
            <span className="text-[11px] text-[var(--muted)]">State: Maharashtra (27)</span>
          </div>
        </div>
      </Card>

      {/* ─── 3. Revenue Stream Mix & Cohort Retention Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <Card className="p-6 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-3 mb-4">
                <div>
                  <h3 className="font-display font-semibold text-base text-[var(--ink)]">
                    Revenue Stream Mix
                  </h3>
                  <p className="font-ui text-xs text-[var(--muted)] mt-0.5">
                    GST-inclusive contribution
                  </p>
                </div>
                <span className="font-ui text-xs font-semibold text-[var(--green)] bg-[rgba(52,211,153,0.1)] px-2.5 py-0.5 rounded-full border border-[rgba(52,211,153,0.25)]">
                  ₹18.4L Total
                </span>
              </div>

              <div className="space-y-4">
                {[
                  { stream: 'Memberships (SAC 999723)', percentage: revenueMix.membershipPct, revenueMinor: Math.round(metrics.collectionsMtdMinor * (revenueMix.membershipPct / 100)) },
                  { stream: 'Personal Training (PT)', percentage: revenueMix.ptPct, revenueMinor: Math.round(metrics.collectionsMtdMinor * (revenueMix.ptPct / 100)) },
                  { stream: 'Lockers & Valet Amenities', percentage: revenueMix.lockersPct, revenueMinor: Math.round(metrics.collectionsMtdMinor * (revenueMix.lockersPct / 100)) },
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

        <div className="lg:col-span-7">
          <Card className="p-6">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3 mb-4">
              <div>
                <h3 className="font-display font-semibold text-base text-[var(--ink)]">
                  12-Month Cohort Retention Decay
                </h3>
                <p className="font-ui text-xs text-[var(--muted)] mt-0.5">
                  Elapsed horizons (Aug 2026) · Future horizons unreached
                </p>
              </div>
              <Badge status="ok" size="sm">78.4% Average Retention</Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs font-ui tabular-nums">
                <thead>
                  <tr className="border-b border-[var(--line)] text-[var(--muted)] text-left">
                    <th className="pb-2.5 font-semibold uppercase tracking-wider text-[10.5px]">Cohort</th>
                    <th className="pb-2.5 font-semibold uppercase tracking-wider text-[10.5px]">Enrolled</th>
                    <th className="pb-2.5 font-semibold uppercase tracking-wider text-[10.5px]">M+1</th>
                    <th className="pb-2.5 font-semibold uppercase tracking-wider text-[10.5px]">M+3</th>
                    <th className="pb-2.5 font-semibold uppercase tracking-wider text-[10.5px]">M+6</th>
                    <th className="pb-2.5 font-semibold uppercase tracking-wider text-[10.5px]">M+12</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)] text-[var(--ink-2)]">
                  {cohorts.map((c) => (
                    <tr key={c.cohort} className="hover:bg-[var(--surface-2)] transition-colors">
                      <td className="py-2.5 font-semibold text-[var(--ink)]">{c.cohort}</td>
                      <td className="py-2.5 text-[var(--muted)]">{c.size}</td>
                      <td className="py-2.5 font-medium text-[var(--green)]">
                        {c.month1 !== null ? `${c.month1}%` : <span className="text-[var(--muted)]">—</span>}
                      </td>
                      <td className="py-2.5 font-medium text-[var(--green)]">
                        {c.month3 !== null ? `${c.month3}%` : <span className="text-[var(--muted)]">—</span>}
                      </td>
                      <td className="py-2.5 text-[var(--ink-2)]">
                        {c.month6 !== null ? `${c.month6}%` : <span className="text-[var(--muted)]">—</span>}
                      </td>
                      <td className="py-2.5 text-[var(--amber)]">
                        {c.month12 !== null ? `${c.month12}%` : <span className="text-[var(--muted)]">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      {/* ─── 4. Forward Renewal Scenario Projection ─── */}
      <RenewalForecast />
    </div>
  )
}
