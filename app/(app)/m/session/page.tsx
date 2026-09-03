'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  X,
  Plus,
  Check,
  ArrowRightLeft,
  Clock,
  Dumbbell,
  Play,
  RotateCcw,
  Zap,
} from 'lucide-react'
import { toast } from '@/components/app/ui/toast'
import { cn } from '@/lib/utils'

export default function ActiveWorkoutSessionPage() {
  const router = useRouter()

  // Session elapsed timer (24:18)
  const [elapsedSeconds, setElapsedSeconds] = useState(1458)

  // Rest timer
  const [restSecondsRemaining, setRestSecondsRemaining] = useState(47)
  const [restTimerActive, setRestTimerActive] = useState(true)

  // Sets state
  const [sets, setSets] = useState([
    { setNum: 1, kg: '60', reps: '8', isDone: true, last: 'Last: 57.5 kg × 8' },
    { setNum: 2, kg: '60', reps: '8', isDone: true, last: 'Last: 57.5 kg × 8' },
    { setNum: 3, kg: '60', reps: '8', isDone: false, last: 'Last: 57.5 kg × 7' },
    { setNum: 4, kg: '60', reps: '8', isDone: false, last: 'Last: 55 kg × 8' },
  ])

  // Timer interval
  useEffect(() => {
    const interval = setInterval(() => setElapsedSeconds((prev) => prev + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  // Rest countdown
  useEffect(() => {
    let interval: any = null
    if (restTimerActive && restSecondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            setRestTimerActive(false)
            toast.success('Rest complete! Time for your next set.')
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [restTimerActive, restSecondsRemaining])

  const setSecondsRemaining = setRestSecondsRemaining

  const handleToggleSet = (index: number) => {
    setSets((prev) =>
      prev.map((s, idx) => {
        if (idx === index) {
          const nextDone = !s.isDone
          if (nextDone) {
            toast.success(`Set ${s.setNum} checked off (${s.kg} kg × ${s.reps})`)
            setRestSecondsRemaining(90)
            setRestTimerActive(true)
          }
          return { ...s, isDone: nextDone }
        }
        return s
      })
    )
  }

  const handleAddSet = () => {
    const nextNum = sets.length + 1
    const lastSet = sets[sets.length - 1]
    setSets([
      ...sets,
      {
        setNum: nextNum,
        kg: lastSet ? lastSet.kg : '60',
        reps: lastSet ? lastSet.reps : '8',
        isDone: false,
        last: 'Prescribed Set',
      },
    ])
    toast.info(`Added Set ${nextNum}`)
  }

  const handleFinishWorkout = () => {
    toast.success('Workout finished and saved!', {
      description: 'Logged 4 sets of Barbell Bench Press · PR logged!',
    })
    router.push('/m')
  }

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  return (
    <div className="w-full max-w-xl mx-auto pt-1 pb-24 px-4 select-none">
      {/* Nav Header */}
      <div className="flex items-center justify-between py-2 mb-2">
        <Link href="/m" className="member-icbtn" style={{ width: '36px', height: '36px' }}>
          <X className="w-4 h-4 text-white" />
        </Link>
        <span className="font-ui font-bold text-[15px] text-white">Push Day</span>
        <span className="font-data text-sm font-semibold text-[#38BDF8]">
          {formatTime(elapsedSeconds)}
        </span>
      </div>

      {/* Progress Bar (33%) */}
      <div className="w-full h-1 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-gradient-to-r from-[#1E40AF] via-[#3B82F6] to-[#38BDF8] rounded-full transition-all duration-300"
          style={{ width: '33%' }}
        />
      </div>

      {/* Progress Meta */}
      <div className="flex justify-between font-data text-[9px] text-[var(--ink-3)] tracking-wider mb-5 uppercase">
        <span>EXERCISE 2 OF 6</span>
        <span>ROHAN · W3 D1</span>
      </div>

      {/* Exercise Title */}
      <h2 className="font-display text-2xl font-semibold text-white tracking-tight">
        Barbell bench press
      </h2>
      <p className="text-xs text-[var(--ink-2)] mt-1 mb-4">
        4 sets · 8 reps · 60 kg · 90 s rest
      </p>

      {/* Set Header Labels */}
      <div className="grid grid-cols-[28px_1fr_1fr_36px] gap-2.5 mb-1 text-center font-data text-[9px] text-[var(--ink-3)] tracking-wider">
        <span>SET</span>
        <span>KG</span>
        <span>REPS</span>
        <span />
      </div>

      {/* Set Rows */}
      <div className="space-y-1">
        {sets.map((s, idx) => (
          <div
            key={s.setNum}
            className="grid grid-cols-[28px_1fr_1fr_36px] gap-2.5 items-center py-2.5 border-t border-[var(--line)]"
          >
            <span className="font-data text-xs text-[var(--ink-3)] text-center">
              {s.setNum}
            </span>

            {/* KG Field */}
            <input
              type="text"
              value={s.kg}
              onChange={(e) => {
                const val = e.target.value
                setSets((prev) =>
                  prev.map((item, i) => (i === idx ? { ...item, kg: val } : item))
                )
              }}
              className={cn(
                'bg-[var(--surface-2)] border border-[var(--line)] rounded-xl py-2 px-2 text-center font-data text-sm outline-none transition-colors focus:border-[#3B82F6]',
                !s.isDone && idx >= 2 ? 'text-[var(--ink-3)]' : 'text-white'
              )}
            />

            {/* Reps Field */}
            <input
              type="text"
              value={s.reps}
              onChange={(e) => {
                const val = e.target.value
                setSets((prev) =>
                  prev.map((item, i) => (i === idx ? { ...item, reps: val } : item))
                )
              }}
              className={cn(
                'bg-[var(--surface-2)] border border-[var(--line)] rounded-xl py-2 px-2 text-center font-data text-sm outline-none transition-colors focus:border-[#3B82F6]',
                !s.isDone && idx >= 2 ? 'text-[var(--ink-3)]' : 'text-white'
              )}
            />

            {/* Check Tick */}
            <button
              onClick={() => handleToggleSet(idx)}
              className={cn(
                'w-9 h-9 rounded-xl border border-[var(--line-2)] flex items-center justify-center transition-all cursor-pointer',
                s.isDone
                  ? 'bg-gradient-to-r from-[#1E40AF] to-[#38BDF8] border-transparent shadow-[0_0_12px_rgba(59,130,246,0.5)]'
                  : 'hover:border-white/30'
              )}
            >
              <Check className={cn('w-4 h-4', s.isDone ? 'text-white' : 'text-[var(--ink-3)]')} />
            </button>

            {/* Last Performance Telemetry */}
            <span className="col-span-2 col-start-2 font-data text-[9px] text-[var(--ink-3)] -mt-1">
              {s.last}
            </span>
          </div>
        ))}
      </div>

      {/* Rest Countdown Bar */}
      <div className="flex items-center justify-between bg-[var(--surface-2)] border border-[var(--line-2)] rounded-full px-4 py-2.5 mt-4">
        <span className="text-xs text-[var(--ink-3)]">Rest</span>
        <b className="font-data text-base text-[#38BDF8]">
          0:{String(restSecondsRemaining).padStart(2, '0')}
        </b>
        <button
          onClick={() => setRestTimerActive(false)}
          className="text-xs text-[var(--ink-3)] hover:text-white cursor-pointer"
        >
          Skip
        </button>
      </div>

      {/* Duo Action Buttons */}
      <div className="flex gap-2.5 mt-3">
        <button
          onClick={() => toast.info('Selecting alternative chest movements...')}
          className="flex-1 bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--line)] rounded-full py-2.5 text-xs font-medium text-[var(--ink-2)] hover:text-white transition-colors cursor-pointer"
        >
          Swap exercise
        </button>
        <button
          onClick={handleAddSet}
          className="flex-1 bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--line)] rounded-full py-2.5 text-xs font-medium text-[var(--ink-2)] hover:text-white transition-colors cursor-pointer"
        >
          Add set
        </button>
      </div>

      {/* Up Next Preview */}
      <div className="mt-5">
        <h3 className="font-ui text-sm font-bold text-white mb-2">Up next</h3>
        <div className="member-lrow">
          <div className="member-lic" style={{ background: 'var(--t1)' }}>
            <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-[#7FB2FF] fill-none" strokeWidth="1.8">
              <path d="M4 12h16M7 8v8M17 8v8" />
            </svg>
          </div>
          <div className="member-lt">
            <b>Incline dumbbell press</b>
            <span>3 × 10 · 22.5 kg</span>
          </div>
        </div>
      </div>

      {/* Bottom Finish Button */}
      <div className="mt-8">
        <button
          onClick={handleFinishWorkout}
          className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#1E40AF] via-[#3B82F6] to-[#38BDF8] text-white font-bold text-sm shadow-[0_10px_26px_-8px_rgba(59,130,246,0.7)] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
        >
          Finish workout
        </button>
      </div>
    </div>
  )
}
