'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar as CalendarIcon, Clock, Users, Plus,
  Filter, Dumbbell, Flame, CheckCircle, AlertTriangle,
  ChevronLeft, ChevronRight, Grid, List, MapPin,
  Sparkles, Layers, UserPlus,
} from 'lucide-react'
import GlassCard from '@/components/app/ui/glass-card'
import StatCard from '@/components/app/ui/stat-card'
import { DataTable, type DataTableColumn } from '@/components/app/ui/data-table'
import { Button } from '@/components/app/ui/button'
import { StatusPill } from '@/components/app/ui/badge'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/app/ui/select'
import ClassRosterDrawer from '@/components/app/classes/ClassRosterDrawer'
import CreateClassModal from '@/components/app/classes/CreateClassModal'
import BookClassModal from '@/components/app/classes/BookClassModal'
import { getSessions, getStoredStudios } from '@/lib/classes'
import { getInitials } from '@/lib/utils'
import type { ClassSession, ClassCategory, StudioRoom } from '@/types/class'
import { cn } from '@/lib/utils'

export default function ClassesPage() {
  const [sessions, setSessions] = useState<ClassSession[]>([])
  const [studios, setStudios] = useState<StudioRoom[]>([])
  const [branchFilter, setBranchFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [instructorFilter, setInstructorFilter] = useState('all')
  const [timeOfDayFilter, setTimeOfDayFilter] = useState<'all' | 'morning' | 'afternoon' | 'evening'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null)
  const [rosterDrawerOpen, setRosterDrawerOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [bookModalOpen, setBookModalOpen] = useState(false)
  const [bookModalSession, setBookModalSession] = useState<ClassSession | null>(null)

  const refreshClasses = () => {
    const list = getSessions({
      branchId: branchFilter,
      category: categoryFilter,
      instructorId: instructorFilter,
      timeOfDay: timeOfDayFilter,
    })
    setSessions(list)
    setStudios(getStoredStudios())
  }

  useEffect(() => {
    refreshClasses()

    const handleUpdate = () => refreshClasses()
    window.addEventListener('dna360_classes_updated', handleUpdate)
    return () => window.removeEventListener('dna360_classes_updated', handleUpdate)
  }, [branchFilter, categoryFilter, instructorFilter, timeOfDayFilter])

  // Days of week helper (Monday to Sunday)
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const dayIndexes = [1, 2, 3, 4, 5, 6, 0] // JS getDay() mapping: 1=Mon, ..., 0=Sun

  // Category Color Map
  const categoryStyles: Record<string, { bg: string; text: string; border: string }> = {
    reformer_pilates: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30' },
    reformer_pilates_pt: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
    mat_pilates: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/30' },
    yoga: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    dance_fitness: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
    mma: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
    spinning: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
    crossfit: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
    hyrox: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
    fitzone: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  }

  // KPI Calculations
  const totalClassesCount = sessions.length
  const totalBookingsCount = sessions.reduce((acc, s) => acc + s.bookedCount, 0)
  const totalCapacity = sessions.reduce((acc, s) => acc + (s.capacity || 8), 0)
  const avgOccupancy = totalCapacity > 0 ? Math.round((totalBookingsCount / totalCapacity) * 100) : 0
  const availableSpotsToday = sessions.reduce((acc, s) => acc + Math.max(0, (s.capacity || 8) - s.bookedCount), 0)

  // Columns for List View
  const listColumns: DataTableColumn<ClassSession>[] = [
    {
      id: 'time',
      header: 'Day & Time',
      sortable: true,
      cell: (_, row) => (
        <div>
          <div className="flex items-center gap-1.5 font-bold text-xs text-[var(--app-text-primary)]">
            <Clock className="w-3.5 h-3.5 text-[var(--aurora-1)]" />
            <span>{row.startTime} - {row.endTime}</span>
          </div>
          <span className="text-[0.6875rem] text-[var(--app-text-muted)] mt-0.5 block">
            {row.date} ({dayNames[row.dayOfWeek === 0 ? 6 : row.dayOfWeek - 1]})
          </span>
        </div>
      ),
    },
    {
      id: 'title',
      header: 'Class Session',
      sortable: true,
      cell: (_, row) => {
        const cat = categoryStyles[row.category] || categoryStyles.crossfit
        return (
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className={cn('text-[0.625rem] px-1.5 py-0.2 rounded font-bold uppercase border', cat.bg, cat.text, cat.border)}>
                {row.category}
              </span>
              <span className="text-[0.625rem] text-[var(--app-text-muted)]">
                {row.durationMinutes}m · {row.intensity}
              </span>
            </div>
            <p className="font-semibold text-xs text-[var(--app-text-primary)] hover:text-[var(--aurora-1)] transition-colors">
              {row.title}
            </p>
          </div>
        )
      },
    },
    {
      id: 'instructor',
      header: 'Coach & Studio',
      sortable: true,
      cell: (_, row) => (
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--app-text-primary)]">
            <Dumbbell className="w-3.5 h-3.5 text-[var(--aurora-1)]" />
            <span>{row.instructorName}</span>
          </div>
          <p className="text-[0.6875rem] text-[var(--app-text-muted)] mt-0.5">
            {row.studioName}
          </p>
        </div>
      ),
    },
    {
      id: 'occupancy',
      header: 'Occupancy / Capacity',
      sortable: true,
      cell: (_, row) => {
        const capacity = row.capacity || 8
        const isFull = row.bookedCount >= capacity
        const pct = Math.round((row.bookedCount / capacity) * 100)
        return (
          <div className="w-36 space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className={cn('font-bold', isFull ? 'text-[var(--app-danger)]' : 'text-[var(--app-text-primary)]')}>
                {row.bookedCount}/{capacity}
              </span>
              <span className="text-[0.6875rem] text-[var(--app-text-muted)]">{pct}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[var(--app-glass-bg)] overflow-hidden border border-[var(--app-glass-border)]">
              <div
                className={cn('h-full rounded-full', isFull ? 'bg-[var(--app-danger)]' : 'bg-[var(--aurora-1)]')}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            {row.waitlistCount > 0 && (
              <span className="text-[0.625rem] text-[var(--app-warning)] font-semibold block">
                {row.waitlistCount} Waitlisted
              </span>
            )}
          </div>
        )
      },
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      width: '120px',
      cell: (_, row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedSession(row)
              setRosterDrawerOpen(true)
            }}
          >
            Roster ({row.bookedCount})
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--app-text-primary)] tracking-tight">
            Class Scheduling & Bookings
          </h1>
          <p className="text-sm text-[var(--app-text-secondary)] mt-1">
            Weekly interactive timetable, studio capacity controls, member waitlists, and coach rosters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setBookModalSession(null)
              setBookModalOpen(true)
            }}
            icon={<UserPlus className="w-3.5 h-3.5" />}
          >
            Book Member
          </Button>
          <Button
            variant="primary"
            onClick={() => setCreateModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Schedule Class
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Scheduled Classes"
          value={totalClassesCount}
          suffix=" sessions"
          icon={<CalendarIcon className="w-5 h-5 text-[var(--aurora-1)]" />}
        />
        <StatCard
          label="Confirmed Bookings"
          value={totalBookingsCount}
          suffix=" attendees"
          icon={<Users className="w-5 h-5 text-[var(--app-success)]" />}
        />
        <StatCard
          label="Average Occupancy"
          value={avgOccupancy}
          suffix="%"
          icon={<Layers className="w-5 h-5 text-[var(--app-warning)]" />}
        />
        <StatCard
          label="Available Spots"
          value={availableSpotsToday}
          suffix=" spots open"
          icon={<Sparkles className="w-5 h-5 text-[var(--app-info)]" />}
        />
      </div>

      {/* Filter Toolbar */}
      <GlassCard padding="sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Branch Filter */}
            <div className="w-full sm:w-36">
              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger><SelectValue placeholder="Branch: All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  <SelectItem value="pow">Powai</SelectItem>
                  <SelectItem value="and">Andheri</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div className="w-full sm:w-44">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger><SelectValue placeholder="Category: All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="crossfit">CrossFit / Functional</SelectItem>
                  <SelectItem value="yoga">Power Yoga</SelectItem>
                  <SelectItem value="cycling">RPM Cycling</SelectItem>
                  <SelectItem value="hiit">MetCon HIIT</SelectItem>
                  <SelectItem value="boxing">Boxing Conditioning</SelectItem>
                  <SelectItem value="strength">Strength & Lifting</SelectItem>
                  <SelectItem value="pilates">Reformer Pilates</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Instructor Filter */}
            <div className="w-full sm:w-44">
              <Select value={instructorFilter} onValueChange={setInstructorFilter}>
                <SelectTrigger><SelectValue placeholder="Coach: All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Coaches</SelectItem>
                  <SelectItem value="usr_trainer_01">Rajesh Poojary</SelectItem>
                  <SelectItem value="usr_trainer_02">Sneha Rao</SelectItem>
                  <SelectItem value="usr_trainer_03">Aftab Memon</SelectItem>
                  <SelectItem value="usr_trainer_04">Zeebran Shaikh</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Time of Day */}
            <div className="w-full sm:w-36">
              <Select value={timeOfDayFilter} onValueChange={(val: any) => setTimeOfDayFilter(val)}>
                <SelectTrigger><SelectValue placeholder="Time: All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Day</SelectItem>
                  <SelectItem value="morning">Morning (&lt; 12:00)</SelectItem>
                  <SelectItem value="afternoon">Afternoon</SelectItem>
                  <SelectItem value="evening">Evening (&gt; 17:00)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl glass-input shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                viewMode === 'grid'
                  ? 'bg-[var(--app-sidebar-active)] text-[var(--app-text-primary)] shadow-sm'
                  : 'text-[var(--app-text-muted)] hover:text-[var(--app-text-secondary)]'
              )}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Weekly Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                viewMode === 'list'
                  ? 'bg-[var(--app-sidebar-active)] text-[var(--app-text-primary)] shadow-sm'
                  : 'text-[var(--app-text-muted)] hover:text-[var(--app-text-secondary)]'
              )}
            >
              <List className="w-3.5 h-3.5" />
              <span>Daily List</span>
            </button>
          </div>
        </div>
      </GlassCard>

      {/* VIEW 1: Weekly Calendar Grid */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3 overflow-x-auto">
          {dayNames.map((dayName, idx) => {
            const dayIdx = dayIndexes[idx]
            const daySessions = sessions
              .filter((s) => s.dayOfWeek === dayIdx)
              .sort((a, b) => a.startTime.localeCompare(b.startTime))

            return (
              <div key={dayName} className="flex flex-col space-y-3 min-w-[150px]">
                {/* Column Header */}
                <div className="p-2.5 rounded-xl glass-card text-center border border-[var(--app-glass-border)]">
                  <p className="font-display text-xs font-bold text-[var(--app-text-primary)]">{dayName}</p>
                  <span className="text-[0.625rem] text-[var(--app-text-muted)] font-mono mt-0.5 block">
                    {daySessions.length} {daySessions.length === 1 ? 'class' : 'classes'}
                  </span>
                </div>

                {/* Day's Class Cards */}
                <div className="space-y-2.5 flex-1">
                  {daySessions.length > 0 ? (
                    daySessions.map((session) => {
                      const cat = categoryStyles[session.category] || categoryStyles.crossfit
                      const cap = session.capacity || 8
                      const isFull = session.bookedCount >= cap
                      const pct = Math.round((session.bookedCount / cap) * 100)

                      return (
                        <motion.div
                          key={session.id}
                          whileHover={{ scale: 1.02 }}
                          transition={{ duration: 0.15 }}
                          onClick={() => {
                            setSelectedSession(session)
                            setRosterDrawerOpen(true)
                          }}
                          className="p-3 rounded-2xl glass-card cursor-pointer border border-[var(--app-glass-border)] hover:border-[var(--aurora-1)]/40 space-y-2 transition-all shadow-sm group"
                        >
                          <div className="flex items-center justify-between">
                            <span className={cn('text-[0.625rem] px-1.5 py-0.2 rounded font-bold uppercase border', cat.bg, cat.text, cat.border)}>
                              {session.category}
                            </span>
                            <span className="text-[0.6875rem] font-mono text-[var(--app-text-muted)]">
                              {session.startTime}
                            </span>
                          </div>

                          <h4 className="font-display text-xs font-bold text-[var(--app-text-primary)] leading-snug group-hover:text-[var(--aurora-1)] transition-colors line-clamp-2">
                            {session.title}
                          </h4>

                          <div className="space-y-1 text-[0.6875rem] text-[var(--app-text-muted)] pt-1 border-t border-[var(--app-glass-border)]">
                            <div className="flex items-center gap-1">
                              <span className="w-4 h-4 rounded-full bg-[var(--app-glass-bg)] border border-[var(--app-glass-border)] flex items-center justify-center text-[0.5625rem] font-bold text-[var(--app-text-secondary)]">
                                {getInitials(session.instructorName)}
                              </span>
                              <span className="truncate">{session.instructorName}</span>
                            </div>
                            <p className="truncate text-[0.625rem] text-[var(--app-text-secondary)]">
                              {session.studioName.split('-')[0]}
                            </p>
                          </div>

                          {/* Occupancy pill */}
                          <div className="pt-1">
                            <div className="flex items-center justify-between text-[0.625rem] font-mono">
                              <span className={cn('font-bold', isFull ? 'text-[var(--app-danger)]' : 'text-[var(--app-text-primary)]')}>
                                {session.bookedCount}/{cap}
                              </span>
                              {session.waitlistCount > 0 && (
                                <span className="text-[var(--app-warning)] font-bold">
                                  +{session.waitlistCount} W
                                </span>
                              )}
                            </div>
                            <div className="w-full h-1 rounded-full bg-[var(--app-glass-bg)] mt-0.5 overflow-hidden">
                              <div
                                className={cn('h-full rounded-full', isFull ? 'bg-[var(--app-danger)]' : 'bg-[var(--aurora-1)]')}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                          </div>
                        </motion.div>
                      )
                    })
                  ) : (
                    <div className="p-4 rounded-xl glass-input text-center text-[0.6875rem] text-[var(--app-text-muted)]">
                      No classes
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* VIEW 2: Daily List View */
        <DataTable<ClassSession>
          columns={listColumns}
          data={sessions}
          status="success"
          page={1}
          pageSize={sessions.length}
          total={sessions.length}
          onRowClick={(row) => {
            setSelectedSession(row)
            setRosterDrawerOpen(true)
          }}
          getRowId={(row) => row.id}
          emptyTitle="No class sessions match your criteria"
          emptyDescription="Try clearing filters to view all scheduled group classes."
        />
      )}

      {/* Class Roster & Attendance Drawer */}
      <ClassRosterDrawer
        session={selectedSession}
        open={rosterDrawerOpen}
        onOpenChange={setRosterDrawerOpen}
        onSessionUpdated={refreshClasses}
        onOpenBookModal={(session) => {
          setBookModalSession(session)
          setBookModalOpen(true)
        }}
      />

      {/* Create / Schedule Class Modal */}
      <CreateClassModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSessionCreated={refreshClasses}
      />

      {/* Member Class Booking Modal */}
      <BookClassModal
        session={bookModalSession}
        open={bookModalOpen}
        onOpenChange={setBookModalOpen}
        onBookingCreated={refreshClasses}
      />
    </div>
  )
}
