'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  CreditCard, Receipt, Plus, Search, Filter,
  Download, CheckCircle, Clock, AlertTriangle,
  RotateCcw, Eye, FileText, ArrowUpDown, Building2,
  Sparkles, Layers, ShieldAlert,
} from 'lucide-react'
import GlassCard from '@/components/app/ui/glass-card'
import StatCard from '@/components/app/ui/stat-card'
import { DataTable, type DataTableColumn } from '@/components/app/ui/data-table'
import { Button } from '@/components/app/ui/button'
import { StatusPill } from '@/components/app/ui/badge'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/app/ui/select'
import InvoiceModal from '@/components/app/billing/InvoiceModal'
import CreateInvoiceModal from '@/components/app/billing/CreateInvoiceModal'
import CreditNoteModal from '@/components/app/billing/CreditNoteModal'
import { getInvoices, voidInvoice } from '@/lib/billing'
import { formatINR } from '@/lib/gst'
import { formatDateTime } from '@/lib/utils'
import type { TaxInvoice, InvoiceStatus } from '@/types/billing'
import { toast } from '@/components/app/ui/toast'
import { cn } from '@/lib/utils'

export default function BillingPage() {
  const [invoices, setInvoices] = useState<TaxInvoice[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentModeFilter, setPaymentModeFilter] = useState('all')

  const [selectedInvoice, setSelectedInvoice] = useState<TaxInvoice | null>(null)
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false)
  const [creditNoteInvoice, setCreditNoteInvoice] = useState<TaxInvoice | null>(null)

  const [page, setPage] = useState(1)
  const pageSize = 10

  const refreshInvoices = () => {
    const list = getInvoices({
      search,
      status: statusFilter as any,
      paymentMode: paymentModeFilter as any,
    })
    setInvoices(list)
  }

  useEffect(() => {
    refreshInvoices()

    const handleUpdate = () => refreshInvoices()
    window.addEventListener('dna360_invoices_updated', handleUpdate)
    return () => window.removeEventListener('dna360_invoices_updated', handleUpdate)
  }, [search, statusFilter, paymentModeFilter])

  const statusMap: Record<InvoiceStatus, { status: 'success' | 'warning' | 'danger' | 'info' | 'neutral'; label: string }> = {
    paid: { status: 'success', label: 'Paid' },
    pending: { status: 'warning', label: 'Pending' },
    overdue: { status: 'danger', label: 'Overdue' },
    partially_paid: { status: 'warning', label: 'Partial' },
    void: { status: 'danger', label: 'Void' },
  }

  const columns: DataTableColumn<TaxInvoice>[] = [
    {
      id: 'invoice',
      header: 'Invoice # / Date',
      sortable: true,
      cell: (_, row) => (
        <div>
          <p className="font-mono text-xs font-bold text-[var(--app-text-primary)] hover:text-[var(--aurora-1)] transition-colors">
            {row.invoiceNumber}
          </p>
          <div className="flex items-center gap-1.5 text-[0.6875rem] text-[var(--app-text-muted)] mt-0.5 font-mono">
            <span>{row.issueDate}</span>
            <span>·</span>
            <span>Rep: {row.salesRepName || 'Amit Sharma'}</span>
          </div>
        </div>
      ),
    },
    {
      id: 'member',
      header: 'Billed To',
      sortable: true,
      cell: (_, row) => (
        <div>
          <p className="font-semibold text-xs text-[var(--app-text-primary)]">{row.memberName}</p>
          <p className="text-[0.6875rem] font-mono text-[var(--app-text-muted)]">{row.memberPhone}</p>
        </div>
      ),
    },
    {
      id: 'plan',
      header: 'Item Description',
      cell: (_, row) => (
        <div>
          <span className="text-xs font-medium text-[var(--app-text-secondary)] truncate max-w-[220px] block">
            {row.items[0]?.description || 'Membership Services'}
          </span>
          <span className="text-[0.625rem] font-mono text-[var(--app-text-muted)]">
            SAC {row.items[0]?.sacCode || '999723'} · Rate: {((row.items[0]?.taxRate || 0.05) * 100)}%
          </span>
        </div>
      ),
    },
    {
      id: 'taxable',
      header: 'Taxable + GST (5%)',
      align: 'right',
      sortable: true,
      cell: (_, row) => (
        <div className="text-right text-xs font-mono">
          <span className="text-[var(--app-text-secondary)] block">
            {formatINR(row.taxableMinor)}
          </span>
          <span className="text-[0.6875rem] text-emerald-400">
            +{formatINR(row.cgstMinor + row.sgstMinor)} GST
          </span>
        </div>
      ),
    },
    {
      id: 'total',
      header: 'Grand Total (GST Inc)',
      align: 'right',
      sortable: true,
      cell: (_, row) => (
        <div className="text-right text-xs font-mono">
          <span className="font-bold text-[var(--app-text-primary)] block">
            {formatINR(row.grandTotalMinor)}
          </span>
          {row.dueAmountMinor > 0 && (
            <span className="text-[0.6875rem] font-semibold text-[var(--app-danger)]">
              Due: {formatINR(row.dueAmountMinor)}
            </span>
          )}
        </div>
      ),
    },
    {
      id: 'mode',
      header: 'Payment Mode',
      cell: (_, row) => (
        <div className="flex flex-wrap gap-1">
          {row.payments.length > 0 ? (
            row.payments.map((p) => (
              <span
                key={p.id}
                className="text-[0.625rem] px-1.5 py-0.5 rounded bg-[var(--app-glass-bg)] border border-[var(--app-glass-border)] text-[var(--app-text-secondary)] font-medium"
              >
                {p.mode}
              </span>
            ))
          ) : (
            <span className="text-[0.6875rem] text-[var(--app-text-muted)] italic">Unpaid</span>
          )}
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      width: '110px',
      cell: (val) => {
        const s = statusMap[val as InvoiceStatus] || { status: 'neutral', label: val as string }
        return (
          <StatusPill status={s.status} dot>
            {s.label}
          </StatusPill>
        )
      },
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      width: '130px',
      cell: (_, row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedInvoice(row)
              setInvoiceModalOpen(true)
            }}
            title="View GST Tax Invoice"
            icon={<Eye className="w-3.5 h-3.5" />}
          >
            Invoice
          </Button>
          {row.status === 'paid' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCreditNoteInvoice(row)}
              title="Void Invoice / Credit Note"
              icon={<RotateCcw className="w-3.5 h-3.5" />}
            />
          )}
        </div>
      ),
    },
  ]

  // KPI Calculations
  const totalBilledMinor = invoices.reduce((acc, inv) => acc + (inv.status !== 'void' ? inv.grandTotalMinor : 0), 0)
  const cashCollectedMinor = invoices.reduce((acc, inv) => acc + (inv.status !== 'void' ? inv.paidAmountMinor : 0), 0)
  const gstLiabilityMinor = invoices.reduce((acc, inv) => acc + (inv.status !== 'void' ? inv.cgstMinor + inv.sgstMinor : 0), 0)

  const paginatedInvoices = invoices.slice((page - 1) * pageSize, page * pageSize)

  const handleExportGstr1 = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['GSTIN/UIN of Recipient,Receiver Name,Invoice Number,Invoice Date,Invoice Value,Place of Supply,Reverse Charge,Applicable % of Tax Rate,Invoice Type,E-Commerce GSTIN,Rate,Taxable Value,Cess Amount']
        .concat(
          invoices.map(
            (inv) =>
              `"","${inv.memberName}","${inv.invoiceNumber}","${inv.issueDate}","${inv.grandTotalMinor / 100}","27-Maharashtra","N","","Regular B2C","","5","${inv.taxableMinor / 100}","0"`
          )
        )
        .join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `dna360_gstr1_b2c_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('GSTR-1 Tax Summary exported as CSV')
  }

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--app-text-primary)] tracking-tight">
            Plans, Billing & GST Tax Invoices
          </h1>
          <p className="text-sm text-[var(--app-text-secondary)] mt-1">
            Base Fitness Private Limited (GSTIN: 27AAICB3300R1ZH). All prices GST-inclusive with automated 5% back-calculation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportGstr1}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export GSTR-1
          </Button>
          <Button
            variant="primary"
            onClick={() => setCreateInvoiceOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Issue Tax Invoice
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Billed (GST Inc)"
          value={formatINR(totalBilledMinor)}
          icon={<Receipt className="w-5 h-5 text-[var(--aurora-1)]" />}
        />
        <StatCard
          label="Collections Realised"
          value={formatINR(cashCollectedMinor)}
          icon={<CheckCircle className="w-5 h-5 text-emerald-400" />}
        />
        <StatCard
          label="GST Liability (27-MH)"
          value={formatINR(gstLiabilityMinor)}
          icon={<CreditCard className="w-5 h-5 text-teal-400" />}
        />
        <StatCard
          label="Invoice Format"
          value="DNA/2026-27/000X"
          icon={<Clock className="w-5 h-5 text-indigo-400" />}
        />
      </div>

      {/* Filter Toolbar */}
      <GlassCard padding="sm">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--app-text-muted)]" />
            <input
              type="text"
              placeholder="Search invoice number, member name, phone, or sales rep…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-4 text-xs glass-input text-[var(--app-text-primary)] placeholder:text-[var(--app-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--app-focus-ring)]"
            />
          </div>

          <div className="w-full md:w-40">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="Status: All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="partially_paid">Partially Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="void">Void</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-44">
            <Select value={paymentModeFilter} onValueChange={setPaymentModeFilter}>
              <SelectTrigger><SelectValue placeholder="Mode: All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment Modes</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="Credit Card">Credit Card</SelectItem>
                <SelectItem value="Net Banking">Net Banking</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </GlassCard>

      {/* Invoice Table */}
      <DataTable<TaxInvoice>
        columns={columns}
        data={paginatedInvoices}
        status="success"
        page={page}
        pageSize={pageSize}
        total={invoices.length}
        onPageChange={setPage}
        onRowClick={(row) => {
          setSelectedInvoice(row)
          setInvoiceModalOpen(true)
        }}
        getRowId={(row) => row.id}
        emptyTitle="No invoices found"
        emptyDescription="Try clearing filters or search terms."
        isFilterActive={statusFilter !== 'all' || paymentModeFilter !== 'all' || !!search}
        onClearFilters={() => {
          setStatusFilter('all')
          setPaymentModeFilter('all')
          setSearch('')
        }}
      />

      {/* View Tax Invoice Modal */}
      <InvoiceModal
        invoice={selectedInvoice}
        open={invoiceModalOpen}
        onOpenChange={setInvoiceModalOpen}
      />

      {/* Create Tax Invoice Modal */}
      <CreateInvoiceModal
        open={createInvoiceOpen}
        onOpenChange={setCreateInvoiceOpen}
        onInvoiceCreated={refreshInvoices}
      />

      {/* Credit Note / Void Modal */}
      <CreditNoteModal
        invoice={creditNoteInvoice}
        open={!!creditNoteInvoice}
        onOpenChange={(open) => !open && setCreditNoteInvoice(null)}
        onCreditNoteIssued={refreshInvoices}
      />
    </div>
  )
}
