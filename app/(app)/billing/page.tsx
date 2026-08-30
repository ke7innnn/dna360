'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  CreditCard, Receipt, Plus, Search, Filter,
  Download, CheckCircle, Clock, AlertTriangle,
  RotateCcw, Eye, FileText, ArrowUpDown, Building2,
  Sparkles, Layers, ShieldAlert,
} from 'lucide-react'
import Card from '@/components/app/ui/glass-card'
import StatTile from '@/components/app/ui/StatTile'
import DataTable, { type DataTableColumn } from '@/components/app/ui/data-table'
import Button from '@/components/app/ui/button'
import Badge, { StatusPill } from '@/components/app/ui/badge'
import PageHeader from '@/components/app/ui/PageHeader'
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
  const pageSize = 12

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

  const statusMap: Record<InvoiceStatus, { status: string; label: string }> = {
    paid: { status: 'ok', label: 'Paid' },
    pending: { status: 'warn', label: 'Pending' },
    overdue: { status: 'danger', label: 'Overdue' },
    partially_paid: { status: 'warn', label: 'Partial' },
    void: { status: 'danger', label: 'Void' },
  }

  const columns: DataTableColumn<TaxInvoice>[] = [
    {
      id: 'invoice',
      header: 'Invoice # / Date',
      sortable: true,
      cell: (_, row) => (
        <div>
          <p className="font-data text-xs font-bold text-[var(--ink)] hover:text-[var(--accent)] transition-colors">
            {row.invoiceNumber}
          </p>
          <div className="flex items-center gap-1.5 text-[10.5px] text-[var(--muted)] mt-0.5 font-data">
            <span>{row.issueDate}</span>
            <span>·</span>
            <span>Rep: {row.salesRepName || 'Swati'}</span>
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
          <p className="font-ui font-semibold text-xs text-[var(--ink)]">{row.memberName}</p>
          <p className="font-data text-[10.5px] text-[var(--muted)]">{row.memberPhone}</p>
        </div>
      ),
    },
    {
      id: 'plan',
      header: 'Item Description',
      cell: (_, row) => (
        <div>
          <span className="font-ui text-xs font-medium text-[var(--ink-2)] truncate max-w-[220px] block">
            {row.items[0]?.description || 'Studio Fitness Plan'}
          </span>
          <span className="font-data text-[10px] text-[var(--muted-2)]">
            SAC: {row.items[0]?.sacCode || '999723'} · {(row.items[0]?.taxRate ? Math.round(row.items[0].taxRate * 100) : 5)}% GST
          </span>
        </div>
      ),
    },
    {
      id: 'amount',
      header: 'Gross Total',
      align: 'right',
      sortable: true,
      cell: (_, row) => (
        <div>
          <p className="font-data font-bold text-xs text-[var(--ink)] tabular-nums">
            {formatINR(row.grandTotalMinor)}
          </p>
          <p className="font-data text-[10px] text-[var(--muted)] tabular-nums">
            GST: {formatINR((row.cgstMinor || 0) + (row.sgstMinor || 0))}
          </p>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Payment Status',
      cell: (v) => {
        const item = statusMap[v as InvoiceStatus] || { status: 'neutral', label: String(v) }
        return <Badge status={item.status} size="sm">{item.label}</Badge>
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'right',
      cell: (_, row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              setSelectedInvoice(row)
              setInvoiceModalOpen(true)
            }}
          >
            PDF / View
          </Button>
        </div>
      ),
    },
  ]

  const totalBilled = invoices.reduce((acc, inv) => inv.status === 'paid' ? acc + (inv.grandTotalMinor || 0) : acc, 0)
  const totalTax = invoices.reduce((acc, inv) => inv.status === 'paid' ? acc + ((inv.cgstMinor || 0) + (inv.sgstMinor || 0)) : acc, 0)

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none">
      {/* 1. Header */}
      <PageHeader
        eyebrow="FINANCE & COMPLIANCE · TAX INVOICES"
        title="Invoices & Billing"
        description="Back-calculated GST tax invoice engine, SAC 999723 fitness tariffs, automated credit notes, and audit-ready GSTR-1 exports."
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={() => setCreateInvoiceOpen(true)}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Raise tax invoice
          </Button>
        }
      />

      {/* 2. Stat Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="BILLED REVENUE (MTD)"
          value={formatINR(totalBilled)}
          unit="PAID"
          icon={<Receipt className="w-4 h-4 text-[var(--green)]" />}
        />
        <StatTile
          label="GST COLLECTED (MTD)"
          value={formatINR(totalTax)}
          unit="5% SAC 999723"
          icon={<CreditCard className="w-4 h-4 text-[var(--accent)]" />}
        />
        <StatTile
          label="PAID INVOICES"
          value={invoices.filter((i) => i.status === 'paid').length}
          unit="INVOICES"
          icon={<CheckCircle className="w-4 h-4 text-[var(--green)]" />}
        />
        <StatTile
          label="PENDING COLLECTION"
          value={invoices.filter((i) => i.status === 'pending' || i.status === 'overdue').length}
          unit="RECEIVABLES"
          icon={<Clock className="w-4 h-4 text-[var(--amber)]" />}
          delta={{ text: 'Follow up required', type: 'warn' }}
        />
      </div>

      {/* 3. Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice #, member name, or phone..."
            className="w-full h-[36px] pl-9 pr-3.5 font-ui text-xs rounded-[var(--r-sm)] bg-[var(--bg-elev)] border border-[var(--line)] text-[var(--ink)] placeholder:text-[var(--muted-2)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-[36px] px-3 font-ui text-xs rounded-[var(--r-sm)] bg-[var(--bg-elev)] border border-[var(--line)] text-[var(--ink)] outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
            <option value="void">Void</option>
          </select>
        </div>
      </div>

      {/* 4. Invoices Table */}
      <DataTable
        columns={columns}
        data={invoices}
        status="success"
        pageSize={pageSize}
        total={invoices.length}
        page={page}
        onPageChange={setPage}
        onRowClick={(row) => {
          setSelectedInvoice(row)
          setInvoiceModalOpen(true)
        }}
      />

      {/* Modals */}
      <InvoiceModal
        open={invoiceModalOpen}
        onOpenChange={setInvoiceModalOpen}
        invoice={selectedInvoice}
        onVoid={(inv) => {
          voidInvoice(inv.id, 'Voided by administrative supervisor')
          toast.success('Invoice marked VOID')
          refreshInvoices()
        }}
        onCreditNote={(inv) => {
          setInvoiceModalOpen(false)
          setCreditNoteInvoice(inv)
        }}
      />

      <CreateInvoiceModal
        open={createInvoiceOpen}
        onOpenChange={setCreateInvoiceOpen}
        onInvoiceCreated={refreshInvoices}
      />

      <CreditNoteModal
        open={!!creditNoteInvoice}
        onOpenChange={(op) => { if (!op) setCreditNoteInvoice(null) }}
        invoice={creditNoteInvoice}
        onIssued={refreshInvoices}
      />
    </div>
  )
}
