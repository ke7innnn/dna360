'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import {
  LayoutDashboard, CreditCard, Calendar, CheckCircle, User,
  HelpCircle, Monitor, Users, Target, Clock, BarChart3, Receipt,
  UserCog, TrendingUp, Settings, FileText, Dumbbell,
  ChevronLeft, ChevronRight, Search, X, LogOut,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn, getInitials } from '@/lib/utils'
import type { NavItem, RoleName } from '@/types'
import { ALL_NAV_GROUPS, type AppNavItem, type AppNavGroup } from '@/config/navigation'
import { useAuth } from '@/context/AuthContext'

// ─── Icon Map ───
const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard, CreditCard, Calendar, CheckCircle, User,
  HelpCircle, Monitor, Users, Target, Clock, BarChart3, Receipt,
  UserCog, TrendingUp, Settings, FileText, Dumbbell,
}

import Image from 'next/image'

// ─── DNA 360 Official Logo Mark ───
function DnaLogoMark() {
  return (
    <div
      className="w-10 h-10 rounded-[12px] bg-[#0C1220] border border-[rgba(56,189,248,0.3)] flex items-center justify-center p-1.5 shadow-[0_0_16px_rgba(59,130,246,0.35)] shrink-0 overflow-hidden relative group transition-all"
      aria-label="DNA 360 Brand Mark"
    >
      <Image
        src="/images/dna-emblem.png"
        alt="DNA 360"
        width={34}
        height={34}
        priority
        unoptimized
        className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(56,189,248,0.7)] transition-transform duration-200 group-hover:scale-110"
      />
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
function SidebarNavItem({ item, collapsed, onItemClick }: { item: AppNavItem; collapsed: boolean; onItemClick?: () => void }) {
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
          ? 'bg-gradient-to-r from-[rgba(59,130,246,0.18)] to-transparent text-white font-medium'
          : 'text-[var(--ink-2)] hover:text-white hover:bg-[var(--surface-2)]',
        collapsed && 'justify-center px-0'
      )}
      title={collapsed ? item.label : undefined}
    >
      {/* Active Glowing Blue Edge Light (3px) */}
      {isActive && (
        <span className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r-full bg-[#3B82F6] shadow-[0_0_10px_#3B82F6]" />
      )}

      <Icon
        className={cn(
          'w-4 h-4 shrink-0 transition-colors',
          isActive ? 'text-[#60A5FA]' : 'text-[var(--muted)] group-hover:text-white'
        )}
      />

      {(!collapsed || typeof window === 'undefined') && (
        <span className="truncate flex-1">
          {item.label}
        </span>
      )}

      {!collapsed && badgeCount != null && badgeCount > 0 && (
        <span className="ml-auto px-2 py-0.5 font-ui text-[10.5px] tabular-nums font-semibold rounded-full bg-[rgba(255,255,255,0.05)] border border-[var(--line)] text-[var(--muted)]">
          {badgeCount}
        </span>
      )}
    </Link>
  )
}

