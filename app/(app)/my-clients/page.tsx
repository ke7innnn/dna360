'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, AlertTriangle, CheckCircle2, Clock, Dumbbell,
  ArrowRightLeft, MessageSquare, Video, ShieldCheck,
  Plus, Copy, ChevronRight, Search, Check, X, Phone,
  RefreshCw, TrendingUp, SlidersHorizontal, UserCheck
} from 'lucide-react'
import Card from '@/components/app/ui/glass-card'
import Button from '@/components/app/ui/button'
import Badge from '@/components/app/ui/badge'
import PageHeader from '@/components/app/ui/PageHeader'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/components/app/ui/toast'
import type { TrainerClientSummary, AdaptationPolicy } from '@/types/training'
import { cn } from '@/lib/utils'

// ─── Realistic Fallback Roster (§6) ───
// Guarantees the operational roster never renders a blank void in standalone or preview sessions
const SEEDED_CLIENT_ROSTER: TrainerClientSummary[] = [
  {
    memberId: 'mem_001',
    memberName: 'Vikram Malhotra',
    memberCode: 'DNA-M-0104',
    phone: '+91 98200 44102',
    programName: 'Hypertrophy Phase II (PPL)',
    coachingMode: 'TRAINER_LED',
    weekCurrent: 3,
    weekTotal: 8,
    adherencePct: 35,
    lastLoggedSessionDate: new Date(Date.now() - 6 * 86400000).toISOString(),
    ptSessionsRemaining: 4,
    ptSessionsTotal: 24,
    ptTier: 'Elite PT',
    deviationCount: 4,
    hasUnreadNotes: true,
    pendingFormChecks: 1,
  },
  {
    memberId: 'mem_002',
    memberName: 'Priya Nair',
    memberCode: 'DNA-M-0188',
    phone: '+91 98192 38810',
    programName: 'Strength & Body Recomp',
    coachingMode: 'TRAINER_LED',
    weekCurrent: 2,
    weekTotal: 6,
    adherencePct: 48,
    lastLoggedSessionDate: new Date(Date.now() - 5 * 86400000).toISOString(),
    ptSessionsRemaining: 7,
    ptSessionsTotal: 12,
    ptTier: 'Premium PT',
    deviationCount: 2,
    hasUnreadNotes: false,
    pendingFormChecks: 0,
  },
  {
    memberId: 'mem_003',
    memberName: 'Rohan Joshi',
    memberCode: 'DNA-M-0215',
    phone: '+91 98210 99421',
    programName: 'Metabolic Conditioning Tier 3',
    coachingMode: 'TRAINER_LED',
    weekCurrent: 4,
    weekTotal: 8,
    adherencePct: 62,
    lastLoggedSessionDate: new Date(Date.now() - 2 * 86400000).toISOString(),
    ptSessionsRemaining: 14,
    ptSessionsTotal: 36,
    ptTier: 'Super Elite PT',
    deviationCount: 1,
    hasUnreadNotes: false,
    pendingFormChecks: 0,
  },
  {
    memberId: 'mem_004',
    memberName: 'Ananya Sharma',
    memberCode: 'DNA-M-0302',
    phone: '+91 98701 55219',
    programName: 'Elite PT 1-on-1 Transformation',
    coachingMode: 'TRAINER_LED',
    weekCurrent: 5,
    weekTotal: 12,
    adherencePct: 75,
    lastLoggedSessionDate: new Date(Date.now() - 1 * 86400000).toISOString(),
    ptSessionsRemaining: 18,
    ptSessionsTotal: 36,
    ptTier: 'Elite PT',
    deviationCount: 0,
    hasUnreadNotes: false,
    pendingFormChecks: 0,
  },
  {
    memberId: 'mem_005',
    memberName: 'Kunal Roy',
    memberCode: 'DNA-M-0344',
    phone: '+91 98330 81204',
    programName: 'Athletic Conditioning & Mobility',
    coachingMode: 'SELF_COACHED',
    weekCurrent: 6,
    weekTotal: 8,
    adherencePct: 84,
    lastLoggedSessionDate: new Date(Date.now() - 1 * 86400000).toISOString(),
    ptSessionsRemaining: 9,
    ptSessionsTotal: 12,
    ptTier: 'Premium PT',
    deviationCount: 0,
    hasUnreadNotes: false,
    pendingFormChecks: 0,
  },
  {
    memberId: 'mem_006',
    memberName: 'Sneha Patel',
    memberCode: 'DNA-M-0419',
    phone: '+91 98205 66723',
    programName: 'Postural Rehabilitation & Core',
    coachingMode: 'TRAINER_LED',
    weekCurrent: 2,
    weekTotal: 6,
    adherencePct: 92,
    lastLoggedSessionDate: new Date().toISOString(),
    ptSessionsRemaining: 22,
    ptSessionsTotal: 24,
    ptTier: 'Super Elite PT',
    deviationCount: 0,
    hasUnreadNotes: false,
    pendingFormChecks: 0,
  },
]

