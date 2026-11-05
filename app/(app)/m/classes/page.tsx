'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Calendar, AlertCircle } from 'lucide-react'
import { toast } from '@/components/app/ui/toast'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { resolveMember } from '@/lib/memberportal'
import {
  getSessions,
  bookClassSession,
  cancelClassBooking,
  isBookingWindowOpen,
} from '@/lib/classes'
import type { ClassSession } from '@/types/class'
import {
  toLocalDateStr,
  localDateOffset,
  parseLocalDate,
  formatTime12h,
  sessionStartDate,
} from '@/lib/dates'

interface DayOption {
  dateStr: string
  name: string
  num: string
  isToday: boolean
}

export default function MemberClassesPage() {
  const { user } = useAuth()
  const member = useMemo(() => resolveMember(user?.id || user?.name), [user?.id, user?.name])

  // Rolling 7 days starting from today (in device local timezone)
  const days: DayOption[] = useMemo(() => {
    const list: DayOption[] = []
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    for (let i = 0; i < 7; i++) {
      const dateStr = localDateOffset(i)
      const d = parseLocalDate(dateStr)
      list.push({
        dateStr,
        name: i === 0 ? 'Today' : dayNames[d.getDay()],
        num: String(d.getDate()),
        isToday: i === 0,
      })
    }
    return list
  }, [])

  const [selectedDayIndex, setSelectedDayIndex] = useState(0)
  const selectedDateStr = days[selectedDayIndex]?.dateStr || toLocalDateStr()

  const [sessions, setSessions] = useState<ClassSession[]>([])
  const [weekBookedDates, setWeekBookedDates] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  // Clean up legacy dummy storage key from previous iterations
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('dna360_member_classes')
      } catch {}
    }
  }, [])

  const reloadSessions = useCallback(async () => {
    // 1. Instant local render
    const daySessions = getSessions({ date: selectedDateStr })
    setSessions(daySessions)

    // 2. Fetch authoritative state from central Supabase database across the 7-day rolling window
    if (typeof window !== 'undefined') {
      try {
        const startStr = days[0]?.dateStr || selectedDateStr
        const endStr = days[days.length - 1]?.dateStr || selectedDateStr
        const res = await fetch(
          `/api/classes?startDate=${startStr}&endDate=${endStr}&memberId=${member?.id || ''}`
        )
        if (res.ok) {
          const data = await res.json()
          if (data.sessions && Array.isArray(data.sessions)) {
            const allWeek: ClassSession[] = data.sessions
            setSessions(allWeek.filter((s) => s.date === selectedDateStr))

            if (member) {
              const bDates = new Set<string>()
              for (const s of allWeek) {
                if (
                  s.bookings?.some(
                    (b) =>
                      b.memberId === member.id &&
                      (b.status === 'confirmed' || b.status === 'waitlisted')
                  )
                ) {
                  bDates.add(s.date)
                }
              }
              setWeekBookedDates(Array.from(bDates))
            }
          }
        }
      } catch {
        // Fallback to local state if offline
      }
    }
  }, [selectedDateStr, member, days])

  useEffect(() => {
    reloadSessions()
    const handleUpdate = () => reloadSessions()
    window.addEventListener('dna360_sessions_updated', handleUpdate)
    window.addEventListener('storage', handleUpdate)
    return () => {
      window.removeEventListener('dna360_sessions_updated', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [reloadSessions])

  // Days with at least one active confirmed/waitlisted booking for the logged-in member
  const daysWithBookings = useMemo(() => {
    const bookedDates = new Set<string>(weekBookedDates)
    if (!member) return bookedDates
    const allSessions = getSessions()
    for (const s of allSessions) {
      if (
        s.bookings.some(
          (b) =>
            b.memberId === member.id &&
            (b.status === 'confirmed' || b.status === 'waitlisted')
        )
      ) {
        bookedDates.add(s.date)
      }
    }
    return bookedDates
  }, [member, sessions, weekBookedDates])

  const handleBook = async (session: ClassSession) => {
    if (!member) {
      toast.error('Please log in as a member to book a class.')
      return
    }

    setLoading(true)
    // 1. Local cache update
    const localRes = bookClassSession({
      sessionId: session.id,
      memberId: member.id,
      source: 'member',
    })

    // 2. Authoritative sync to Supabase central database
    let dbResData: any = null
    try {
      const apiRes = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          memberId: member.id,
        }),
      })
      dbResData = await apiRes.json()
      if (!apiRes.ok && !localRes.success) {
        setLoading(false)
        toast.error('Booking failed', {
          description: dbResData?.error || localRes.error || 'Unable to book session.',
        })
        return
      }
    } catch {
      if (!localRes.success) {
        setLoading(false)
        toast.error('Booking failed', { description: localRes.error || 'Unable to book session.' })
        return
      }
    }

    setLoading(false)
    const isWaitlisted = dbResData?.isWaitlisted ?? localRes.isWaitlisted
    const waitPos = dbResData?.booking?.waitlistPosition ?? localRes.booking?.waitlistPosition ?? 1

    if (isWaitlisted) {
      toast.info(`Added to waitlist for ${session.title}`, {
        description: `Position #${waitPos}. You'll be auto-promoted if a spot opens up.`,
      })
    } else {
      toast.success(`Booked ${session.title}!`, {
        description: `${formatTime12h(session.startTime)} · ${session.studioName}`,
      })
    }
    reloadSessions()
  }

  const handleCancel = async (session: ClassSession, bookingId: string) => {
    if (!member) return
    setLoading(true)
    const localRes = cancelClassBooking({
      sessionId: session.id,
      bookingId,
      cancelledBy: { id: member.id, name: member.name, role: 'Member' },
    })

    // Central Supabase database cancellation sync
    try {
      const apiRes = await fetch('/api/classes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          memberId: member.id,
        }),
      })
      if (!apiRes.ok && !localRes.success) {
        const errData = await apiRes.json().catch(() => ({}))
        setLoading(false)
        toast.error('Cancellation failed', {
          description: errData?.error || localRes.error || 'Cannot cancel booking.',
        })
        return
      }
    } catch {
      if (!localRes.success) {
        setLoading(false)
        toast.error('Cancellation failed', { description: localRes.error || 'Cannot cancel booking.' })
        return
      }
    }

    setLoading(false)
    toast.info(`Cancelled booking for ${session.title}`)
    reloadSessions()
  }

  return (
    <div className="w-full max-w-5xl mx-auto pt-1 pb-28 px-4 select-none">
      {/* Header */}
      <div className="member-hdr flex items-center justify-between gap-3">
        <div>
          <p className="hi">Book a</p>
          <h1 className="nm text-2xl sm:text-3xl text-white">Class</h1>
        </div>
        <div className="member-icbtn shrink-0" title="Live Schedule">
          <Calendar className="w-[18px] h-[18px] stroke-current" />
        </div>
      </div>

      {/* Week Day Pill Selector (Live, Dynamic Dates) */}
      <div className="member-week max-w-md mx-auto sm:max-w-none">
        {days.map((d, idx) => (
          <div
            key={d.dateStr}
            onClick={() => setSelectedDayIndex(idx)}
            className={cn(
              'member-day',
              daysWithBookings.has(d.dateStr) && 'dot',
              selectedDayIndex === idx && 'sel'
            )}
          >
            <p className="dn">{d.name}</p>
            <p className="dd">{d.num}</p>
          </div>
        ))}
      </div>

      {/* Class Schedule Grid */}
      {sessions.length === 0 ? (
        <div className="p-8 my-6 text-center rounded-2xl bg-[#0E131F]/70 border border-white/[0.08] backdrop-blur-md max-w-md mx-auto">
          <p className="text-sm font-semibold text-white/90">No classes scheduled</p>
          <p className="text-xs text-[var(--ink-3)] mt-1">
            There are no studio classes scheduled for this date.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-2">
          {sessions.map((session) => {
            const capacity = session.capacity ?? 20
            const spotsLeft = Math.max(0, capacity - session.bookedCount)
            const isFull = session.bookedCount >= capacity
            const myBooking = member
              ? session.bookings.find(
                  (b) =>
                    b.memberId === member.id &&
                    (b.status === 'confirmed' || b.status === 'waitlisted')
                )
              : undefined

            const isBooked = myBooking?.status === 'confirmed'
            const isWaitlisted = myBooking?.status === 'waitlisted'

            const isPast =
              sessionStartDate(session.date, session.startTime).getTime() <= Date.now()
            const windowOpen = isBookingWindowOpen(session.date)

            return (
              <div
                key={session.id}
                className={cn(
                  'member-cls flex flex-col justify-between transition-all duration-200 min-w-0',
                  isBooked &&
                    'border-[rgba(77,141,255,0.45)] bg-[rgba(77,141,255,0.04)] shadow-[0_8px_24px_rgba(30,64,175,0.15)]',
                  isWaitlisted &&
                    'border-[rgba(251,191,36,0.45)] bg-[rgba(251,191,36,0.04)] shadow-[0_8px_24px_rgba(251,191,36,0.12)]'
                )}
              >
                <div className="member-cls-top flex items-start justify-between gap-3 min-w-0">
                  <div className="min-w-0 flex-1">
                    <p className="member-cls-t truncate">{session.title}</p>
                    <p className="member-cls-s truncate">
                      {session.instructorName} · {session.studioName} · {session.durationMinutes} min
                    </p>
                  </div>
                  <span className="member-cls-time shrink-0">
                    {formatTime12h(session.startTime)}
                  </span>
                </div>

                <div className="member-cls-bot flex items-center justify-between gap-3 min-w-0">
                  <div className="min-w-0 flex-1">
                    {isBooked ? (
                      <span className="member-pill member-p-blue shrink-0">BOOKED</span>
                    ) : isWaitlisted ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        WAITLIST #{myBooking.waitlistPosition ?? 1}
                      </span>
                    ) : isPast ? (
                      <span className="member-spots text-[var(--ink-3)] truncate block">
                        Class ended
                      </span>
                    ) : !windowOpen ? (
                      <span className="member-spots text-cyan-400/80 truncate block">
                        Booking opens 1 day prior
                      </span>
                    ) : !isFull ? (
                      <span className="member-spots truncate block">
                        {spotsLeft} of {capacity} spots left
                      </span>
                    ) : (
                      <span className="member-spots text-[#FBBF24] truncate block">
                        Full · {session.waitlistCount} on waitlist
                      </span>
                    )}
                  </div>

                  <div className="shrink-0">
                    {myBooking ? (
                      <button
                        onClick={() => handleCancel(session, myBooking.id)}
                        disabled={loading}
                        className="member-bk ghost"
                      >
                        Cancel
                      </button>
                    ) : isPast ? (
                      <button disabled className="member-bk opacity-40 cursor-not-allowed">
                        Closed
                      </button>
                    ) : !windowOpen ? (
                      <button disabled className="member-bk opacity-40 cursor-not-allowed">
                        Locked
                      </button>
                    ) : !isFull ? (
                      <button
                        onClick={() => handleBook(session)}
                        disabled={loading}
                        className="member-bk"
                      >
                        Book
                      </button>
                    ) : session.waitlistCount < (session.maxWaitlist ?? 5) ? (
                      <button
                        onClick={() => handleBook(session)}
                        disabled={loading}
                        className="member-bk full"
                      >
                        Join waitlist
                      </button>
                    ) : (
                      <button disabled className="member-bk full opacity-50 cursor-not-allowed">
                        Full
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
