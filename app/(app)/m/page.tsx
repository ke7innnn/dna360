'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Bell,
  QrCode,
  Calendar,
  Clock,
  Dumbbell,
  Play,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Flame,
  Award,
  CheckCircle2,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/components/app/ui/toast'
import MemberQrModal from '@/components/app/member/MemberQrModal'
import { getInitials, cn } from '@/lib/utils'

export default function MemberAppHomePage() {
  const router = useRouter()
  const { user } = useAuth()

  const userName = user?.name ? user.name.split(' ')[0] : 'Aditi'
  const userFullName = user?.name || 'Aditi Deshpande'
  const initials = getInitials(userFullName) || 'AD'

  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState('Tue 1')

  const weekDays = [
    { day: 'Sat', num: '29', hasDot: true },
    { day: 'Sun', num: '30', hasDot: false },
    { day: 'Mon', num: '31', hasDot: true },
    { day: 'Tue', num: '1', hasDot: false, isSelected: true },
    { day: 'Wed', num: '2', hasDot: false },
    { day: 'Thu', num: '3', hasDot: false },
    { day: 'Fri', num: '4', hasDot: false },
  ]

  return (
    <div className="w-full max-w-6xl mx-auto pt-1 pb-24 px-4 select-none">
      {/* ─── Mobile Header (Avatar, Greeting, Notification Bell) ─── */}
      <div className="member-hdr md:hidden">
        <div className="member-who">
          <div className="member-pfp">{initials}</div>
          <div>
            <p className="hi">Good evening</p>
            <p className="nm">{userName}</p>
          </div>
        </div>

        <button
          onClick={() => {
            toast.info('No new notifications', {
              description: 'Next PT session confirmed for tomorrow at 7:00 AM.',
            })
          }}
          className="member-icbtn"
          aria-label="Notifications"
        >
          <svg viewBox="0 0 24 24">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.7 21a2 2 0 01-3.4 0" />
          </svg>
          <span className="member-dotb" />
        </button>
      </div>

      {/* ─── Responsive Grid: 1 col on Mobile, 12 cols on Desktop PC ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Main Column (7 cols on PC) */}
        <div className="lg:col-span-7 space-y-4">
          {/* QR Bar Shortcut */}
          <div
            onClick={() => setQrModalOpen(true)}
            className="member-qrbar"
          >
            <svg viewBox="0 0 24 24">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <path d="M14 14h3v3M20 20h1M17 21h1" />
            </svg>
            <b>Your check-in code</b>
            <div className="go">
              <svg viewBox="0 0 24 24">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          </div>

          {/* Week Day Pill Selector */}
          <div className="member-week">
            {weekDays.map((w) => {
              const id = `${w.day} ${w.num}`
              const isSel = selectedDay === id || (!selectedDay && w.isSelected)
              return (
                <div
                  key={id}
                  onClick={() => setSelectedDay(id)}
                  className={cn(
                    'member-day',
                    w.hasDot && 'dot',
                    isSel && 'sel'
                  )}
                >
                  <p className="dn">{w.day}</p>
                  <p className="dd">{w.num}</p>
                </div>
              )
            })}
          </div>

          {/* Section: Today */}
          <div className="member-sec">
            <h3>Today</h3>
            <Link href="/m/programs">History</Link>
          </div>

          {/* Hero Workout Card (wcard) */}
          <div className="member-wcard">
            <div>
              <span className="member-tag">FROM ROHAN · WEEK 3</span>
              <h2>Push Day</h2>
              <p>Chest, shoulders and triceps</p>
              <p className="meta">6 exercises · 52 min</p>
            </div>

            <button
              onClick={() => router.push('/m/session')}
              className="member-cta"
            >
              Start now
            </button>

            {/* Silhouette Figure */}
            <div className="member-figure">
              <span>DNA 360</span>
            </div>
          </div>

          {/* Next Class Row */}
          <div className="member-sec pt-2">
            <h3>Next class</h3>
            <Link href="/m/classes">See all</Link>
          </div>

          <Link href="/m/classes" className="member-lrow block">
            <div className="flex items-center gap-3">
              <div className="member-lic" style={{ background: 'var(--t2)' }}>
                <svg viewBox="0 0 24 24" style={{ stroke: '#6FD4F5' }}>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
              </div>
              <div className="member-lt">
                <b>Spin · Thu 7:00 pm</b>
                <span>Booked · Tanvi · 2 spots left</span>
              </div>
              <div className="member-go2">
                <svg viewBox="0 0 24 24">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Mobile Membership & Streak (visible only on mobile) */}
          <div className="space-y-4 lg:hidden pt-2">
            {/* Membership Card */}
            <div className="member-card">
              <div className="member-mem-top">
                <b>Premium Annual</b>
                <span className="member-pill member-p-ok">ACTIVE</span>
              </div>
              <div className="member-bar">
                <i style={{ width: '71%' }} />
              </div>
              <div className="member-meta2">
                <span>47 days left</span>
                <span>6 of 12 PT sessions</span>
              </div>
            </div>

            {/* Streak */}
            <div className="member-sec">
              <h3>Streak</h3>
              <a href="#">12 days</a>
            </div>
            <div className="member-streak-bar">
              <i className="on" />
              <i className="on" />
              <i />
              <i className="on" />
              <i className="on" />
              <i className="on" />
              <i className="now" />
            </div>
          </div>
        </div>

        {/* Right / Desktop PC Column (5 cols on PC) */}
        <div className="hidden lg:block lg:col-span-5 space-y-4">
          {/* Live Rolling QR Check-in Box on PC */}
          <div className="member-card p-5 text-center flex flex-col items-center">
            <div className="flex items-center justify-between w-full mb-2">
              <span className="font-ui text-xs font-bold text-white">Digital Access Pass</span>
              <span className="font-data text-[10px] text-[#38BDF8]">Live Rolling OTP</span>
            </div>

            <div
              onClick={() => setQrModalOpen(true)}
              className="w-44 h-44 bg-white rounded-2xl p-3 my-2 shadow-[0_0_35px_rgba(59,130,246,0.4)] cursor-pointer hover:scale-105 transition-transform"
              title="Click to enlarge"
            >
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <rect x="4" y="4" width="24" height="24" fill="none" stroke="#000" strokeWidth="6.5" rx="3" />
                <rect x="12" y="12" width="8" height="8" fill="#000" rx="1.5" />
                <rect x="72" y="4" width="24" height="24" fill="none" stroke="#000" strokeWidth="6.5" rx="3" />
                <rect x="80" y="12" width="8" height="8" fill="#000" rx="1.5" />
                <rect x="4" y="72" width="24" height="24" fill="none" stroke="#000" strokeWidth="6.5" rx="3" />
                <rect x="12" y="80" width="8" height="8" fill="#000" rx="1.5" />
                <g fill="#000">
                  <rect x="36" y="6" width="5" height="5" /><rect x="46" y="6" width="5" height="5" />
                  <rect x="36" y="16" width="5" height="5" /><rect x="51" y="16" width="5" height="5" />
                  <rect x="41" y="21" width="5" height="5" /><rect x="56" y="21" width="5" height="5" />
                  <rect x="6" y="36" width="5" height="5" /><rect x="16" y="36" width="5" height="5" />
                  <rect x="36" y="36" width="5" height="5" /><rect x="46" y="41" width="5" height="5" />
                  <rect x="71" y="36" width="5" height="5" /><rect x="81" y="41" width="5" height="5" />
                  <rect x="36" y="56" width="5" height="5" /><rect x="46" y="61" width="5" height="5" />
                  <rect x="36" y="71" width="5" height="5" /><rect x="46" y="76" width="5" height="5" />
                </g>
              </svg>
            </div>

            <p className="font-display font-semibold text-base text-white mt-1">{userFullName}</p>
            <p className="font-data text-[10px] text-[var(--ink-3)]">DNA-0412 · PREMIUM ANNUAL</p>
            <div className="member-qrtimer mt-3 text-xs">
              <i />
              <span>Rotates every 30s</span>
            </div>
          </div>

          {/* Membership Plan Card */}
          <div className="member-card">
            <div className="member-mem-top">
              <b>Premium Annual</b>
              <span className="member-pill member-p-ok">ACTIVE</span>
            </div>
            <div className="member-bar">
              <i style={{ width: '71%' }} />
            </div>
            <div className="member-meta2">
              <span>47 days left</span>
              <span>6 of 12 PT sessions</span>
            </div>
          </div>

          {/* Streak Card */}
          <div className="member-card">
            <div className="member-sec mb-2">
              <h3>Workout streak</h3>
              <span className="text-xs text-[#38BDF8] font-bold">12 days</span>
            </div>
            <div className="member-streak-bar">
              <i className="on" />
              <i className="on" />
              <i />
              <i className="on" />
              <i className="on" />
              <i className="on" />
              <i className="now" />
            </div>
          </div>
        </div>
      </div>

      {/* Check-in QR Modal */}
      <MemberQrModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
      />
    </div>
  )
}
