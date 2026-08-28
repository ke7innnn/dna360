'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Printer, Download, Building2,
  CheckCircle, Clock, AlertTriangle, FileText,
} from 'lucide-react'
import GlassCard from '@/components/app/ui/glass-card'
import { Button } from '@/components/app/ui/button'
import { StatusPill } from '@/components/app/ui/badge'
import { getInvoiceById } from '@/lib/billing'
import { formatINR, numberToWordsINR } from '@/lib/gst'
import { formatDateTime } from '@/lib/utils'
import { getProfile, getBankDetails } from '@/lib/settings'
import type { TaxInvoice } from '@/types/billing'

export default function InvoiceDetailPage() {
  const params = useParams()
  const invoiceId = params?.id as string

  const [invoice, setInvoice] = useState<TaxInvoice | null>(() => {
    if (typeof invoiceId === 'string') {
      return getInvoiceById(invoiceId)
    }
    return null
  })

  useEffect(() => {
    if (invoiceId) {
      const inv = getInvoiceById(invoiceId)
      setInvoice(inv)
    }
  }, [invoiceId])

  const profile = getProfile()
  const bank = getBankDetails()

  if (!invoice) {
    return (
      <div className="space-y-4 max-w-4xl py-12 text-center">
        <h2 className="font-display text-xl font-semibold text-[var(--app-text-primary)]">
          Invoice Not Found
        </h2>
        <p className="text-xs text-[var(--app-text-muted)]">
          The requested invoice does not exist or has been removed.
        </p>
        <Link href="/billing">
          <Button variant="secondary" icon={<ArrowLeft className="w-4 h-4" />}>
            Back to Invoices
          </Button>
        </Link>
      </div>
    )
  }

  const statusMap: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
    paid: 'success',
    pending: 'warning',
    overdue: 'danger',
    partially_paid: 'warning',
    void: 'danger',
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/billing"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--app-text-muted)] hover:text-[var(--app-text-secondary)] transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Tax Invoices
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-[var(--app-text-primary)]">
              Tax Invoice {invoice.invoiceNumber}
            </h1>
            <StatusPill status={statusMap[invoice.status] || 'neutral'} dot>
              {invoice.status.toUpperCase()}
            </StatusPill>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="primary" onClick={handlePrint} icon={<Printer className="w-4 h-4" />}>
            Print / Export PDF
          </Button>
        </div>
      </div>

      {/* Printable Sheet */}
      <div id="printable-gst-invoice" className="p-8 rounded-2xl glass-input space-y-6 border border-[var(--app-glass-border)] text-xs text-[var(--app-text-primary)]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-[var(--app-glass-border)]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--aurora-1)] to-[var(--aurora-2)] flex items-center justify-center text-white font-bold text-sm">
                D
              </div>
              <h3 className="font-display text-xl font-bold tracking-tight text-[var(--app-text-primary)]">
                {profile.legalEntityName}
              </h3>
            </div>
            <p className="text-[var(--app-text-muted)] text-xs leading-relaxed">
              Trading as <strong>{profile.clubName}</strong><br />
              {profile.address}<br />
              State: Maharashtra · State Code: <strong>{profile.stateCode}</strong>
            </p>
            <p className="mt-1 font-mono text-[var(--aurora-1)] font-semibold text-xs">
              GSTIN: {profile.gstin} · PAN: {profile.pan}
            </p>
          </div>

          <div className="text-right sm:text-right space-y-1">
            <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-1 rounded bg-[var(--app-glass-bg)] border border-[var(--app-glass-border)] text-[var(--app-text-muted)]">
              Tax Invoice (Original)
            </span>
            <p className="font-mono text-base font-bold text-[var(--app-text-primary)] mt-2">
              {invoice.invoiceNumber}
            </p>
            <p className="text-[var(--app-text-muted)] text-xs">
              Date: <strong className="text-[var(--app-text-secondary)]">{invoice.issueDate}</strong>
            </p>
            <p className="text-[var(--app-text-muted)] text-xs">
              Place of Supply: <strong>27-Maharashtra</strong>
            </p>
          </div>
        </div>

        {/* Billed To */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[var(--app-glass-bg)] border border-[var(--app-glass-border)]">
          <div>
            <span className="text-[0.625rem] font-semibold uppercase tracking-wider text-[var(--app-text-muted)] block mb-1">
              Billed To (Customer Details)
            </span>
            <p className="font-bold text-sm text-[var(--app-text-primary)]">{invoice.memberName}</p>
            <p className="text-[var(--app-text-secondary)] text-xs">{invoice.memberPhone} {invoice.memberEmail ? `· ${invoice.memberEmail}` : ''}</p>
          </div>

          <div className="text-right space-y-1 text-xs">
            <span className="text-[0.625rem] font-semibold uppercase tracking-wider text-[var(--app-text-muted)] block mb-1">
              Commercial Details
            </span>
            <p>Sales Consultant: <strong>{invoice.salesRepName || 'Amit Sharma'}</strong></p>
            <p>Reverse Charge Applicable: <strong>No</strong></p>
          </div>
        </div>

        {/* Table */}
        <div className="border border-[var(--app-glass-border)] rounded-xl overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-[var(--app-glass-bg)] text-[var(--app-text-muted)] uppercase text-[0.625rem] font-semibold tracking-wider">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Service Description</th>
                <th className="p-3">SAC</th>
                <th className="p-3 text-right">Taxable Val</th>
                <th className="p-3 text-right">CGST (2.5%)</th>
                <th className="p-3 text-right">SGST (2.5%)</th>
                <th className="p-3 text-right">Total (Inc)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--app-glass-border)]">
              {invoice.items.map((it, idx) => (
                <tr key={it.id || idx}>
                  <td className="p-3 font-mono">{idx + 1}</td>
                  <td className="p-3">
                    <span className="font-medium text-[var(--app-text-primary)] block">{it.description}</span>
                    {it.discountMinor > 0 && (
                      <span className="text-[0.6875rem] text-[var(--app-success)]">
                        Discount Applied: -{formatINR(it.discountMinor)}
                      </span>
                    )}
                  </td>
                  <td className="p-3 font-mono">{it.sacCode}</td>
                  <td className="p-3 text-right font-mono">{formatINR(it.taxableMinor)}</td>
                  <td className="p-3 text-right font-mono">{formatINR(it.cgstMinor)}</td>
                  <td className="p-3 text-right font-mono">{formatINR(it.sgstMinor)}</td>
                  <td className="p-3 text-right font-mono font-bold">{formatINR(it.totalMinor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals & Bank Details */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-2">
          <div className="space-y-2 text-xs text-[var(--app-text-muted)] max-w-sm">
            <p><strong>Bank Details for Direct Settlement:</strong></p>
            <div className="font-mono text-xs bg-[var(--app-glass-bg)] p-3 rounded-lg border border-[var(--app-glass-border)] space-y-0.5">
              <p>Bank: {bank.bankName || 'Axis Bank'}</p>
              <p>A/C: {bank.accountNumber || '921020038912345'}</p>
              <p>IFSC: {bank.ifscCode || 'UTIB0000123'}</p>
              <p>Branch: {bank.branchName || 'Powai Branch'}</p>
            </div>
            <p className="text-[0.6875rem] italic pt-1">
              Amount in words: <strong className="text-[var(--app-text-secondary)]">{numberToWordsINR(invoice.grandTotalMinor)}</strong>
            </p>
          </div>

          <div className="w-full sm:w-72 space-y-1.5 text-xs font-mono text-right">
            <div className="flex justify-between text-[var(--app-text-muted)]">
              <span>Taxable Base (Ex-Tax):</span>
              <span>{formatINR(invoice.taxableMinor)}</span>
            </div>
            <div className="flex justify-between text-[var(--app-text-muted)]">
              <span>CGST (2.5%):</span>
              <span>{formatINR(invoice.cgstMinor)}</span>
            </div>
            <div className="flex justify-between text-[var(--app-text-muted)]">
              <span>SGST (2.5%):</span>
              <span>{formatINR(invoice.sgstMinor)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-[var(--app-text-primary)] pt-2 border-t border-[var(--app-glass-border)]">
              <span>Grand Total (GST Inclusive):</span>
              <span className="text-[var(--aurora-1)]">{formatINR(invoice.grandTotalMinor)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
