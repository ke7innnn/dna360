'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Bell, Sun, Moon, LogOut, Settings, User,
  ChevronDown, Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/components/app/theme/ThemeProvider'
import { useSidebar } from './Sidebar'
import { getInitials } from '@/lib/utils'

import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'

// ─── Branch Switcher ───
function BranchSwitcher() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, activeBranch, switchBranch } = useAuth()

  const branches = user?.branches || [{ id: 'pow', name: 'Powai', code: 'POW' }]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-xl text-sm',
          'glass-input hover:border-[var(--app-glass-hover-border)]',
          'text-[var(--app-text-primary)] transition-all duration-150'
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Switch branch"
      >
        <Building2 className="w-4 h-4 text-[var(--app-text-muted)]" />
        <span className="font-medium">{activeBranch?.name || 'Powai'}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 text-[var(--app-text-muted)] transition-transform', isOpen && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 mt-2 w-52 py-1 glass-card z-50"
              role="listbox"
            >
              {branches.map((branch) => (
                <button
                  key={branch.id}
                  onClick={() => {
                    switchBranch(branch.id)
                    setIsOpen(false)
                  }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-sm text-left',
                    'hover:bg-[var(--app-sidebar-active)] transition-colors',
                    activeBranch?.id === branch.id
                      ? 'text-[var(--aurora-1)] font-medium'
                      : 'text-[var(--app-text-secondary)]'
                  )}
                  role="option"
                  aria-selected={activeBranch?.id === branch.id}
                >
                  <span className="w-6 h-6 rounded-md bg-[var(--app-glass-bg)] border border-[var(--app-glass-border)] flex items-center justify-center text-[0.625rem] font-semibold tabular-nums">
                    {branch.code}
                  </span>
                  {branch.name}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── User Menu ───
function UserMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const { resolvedTheme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()

  const userName = user?.name || 'Staff User'
  const userEmail = user?.email || 'staff@dna360.in'
  const roleName = user?.role?.name || 'Member'

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 p-1.5 rounded-xl',
          'hover:bg-[var(--app-glass-bg)] transition-all duration-150'
        )}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="User menu"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--aurora-1)] to-[var(--aurora-2)] flex items-center justify-center">
          <span className="text-white text-xs font-semibold">
            {getInitials(userName)}
          </span>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full right-0 mt-2 w-56 glass-card z-50 overflow-hidden"
            >
              {/* User info */}
              <div className="px-4 py-3 border-b border-[var(--app-glass-border)]">
                <p className="text-sm font-medium text-[var(--app-text-primary)] truncate">{userName}</p>
                <p className="text-xs text-[var(--app-text-muted)] mt-0.5 truncate">{userEmail}</p>
                <span className="inline-block mt-1.5 px-2 py-0.5 text-[0.625rem] font-semibold rounded-full bg-[var(--aurora-1)]/10 text-[var(--aurora-1)] border border-[var(--aurora-1)]/20">
                  {roleName}
                </span>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <Link
                  href="/settings"
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--app-text-secondary)] hover:bg-[var(--app-sidebar-active)] hover:text-[var(--app-text-primary)] transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <Settings className="w-4 h-4" />
                  Settings & Matrix
                </Link>
                <button
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--app-text-secondary)] hover:bg-[var(--app-sidebar-active)] hover:text-[var(--app-text-primary)] transition-colors"
                  onClick={() => { toggleTheme(); setIsOpen(false) }}
                >
                  {resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  {resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}
                </button>
              </div>

              <div className="border-t border-[var(--app-glass-border)] py-1">
                <button
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--app-danger)] hover:bg-[var(--app-danger)]/10 transition-colors"
                  onClick={() => {
                    setIsOpen(false)
                    logout()
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main TopBar ───
export default function TopBar() {
  const { collapsed } = useSidebar()

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 h-16 flex items-center justify-between px-6',
        'glass border-b border-[var(--app-glass-border)]',
        'transition-all duration-250',
        collapsed ? 'left-[72px]' : 'left-[260px]'
      )}
    >
      {/* Left: Branch Switcher */}
      <div className="flex items-center gap-4">
        <BranchSwitcher />
      </div>

      {/* Center: Search */}
      <div className="hidden md:flex flex-1 max-w-md mx-8">
        <div className="w-full relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--app-text-muted)]" />
          <input
            type="text"
            placeholder="Search members, plans, invoices…"
            className={cn(
              'w-full pl-10 pr-4 py-2 text-sm rounded-xl',
              'glass-input text-[var(--app-text-primary)] placeholder:text-[var(--app-text-muted)]',
              'focus:outline-none focus:ring-2 focus:ring-[var(--app-focus-ring)]',
              'transition-all duration-150'
            )}
            aria-label="Global search"
          />
        </div>
      </div>

      {/* Right: Notifications + User */}
      <div className="flex items-center gap-2">
        {/* Notification Bell */}
        <button
          className={cn(
            'relative p-2.5 rounded-xl text-[var(--app-text-secondary)]',
            'hover:bg-[var(--app-glass-bg)] hover:text-[var(--app-text-primary)]',
            'transition-all duration-150'
          )}
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {/* Badge */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--app-danger)]" />
        </button>

        {/* User Menu */}
        <UserMenu />
      </div>
    </header>
  )
}
