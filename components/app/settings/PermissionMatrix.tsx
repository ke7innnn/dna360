'use client'

import React, { useState } from 'react'
import { Check, Lock, Shield, Info, HelpCircle } from 'lucide-react'
import { CAPABILITY_GROUPS, type Capability } from '@/config/permissions'
import { useAuth } from '@/context/AuthContext'
import type { RoleDefinition } from '@/types/auth'
import { toast } from '@/components/app/ui/toast'
import { cn } from '@/lib/utils'

export default function PermissionMatrix() {
  const { roles, updateRolePermissions } = useAuth()
  const [hoveredCap, setHoveredCap] = useState<string | null>(null)

  const handleToggle = (role: RoleDefinition, capId: Capability) => {
    if (role.slug === 'owner') {
      toast.info('Owner role retains full unrestricted capabilities')
      return
    }

    const hasIt = role.capabilities.includes(capId)
    const newCaps = hasIt
      ? role.capabilities.filter((c) => c !== capId)
      : [...role.capabilities, capId]

    updateRolePermissions(role.id, newCaps)
    toast.success(`Updated ${role.name} permissions`, {
      description: `${hasIt ? 'Removed' : 'Granted'} ${capId}`,
    })
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          {/* Table Header: Roles */}
          <thead>
            <tr className="border-b border-[var(--app-glass-border)] bg-[var(--app-glass-bg)]/50">
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--app-text-muted)] min-w-[280px]">
                Capability / Domain
              </th>
              {roles.map((role) => (
                <th
                  key={role.id}
                  className="px-4 py-4 text-center min-w-[120px]"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-semibold text-[var(--app-text-primary)]">
                      {role.name}
                    </span>
                    {role.isSystem ? (
                      <span className="text-[0.625rem] px-1.5 py-0.5 rounded-full bg-[var(--aurora-1)]/10 text-[var(--aurora-1)] border border-[var(--aurora-1)]/20 font-medium">
                        System
                      </span>
                    ) : (
                      <span className="text-[0.625rem] px-1.5 py-0.5 rounded-full bg-[var(--app-warning)]/10 text-[var(--app-warning)] border border-[var(--app-warning)]/20 font-medium">
                        Custom
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Grouped Capabilities */}
          <tbody>
            {CAPABILITY_GROUPS.map((group) => (
              <React.Fragment key={group.id}>
                {/* Domain Section Header */}
                <tr className="border-b border-[var(--app-glass-border)] bg-[var(--app-sidebar-active)]/40">
                  <td
                    colSpan={roles.length + 1}
                    className="px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--aurora-1)]"
                  >
                    {group.name}
                    <span className="ml-2 font-normal text-[0.6875rem] text-[var(--app-text-muted)] lowercase">
                      · {group.description}
                    </span>
                  </td>
                </tr>

                {/* Individual Capability Rows */}
                {group.capabilities.map((cap) => (
                  <tr
                    key={cap.id}
                    className="border-b border-[var(--app-glass-border)] hover:bg-[var(--app-glass-bg)] transition-colors"
                  >
                    {/* Capability Name & Description */}
                    <td className="px-5 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-medium text-[var(--app-text-primary)]">
                            {cap.name}
                          </p>
                          <p className="text-[0.6875rem] text-[var(--app-text-muted)] mt-0.5">
                            {cap.description}
                          </p>
                        </div>
                        <span className="text-[0.625rem] font-mono text-[var(--app-text-muted)] bg-[var(--app-glass-bg)] px-1.5 py-0.5 rounded">
                          {cap.id}
                        </span>
                      </div>
                    </td>

                    {/* Role Checkbox Cells */}
                    {roles.map((role) => {
                      const isOwner = role.slug === 'owner'
                      const isGranted = isOwner || role.capabilities.includes(cap.id)

                      return (
                        <td
                          key={role.id}
                          className="px-4 py-3 text-center align-middle"
                        >
                          <button
                            type="button"
                            onClick={() => handleToggle(role, cap.id)}
                            disabled={isOwner}
                            className={cn(
                              'w-6 h-6 rounded-md inline-flex items-center justify-center transition-all',
                              isGranted
                                ? 'bg-gradient-to-br from-[var(--aurora-1)] to-[var(--aurora-2)] text-white shadow-sm'
                                : 'glass-input hover:border-[var(--app-glass-hover-border)] text-transparent',
                              isOwner && 'cursor-default opacity-85',
                              !isOwner && 'cursor-pointer hover:scale-105 active:scale-95'
                            )}
                            aria-label={`${cap.name} for ${role.name}`}
                          >
                            {isGranted && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
