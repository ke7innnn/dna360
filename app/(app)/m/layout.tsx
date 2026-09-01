'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Dumbbell,
  Play,
  Layers,
  TrendingUp,
  CreditCard,
  Sparkles,
  ChevronRight,
  Flame,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

interface NavTab {
  id: string
  label: string
  href: string
  icon: React.ElementType
}

const TABS: NavTab[] = [
  { id: 'today', label: 'Today', href: '/m', icon: Flame },
  { id: 'session', label: 'Workout', href: '/m/session', icon: Play },
  { id: 'programs', label: 'Programs', href: '/m/programs', icon: Layers },
  { id: 'progress', label: 'Progress & PRs', href: '/m/progress', icon: TrendingUp },
  { id: 'ledger', label: 'PT Balance', href: '/m/ledger', icon: CreditCard },
]

export default function MemberTrainingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { user } = useAuth()

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col max-w-5xl mx-auto pb-20 sm:pb-8">
      {/* Top Header & Navigation Sub-Bar */}
      <div className="sticky top-14 sm:top-16 z-30 bg-[#08080A]/90 backdrop-blur-md border-b border-[var(--line)] -mx-4 px-4 sm:-mx-6 sm:px-6 py-2.5 mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[rgba(59,130,246,0.15)] border border-[rgba(59,130,246,0.3)] flex items-center justify-center text-[#60A5FA]">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-white tracking-tight font-display">
                  Training & Performance
                </h2>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[rgba(59,130,246,0.2)] text-[#93C5FD] border border-[rgba(59,130,246,0.3)] font-mono">
                  DNA 360
                </span>
              </div>
              <p className="text-[11px] text-[var(--muted)]">
                Precision workout tracking & coaching engine
              </p>
            </div>
          </div>

          {/* Persona indicator */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-[var(--muted)]">
            <span>Signed in as</span>
            <span className="text-white font-medium px-2 py-0.5 rounded-full bg-[var(--surface-2)] border border-[var(--line)]">
              {user?.name || 'Member'}
            </span>
          </div>
        </div>

        {/* Horizontal Navigation Pills */}
        <div className="flex items-center gap-1.5 mt-3 overflow-x-auto no-scrollbar pt-1 pb-0.5">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive =
              tab.href === '/m'
                ? pathname === '/m'
                : pathname.startsWith(tab.href)

            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={cn(
                  'relative flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-140 select-none',
                  isActive
                    ? 'bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                    : 'bg-[var(--surface)] text-[var(--ink-2)] hover:text-white hover:bg-[var(--surface-2)] border border-[var(--line)]'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1">
        {children}
      </div>

      {/* Mobile Floating Bottom Bar for Rapid Logging */}
      <div className="sm:hidden fixed bottom-3 left-4 right-4 z-40">
        <div className="bg-[rgba(13,12,16,0.95)] backdrop-blur-xl border border-[var(--line-strong)] rounded-2xl p-2 shadow-[0_12px_32px_rgba(0,0,0,0.8)] flex items-center justify-around">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive =
              tab.href === '/m'
                ? pathname === '/m'
                : pathname.startsWith(tab.href)

            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={cn(
                  'flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors',
                  isActive
                    ? 'text-[#60A5FA]'
                    : 'text-[var(--muted)] hover:text-white'
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
