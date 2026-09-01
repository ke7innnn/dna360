'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Bell,
  Plus,
  Calendar,
  Clock,
  Play,
  Dumbbell,
  Check,
  ChevronRight,
  PauseCircle,
  Sparkles,
  Droplets,
  Award,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/components/app/ui/toast'
import FreezeMemberModal from '@/components/app/members/FreezeMemberModal'
import RenewMemberModal from '@/components/app/members/RenewMemberModal'

export default function MemberDashboardPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [freezeModalOpen, setFreezeModalOpen] = useState(false)
  const [renewModalOpen, setRenewModalOpen] = useState(false)
  const [currentDateStr, setCurrentDateStr] = useState('TUE, 1 SEPTEMBER')
  const [greetingTime, setGreetingTime] = useState('Good evening')

  // Dynamic date & greeting
  useEffect(() => {
    const now = new Date()
    const dayName = now.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
    const dayNum = now.getDate()
    const monthName = now.toLocaleDateString('en-US', { month: 'long' }).toUpperCase()
    setCurrentDateStr(`${dayName}, ${dayNum} ${monthName}`)

    const hour = now.getHours()
    if (hour < 12) setGreetingTime('Good morning')
    else if (hour < 17) setGreetingTime('Good afternoon')
    else setGreetingTime('Good evening')
  }, [])

  const memberFirstName = user?.name ? user.name.split(' ')[0] : 'Aditi'

  return (
    <div className="max-w-md mx-auto py-2 sm:py-4 px-1 select-none">
      {/* ─── Ambient Glow Effect ─── */}
      <div className="relative bg-[#08090C] border border-[rgba(255,255,255,0.13)] rounded-[32px] sm:rounded-[38px] p-4 sm:p-5 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9)] overflow-hidden space-y-4">
        <div className="absolute -left-[20%] -bottom-[30%] w-[140%] h-[60%] bg-[radial-gradient(ellipse_at_50%_100%,rgba(255,92,122,0.13),rgba(120,90,220,0.07)_45%,transparent_70%)] pointer-events-none" />

        {/* ─── Nav Header ─── */}
        <div className="flex items-center justify-between pt-1 pb-2">
          <div className="flex items-center gap-2">
            <div className="flex items-end gap-[2.5px]">
              <i className="w-[3px] h-[9px] rounded-[2px] bg-[#FF5C7A] block" />
              <i className="w-[3px] h-[13px] rounded-[2px] bg-[#F0699C] block" />
              <i className="w-[3px] h-[17px] rounded-[2px] bg-[#C86DD7] block" />
              <i className="w-[3px] h-[13px] rounded-[2px] bg-[#9B7BE8] block" />
              <i className="w-[3px] h-[9px] rounded-[2px] bg-[#6E8CF0] block" />
            </div>
            <span className="font-display text-sm font-semibold tracking-wider text-white">
              DNA 360
            </span>
          </div>

          <button
            onClick={() => toast.info('No new notifications')}
            className="p-1.5 rounded-full hover:bg-[var(--surface-2)] text-[var(--ink-2)] hover:text-white transition-colors"
          >
            <Bell className="w-[19px] h-[19px]" />
          </button>
        </div>

        {/* ─── Greeting ─── */}
        <div>
          <p className="eyebrow text-[9.5px] text-[var(--ink-3)] font-data tracking-wider uppercase">
            {currentDateStr}
          </p>
          <h2 className="text-2xl sm:text-3xl font-semibold text-white font-display tracking-tight leading-tight mt-1">
            {greetingTime}, {memberFirstName}
          </h2>
        </div>

        {/* ─── Signature Strand Meter (§1) ─── */}
        <div className="member-meter">
          <div className="member-meter-ring">
            <svg viewBox="0 0 120 120" width="118" height="118">
              <defs>
                <linearGradient id="strandGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#FF5C7A" />
                  <stop offset="50%" stopColor="#C86DD7" />
                  <stop offset="100%" stopColor="#6E8CF0" />
                </linearGradient>
              </defs>
              <g transform="rotate(-90 60 60)">
                {/* Background Ring */}
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="rgba(255,255,255,.07)"
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray="57.4 8"
                />
                {/* Gradient Strand Value Ring (3 of 5) */}
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="url(#strandGradient)"
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray="57.4 8"
                  pathLength={326.7}
                />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="#08090C"
                  strokeWidth="11"
                  strokeDasharray="130.7 196"
                  strokeDashoffset="-196"
                />
              </g>
            </svg>
            <div className="member-meter-val">
              <b className="text-white">3</b>
              <span className="text-[10.5px] text-[var(--ink-3)] font-data">of 5 this week</span>
            </div>
          </div>

          <div className="flex-1 text-xs text-[var(--ink-2)] leading-relaxed">
            <p>
              Two sessions left to close the week. Your last one was <strong className="text-white font-bold">Saturday</strong>.
            </p>
          </div>
        </div>

        {/* ─── Today's Scheduled Workout Card ─── */}
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-card)] p-4 sm:p-5 space-y-3.5">
          <div className="flex items-start justify-between">
            <div>
              <p className="eyebrow text-[9.5px] text-[var(--ink-3)] font-data tracking-wider uppercase">
                TODAY · WEEK 3, DAY 1
              </p>
              <h3 className="text-xl font-semibold text-white font-display tracking-tight mt-1">
                Push
              </h3>
              <p className="text-xs text-[var(--ink-2)] mt-0.5">
                6 exercises · about 52 min
              </p>
            </div>
            <span className="member-pill member-pill-live">
              SCHEDULED
            </span>
          </div>

          <Link href="/m/session" className="block pt-1">
            <button className="w-full py-3.5 rounded-full bg-[#FF5C7A] text-[#12040A] font-bold text-sm hover:brightness-110 active:scale-[0.99] transition-all shadow-[0_0_20px_rgba(255,92,122,0.35)] flex items-center justify-center gap-2">
              <Play className="w-4 h-4 fill-current" /> Start workout
            </button>
          </Link>
        </div>

        {/* ─── 2-Tile Grid ─── */}
        <div className="grid grid-cols-2 gap-2.5">
          <Link href="/m/session">
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-tile)] p-3.5 flex flex-col gap-2 hover:border-[rgba(255,92,122,0.3)] transition-colors cursor-pointer group">
              <Plus className="w-4 h-4 text-[var(--ink-2)] group-hover:text-white transition-colors" />
              <b className="text-xs font-medium text-white block">Log a workout</b>
            </div>
          </Link>

          <Link href="/classes">
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-tile)] p-3.5 flex flex-col gap-2 hover:border-[rgba(255,92,122,0.3)] transition-colors cursor-pointer group">
              <Calendar className="w-4 h-4 text-[var(--ink-2)] group-hover:text-white transition-colors" />
              <b className="text-xs font-medium text-white block">Book a class</b>
            </div>
          </Link>
        </div>

        {/* ─── Streak Section ─── */}
        <div>
          <div className="flex items-center justify-between text-xs mb-2">
            <h3 className="font-bold text-white tracking-tight">Your streak</h3>
            <span className="font-data text-[11px] text-[var(--ink-3)]">12 days</span>
          </div>
          <div className="member-streak">
            <i className="on" title="Mon" />
            <i className="on" title="Tue" />
            <i title="Wed (Rest)" />
            <i className="on" title="Thu" />
            <i className="on" title="Fri" />
            <i className="on" title="Sat" />
            <i className="today" title="Today (Tue)" />
          </div>
        </div>

        {/* ─── Plan Status Card ─── */}
        <Link href="/profile">
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-card)] p-3.5 flex items-center gap-3 hover:border-[rgba(255,92,122,0.3)] transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-[10px] bg-[var(--surface-2)] flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 stroke-[#FF5C7A]" />
            </div>
            <div className="flex-1 min-w-0">
              <b className="text-xs font-medium text-white block tracking-tight">
                47 days left on your plan
              </b>
              <span className="text-[11px] text-[var(--ink-3)] block mt-0.5">
                Renew before 11 Oct to keep your rate
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Modals */}
      <FreezeMemberModal
        open={freezeModalOpen}
        onOpenChange={setFreezeModalOpen}
        member={null}
        onFrozen={() => toast.success('Membership frozen')}
      />

      <RenewMemberModal
        open={renewModalOpen}
        onOpenChange={setRenewModalOpen}
        member={null}
        onRenewed={() => toast.success('Membership renewed')}
      />
    </div>
  )
}
