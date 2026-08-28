'use client'

import React, { useState } from 'react'
import { CheckCircle, Dumbbell, Star, MessageSquare } from 'lucide-react'
import { Modal } from '@/components/app/ui/modal'
import { Button } from '@/components/app/ui/button'
import { Input } from '@/components/app/ui/input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/app/ui/select'
import { logPTSession, getTrainerClients } from '@/lib/trainers'
import { formatINR } from '@/lib/utils'
import type { PTClient } from '@/types/trainer'
import { toast } from '@/components/app/ui/toast'
import { cn } from '@/lib/utils'

export default function LogSessionModal({
  client: initialClient,
  open,
  onOpenChange,
  onSessionLogged,
}: {
  client: PTClient | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSessionLogged?: () => void
}) {
  const clients = getTrainerClients()
  const [selectedClientId, setSelectedClientId] = useState(initialClient?.id || clients[0]?.id || '')
  const [workoutFocus, setWorkoutFocus] = useState('Upper Body Incline Pressing & Triceps')
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [rating, setRating] = useState(5)
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(false)

  const selectedClient = clients.find((c) => c.id === selectedClientId) || initialClient

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClient) return

    setLoading(true)

    const log = logPTSession({
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      trainerId: 'usr_trainer_01',
      trainerName: 'Rajesh Poojary',
      workoutFocus: workoutFocus.trim(),
      durationMinutes,
      rating,
      clientFeedback: feedback.trim() || undefined,
    })

    setLoading(false)
    toast.success(`PT Session Logged for ${selectedClient.name}`, {
      description: `Deducted 1 session. ₹800 commission credited to ledger.`,
    })

    if (onSessionLogged) onSessionLogged()
    onOpenChange(false)
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Log Completed 1-on-1 PT Session"
      description="Record workout focus, rate client exertion, and credit commission."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Client Selection */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--app-text-secondary)]">Client</label>
          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
            <SelectContent>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} ({c.ptSessionsRemaining} of {c.ptSessionsTotal} sessions left)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Workout Focus */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--app-text-secondary)]">Workout Focus / Muscle Group</label>
          <Select value={workoutFocus} onValueChange={setWorkoutFocus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Upper Body Incline Pressing & Triceps">Upper Body Incline Pressing & Triceps</SelectItem>
              <SelectItem value="Back Thickness & Heavy T-Bar Rows">Back Thickness & Heavy T-Bar Rows</SelectItem>
              <SelectItem value="Squats & Hamstring Hypertrophy">Squats & Hamstring Hypertrophy</SelectItem>
              <SelectItem value="Functional Conditioning & Core Circuit">Functional Conditioning & Core Circuit</SelectItem>
              <SelectItem value="Mobility & Postural Rehab">Mobility & Postural Rehab</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--app-text-secondary)]">Session Duration</label>
            <Select value={String(durationMinutes)} onValueChange={(val) => setDurationMinutes(Number(val))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="45">45 Minutes</SelectItem>
                <SelectItem value="60">60 Minutes (Standard)</SelectItem>
                <SelectItem value="75">75 Minutes</SelectItem>
                <SelectItem value="90">90 Minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--app-text-secondary)]">Client Performance Rating</label>
            <div className="flex items-center gap-1 h-10 px-3 glass-input rounded-xl">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={cn(
                      'w-4 h-4',
                      star <= rating ? 'text-[var(--app-warning)] fill-[var(--app-warning)]' : 'text-[var(--app-text-muted)]'
                    )}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        <Input
          label="Coach Session Notes / PRs / Technique Feedback"
          placeholder="e.g. Hit 75kg on incline bench with solid 3s eccentric tempo. Form intact."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
        />

        {/* Commission & Ledger Notice */}
        <div className="p-3.5 rounded-xl glass-card text-xs font-mono border border-[var(--app-success)]/20 space-y-1">
          <div className="flex justify-between text-[var(--app-text-secondary)]">
            <span>Remaining Client Package:</span>
            <span className="font-bold text-[var(--app-text-primary)]">
              {selectedClient ? selectedClient.ptSessionsRemaining - 1 : 0} sessions
            </span>
          </div>
          <div className="flex justify-between text-[var(--app-success)] font-bold">
            <span>Trainer Commission Credited:</span>
            <span>+₹800 (Accrued MTD)</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--app-glass-border)]">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading} icon={<CheckCircle className="w-4 h-4" />}>
            Confirm & Log PT Session
          </Button>
        </div>
      </form>
    </Modal>
  )
}
