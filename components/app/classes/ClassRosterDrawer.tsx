'use client'

import React, { useState } from 'react'
import {
  Users, Calendar, Clock, MapPin, Dumbbell,
  Flame, CheckCircle, XCircle, UserPlus, AlertTriangle,
  RotateCcw, Sparkles, User,
} from 'lucide-react'
import { Drawer } from '@/components/app/ui/drawer'
import { Button } from '@/components/app/ui/button'
import { StatusPill } from '@/components/app/ui/badge'
import { markAttendance, cancelBooking } from '@/lib/classes'
import { formatDateTime, getInitials } from '@/lib/utils'
import type { ClassSession, ClassBooking, BookingStatus } from '@/types/class'
import { toast } from '@/components/app/ui/toast'
import { cn } from '@/lib/utils'

export default function ClassRosterDrawer({
  session,
  open,
  onOpenChange,
  onSessionUpdated,
  onOpenBookModal,
  onBookMember,
}: {
  session: ClassSession | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSessionUpdated?: () => void
  onOpenBookModal?: (session: ClassSession) => void
  onBookMember?: (session: ClassSession) => void
}) {
  if (!session) return null

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

  const confirmedBookings = session.bookings.filter((b) => b.status !== 'waitlisted' && b.status !== 'cancelled')
  const waitlistedBookings = session.bookings.filter((b) => b.status === 'waitlisted')

  const handleMarkAttendance = (bookingId: string, status: 'attended' | 'no_show') => {
    markAttendance(session.id, bookingId, status)
    toast.success(`Marked as ${status === 'attended' ? 'Attended' : 'No-Show'}`)
    if (onSessionUpdated) onSessionUpdated()
  }

  const handleCancelBooking = (bookingId: string) => {
    cancelBooking(session.id, bookingId)
    toast.success('Booking cancelled and spot released')
    if (onSessionUpdated) onSessionUpdated()
  }

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={session.title}
      description={`${session.date} · ${session.startTime} - ${session.endTime} · ${session.studioName}`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Class Overview Banner */}
        <div className="p-4 rounded-2xl glass-card border border-[var(--aurora-1)]/20 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[0.625rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--aurora-1)]/10 text-[var(--aurora-1)] border border-[var(--aurora-1)]/20">
                {session.category.toUpperCase()}
              </span>
              <span className="text-[0.625rem] font-semibold px-2 py-0.5 rounded bg-[var(--app-glass-bg)] border border-[var(--app-glass-border)] text-[var(--app-text-secondary)]">
                Intensity: {session.intensity}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[var(--app-warning)] font-semibold">
              <Flame className="w-4 h-4" />
              <span>~{session.caloriesEstimate ?? 450} kcal</span>
            </div>
          </div>

          <p className="text-xs text-[var(--app-text-secondary)] leading-relaxed">
            {session.description}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-[var(--app-glass-border)] text-xs">
            <div>
              <span className="text-[var(--app-text-muted)] block text-[0.6875rem]">Lead Coach</span>
              <span className="font-semibold text-[var(--app-text-primary)]">{session.instructorName}</span>
            </div>
            <div>
              <span className="text-[var(--app-text-muted)] block text-[0.6875rem]">Studio Room</span>
              <span className="text-[var(--app-text-secondary)]">{session.studioName}</span>
            </div>
            <div>
              <span className="text-[var(--app-text-muted)] block text-[0.6875rem]">Duration</span>
              <span className="font-mono text-[var(--app-text-primary)]">{session.durationMinutes} mins</span>
            </div>
          </div>
        </div>

        {/* Occupancy Bar */}
        <div className="p-4 rounded-xl glass-input space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[var(--app-text-primary)]">
              Studio Capacity & Occupancy
            </span>
            <span className={cn('font-mono font-bold', isFull ? 'text-[var(--app-danger)]' : 'text-[var(--app-success)]')}>
              {session.bookedCount} / {capacity} spots ({occupancyPct}%)
            </span>
          </div>

          {/* Progress track */}
          <div className="w-full h-2 rounded-full bg-[var(--app-glass-bg)] overflow-hidden border border-[var(--app-glass-border)]">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                occupancyPct >= 100
                  ? 'bg-[var(--app-danger)]'
                  : occupancyPct >= 80
                  ? 'bg-[var(--app-warning)]'
                  : 'bg-gradient-to-r from-[var(--aurora-1)] to-[var(--aurora-2)]'
              )}
              style={{ width: `${Math.min(occupancyPct, 100)}%` }}
            />
          </div>

          {session.waitlistCount > 0 && (
            <p className="text-[0.6875rem] text-[var(--app-warning)] font-medium pt-1">
              ⚠️ {session.waitlistCount} members waiting in queue. Auto-promotion active on cancellation.
            </p>
          )}
        </div>

        {/* Attendees Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-[var(--app-text-primary)] flex items-center gap-2">
              <Users className="w-4 h-4 text-[var(--aurora-1)]" />
              <span>Confirmed Attendees ({confirmedBookings.length})</span>
            </h3>

            {onOpenBookModal && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onOpenBookModal(session)}
                icon={<UserPlus className="w-3.5 h-3.5" />}
              >
                Book Member
              </Button>
            )}
          </div>

          {confirmedBookings.length > 0 ? (
            <div className="space-y-2">
              {confirmedBookings.map((booking) => {
                const s = statusMap[booking.status] || { status: 'neutral', label: booking.status }
                return (
                  <div
                    key={booking.id}
                    className="p-3 rounded-xl glass-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--aurora-1)] to-[var(--aurora-2)] flex items-center justify-center text-white font-semibold text-xs shrink-0">
                        {getInitials(booking.memberName)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-[var(--app-text-primary)]">{booking.memberName}</p>
                          <StatusPill status={s.status}>{s.label}</StatusPill>
                        </div>
                        <p className="text-[0.6875rem] font-mono text-[var(--app-text-muted)]">
                          {booking.memberCode} · {booking.memberPhone}
                        </p>
                      </div>
                    </div>

                    {/* Attendance Marking Buttons */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      {booking.status !== 'attended' && (
                        <button
                          type="button"
                          onClick={() => handleMarkAttendance(booking.id, 'attended')}
                          className="px-2 py-1 rounded-lg text-[0.6875rem] font-medium bg-[var(--app-success)]/10 text-[var(--app-success)] hover:bg-[var(--app-success)]/20 transition-colors"
                        >
                          Mark Attended
                        </button>
                      )}
                      {booking.status !== 'no_show' && (
                        <button
                          type="button"
                          onClick={() => handleMarkAttendance(booking.id, 'no_show')}
                          className="px-2 py-1 rounded-lg text-[0.6875rem] font-medium bg-[var(--app-danger)]/10 text-[var(--app-danger)] hover:bg-[var(--app-danger)]/20 transition-colors"
                        >
                          No-Show
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleCancelBooking(booking.id)}
                        className="px-2 py-1 rounded-lg text-[0.6875rem] text-[var(--app-text-muted)] hover:text-[var(--app-danger)] transition-colors"
                        title="Cancel Booking"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-[var(--app-text-muted)] text-center py-4 glass-input rounded-xl">
              No confirmed bookings yet for this class session.
            </p>
          )}
        </div>

        {/* Waitlist Section */}
        {waitlistedBookings.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-[var(--app-glass-border)]">
            <h3 className="font-display text-sm font-semibold text-[var(--app-warning)] flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Waitlist Queue ({waitlistedBookings.length})</span>
            </h3>

            <div className="space-y-2">
              {waitlistedBookings.map((wb) => (
                <div
                  key={wb.id}
                  className="p-3 rounded-xl glass-input flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[var(--app-warning)]/20 text-[var(--app-warning)] font-mono font-bold flex items-center justify-center text-[0.6875rem]">
                      #{wb.waitlistPosition}
                    </span>
                    <div>
                      <p className="font-semibold text-[var(--app-text-primary)]">{wb.memberName}</p>
                      <p className="text-[0.6875rem] font-mono text-[var(--app-text-muted)]">{wb.memberPhone}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCancelBooking(wb.id)}
                    className="text-[0.6875rem] text-[var(--app-text-muted)] hover:text-[var(--app-danger)] transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Drawer>
  )
}
