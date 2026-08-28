'use client'

import React, { useState, useEffect } from 'react'
import { Radio, Save } from 'lucide-react'
import { Modal } from '@/components/app/ui/modal'
import { Button } from '@/components/app/ui/button'
import { Input } from '@/components/app/ui/input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/app/ui/select'
import { saveTurnstile, getStoredBranches } from '@/lib/settings'
import type { TurnstileDeviceConfig } from '@/types/settings'
import { toast } from '@/components/app/ui/toast'

export default function TurnstileModal({
  turnstile,
  open,
  onOpenChange,
  onSaved,
}: {
  turnstile: TurnstileDeviceConfig | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}) {
  const branches = getStoredBranches()
  const [name, setName] = useState('')
  const [branchId, setBranchId] = useState(branches[0]?.id || 'branch_pow')
  const [ipAddress, setIpAddress] = useState('192.168.1.104')
  const [port, setPort] = useState(8080)
  const [type, setType] = useState<TurnstileDeviceConfig['type']>('entry')
  const [relayDurationMs, setRelayDurationMs] = useState(3500)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (turnstile) {
      setName(turnstile.name)
      setBranchId(turnstile.branchId)
      setIpAddress(turnstile.ipAddress)
      setPort(turnstile.port)
      setType(turnstile.type)
      setRelayDurationMs(turnstile.relayDurationMs)
    } else {
      setName('')
      setBranchId(branches[0]?.id || 'branch_pow')
      setIpAddress('192.168.1.104')
      setPort(8080)
      setType('entry')
      setRelayDurationMs(3500)
    }
  }, [turnstile, open])

  const selectedBranch = branches.find((b) => b.id === branchId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !ipAddress.trim()) return

    setLoading(true)

    saveTurnstile({
      id: turnstile?.id || `turn_${Date.now()}`,
      name: name.trim(),
      branchId,
      branchName: selectedBranch?.name || 'Powai Flagship',
      ipAddress: ipAddress.trim(),
      port,
      type,
      relayDurationMs,
      firmwareVersion: turnstile?.firmwareVersion || 'v2.4.1-pro',
      pingMs: turnstile?.pingMs || 12,
      status: turnstile?.status || 'online',
    })

    setLoading(false)
    toast.success(`Turnstile Device Saved: ${name}`)
    if (onSaved) onSaved()
    onOpenChange(false)
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={turnstile ? 'Configure Turnstile Controller' : 'Add Turnstile IoT Controller'}
      description="Connect an optical QR scanner and electromagnetic turnstile relay."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Device Name"
          placeholder="e.g. Gate 4 - VIP Studio Turnstile"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--app-text-secondary)]">Assigned Branch</label>
          <Select value={branchId} onValueChange={setBranchId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="IP Address (Static)"
            placeholder="192.168.1.104"
            value={ipAddress}
            onChange={(e) => setIpAddress(e.target.value)}
            required
          />

          <Input
            label="Port"
            type="number"
            value={port}
            onChange={(e) => setPort(Number(e.target.value))}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--app-text-secondary)]">Gate Role</label>
            <Select value={type} onValueChange={(val: any) => setType(val)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="entry">Main Entry Turnstile</SelectItem>
                <SelectItem value="exit">Floor Exit Turnstile</SelectItem>
                <SelectItem value="steam_zone">Steam & Locker Zone</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Input
            label="Relay Pulse Duration (ms)"
            type="number"
            value={relayDurationMs}
            onChange={(e) => setRelayDurationMs(Number(e.target.value))}
            required
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--app-glass-border)]">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading} icon={<Save className="w-4 h-4" />}>
            Save Turnstile
          </Button>
        </div>
      </form>
    </Modal>
  )
}
