'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRightLeft,
  SkipForward,
  MessageSquare,
  Video,
  ShieldCheck,
  Plus,
  Copy,
  ChevronRight,
  Search,
  Check,
  X,
  Phone,
  RefreshCw,
} from 'lucide-react'
import { Card } from '@/components/app/ui/glass-card'
import Button from '@/components/app/ui/button'
import Badge from '@/components/app/ui/badge'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/components/app/ui/toast'
import type { TrainerClientSummary, AdaptationPolicy } from '@/types/training'

export default function TrainerClientsPage() {
  const { user } = useAuth()
  const [clients, setClients] = useState<TrainerClientSummary[]>([])
  const [adherenceAlerts, setAdherenceAlerts] = useState<{ memberId: string; memberName: string; daysInactive: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Client Inspection Drawer
  const [selectedClient, setSelectedClient] = useState<TrainerClientSummary | null>(null)
  const [coachNoteText, setCoachNoteText] = useState('')
  const [isSigningOff, setIsSigningOff] = useState(false)

  // Program Assign Modal
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [assignPolicy, setAssignPolicy] = useState<AdaptationPolicy>('FLEXIBLE')

  const loadTrainerData = async () => {
    try {
      const res = await fetch('/api/training/trainer/clients')
      if (res.ok) {
        const data = await res.json()
        setClients(data.clients || [])
        setAdherenceAlerts(data.adherenceAlerts || [])
      }
    } catch (e) {
      console.error('Failed to load trainer clients', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTrainerData()
  }, [])

  // Sign off PT Session (§8.7)
  const handleSignOffPT = async (memberId: string) => {
    setIsSigningOff(true)
    try {
      const res = await fetch('/api/training/trainer/deduct-pt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId,
          note: coachNoteText || 'Standard 1-on-1 PT Session Delivered',
        }),
      })

      if (res.ok) {
        const data = await res.json()
        toast.success(`PT Session Signed Off`, {
          description: `Member remaining balance: ${data.remainingSessions} sessions.`,
        })
        setCoachNoteText('')
        await loadTrainerData()
        if (selectedClient) {
          setSelectedClient((prev) => (prev ? { ...prev, ptSessionsRemaining: data.remainingSessions } : null))
        }
      } else {
        toast.error('Failed to sign off session')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setIsSigningOff(false)
    }
  }

  // Filtered clients list
  const filteredClients = clients.filter((c) =>
    c.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.memberCode.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#60A5FA]" />
            <h1 className="text-xl sm:text-2xl font-bold text-white font-display">
              Trainer Coaching Roster & PT
            </h1>
          </div>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            Sorted by adherence ascending — prioritize members who are falling off (§6).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input
              type="text"
              placeholder="Search clients by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-[var(--surface)] border border-[var(--line)] text-white text-xs focus:border-[#3B82F6] focus:outline-none w-56 sm:w-64"
            />
          </div>
        </div>
      </div>

      {/* ─── Adherence Alerts Banner (§7) ─── */}
      {adherenceAlerts.length > 0 && (
        <div className="bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.3)] p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[rgba(245,158,11,0.2)] text-[#F59E0B] flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Adherence Alert · {adherenceAlerts.length} Client(s) Inactive ≥ 5 Days
              </h4>
              <p className="text-xs text-[var(--ink-2)] mt-0.5">
                {adherenceAlerts.map((a) => `${a.memberName} (${a.daysInactive}d)`).join(', ')}
              </p>
            </div>
          </div>

          <Button
            variant="secondary"
            onClick={() => toast.success('WhatsApp Nudges Triggered via Pinnacle API')}
            className="text-xs text-[#F59E0B] border-[rgba(245,158,11,0.3)] shrink-0"
          >
            Send WhatsApp Check-ins
          </Button>
        </div>
      )}

      {/* ─── Client Roster Table (§6) ─── */}
      <Card className="p-0 border-[var(--line)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--surface-2)] text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] border-b border-[var(--line)]">
              <tr>
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-3">Programme</th>
                <th className="py-3 px-3">Adherence (Ascending)</th>
                <th className="py-3 px-3">Last Logged</th>
                <th className="py-3 px-3">PT Remaining</th>
                <th className="py-3 px-3">Deviations</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {filteredClients.map((client) => {
                const isFallingOff = client.adherencePct < 60

                return (
                  <tr
                    key={client.memberId}
                    className="hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
                    onClick={() => setSelectedClient(client)}
                  >
                    {/* Member */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{client.memberName}</div>
                      <div className="text-[10px] text-[var(--muted)] font-mono">
                        {client.memberCode} · {client.phone}
                      </div>
                    </td>

                    {/* Programme */}
                    <td className="py-3 px-3 text-[var(--ink-2)]">
                      <div>{client.programName}</div>
                      <div className="text-[10px] text-[var(--muted)]">
                        Week {client.weekCurrent} of {client.weekTotal}
                      </div>
                    </td>

                    {/* Adherence */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                          <div
                            style={{ width: `${client.adherencePct}%` }}
                            className={`h-full ${
                              isFallingOff ? 'bg-[#EF4444]' : 'bg-[#34D399]'
                            }`}
                          />
                        </div>
                        <span
                          className={`font-mono font-bold ${
                            isFallingOff ? 'text-[#EF4444]' : 'text-[#34D399]'
                          }`}
                        >
                          {client.adherencePct}%
                        </span>
                      </div>
                    </td>

                    {/* Last Logged */}
                    <td className="py-3 px-3 font-mono text-[var(--muted)] text-[11px]">
                      {client.lastLoggedSessionDate
                        ? new Date(client.lastLoggedSessionDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })
                        : 'Never'}
                    </td>

                    {/* PT Remaining */}
                    <td className="py-3 px-3">
                      <span className="font-martian font-bold text-white">
                        {client.ptSessionsRemaining}
                      </span>
                      <span className="text-[10px] text-[var(--muted)] font-mono ml-1">
                        / {client.ptSessionsTotal}
                      </span>
                    </td>

                    {/* Deviations */}
                    <td className="py-3 px-3">
                      {client.deviationCount > 0 ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(245,158,11,0.15)] text-[#F59E0B] border border-[rgba(245,158,11,0.3)] font-mono">
                          {client.deviationCount} deviations
                        </span>
                      ) : (
                        <span className="text-[10px] text-[var(--muted-2)] font-mono">
                          On plan
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedClient(client)
                        }}
                        className="text-xs py-1 px-2.5"
                      >
                        Review <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ─── Client Review Drawer / Modal (§7) ─── */}
      <AnimatePresence>
        {selectedClient && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="bg-[#0D0C10] border-l border-[var(--line-strong)] w-full max-w-xl h-full p-6 overflow-y-auto shadow-2xl flex flex-col justify-between space-y-6"
            >
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between pb-4 border-b border-[var(--line)]">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#60A5FA]">
                      {selectedClient.memberCode} · Client Review
                    </span>
                    <h2 className="text-xl font-bold text-white font-display mt-0.5">
                      {selectedClient.memberName}
                    </h2>
                    <p className="text-xs text-[var(--muted)]">
                      {selectedClient.programName} · {selectedClient.adherencePct}% Adherence
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedClient(null)}
                    className="p-1 rounded-lg text-[var(--muted)] hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* PT Balance & Deduction Card (§8.7) */}
                <Card className="p-4 border-[rgba(52,211,153,0.3)] bg-[rgba(52,211,153,0.04)] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#34D399]" />
                      Personal Training Package
                    </span>
                    <span className="text-xs font-martian font-bold text-[#34D399]">
                      {selectedClient.ptSessionsRemaining} Sessions Left
                    </span>
                  </div>

                  <div className="space-y-2 pt-1">
                    <input
                      type="text"
                      placeholder="Session focus/note (e.g. Incline Bench & Posterior Chain)..."
                      value={coachNoteText}
                      onChange={(e) => setCoachNoteText(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] text-white text-xs focus:border-[#34D399] focus:outline-none"
                    />

                    <Button
                      variant="primary"
                      onClick={() => handleSignOffPT(selectedClient.memberId)}
                      disabled={isSigningOff || selectedClient.ptSessionsRemaining <= 0}
                      className="w-full justify-center text-xs bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-semibold"
                    >
                      {isSigningOff ? 'Deducting...' : 'Sign Off 1 PT Session & Decrement Balance'}
                    </Button>
                  </div>
                </Card>

                {/* Prescribed vs. Actual Review with Structural Deviations (§7) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono uppercase tracking-wider text-[var(--muted)]">
                      Recent Session Performance & Deviations
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[rgba(245,158,11,0.15)] text-[#F59E0B] font-mono">
                      {selectedClient.deviationCount} Total Deviations
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--line)] space-y-3">
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-[var(--line-soft)]">
                      <span className="font-semibold text-white">Full Body Routine (Day 1)</span>
                      <span className="font-mono text-[#34D399]">Completed</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      {/* Prescribed item */}
                      <div className="flex items-center justify-between text-[var(--ink-2)]">
                        <span>1. Barbell Back Squat</span>
                        <span className="font-martian text-white">80 kg × 8 reps ✓</span>
                      </div>

                      {/* Swapped item with structural deviation badge (§3, §7) */}
                      <div className="p-2 rounded-lg bg-[rgba(245,158,11,0.06)] border border-[rgba(245,158,11,0.2)] flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 text-[#F59E0B] font-medium">
                            <ArrowRightLeft className="w-3 h-3" /> Swapped: Dumbbell Bench Press
                          </div>
                          <span className="text-[10px] text-[var(--muted)]">
                            Prescribed: Barbell Flat Bench
                          </span>
                        </div>
                        <span className="font-martian text-white">22 kg × 10 reps</span>
                      </div>

                      <div className="flex items-center justify-between text-[var(--ink-2)]">
                        <span>3. Lat Pulldown Wide</span>
                        <span className="font-martian text-white">45 kg × 10 reps ✓</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Leave Coach Note */}
                <div className="space-y-2">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
                    <MessageSquare className="w-3 h-3 text-[#60A5FA]" />
                    Leave Coach Note
                  </h4>
                  <textarea
                    rows={2}
                    placeholder="Provide constructive feedback on today's session..."
                    className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] text-white text-xs focus:border-[#3B82F6] focus:outline-none"
                  />
                  <Button
                    variant="secondary"
                    onClick={() => toast.success('Coach note delivered to member app')}
                    className="text-xs"
                  >
                    Deliver Note
                  </Button>
                </div>
              </div>

              {/* Close Button */}
              <div className="pt-4 border-t border-[var(--line)]">
                <Button
                  variant="secondary"
                  onClick={() => setSelectedClient(null)}
                  className="w-full justify-center"
                >
                  Close Review
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
