'use client'

import React, { useState } from 'react'
import { DollarSign, CheckCircle, AlertTriangle, ShieldCheck, Calculator } from 'lucide-react'
import { Modal } from '@/components/app/ui/modal'
import { Button } from '@/components/app/ui/button'
import { Input } from '@/components/app/ui/input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/app/ui/select'
import { closeShiftHandover } from '@/lib/frontdesk'
import { formatINR } from '@/lib/utils'
import type { CashShiftHandover } from '@/types/frontdesk'
import { toast } from '@/components/app/ui/toast'
import { cn } from '@/lib/utils'

export default function ShiftHandoverModal({
  open,
  onOpenChange,
  onShiftClosed,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onShiftClosed?: (shift: CashShiftHandover) => void
}) {
  const [shiftType, setShiftType] = useState<CashShiftHandover['shiftType']>('evening')
  const [staffName, setStaffName] = useState('Amit Sharma')
  const [openingFloat, setOpeningFloat] = useState(5000) // ₹5,000
  const [cashSales, setCashSales] = useState(18200) // ₹18,200
  const [pettyCash, setPettyCash] = useState(400) // ₹400
  const [actualCounted, setActualCounted] = useState(22800) // ₹22,800
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const expectedCash = openingFloat + cashSales - pettyCash
  const discrepancy = actualCounted - expectedCash

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const closed = closeShiftHandover({
      branchId: 'pow',
      branchName: 'Powai',
      shiftType,
      staffId: 'usr_fd_01',
      staffName,
      openedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
      openingFloatMinor: openingFloat * 100,
      cashSalesMinor: cashSales * 100,
      pettyCashOutflowsMinor: pettyCash * 100,
      expectedCashMinor: expectedCash * 100,
      actualCashCountedMinor: actualCounted * 100,
      notes: notes.trim() || undefined,
    })

    setLoading(false)
    toast.success(`Shift Handover Reconciled`, {
      description: `Discrepancy: ${discrepancy >= 0 ? '+' : ''}${formatINR(discrepancy * 100)} logged to audit ledger.`,
    })

    if (onShiftClosed) onShiftClosed(closed)
    onOpenChange(false)
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Cash Drawer & Shift Handover"
      description="Reconcile register cash float, POS cash receipts, and handover to incoming shift."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--app-text-secondary)]">Shift</label>
            <Select value={shiftType} onValueChange={(val: any) => setShiftType(val)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">Morning Shift (06:00 - 14:00 IST)</SelectItem>
                <SelectItem value="evening">Evening Shift (14:00 - 22:00 IST)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Input
            label="Handover Staff Name"
            value={staffName}
            onChange={(e) => setStaffName(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Opening Float (₹)"
            type="number"
            value={openingFloat}
            onChange={(e) => setOpeningFloat(Number(e.target.value))}
            required
          />
          <Input
            label="Cash Collections (₹)"
            type="number"
            value={cashSales}
            onChange={(e) => setCashSales(Number(e.target.value))}
            required
          />
          <Input
            label="Petty Cash Out (₹)"
            type="number"
            value={pettyCash}
            onChange={(e) => setPettyCash(Number(e.target.value))}
          />
        </div>

        {/* Expected vs Actual Count */}
        <div className="p-4 rounded-xl glass-card border border-[var(--app-glass-border)] space-y-3 font-mono text-xs">
          <div className="flex justify-between text-[var(--app-text-secondary)]">
            <span>Expected Cash in Drawer:</span>
            <span className="font-bold text-[var(--app-text-primary)]">{formatINR(expectedCash * 100)}</span>
          </div>

          <Input
            label="Physical Cash Counted (₹)"
            type="number"
            value={actualCounted}
            onChange={(e) => setActualCounted(Number(e.target.value))}
            required
          />

          <div
            className={cn(
              'p-2.5 rounded-lg flex items-center justify-between font-bold',
              discrepancy === 0
                ? 'bg-[var(--app-success)]/10 text-[var(--app-success)] border border-[var(--app-success)]/20'
                : discrepancy > 0
                ? 'bg-[var(--app-info)]/10 text-[var(--app-info)] border border-[var(--app-info)]/20'
                : 'bg-[var(--app-danger)]/10 text-[var(--app-danger)] border border-[var(--app-danger)]/20'
            )}
          >
            <span>Discrepancy (Surplus / Shortage):</span>
            <span>
              {discrepancy >= 0 ? `+${formatINR(discrepancy * 100)}` : formatINR(discrepancy * 100)}
            </span>
          </div>
        </div>

        <Input
          label="Shift Handover Notes & Exception Log"
          placeholder="e.g. Paid ₹400 for front desk cleaning supplies (Receipt #42 Attached)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--app-glass-border)]">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading} icon={<CheckCircle className="w-4 h-4" />}>
            Reconcile & Close Shift
          </Button>
        </div>
      </form>
    </Modal>
  )
}
