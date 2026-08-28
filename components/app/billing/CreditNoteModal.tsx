'use client'

import React, { useState } from 'react'
import { AlertTriangle, FileText, CheckCircle, RefreshCcw, ShieldAlert } from 'lucide-react'
import { Modal } from '@/components/app/ui/modal'
import { Button } from '@/components/app/ui/button'
import { Input } from '@/components/app/ui/input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/app/ui/select'
import { formatINR } from '@/lib/gst'
import { voidInvoice } from '@/lib/billing'
import type { TaxInvoice, CreditNote } from '@/types/billing'
import { toast } from '@/components/app/ui/toast'

export default function CreditNoteModal({
  invoice,
  open,
  onOpenChange,
  onCreditNoteIssued,
}: {
  invoice: TaxInvoice | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreditNoteIssued?: () => void
}) {
  const [reason, setReason] = useState<string>('Billing Error / Incorrect Plan Charged')
  const [notes, setNotes] = useState('')
  const [voidOnly, setVoidOnly] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!invoice) return null

  const handleIssue = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const res = voidInvoice({
      invoiceId: invoice.id,
      voidReason: `${reason}: ${notes || 'No extra notes'}`,
      voidedBy: {
        id: 'usr_mgr_sales_head',
        name: 'Vikramaditya Shinde',
        role: 'Asst. Sales Head',
      },
      issueCreditNote: !voidOnly,
    })

    setLoading(false)
    if (res.success) {
      toast.success(res.creditNote ? `Credit Note Issued: ${res.creditNote.creditNoteNumber}` : `Invoice ${invoice.invoiceNumber} Voided`, {
        description: `Invoice status updated to void. Audit trail recorded.`,
      })
      if (onCreditNoteIssued) onCreditNoteIssued()
      onOpenChange(false)
    } else {
      toast.error(res.error || 'Failed to void invoice')
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Void Tax Invoice / Issue GST Credit Note"
      description={`Against Invoice: ${invoice.invoiceNumber} (${invoice.memberName})`}
      size="md"
    >
      <form onSubmit={handleIssue} className="space-y-4">
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 space-y-1">
          <p className="font-semibold flex items-center gap-1.5 text-amber-200">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            DNA 360 Statutory Notice — No Refund Policy
          </p>
          <p className="leading-relaxed">
            Per DNA 360 signed terms, memberships are non-refundable. Voiding and Credit Note generation are restricted to <strong>billing corrections</strong> and managerial reconciliations only.
          </p>
        </div>

        <div className="p-3.5 rounded-xl glass-input space-y-1 text-xs font-mono">
          <div className="flex justify-between text-[var(--app-text-secondary)]">
            <span>Original Total Paid:</span>
            <span className="font-bold text-[var(--app-text-primary)]">{formatINR(invoice.paidAmountMinor)}</span>
          </div>
          <div className="flex justify-between text-[var(--app-text-muted)]">
            <span>Taxable Amount:</span>
            <span>{formatINR(invoice.taxableMinor)}</span>
          </div>
          <div className="flex justify-between text-[var(--app-text-muted)]">
            <span>GST Reversal (5%):</span>
            <span>{formatINR(invoice.cgstMinor + invoice.sgstMinor)}</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--app-text-secondary)]">
            Void / Correction Reason *
          </label>
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Billing Error / Incorrect Plan Charged">Billing Error / Incorrect Plan Charged</SelectItem>
              <SelectItem value="Duplicate Transaction Recorded">Duplicate Transaction Recorded</SelectItem>
              <SelectItem value="Cheque Dishonour Reversal">Cheque Dishonour Reversal</SelectItem>
              <SelectItem value="Management Discretionary Adjustment">Management Discretionary Adjustment</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Input
          label="Detailed Audit Notes *"
          placeholder="e.g. Member re-enrolled on annual tier under invoice #DNA/2026-27/0008"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          required
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--app-glass-border)]">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" loading={loading} icon={<AlertTriangle className="w-4 h-4" />}>
            Confirm Void & Issue Credit Note
          </Button>
        </div>
      </form>
    </Modal>
  )
}
