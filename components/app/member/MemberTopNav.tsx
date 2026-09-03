'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { QrCode, LogOut, Bell, Flame } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getInitials } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default function MemberTopNav({ onOpenQr }: { onOpenQr?: () => void }) {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const userName = user?.name || 'Aditi Deshpande'

  const navLinks = [
    { label: 'Home', href: '/m' },
    { label: 'Workouts', href: '/m/programs' },
    { label: 'Progress', href: '/m/progress' },
    { label: 'Classes', href: '/m/classes' },
    { label: 'PT Ledger & Plan', href: '/m/ledger' },
  ]

  return (
    <header className="hidden md:flex items-center justify-between h-16 px-6 lg:px-8 border-b border-[rgba(255,255,255,0.07)] bg-[#05070E]/90 backdrop-blur-xl sticky top-0 z-30 select-none">
      {/* Brand & Badge */}
      <div className="flex items-center gap-6">
        <Link href="/m" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#1E40AF] via-[#3B82F6] to-[#38BDF8] flex items-center justify-center font-bold text-white font-serif text-sm shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            360
          </div>
          <div>
            <span className="font-display font-semibold text-sm tracking-tight text-white block leading-tight">
              DNA 360
            </span>
            <span className="font-data text-[9.5px] uppercase tracking-wider text-[#38BDF8] block">
              Member Studio
            </span>
          </div>
        </Link>

        {/* Desktop Links */}
        <nav className="flex items-center gap-1 ml-4">
          {navLinks.map((link) => {
            const isActive =
              link.href === '/m'
                ? pathname === '/m'
                : pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3 py-1.5 rounded-full font-ui text-xs font-medium transition-all',
                  isActive
                    ? 'bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] text-white shadow-[0_2px_10px_rgba(59,130,246,0.35)]'
                    : 'text-[var(--ink-2)] hover:text-white hover:bg-[var(--surface-2)]'
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Check-in Quick Trigger */}
        <button
          onClick={onOpenQr}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[rgba(255,255,255,0.1)] text-xs font-medium text-white transition-all cursor-pointer shadow-sm hover:border-[rgba(77,141,255,0.4)]"
        >
          <QrCode className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span>My Check-in Code</span>
        </button>

        {/* User Info & Sign Out */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-[rgba(255,255,255,0.08)]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#1E40AF] to-[#38BDF8] flex items-center justify-center text-white text-xs font-bold shadow-[0_0_12px_rgba(59,130,246,0.4)]">
            {getInitials(userName)}
          </div>
          <div className="hidden lg:block text-left">
            <span className="font-ui text-xs font-semibold text-white block leading-none">
              {userName}
            </span>
            <span className="font-data text-[9px] uppercase tracking-wider text-[var(--ink-3)] block mt-0.5">
              Premium Annual
            </span>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="p-1.5 rounded-full text-[#F87171] hover:bg-[rgba(239,68,68,0.15)] transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  )
}
