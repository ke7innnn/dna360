'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, CreditCard, Calendar, CheckCircle, User,
  HelpCircle, Monitor, Users, Target, Clock, BarChart3, Receipt,
  UserCog, TrendingUp, Settings, FileText, Dumbbell,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { NavGroup, NavItem, RoleName } from '@/types'
import { navigationByRole } from '@/config/navigation'

// ─── Icon Map ───
const iconMap: Record<string, React.FC<{ className?: string }>> = {
  LayoutDashboard, CreditCard, Calendar, CheckCircle, User,
  HelpCircle, Monitor, Users, Target, Clock, BarChart3, Receipt,
  UserCog, TrendingUp, Settings, FileText, Dumbbell,
}

// ─── Sidebar Context ───
interface SidebarContextValue {
  collapsed: boolean
  setCollapsed: (v: boolean) => void
  toggle: () => void
}

const SidebarContext = createContext<SidebarContextValue>({
  collapsed: false,
  setCollapsed: () => {},
  toggle: () => {},
})

export const useSidebar = () => useContext(SidebarContext)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const toggle = useCallback(() => setCollapsed((v) => !v), [])

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, toggle }}>
      {children}
    </SidebarContext.Provider>
  )
}

// ─── Nav Item Component ───
function SidebarNavItem({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const pathname = usePathname()
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
  const Icon = iconMap[item.icon] || LayoutDashboard

  return (
    <Link
      href={item.href}
      className={cn(
        'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
        'hover:bg-[var(--app-sidebar-active)] hover:text-[var(--app-text-primary)]',
        'focus-visible:outline-2 focus-visible:outline-[var(--app-focus-ring)] focus-visible:outline-offset-2',
        isActive
          ? 'bg-[var(--app-sidebar-active)] text-[var(--app-text-primary)] border-l-2 border-[var(--app-sidebar-active-border)]'
          : 'text-[var(--app-text-secondary)] border-l-2 border-transparent',
        collapsed && 'justify-center px-2'
      )}
      title={collapsed ? item.label : undefined}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className={cn('w-5 h-5 shrink-0', isActive && 'text-[var(--aurora-1)]')} />

      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden whitespace-nowrap"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>

      {!collapsed && item.badge != null && item.badge > 0 && (
        <span className="ml-auto px-2 py-0.5 text-xs font-semibold rounded-full bg-[var(--aurora-1)] text-white tabular-nums">
          {item.badge}
        </span>
      )}
    </Link>
  )
}

// ─── Main Sidebar ───
export default function Sidebar({ role }: { role: RoleName }) {
  const { collapsed, toggle } = useSidebar()
  const groups = navigationByRole[role] || navigationByRole.member

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 bottom-0 z-40 flex flex-col glass border-r border-[var(--app-glass-border)] transition-all duration-250',
        collapsed ? 'w-[72px]' : 'w-[260px]'
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className={cn('flex items-center h-16 px-4 border-b border-[var(--app-glass-border)]', collapsed && 'justify-center px-2')}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--aurora-1)] to-[var(--aurora-2)] flex items-center justify-center">
            <span className="text-white font-bold text-sm" style={{ fontFamily: 'Clash Display, sans-serif' }}>D</span>
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <span className="font-display font-semibold text-[var(--app-text-primary)] whitespace-nowrap tracking-tight">
                  DNA 360
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {groups.map((group, gi) => (
          <div key={gi} className={gi > 0 ? 'mt-6' : ''}>
            {group.label && !collapsed && (
              <p className="px-3 mb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-[var(--app-text-muted)]">
                {group.label}
              </p>
            )}
            {collapsed && gi > 0 && (
              <div className="mx-2 mb-2 border-t border-[var(--app-glass-border)]" />
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <SidebarNavItem key={item.id} item={item} collapsed={collapsed} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-[var(--app-glass-border)]">
        <button
          onClick={toggle}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm',
            'text-[var(--app-text-muted)] hover:text-[var(--app-text-secondary)] hover:bg-[var(--app-glass-bg)]',
            'transition-all duration-150'
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                Collapse
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </aside>
  )
}
