'use client'

import React, { useState } from 'react'
import { Calendar, CheckCircle2, Clock, MapPin, Users, ChevronRight, X } from 'lucide-react'
import { toast } from '@/components/app/ui/toast'
import { cn } from '@/lib/utils'

interface MemberClassItem {
  id: string
  title: string
  instructor: string
  studio: string
  durationMinutes: number
  time: string
  spotsLeft: number
  capacity: number
  waitlistCount?: number
  isBooked?: boolean
}

export default function MemberClassesPage() {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)

  const [classes, setClasses] = useState<MemberClassItem[]>([
    {
      id: 'cls-1',
      title: 'Reformer Pilates',
      instructor: 'Hemant Shirke',
      studio: 'Studio 2',
      durationMinutes: 50,
      time: '6:30 AM',
      spotsLeft: 4,
      capacity: 8,
      isBooked: false,
    },
    {
      id: 'cls-2',
      title: 'HIIT & Conditioning',
      instructor: 'Nikhil Shetty',
      studio: 'Main floor',
      durationMinutes: 45,
      time: '7:00 AM',
      spotsLeft: 0,
      capacity: 12,
      waitlistCount: 3,
      isBooked: false,
    },
    {
      id: 'cls-3',
      title: 'Spin / RPM Cycling',
      instructor: 'Aftab Memon',
      studio: 'Cycle studio',
      durationMinutes: 45,
      time: '7:00 PM',
      spotsLeft: 2,
      capacity: 16,
      isBooked: true,
    },
    {
      id: 'cls-4',
      title: 'Hatha Yoga',
      instructor: 'Hemant Shirke',
      studio: 'Studio 1',
      durationMinutes: 60,
      time: '8:00 PM',
      spotsLeft: 9,
      capacity: 15,
      isBooked: false,
    },
  ])

  const days = [
    { name: 'Tue', num: '1', hasDot: false },
    { name: 'Wed', num: '2', hasDot: true },
    { name: 'Thu', num: '3', hasDot: true },
    { name: 'Fri', num: '4', hasDot: false },
    { name: 'Sat', num: '5', hasDot: true },
    { name: 'Sun', num: '6', hasDot: false },
    { name: 'Mon', num: '7', hasDot: false },
  ]

  const handleToggleBook = (cls: MemberClassItem) => {
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id === cls.id) {
          if (c.isBooked) {
            toast.info(`Cancelled reservation for ${c.title}`)
            return { ...c, isBooked: false, spotsLeft: c.spotsLeft + 1 }
          } else {
            toast.success(`Reserved spot for ${c.title} at ${c.time}!`, {
              description: `Instructor: ${c.instructor} · Studio: ${c.studio}`,
            })
            return { ...c, isBooked: true, spotsLeft: Math.max(0, c.spotsLeft - 1) }
          }
        }
        return c
      })
    )
  }

  const handleJoinWaitlist = (cls: MemberClassItem) => {
    toast.success(`Added to waitlist for ${cls.title}`, {
      description: 'You will receive a notification if a spot opens up.',
    })
  }

  return (
    <div className="w-full max-w-5xl mx-auto pt-1 pb-24 px-4 select-none">
      {/* Header */}
      <div className="member-hdr">
        <div>
          <p className="hi">Book a</p>
          <h1 className="nm text-2xl sm:text-3xl text-white">Class</h1>
        </div>
        <div className="member-icbtn" title="Calendar View">
          <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] stroke-current fill-none" strokeWidth="1.8">
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M8 3v4M16 3v4M3 11h18" />
          </svg>
        </div>
      </div>

      {/* Week Day Pill Selector */}
      <div className="member-week max-w-md mx-auto sm:max-w-none">
        {days.map((d, idx) => (
          <div
            key={d.num}
            onClick={() => setSelectedDayIndex(idx)}
            className={cn(
              'member-day',
              d.hasDot && 'dot',
              selectedDayIndex === idx && 'sel'
            )}
          >
            <p className="dn">{d.name}</p>
            <p className="dd">{d.num}</p>
          </div>
        ))}
      </div>

      {/* Class Schedule Grid: 1 col on mobile, 2 cols on PC */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-2">
        {classes.map((c) => (
          <div
            key={c.id}
            className={cn(
              'member-cls flex flex-col justify-between transition-all duration-200',
              c.isBooked && 'border-[rgba(77,141,255,0.45)] bg-[rgba(77,141,255,0.04)] shadow-[0_8px_24px_rgba(30,64,175,0.15)]'
            )}
          >
            <div className="member-cls-top">
              <div>
                <p className="member-cls-t">{c.title}</p>
                <p className="member-cls-s">
                  {c.instructor} · {c.studio} · {c.durationMinutes} min
                </p>
              </div>
              <span className="member-cls-time">{c.time}</span>
            </div>

            <div className="member-cls-bot">
              {c.isBooked ? (
                <span className="member-pill member-p-blue">BOOKED</span>
              ) : c.spotsLeft > 0 ? (
                <span className="member-spots">
                  {c.spotsLeft} of {c.capacity} spots left
                </span>
              ) : (
                <span className="member-spots text-[#FBBF24]">
                  Full · {c.waitlistCount} on waitlist
                </span>
              )}

              {c.isBooked ? (
                <button
                  onClick={() => handleToggleBook(c)}
                  className="member-bk ghost"
                >
                  Cancel
                </button>
              ) : c.spotsLeft > 0 ? (
                <button
                  onClick={() => handleToggleBook(c)}
                  className="member-bk"
                >
                  Book
                </button>
              ) : (
                <button
                  onClick={() => handleJoinWaitlist(c)}
                  className="member-bk full"
                >
                  Join waitlist
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
