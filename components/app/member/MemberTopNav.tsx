'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { QrCode, LogOut, Bell, Flame } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getInitials } from '@/lib/utils'
import { cn } from '@/lib/utils'

import Image from 'next/image'

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
    <header className="hidden md:flex items-center justify-between h-16 px-6 lg:px-8 border-b border-[rgba(56,189,248,0.15)] bg-gradient-to-b from-[#091024]/95 via-[#060914]/95 to-[#05070E]/95 backdrop-blur-2xl sticky top-0 z-30 select-none shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
      {/* Brand & Badge */}
      <div className="flex items-center gap-6">
        <Link href="/m" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0E162B] to-[#0A0E1A] border border-[rgba(56,189,248,0.35)] flex items-center justify-center p-1 shadow-[0_0_14px_rgba(59,130,246,0.4)] shrink-0">
            <Image
              src="/images/dna-emblem.png"
              alt="DNA 360"
              width={24}
              height={24}
              priority
              unoptimized
              className="w-full h-full object-contain filter drop-shadow-[0_0_6px_rgba(56,189,248,0.7)]"
            />
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

        {/* Desktop Links in Gradient Capsule */}
        <nav className="flex items-center gap-1.5 ml-4 p-1 rounded-full bg-gradient-to-r from-[#0C1324]/90 via-[#0F1B35]/90 to-[#0C1324]/90 border border-[rgba(56,189,248,0.22)] shadow-[inset_0_1px_2px_rgba(255,255,255,0.08),0_4px_16px_rgba(0,0,0,0.4)] backdrop-blur-md">
          {navLinks.map((link) => {
            const isActive =
              link.href === '/m'
                ? pathname === '/m' || pathname === '/dashboard'
                : pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3.5 py-1.5 rounded-full font-ui text-xs transition-all border',
                  isActive
                    ? 'bg-gradient-to-r from-[#1E40AF] via-[#3B82F6] to-[#38BDF8] text-white font-semibold border-transparent shadow-[0_0_16px_rgba(59,130,246,0.6)]'
                    : 'text-[var(--ink-2)] border-transparent hover:text-white hover:bg-gradient-to-r hover:from-[rgba(59,130,246,0.18)] hover:to-[rgba(56,189,248,0.15)] hover:border-[rgba(56,189,248,0.25)] hover:shadow-[0_0_10px_rgba(56,189,248,0.2)]'
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
