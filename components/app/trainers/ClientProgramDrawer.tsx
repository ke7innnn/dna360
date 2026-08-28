'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Dumbbell, Utensils, Calendar, Activity,
  CheckCircle, Plus, Edit2, Flame, HeartPulse,
  Clock, ShieldCheck, Sparkles, ExternalLink,
} from 'lucide-react'
import { Drawer } from '@/components/app/ui/drawer'
import { Button } from '@/components/app/ui/button'
import { StatusPill } from '@/components/app/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/app/ui/tabs'
import ProgramBuilderModal from '@/components/app/trainers/ProgramBuilderModal'
import LogSessionModal from '@/components/app/trainers/LogSessionModal'
import {
  getClientProgram,
  getClientNutrition,
  getStoredPTSessions,
} from '@/lib/trainers'
import { formatINR, formatDateTime, getInitials } from '@/lib/utils'
import type { PTClient, WorkoutProgram, NutritionPlan } from '@/types/trainer'

export default function ClientProgramDrawer({
  client,
  open,
  onOpenChange,
  onUpdated,
}: {
  client: PTClient | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated?: () => void
}) {
  const [activeTab, setActiveTab] = useState('workout')
  const [builderOpen, setBuilderOpen] = useState(false)
  const [logModalOpen, setLogModalOpen] = useState(false)

  if (!client) return null

  const program = getClientProgram(client.id)
  const nutrition = getClientNutrition(client.id)
  const allSessions = getStoredPTSessions().filter((s) => s.clientId === client.id)

  return (
    <>
      <Drawer
        open={open}
        onOpenChange={onOpenChange}
        title={client.name}
        description={`PT Client: ${client.memberCode} · ${client.primaryGoal}`}
        size="lg"
      >
        <div className="space-y-6">
          {/* Header Client Snapshot */}
          <div className="p-4 rounded-2xl glass-card border border-[var(--aurora-1)]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--aurora-1)] to-[var(--aurora-2)] flex items-center justify-center text-white font-display text-lg font-bold shadow-lg shadow-[var(--aurora-1)]/20 shrink-0">
                {getInitials(client.name)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-base font-semibold text-[var(--app-text-primary)]">
                    {client.name}
                  </h3>
                  <StatusPill status="success">{client.primaryGoal}</StatusPill>
                </div>
                <p className="text-xs text-[var(--app-text-muted)] mt-0.5 font-mono">
                  {client.phone} · Weight: {client.currentWeightKg} kg ({client.bodyFatPct}% BF)
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setLogModalOpen(true)}
                icon={<CheckCircle className="w-3.5 h-3.5" />}
              >
                Log PT Session
              </Button>
              <Link href={`/trainers/clients/${client.id}`}>
                <Button variant="ghost" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                  Full Sheet
                </Button>
              </Link>
            </div>
          </div>

          {/* Session Allowance Countdown Bar */}
          <div className="p-4 rounded-xl glass-input space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[var(--app-text-primary)]">
                Personal Training Allowance
              </span>
              <span className="font-mono font-bold text-[var(--aurora-1)]">
                {client.ptSessionsRemaining} of {client.ptSessionsTotal} sessions available
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[var(--app-glass-bg)] overflow-hidden border border-[var(--app-glass-border)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--aurora-1)] to-[var(--aurora-2)] transition-all duration-500"
                style={{ width: `${(client.ptSessionsRemaining / client.ptSessionsTotal) * 100}%` }}
              />
            </div>
          </div>

          {/* Multi-Tab Workspace */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-4 glass-input p-1">
              <TabsTrigger value="workout">Workout Split</TabsTrigger>
              <TabsTrigger value="nutrition">Nutrition & Macros</TabsTrigger>
              <TabsTrigger value="sessions">Session Log ({allSessions.length})</TabsTrigger>
              <TabsTrigger value="inbody">InBody Progress</TabsTrigger>
            </TabsList>

            {/* TAB 1: Workout Split */}
            <TabsContent value="workout" className="space-y-4 pt-4">
              {program ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-display text-sm font-semibold text-[var(--app-text-primary)]">
                        {program.title}
                      </h4>
                      <p className="text-xs text-[var(--app-text-muted)]">
                        {program.splitType} Split · {program.weeksCount} Weeks Duration
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setBuilderOpen(true)}
                      icon={<Edit2 className="w-3.5 h-3.5" />}
                    >
                      Edit Split
                    </Button>
                  </div>

                  {/* Day by day routines */}
                  <div className="space-y-4">
                    {program.days.map((day) => (
                      <div key={day.id} className="p-4 rounded-xl glass-card border border-[var(--app-glass-border)] space-y-3">
                        <div className="flex items-center justify-between border-b border-[var(--app-glass-border)] pb-2">
                          <h5 className="font-semibold text-xs text-[var(--app-text-primary)]">
                            {day.dayName}
                          </h5>
                          <span className="text-[0.625rem] text-[var(--app-text-muted)]">{day.focus}</span>
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
                            <tbody className="divide-y divide-[var(--app-glass-border)] font-mono text-xs">
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
                </div>
              ) : (
                <div className="p-6 rounded-xl glass-input text-center text-xs text-[var(--app-text-muted)] space-y-3">
                  <p>No active workout program assigned.</p>
                  <Button variant="primary" size="sm" onClick={() => setBuilderOpen(true)}>
                    Build Workout Program
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* TAB 2: Nutrition & Macros */}
            <TabsContent value="nutrition" className="space-y-4 pt-4">
              {nutrition ? (
                <div className="space-y-4">
                  {/* Caloric & Macro Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl glass-card border border-[var(--aurora-1)]/20 text-center">
                    <div>
                      <span className="text-[0.625rem] uppercase text-[var(--app-text-muted)] block">Daily Calorie Target</span>
                      <span className="font-display text-xl font-bold text-[var(--app-text-primary)]">{nutrition.dailyCalories} kcal</span>
                    </div>
                    <div>
                      <span className="text-[0.625rem] uppercase text-[var(--app-text-muted)] block">Protein Target</span>
                      <span className="font-display text-xl font-bold text-[var(--app-success)]">{nutrition.proteinGrams}g</span>
                    </div>
                    <div>
                      <span className="text-[0.625rem] uppercase text-[var(--app-text-muted)] block">Carbohydrates</span>
                      <span className="font-display text-xl font-bold text-[var(--aurora-1)]">{nutrition.carbsGrams}g</span>
                    </div>
                    <div>
                      <span className="text-[0.625rem] uppercase text-[var(--app-text-muted)] block">Healthy Fats</span>
                      <span className="font-display text-xl font-bold text-[var(--app-warning)]">{nutrition.fatsGrams}g</span>
                    </div>
                  </div>

                  {/* Meal Timing */}
                  <div className="space-y-2">
                    <h5 className="font-semibold text-xs uppercase tracking-wider text-[var(--app-text-muted)]">
                      Structured Meal Plan
                    </h5>
                    <div className="space-y-2">
                      {nutrition.meals.map((meal) => (
                        <div key={meal.id} className="p-3 rounded-xl glass-input text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[var(--app-text-primary)]">{meal.name}</span>
                            <span className="font-mono text-[var(--aurora-1)]">{meal.time} IST · {meal.calories} kcal</span>
                          </div>
                          <p className="text-[var(--app-text-secondary)]">{meal.foods}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Supplement Protocol */}
                  {nutrition.supplements.length > 0 && (
                    <div className="p-4 rounded-xl bg-[var(--app-glass-bg)] border border-[var(--app-glass-border)] text-xs space-y-2">
                      <span className="font-semibold uppercase tracking-wider text-[var(--app-text-muted)] block text-[0.625rem]">
                        Daily Supplement Protocol
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {nutrition.supplements.map((sup, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-full bg-[var(--app-glass-bg)] border border-[var(--app-glass-border)] text-[var(--app-text-secondary)] text-[0.6875rem]">
                            {sup}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[var(--app-text-muted)] text-center py-6">
                  No nutrition protocol assigned yet.
                </p>
              )}
            </TabsContent>

            {/* TAB 3: Session Consumption Log */}
            <TabsContent value="sessions" className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <h5 className="font-semibold text-xs uppercase tracking-wider text-[var(--app-text-muted)]">
                  Completed 1-on-1 Sessions
                </h5>
                <Button variant="primary" size="sm" onClick={() => setLogModalOpen(true)} icon={<Plus className="w-3.5 h-3.5" />}>
                  Log Session
                </Button>
              </div>

              {allSessions.length > 0 ? (
                <div className="space-y-2.5">
                  {allSessions.map((log) => (
                    <div key={log.id} className="p-3.5 rounded-xl glass-card border border-[var(--app-glass-border)] text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[var(--aurora-1)] font-semibold">{log.date}</span>
                          <span className="text-[var(--app-text-muted)]">·</span>
                          <span className="font-semibold text-[var(--app-text-primary)]">{log.workoutFocus}</span>
                        </div>
                        <span className="font-mono font-bold text-[var(--app-success)] text-xs">
                          {formatINR(log.commissionEarnedMinor)} Comm.
                        </span>
                      </div>
                      {log.clientFeedback && (
                        <p className="text-[var(--app-text-secondary)] text-[0.6875rem] leading-relaxed italic bg-[var(--app-glass-bg)] p-2 rounded-lg">
                          "{log.clientFeedback}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[var(--app-text-muted)] text-center py-6 glass-input rounded-xl">
                  No PT sessions logged yet for this client.
                </p>
              )}
            </TabsContent>

            {/* TAB 4: InBody Composition Progress */}
            <TabsContent value="inbody" className="space-y-4 pt-4">
              <div className="rounded-xl glass-card overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[var(--app-glass-bg)] border-b border-[var(--app-glass-border)] text-[var(--app-text-muted)]">
                    <tr>
                      <th className="p-3">Scan Date</th>
                      <th className="p-3">Weight (kg)</th>
                      <th className="p-3">Body Fat %</th>
                      <th className="p-3">Muscle Mass</th>
                      <th className="p-3">BMI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--app-glass-border)] font-mono">
                    <tr>
                      <td className="p-3 font-semibold text-[var(--app-text-primary)]">2026-08-20</td>
                      <td className="p-3 font-bold text-[var(--aurora-1)]">78.5 kg</td>
                      <td className="p-3 text-[var(--app-success)]">14.8%</td>
                      <td className="p-3">37.2 kg</td>
                      <td className="p-3">23.4</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-[var(--app-text-muted)]">2026-07-15</td>
                      <td className="p-3">80.2 kg</td>
                      <td className="p-3">16.2%</td>
                      <td className="p-3">36.5 kg</td>
                      <td className="p-3">23.9</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Drawer>

      {/* Program Builder Modal */}
      <ProgramBuilderModal
        client={client}
        program={program}
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        onSaved={onUpdated}
      />

      {/* Log Session Modal */}
      <LogSessionModal
        client={client}
        open={logModalOpen}
        onOpenChange={setLogModalOpen}
        onSessionLogged={onUpdated}
      />
    </>
  )
}
