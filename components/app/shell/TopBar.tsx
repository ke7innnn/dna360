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
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--r-sm)] bg-[var(--surface-sunken)] border border-[var(--line)] select-none">
      <Building2 className="w-3.5 h-3.5 text-[var(--teal)] shrink-0" />
      <span className="font-ui text-xs font-medium text-[var(--text)]">Powai, Mumbai</span>
      <span className="font-data text-[10px] text-[var(--text-faint)]">· 400076</span>
    </div>
  )
}

// ─── User Menu ───
function UserMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, logout } = useAuth()

  const userName = user?.name || 'Front Desk Staff'
  const userEmail = user?.email || 'reception@dna360.in'
  const designation = user?.designation || user?.role?.name || 'Staff'

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 p-1 rounded-[var(--r-sm)] cursor-pointer',
          'hover:bg-[var(--surface-raised)] transition-colors duration-140 select-none'
        )}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="User menu"
      >
        <div className="w-7 h-7 rounded-[var(--r-sm)] bg-[var(--surface-raised)] border border-[var(--line-strong)] flex items-center justify-center text-[var(--text)] font-ui text-xs font-semibold">
          {getInitials(userName)}
        </div>
        <div className="hidden sm:flex flex-col text-left">
          <span className="font-ui text-xs font-medium text-[var(--text)] line-clamp-1">
            {userName}
          </span>
          <span className="font-ui text-[10px] text-[var(--text-faint)] -mt-0.5">
            {designation}
          </span>
        </div>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 w-56 p-1.5 bg-[var(--surface-raised)] border border-[var(--line-strong)] rounded-[var(--r-md)] shadow-2xl z-50 select-none"
            role="menu"
          >
            {/* User Info Header */}
            <div className="px-3 py-2 border-b border-[var(--line)]">
              <p className="font-ui text-xs font-semibold text-[var(--text)] truncate">{userName}</p>
              <p className="font-data text-[11px] text-[var(--text-faint)] truncate mt-0.5">{userEmail}</p>
              <span className="inline-block mt-1 px-1.5 py-0.5 font-ui text-[9px] uppercase tracking-wider font-semibold rounded bg-[var(--teal-dim)] text-[var(--teal)]">
                {designation}
              </span>
            </div>

            {/* Menu Links */}
            <div className="py-1">
              <Link
                href="/profile"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 font-ui text-xs text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-sunken)] rounded-[var(--r-sm)] transition-colors"
                role="menuitem"
              >
                <User className="w-3.5 h-3.5" />
                Profile
              </Link>
              <Link
                href="/settings"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 font-ui text-xs text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-sunken)] rounded-[var(--r-sm)] transition-colors"
                role="menuitem"
              >
                <Settings className="w-3.5 h-3.5" />
                Settings
              </Link>
            </div>

            {/* Logout */}
            <div className="pt-1 border-t border-[var(--line)]">
              <button
                onClick={() => {
                  logout()
                  setIsOpen(false)
                }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 font-ui text-xs text-[var(--danger)] hover:bg-[var(--danger-dim)] rounded-[var(--r-sm)] transition-colors"
                role="menuitem"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
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
    <header
      className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 md:px-6 glass border-b border-[var(--line)]"
      role="banner"
    >
      {/* Left: Mobile Toggle & Location */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden p-1.5 rounded-[var(--r-sm)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-raised)] transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <LocationBadge />
      </div>

      {/* Center: Search Field */}
      <div className="hidden lg:flex items-center max-w-xs w-full mx-4">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-faint)]" />
          <input
            type="text"
            placeholder="Search member, phone, SKU..."
            className="w-full h-8 pl-8 pr-8 font-ui text-xs rounded-[var(--r-sm)] bg-[var(--surface-sunken)] border border-[var(--line)] text-[var(--text)] placeholder:text-[var(--text-faint)] focus:border-[var(--line-strong)] focus:ring-[2px] focus:ring-[var(--teal-dim)] outline-none transition-all"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 font-data text-[10px] text-[var(--text-faint)] border border-[var(--line-strong)] px-1 rounded bg-[var(--surface)] select-none">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Notification & User Menu */}
      <div className="flex items-center gap-2.5">
        {/* Notifications */}
        <Link
          href="/overview"
          className="p-1.5 rounded-[var(--r-sm)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-raised)] transition-colors relative"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[var(--teal)]" />
        </Link>

        <div className="h-4 w-px bg-[var(--line)]" />

        {/* User Account Menu */}
        <UserMenu />
      </div>
    </header>
  )
}
