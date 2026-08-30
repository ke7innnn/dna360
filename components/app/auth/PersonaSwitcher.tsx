'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, ChevronRight, Shield, Sparkles, Check, Lock, DollarSign } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { SEEDED_USERS } from '@/lib/auth'
import { canAccessRevenue } from '@/config/permissions'
import { cn } from '@/lib/utils'

export default function PersonaSwitcher({ compact = false }: { compact?: boolean }) {
  const { user, switchPersona } = useAuth()
  const [filter, setFilter] = useState<'all' | 'revenue' | 'trainers' | 'members'>('all')

  // Pick key representative personas
  const keyPersonas = SEEDED_USERS.filter((p) => {
    if (filter === 'revenue') return canAccessRevenue(p.role.slug)
    if (filter === 'trainers') return p.role.slug.toUpperCase().includes('TRAINER') || p.role.slug.toUpperCase() === 'MASSEUR'
    if (filter === 'members') return p.type === 'MEMBER'
    // Default list: representative set
    return [
      'usr_owner_01',
      'usr_staff_01',
      'usr_staff_02',
      'usr_staff_10',
      'usr_staff_03',
      'usr_staff_05',
      'usr_staff_11',
      'usr_staff_15',
      'usr_staff_17',
      'mem_001',
      'mem_002',
    ].includes(p.id)
  })

  return (
    <div className="w-full select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[var(--line)]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span className="font-data text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            Role Persona Switcher (Single-Club RBAC v1)
          </span>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1">
          {(['all', 'revenue', 'trainers', 'members'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={cn(
                'px-2 py-0.5 font-data text-[10px] uppercase tracking-wider rounded-[var(--r-sm)] transition-all cursor-pointer',
                filter === tab
                  ? 'bg-[var(--accent-soft)] text-white border border-[rgba(59,130,246,0.35)]'
                  : 'text-[var(--muted)] hover:text-white'
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 pt-3">
        {keyPersonas.map((persona) => {
          const isActive = user?.id === persona.id
          const hasRevenue = canAccessRevenue(persona.role.slug)
          const isMember = persona.type === 'MEMBER'

          return (
            <button
              key={persona.id}
              onClick={() => switchPersona(persona.id)}
              className={cn(
                'flex items-center gap-2.5 p-2.5 rounded-[var(--r-md)] text-left transition-all text-xs cursor-pointer',
                'bg-[var(--surface)] border border-[var(--line)] hover:border-[rgba(59,130,246,0.35)]',
                isActive
                  ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-white shadow-glow-sm'
                  : 'text-[var(--ink-2)] hover:text-white'
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center font-ui font-bold text-xs shrink-0 text-white shadow-sm',
                  persona.role.slug.toUpperCase() === 'OWNER'
                    ? 'bg-gradient-to-tr from-[#3B82F6] via-[#2563EB] to-[#1D4ED8]'
                    : hasRevenue
                    ? 'bg-gradient-to-tr from-[#818CF8] to-[#4F46E5]'
                    : isMember
                    ? 'bg-gradient-to-tr from-[#34D399] to-[#059669]'
                    : 'bg-gradient-to-tr from-[#F59E0B] to-[#D97706]'
                )}
              >
                {persona.name.charAt(0)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <p className="font-ui font-semibold text-xs truncate text-[var(--ink)]">
                    {persona.name}
                  </p>
                  {hasRevenue && (
                    <span
                      title="Revenue Access (The Wall)"
                      className="px-1 py-0.2 rounded font-ui text-[9px] font-bold bg-[rgba(52,211,153,0.15)] text-[var(--green)] border border-[rgba(52,211,153,0.3)]"
                    >
                      ₹ REVENUE
                    </span>
                  )}
                  {persona.membershipStatus === 'EXPIRED' && (
                    <span className="px-1 py-0.2 rounded font-ui text-[9px] font-bold bg-[rgba(239,68,68,0.15)] text-[#EF4444] border border-[rgba(239,68,68,0.3)]">
                      EXPIRED
                    </span>
                  )}
                </div>
                <p className="font-data text-[10px] text-[var(--muted)] truncate mt-0.5">
                  {persona.designation || persona.role.name}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
