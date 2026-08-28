'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/app/ui/modal'
import { Button } from '@/components/app/ui/button'
import { Input } from '@/components/app/ui/input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/app/ui/select'
import { useAuth } from '@/context/AuthContext'
import { SEEDED_ROLES } from '@/config/permissions'
import { toast } from '@/components/app/ui/toast'
import type { Capability } from '@/config/permissions'

export default function RoleModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { createCustomRole } = useAuth()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [preset, setPreset] = useState<'front_desk' | 'trainer' | 'manager' | 'empty'>('front_desk')
  const [error, setError] = useState<string | null>(null)

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Role name is required')
      return
    }

    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')

    let initialCapabilities: Capability[] = []
    if (preset === 'front_desk') initialCapabilities = [...SEEDED_ROLES.front_desk]
    if (preset === 'trainer') initialCapabilities = [...SEEDED_ROLES.trainer]
    if (preset === 'manager') initialCapabilities = [...SEEDED_ROLES.manager]

    const newRole = createCustomRole({
      name: name.trim(),
      slug,
      description: description.trim() || `Custom role for ${name.trim()}`,
      capabilities: initialCapabilities,
    })

    toast.success(`Role "${newRole.name}" created`, {
      description: 'You can now configure its permissions in the matrix below.',
    })

    setName('')
    setDescription('')
    setError(null)
    onOpenChange(false)
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Create Custom Role"
      description="Define a new staff or partner capability record."
      size="md"
    >
      <form onSubmit={handleCreate} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-[var(--app-danger)]/10 border border-[var(--app-danger)]/20 text-xs text-[var(--app-danger)]">
            {error}
          </div>
        )}

        <Input
          label="Role Name"
          placeholder="e.g. Head Trainer, Accountant, Sales Lead"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            if (error) setError(null)
          }}
          autoFocus
        />

        <Input
          label="Description"
          placeholder="e.g. Sales team supervisor responsible for trial conversions"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--app-text-secondary)]">
            Base Capabilities Preset
          </label>
          <Select value={preset} onValueChange={(val: any) => setPreset(val)}>
            <SelectTrigger>
              <SelectValue placeholder="Select initial capability baseline" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="front_desk">Front Desk Baseline (Fast Operations)</SelectItem>
              <SelectItem value="trainer">Trainer Baseline (Client Roster & PT)</SelectItem>
              <SelectItem value="manager">Manager Baseline (Supervision & Reports)</SelectItem>
              <SelectItem value="empty">Empty (Start from scratch)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--app-glass-border)]">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Create Role
          </Button>
        </div>
      </form>
    </Modal>
  )
}
