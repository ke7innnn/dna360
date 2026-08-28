'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Shield, Plus, ArrowLeft, Trash2, KeyRound,
  CheckCircle, AlertCircle, Info, Sparkles,
} from 'lucide-react'
import GlassCard from '@/components/app/ui/glass-card'
import { Button } from '@/components/app/ui/button'
import { StatusPill } from '@/components/app/ui/badge'
import PermissionMatrix from '@/components/app/settings/PermissionMatrix'
import RoleModal from '@/components/app/settings/RoleModal'
import { ConfirmDialog } from '@/components/app/ui/confirm-dialog'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/components/app/ui/toast'
import type { RoleDefinition } from '@/types/auth'

export default function RolesSettingsPage() {
  const { roles, deleteCustomRole } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)
  const [roleToDelete, setRoleToDelete] = useState<RoleDefinition | null>(null)

  const handleDeleteRole = () => {
    if (!roleToDelete) return
    const ok = deleteCustomRole(roleToDelete.id)
    if (ok) {
      toast.success(`Role "${roleToDelete.name}" deleted`)
    } else {
      toast.error('Cannot delete a system role')
    }
    setRoleToDelete(null)
  }

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--app-text-muted)] hover:text-[var(--app-text-secondary)] transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Settings
          </Link>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--app-text-primary)] tracking-tight">
            Roles & Capability Matrix
          </h1>
          <p className="text-sm text-[var(--app-text-secondary)] mt-1">
            Roles in DNA 360 are records with granular capability toggles, allowing gym owners to build tailor-made staff roles.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          Create Custom Role
        </Button>
      </div>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {roles.map((role) => (
          <GlassCard key={role.id} padding="sm" className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="font-semibold text-sm text-[var(--app-text-primary)]">
                  {role.name}
                </span>
                {role.isSystem ? (
                  <StatusPill status="info" size="sm">System</StatusPill>
                ) : (
                  <button
                    onClick={() => setRoleToDelete(role)}
                    className="text-[var(--app-danger)] hover:opacity-80 p-1 transition-opacity"
                    title="Delete role"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className="text-[0.6875rem] text-[var(--app-text-secondary)] line-clamp-2 leading-relaxed">
                {role.description}
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-[var(--app-glass-border)] flex items-center justify-between text-[0.6875rem] text-[var(--app-text-muted)]">
              <span>Capabilities:</span>
              <span className="font-bold text-[var(--aurora-1)] font-mono">
                {role.slug === 'owner' ? 'All (Unrestricted)' : `${role.capabilities.length} active`}
              </span>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Permission Matrix Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[var(--aurora-1)]" />
            <h2 className="font-display text-lg font-semibold text-[var(--app-text-primary)] tracking-tight">
              Interactive Permissions Matrix
            </h2>
          </div>
          <p className="text-xs text-[var(--app-text-muted)]">
            Click any checkbox to grant or revoke specific capabilities in real-time.
          </p>
        </div>

        <PermissionMatrix />
      </div>

      {/* Role Creation Modal */}
      <RoleModal open={modalOpen} onOpenChange={setModalOpen} />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!roleToDelete}
        onOpenChange={(open) => !open && setRoleToDelete(null)}
        title="Delete Custom Role"
        description={`Are you sure you want to delete "${roleToDelete?.name}"? Staff currently assigned this role will lose their custom capabilities.`}
        variant="danger"
        confirmLabel="Delete Role"
        onConfirm={handleDeleteRole}
      />
    </div>
  )
}
