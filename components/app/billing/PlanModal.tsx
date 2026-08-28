'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Dumbbell, Sparkles, Check, Trash2 } from 'lucide-react'
import { Modal } from '@/components/app/ui/modal'
import { Button } from '@/components/app/ui/button'
import { Input } from '@/components/app/ui/input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/app/ui/select'
import { formatINR } from '@/lib/utils'
import { createPlan, updatePlan } from '@/lib/billing'
import type { GymPlan } from '@/types/billing'
import { toast } from '@/components/app/ui/toast'

export default function PlanModal({
  plan,
  open,
  onOpenChange,
  onSaved,
}: {
  plan: GymPlan | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}) {
  const isEditing = !!plan

  const [name, setName] = useState('')
  const [type, setType] = useState<GymPlan['type']>('annual')
  const [durationMonths, setDurationMonths] = useState(12)
  const [basePriceRupees, setBasePriceRupees] = useState(45000)
  const [ptSessionsCount, setPtSessionsCount] = useState(4)
  const [guestPassesCount, setGuestPassesCount] = useState(2)
  const [steamAccess, setSteamAccess] = useState(true)
  const [branchScope, setBranchScope] = useState<'all' | 'pow' | 'and'>('all')
  const [featureInput, setFeatureInput] = useState('')
  const [features, setFeatures] = useState<string[]>([])

  useEffect(() => {
    if (plan) {
      setName(plan.name)
      setType(plan.type)
      setDurationMonths(plan.durationMonths)
      setBasePriceRupees(Math.round(plan.basePriceMinor / 100))
      setPtSessionsCount(plan.ptSessionsCount)
      setGuestPassesCount(plan.guestPassesCount)
      setSteamAccess(plan.steamAccess)
      setBranchScope((plan.branchIds && plan.branchIds.length > 1) ? 'all' : (plan.branchIds?.[0] as any) || 'pow')
      setFeatures(plan.features || [])
    } else {
      setName('')
      setType('annual')
      setDurationMonths(12)
      setBasePriceRupees(40000)
      setPtSessionsCount(4)
      setGuestPassesCount(2)
      setSteamAccess(true)
      setBranchScope('all')
      setFeatures(['Unlimited floor access', 'Locker & shower facilities'])
    }
  }, [plan, open])

  const basePriceMinor = basePriceRupees * 100
  const gstMinor = Math.round(basePriceMinor * 0.18)
  const grandTotalMinor = basePriceMinor + gstMinor

  const handleAddFeature = () => {
    if (!featureInput.trim()) return
    setFeatures([...features, featureInput.trim()])
    setFeatureInput('')
  }

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const branchIds = branchScope === 'all' ? ['pow', 'and'] : [branchScope]

    if (isEditing && plan) {
      updatePlan(plan.id, {
        name: name.trim(),
        type,
        durationMonths,
        basePriceMinor,
        ptSessionsCount,
        guestPassesCount,
        steamAccess,
        branchIds,
        features,
      })
      toast.success(`Plan ${name} updated`)
    } else {
      createPlan({
        name: name.trim(),
        type,
        durationMonths,
        basePriceMinor,
        branchIds,
        ptSessionsCount,
        guestPassesCount,
        steamAccess,
        features,
        isActive: true,
      })
      toast.success(`Plan ${name} created`)
    }

    if (onSaved) onSaved()
    onOpenChange(false)
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Edit Membership Plan' : 'Create New Membership Plan'}
      description="Configure pricing tiers, PT allowances, and GST ledger rules."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Plan Name"
          placeholder="e.g. Annual All-Access Premium"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--app-text-secondary)]">Plan Category</label>
            <Select value={type} onValueChange={(val: any) => setType(val)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="annual">Annual (12 Months)</SelectItem>
                <SelectItem value="semi_annual">6-Month</SelectItem>
                <SelectItem value="quarterly">Quarterly (3 Months)</SelectItem>
                <SelectItem value="monthly">Monthly (1 Month)</SelectItem>
                <SelectItem value="pt_pack">PT Session Pack</SelectItem>
                <SelectItem value="day_pass">Single Day Pass</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--app-text-secondary)]">Branch Access</label>
            <Select value={branchScope} onValueChange={(val: any) => setBranchScope(val)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches (Powai + Andheri)</SelectItem>
                <SelectItem value="pow">Powai Only</SelectItem>
                <SelectItem value="and">Andheri Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Pricing Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Base Price (₹ excl. GST)"
            type="number"
            value={basePriceRupees}
            onChange={(e) => setBasePriceRupees(Number(e.target.value))}
            required
          />

          <Input
            label="Free PT Sessions"
            type="number"
            value={ptSessionsCount}
            onChange={(e) => setPtSessionsCount(Number(e.target.value))}
          />

          <Input
            label="Guest Passes"
            type="number"
            value={guestPassesCount}
            onChange={(e) => setGuestPassesCount(Number(e.target.value))}
          />
        </div>

        {/* GST Live Calculation Bar */}
        <div className="p-3.5 rounded-xl glass-card text-xs font-mono border border-[var(--aurora-1)]/20 space-y-1.5">
          <div className="flex justify-between text-[var(--app-text-muted)]">
            <span>Base Price:</span>
            <span>{formatINR(basePriceMinor)}</span>
          </div>
          <div className="flex justify-between text-[var(--app-text-secondary)]">
            <span>18% GST (CGST 9% + SGST 9%):</span>
            <span>{formatINR(gstMinor)}</span>
          </div>
          <div className="flex justify-between font-bold text-sm text-[var(--app-text-primary)] pt-1 border-t border-[var(--app-glass-border)]">
            <span>Total Member Payable:</span>
            <span className="text-[var(--aurora-1)]">{formatINR(grandTotalMinor)}</span>
          </div>
        </div>

        {/* Plan Features */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase text-[var(--app-text-muted)]">
            Included Plan Features
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add feature (e.g. Steam & Sauna, Free Towel)..."
              value={featureInput}
              onChange={(e) => setFeatureInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddFeature()
                }
              }}
              className="flex-1 h-9 px-3 text-xs glass-input text-[var(--app-text-primary)] placeholder:text-[var(--app-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--app-focus-ring)]"
            />
            <Button type="button" variant="secondary" size="sm" onClick={handleAddFeature}>
              Add
            </Button>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {features.map((f, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 text-[0.6875rem] px-2.5 py-1 rounded-full bg-[var(--app-glass-bg)] border border-[var(--app-glass-border)] text-[var(--app-text-secondary)]"
              >
                <span>{f}</span>
                <button type="button" onClick={() => handleRemoveFeature(i)} className="hover:text-[var(--app-danger)]">
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--app-glass-border)]">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {isEditing ? 'Save Changes' : 'Create Plan'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
