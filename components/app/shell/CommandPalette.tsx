'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, Users, DollarSign, Calendar, Flame,
  Download, PlusCircle, CheckCircle2, ArrowRight,
  Shield, FileText, UserCheck, X, Zap,
} from 'lucide-react'
import { getStoredMembers } from '@/lib/members'
import { maskPhoneNumber } from '@/lib/auth'
import { useAuth } from '@/context/AuthContext'
import type { Member } from '@/types/member'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

interface ActionItem {
  id: string
  title: string
  subtitle: string
  category: 'NAVIGATION' | 'ACTIONS' | 'EXPORTS'
  icon: React.ReactNode
  perform: () => void
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter()
  const { user, can } = useAuth()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Static Quick Actions
  const staticActions: ActionItem[] = useMemo(
    () => [
      {
        id: 'act_checkin',
        title: 'Quick Member Check-in',
        subtitle: 'Scan gate barcode or enter member code at turnstile',
        category: 'ACTIONS',
        icon: <UserCheck className="w-4 h-4 text-[#3B82F6]" />,
        perform: () => {
          router.push('/front-desk')
          onClose()
        },
      },
      {
        id: 'act_new_lead',
        title: 'Add New CRM Lead',
        subtitle: 'Capture walk-in or phone trial inquiry',
        category: 'ACTIONS',
        icon: <PlusCircle className="w-4 h-4 text-[#10B981]" />,
        perform: () => {
          router.push('/leads')
          onClose()
        },
      },
      {
        id: 'act_billing',
        title: 'Record Member Payment',
        subtitle: 'Generate GST tax invoice DNA/2026-27/XXXX',
        category: 'ACTIONS',
        icon: <DollarSign className="w-4 h-4 text-[#F59E0B]" />,
        perform: () => {
          router.push('/billing')
          onClose()
        },
      },
      {
        id: 'nav_overview',
        title: 'Go to Club Overview',
        subtitle: 'Executive KPIs, turnstile traffic, and revenue',
        category: 'NAVIGATION',
        icon: <Flame className="w-4 h-4 text-[#60A5FA]" />,
        perform: () => {
          router.push('/overview')
          onClose()
        },
      },
      {
        id: 'nav_members',
        title: 'Go to Member Directory',
        subtitle: 'View 659 registered members & renewal status',
        category: 'NAVIGATION',
        icon: <Users className="w-4 h-4 text-[#A78BFA]" />,
        perform: () => {
          router.push('/members')
          onClose()
        },
      },
      {
        id: 'nav_classes',
        title: 'Go to Classes & PT Timetable',
        subtitle: 'Studio schedules, Pilates, and trainer allocations',
        category: 'NAVIGATION',
        icon: <Calendar className="w-4 h-4 text-[#EC4899]" />,
        perform: () => {
          router.push('/classes')
          onClose()
        },
      },
      {
        id: 'act_export_members',
        title: 'Export Full Member Directory (CSV)',
        subtitle: 'Restricted to Club Owner · Rate limited',
        category: 'EXPORTS',
        icon: <Download className="w-4 h-4 text-[#34D399]" />,
        perform: () => {
          window.open('/api/members/export', '_blank')
          onClose()
        },
      },
    ],
    [router, onClose]
  )

  // Search Members (Top 8 matching)
  const memberResults = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase().trim()
    const allMembers = getStoredMembers()

