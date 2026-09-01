'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Bell,
  Play,
  Calendar,
  Dumbbell,
  Users,
  Plus,
  ArrowRight,
  Flame,
  Award,
  ChevronRight,
  Activity,
  User,
  HeartPulse,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/components/app/ui/toast'
import ReadinessCard from '@/components/app/dashboard/ReadinessCard'
import FreezeMemberModal from '@/components/app/members/FreezeMemberModal'
import RenewMemberModal from '@/components/app/members/RenewMemberModal'
import { cn } from '@/lib/utils'

export default function MemberDashboardPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [freezeModalOpen, setFreezeModalOpen] = useState(false)
  const [renewModalOpen, setRenewModalOpen] = useState(false)
  const [greetingTime, setGreetingTime] = useState('Good evening')
  const [selectedDay, setSelectedDay] = useState('Tue 1')

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreetingTime('Good morning')
    else if (hour < 17) setGreetingTime('Good afternoon')
    else setGreetingTime('Good evening')
  }, [])

  const memberName = user?.name || 'Aditi'
  const memberFirstName = memberName.split(' ')[0]
  const memberInitials = memberName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  // 7-day strip matching mockup
  const weekDays = [
    { day: 'Sat', num: '29', dateKey: 'Sat 29' },
    { day: 'Sun', num: '30', dateKey: 'Sun 30' },
    { day: 'Mon', num: '31', dateKey: 'Mon 31' },
    { day: 'Tue', num: '1', dateKey: 'Tue 1', isCurrent: true },
    { day: 'Wed', num: '2', dateKey: 'Wed 2' },
    { day: 'Thu', num: '3', dateKey: 'Thu 3' },
    { day: 'Fri', num: '4', dateKey: 'Fri 4' },
  ]

  return (
    <div className="max-w-7xl mx-auto py-2 sm:py-5 px-3 sm:px-6 space-y-6 select-none">
      {/* ─── Top Greeting & Header ─── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-white font-normal tracking-tight">
            {greetingTime}, <em className="italic font-normal">{memberFirstName}</em>
          </h1>
          <p className="font-ui text-xs sm:text-[13px] text-[var(--ink-2)] mt-1">
            Two sessions left to close the week. Last one was Saturday.
          </p>
        </div>

        {/* Right User & Notification Pills */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => toast.info('You have no unread notifications.')}
            className="w-10 h-10 rounded-full bg-[#111726] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[var(--ink-2)] hover:text-white hover:border-[#3B82F6] transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
          </button>

          <Link
            href="/profile"
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1D4ED8] to-[#3B82F6] border border-[#60A5FA]/60 flex items-center justify-center text-white font-ui text-xs font-bold shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:brightness-110 transition-all cursor-pointer"
            title="View Profile & Plan"
          >
            {memberInitials || 'AD'}
          </Link>
        </div>
      </div>

      {/* ─── 7-Day Horizontal Calendar Strip ─── */}
      <div className="grid grid-cols-7 gap-2 sm:gap-3">
        {weekDays.map((d) => {
          const isSelected = selectedDay === d.dateKey
          return (
            <button
              key={d.dateKey}
              onClick={() => setSelectedDay(d.dateKey)}
              className={cn(
                'py-3 rounded-[16px] border text-center transition-all duration-150 cursor-pointer flex flex-col items-center justify-center gap-0.5',
                isSelected
                  ? 'bg-gradient-to-b from-[#3B82F6] to-[#1D4ED8] border-[#60A5FA] text-white shadow-[0_0_20px_rgba(59,130,246,0.45)] scale-[1.02]'
                  : 'bg-[#0E131F]/80 border-[rgba(255,255,255,0.06)] text-[var(--ink-3)] hover:text-white hover:border-[rgba(255,255,255,0.15)]'
              )}
            >
              <span className={cn('text-[11px] font-ui', isSelected ? 'text-white/80 font-medium' : 'text-[var(--ink-3)]')}>
                {d.day}
              </span>
              <span className={cn('text-sm sm:text-base font-data font-bold', isSelected ? 'text-white' : 'text-white')}>
                {d.num}
              </span>
            </button>
          )
        })}
      </div>

      {/* ─── Daily Readiness Check-In Card (Addendum §2) ─── */}
      <ReadinessCard
        memberId={user?.id || 'mem_aditi_01'}
        memberName={memberFirstName}
      />

      {/* ─── 12-Column Main Bento Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* ─── LEFT COLUMN: Hero Workout Card & Stats (8 COLS) ─── */}
        <div className="lg:col-span-8 flex flex-col gap-5 justify-between">
          {/* Hero Today's Workout Card */}
          <div className="rounded-[24px] bg-gradient-to-br from-[#1E40AF] via-[#2563EB] to-[#1D4ED8] p-6 sm:p-7 relative overflow-hidden border border-[#60A5FA]/40 shadow-[0_20px_50px_rgba(29,78,216,0.35)] flex flex-col justify-between min-h-[260px]">
            {/* Background Arch Silhouette Graphic */}
            <div className="absolute -right-6 -bottom-8 w-60 h-72 rounded-t-full bg-gradient-to-b from-white/15 to-transparent pointer-events-none border-t border-l border-white/20" />
            <div className="absolute right-12 bottom-4 font-data text-[9px] uppercase tracking-[0.2em] text-white/40 pointer-events-none font-bold">
              DNA · 360
            </div>

            {/* Card Content */}
            <div className="space-y-2 relative z-10">
              <span className="inline-block px-3 py-1 rounded-full text-[10px] font-data font-semibold bg-white/15 text-white backdrop-blur-md border border-white/20 tracking-wider uppercase">
                FROM ROHAN · WEEK 3
              </span>

              <h2 className="text-3xl sm:text-4xl font-bold text-white font-display tracking-tight mt-1">
                Push Day
              </h2>

              <p className="text-white/80 font-ui text-sm sm:text-[15px] font-medium">
                Chest, shoulders and triceps
              </p>

              <p className="text-white/70 font-data text-xs pt-1">
                6 exercises · 52 min
              </p>
            </div>

            {/* Start Now CTA Button */}
            <div className="pt-5 relative z-10">
              <button
                onClick={() => router.push('/m/session')}
                className="px-7 py-3 rounded-full bg-white text-[#0B0F19] font-bold font-ui text-sm hover:bg-white/90 active:scale-95 transition-all shadow-[0_8px_20px_rgba(0,0,0,0.3)] flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current text-[#0B0F19]" />
                Start now
              </button>
            </div>
          </div>

          {/* 3-Stat Metric Tiles */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div className="p-4 rounded-[20px] bg-[#0E131F] border border-[rgba(255,255,255,0.07)]">
              <span className="text-[11px] font-ui text-[var(--ink-3)] block">
                This week
              </span>
              <span className="text-2xl sm:text-3xl font-data font-bold text-white mt-1 block">
                3 / 5
              </span>
            </div>

            <div className="p-4 rounded-[20px] bg-[#0E131F] border border-[rgba(255,255,255,0.07)]">
              <span className="text-[11px] font-ui text-[var(--ink-3)] block">
                Streak
              </span>
              <span className="text-2xl sm:text-3xl font-data font-bold text-white mt-1 block">
                12 days
              </span>
            </div>

            <div className="p-4 rounded-[20px] bg-[#0E131F] border border-[rgba(255,255,255,0.07)]">
              <span className="text-[11px] font-ui text-[var(--ink-3)] block">
                Bench PR
              </span>
              <span className="text-2xl sm:text-3xl font-data font-bold text-white mt-1 block">
                62.5 kg
              </span>
            </div>
          </div>

          {/* Train On Your Own Categories */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <h3 className="font-ui text-base font-bold text-white tracking-tight">
                Train on your own
              </h3>
              <Link
                href="/m/programs"
                className="text-xs text-[var(--ink-3)] hover:text-white transition-colors"
              >
                See all
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { name: 'Strength', icon: Dumbbell, color: 'text-[#60A5FA]', border: 'border-[#3B82F6]/30', bg: 'bg-[#3B82F6]/10' },
                { name: 'Cardio', icon: HeartPulse, color: 'text-[#38BDF8]', border: 'border-[#38BDF8]/30', bg: 'bg-[#38BDF8]/10' },
                { name: 'Mobility', icon: Activity, color: 'text-[#A78BFA]', border: 'border-[#A78BFA]/30', bg: 'bg-[#A78BFA]/10' },
                { name: 'Reformer', icon: Award, color: 'text-[#34D399]', border: 'border-[#34D399]/30', bg: 'bg-[#34D399]/10' },
              ].map((cat) => {
                const Icon = cat.icon
                return (
                  <button
                    key={cat.name}
                    onClick={() => router.push('/m/programs')}
                    className="p-4 rounded-[20px] bg-[#0E131F] border border-[rgba(255,255,255,0.07)] hover:border-[#3B82F6] hover:bg-[#111726] transition-all flex flex-col items-center justify-center gap-2 group cursor-pointer"
                  >
                    <div className={cn('w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110', cat.bg, cat.border, 'border')}>
                      <Icon className={cn('w-5 h-5', cat.color)} />
                    </div>
                    <span className="font-ui text-xs font-semibold text-white">
                      {cat.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* ─── RIGHT COLUMN: Membership & Quick Actions (4 COLS) ─── */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Card 1: Membership Status */}
          <div className="p-5 rounded-[22px] bg-[#0E131F] border border-[rgba(255,255,255,0.08)] space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <h3 className="font-ui text-sm font-bold text-white">
                Premium Annual
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/30 uppercase">
                ACTIVE
              </span>
            </div>

            {/* Validity Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="h-1.5 w-full bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#2563EB] to-[#60A5FA] rounded-full w-[84%]" />
              </div>
              <div className="flex items-center justify-between text-[11px] font-data text-[var(--ink-3)]">
                <span>47 days left</span>
                <span>Ends 11 Oct &apos;26</span>
              </div>
            </div>
          </div>

          {/* Card 2: PT Sessions Left */}
          <div
            onClick={() => router.push('/m/progress')}
            className="p-4 rounded-[20px] bg-[#0E131F] border border-[rgba(255,255,255,0.08)] hover:border-[#3B82F6] hover:bg-[#111726] transition-all flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[rgba(59,130,246,0.15)] border border-[rgba(59,130,246,0.3)] flex items-center justify-center text-[#60A5FA] group-hover:scale-105 transition-transform">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-ui text-sm font-bold text-white">
                  6 of 12 PT sessions
                </h4>
                <p className="font-ui text-xs text-[var(--ink-3)]">
                  Elite · Rohan Kulkarni
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[var(--ink-3)] group-hover:text-white transition-colors" />
          </div>

          {/* Card 3: Class Booking */}
          <div
            onClick={() => router.push('/classes')}
            className="p-4 rounded-[20px] bg-[#0E131F] border border-[rgba(255,255,255,0.08)] hover:border-[#3B82F6] hover:bg-[#111726] transition-all flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[rgba(59,130,246,0.15)] border border-[rgba(59,130,246,0.3)] flex items-center justify-center text-[#60A5FA] group-hover:scale-105 transition-transform">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-ui text-sm font-bold text-white">
                  Spin · Thu 7:00 pm
                </h4>
                <p className="font-ui text-xs text-[var(--ink-3)]">
                  Booked · 2 spots left
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[var(--ink-3)] group-hover:text-white transition-colors" />
          </div>

          {/* Card 4: Log a Workout */}
          <div
            onClick={() => router.push('/m/session')}
            className="p-4 rounded-[20px] bg-[#0E131F] border border-[rgba(255,255,255,0.08)] hover:border-[#3B82F6] hover:bg-[#111726] transition-all flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-ui text-sm font-bold text-white">
                  Log a workout
                </h4>
                <p className="font-ui text-xs text-[var(--ink-3)]">
                  No plan needed
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[var(--ink-3)] group-hover:text-white transition-colors" />
          </div>
        </div>
      </div>

      {/* Freeze & Renew Modals */}
      <FreezeMemberModal
        open={freezeModalOpen}
        onOpenChange={setFreezeModalOpen}
        onFrozen={() => toast.success('Membership freeze submitted')}
      />

      <RenewMemberModal
        member={{
          id: user?.id || 'mem_01',
          name: memberName,
          email: user?.email || 'aditi@gmail.com',
          phone: '+919820011223',
          member_code: 'DNA-POW-2026-88',
          status: 'active',
          joined_date: '12 Oct 2025',
          branch_id: 'pow',
          branch_name: 'Powai Flagship',
          active_memberships: [
            {
              id: 'mem_pkg_01',
              packageId: 'pkg_annual_01',
              product_name: '12 Months Premium Annual',
              category: 'gym_floor',
              status: 'active',
              start_date: '12 Oct 2025',
              expiry_date: '11 Oct 2026',
              amount_paid: 5400000,
              freeze_days_used: 12,
              max_freeze_days: 30,
            },
          ],
        } as any}
        open={renewModalOpen}
        onOpenChange={setRenewModalOpen}
        onUpdated={() => toast.success('Plan renewed')}
      />
    </div>
  )
}
