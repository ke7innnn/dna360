'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Calendar as CalendarIcon, Clock, Users, Plus,
  ChevronLeft, ChevronRight, Grid, List, Sparkles,
  CheckCircle, AlertTriangle, Layers, Search, Filter,
  Flame, Dumbbell, MapPin, User, ArrowRight,
} from 'lucide-react'
import Button from '@/components/app/ui/button'
import Badge from '@/components/app/ui/badge'
import StrandMeter from '@/components/app/ui/StrandMeter'
import Card from '@/components/app/ui/glass-card'
import PageHeader from '@/components/app/ui/PageHeader'
import ClassRosterDrawer from '@/components/app/classes/ClassRosterDrawer'
import CreateClassModal from '@/components/app/classes/CreateClassModal'
import BookClassModal from '@/components/app/classes/BookClassModal'
import { getSessions, getStoredStudios } from '@/lib/classes'
import type { ClassSession, StudioRoom } from '@/types/class'
import { cn, getInitials } from '@/lib/utils'

export default function ClassesPage() {
  const [sessions, setSessions] = useState<ClassSession[]>([])
  const [studios, setStudios] = useState<StudioRoom[]>([])
  
  // Navigation & Filter States
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'list'>('day')
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(1) // Monday by default
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [timeFilter, setTimeFilter] = useState<'all' | 'morning' | 'afternoon' | 'evening'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Modals & Drawers
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null)
  const [rosterDrawerOpen, setRosterDrawerOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [bookModalOpen, setBookModalOpen] = useState(false)
  const [bookModalSession, setBookModalSession] = useState<ClassSession | null>(null)

  const refreshClasses = () => {
    const list = getSessions({
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
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

  // Week Days configuration
  const weekDays = [
    { dayIndex: 1, name: 'Mon', fullName: 'Monday', dateTag: '25 Aug', group: 'Group A (MWF)', desc: 'Reformer Core & Athletic Flow' },
    { dayIndex: 2, name: 'Tue', fullName: 'Tuesday', dateTag: '26 Aug', group: 'Group B (TThS)', desc: 'Reformer Sculpt & Jumpboard' },
    { dayIndex: 3, name: 'Wed', fullName: 'Wednesday', dateTag: '27 Aug', group: 'Group A (MWF)', desc: 'Reformer Posture & Balance' },
    { dayIndex: 4, name: 'Thu', fullName: 'Thursday', dateTag: '28 Aug', group: 'Group B (TThS)', desc: 'Reformer Athletic Conditioning' },
    { dayIndex: 5, name: 'Fri', fullName: 'Friday', dateTag: '29 Aug', group: 'Group A (MWF)', desc: 'Reformer Dynamic Strength' },
    { dayIndex: 6, name: 'Sat', fullName: 'Saturday', dateTag: '30 Aug', group: 'Group B (TThS)', desc: 'Weekend Intensity & Trials' },
    { dayIndex: 0, name: 'Sun', fullName: 'Sunday', dateTag: '31 Aug', group: 'Weekend All-Access', desc: 'Restorative & Workshops' },
  ]

  // Filter sessions based on all criteria
  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      // Day filter (only when in day view mode)
      if (viewMode === 'day' && session.dayOfWeek !== selectedDayIndex) {
        return false
      }

      // Time of day filter
      if (timeFilter !== 'all') {
        const hour = parseInt(session.startTime.split(':')[0], 10)
        if (timeFilter === 'morning' && (hour < 6 || hour >= 12)) return false
        if (timeFilter === 'afternoon' && (hour < 12 || hour >= 17)) return false
        if (timeFilter === 'evening' && hour < 17) return false
      }

      // Search query filter (title, instructor, studio)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesTitle = session.title.toLowerCase().includes(q)
        const matchesInstructor = session.instructorName.toLowerCase().includes(q)
        const matchesStudio = session.studioName.toLowerCase().includes(q)
        if (!matchesTitle && !matchesInstructor && !matchesStudio) return false
      }

      return true
    })
  }, [sessions, viewMode, selectedDayIndex, timeFilter, searchQuery])

  // Group filtered sessions by time period for Day View
  const groupedSessions = useMemo(() => {
    const morning: ClassSession[] = []
    const afternoon: ClassSession[] = []
    const evening: ClassSession[] = []

    filteredSessions.forEach((s) => {
      const hour = parseInt(s.startTime.split(':')[0], 10)
      if (hour < 12) {
        morning.push(s)
      } else if (hour < 17) {
        afternoon.push(s)
      } else {
        evening.push(s)
      }
    })

    return { morning, afternoon, evening }
  }, [filteredSessions])

  // High-level timetable KPIs
  const totalWeeklySlots = sessions.length
  const totalBooked = sessions.reduce((sum, s) => sum + (s.bookedCount || s.bookings?.length || 0), 0)
  const totalCapacity = sessions.reduce((sum, s) => sum + (s.capacity || 10), 0)
  const avgOccupancy = totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 85

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none">
      {/* 1. Page Header */}
      <PageHeader
        eyebrow="STUDIO & TIMETABLE · POWAI FLAGSHIP"
        title="Classes & Studio Timetable"
        description="Reformer Pilates MWF vs TThSat Batches · Group Activity Studios · 1-day advance booking window"
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={() => setCreateModalOpen(true)}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Schedule class slot
          </Button>
        }
      />

      {/* 2. Top Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-[var(--r-lg)] bg-[var(--surface)] border border-[var(--line)] shadow-sm flex flex-col justify-between min-h-[90px]">
          <span className="font-ui text-[10.5px] uppercase tracking-[0.12em] font-semibold text-[var(--muted)]">
            Weekly Sessions
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-display text-2xl sm:text-3xl font-semibold text-[var(--ink)] tabular-nums">
              {totalWeeklySlots}
            </span>
            <span className="font-ui text-xs text-[var(--muted)]">Scheduled</span>
          </div>
        </div>

        <div className="p-4 rounded-[var(--r-lg)] bg-[var(--surface)] border border-[var(--line)] shadow-sm flex flex-col justify-between min-h-[90px]">
          <span className="font-ui text-[10.5px] uppercase tracking-[0.12em] font-semibold text-[var(--muted)]">
            Avg Occupancy
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-display text-2xl sm:text-3xl font-semibold text-[var(--green)] tabular-nums">
              {avgOccupancy}%
            </span>
            <span className="font-ui text-xs text-[var(--green)] font-medium">Optimal</span>
          </div>
        </div>

        <div className="p-4 rounded-[var(--r-lg)] bg-[var(--surface)] border border-[var(--line)] shadow-sm flex flex-col justify-between min-h-[90px]">
          <span className="font-ui text-[10.5px] uppercase tracking-[0.12em] font-semibold text-[var(--muted)]">
            Reformer Pilates
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-ui text-base font-semibold text-[var(--ink)] truncate">
              Group A / B Batches
            </span>
          </div>
        </div>

        <div className="p-4 rounded-[var(--r-lg)] bg-[var(--surface)] border border-[var(--line)] shadow-sm flex flex-col justify-between min-h-[90px]">
          <span className="font-ui text-[10.5px] uppercase tracking-[0.12em] font-semibold text-[var(--muted)]">
            Active Studios
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-display text-2xl sm:text-3xl font-semibold text-[var(--ink)] tabular-nums">
              4
            </span>
            <span className="font-ui text-xs text-[var(--muted)]">Dedicated Zones</span>
          </div>
        </div>
      </div>

      {/* 3. Interactive Filter & View Controls */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Studio Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'All Studios' },
              { id: 'reformer_pilates', label: 'Reformer Pilates' },
              { id: 'yoga', label: 'Yoga Sanctuary' },
              { id: 'hiit_strength', label: 'HIIT & Functional' },
              { id: 'spinning', label: 'RPM Spin Studio' },
            ].map((cat) => {
              const isSelected = categoryFilter === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={cn(
                    'h-[32px] px-3.5 font-ui text-xs font-semibold rounded-full cursor-pointer transition-all duration-140 whitespace-nowrap shrink-0',
                    isSelected
                      ? 'bg-[var(--accent-soft)] border border-[rgba(59,130,246,0.35)] text-white shadow-glow-sm'
                      : 'bg-[var(--surface-2)] border border-[var(--line)] text-[var(--muted)] hover:text-white'
                  )}
                >
                  {cat.label}
                </button>
              )
            })}
          </div>

          {/* Right Controls: Search + Time of Day + View Switcher */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted)]" />
              <input
                type="text"
                placeholder="Search class or coach..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-3 font-ui text-xs rounded-full bg-[var(--surface-2)] border border-[var(--line)] text-[var(--ink)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] outline-none"
              />
            </div>

            {/* Time of Day Filter */}
            <div className="flex items-center rounded-full bg-[var(--surface-2)] border border-[var(--line)] p-0.5 shrink-0">
              {[
                { id: 'all', label: 'All' },
                { id: 'morning', label: 'AM' },
                { id: 'afternoon', label: 'Mid' },
                { id: 'evening', label: 'PM' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTimeFilter(t.id as any)}
                  className={cn(
                    'px-2.5 py-1 text-[11px] font-ui font-semibold rounded-full transition-all cursor-pointer',
                    timeFilter === t.id
                      ? 'bg-[var(--accent)] text-white shadow-sm'
                      : 'text-[var(--muted)] hover:text-white'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center rounded-full bg-[var(--surface-2)] border border-[var(--line)] p-0.5 shrink-0">
              <button
                onClick={() => setViewMode('day')}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-ui font-semibold transition-all flex items-center gap-1.5 cursor-pointer',
                  viewMode === 'day'
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'text-[var(--muted)] hover:text-white'
                )}
                title="Focused Day View"
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Day</span>
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-ui font-semibold transition-all flex items-center gap-1.5 cursor-pointer',
                  viewMode === 'week'
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'text-[var(--muted)] hover:text-white'
                )}
                title="Week Matrix Overview"
              >
                <Grid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Week</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-ui font-semibold transition-all flex items-center gap-1.5 cursor-pointer',
                  viewMode === 'list'
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'text-[var(--muted)] hover:text-white'
                )}
                title="Schedule List View"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">List</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4. Day Strip Ribbon (Always Visible for Quick Day Jumping) */}
        <div className="pt-2 border-t border-[var(--line)]">
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {weekDays.map((day) => {
              const isSelected = viewMode === 'day' && selectedDayIndex === day.dayIndex
              const daySessionCount = sessions.filter((s) => s.dayOfWeek === day.dayIndex).length

              return (
                <button
                  key={day.dayIndex}
                  onClick={() => {
                    setSelectedDayIndex(day.dayIndex)
                    if (viewMode !== 'day') setViewMode('day')
                  }}
                  className={cn(
                    'p-2.5 rounded-[var(--r-md)] border text-left transition-all duration-140 flex flex-col justify-between min-h-[72px] cursor-pointer group',
                    isSelected
                      ? 'bg-[var(--accent-soft)] border-[rgba(59,130,246,0.5)] shadow-[0_0_16px_rgba(59,130,246,0.25)] ring-1 ring-[var(--accent)]'
                      : 'bg-[var(--surface-2)] border-[var(--line)] hover:border-[rgba(59,130,246,0.30)] hover:bg-[var(--surface)]'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      'font-ui text-xs font-bold uppercase tracking-wider',
                      isSelected ? 'text-white' : 'text-[var(--ink)] group-hover:text-white'
                    )}>
                      {day.name}
                    </span>
                    <span className={cn(
                      'font-ui text-[10px] tabular-nums font-semibold px-1.5 py-0.2 rounded-full',
                      isSelected
                        ? 'bg-[var(--accent)] text-white'
                        : 'bg-[rgba(255,255,255,0.06)] text-[var(--muted)]'
                    )}>
                      {daySessionCount} slots
                    </span>
                  </div>

                  <div className="mt-1">
                    <span className={cn(
                      'font-ui text-[11px] font-medium block truncate',
                      isSelected ? 'text-[#93C5FD]' : 'text-[var(--muted)]'
                    )}>
                      {day.group}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </Card>

      {/* 5. Main Content Area */}

      {/* VIEW A: DAY SCHEDULE VIEW (Clean, Spacious Cards) */}
      {viewMode === 'day' && (
        <div className="space-y-6">
          {/* Day Banner */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#3B82F6] to-[#1D4ED8] flex items-center justify-center text-white font-ui font-bold text-sm shadow-sm">
                {weekDays.find((d) => d.dayIndex === selectedDayIndex)?.name}
              </div>
              <div>
                <h2 className="font-display font-semibold text-lg sm:text-xl text-[var(--ink)]">
                  {weekDays.find((d) => d.dayIndex === selectedDayIndex)?.fullName} Schedule
                </h2>
                <p className="font-ui text-xs text-[var(--muted)]">
                  {weekDays.find((d) => d.dayIndex === selectedDayIndex)?.group} · {filteredSessions.length} active class batches
                </p>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setViewMode('week')}
              icon={<Grid className="w-3.5 h-3.5" />}
            >
              View Full Week
            </Button>
          </div>

          {filteredSessions.length === 0 ? (
            <Card className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[var(--surface-2)] border border-[var(--line)] flex items-center justify-center mx-auto text-[var(--muted)]">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <h3 className="font-display font-semibold text-base text-[var(--ink)]">
                No classes match the selected filter
              </h3>
              <p className="font-ui text-xs text-[var(--muted)] max-w-sm mx-auto">
                Try switching the studio filter or time of day to view all scheduled batches.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setCategoryFilter('all')
                  setTimeFilter('all')
                  setSearchQuery('')
                }}
              >
                Reset Filters
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
              {filteredSessions.map((session) => {
                const booked = session.bookedCount ?? session.bookings?.length ?? 0
                const capacity = session.capacity ?? 10
                const isFull = booked >= capacity
                const spotsAvailable = Math.max(0, capacity - booked)

                return (
                  <Card
                    key={session.id}
                    className="p-4 sm:p-4.5 flex flex-col justify-between hover:border-[rgba(59,130,246,0.45)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition-all duration-160 group relative overflow-hidden space-y-3.5"
                  >
                    {/* Top Specular Edge Highlight on Hover */}
                    <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[rgba(59,130,246,0.4)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                    <div className="space-y-3">
                      {/* Top Meta Line: Time & Status Badge */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-ui text-xs font-semibold text-[var(--ink)] tabular-nums">
                          <Clock className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                          <span>{session.startTime} – {session.endTime}</span>
                          <span className="text-[var(--muted)] font-normal text-[11px]">({session.durationMinutes}m)</span>
                        </div>

                        <Badge status={isFull ? 'danger' : 'ok'} size="sm">
                          {isFull ? 'Full · Waitlist' : `${spotsAvailable} spots left`}
                        </Badge>
                      </div>

                      {/* Studio Location & Title */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_6px_#3B82F6]" />
                          <span className="font-ui text-[10.5px] font-semibold uppercase tracking-wider text-[var(--accent)] truncate">
                            {session.studioName}
                          </span>
                        </div>

                        <h3 className="font-display font-semibold text-[14.5px] text-[var(--ink)] leading-snug line-clamp-1">
                          {session.title}
                        </h3>
                      </div>

                      {/* Instructor / Coach & Intensity Row */}
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[rgba(59,130,246,0.35)] to-[rgba(99,102,241,0.20)] border border-[rgba(59,130,246,0.4)] flex items-center justify-center font-ui text-[10px] font-bold text-white shrink-0">
                            {getInitials(session.instructorName)}
                          </div>
                          <span className="font-ui text-xs font-medium text-[var(--ink-2)] truncate">
                            {session.instructorName}
                          </span>
                        </div>

                        {session.intensity && (
                          <span className="font-ui text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface-2)] border border-[var(--line)] text-[var(--muted)] font-medium shrink-0">
                            {session.intensity}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Occupancy & Actions */}
                    <div className="space-y-3 pt-2 border-t border-[var(--line)]">
                      {/* Occupancy Strand Meter */}
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <StrandMeter
                            value={booked}
                            max={capacity}
                            capsules={5}
                            size="sm"
                          />
                          <span className="font-ui text-xs font-semibold text-[var(--ink)] tabular-nums">
                            {booked}/{capacity}
                          </span>
                        </div>

                        {session.waitlistCount > 0 ? (
                          <span className="font-ui text-[10.5px] text-[var(--amber)] font-medium tabular-nums">
                            +{session.waitlistCount} waitlist
                          </span>
                        ) : (
                          <span className="font-ui text-[10.5px] text-[var(--muted)]">
                            {isFull ? 'Waitlist open' : 'Instant access'}
                          </span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setSelectedSession(session)
                            setRosterDrawerOpen(true)
                          }}
                          className="w-full text-xs font-semibold h-[32px]"
                        >
                          Roster ({booked})
                        </Button>

                        <Button
                          variant={isFull ? 'outline' : 'primary'}
                          size="sm"
                          onClick={() => {
                            setBookModalSession(session)
                            setBookModalOpen(true)
                          }}
                          className="w-full text-xs font-semibold h-[32px]"
                        >
                          {isFull ? '+ Waitlist' : '+ Book'}
                        </Button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW B: WEEK MATRIX OVERVIEW */}
      {viewMode === 'week' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-display font-semibold text-lg text-[var(--ink)]">
              Weekly Timetable Grid (Monday – Sunday)
            </h2>
            <span className="font-ui text-xs text-[var(--muted)]">
              Click any day or class card for details
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {weekDays.map((day) => {
              const daySessions = sessions.filter((s) => s.dayOfWeek === day.dayIndex)

              return (
                <Card key={day.dayIndex} className="p-4 flex flex-col space-y-3 min-h-[380px]">
                  {/* Day Header */}
                  <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                    <div>
                      <h3 className="font-display font-semibold text-base text-[var(--ink)]">
                        {day.fullName}
                      </h3>
                      <p className="font-ui text-[11px] text-[var(--accent)] font-medium mt-0.5">
                        {day.group}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedDayIndex(day.dayIndex)
                        setViewMode('day')
                      }}
                      className="px-2.5 py-1 rounded-full bg-[var(--surface-2)] hover:bg-[var(--accent)] hover:text-white border border-[var(--line)] font-ui text-[11px] font-semibold text-[var(--muted)] transition-colors cursor-pointer"
                    >
                      Focus Day →
                    </button>
                  </div>

                  {/* Day Sessions List */}
                  <div className="space-y-2 flex-1 overflow-y-auto pr-0.5">
                    {daySessions.map((session) => {
                      const booked = session.bookedCount ?? session.bookings?.length ?? 0
                      const capacity = session.capacity ?? 10
                      const isFull = booked >= capacity

                      return (
                        <div
                          key={session.id}
                          onClick={() => {
                            setSelectedSession(session)
                            setRosterDrawerOpen(true)
                          }}
                          className="p-3 rounded-[var(--r-md)] bg-[var(--surface-2)] border border-[var(--line)] hover:border-[rgba(59,130,246,0.40)] transition-all cursor-pointer space-y-1.5 group"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-ui font-bold text-[var(--accent)] tabular-nums">
                              {session.startTime}
                            </span>
                            <Badge status={isFull ? 'danger' : 'ok'} size="sm">
                              {isFull ? 'Full' : `${booked}/${capacity}`}
                            </Badge>
                          </div>

                          <h4 className="font-ui text-xs font-semibold text-[var(--ink)] group-hover:text-white transition-colors line-clamp-1">
                            {session.title}
                          </h4>

                          <div className="flex items-center justify-between text-[11px] text-[var(--muted)]">
                            <span className="truncate max-w-[120px]">{session.instructorName}</span>
                            <span className="truncate text-[10px] uppercase">{session.studioName.split(' ')[0]}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* VIEW C: TIMETABLE LIST VIEW (Dense, Functional Table) */}
      {viewMode === 'list' && (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-ui">
              <thead>
                <tr className="border-b border-[var(--line)] bg-[var(--surface-2)] text-[var(--muted)] text-left">
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Time & Day</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Class Title</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Studio</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Instructor</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Occupancy</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Status</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)] text-[var(--ink-2)]">
                {filteredSessions.map((session) => {
                  const booked = session.bookedCount ?? session.bookings?.length ?? 0
                  const capacity = session.capacity ?? 10
                  const isFull = booked >= capacity
                  const dayName = weekDays.find((d) => d.dayIndex === session.dayOfWeek)?.name || 'Day'

                  return (
                    <tr key={session.id} className="hover:bg-[var(--surface-2)] transition-colors">
                      <td className="py-3 px-4 font-semibold text-[var(--ink)] tabular-nums">
                        <span className="inline-block px-2 py-0.5 rounded bg-[var(--surface-2)] text-white text-[11px] mr-2">
                          {dayName}
                        </span>
                        {session.startTime} – {session.endTime}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[var(--ink)]">
                        {session.title}
                      </td>
                      <td className="py-3 px-4 text-[var(--muted)]">
                        {session.studioName}
                      </td>
                      <td className="py-3 px-4 text-[var(--ink)]">
                        {session.instructorName}
                      </td>
                      <td className="py-3 px-4 tabular-nums">
                        <div className="flex items-center gap-2">
                          <StrandMeter value={booked} max={capacity} capsules={5} size="sm" />
                          <span>{booked}/{capacity}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge status={isFull ? 'danger' : 'ok'} size="sm">
                          {isFull ? 'Full' : 'Available'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setSelectedSession(session)
                              setRosterDrawerOpen(true)
                            }}
                          >
                            Roster
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setBookModalSession(session)
                              setBookModalOpen(true)
                            }}
                          >
                            Book
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Drawers & Modals */}
      <ClassRosterDrawer
        session={selectedSession}
        open={rosterDrawerOpen}
        onOpenChange={setRosterDrawerOpen}
        onSessionUpdated={refreshClasses}
        onBookMember={(sess) => {
          setBookModalSession(sess)
          setBookModalOpen(true)
        }}
      />

      <CreateClassModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        studios={studios}
        onCreated={refreshClasses}
      />

      <BookClassModal
        open={bookModalOpen}
        onOpenChange={setBookModalOpen}
        session={bookModalSession}
        onBooked={refreshClasses}
      />
    </div>
  )
}
