'use client'

import React, { useState, useEffect } from 'react'
import {
  Search, Bell, LogOut, Settings, User,
  Building2, Menu, Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebar } from './Sidebar'
import { getInitials } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import {
  getInAppNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/lib/notifications'
import Link from 'next/link'

// ─── Single Location Identifier (Powai Only) ───
function LocationBadge() {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] select-none shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] hover:border-[rgba(59,130,246,0.35)] transition-colors min-w-0 max-w-[138px] sm:max-w-none">
      <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] shadow-[0_0_6px_rgba(59,130,246,0.9)] animate-pulse shrink-0" />
      <span className="font-ui text-[11px] sm:text-xs font-semibold text-[var(--ink)] truncate">Powai Flagship</span>
      <span className="hidden lg:inline font-ui text-[11px] text-[var(--muted)] shrink-0">· 400076</span>
    </div>
  )
}

// ─── Live Real-time Studio Clock (1s Precision) ───
function RealtimeClockBadge() {
  const [clock, setClock] = useState('')

  useEffect(() => {
    const update = () => {
      const now = new Date()
      const d = now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
      const t = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
      setClock(`${d} · ${t}`)
    }
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [])

  if (!clock) return null

  return (
    <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] select-none text-xs font-mono text-[var(--muted)] tabular-nums shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] shadow-[0_0_6px_rgba(16,185,129,0.9)] animate-pulse" />
      <span>{clock}</span>
    </div>
  )
}

