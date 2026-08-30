'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Calendar as CalendarIcon, Clock, Users, Plus,
  ChevronLeft, ChevronRight, Grid, List, Sparkles,
  CheckCircle, AlertTriangle, Layers,
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none">
      {/* 1. Header */}
      <PageHeader
        eyebrow="STUDIO & TIMETABLE · POWAI"
        title="Classes & Timetable"
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

      {/* 2. Studio Filter Tabs */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 select-none">
          {[
            { id: 'all', label: 'All Studio Batches' },
            { id: 'pilates_reformer', label: 'Reformer Pilates' },
            { id: 'yoga', label: 'Ashtanga & Hatha Yoga' },
            { id: 'hiit_strength', label: 'HIIT & Functional' },
            { id: 'cycling', label: 'RPM Spin Studio' },
          ].map((cat) => {
            const isSelected = categoryFilter === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={cn(
                  'h-[32px] px-3.5 font-ui text-xs font-semibold rounded-full cursor-pointer transition-all duration-140 whitespace-nowrap',
                  isSelected
                    ? 'bg-[var(--accent-soft)] border border-[rgba(244,63,94,0.35)] text-white shadow-glow-sm'
                    : 'bg-[var(--surface)] border border-[var(--line)] text-[var(--muted)] hover:text-white hover:bg-[var(--surface-2)]'
                )}
              >
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* 3. Week Timetable Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {weekDays.map((day) => {
          const daySessions = sessions.filter((s) => s.dayOfWeek === day.dayIndex)

          return (
            <Card key={day.dayIndex} className="p-4 flex flex-col min-h-[480px]">
              {/* Day Header */}
              <div className="border-b border-[var(--line)] pb-3 mb-3">
                <div className="flex items-center justify-between">
                  <span className="font-display text-lg font-semibold text-[var(--ink)]">
                    {day.name}
                  </span>
                  <span className="font-data text-[10.5px] text-[var(--muted)] font-medium">
                    {daySessions.length} slots
                  </span>
                </div>
                <p className="font-data text-[9.5px] uppercase tracking-[0.10em] text-[var(--muted-2)] mt-0.5">
                  {day.pattern}
                </p>
              </div>

              {/* Class Cards List */}
              <div className="space-y-2.5 flex-1 overflow-y-auto pr-0.5">
                {daySessions.map((session) => {
                  const isFull = session.enrolledCount >= session.capacity
                  const capacityPct = Math.round((session.enrolledCount / session.capacity) * 100)

                  return (
                    <div
                      key={session.id}
                      onClick={() => {
                        setSelectedSession(session)
                        setRosterDrawerOpen(true)
                      }}
                      className={cn(
                        'p-3 rounded-[var(--r-md)] bg-[var(--surface-2)] border border-[var(--line)] cursor-pointer transition-all duration-140 space-y-2',
                        'hover:border-[rgba(244,63,94,0.35)] hover:bg-[rgba(244,63,94,0.06)]'
                      )}
                    >
                      {/* Time & Badge */}
                      <div className="flex items-center justify-between">
                        <span className="font-data text-xs font-bold text-[var(--accent)] tabular-nums">
                          {session.startTime}
                        </span>
                        <Badge status={isFull ? 'danger' : 'ok'} size="sm">
                          {isFull ? 'Full' : `${session.enrolledCount}/${session.capacity}`}
                        </Badge>
                      </div>

                      {/* Class Title & Coach */}
                      <div>
                        <h4 className="font-ui text-xs font-semibold text-[var(--ink)] leading-snug line-clamp-1">
                          {session.title}
                        </h4>
                        <p className="font-ui text-[11px] text-[var(--muted)] line-clamp-1 mt-0.5">
                          {session.instructorName}
                        </p>
                      </div>

                      {/* Capacity Strand */}
                      <div className="pt-1 flex items-center justify-between">
                        <StrandMeter
                          value={session.enrolledCount}
                          max={session.capacity}
                          capsules={5}
                          size="sm"
                        />
                        <span className="font-data text-[10px] text-[var(--muted)]">
                          {session.studioName}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )
        })}
      </div>

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
