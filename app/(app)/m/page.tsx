'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sparkles,
  Zap,
  CloudRain,
  Waves,
  SunMedium,
  Flame,
  Activity,
  QrCode,
  Bell,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/components/app/ui/toast'
import { getInitials, cn } from '@/lib/utils'
import { getMemberPortalState, MemberPortalState } from '@/lib/memberportal'

type MoodType = 'heavy' | 'calm' | 'fresh' | 'wired'

interface MoodOption {
  id: MoodType
  label: string
  desc: string
  icon: React.ReactNode
  coachingCue: string
}

export default function MemberAppHomePage() {
  const router = useRouter()
  const { user } = useAuth()

  const userName = user?.name ? user.name.split(' ')[0] : 'Alex'
  const userFullName = user?.name || 'Alex Morgan'
  const initials = getInitials(userFullName) || 'AM'

  const [portalState, setPortalState] = useState<MemberPortalState | null>(null)
  const [selectedMood, setSelectedMood] = useState<MoodType>('calm')
  const [isOrbPressed, setIsOrbPressed] = useState(false)

  useEffect(() => {
    setPortalState(getMemberPortalState(user?.id || user?.name))
  }, [user?.id, user?.name])

  const planName = portalState?.planName || 'Annual All-Access Membership'
  const memberCode = portalState?.memberCode || (user as any)?.member_code || 'DNA-0412'
  const ptRemaining = portalState?.ptSessionsRemaining ?? 6
  const ptTotal = portalState?.ptSessionsTotal ?? 12
  const streak = portalState?.attendanceStreak ?? 12

  // Dynamic time-based greeting prefix (e.g. Gm, Alex)
  const greetingPrefix = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Gm'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }, [])

  // Live real-time member clock (ticking every second)
  const [liveDateTime, setLiveDateTime] = useState('')

  useEffect(() => {
    const update = () => {
      const now = new Date()
      const d = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      const t = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })
      setLiveDateTime(`${d} · ${t}`)
    }
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [])

  const moodOptions: MoodOption[] = [
    {
      id: 'heavy',
      label: 'Heavy',
      desc: 'Sluggish, foggy',
      icon: <CloudRain className="w-5 h-5 text-[#94A3B8]" />,
      coachingCue: 'Sluggish today? Coach Rohan added 10m extra dynamic warm-up. Prioritize form over load.',
    },
    {
      id: 'calm',
      label: 'Calm',
      desc: 'Settled, easy',
      icon: <Waves className="w-5 h-5 text-[#38BDF8]" />,
      coachingCue: 'Settled and locked in. Optimal for mind-muscle connection and controlled tempo sets.',
    },
    {
      id: 'fresh',
      label: 'Fresh',
      desc: 'Bright, ready',
      icon: <SunMedium className="w-5 h-5 text-[#FBBF24]" />,
      coachingCue: 'CNS fully primed! Push for progressive overload and personal records on heavy sets today.',
    },
    {
      id: 'wired',
      label: 'Wired',
      desc: 'Buzzy, restless',
      icon: <Zap className="w-5 h-5 text-[#EC4899]" />,
      coachingCue: 'High adrenaline surge. Channel that raw drive into explosive compound lifts and high-energy sets.',
    },
  ]

  const activeMood = moodOptions.find((m) => m.id === selectedMood) || moodOptions[1]

  // Radial tick marks for the circular gauge around the orb (matching Screenshot 1)
  const tickCount = 72
  const ticks = useMemo(() => {
    const arr = []
    const cx = 140
    const cy = 140
    const r1 = 112
    const r2 = 126
    for (let i = 0; i < tickCount; i++) {
      // Leave a small gap at bottom-right just like the screenshot
      const isGap = i > 48 && i < 54
      const angle = (i * 360) / tickCount - 90
      const rad = (angle * Math.PI) / 180
      const x1 = cx + r1 * Math.cos(rad)
      const y1 = cy + r1 * Math.sin(rad)
      const x2 = cx + r2 * Math.cos(rad)
      const y2 = cy + r2 * Math.sin(rad)
      const isActive = i <= 48
      arr.push({ id: i, x1, y1, x2, y2, isActive, isGap })
    }
    return arr
  }, [])

  const handleLaunchWorkout = () => {
    setIsOrbPressed(true)
    setTimeout(() => {
      router.push('/m/session')
    }, 180)
  }

  const handleOpenQrModal = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dna:open-qr'))
    }
  }

  const handleOpenProfile = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dna:open-profile'))
    }
  }

  const handleOpenUpgrade = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dna:open-upgrade'))
    }
  }

  return (
    <div className="w-full max-w-md mx-auto pt-3 pb-28 px-4 flex flex-col items-center select-none">
      {/* ─── Top Utility Navigation Bar ─── */}
      <div className="w-full flex items-center justify-between py-2 mb-2">
        {/* Profile Avatar Trigger */}
        <button
          type="button"
          onClick={handleOpenProfile}
          className="flex items-center gap-2.5 p-1 rounded-full hover:bg-white/5 active:scale-95 transition-all text-left group"
          aria-label="View member profile"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF6B6B] via-[#EC4899] to-[#8B5CF6] flex items-center justify-center text-white text-xs font-bold tracking-tight shadow-[0_0_12px_rgba(236,72,153,0.3)]">
            {initials}
          </div>
          <div className="hidden sm:block">
            <span className="text-[10px] text-[#A78BFA] block font-medium uppercase tracking-wider leading-none">
              DNA 360
            </span>
            <span className="text-xs text-white font-medium block leading-tight mt-0.5 group-hover:text-[#EC4899] transition-colors">
              {userName}
            </span>
          </div>
        </button>

        {/* Quick QR & Notification Icons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenQrModal}
            className="w-9 h-9 rounded-full bg-white/[0.05] hover:bg-white/[0.1] active:scale-90 border border-white/10 flex items-center justify-center text-white transition-all shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
            aria-label="Turnstile QR Pass"
            title="Digital Check-in Pass"
          >
            <QrCode className="w-4 h-4 text-[#C084FC]" />
          </button>

          <button
            type="button"
            onClick={() => {
              toast.info('Studio Updates', {
                description: 'Next Push & Core session scheduled with Rohan.',
              })
            }}
            className="w-9 h-9 rounded-full bg-white/[0.05] hover:bg-white/[0.1] active:scale-90 border border-white/10 flex items-center justify-center text-white transition-all relative shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 text-[#94A3B8]" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#EC4899] ring-2 ring-[#070415]" />
          </button>
        </div>
      </div>

      {/* ─── Hero Heading (Matching Screenshot 1 & Level 4) ─── */}
      <div className="text-center my-3 flex flex-col items-center">
        {liveDateTime && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-mono text-[#38BDF8] tracking-wider mb-2 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
            <span>{liveDateTime}</span>
          </div>
        )}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-sans">
          {greetingPrefix}, {userName}
        </h1>
        <p className="text-sm text-[#94A3B8] font-normal mt-1 tracking-tight">
          Don&apos;t fight it. Time to crush today bro.
        </p>
      </div>

      {/* ─── Central Luminous Neon Orb (Matching Screenshot 1 & Level 4) ─── */}
      <div className="relative my-4 flex items-center justify-center">
        {/* Deep Violet / Magenta Ambient Halo Blur */}
        <div
          className="absolute w-[290px] h-[290px] rounded-full pointer-events-none -z-10 animate-pulse duration-1000"
          style={{
            background:
              'radial-gradient(circle, rgba(236,72,153,0.48) 0%, rgba(139,92,246,0.36) 45%, rgba(15,9,36,0) 72%)',
            filter: 'blur(42px)',
          }}
        />

        {/* Concentric Radial Tick Marks Ring SVG */}
        <div className="absolute w-[280px] h-[280px] pointer-events-none select-none flex items-center justify-center">
          <svg
            viewBox="0 0 280 280"
            className="w-full h-full transform transition-transform duration-700"
          >
            {ticks.map((t) => {
              if (t.isGap) return null
              return (
                <line
                  key={t.id}
                  x1={t.x1}
                  y1={t.y1}
                  x2={t.x2}
                  y2={t.y2}
                  stroke={t.isActive ? '#FFFFFF' : 'rgba(255,255,255,0.25)'}
                  strokeWidth={t.isActive ? '1.8' : '1.2'}
                  strokeLinecap="round"
                  opacity={t.isActive ? 0.95 : 0.4}
                />
              )
            })}
          </svg>
        </div>

        {/* 3D Luminous Spherical Core Orb */}
        <button
          type="button"
          onClick={handleLaunchWorkout}
          className={cn(
            'w-[204px] h-[204px] rounded-full relative flex flex-col items-center justify-center transition-all duration-300 cursor-pointer group active:scale-95 focus:outline-none',
            isOrbPressed ? 'scale-95' : 'hover:scale-[1.03]'
          )}
          style={{
            background:
              'radial-gradient(circle at 36% 30%, #FFA07A 0%, #FF5376 32%, #EC4899 62%, #7C3AED 95%)',
            boxShadow:
              'inset 0 -12px 28px rgba(0,0,0,0.38), inset 0 8px 18px rgba(255,255,255,0.45), 0 0 45px rgba(236,72,153,0.55)',
          }}
          aria-label="Tap to start today's workout"
        >
          {/* Subtle inner gloss highlight */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/20 via-transparent to-white/20 pointer-events-none" />

          {/* Time & Title Inside Orb (Matching Screenshot "14s shake to turn off") */}
          <div className="relative z-10 flex flex-col items-center text-center text-white px-2">
            <span className="font-sans font-black text-[52px] sm:text-[56px] tracking-tight leading-none tabular-nums drop-shadow-md">
              52m
            </span>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              <span className="text-[12px] font-medium tracking-wide text-white/95 lowercase drop-shadow-sm">
                tap to start workout
              </span>
            </div>
          </div>
        </button>
      </div>

      {/* ─── Bottom 3 Micro-Metrics Strip (Matching Screenshot 1 & Level 4) ─── */}
      <div className="w-full max-w-[340px] grid grid-cols-3 text-center py-3 my-2 border-t border-b border-white/[0.08] backdrop-blur-sm">
        {/* Column 1: Stage / Protocol */}
        <div className="flex flex-col items-center px-1">
          <span className="text-[11px] font-medium text-[#94A3B8] tracking-tight block">
            Stage
          </span>
          <div className="flex items-center gap-1 text-white font-bold text-xs sm:text-[13px] mt-1">
            <Activity className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span className="truncate">Push &amp; Core</span>
          </div>
        </div>

        {/* Column 2: Slept / Streak */}
        <div className="flex flex-col items-center px-1 border-x border-white/[0.08]">
          <span className="text-[11px] font-medium text-[#94A3B8] tracking-tight block">
            Streak
          </span>
          <div className="flex items-center gap-1 text-white font-bold text-xs sm:text-[13px] mt-1 tabular-nums">
            <Flame className="w-3.5 h-3.5 text-[#FF6B6B]" />
            <span>{streak} Days</span>
          </div>
        </div>

        {/* Column 3: Quality / PT Sessions */}
        <div className="flex flex-col items-center px-1">
          <span className="text-[11px] font-medium text-[#94A3B8] tracking-tight block">
            PT Left
          </span>
          <span className="text-white font-bold text-xs sm:text-[13px] mt-1 tabular-nums">
            {ptRemaining} of {ptTotal}
          </span>
        </div>
      </div>

      {/* ─── Plan Status & Quick Buy / Upgrade Banner ─── */}
      <div className="w-full max-w-md mt-2 px-0.5">
        <button
          type="button"
          onClick={handleOpenUpgrade}
          className="w-full p-3 rounded-2xl bg-gradient-to-r from-[#17122B]/90 via-[#271038]/90 to-[#17122B]/90 hover:from-[#261D47] hover:to-[#261D47] border border-[rgba(168,85,247,0.35)] hover:border-[rgba(168,85,247,0.6)] shadow-[0_4px_20px_rgba(147,51,234,0.15)] active:scale-[0.99] transition-all flex items-center justify-between group cursor-pointer text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#8B5CF6] to-[#EC4899] flex items-center justify-center text-white shadow-[0_0_12px_rgba(236,72,153,0.4)] shrink-0">
              <Sparkles className="w-4 h-4 text-[#FDE047]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-tight truncate group-hover:text-[#C084FC] transition-colors">
                  {planName}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-[9px] font-bold text-emerald-400 uppercase tracking-wider shrink-0">
                  Active
                </span>
              </div>
              <p className="text-[11px] text-[#A78BFA] mt-0.5 truncate">
                Tap to upgrade membership or purchase PT sessions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 group-hover:bg-white/20 text-xs font-bold text-white shrink-0 ml-2">
            <span>Upgrade</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </button>
      </div>

      {/* ─── Mood & Energy Check-In (Screenshot 2 Levels 2 & 3) ─── */}
      <div className="w-full mt-4">
        <div className="mb-2.5 text-center">
          <h2 className="text-base font-bold text-white tracking-tight">
            What&apos;s your mood right now?
          </h2>
          <p className="text-xs text-[#94A3B8] tracking-tight mt-0.5">
            Pick the one that fits closest.
          </p>
        </div>

        {/* 2x2 Glass Tile Selector */}
        <div className="grid grid-cols-2 gap-2.5">
          {moodOptions.map((mood) => {
            const isSelected = selectedMood === mood.id
            return (
              <button
                key={mood.id}
                type="button"
                onClick={() => setSelectedMood(mood.id)}
                className={cn(
                  'p-3.5 rounded-2xl flex flex-col items-center text-center transition-all duration-200 cursor-pointer active:scale-95 min-h-[96px] justify-center relative overflow-hidden',
                  isSelected
                    ? 'bg-[#1D143D]/90 border-2 border-[#8B5CF6] shadow-[0_0_20px_rgba(139,92,246,0.35)]'
                    : 'bg-[#110B26]/70 hover:bg-[#181136]/70 border border-white/10'
                )}
              >
                <div
                  className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center mb-1.5 transition-transform',
                    isSelected
                      ? 'bg-[#8B5CF6]/25 scale-110 shadow-[0_0_10px_rgba(139,92,246,0.4)]'
                      : 'bg-white/5'
                  )}
                >
                  {mood.icon}
                </div>
                <span
                  className={cn(
                    'text-xs font-bold leading-tight block',
                    isSelected ? 'text-white' : 'text-[#E2E8F0]'
                  )}
                >
                  {mood.label}
                </span>
                <span className="text-[10.5px] text-[#94A3B8] tracking-tight block mt-0.5">
                  {mood.desc}
                </span>
              </button>
            )
          })}
        </div>

        {/* Dynamic Coaching Recommendation Pill */}
        <div className="mt-3 p-3 rounded-2xl bg-[#160E33]/85 border border-[#8B5CF6]/30 flex items-start gap-2.5 shadow-[0_4px_16px_rgba(0,0,0,0.4)] animate-in fade-in duration-200">
          <div className="p-1 rounded-lg bg-[#8B5CF6]/20 text-[#C084FC] shrink-0 mt-0.5">
            <Sparkles className="w-3.5 h-3.5 text-[#EC4899]" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#A78BFA] block">
              Daily Readiness Guidance
            </span>
            <p className="text-xs text-white/90 leading-relaxed mt-0.5">
              {activeMood.coachingCue}
            </p>
          </div>
        </div>
      </div>

      {/* ─── Minimal Access Pass Trigger (Screenshot Level 1/2 clean trigger) ─── */}
      <div className="w-full mt-4">
        <button
          type="button"
          onClick={handleOpenQrModal}
          className="w-full py-2.5 px-4 rounded-full bg-white/[0.04] hover:bg-white/[0.08] active:scale-98 border border-white/[0.08] flex items-center justify-between text-left transition-all"
        >
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="w-4 h-4 text-[#38BDF8] shrink-0" />
            <span className="text-xs font-medium text-white truncate">
              {planName} · Active Pass
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0 text-[#94A3B8]">
            <span className="text-[10px] font-sans tabular-nums text-[#38BDF8]">
              {memberCode}
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </button>
      </div>
    </div>
  )
}
