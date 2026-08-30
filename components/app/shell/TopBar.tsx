'use client'

import React, { useState } from 'react'
import {
  Search, Bell, LogOut, Settings, User,
  Building2, Menu,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebar } from './Sidebar'
import { getInitials } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'

// ─── Single Location Identifier (Powai Only) ───
function LocationBadge() {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--surface-2)] border border-[var(--line)] select-none">
      <Building2 className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
      <span className="font-ui text-xs font-semibold text-[var(--ink)]">Powai Flagship</span>
      <span className="font-data text-[10.5px] text-[var(--muted)]">· 400076</span>
    </div>
  )
}

// ─── User Menu ───
function UserMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, logout } = useAuth()

  const userName = user?.name || 'Aarav Shah'
  const userEmail = user?.email || 'aarav.shah@gmail.com'
  const designation = user?.role?.name || user?.designation || 'Member'

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
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[rgba(244,63,94,0.35)] to-[rgba(129,140,248,0.2)] border border-[rgba(244,63,94,0.4)] flex items-center justify-center text-white font-data text-xs font-bold shrink-0">
          {getInitials(userName)}
        </div>
        <div className="hidden sm:flex flex-col text-left">
          <span className="font-ui text-xs font-semibold text-[var(--ink)] line-clamp-1">
            {userName}
          </span>
          <span className="font-data text-[10px] uppercase tracking-[0.12em] text-[var(--muted)] -mt-0.5 font-medium">
            {designation}
          </span>
        </div>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 w-60 p-2 bg-[var(--bg-elev)] border border-[var(--line)] rounded-[var(--r-md)] shadow-card z-50 select-none backdrop-blur-md"
            role="menu"
          >
            {/* User Info Header */}
            <div className="px-3 py-2.5 border-b border-[var(--line)]">
              <p className="font-ui text-xs font-semibold text-[var(--ink)] truncate">{userName}</p>
              <p className="font-data text-[11px] text-[var(--muted)] truncate mt-0.5">{userEmail}</p>
              <span className="inline-block mt-2 px-2 py-0.5 font-data text-[9.5px] uppercase tracking-[0.14em] font-semibold rounded-full bg-[var(--accent-soft)] text-[var(--accent)] border border-[rgba(244,63,94,0.30)]">
                {designation}
              </span>
            </div>

            {/* Menu Links */}
            <div className="py-1">
              <Link
                href="/profile"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2 font-ui text-xs text-[var(--ink-2)] hover:text-white hover:bg-[var(--surface-2)] rounded-[var(--r-sm)] transition-colors"
                role="menuitem"
              >
                <User className="w-3.5 h-3.5 text-[var(--muted)]" />
                Profile & Plan
              </Link>
              <Link
                href="/settings"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2 font-ui text-xs text-[var(--ink-2)] hover:text-white hover:bg-[var(--surface-2)] rounded-[var(--r-sm)] transition-colors"
                role="menuitem"
              >
                <Settings className="w-3.5 h-3.5 text-[var(--muted)]" />
                Club Settings
              </Link>
            </div>

            {/* Logout */}
            <div className="pt-1 border-t border-[var(--line)]">
              <button
                onClick={() => {
                  setIsOpen(false)
                  logout()
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 font-ui text-xs text-[var(--accent)] hover:bg-[var(--accent-soft)] rounded-[var(--r-sm)] transition-colors text-left cursor-pointer"
                role="menuitem"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Main TopBar ───
export default function TopBar() {
  const { setMobileOpen } = useSidebar()

  return (
    <header className="fixed top-0 left-0 right-0 h-16 z-30 flex items-center justify-between px-4 sm:px-8 border-b border-[var(--line)] bg-[#08080A]/70 backdrop-blur-md">
      {/* Left: Mobile Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden p-2 rounded-[var(--r-sm)] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <LocationBadge />
      </div>

      {/* Right: Notification + User Menu */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <button
          className="relative p-2 rounded-full text-[var(--muted)] hover:text-white hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--accent)] shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
        </button>

        <div className="h-5 w-px bg-[var(--line)]" />

        <UserMenu />
      </div>
    </header>
  )
}
