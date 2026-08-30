'use client'

import React, { useState } from 'react'
import {
  Search, Bell, LogOut, Settings, User,
  Building2, Menu, Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebar } from './Sidebar'
import { getInitials } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'

// ─── Single Location Identifier (Powai Only) ───
function LocationBadge() {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] select-none shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] hover:border-[rgba(59,130,246,0.35)] transition-colors">
      <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] shadow-[0_0_6px_rgba(59,130,246,0.9)] animate-pulse" />
      <span className="font-ui text-xs font-semibold text-[var(--ink)]">Powai Flagship</span>
      <span className="font-ui text-[11px] text-[var(--muted)]">· 400076</span>
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
                href="/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-ui text-[var(--ink-2)] hover:text-white hover:bg-[var(--surface-2)] rounded-[var(--r-sm)] transition-colors"
                role="menuitem"
              >
                <User className="w-3.5 h-3.5 text-[var(--muted)]" />
                <span>My Profile</span>
              </Link>
              <Link
                href="/settings"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-ui text-[var(--ink-2)] hover:text-white hover:bg-[var(--surface-2)] rounded-[var(--r-sm)] transition-colors"
                role="menuitem"
              >
                <Settings className="w-3.5 h-3.5 text-[var(--muted)]" />
                <span>Settings</span>
              </Link>
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

// ─── Main TopBar ───
export default function TopBar() {
  const { setMobileOpen } = useSidebar()
  const { logout } = useAuth()

  return (
    <header className="fixed top-0 left-0 right-0 h-16 z-30 flex items-center justify-between px-4 sm:px-8 border-b border-[rgba(255,255,255,0.06)] bg-[#07090E]/80 backdrop-blur-2xl relative overflow-hidden">
      {/* Top subtle glowing aurora blue edge-light */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[rgba(59,130,246,0.6)] to-transparent pointer-events-none" />

      {/* Ambient background blue gradient glow */}
      <div
        className="absolute top-0 right-1/4 w-[400px] h-[60px] rounded-full blur-[45px] pointer-events-none opacity-30"
        style={{
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.45) 0%, transparent 80%)',
        }}
      />

      {/* Left: Mobile Toggle & Location */}
      <div className="flex items-center gap-3 relative z-10">
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden p-2 rounded-[var(--r-sm)] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <LocationBadge />
      </div>

      {/* Right: Notification + User Menu + Direct Logout Button */}
      <div className="flex items-center gap-2.5 sm:gap-3 relative z-10">
        {/* Notification Bell */}
        <button
          className="relative p-2 rounded-full text-[var(--muted)] hover:text-white hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#3B82F6] shadow-[0_0_8px_rgba(59,130,246,0.9)]" />
        </button>

        <div className="h-5 w-px bg-[rgba(255,255,255,0.06)]" />

        <UserMenu />

        {/* Direct One-Click Log Out Button */}
        <button
          onClick={logout}
          title="Sign out / Log out"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-ui text-xs font-semibold bg-[rgba(239,68,68,0.10)] hover:bg-[rgba(239,68,68,0.20)] text-[#F87171] border border-[rgba(239,68,68,0.25)] hover:border-[rgba(239,68,68,0.45)] transition-all cursor-pointer shadow-sm"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Log out</span>
        </button>
      </div>
    </header>
  )
}
