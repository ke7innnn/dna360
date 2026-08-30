'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import {
  LayoutDashboard, CreditCard, Calendar, CheckCircle, User,
  HelpCircle, Monitor, Users, Target, Clock, BarChart3, Receipt,
  UserCog, TrendingUp, Settings, FileText, Dumbbell,
  ChevronLeft, ChevronRight, Search, X,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn, getInitials } from '@/lib/utils'
import type { NavItem, RoleName } from '@/types'
import { navigationByRole } from '@/config/navigation'
import { useAuth } from '@/context/AuthContext'

// ─── Icon Map ───
const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard, CreditCard, Calendar, CheckCircle, User,
  HelpCircle, Monitor, Users, Target, Clock, BarChart3, Receipt,
  UserCog, TrendingUp, Settings, FileText, Dumbbell,
}

// ─── DNA 360 Logo Mark Motif ───
function DnaLogoMark() {
  return (
    <div
      className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#F43F5E] to-[#E11D48] flex items-center justify-center font-display font-bold text-base text-white shadow-[0_4px_16px_rgba(244,63,94,0.5)] shrink-0"
      aria-label="DNA 360 Brand Mark"
    >
      D
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

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1140 && window.innerWidth >= 768) {
        setCollapsed(true)
      } else if (window.innerWidth >= 1140) {
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
  const isActive = pathname === item.href || (item.href !== '/dashboard' && item.href !== '/overview' && pathname.startsWith(item.href))
  const Icon = iconMap[item.icon] || LayoutDashboard

  const badgeCount = item.href === '/members' ? 659 : item.badge

  return (
    <Link
      href={item.href}
      onClick={onItemClick}
      className={cn(
        'relative group flex items-center gap-3 h-[38px] px-3 font-ui text-[13.5px] leading-[20px] transition-all duration-140 select-none rounded-[var(--r-sm)]',
        isActive
          ? 'bg-gradient-to-r from-[rgba(244,63,94,0.16)] to-transparent text-white font-medium'
          : 'text-[var(--ink-2)] hover:text-white hover:bg-[var(--surface-2)]',
        collapsed && 'justify-center px-0'
      )}
      title={collapsed ? item.label : undefined}
      aria-current={isActive ? 'page' : undefined}
    >
      {/* Active Left Accent Bar */}
      {isActive && (
        <span
          className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-[var(--accent)] shadow-[0_0_8px_rgba(244,63,94,0.8)]"
          aria-hidden="true"
        />
      )}

      <Icon
        className={cn(
          'w-[18px] h-[18px] shrink-0 transition-colors',
          isActive ? 'text-[var(--accent)]' : 'text-[var(--muted)] group-hover:text-white'
        )}
        strokeWidth={1.8}
      />

      {!collapsed && (
        <span className="truncate flex-1">
          {item.label}
        </span>
      )}

      {!collapsed && badgeCount != null && badgeCount > 0 && (
        <span className="ml-auto px-2 py-0.5 font-data text-[10.5px] tabular-nums font-semibold rounded-full bg-[rgba(255,255,255,0.05)] border border-[var(--line)] text-[var(--muted)]">
          {badgeCount}
        </span>
      )}
    </Link>
  )
}

// ─── Main Sidebar ───
export default function Sidebar({ role }: { role: RoleName }) {
  const { collapsed, toggle, mobileOpen, setMobileOpen } = useSidebar()
  const { user } = useAuth()
  const groups = navigationByRole[role] || navigationByRole.owner

  const userName = user?.name || (role === 'member' ? 'Aarav Shah' : 'Admin Staff')
  const userRole = user?.role?.name || (role === 'member' ? 'MEMBER' : role.toUpperCase())

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 bottom-0 z-40 flex flex-col',
          'bg-[#08080A]/95 border-r border-[var(--line)] backdrop-blur-md transition-all duration-200',
          collapsed ? 'w-[68px]' : 'w-[250px]',
          'md:translate-x-0',
          mobileOpen ? 'translate-x-0 shadow-2xl w-[270px]' : '-translate-x-full md:translate-x-0'
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Brand Header */}
        <div className="flex items-center h-16 px-4 border-b border-[var(--line)] justify-between shrink-0">
          <Link href={role === 'member' ? '/dashboard' : '/overview'} className="flex items-center gap-3">
            <DnaLogoMark />
            {(!collapsed || mobileOpen) && (
              <div className="flex flex-col">
                <span className="font-display text-[16px] font-semibold text-[var(--ink)] tracking-tight leading-none">
                  DNA 360
                </span>
                <span className="font-data text-[9.5px] uppercase tracking-[0.18em] text-[var(--muted)] mt-1 font-medium">
                  POWAI · STUDIO
                </span>
              </div>
            )}
          </Link>

          {/* Close on Mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-[var(--muted)] hover:text-[var(--ink)] p-1 cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {groups.map((group, gi) => (
            <div key={gi} className={gi > 0 ? 'mt-6' : ''}>
              {group.label && (!collapsed || mobileOpen) && (
                <p className="px-3 mb-2 font-data text-[10.5px] uppercase tracking-[0.16em] font-medium text-[var(--muted)] select-none">
                  {group.label}
                </p>
              )}
              {collapsed && !mobileOpen && gi > 0 && (
                <div className="mx-2 mb-3 border-t border-[var(--line)]" />
              )}
              <div className="space-y-1">
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

        {/* Sidebar Footer: Quick Search + User Chip */}
        <div className="p-3 border-t border-[var(--line)] space-y-2.5 shrink-0 bg-[#08080A]">
          {/* Quick Search Hint */}
          {(!collapsed || mobileOpen) && (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-[var(--r-sm)] bg-[rgba(0,0,0,0.4)] border border-[var(--line)] text-xs text-[var(--muted)] select-none">
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-[var(--muted-2)]" />
                <span className="font-ui text-xs">Quick search</span>
              </div>
              <span className="font-data text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--line)] text-[var(--muted)] font-semibold">
                ⌘K
              </span>
            </div>
          )}

          {/* Location Line */}
          {(!collapsed || mobileOpen) && (
            <div className="px-1 text-[10.5px] font-data text-[var(--muted-2)]">
              Powai, Mumbai · 400076
            </div>
          )}

          {/* Current User Chip */}
          <div className={cn(
            'flex items-center gap-2.5 p-2 rounded-[var(--r-sm)] bg-[var(--surface)] border border-[var(--line)] select-none',
            collapsed && !mobileOpen && 'justify-center p-1.5'
          )}>
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[rgba(244,63,94,0.3)] to-[rgba(129,140,248,0.2)] border border-[rgba(244,63,94,0.4)] flex items-center justify-center font-data text-[11px] font-bold text-white shrink-0">
              {getInitials(userName)}
            </div>
            {(!collapsed || mobileOpen) && (
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-ui text-xs font-semibold text-[var(--ink)] truncate leading-tight">
                  {userName}
                </span>
                <span className="font-data text-[9.5px] uppercase tracking-[0.14em] text-[var(--muted)] mt-0.5 truncate font-medium">
                  {userRole}
                </span>
              </div>
            )}
          </div>

          {/* Collapse Toggle */}
          <div className="hidden md:block pt-1">
            <button
              onClick={toggle}
              className={cn(
                'w-full flex items-center justify-center gap-2 h-[28px] rounded-[var(--r-sm)] font-ui text-xs text-[var(--muted)]',
                'hover:text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors duration-140 cursor-pointer'
              )}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
              {!collapsed && <span className="text-[11px]">Collapse sidebar</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
