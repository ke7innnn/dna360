'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface TabItem {
  id: string
  label: string
  href: string
  icon: (active: boolean) => React.ReactNode
}

export default function MemberBottomTabs() {
  const pathname = usePathname()

  const tabs: TabItem[] = [
    {
      id: 'home',
      label: 'Home',
      href: '/m',
      icon: (active) => (
        <svg viewBox="0 0 24 24" className={cn("w-5 h-5 transition-transform", active ? "scale-110" : "scale-100")} fill="none" stroke="currentColor" strokeWidth={active ? "2.2" : "1.8"}>
          <path d="M3 11l9-8 9 8v9a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      id: 'workouts',
      label: 'Workouts',
      href: '/m/programs',
      icon: (active) => (
        <svg viewBox="0 0 24 24" className={cn("w-5 h-5 transition-transform", active ? "scale-110" : "scale-100")} fill="none" stroke="currentColor" strokeWidth={active ? "2.2" : "1.8"}>
          <path d="M4 12h16M7 8v8M17 8v8" />
        </svg>
      ),
    },
    {
      id: 'progress',
      label: 'Progress',
      href: '/m/progress',
      icon: (active) => (
        <svg viewBox="0 0 24 24" className={cn("w-5 h-5 transition-transform", active ? "scale-110" : "scale-100")} fill="none" stroke="currentColor" strokeWidth={active ? "2.2" : "1.8"}>
          <path d="M3 17l5-6 4 3 5-8 4 5" />
        </svg>
      ),
    },
    {
      id: 'classes',
      label: 'Classes',
      href: '/m/classes',
      icon: (active) => (
        <svg viewBox="0 0 24 24" className={cn("w-5 h-5 transition-transform", active ? "scale-110" : "scale-100")} fill="none" stroke="currentColor" strokeWidth={active ? "2.2" : "1.8"}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M8 3v4M16 3v4M3 11h18" />
        </svg>
      ),
    },
    {
      id: 'checkin',
      label: 'Check-in',
      href: '/m/checkin',
      icon: (active) => (
        <svg viewBox="0 0 24 24" className={cn("w-5 h-5 transition-transform", active ? "scale-110" : "scale-100")} fill="none" stroke="currentColor" strokeWidth={active ? "2.2" : "1.8"}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0116 0" />
        </svg>
      ),
    },
  ]

  return (
    <nav
      aria-label="Member Navigation"
      className="md:hidden fixed left-3 right-3 bottom-[calc(10px+env(safe-area-inset-bottom,0px))] max-w-md mx-auto h-[62px] px-1.5 py-1 rounded-[26px] bg-[#0A0F1E]/95 backdrop-blur-2xl border border-[rgba(56,189,248,0.22)] shadow-[0_16px_40px_rgba(0,0,0,0.85)] z-40 select-none grid grid-cols-5 items-center gap-1"
    >
      {tabs.map((tab) => {
        const isActive =
          tab.href === '/m'
            ? pathname === '/m'
            : pathname.startsWith(tab.href)

        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={cn(
              'h-[52px] rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all duration-200 relative min-w-0 px-1',
              isActive
                ? 'bg-gradient-to-b from-[#1E40AF]/35 via-[#3B82F6]/20 to-transparent border border-[#38BDF8]/35 text-[#38BDF8] shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                : 'text-[#94A3B8] hover:text-white active:scale-95'
            )}
          >
            <div className={cn(
              "flex items-center justify-center",
              isActive && "filter drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]"
            )}>
              {tab.icon(isActive)}
            </div>
            <span
              className={cn(
                'text-[10px] tracking-tight truncate w-full text-center leading-none transition-colors',
                isActive ? 'text-white font-bold' : 'text-[#94A3B8] font-medium'
              )}
            >
              {tab.label}
            </span>
            {isActive && (
              <span className="w-1 h-1 rounded-full bg-[#38BDF8] shadow-[0_0_6px_#38BDF8] mt-0.5" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
