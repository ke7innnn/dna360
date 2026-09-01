'use client'

import React, { useState, useEffect } from 'react'
import {
  CreditCard,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  Lock,
  Clock,
  User,
  Sparkles,
  Info,
} from 'lucide-react'
import { Card } from '@/components/app/ui/glass-card'
import Button from '@/components/app/ui/button'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/components/app/ui/toast'

export default function MemberPTLedgerPage() {
  const { user } = useAuth()
  const [remainingSessions, setRemainingSessions] = useState(8)
  const [totalSessions, setTotalSessions] = useState(12)
  const [ptTier, setPtTier] = useState('Premium PT (₹1,699 / Session)')
  const [trainerName, setTrainerName] = useState('Rajesh Poojary')

  // Sample Immutable Deduction History (§8.7)
  const deductionHistory = [
    {
      id: 'pt_deduct_004',
      date: '28 Aug 2026',
      time: '08:30 AM',
      trainer: 'Rajesh Poojary',
      workoutFocus: 'Upper Body Hypertrophy & Rotator Stability',
      sessionsDeducted: 1,
      balanceAfter: 8,
      status: 'VERIFIED',
    },
    {
      id: 'pt_deduct_003',
      date: '25 Aug 2026',
      time: '08:00 AM',
      trainer: 'Rajesh Poojary',
      workoutFocus: 'Quad Hypertrophy & Allegro Reformer Jumpboard',
      sessionsDeducted: 1,
      balanceAfter: 9,
      status: 'VERIFIED',
    },
    {
      id: 'pt_deduct_002',
      date: '22 Aug 2026',
      time: '08:15 AM',
      trainer: 'Rajesh Poojary',
      workoutFocus: 'Deadlift Form Calibration & Core Bracing',
      sessionsDeducted: 1,
      balanceAfter: 10,
      status: 'VERIFIED',
    },
    {
      id: 'pt_deduct_001',
      date: '18 Aug 2026',
      time: '08:00 AM',
      trainer: 'Rajesh Poojary',
      workoutFocus: 'Initial Postural Assessment & Movement Screen',
      sessionsDeducted: 1,
      balanceAfter: 11,
      status: 'VERIFIED',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[var(--line)] pb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#34D399]" />
          <h2 className="text-xl font-bold text-white font-display">
            PT Balance & Deduction Ledger
          </h2>
        </div>
        <p className="text-xs text-[var(--muted)] mt-0.5">
          Dual-signed, immutable session ledger. Always synchronized between member and trainer (§8.7).
        </p>
      </div>

      {/* Balance Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 border-[rgba(52,211,153,0.3)] bg-gradient-to-br from-[var(--surface)] to-[rgba(52,211,153,0.06)]">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#34D399] font-medium">
            Sessions Remaining
          </span>
          <div className="text-3xl sm:text-4xl font-extrabold text-white font-martian mt-1">
            {remainingSessions}{' '}
            <span className="text-sm font-normal text-[var(--muted)]">/ {totalSessions}</span>
          </div>
          <p className="text-[11px] text-[var(--muted)] mt-1">
            {totalSessions - remainingSessions} sessions delivered & signed off
          </p>
        </Card>

        <Card className="p-5 border-[var(--line)]">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--muted)]">
            Personal Trainer
          </span>
          <div className="text-lg font-bold text-white font-display mt-1 flex items-center gap-2">
            <User className="w-4 h-4 text-[#60A5FA]" />
            {trainerName}
          </div>
          <p className="text-[11px] text-[var(--muted)] mt-1">
            Performance Specialist · Reformer & Strength Lead
          </p>
        </Card>

        <Card className="p-5 border-[var(--line)]">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--muted)]">
            Tier & Entitlement
          </span>
          <div className="text-sm font-bold text-white mt-1">
            {ptTier}
          </div>
          <p className="text-[11px] text-[var(--muted)] mt-1">
            1-on-1 Dedicated Studio Sessions
          </p>
        </Card>
      </div>

      {/* Immutable Ledger Table */}
      <Card className="p-5 sm:p-6 border-[var(--line)] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-white font-display flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-[#60A5FA]" />
              Immutable Deduction History
            </h4>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Cryptographically verified sign-offs generated upon each completed session
            </p>
          </div>

          <span className="text-xs px-2.5 py-1 rounded-full bg-[rgba(59,130,246,0.15)] text-[#60A5FA] border border-[rgba(59,130,246,0.3)] font-mono">
            Ledger Verified
          </span>
        </div>

        <div className="divide-y divide-[var(--line)] text-xs">
          {deductionHistory.map((item) => (
            <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{item.workoutFocus}</span>
                  <span className="text-[10px] font-mono text-[var(--muted)]">
                    ({item.id})
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-[var(--muted)]">
                  <span>{item.date} at {item.time}</span>
                  <span>·</span>
                  <span>Trainer: {item.trainer}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-right shrink-0">
                <div>
                  <span className="text-xs font-bold text-[#EF4444] font-martian">
                    -{item.sessionsDeducted} Session
                  </span>
                  <div className="text-[10px] text-[var(--muted)] font-mono">
                    Balance: {item.balanceAfter}
                  </div>
                </div>

                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(52,211,153,0.1)] text-[#34D399] border border-[rgba(52,211,153,0.2)] font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Signed
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
