'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import {
  LayoutDashboard, CreditCard, Calendar, CheckCircle, User,
  HelpCircle, Monitor, Users, Target, Clock, BarChart3, Receipt,
  UserCog, TrendingUp, Settings, FileText, Dumbbell,
  ChevronLeft, ChevronRight, Menu, X,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { NavItem, RoleName } from '@/types'
import { navigationByRole } from '@/config/navigation'

// ─── Icon Map (Lucide Only) ───
const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard, CreditCard, Calendar, CheckCircle, User,
  HelpCircle, Monitor, Users, Target, Clock, BarChart3, Receipt,
  UserCog, TrendingUp, Settings, FileText, Dumbbell,
}

// ─── DNA 360 Strand Logo Motif ───
function DnaStrandLogo() {
  const heights = [10, 16, 22, 16, 10]
  return (
    <div className="flex items-center gap-[2.5px] h-7 px-1 shrink-0" aria-label="DNA 360 Logo">
      {heights.map((h, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full bg-gradient-to-b from-[#1BA79C] to-[#2AA8E2]"
          style={{ height: `${h}px` }}
        />
      ))}
    </div>
  )
}

// ─── Sidebar Context ───
interface SidebarContextValue {
  collapsed: boolean
  setCollapsed: (v: boolean) => void
  toggle: () => void
  mobileOpen: boolean
  setMobileOpen: (v: boolean) => void
}

const SidebarContext = createContext<SidebarContextValue>({
  collapsed: false,
  setCollapsed: () => {},
  toggle: () => {},
  mobileOpen: false,
  setMobileOpen: () => {},
})

export const useSidebar = () => useContext(SidebarContext)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const toggle = useCallback(() => setCollapsed((v) => !v), [])

  // Auto-collapse on smaller desktop screens (< 1100px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1100 && window.innerWidth >= 768) {
        setCollapsed(true)
      } else if (window.innerWidth >= 1100) {
        setCollapsed(false)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, toggle, mobileOpen, setMobileOpen }}>
      {children}
    </SidebarContext.Provider>
  )
}

// ─── Nav Item Component ───
function SidebarNavItem({ item, collapsed, onItemClick }: { item: NavItem; collapsed: boolean; onItemClick?: () => void }) {
  const pathname = usePathname()
  const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
  const Icon = iconMap[item.icon] || LayoutDashboard

  // Dynamic live badge count for Members & Leads
  const badgeCount = item.href === '/members' ? 659 : item.badge

  return (
    <Link
      href={item.href}
      onClick={onItemClick}
      className={cn(
        'relative group flex items-center gap-3 h-[34px] px-3 font-ui text-[13.5px] leading-[20px] transition-colors duration-140 select-none rounded-[var(--r-sm)]',
        isActive
          ? 'bg-[var(--surface-raised)] text-[var(--text)] font-medium'
          : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-raised)]/60',
        collapsed && 'justify-center px-0'
      )}
      title={collapsed ? item.label : undefined}
      aria-current={isActive ? 'page' : undefined}
    >
      {/* Active Left Gradient Accent Bar — 1 of 3 allowed gradient uses */}
      {isActive && (
        <span
          className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r bg-gradient-to-b from-[#1BA79C] to-[#2AA8E2]"
          aria-hidden="true"
        />
      )}

      <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.5} />

      {!collapsed && (
        <span className="truncate flex-1">
          {item.label}
        </span>
      )}

      {!collapsed && badgeCount != null && badgeCount > 0 && (
        <span className="ml-auto px-1.5 py-0.2 font-data text-[11px] tabular-nums font-semibold rounded-full bg-[var(--surface-sunken)] border border-[var(--line)] text-[var(--text-muted)]">
          {badgeCount}
        </span>
      )}
    </Link>
  )
}

// ─── Main Sidebar ───
export default function Sidebar({ role }: { role: RoleName }) {
  const { collapsed, toggle, mobileOpen, setMobileOpen } = useSidebar()
  const groups = navigationByRole[role] || navigationByRole.owner

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 bottom-0 z-40 flex flex-col',
          'bg-[var(--bg)] border-r border-[var(--line)] transition-all duration-200',
          collapsed ? 'w-[64px]' : 'w-[240px]',
          'md:translate-x-0',
          mobileOpen ? 'translate-x-0 shadow-2xl w-[260px]' : '-translate-x-full md:translate-x-0'
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Brand Header */}
        <div className={cn('flex items-center h-14 px-4 border-b border-[var(--line)] justify-between')}>
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <DnaStrandLogo />
            {(!collapsed || mobileOpen) && (
              <div className="flex flex-col">
                <span className="font-display text-[15px] font-semibold text-[var(--text)] tracking-tight">
                  DNA 360
                </span>
                <span className="font-ui text-[9px] uppercase tracking-[0.08em] text-[var(--text-faint)]">
                  Powai · Studio
                </span>
              </div>
            )}
          </Link>

          {/* Close on Mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-[var(--text-muted)] hover:text-[var(--text)] p-1"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {groups.map((group, gi) => (
            <div key={gi} className={gi > 0 ? 'mt-5' : ''}>
              {group.label && (!collapsed || mobileOpen) && (
                <p className="px-3 mb-1.5 font-ui text-[11px] uppercase tracking-[0.06em] font-semibold text-[var(--text-faint)] select-none">
                  {group.label}
                </p>
              )}
              {collapsed && !mobileOpen && gi > 0 && (
                <div className="mx-2 mb-2 border-t border-[var(--line)]" />
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <SidebarNavItem
                    key={item.id}
                    item={item}
                    collapsed={collapsed && !mobileOpen}
                    onItemClick={() => setMobileOpen(false)}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Collapse Button (Desktop Only) */}
        <div className="hidden md:block p-2 border-t border-[var(--line)]">
          <button
            onClick={toggle}
            className={cn(
              'w-full flex items-center justify-center gap-2 h-[34px] px-2 rounded-[var(--r-sm)] font-ui text-xs text-[var(--text-muted)]',
              'hover:text-[var(--text)] hover:bg-[var(--surface-raised)] transition-colors duration-140'
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {!collapsed && <span>Collapse sidebar</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