// ─── Main Sidebar ───
export default function Sidebar({ role }: { role?: RoleName }) {
  const { collapsed, toggle, mobileOpen, setMobileOpen } = useSidebar()
  const { user, can, logout } = useAuth()

  const isMember = user?.type === 'MEMBER' || (!user && role === 'member')
  const userName = user?.name || (isMember ? 'Arjun Mehta' : 'Executive Admin')
  const userRoleTitle = user?.designation || user?.role?.name || (isMember ? 'Member' : 'Owner / Executive')

  // Filter groups and items dynamically by user capabilities (Atomic Capability Engine)
  const visibleGroups: AppNavGroup[] = isMember
    ? [
        {
          label: '',
          items: [
            { id: 'dashboard', label: 'Home', icon: 'LayoutDashboard', href: '/dashboard' },
            { id: 'workouts', label: 'Workouts', icon: 'Dumbbell', href: '/m/programs' },
            { id: 'progress', label: 'Progress', icon: 'TrendingUp', href: '/m/progress' },
            { id: 'classes', label: 'Classes', icon: 'Calendar', href: '/classes' },
            { id: 'membership', label: 'Membership', icon: 'CreditCard', href: '/profile' },
          ],
        },
      ]
    : ALL_NAV_GROUPS.map((group) => {
        const filteredItems = group.items.filter((item) => {
          // Gated by specific capability
          if (item.requiredCapability) {
            return can(item.requiredCapability)
          }
          if (item.staffOnly && isMember) {
            return false
          }
          return true
        })
        return {
          ...group,
          items: filteredItems,
        }
      }).filter((g) => g.items.length > 0)

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
          'bg-[#07090E]/80 border-r border-[rgba(255,255,255,0.06)] backdrop-blur-2xl transition-all duration-200',
          collapsed ? 'w-[68px]' : 'w-[250px]',
          'md:translate-x-0',
          mobileOpen ? 'translate-x-0 shadow-2xl w-[270px]' : '-translate-x-full md:translate-x-0'
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Brand Header */}
        <div className="flex items-center h-16 px-4 border-b border-[rgba(255,255,255,0.06)] justify-between shrink-0">
          <Link href={isMember ? '/dashboard' : '/overview'} className="flex items-center gap-3">
            <DnaLogoMark />
            {(!collapsed || mobileOpen) && (
              <div className="flex flex-col">
                <span className="font-display text-[16px] font-semibold text-[var(--ink)] tracking-tight leading-none">
                  DNA 360
                </span>
                <span className="font-ui text-[9.5px] uppercase tracking-[0.18em] text-[var(--muted)] mt-1 font-medium">
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
          {visibleGroups.map((group, gi) => (
            <div key={gi} className={gi > 0 ? 'mt-6' : ''}>
              {group.label && (!collapsed || mobileOpen) && (
                <p className="px-3 mb-2 font-ui text-[10.5px] uppercase tracking-[0.14em] font-semibold text-[var(--muted)] select-none">
                  {group.label}
                </p>
              )}
              {collapsed && !mobileOpen && gi > 0 && (
                <div className="mx-2 mb-3 border-t border-[rgba(255,255,255,0.06)]" />
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

        {/* Sidebar Footer: Early renewal card (Member) or Quick Search (Staff) + User Chip */}
        <div className="p-3 border-t border-[rgba(255,255,255,0.06)] space-y-2.5 shrink-0 bg-transparent">
          {/* Member Early Renewal Notice */}
          {isMember && (!collapsed || mobileOpen) && (
            <Link
              href="/profile"
              className="block p-3 rounded-[16px] bg-[#0E131F]/90 border border-[rgba(59,130,246,0.28)] hover:border-[#3B82F6] transition-all text-xs group"
            >
              <div className="font-ui font-semibold text-white group-hover:text-[#60A5FA] transition-colors">
                47 days left
              </div>
              <div className="text-[11px] text-[var(--ink-2)] mt-0.5 leading-snug">
                Renew before 11 Oct to keep your rate
              </div>
            </Link>
          )}

          {/* Quick Search Hint (Staff Only) */}
          {!isMember && (!collapsed || mobileOpen) && (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-[var(--r-sm)] bg-[var(--surface)] border border-[var(--line)] text-xs text-[var(--muted)] select-none">
              <div className="flex items-center gap-2">
                <Search className="w-3 h-3 text-[var(--muted)]" />
                <span className="font-ui text-xs">Quick search</span>
              </div>
              <kbd className="font-ui text-[10px] bg-[var(--surface-2)] border border-[var(--line)] px-1.5 py-0.5 rounded text-[var(--ink-2)]">
                ⌘K
              </kbd>
            </div>
          )}

          {/* User Profile Info Chip */}
          <div className="flex items-center gap-2.5 p-1 rounded-[var(--r-sm)] select-none">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[rgba(59,130,246,0.4)] to-[rgba(99,102,241,0.25)] border border-[rgba(59,130,246,0.5)] flex items-center justify-center text-white font-ui text-xs font-bold shrink-0 shadow-[0_0_12px_rgba(59,130,246,0.25)]">
              {getInitials(userName)}
            </div>

            {(!collapsed || mobileOpen) && (
              <div className="flex items-center justify-between min-w-0 flex-1 gap-2">
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-ui text-xs font-semibold text-[var(--ink)] truncate">
                    {userName}
                  </span>
                  <span className="font-ui text-[10px] uppercase tracking-[0.10em] text-[var(--muted)] truncate">
                    {userRoleTitle}
                  </span>
                </div>
                <button
                  onClick={logout}
                  title="Sign out / Log out"
                  className="p-1.5 rounded-[var(--r-sm)] text-[#F87171] hover:bg-[rgba(239,68,68,0.15)] transition-colors cursor-pointer shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Collapse Toggle (Desktop only) */}
          <button
            onClick={toggle}
            className="hidden md:flex w-full items-center justify-center py-1.5 rounded-[var(--r-sm)] text-xs text-[var(--muted)] hover:text-white hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <div className="flex items-center gap-1.5 font-ui text-[11px]">
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Collapse sidebar</span>
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  )
}
