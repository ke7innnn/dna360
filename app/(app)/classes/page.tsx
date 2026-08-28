'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Calendar as CalendarIcon, Clock, Users, Plus,
  ChevronLeft, ChevronRight, Grid, List, Sparkles,
  CheckCircle, AlertTriangle, Layers,
} from 'lucide-react'
import { Button } from '@/components/app/ui/button'
import { Badge } from '@/components/app/ui/badge'
import { StrandMeter } from '@/components/app/ui/StrandMeter'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/app/ui/select'
import ClassRosterDrawer from '@/components/app/classes/ClassRosterDrawer'
import CreateClassModal from '@/components/app/classes/CreateClassModal'
import BookClassModal from '@/components/app/classes/BookClassModal'
import { getSessions, getStoredStudios } from '@/lib/classes'
import type { ClassSession, StudioRoom } from '@/types/class'
import { cn } from '@/lib/utils'

export default function ClassesPage() {
  const [sessions, setSessions] = useState<ClassSession[]>([])
  const [studios, setStudios] = useState<StudioRoom[]>([])
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [studioFilter, setStudioFilter] = useState('all')

  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null)
  const [rosterDrawerOpen, setRosterDrawerOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [bookModalOpen, setBookModalOpen] = useState(false)
  const [bookModalSession, setBookModalSession] = useState<ClassSession | null>(null)

  const refreshClasses = () => {
    const list = getSessions({
      category: categoryFilter,
    })
    setSessions(list)
    setStudios(getStoredStudios())
  }

  useEffect(() => {
    refreshClasses()
    const handleUpdate = () => refreshClasses()
    window.addEventListener('dna360_classes_updated', handleUpdate)
    return () => window.removeEventListener('dna360_classes_updated', handleUpdate)
  }, [categoryFilter])

  // Week Grid Days: Mon (1) to Sun (0/7)
  const weekDays = [
    { dayIndex: 1, name: 'Mon', fullName: 'Monday', pattern: 'MWF Studio Batches' },
    { dayIndex: 2, name: 'Tue', fullName: 'Tuesday', pattern: 'TThS Studio Batches' },
    { dayIndex: 3, name: 'Wed', fullName: 'Wednesday', pattern: 'MWF Studio Batches' },
    { dayIndex: 4, name: 'Thu', fullName: 'Thursday', pattern: 'TThS Studio Batches' },
    { dayIndex: 5, name: 'Fri', fullName: 'Friday', pattern: 'MWF Studio Batches' },
    { dayIndex: 6, name: 'Sat', fullName: 'Saturday', pattern: 'TThS Studio Batches' },
    { dayIndex: 0, name: 'Sun', fullName: 'Sunday', pattern: 'Weekend Workshops' },
  ]

  // Time Slots (07:00 to 20:00)
  const timeSlots = [
    '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '16:00', '17:00', '18:00', '19:00', '20:00',
  ]

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <span className="font-ui text-[11px] uppercase tracking-[0.06em] font-semibold text-[var(--text-faint)]">
            Studio Timetable & Reformer Matrix
          </span>
          <h1 className="font-display text-[28px] sm:text-[30px] leading-[34px] font-semibold text-[var(--text)] tracking-[-0.02em] mt-0.5">
            Classes & Timetable
          </h1>
          <p className="font-ui text-xs text-[var(--text-muted)] mt-1">
            Reformer Pilates MWF vs TThSat Batches · Group Activity Studios · 1-day advance booking window
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Schedule Class Slot
          </Button>
        </div>
      </div>

      {/* 2. Studio Filter Tabs */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 select-none">
          <button
            onClick={() => setCategoryFilter('all')}
            className={cn(
              'h-[30px] px-3 font-ui text-xs font-medium rounded-full cursor-pointer transition-colors whitespace-nowrap',
              categoryFilter === 'all'
                ? 'bg-[var(--surface-raised)] border border-[var(--line-strong)] text-[var(--text)]'
                : 'bg-[var(--surface-sunken)] border border-[var(--line)] text-[var(--text-muted)] hover:text-[var(--text)]'
            )}
          >
            All Disciplines
          </button>
          <button
            onClick={() => setCategoryFilter('reformer_pilates')}
            className={cn(
              'h-[30px] px-3 font-ui text-xs font-medium rounded-full cursor-pointer transition-colors whitespace-nowrap',
              categoryFilter === 'reformer_pilates'
                ? 'bg-[var(--surface-raised)] border border-[var(--line-strong)] text-[var(--teal)] font-semibold'
                : 'bg-[var(--surface-sunken)] border border-[var(--line)] text-[var(--text-muted)] hover:text-[var(--text)]'
            )}
          >
            Reformer Pilates Studio
          </button>
          <button
            onClick={() => setCategoryFilter('mat_pilates')}
            className={cn(
              'h-[30px] px-3 font-ui text-xs font-medium rounded-full cursor-pointer transition-colors whitespace-nowrap',
              categoryFilter === 'mat_pilates'
                ? 'bg-[var(--surface-raised)] border border-[var(--line-strong)] text-[var(--text)]'
                : 'bg-[var(--surface-sunken)] border border-[var(--line)] text-[var(--text-muted)] hover:text-[var(--text)]'
            )}
          >
            Mat Pilates
          </button>
          <button
            onClick={() => setCategoryFilter('yoga')}
            className={cn(
              'h-[30px] px-3 font-ui text-xs font-medium rounded-full cursor-pointer transition-colors whitespace-nowrap',
              categoryFilter === 'yoga'
                ? 'bg-[var(--surface-raised)] border border-[var(--line-strong)] text-[var(--text)]'
                : 'bg-[var(--surface-sunken)] border border-[var(--line)] text-[var(--text-muted)] hover:text-[var(--text)]'
            )}
          >
            Yoga Studio
          </button>
          <button
            onClick={() => setCategoryFilter('spinning')}
            className={cn(
              'h-[30px] px-3 font-ui text-xs font-medium rounded-full cursor-pointer transition-colors whitespace-nowrap',
              categoryFilter === 'spinning'
                ? 'bg-[var(--surface-raised)] border border-[var(--line-strong)] text-[var(--text)]'
                : 'bg-[var(--surface-sunken)] border border-[var(--line)] text-[var(--text-muted)] hover:text-[var(--text)]'
            )}
          >
            Spinning
          </button>
        </div>

        <div className="flex items-center gap-2 font-ui text-xs text-[var(--text-faint)] select-none">
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[var(--teal)]" />
            <span>Open Spots</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[var(--danger)]" />
            <span>Full / Waitlist</span>
          </span>
        </div>
      </div>

      {/* 3. Full Week Timetable Grid */}
      <div className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-md)] overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.045)]">
        <div className="overflow-x-auto">
          <div className="min-w-[960px]">
            {/* Week Header Row */}
            <div className="grid grid-cols-8 bg-[var(--surface-sunken)] border-b border-[var(--line)] select-none">
              <div className="p-3 font-ui text-[11px] uppercase tracking-[0.06em] font-semibold text-[var(--text-faint)] text-center border-r border-[var(--line)] flex items-center justify-center">
                Time Slot
              </div>
              {weekDays.map((d) => (
                <div
                  key={d.dayIndex}
                  className="p-2.5 text-center border-r border-[var(--line)] last:border-r-0"
                >
                  <div className="font-ui text-xs font-semibold text-[var(--text)]">
                    {d.fullName}
                  </div>
                  <div className="font-ui text-[10px] text-[var(--text-faint)] mt-0.5 uppercase tracking-wider truncate">
                    {d.pattern}
                  </div>
                </div>
              ))}
            </div>

            {/* Time Slot Rows */}
            <div className="divide-y divide-[var(--line)]">
              {timeSlots.map((time) => (
                <div key={time} className="grid grid-cols-8 min-h-[64px]">
                  {/* Time Column */}
                  <div className="p-2.5 font-data text-xs font-medium text-[var(--text-faint)] bg-[var(--surface-sunken)]/60 border-r border-[var(--line)] flex items-start justify-center tabular-nums select-none pt-3">
                    {time}
                  </div>

                  {/* 7 Days Columns */}
                  {weekDays.map((d) => {
                    // Match sessions for this day & start time
                    const match = sessions.find(
                      (s) => s.dayOfWeek === d.dayIndex && s.startTime?.startsWith(time)
                    )

                    const isFull = match ? match.bookedCount >= (match.capacity || 8) : false

                    return (
                      <div
                        key={d.dayIndex}
                        className={cn(
                          'p-2 border-r border-[var(--line)] last:border-r-0 transition-colors duration-140 flex flex-col justify-between',
                          match ? 'hover:bg-[var(--surface-raised)] cursor-pointer' : 'bg-transparent',
                          isFull && match && 'bg-[rgba(222,90,82,0.06)]'
                        )}
                        onClick={() => {
                          if (match) {
                            setSelectedSession(match)
                            setRosterDrawerOpen(true)
                          }
                        }}
                      >
                        {match ? (
                          <div className="flex flex-col h-full justify-between">
                            <div>
                              <span className="font-ui text-xs font-semibold text-[var(--text)] line-clamp-1 leading-tight">
                                {match.title}
                              </span>
                              <span className="font-ui text-[11px] text-[var(--text-faint)] block mt-0.5 line-clamp-1">
                                {match.instructorName}
                              </span>
                            </div>

                            {/* Capacity Strand */}
                            <div className="flex items-center justify-between gap-1 pt-1.5 mt-auto">
                              <StrandMeter
                                value={match.bookedCount}
                                max={match.capacity || 8}
                                capsules={5}
                                size="sm"
                              />
                              <span className={cn(
                                'font-data text-[10px] tabular-nums font-semibold',
                                isFull ? 'text-[var(--danger)]' : 'text-[var(--text-muted)]'
                              )}>
                                {match.bookedCount}/{match.capacity || 8}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <span className="font-ui text-[10px] text-[var(--text-faint)]">
                              —
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Roster Drawer */}
      <ClassRosterDrawer
        session={selectedSession}
        open={rosterDrawerOpen}
        onOpenChange={(op) => {
          setRosterDrawerOpen(op)
          if (!op) setSelectedSession(null)
        }}
        onOpenBookModal={(sess) => {
          setBookModalSession(sess)
          setBookModalOpen(true)
        }}
        onSessionUpdated={() => refreshClasses()}
      />

      {/* 5. Book Member Modal */}
      <BookClassModal
        session={bookModalSession}
        open={bookModalOpen}
        onOpenChange={(op) => {
          setBookModalOpen(op)
          if (!op) setBookModalSession(null)
        }}
        onBookingCreated={() => {
          refreshClasses()
          if (selectedSession) {
            const updated = getSessions({}).find((s) => s.id === selectedSession.id)
            if (updated) setSelectedSession(updated)
          }
        }}
      />

      {/* 6. Create Class Slot Modal */}
      <CreateClassModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSessionCreated={() => refreshClasses()}
      />
    </div>
  )
}
