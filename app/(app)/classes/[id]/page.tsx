'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ArrowLeft, Calendar, Clock, MapPin, Dumbbell,
  Users, CheckCircle, XCircle, Printer,
  UserPlus, Sparkles, AlertTriangle,
} from 'lucide-react'
import GlassCard from '@/components/app/ui/glass-card'
import StatCard from '@/components/app/ui/stat-card'
import { Button } from '@/components/app/ui/button'
import { StatusPill } from '@/components/app/ui/badge'
import BookClassModal from '@/components/app/classes/BookClassModal'
import { getSessionById, markAttendance, cancelBooking } from '@/lib/classes'
import { getInitials } from '@/lib/utils'
import type { ClassSession, BookingStatus } from '@/types/class'
import { toast } from '@/components/app/ui/toast'
import { cn } from '@/lib/utils'

export default function ClassDetailPage() {
  const params = useParams()
  const sessionId = params?.id as string

  const [session, setSession] = useState<ClassSession | null>(() => {
    if (typeof sessionId === 'string') {
      return getSessionById(sessionId)
    }
    return null
  })

  const [bookModalOpen, setBookModalOpen] = useState(false)

  const reloadSession = () => {
    if (sessionId) {
      setSession(getSessionById(sessionId))
    }
  }

  useEffect(() => {
    reloadSession()
  }, [sessionId])

  if (!session) {
    return (
      <div className="space-y-4 max-w-4xl py-12 text-center">
        <h2 className="font-display text-xl font-semibold text-[var(--app-text-primary)]">
          Class Session Not Found
        </h2>
        <p className="text-xs text-[var(--app-text-muted)]">
          The requested group class session does not exist or has been cancelled.
        </p>
        <Link href="/classes">
          <Button variant="secondary" icon={<ArrowLeft className="w-4 h-4" />}>
            Back to Timetable
          </Button>
        </Link>
      </div>
    )
  }

  const capacity = session.capacity || 8
  const occupancyPct = Math.round((session.bookedCount / capacity) * 100)
  const isFull = session.bookedCount >= capacity

  const statusMap: Record<BookingStatus, { status: 'success' | 'warning' | 'danger' | 'info' | 'neutral'; label: string }> = {
    confirmed: { status: 'success', label: 'Confirmed' },
    attended: { status: 'info', label: 'Attended' },
    no_show: { status: 'danger', label: 'No-Show' },
    cancelled: { status: 'neutral', label: 'Cancelled' },
    waitlisted: { status: 'warning', label: 'Waitlisted' },
  }

  const handleMarkAttendance = (bookingId: string, status: 'attended' | 'no_show') => {
    markAttendance(session.id, bookingId, status)
    toast.success(`Marked as ${status === 'attended' ? 'Attended' : 'No-Show'}`)
    reloadSession()
  }

  const handleCancelBooking = (bookingId: string) => {
    cancelBooking(session.id, bookingId)
    toast.success('Booking cancelled')
    reloadSession()
  }

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/classes"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--app-text-muted)] hover:text-[var(--app-text-secondary)] transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Class Schedule
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--app-text-primary)] tracking-tight">
              {session.title}
            </h1>
            <span className="text-xs uppercase font-bold px-2 py-0.5 rounded bg-[var(--aurora-1)]/10 text-[var(--aurora-1)] border border-[var(--aurora-1)]/20">
              {session.category}
            </span>
          </div>
          <p className="text-xs text-[var(--app-text-muted)] mt-1">
            {session.date} · {session.startTime} - {session.endTime} ({session.durationMinutes}m) · {session.studioName} (Powai Flagship)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.print()}
            icon={<Printer className="w-3.5 h-3.5" />}
          >
            Print Roster
          </Button>
          <Button
            variant="primary"
            onClick={() => setBookModalOpen(true)}
            icon={<UserPlus className="w-4 h-4" />}
          >
            Book Member
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Confirmed Attendees"
          value={session.bookedCount}
          suffix={` / ${capacity}`}
          icon={<Users className="w-5 h-5 text-[var(--aurora-1)]" />}
        />
        <StatCard
          label="Studio Occupancy"
          value={occupancyPct}
          suffix="%"
          icon={<CheckCircle className="w-5 h-5 text-[var(--app-success)]" />}
        />
        <StatCard
          label="Waitlist Queue"
          value={session.waitlistCount}
          suffix=" members"
          icon={<Sparkles className="w-5 h-5 text-[var(--app-warning)]" />}
        />
        <StatCard
          label="Lead Instructor"
          value={session.instructorName}
          icon={<Dumbbell className="w-5 h-5 text-[var(--app-info)]" />}
        />
      </div>

      {/* Attendees Roster Card */}
      <GlassCard padding="lg" className="space-y-6">
        <div className="flex items-center justify-between border-b border-[var(--app-glass-border)] pb-4">
          <div>
            <h3 className="font-display text-base font-semibold text-[var(--app-text-primary)]">
              Class Attendance Sheet
            </h3>
            <p className="text-xs text-[var(--app-text-muted)] mt-0.5">
              1-click check-in for registered members and turnstile verification.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--app-glass-border)] text-[0.6875rem] uppercase tracking-wider text-[var(--app-text-muted)]">
                <th className="py-3 px-2">Member</th>
                <th className="py-3 px-2">Contact</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-2 text-right">Attendance Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--app-glass-border)]">
              {session.bookings.map((booking) => {
                const s = statusMap[booking.status] || { status: 'neutral', label: booking.status }
                return (
                  <tr key={booking.id}>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--aurora-1)] to-[var(--aurora-2)] flex items-center justify-center text-white font-bold text-xs">
                          {getInitials(booking.memberName)}
                        </div>
                        <div>
                          <p className="font-semibold text-[var(--app-text-primary)]">{booking.memberName}</p>
                          <span className="font-mono text-[0.6875rem] text-[var(--app-text-muted)]">{booking.memberCode}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 font-mono text-[var(--app-text-secondary)]">
                      {booking.memberPhone}
                    </td>
                    <td className="py-3 px-2">
                      <StatusPill status={s.status} dot>
                        {s.label}
                      </StatusPill>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {booking.status !== 'attended' && (
                          <button
                            type="button"
                            onClick={() => handleMarkAttendance(booking.id, 'attended')}
                            className="px-2.5 py-1 rounded-lg text-[0.6875rem] font-medium bg-[var(--app-success)]/10 text-[var(--app-success)] hover:bg-[var(--app-success)]/20 transition-colors"
                          >
                            Mark Attended
                          </button>
                        )}
                        {booking.status !== 'no_show' && (
                          <button
                            type="button"
                            onClick={() => handleMarkAttendance(booking.id, 'no_show')}
                            className="px-2.5 py-1 rounded-lg text-[0.6875rem] font-medium bg-[var(--app-danger)]/10 text-[var(--app-danger)] hover:bg-[var(--app-danger)]/20 transition-colors"
                          >
                            No-Show
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleCancelBooking(booking.id)}
                          className="px-2 py-1 rounded-lg text-[0.6875rem] text-[var(--app-text-muted)] hover:text-[var(--app-danger)]"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Member Booking Modal */}
      <BookClassModal
        session={session}
        open={bookModalOpen}
        onOpenChange={setBookModalOpen}
        onBookingCreated={reloadSession}
      />
    </div>
  )
}
