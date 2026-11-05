'use client'

import React from 'react'
import {
  Printer, Download, QrCode, Building2,
  CheckCircle, FileText, X, AlertTriangle,
} from 'lucide-react'
import { Modal } from '@/components/app/ui/modal'
import { Button } from '@/components/app/ui/button'
import { StatusPill } from '@/components/app/ui/badge'
import { formatINR } from '@/lib/gst'
import { formatDateTime } from '@/lib/utils'
import { getProfile, getBankDetails } from '@/lib/settings'
import type { TaxInvoice } from '@/types/billing'

export default function InvoiceModal({
  invoice,
  open,
  onOpenChange,
  onVoid,
  onCreditNote,
}: {
  invoice: TaxInvoice | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onVoid?: (inv: TaxInvoice) => void
  onCreditNote?: (inv: TaxInvoice) => void
}) {
  if (!invoice) return null

  const profile = getProfile()
  const bank = getBankDetails()
  const effectiveTaxRate = invoice.items?.[0]?.taxRate ?? 0.05
  const halfRatePct = ((effectiveTaxRate * 100) / 2).toFixed(1).replace(/\.0$/, '')

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
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="GST Tax Invoice"
      description={`Invoice: ${invoice.invoiceNumber}`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Printable GST Tax Invoice Sheet */}
        <div id="printable-gst-invoice" className="p-6 rounded-2xl glass-input space-y-6 border border-[var(--app-glass-border)] text-xs text-[var(--app-text-primary)]">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-[var(--app-glass-border)]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--aurora-1)] to-[var(--aurora-2)] flex items-center justify-center text-white font-bold text-xs">
                  D
                </div>
                <h3 className="font-display text-lg font-bold tracking-tight text-[var(--app-text-primary)]">
                  {profile.legalEntityName}
                </h3>
              </div>
              <p className="text-[var(--app-text-muted)] text-[0.6875rem] leading-relaxed">
                Trading as <strong>{profile.clubName}</strong><br />
                {profile.address}<br />
                State: Maharashtra · State Code: <strong>{profile.stateCode}</strong>
              </p>
              <p className="mt-1 font-sans tabular-nums text-[var(--aurora-1)] font-semibold text-[0.6875rem]">
                GSTIN: {profile.gstin} · PAN: {profile.pan}
              </p>
            </div>

            <div className="text-right sm:text-right space-y-1">
              <span className="text-[0.6875rem] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[var(--app-glass-bg)] border border-[var(--app-glass-border)] text-[var(--app-text-muted)]">
                Tax Invoice (Original)
              </span>
              <p className="font-sans tabular-nums text-sm font-bold text-[var(--app-text-primary)] mt-2">
                {invoice.invoiceNumber}
              </p>
              <p className="text-[var(--app-text-muted)] text-[0.6875rem]">
                Date: <strong className="text-[var(--app-text-secondary)]">{invoice.issueDate}</strong>
              </p>
              <div className="pt-1">
                <StatusPill status={statusMap[invoice.status] || 'neutral'}>
                  {invoice.status.toUpperCase()}
                </StatusPill>
              </div>
            </div>
          </div>

          {/* Billed To & Place of Supply */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 rounded-xl bg-[var(--app-glass-bg)] border border-[var(--app-glass-border)]">
            <div>
              <span className="text-[0.625rem] font-semibold uppercase tracking-wider text-[var(--app-text-muted)] block mb-1">
                Billed To (Recipient)
              </span>
              <p className="font-bold text-sm text-[var(--app-text-primary)]">{invoice.memberName}</p>
              <p className="text-[var(--app-text-secondary)] text-[0.6875rem]">{invoice.memberPhone} {invoice.memberEmail ? `· ${invoice.memberEmail}` : ''}</p>
              {invoice.memberAddress && (
                <p className="text-[var(--app-text-muted)] text-[0.6875rem] mt-1">{invoice.memberAddress}</p>
              )}
            </div>

            <div className="text-right sm:text-right space-y-1 text-[0.6875rem]">
              <span className="text-[0.625rem] font-semibold uppercase tracking-wider text-[var(--app-text-muted)] block mb-1">
                Membership &amp; Tax Metadata
              </span>
              <p>Activation Date: <strong className="text-white font-mono">{invoice.activationDate || invoice.issueDate}</strong></p>
              <p>Expiry Date: <strong className="text-emerald-400 font-mono">{invoice.expiryDate || '2027-09-28'}</strong></p>
              <p>Place of Supply: <strong>27-Maharashtra</strong></p>
              <p>Sales Rep: <strong>{invoice.salesRepName || 'Rajesh Poojary'}</strong></p>
              <p>Reverse Charge: <strong>No</strong></p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-[var(--app-glass-border)] rounded-xl overflow-hidden overflow-x-auto">
            <table className="min-w-[600px] w-full text-xs text-left">
              <thead className="bg-[var(--app-glass-bg)] text-[var(--app-text-muted)] uppercase text-[0.625rem] font-semibold tracking-wider">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Description of Service</th>
                  <th className="p-3">SAC</th>
                  <th className="p-3 text-right">Taxable Val</th>
                  <th className="p-3 text-right">CGST ({halfRatePct}%)</th>
                  <th className="p-3 text-right">SGST ({halfRatePct}%)</th>
                  <th className="p-3 text-right">Total (Inc)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--app-glass-border)]">
                {invoice.items.map((it, idx) => (
                  <tr key={it.id || idx}>
                    <td className="p-3 font-sans tabular-nums">{idx + 1}</td>
                    <td className="p-3">
                      <span className="font-medium text-[var(--app-text-primary)] block">{it.description}</span>
                      {it.discountMinor > 0 && (
                        <span className="text-[0.6875rem] text-[var(--app-success)] font-semibold">
                          Discount Applied: -{formatINR(it.discountMinor)} ({Math.round((it.discountMinor / it.unitPriceInclusiveMinor) * 100)}% off)
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-sans tabular-nums">{it.sacCode}</td>
                    <td className="p-3 text-right font-sans tabular-nums">{formatINR(it.taxableMinor)}</td>
                    <td className="p-3 text-right font-sans tabular-nums">{formatINR(it.cgstMinor)}</td>
                    <td className="p-3 text-right font-sans tabular-nums">{formatINR(it.sgstMinor)}</td>
                    <td className="p-3 text-right font-sans tabular-nums font-bold">{formatINR(it.totalMinor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Comments & Additional Benefits Included Box */}
          {(invoice.comments || invoice.notes) && (
            <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs">
              <span className="text-[10.5px] uppercase font-bold text-[#60A5FA] tracking-wider block mb-1">
                Comments &amp; Additional Benefits Included:
              </span>
              <p className="text-[var(--app-text-secondary)] leading-relaxed">
                {invoice.comments || invoice.notes}
              </p>
            </div>
          )}

          {/* Invoice Summary Calculation */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
            <div className="space-y-2 text-[0.6875rem] text-[var(--app-text-muted)] max-w-sm">
              <p><strong>Bank Details for Remittance:</strong></p>
              <div className="font-sans tabular-nums text-xs bg-[var(--app-glass-bg)] p-2.5 rounded-lg border border-[var(--app-glass-border)] space-y-0.5">
                <p>Bank: {bank.bankName || 'Axis Bank'}</p>
                <p>A/C: {bank.accountNumber || '921020038912345'}</p>
                <p>IFSC: {bank.ifscCode || 'UTIB0000123'}</p>
                <p>Branch: {bank.branchName || 'Powai Branch'}</p>
              </div>
            </div>

            <div className="w-full sm:w-72 space-y-1.5 text-xs font-sans tabular-nums text-right">
              <div className="flex justify-between text-[var(--app-text-muted)]">
                <span>Subtotal (List Price):</span>
                <span>{formatINR(invoice.subtotalMinor || (invoice.grandTotalMinor + invoice.totalDiscountMinor))}</span>
              </div>

              {invoice.totalDiscountMinor > 0 && (
                <div className="flex justify-between text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded">
                  <span>Discount ({invoice.discountPercentage || Math.round((invoice.totalDiscountMinor / (invoice.subtotalMinor || (invoice.grandTotalMinor + invoice.totalDiscountMinor))) * 100)}%):</span>
                  <span>-{formatINR(invoice.totalDiscountMinor)}</span>
                </div>
              )}

              <div className="flex justify-between text-[var(--app-text-muted)]">
                <span>Taxable Value:</span>
                <span>{formatINR(invoice.taxableMinor)}</span>
              </div>
              <div className="flex justify-between text-[var(--app-text-muted)]">
                <span>CGST ({halfRatePct}%):</span>
                <span>{formatINR(invoice.cgstMinor)}</span>
              </div>
              <div className="flex justify-between text-[var(--app-text-muted)]">
                <span>SGST ({halfRatePct}%):</span>
                <span>{formatINR(invoice.sgstMinor)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-[var(--app-text-primary)] pt-2 border-t border-[var(--app-glass-border)]">
                <span>Total Amount Payable:</span>
                <span className="text-[var(--aurora-1)]">{formatINR(invoice.grandTotalMinor)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {onVoid && invoice.status !== 'void' && (
              <Button variant="danger" size="sm" onClick={() => onVoid(invoice)}>
                Void Invoice
              </Button>
            )}
            {onCreditNote && invoice.status !== 'void' && (
              <Button variant="outline" size="sm" onClick={() => onCreditNote(invoice)}>
                Issue Credit Note
              </Button>
            )}
          </div>
          <Button variant="primary" onClick={handlePrint} icon={<Printer className="w-4 h-4" />}>
            Print / Save PDF
          </Button>
        </div>
      </div>
    </Modal>
  )
}
