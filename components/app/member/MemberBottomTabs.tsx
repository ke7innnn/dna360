'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface TabItem {
  id: string
  label: string
  href: string
  icon: React.ReactNode
}

export default function MemberBottomTabs() {
  const pathname = usePathname()

  const tabs: TabItem[] = [
    {
      id: 'home',
      label: 'Home',
      href: '/m',
      icon: (
        <svg viewBox="0 0 24 24" className="w-[19px] h-[19px] fill-none stroke-current" strokeWidth="1.8">
          <path d="M3 11l9-8 9 8v9a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      id: 'workouts',
      label: 'Workout',
      href: '/m/programs',
      icon: (
        <svg viewBox="0 0 24 24" className="w-[19px] h-[19px] fill-none stroke-current" strokeWidth="1.8">
          <path d="M4 12h16M7 8v8M17 8v8" />
        </svg>
      ),
    },
    {
      id: 'progress',
      label: 'Progress',
      href: '/m/progress',
      icon: (
        <svg viewBox="0 0 24 24" className="w-[19px] h-[19px] fill-none stroke-current" strokeWidth="1.8">
          <path d="M3 17l5-6 4 3 5-8 4 5" />
        </svg>
      ),
    },
    {
      id: 'classes',
      label: 'Classes',
      href: '/m/classes',
      icon: (
        <svg viewBox="0 0 24 24" className="w-[19px] h-[19px] fill-none stroke-current" strokeWidth="1.8">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M8 3v4M16 3v4M3 11h18" />
        </svg>
      ),
    },
    {
      id: 'checkin',
      label: 'Check-in',
      href: '/m/checkin',
      icon: (
        <svg viewBox="0 0 24 24" className="w-[19px] h-[19px] fill-none stroke-current" strokeWidth="1.8">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0116 0" />
        </svg>
      ),
    },
  ]

  return (
    <nav
      aria-label="Member Navigation"
      className="member-tabs md:hidden select-none"
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
              'member-tab transition-all duration-200',
              isActive ? 'on' : 'text-[var(--ink-3)] hover:text-white'
            )}
          >
            {tab.icon}
            {isActive && <span>{tab.label}</span>}
          </Link>
        )
      })}
    </nav>
  )
}
