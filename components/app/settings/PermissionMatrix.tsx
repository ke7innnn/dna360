'use client'

import React, { useState } from 'react'
import { Check, Lock, Shield, Info, HelpCircle } from 'lucide-react'
import { CAPABILITY_GROUPS, type Capability } from '@/config/permissions'
import { useAuth } from '@/context/AuthContext'
import type { RoleDefinition } from '@/types/auth'
import { toast } from '@/components/app/ui/toast'
import { cn } from '@/lib/utils'

export default function PermissionMatrix() {
  const { roles, updateRolePermissions, can, user } = useAuth()
  const [hoveredCap, setHoveredCap] = useState<string | null>(null)

  const isOwner = user?.role.slug.toUpperCase() === 'OWNER' || can('roles.assign')

  const handleToggle = (role: RoleDefinition, capId: Capability) => {
    if (!isOwner) {
      toast.error('Only the Club Owner can modify role capability sets.')
      return
    }

    if (role.slug.toUpperCase() === 'OWNER') {
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
    <div className="card overflow-hidden select-none">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          {/* Table Header: Roles */}
          <thead>
            <tr className="border-b border-[var(--line)] bg-[var(--surface-2)]">
              <th className="px-5 py-4 text-left font-data text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)] min-w-[280px]">
                Capability / Domain
              </th>
              {roles.map((role) => (
                <th
                  key={role.id}
                  className="px-3 py-4 text-center min-w-[110px]"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-ui text-xs font-semibold text-[var(--ink)] truncate max-w-[120px]">
                      {role.name}
                    </span>
                    {role.isSystem ? (
                      <span className="font-ui text-[9px] px-1.5 py-0.2 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] border border-[rgba(59,130,246,0.30)] font-semibold">
                        SYSTEM
                      </span>
                    ) : (
                      <span className="font-ui text-[9px] px-1.5 py-0.2 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] border border-[rgba(59,130,246,0.30)] font-semibold">
                        CUSTOM
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
                <tr className="border-b border-[var(--line)] bg-[var(--bg-elev)]">
                  <td
                    colSpan={roles.length + 1}
                    className="px-5 py-2.5 font-data text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]"
                  >
                    {group.name}
                    <span className="ml-2 font-ui font-normal text-xs text-[var(--muted)] lowercase">
                      · {group.description}
                    </span>
                  </td>
                </tr>

                {/* Individual Capability Rows */}
                {group.capabilities.map((cap) => (
                  <tr
                    key={cap.id}
                    className="border-b border-[var(--line)] hover:bg-[var(--surface-2)] transition-colors"
                  >
                    {/* Capability Name & Description */}
                    <td className="px-5 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-ui text-xs font-medium text-[var(--ink)]">
                            {cap.name}
                          </p>
                          <p className="font-ui text-[11px] text-[var(--muted)] mt-0.5">
                            {cap.description}
                          </p>
                        </div>
                        <span className="font-data text-[10px] text-[var(--muted-2)] bg-[var(--surface-2)] px-1.5 py-0.5 rounded border border-[var(--line)]">
                          {cap.id}
                        </span>
                      </div>
                    </td>

                    {/* Role Checkboxes */}
                    {roles.map((role) => {
                      const isOwnerRole = role.slug.toUpperCase() === 'OWNER'
                      const hasCap = isOwnerRole || role.capabilities.includes(cap.id)

                      return (
                        <td key={role.id} className="px-3 py-3 text-center">
                          <button
                            type="button"
                            disabled={isOwnerRole || !isOwner}
                            onClick={() => handleToggle(role, cap.id)}
                            className={cn(
                              'w-6 h-6 rounded flex items-center justify-center mx-auto transition-all',
                              hasCap
                                ? 'bg-gradient-to-tr from-[#3B82F6] to-[#1D4ED8] text-white shadow-glow-sm'
                                : 'bg-[var(--surface)] border border-[var(--line)] text-transparent hover:border-[rgba(59,130,246,0.4)]',
                              (isOwnerRole || !isOwner) && 'cursor-default opacity-80'
                            )}
                            title={
                              isOwnerRole
                                ? 'Owner has all capabilities by default'
                                : !isOwner
                                ? 'Only Owner can edit role capabilities'
                                : hasCap
                                ? 'Click to revoke'
                                : 'Click to grant'
                            }
                          >
                            {hasCap && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
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
