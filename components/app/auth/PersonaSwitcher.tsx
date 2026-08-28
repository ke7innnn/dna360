'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, ChevronRight, Shield, Sparkles } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { SEEDED_USERS } from '@/lib/auth'
import { cn } from '@/lib/utils'

export default function PersonaSwitcher({ compact = false }: { compact?: boolean }) {
  const { user, switchPersona } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="w-full">
      <div className="flex items-center justify-between pb-2 border-b border-[var(--app-glass-border)]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--aurora-1)]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--app-text-muted)]">
            Quick Persona Switcher (Demo)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 pt-3">
        {SEEDED_USERS.map((persona) => {
          const isActive = user?.id === persona.id
          return (
            <button
              key={persona.id}
              onClick={() => switchPersona(persona.id)}
              className={cn(
                'flex items-center gap-2.5 p-2.5 rounded-xl text-left transition-all text-xs',
                'glass hover:border-[var(--app-glass-hover-border)]',
                isActive
                  ? 'border-[var(--aurora-1)] bg-[var(--app-sidebar-active)] text-[var(--app-text-primary)] shadow-sm'
                  : 'text-[var(--app-text-secondary)] opacity-85 hover:opacity-100'
              )}
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--aurora-1)] to-[var(--aurora-2)] flex items-center justify-center text-white font-bold text-xs shrink-0">
                {persona.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate text-[var(--app-text-primary)]">{persona.name}</p>
                <p className="text-[0.6875rem] text-[var(--app-text-muted)] truncate">{persona.role.name}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
