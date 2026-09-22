'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home,
  Dumbbell,
  TrendingUp,
  QrCode,
  Plus,
  Play,
  Calendar,
  MessageCircle,
  X,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TabItem {
  id: string
  label: string
  href: string
  icon: (active: boolean) => React.ReactNode
}

interface SideOption {
  id: string
  label: string
  desc: string
  icon: React.ReactNode
  color: string
  action: () => void
}

export default function MemberBottomTabs() {
  const pathname = usePathname()
  const router = useRouter()
  const [sideMenuOpen, setSideMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close side menu on route change
  useEffect(() => {
    setSideMenuOpen(false)
  }, [pathname])

  // Close on click outside
  useEffect(() => {
    if (!sideMenuOpen) return
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setSideMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [sideMenuOpen])

  // Hide the global navigation bar during an active focused workout session (rendered AFTER all hooks)
  if (pathname === '/m/session' || pathname.startsWith('/m/session')) {
    return null
  }

  const sideOptions: SideOption[] = [
    {
      id: 'start-session',
      label: 'Start Workout',
      desc: 'Launch push routine',
      icon: <Play className="w-4 h-4 fill-white text-white ml-0.5" />,
      color: 'from-[#FF5376] to-[#E11D48] shadow-[0_0_12px_rgba(225,29,72,0.4)]',
      action: () => {
        setSideMenuOpen(false)
        router.push('/m/session')
      },
    },
    {
      id: 'upgrade-plan',
      label: 'Buy & Upgrade Plan',
      desc: 'Renewals & PT session packs',
      icon: <Sparkles className="w-4 h-4 text-white" />,
      color: 'from-[#8B5CF6] to-[#6366F1] shadow-[0_0_12px_rgba(139,92,246,0.4)]',
      action: () => {
        setSideMenuOpen(false)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('dna:open-upgrade'))
        }
      },
    },
    {
      id: 'qr-pass',
      label: 'Turnstile Pass',
      desc: 'Live rolling QR',
      icon: <QrCode className="w-4 h-4 text-white" />,
      color: 'from-[#38BDF8] to-[#0284C7] shadow-[0_0_12px_rgba(2,132,199,0.4)]',
      action: () => {
        setSideMenuOpen(false)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('dna:open-qr'))
        }
      },
    },
    {
      id: 'book-class',
      label: 'Book Classes',
      desc: 'Spin, Yoga, HIIT',
      icon: <Calendar className="w-4 h-4 text-white" />,
      color: 'from-[#A855F7] to-[#7C3AED] shadow-[0_0_12px_rgba(124,58,237,0.4)]',
      action: () => {
        setSideMenuOpen(false)
        router.push('/m/classes')
      },
    },
    {
      id: 'whatsapp-coach',
      label: 'WhatsApp Coach',
      desc: 'Direct trainer ping',
      icon: <MessageCircle className="w-4 h-4 text-white" />,
      color: 'from-[#10B981] to-[#059669] shadow-[0_0_12px_rgba(5,150,105,0.4)]',
      action: () => {
        setSideMenuOpen(false)
        window.open('https://wa.me/919820012345?text=Hey%20Coach,%20checking%20in%20from%20DNA%20360', '_blank')
      },
    },
  ]

  const tabs: TabItem[] = [
    {
      id: 'home',
      label: 'Home',
      href: '/m',
      icon: (active) => (
        <Home className={cn("w-5 h-5 transition-transform duration-200", active && "scale-110")} />
      ),
    },
    {
      id: 'workouts',
      label: 'Workouts',
      href: '/m/programs',
      icon: (active) => (
        <Dumbbell className={cn("w-5 h-5 transition-transform duration-200", active && "scale-110")} />
      ),
    },
    // Center action hub handled separately
    {
      id: 'progress',
      label: 'Progress',
      href: '/m/progress',
      icon: (active) => (
        <TrendingUp className={cn("w-5 h-5 transition-transform duration-200", active && "scale-110")} />
      ),
    },
    {
      id: 'pass',
      label: 'Pass',
      href: '/m/checkin',
      icon: (active) => (
        <QrCode className={cn("w-5 h-5 transition-transform duration-200", active && "scale-110")} />
      ),
    },
  ]

  return (
    <>
      {/* Backdrop overlay when side menu is open */}
      {sideMenuOpen && (
        <div
          onClick={() => setSideMenuOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* Floating Navigation Dock Container */}
      <div
        ref={menuRef}
        className="fixed bottom-[calc(14px+env(safe-area-inset-bottom,0px))] inset-x-0 z-50 flex flex-col items-center pointer-events-none px-4"
      >
        {/* Animated Expandable Side Options Tray */}
        {sideMenuOpen && (
          <div
            className="pointer-events-auto mb-3 w-full max-w-[340px] rounded-3xl bg-[#0E0924]/95 border border-[rgba(168,85,247,0.3)] shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_24px_rgba(147,51,234,0.25)] backdrop-blur-2xl p-2.5 space-y-1.5 animate-in fade-in slide-in-from-bottom-4 zoom-in-95 duration-200"
            role="menu"
            aria-label="Quick Actions Menu"
          >
            <div className="px-3 py-1 flex items-center justify-between border-b border-white/5 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#A78BFA] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#EC4899]" />
                Quick Actions
              </span>
              <button
                type="button"
                onClick={() => setSideMenuOpen(false)}
                className="text-[#94A3B8] hover:text-white p-1 rounded-full active:scale-95"
                aria-label="Close menu"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {sideOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={opt.action}
                  className="w-full text-left p-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-95 border border-white/5 hover:border-white/10 transition-all flex flex-col gap-1.5 group cursor-pointer"
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-xl bg-gradient-to-br flex items-center justify-center transition-transform group-hover:scale-105',
                      opt.color
                    )}
                  >
                    {opt.icon}
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-white group-hover:text-[#E9D5FF] transition-colors leading-tight">
                      {opt.label}
                    </span>
                    <span className="block text-[10px] text-[#94A3B8] truncate leading-tight mt-0.5">
                      {opt.desc}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Floating Bubble Pill Dock */}
        <nav
          aria-label="Member Navigation"
          className="pointer-events-auto h-[60px] px-2.5 rounded-full bg-[#0C0720]/90 backdrop-blur-2xl border border-[rgba(168,85,247,0.28)] shadow-[0_16px_40px_rgba(0,0,0,0.85),0_0_20px_rgba(139,92,246,0.2)] flex items-center gap-1 select-none"
        >
          {/* Option 1: Home */}
          {(() => {
            const tab = tabs[0]
            const isActive = pathname === tab.href
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={cn(
                  'h-[46px] px-3.5 rounded-full flex flex-col items-center justify-center transition-all duration-200 relative min-w-[54px]',
                  isActive
                    ? 'text-white'
                    : 'text-[#94A3B8] hover:text-white active:scale-95'
                )}
                aria-label={tab.label}
              >
                <div className={cn(
                  'transition-all',
                  isActive && 'text-[#C084FC] filter drop-shadow-[0_0_10px_rgba(192,132,252,0.8)]'
                )}>
                  {tab.icon(isActive)}
                </div>
                <span className={cn(
                  'text-[9.5px] tracking-tight leading-none mt-1 transition-colors',
                  isActive ? 'font-semibold text-white' : 'font-normal text-[#94A3B8]'
                )}>
                  {tab.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#C084FC] shadow-[0_0_6px_#C084FC]" />
                )}
              </Link>
            )
          })()}

          {/* Option 2: Workouts */}
          {(() => {
            const tab = tabs[1]
            const isActive = pathname.startsWith(tab.href)
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={cn(
                  'h-[46px] px-3.5 rounded-full flex flex-col items-center justify-center transition-all duration-200 relative min-w-[54px]',
                  isActive
                    ? 'text-white'
                    : 'text-[#94A3B8] hover:text-white active:scale-95'
                )}
                aria-label={tab.label}
              >
                <div className={cn(
                  'transition-all',
                  isActive && 'text-[#C084FC] filter drop-shadow-[0_0_10px_rgba(192,132,252,0.8)]'
                )}>
                  {tab.icon(isActive)}
                </div>
                <span className={cn(
                  'text-[9.5px] tracking-tight leading-none mt-1 transition-colors',
                  isActive ? 'font-semibold text-white' : 'font-normal text-[#94A3B8]'
                )}>
                  {tab.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#C084FC] shadow-[0_0_6px_#C084FC]" />
                )}
              </Link>
            )
          })()}

          {/* Center Bubble: Elevated Action Hub (Toggles Side Options) */}
          <div className="px-1.5 flex items-center justify-center">
            <button
              type="button"
              onClick={() => setSideMenuOpen((prev) => !prev)}
              className={cn(
                'w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 relative cursor-pointer active:scale-90',
                sideMenuOpen
                  ? 'bg-[#3B0764] text-white rotate-45 border border-[#EC4899] shadow-[0_0_18px_rgba(236,72,153,0.6)]'
                  : 'bg-gradient-to-br from-[#FF6B6B] via-[#EC4899] to-[#8B5CF6] text-white shadow-[0_0_16px_rgba(236,72,153,0.5),0_4px_12px_rgba(0,0,0,0.5)] hover:scale-105'
              )}
              aria-expanded={sideMenuOpen}
              aria-label="Toggle Quick Actions Hub"
              title="Quick Actions & Side Options"
            >
              <Plus className="w-5 h-5 transition-transform duration-300 stroke-[2.5]" />
            </button>
          </div>

          {/* Option 4: Progress */}
          {(() => {
            const tab = tabs[2]
            const isActive = pathname.startsWith(tab.href)
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={cn(
                  'h-[46px] px-3.5 rounded-full flex flex-col items-center justify-center transition-all duration-200 relative min-w-[54px]',
                  isActive
                    ? 'text-white'
                    : 'text-[#94A3B8] hover:text-white active:scale-95'
                )}
                aria-label={tab.label}
              >
                <div className={cn(
                  'transition-all',
                  isActive && 'text-[#C084FC] filter drop-shadow-[0_0_10px_rgba(192,132,252,0.8)]'
                )}>
                  {tab.icon(isActive)}
                </div>
                <span className={cn(
                  'text-[9.5px] tracking-tight leading-none mt-1 transition-colors',
                  isActive ? 'font-semibold text-white' : 'font-normal text-[#94A3B8]'
                )}>
                  {tab.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#C084FC] shadow-[0_0_6px_#C084FC]" />
                )}
              </Link>
            )
          })()}

          {/* Option 5: Pass */}
          {(() => {
            const tab = tabs[3]
            const isActive = pathname.startsWith(tab.href)
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={cn(
                  'h-[46px] px-3.5 rounded-full flex flex-col items-center justify-center transition-all duration-200 relative min-w-[54px]',
                  isActive
                    ? 'text-white'
                    : 'text-[#94A3B8] hover:text-white active:scale-95'
                )}
                aria-label={tab.label}
              >
                <div className={cn(
                  'transition-all',
                  isActive && 'text-[#C084FC] filter drop-shadow-[0_0_10px_rgba(192,132,252,0.8)]'
                )}>
                  {tab.icon(isActive)}
                </div>
                <span className={cn(
                  'text-[9.5px] tracking-tight leading-none mt-1 transition-colors',
                  isActive ? 'font-semibold text-white' : 'font-normal text-[#94A3B8]'
                )}>
                  {tab.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#C084FC] shadow-[0_0_6px_#C084FC]" />
                )}
              </Link>
            )
          })()}
        </nav>
      </div>
    </>
  )
}
