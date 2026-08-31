'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Shield, Plus, ArrowLeft, Trash2, KeyRound,
  CheckCircle, AlertCircle, Info, Sparkles, Lock,
} from 'lucide-react'
import Card from '@/components/app/ui/glass-card'
import Button from '@/components/app/ui/button'
import Badge, { StatusPill } from '@/components/app/ui/badge'
import PageHeader from '@/components/app/ui/PageHeader'
import PermissionMatrix from '@/components/app/settings/PermissionMatrix'
import RoleModal from '@/components/app/settings/RoleModal'
import { ConfirmDialog } from '@/components/app/ui/confirm-dialog'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/components/app/ui/toast'
import type { RoleDefinition } from '@/types/auth'

import Breadcrumbs from '@/components/app/ui/Breadcrumbs'

export default function RolesSettingsPage() {
  const { roles, deleteCustomRole, can, user } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)
  const [roleToDelete, setRoleToDelete] = useState<RoleDefinition | null>(null)

  const isOwner = user?.role.slug.toUpperCase() === 'OWNER' || can('roles.assign')

  const handleDeleteRole = () => {
    if (!roleToDelete) return
    if (!isOwner) {
      toast.error('Only the Club Owner can delete custom role definitions.')
      return
    }
    const ok = deleteCustomRole(roleToDelete.id)
    if (ok) {
      toast.success(`Role "${roleToDelete.name}" deleted`)
    } else {
      toast.error('Cannot delete a system role')
    }
    setRoleToDelete(null)
  }

  return (
    <div className="space-y-7 max-w-7xl mx-auto select-none">
      <Breadcrumbs
        items={[
          { label: 'Club Settings', href: '/settings' },
          { label: 'Staff Roles & Capabilities' },
        ]}
      />

      {/* Header */}
      <PageHeader
        eyebrow="ADMINISTRATION · STAFF ACCESS"
        title="Staff Roles & Capabilities"
        description="Fine-grained permissions, staff security tiers, and dynamic role capability matrix for front-desk, trainers, and accounting staff."
        actions={
          isOwner ? (
            <Button
              variant="primary"
              size="md"
              onClick={() => setModalOpen(true)}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Create custom role
            </Button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface-2)] border border-[var(--line)] text-xs text-[var(--muted)]">
              <Lock className="w-3.5 h-3.5 text-[var(--amber)]" />
              <span className="font-data text-[10.5px]">Role Assignment Restricted (Owner Only)</span>
            </div>
          )
        }
      />

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {roles.map((role) => (
          <Card key={role.id} className="p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="font-display font-semibold text-sm text-[var(--ink)]">
                  {role.name}
                </span>
                {role.isSystem ? (
                  <Badge status="info" size="sm">System</Badge>
                ) : isOwner ? (
                  <button
                    onClick={() => setRoleToDelete(role)}
                    className="text-[var(--accent)] hover:opacity-80 p-1 transition-opacity cursor-pointer"
                    title="Delete role"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                ) : null}
              </div>
              <p className="font-ui text-xs text-[var(--muted)] line-clamp-2 leading-relaxed">
                {role.description}
              </p>
            </div>

            <div className="mt-3.5 pt-2.5 border-t border-[var(--line)] flex items-center justify-between text-xs font-ui text-[var(--muted)]">
              <span>Capabilities:</span>
              <span className="font-bold text-[var(--accent)] font-data tabular-nums">
                {role.slug.toUpperCase() === 'OWNER' ? 'All (Unrestricted)' : `${role.capabilities.length} active`}
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Permission Matrix */}
      <PermissionMatrix />

      {/* Role Modal */}
      <RoleModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={() => {
          setModalOpen(false)
          toast.success('New role definition added')
        }}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={!!roleToDelete}
        onOpenChange={(op) => !op && setRoleToDelete(null)}
        title="Delete Role Definition"
        description={`Are you sure you want to permanently delete "${roleToDelete?.name}"? Staff assigned to this role will lose their custom capabilities.`}
        confirmLabel="Delete Role"
        variant="danger"
        onConfirm={handleDeleteRole}
      />
    </div>
  )
}