    return allMembers
      .filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.member_code.toLowerCase().includes(q) ||
          m.phone.includes(q)
      )
      .slice(0, 8)
  }, [query])

  // Filter Actions
  const filteredActions = useMemo(() => {
    if (!query.trim()) return staticActions
    const q = query.toLowerCase().trim()
    return staticActions.filter(
      (a) => a.title.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q)
    )
  }, [query, staticActions])

  const totalResults = memberResults.length + filteredActions.length

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, totalResults))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + totalResults) % Math.max(1, totalResults))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex < memberResults.length) {
        const targetMember = memberResults[selectedIndex]
        router.push(`/members/${targetMember.id}`)
        onClose()
      } else {
        const actionIndex = selectedIndex - memberResults.length
        if (filteredActions[actionIndex]) {
          filteredActions[actionIndex].perform()
        }
      }
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#0B0D13]/95 border border-[rgba(255,255,255,0.12)] rounded-[20px] shadow-2xl overflow-hidden backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[rgba(255,255,255,0.08)] bg-gradient-to-r from-[rgba(59,130,246,0.08)] to-transparent">
          <Search className="w-5 h-5 text-[var(--accent)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            placeholder="Search members (e.g. Arjun, DNA-2025-0012, 98200...), actions, or pages..."
            className="w-full bg-transparent text-[var(--ink)] placeholder-[var(--muted)] text-sm font-ui focus:outline-none"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <kbd className="px-2 py-0.5 rounded-md bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] text-[10.5px] font-mono text-[var(--muted)]">
              ESC
            </kbd>
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1 divide-y divide-[rgba(255,255,255,0.04)]">
          {/* Member Results Section */}
          {memberResults.length > 0 && (
            <div className="pb-2">
              <div className="px-3 py-1.5 text-[10.5px] font-ui uppercase tracking-wider text-[var(--muted)] font-semibold">
                Members Directory ({memberResults.length})
              </div>
              {memberResults.map((m, idx) => {
                const isSelected = selectedIndex === idx
                return (
                  <div
                    key={m.id}
                    onClick={() => {
                      router.push(`/members/${m.id}`)
                      onClose()
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-all duration-100 ${
                      isSelected
                        ? 'bg-[rgba(59,130,246,0.15)] border border-[rgba(59,130,246,0.35)] shadow-sm'
                        : 'hover:bg-[rgba(255,255,255,0.03)] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[rgba(59,130,246,0.2)] border border-[rgba(59,130,246,0.4)] flex items-center justify-center text-[var(--accent)] font-ui text-xs font-bold">
                        {m.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-ui font-semibold text-xs text-[var(--ink)]">
                          {m.name}
                        </p>
                        <p className="font-data text-[10.5px] text-[var(--muted)]">
                          {m.member_code} · {maskPhoneNumber(m.phone)} · {m.active_memberships[0]?.product_name || 'Annual'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-ui font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          m.status === 'active'
                            ? 'bg-[rgba(16,185,129,0.12)] text-[#10B981] border border-[rgba(16,185,129,0.25)]'
                            : m.status === 'grace_period'
                            ? 'bg-[rgba(245,158,11,0.12)] text-[#F59E0B] border border-[rgba(245,158,11,0.25)]'
                            : 'bg-[rgba(239,68,68,0.12)] text-[#EF4444] border border-[rgba(239,68,68,0.25)]'
                        }`}
                      >
                        {m.status.replace('_', ' ')}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-[var(--muted)]" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Quick Actions & Navigation */}
          {filteredActions.length > 0 && (
            <div className="pt-2">
              <div className="px-3 py-1.5 text-[10.5px] font-ui uppercase tracking-wider text-[var(--muted)] font-semibold">
                Quick Actions & Pages
              </div>
              {filteredActions.map((action, idx) => {
                const globalIdx = memberResults.length + idx
                const isSelected = selectedIndex === globalIdx
                return (
                  <div
                    key={action.id}
                    onClick={action.perform}
                    onMouseEnter={() => setSelectedIndex(globalIdx)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-all duration-100 ${
                      isSelected
                        ? 'bg-[rgba(59,130,246,0.15)] border border-[rgba(59,130,246,0.35)] shadow-sm'
                        : 'hover:bg-[rgba(255,255,255,0.03)] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center">
                        {action.icon}
                      </div>
                      <div>
                        <p className="font-ui font-semibold text-xs text-[var(--ink)]">
                          {action.title}
                        </p>
                        <p className="font-ui text-[11px] text-[var(--muted)]">
                          {action.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[10.5px] font-ui text-[var(--muted)]">
                      <span>Jump</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {totalResults === 0 && (
            <div className="p-8 text-center text-xs text-[var(--muted)] font-ui">
              No matching members or actions found for &quot;{query}&quot;
            </div>
          )}
        </div>

        {/* Footer Shortcut Helper */}
        <div className="px-4 py-2.5 border-t border-[rgba(255,255,255,0.06)] bg-[#07090E] flex items-center justify-between text-[11px] font-ui text-[var(--muted)]">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.06)] text-[10px] font-mono mr-1">↑↓</kbd>
              Navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.06)] text-[10px] font-mono mr-1">↵</kbd>
              Select
            </span>
          </div>
          <span>Powai Flagship Omnibar</span>
        </div>
      </div>
    </div>
  )
}