// ─── User Menu ───
function UserMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, can, logout } = useAuth()

  const userName = user?.name || 'Staff User'
  const userEmail = user?.email || ''
  const designation = user?.role?.name || user?.designation || 'Staff'
  const isMember = user?.type === 'MEMBER' || String(user?.role?.slug || '').toLowerCase() === 'member'

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2.5 p-1.5 rounded-[var(--r-sm)] cursor-pointer',
          'hover:bg-[var(--surface-2)] transition-colors duration-140 select-none'
        )}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="User menu"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#3B82F6] via-[#2563EB] to-[#1D4ED8] border border-[rgba(59,130,246,0.5)] flex items-center justify-center text-white font-ui text-xs font-bold shrink-0 shadow-[0_0_14px_rgba(59,130,246,0.4)]">
          {getInitials(userName)}
        </div>
        <div className="hidden sm:flex flex-col text-left">
          <span className="font-ui text-xs font-semibold text-[var(--ink)] line-clamp-1">
            {userName}
          </span>
          <span className="font-ui text-[10px] uppercase tracking-[0.10em] text-[var(--muted)] -mt-0.5 font-medium">
            {designation}
          </span>
        </div>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 w-60 p-2 bg-[#0D0C10]/95 border border-[rgba(255,255,255,0.08)] rounded-[var(--r-md)] shadow-card z-50 select-none backdrop-blur-2xl"
            role="menu"
          >
            {/* User Info Header */}
            <div className="px-3 py-2.5 border-b border-[var(--line)]">
              <p className="font-ui text-xs font-semibold text-[var(--ink)] truncate">{userName}</p>
              <p className="font-ui text-[11px] text-[var(--muted)] truncate mt-0.5">{userEmail}</p>
              <span className="inline-block mt-2 px-2.5 py-0.5 font-ui text-[10px] uppercase tracking-[0.12em] font-semibold rounded-full bg-[rgba(59,130,246,0.12)] text-[#60A5FA] border border-[rgba(59,130,246,0.30)]">
                {designation}
              </span>
            </div>

            {/* Menu Links */}
            <div className="py-1 space-y-0.5">
              <Link
                href={isMember ? '/m/ledger' : '/profile'}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-ui text-[var(--ink-2)] hover:text-white hover:bg-[var(--surface-2)] rounded-[var(--r-sm)] transition-colors"
                role="menuitem"
              >
                <User className="w-3.5 h-3.5 text-[var(--muted)]" />
                <span>My Profile</span>
              </Link>
              {can('settings.manage') && (
                <Link
                  href="/settings"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-ui text-[var(--ink-2)] hover:text-white hover:bg-[var(--surface-2)] rounded-[var(--r-sm)] transition-colors"
                  role="menuitem"
                >
                  <Settings className="w-3.5 h-3.5 text-[var(--muted)]" />
                  <span>Settings</span>
                </Link>
              )}
            </div>

            {/* Sign Out */}
            <div className="pt-1 border-t border-[var(--line)]">
              <button
                onClick={() => {
                  setIsOpen(false)
                  logout()
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-ui text-[#EF4444] hover:bg-[rgba(239,68,68,0.10)] rounded-[var(--r-sm)] transition-colors cursor-pointer"
                role="menuitem"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Notification Dropdown ───
function NotificationMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, can } = useAuth()
  const [notifications, setNotifications] = useState<import('@/lib/notifications').InAppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const loadNotifications = () => {
    const list = getInAppNotifications(user?.id)
    setNotifications(list.slice(0, 15))
    setUnreadCount(getUnreadCount(user?.id))
  }

  useEffect(() => {
    loadNotifications()
    const handleUpdate = () => loadNotifications()
    window.addEventListener('dna360_notifications_updated', handleUpdate)
    window.addEventListener('dna360_leads_updated', handleUpdate)
    return () => {
      window.removeEventListener('dna360_notifications_updated', handleUpdate)
      window.removeEventListener('dna360_leads_updated', handleUpdate)
    }
  }, [user?.id])

  const handleMarkRead = (id: string) => {
    markNotificationRead(id)
    loadNotifications()
  }

  const handleMarkAllRead = () => {
    markAllNotificationsRead(user?.id)
    loadNotifications()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-[var(--muted)] hover:text-white hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-[#EF4444] to-[#DC2626] text-white font-ui text-[10px] font-extrabold flex items-center justify-center shadow-[0_0_10px_rgba(239,68,68,0.8)] border border-[rgba(255,255,255,0.2)] animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            className="fixed left-3 right-3 top-[calc(3.75rem+env(safe-area-inset-top,0px))] sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 p-3 bg-[#0D0C10]/95 border border-[rgba(255,255,255,0.10)] rounded-[var(--r-md)] shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-50 select-none backdrop-blur-2xl text-left"
            role="menu"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-2 pb-2.5 border-b border-[rgba(255,255,255,0.08)]">
              <div className="flex items-center gap-2">
                <span className="font-ui text-xs font-bold text-white uppercase tracking-wider">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-[rgba(59,130,246,0.2)] text-[#60A5FA] text-[10px] font-bold">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-ui text-[#3B82F6] hover:text-[#60A5FA] font-medium transition-colors cursor-pointer"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* List */}
            <div className="py-2 max-h-[360px] overflow-y-auto space-y-1.5">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-[var(--muted)]">
                  No notifications right now
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleMarkRead(n.id)}
                    className={cn(
                      'p-2.5 rounded-[var(--r-sm)] text-xs transition-colors cursor-pointer border',
                      n.read
                        ? 'bg-transparent border-transparent text-[var(--muted)] hover:bg-[var(--surface-2)]'
                        : 'bg-[rgba(59,130,246,0.08)] border-[rgba(59,130,246,0.20)] text-[var(--ink)] hover:bg-[rgba(59,130,246,0.14)]'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-xs text-white line-clamp-1">
                        {n.title}
                      </p>
                      <span className="text-[10px] text-[var(--muted)] shrink-0 font-mono">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11.5px] text-[var(--muted)] mt-1 leading-snug line-clamp-2">
                      {n.body}
                    </p>
                    {n.link && (
                      <Link
                        href={n.link}
                        onClick={() => setIsOpen(false)}
                        className="inline-block mt-2 text-[10.5px] font-semibold text-[#60A5FA] hover:underline"
                      >
                        View in CRM &rarr;
                      </Link>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {can('leads.manage') && (
              <div className="pt-2 border-t border-[rgba(255,255,255,0.06)] text-center">
                <Link
                  href="/leads"
                  onClick={() => setIsOpen(false)}
                  className="text-[11px] font-ui text-[var(--muted)] hover:text-white transition-colors"
                >
                  Go to CRM Inquiries &rarr;
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

import CommandPalette from './CommandPalette'

// ─── Main TopBar ───
export default function TopBar() {
  const { setMobileOpen, collapsed } = useSidebar()
  const { user, logout } = useAuth()
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  // Listen for ⌘K / Ctrl+K and custom Sidebar trigger
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen((prev) => !prev)
      }
    }
    const handleOpenPalette = () => setCommandPaletteOpen(true)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('dna:open-command-palette', handleOpenPalette)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('dna:open-command-palette', handleOpenPalette)
    }
  }, [])

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-30 pt-[env(safe-area-inset-top,0px)] border-b border-[rgba(255,255,255,0.06)] bg-[#07090E]/90 backdrop-blur-2xl transition-all duration-200',
          collapsed ? 'md:left-[68px]' : 'md:left-[250px]'
        )}
      >
        {/* Clipped Decorative Glow Layer (keeps dropdowns unclipped) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[rgba(59,130,246,0.6)] to-transparent" />
          <div
            className="absolute top-0 right-1/4 w-[400px] h-[60px] rounded-full blur-[45px] opacity-30"
            style={{
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.45) 0%, transparent 80%)',
            }}
          />
        </div>

        <div className="h-14 flex items-center justify-between gap-2 px-3 sm:px-6 relative z-10">
          {/* Left: Mobile Toggle & Location & ⌘K Search Button */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-1.5 rounded-[var(--r-sm)] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] cursor-pointer shrink-0"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <LocationBadge />
            <div className="hidden xl:block">
              <RealtimeClockBadge />
            </div>

            {/* ⌘K Command Palette Quick Search Button (Staff Only) */}
            {user?.type !== 'MEMBER' && (
              <button
                onClick={() => setCommandPaletteOpen(true)}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(59,130,246,0.35)] text-xs font-ui text-[var(--muted)] transition-all cursor-pointer shadow-sm shrink-0"
              >
                <Search className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span className="text-[11.5px] hidden lg:inline">Search members, actions...</span>
                <span className="text-[11.5px] lg:hidden">Search</span>
                <kbd className="ml-0.5 px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] text-[10px] font-mono text-[var(--muted)]">
                  ⌘K
                </kbd>
              </button>
            )}
          </div>

          {/* Right: Notification + User Menu + Direct Logout Button */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <NotificationMenu />

            <div className="h-5 w-px bg-[rgba(255,255,255,0.06)] hidden xs:block sm:block" />

            <UserMenu />

            {/* Direct One-Click Log Out Button */}
            <button
              onClick={logout}
              title="Sign out / Log out"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full font-ui text-xs font-semibold bg-[rgba(239,68,68,0.10)] hover:bg-[rgba(239,68,68,0.20)] text-[#F87171] border border-[rgba(239,68,68,0.25)] hover:border-[rgba(239,68,68,0.45)] transition-all cursor-pointer shadow-sm shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Global ⌘K Command Palette Modal */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </>
  )
}