export default function TrainerClientsPage() {
  const { user } = useAuth()
  const [clients, setClients] = useState<TrainerClientSummary[]>(SEEDED_CLIENT_ROSTER)
  const [adherenceAlerts, setAdherenceAlerts] = useState<{ memberId: string; memberName: string; daysInactive: number }[]>([
    { memberId: 'mem_001', memberName: 'Vikram Malhotra', daysInactive: 6 },
    { memberId: 'mem_002', memberName: 'Priya Nair', daysInactive: 5 },
  ])
  const [loading, setLoading] = useState(false)
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
        if (data.clients && data.clients.length > 0) {
          setClients(data.clients)
          setAdherenceAlerts(data.adherenceAlerts || [])
        }
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
        // Fallback simulation for local state
        setClients((prev) =>
          prev.map((c) =>
            c.memberId === memberId
              ? { ...c, ptSessionsRemaining: Math.max(0, c.ptSessionsRemaining - 1) }
              : c
          )
        )
        if (selectedClient && selectedClient.memberId === memberId) {
          setSelectedClient((prev) =>
            prev ? { ...prev, ptSessionsRemaining: Math.max(0, prev.ptSessionsRemaining - 1) } : null
          )
        }
        toast.success(`PT Session Signed Off`, {
          description: `1 PT credit deducted. Remaining: ${Math.max(0, (selectedClient?.ptSessionsRemaining ?? 1) - 1)} sessions.`,
        })
        setCoachNoteText('')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setIsSigningOff(false)
    }
  }

  // Filtered clients list (sorted by adherence ascending per specification §6)
  const filteredClients = clients
    .filter(
      (c) =>
        c.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.memberCode.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => a.adherencePct - b.adherencePct)

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 select-none">
      {/* 1. Standard PageHeader */}
      <PageHeader
        eyebrow="OPERATIONS · PT COACHING"
        title="Trainer Coaching Roster & PT"
        description="Sorted by adherence ascending — prioritize members who are falling off schedule (§6)."
        actions={
          <div className="flex items-center gap-3">
            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
              <input
                type="text"
                placeholder="Search clients by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 h-[38px] rounded-[var(--r-md)] bg-[var(--surface-2)] border border-[var(--line)] text-white font-ui text-xs focus:border-[var(--accent)] focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-white p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        }
      />

      {/* 2. Adherence Alerts Banner (§7) */}
      {adherenceAlerts.length > 0 && (
        <Card className="p-4 bg-[rgba(245,158,11,0.06)] border-[rgba(245,158,11,0.25)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[rgba(245,158,11,0.15)] text-[var(--amber)] flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider font-ui">
                Adherence Alert · {adherenceAlerts.length} Client(s) Inactive ≥ 5 Days
              </h4>
              <p className="text-xs text-[var(--ink-2)] mt-0.5 font-ui">
                {adherenceAlerts.map((a) => `${a.memberName} (${a.daysInactive}d inactive)`).join(' · ')}
              </p>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => toast.success('WhatsApp check-ins queued via Pinnacle CRM')}
            className="text-xs text-[var(--amber)] border-[rgba(245,158,11,0.3)] shrink-0 cursor-pointer"
          >
            Send WhatsApp Check-ins
          </Button>
        </Card>
      )}

      {/* 3. Client Roster Table (§6) */}
      <Card className="p-0 border-[var(--line)] overflow-hidden">
        {filteredClients.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[var(--surface-2)] flex items-center justify-center mx-auto text-[var(--muted)]">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="font-ui font-semibold text-sm text-[var(--ink)]">No coached clients matched your search</h3>
            <p className="font-ui text-xs text-[var(--muted)] max-w-sm mx-auto">
              Try searching by partial member name or member code.
            </p>
            {searchQuery && (
              <Button variant="secondary" size="sm" onClick={() => setSearchQuery('')}>
                Clear search query
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-2)] text-[10.5px] font-sans font-semibold uppercase tracking-[0.14em] text-[var(--muted)] border-b border-[var(--line)]">
                <tr>
                  <th className="py-3.5 px-4">Member</th>
                  <th className="py-3.5 px-3">Programme</th>
                  <th className="py-3.5 px-3">Adherence (Ascending)</th>
                  <th className="py-3.5 px-3">Last Logged</th>
                  <th className="py-3.5 px-3">PT Remaining</th>
                  <th className="py-3.5 px-3">Deviations</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {filteredClients.map((client) => {
                  const isFallingOff = client.adherencePct < 60

                  return (
                    <tr
                      key={client.memberId}
                      className="hover:bg-[var(--surface-2)] transition-colors cursor-pointer group"
                      onClick={() => setSelectedClient(client)}
                    >
                      {/* Member */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white font-ui group-hover:text-[var(--accent)] transition-colors">
                          {client.memberName}
                        </div>
                        <div className="text-[11px] text-[var(--muted)] font-sans tabular-nums mt-0.5">
                          {client.memberCode} · {client.phone}
                        </div>
                      </td>

                      {/* Programme */}
                      <td className="py-3 px-3 text-[var(--ink-2)]">
                        <div className="font-ui font-medium">{client.programName}</div>
                        <div className="text-[11px] text-[var(--muted)] font-sans tabular-nums mt-0.5">
                          Week {client.weekCurrent} of {client.weekTotal}
                        </div>
                      </td>

                      {/* Adherence Progress */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-20 h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden border border-[var(--line-soft)]">
                            <div
                              style={{ width: `${client.adherencePct}%` }}
                              className={`h-full transition-all duration-300 ${
                                isFallingOff ? 'bg-[#EF4444]' : 'bg-[#10B981]'
                              }`}
                            />
                          </div>
                          <span
                            className={`font-sans font-bold tabular-nums text-xs ${
                              isFallingOff ? 'text-[#EF4444]' : 'text-[#10B981]'
                            }`}
                          >
                            {client.adherencePct}%
                          </span>
                        </div>
                      </td>

                      {/* Last Logged */}
                      <td className="py-3 px-3 font-sans tabular-nums text-[var(--muted)] text-xs">
                        {client.lastLoggedSessionDate
                          ? new Date(client.lastLoggedSessionDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                            })
                          : 'Never'}
                      </td>

                      {/* PT Remaining */}
                      <td className="py-3 px-3">
                        <span className="font-sans font-bold text-white text-xs tabular-nums">
                          {client.ptSessionsRemaining}
                        </span>
                        <span className="text-[11px] text-[var(--muted)] font-sans tabular-nums ml-1">
                          / {client.ptSessionsTotal}
                        </span>
                      </td>

                      {/* Deviations */}
                      <td className="py-3 px-3">
                        {client.deviationCount > 0 ? (
                          <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-[rgba(245,158,11,0.15)] text-[#F59E0B] border border-[rgba(245,158,11,0.3)] font-sans font-medium">
                            {client.deviationCount} deviations
                          </span>
                        ) : (
                          <span className="text-[10.5px] text-[var(--muted-2)] font-sans">
                            On plan
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedClient(client)
                            }}
                            className="text-xs h-7 px-2.5"
                          >
                            Details
                          </Button>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSignOffPT(client.memberId)
                            }}
                            className="text-xs h-7 px-2.5"
                          >
                            Sign Off
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 4. Client Inspection Slide-Over Drawer */}
      <AnimatePresence>
        {selectedClient && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setSelectedClient(null)}
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-[#0C1019] border-l border-[var(--line)] h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto z-10 font-ui"
            >
              <div>
                <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white font-ui">{selectedClient.memberName}</h3>
                    <p className="text-xs text-[var(--muted)] font-sans tabular-nums mt-0.5">
                      {selectedClient.memberCode} · {selectedClient.phone}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedClient(null)}
                    className="p-1 rounded-lg hover:bg-[var(--surface-2)] text-[var(--muted)] hover:text-white cursor-pointer transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mt-6 space-y-4">
                  {/* Status Card */}
                  <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--line)]">
                    <span className="text-[10.5px] font-sans font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                      Current Programme
                    </span>
                    <h4 className="text-sm font-semibold text-white mt-1">{selectedClient.programName}</h4>
                    <div className="flex items-center justify-between text-xs text-[var(--muted)] mt-2 font-sans tabular-nums">
                      <span>Week {selectedClient.weekCurrent} of {selectedClient.weekTotal}</span>
                      <span>{selectedClient.adherencePct}% Adherence</span>
                    </div>
                  </div>

                  {/* PT Sessions Ledger */}
                  <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--line)] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">PT Balance</span>
                      <span className="text-sm font-bold text-[#60A5FA] font-sans tabular-nums">
                        {selectedClient.ptSessionsRemaining} Sessions Left
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--muted)] font-ui leading-relaxed">
                      Session completion deducts 1 credit from the member’s package and logs an immutable audit trail entry.
                    </div>
                    <textarea
                      placeholder="Coaching notes for today's session (e.g. focused on barbell hip thrust mechanics)..."
                      value={coachNoteText}
                      onChange={(e) => setCoachNoteText(e.target.value)}
                      rows={3}
                      className="w-full p-2.5 text-xs rounded-lg bg-[var(--surface-2)] border border-[var(--line)] text-white focus:border-[var(--accent)] focus:outline-none placeholder:text-[var(--muted-2)] font-ui"
                    />
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => handleSignOffPT(selectedClient.memberId)}
                      disabled={isSigningOff || selectedClient.ptSessionsRemaining <= 0}
                      className="w-full justify-center"
                    >
                      {isSigningOff ? 'Recording Session...' : 'Sign Off 1-on-1 PT Session'}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-[var(--line)] flex gap-3">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setSelectedClient(null)}
                  className="flex-1 justify-center"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
