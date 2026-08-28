'use client'

import React, { useState, useEffect } from 'react'
import { Building2, Save } from 'lucide-react'
import { Modal } from '@/components/app/ui/modal'
import { Button } from '@/components/app/ui/button'
import { Input } from '@/components/app/ui/input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/app/ui/select'
import { saveBranch } from '@/lib/settings'
import type { BranchConfig } from '@/types/settings'
import { toast } from '@/components/app/ui/toast'

export default function BranchModal({
  branch,
  open,
  onOpenChange,
  onSaved,
}: {
  branch: BranchConfig | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('+91')
  const [email, setEmail] = useState('')
  const [capacity, setCapacity] = useState(100)
  const [openingTime, setOpeningTime] = useState('06:00')
  const [closingTime, setClosingTime] = useState('22:00')
  const [status, setStatus] = useState<BranchConfig['status']>('active')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (branch) {
      setName(branch.name)
      setCode(branch.code)
      setAddress(branch.address)
      setPhone(branch.phone)
      setEmail(branch.email)
      setCapacity(branch.capacity)
      setOpeningTime(branch.openingTime)
      setClosingTime(branch.closingTime)
      setStatus(branch.status)
    } else {
      setName('')
      setCode('')
      setAddress('')
      setPhone('+91')
      setEmail('')
      setCapacity(100)
      setOpeningTime('06:00')
      setClosingTime('22:00')
      setStatus('active')
    }
  }, [branch, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !code.trim()) return

    setLoading(true)

    saveBranch({
      id: branch?.id || `branch_${Date.now()}`,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      address: address.trim(),
      phone: phone.trim(),
      email: email.trim(),
      capacity,
      openingTime,
      closingTime,
      status,
      gateDeviceIds: branch?.gateDeviceIds || [],
    })

    setLoading(false)
    toast.success(`Branch ${name} (${code}) Saved Successfully`)
    if (onSaved) onSaved()
    onOpenChange(false)
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={branch ? 'Edit Gym Branch Location' : 'Provision New Gym Branch'}
      description="Configure location details, floor capacity, operating hours, and turnstiles."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <Input
              label="Branch Name"
              placeholder="e.g. Bandra Kurla Complex (BKC)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <Input
            label="Branch Code"
            placeholder="BKC"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
        </div>

        <Input
          label="Physical Club Address"
          placeholder="e.g. Godrej BKC, G Block, Bandra East, Mumbai 400051"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <Input
            label="Email"
            type="email"
            placeholder="bkc@dna360.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Floor Capacity"
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
            required
          />
          <Input
            label="Opens (IST)"
            type="time"
            value={openingTime}
            onChange={(e) => setOpeningTime(e.target.value)}
            required
          />
          <Input
            label="Closes (IST)"
            type="time"
            value={closingTime}
            onChange={(e) => setClosingTime(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--app-text-secondary)]">Location Status</label>
          <Select value={status} onValueChange={(val: any) => setStatus(val)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active & Operational</SelectItem>
              <SelectItem value="provisioning">Provisioning / Under Fit-Out</SelectItem>
              <SelectItem value="closed">Temporarily Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--app-glass-border)]">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading} icon={<Save className="w-4 h-4" />}>
            Save Branch
          </Button>
        </div>
      </form>
    </Modal>
  )
}
