'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ArrowLeft, Dumbbell, Utensils, Printer,
  CheckCircle, Plus, Edit2, Flame, HeartPulse,
} from 'lucide-react'
import GlassCard from '@/components/app/ui/glass-card'
import StatCard from '@/components/app/ui/stat-card'
import { Button } from '@/components/app/ui/button'
import { StatusPill } from '@/components/app/ui/badge'
import {
  getTrainerClients,
  getClientProgram,
  getClientNutrition,
  getStoredPTSessions,
} from '@/lib/trainers'
import { formatINR, formatDateTime, getInitials } from '@/lib/utils'
import type { PTClient } from '@/types/trainer'

export default function ClientDetailPage() {
  const params = useParams()
  const clientId = params?.id as string

  const [client, setClient] = useState<PTClient | null>(() => {
    const clients = getTrainerClients()
    return clients.find((c) => c.id === clientId) || null
  })

  useEffect(() => {
    const clients = getTrainerClients()
    setClient(clients.find((c) => c.id === clientId) || null)
  }, [clientId])

  if (!client) {
    return (
      <div className="space-y-4 max-w-4xl py-12 text-center">
        <h2 className="font-display text-xl font-semibold text-[var(--app-text-primary)]">
          Client Record Not Found
        </h2>
        <p className="text-xs text-[var(--app-text-muted)]">
          The requested PT client does not exist or has been removed.
        </p>
        <Link href="/schedule">
          <Button variant="secondary" icon={<ArrowLeft className="w-4 h-4" />}>
            Back to Schedule
          </Button>
        </Link>
      </div>
    )
  }

  const program = getClientProgram(client.id)
  const nutrition = getClientNutrition(client.id)
  const allSessions = getStoredPTSessions().filter((s) => s.clientId === client.id)

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/schedule"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--app-text-muted)] hover:text-[var(--app-text-secondary)] transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Trainer Schedule
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--app-text-primary)] tracking-tight">
              {client.name} — Programming & Nutrition
            </h1>
            <StatusPill status="success">{client.primaryGoal}</StatusPill>
          </div>
          <p className="text-xs text-[var(--app-text-muted)] font-mono mt-1">
            {client.memberCode} · {client.phone} · {client.planName}
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={() => window.print()}
          icon={<Printer className="w-4 h-4" />}
        >
          Print Routine
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="PT Sessions Remaining"
          value={client.ptSessionsRemaining}
          suffix={` / ${client.ptSessionsTotal}`}
          icon={<Dumbbell className="w-5 h-5 text-[var(--aurora-1)]" />}
        />
        <StatCard
          label="Current Weight"
          value={client.currentWeightKg}
          suffix=" kg"
          icon={<HeartPulse className="w-5 h-5 text-[var(--app-success)]" />}
        />
        <StatCard
          label="Body Fat %"
          value={client.bodyFatPct}
          suffix="%"
          icon={<Flame className="w-5 h-5 text-[var(--app-warning)]" />}
        />
        <StatCard
          label="Completed Sessions"
          value={allSessions.length}
          suffix=" logs"
          icon={<CheckCircle className="w-5 h-5 text-[var(--app-info)]" />}
        />
      </div>

      {/* Workout Routine Card */}
      {program && (
        <GlassCard padding="lg" className="space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--app-glass-border)] pb-3">
            <div>
              <h3 className="font-display text-base font-semibold text-[var(--app-text-primary)]">
                {program.title}
              </h3>
              <p className="text-xs text-[var(--app-text-muted)]">
                {program.splitType} Split · {program.weeksCount} Weeks Duration · Coach: {program.trainerName}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {program.days.map((day) => (
              <div key={day.id} className="p-4 rounded-xl glass-input space-y-3">
                <div className="flex items-center justify-between border-b border-[var(--app-glass-border)] pb-2">
                  <h4 className="font-semibold text-xs text-[var(--app-text-primary)]">{day.dayName}</h4>
                  <span className="text-[0.6875rem] text-[var(--app-text-muted)]">{day.focus}</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-[0.625rem] uppercase tracking-wider text-[var(--app-text-muted)] border-b border-[var(--app-glass-border)]">
                        <th className="py-2 px-1">Exercise</th>
                        <th className="py-2 px-1 text-center">Sets</th>
                        <th className="py-2 px-1 text-center">Reps</th>
                        <th className="py-2 px-1 text-center">Target (kg)</th>
                        <th className="py-2 px-1 text-center">Rest</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--app-glass-border)] font-mono">
                      {day.exercises.map((ex) => (
                        <tr key={ex.id}>
                          <td className="py-2.5 px-1 font-sans font-medium text-[var(--app-text-primary)]">
                            {ex.name}
                            {ex.notes && <span className="block text-[0.625rem] text-[var(--app-text-muted)] font-normal">{ex.notes}</span>}
                          </td>
                          <td className="py-2.5 px-1 text-center">{ex.sets}</td>
                          <td className="py-2.5 px-1 text-center">{ex.reps}</td>
                          <td className="py-2.5 px-1 text-center font-bold text-[var(--aurora-1)]">{ex.weightKg} kg</td>
                          <td className="py-2.5 px-1 text-center text-[var(--app-text-muted)]">{ex.restSeconds}s</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Nutrition Plan Card */}
      {nutrition && (
        <GlassCard padding="lg" className="space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--app-glass-border)] pb-3">
            <h3 className="font-display text-base font-semibold text-[var(--app-text-primary)]">
              Daily Nutrition Protocol & Macros
            </h3>
            <span className="font-mono font-bold text-xs text-[var(--aurora-1)]">
              {nutrition.dailyCalories} kcal / day
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 p-4 rounded-xl glass-input text-center text-xs">
            <div>
              <span className="text-[0.625rem] uppercase text-[var(--app-text-muted)] block">Protein</span>
              <span className="font-bold text-base text-[var(--app-success)]">{nutrition.proteinGrams}g</span>
            </div>
            <div>
              <span className="text-[0.625rem] uppercase text-[var(--app-text-muted)] block">Carbs</span>
              <span className="font-bold text-base text-[var(--aurora-1)]">{nutrition.carbsGrams}g</span>
            </div>
            <div>
              <span className="text-[0.625rem] uppercase text-[var(--app-text-muted)] block">Fats</span>
              <span className="font-bold text-base text-[var(--app-warning)]">{nutrition.fatsGrams}g</span>
            </div>
          </div>

          <div className="space-y-2">
            {nutrition.meals.map((meal) => (
              <div key={meal.id} className="p-3 rounded-xl glass-input text-xs space-y-1">
                <div className="flex justify-between font-semibold">
                  <span className="text-[var(--app-text-primary)]">{meal.name}</span>
                  <span className="font-mono text-[var(--aurora-1)]">{meal.time} IST · {meal.calories} kcal</span>
                </div>
                <p className="text-[var(--app-text-secondary)]">{meal.foods}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  )
}
