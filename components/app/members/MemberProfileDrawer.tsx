'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  User, Mail, Phone, Calendar, ShieldCheck, HeartPulse,
  CreditCard, Flame, Activity, Clock, FileText, Send,
  Snowflake, RefreshCw, ExternalLink, Plus, MapPin, Building2,
  AlertTriangle, Dumbbell, Sparkles, Check, X,
} from 'lucide-react'
import { Drawer } from '@/components/app/ui/drawer'
import { Button } from '@/components/app/ui/button'
import { StatusPill } from '@/components/app/ui/badge'
import { Input } from '@/components/app/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/app/ui/tabs'
import RenewMemberModal from '@/components/app/members/RenewMemberModal'
import { addStaffNote, blacklistMember, unblacklistMember } from '@/lib/members'
import { formatINR } from '@/lib/gst'
import { formatDateTime, getInitials } from '@/lib/utils'
import type { Member, MemberStatus } from '@/types/member'
import { toast } from '@/components/app/ui/toast'
import { cn } from '@/lib/utils'

export default function MemberProfileDrawer({
  member,
  open,
  onOpenChange,
  onMemberUpdated,
}: {
  member: Member | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onMemberUpdated?: () => void
}) {
  const [activeTab, setActiveTab] = useState('overview')
  const [newNoteContent, setNewNoteContent] = useState('')
  const [newNoteType, setNewNoteType] = useState<'general' | 'call' | 'followup' | 'warning'>('general')
  const [renewModalOpen, setRenewModalOpen] = useState(false)

  if (!member) return null

  const statusMap: Record<MemberStatus, { status: 'success' | 'warning' | 'danger' | 'info' | 'neutral'; label: string }> = {
    active: { status: 'success', label: 'Active Member' },
    expiring_soon: { status: 'warning', label: 'Expiring Soon' },
    grace_period: { status: 'warning', label: 'Grace Period (7 Days)' },
    inactive: { status: 'neutral', label: 'Inactive' },
    blacklisted: { status: 'danger', label: 'Blacklisted' },
  }

  const currentStatus = statusMap[member.status] || { status: 'neutral', label: member.status }

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNoteContent.trim()) return

    addStaffNote(member.id, {
      authorId: 'usr_staff',
      authorName: 'Front Desk Staff',
      authorRole: 'Fitness Consultant',
      content: newNoteContent.trim(),
      type: newNoteType,
    })

    setNewNoteContent('')
    toast.success('Staff note added to member timeline')
    if (onMemberUpdated) onMemberUpdated()
  }

  const handleToggleBlacklist = () => {
    if (member.blacklisted) {
      unblacklistMember(member.id)
      toast.success(`${member.name} removed from blacklist`)
    } else {
      blacklistMember({
        memberId: member.id,
        reason: 'Flagged for payment / conduct violation at front desk',
        blacklistedBy: 'Amit Sharma',
      })
      toast.error(`${member.name} blacklisted — turnstile access blocked`)
    }
    if (onMemberUpdated) onMemberUpdated()
  }

  return (
    <>
      <Drawer
        open={open}
        onOpenChange={onOpenChange}
        title={member.name}
        description={`Member Code: ${member.member_code} · Powai Flagship`}
        size="lg"
      >
        <div className="space-y-6">
          {/* Header Profile Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl glass-card border border-[var(--app-glass-border)]">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--aurora-1)] to-[var(--aurora-2)] flex items-center justify-center text-white font-display text-lg font-bold shadow-lg shadow-[var(--aurora-1)]/20">
                {getInitials(member.name)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg font-semibold text-[var(--app-text-primary)]">
                    {member.name}
                  </h3>
                  <StatusPill status={currentStatus.status} dot>
                    {currentStatus.label}
                  </StatusPill>
                  {member.complimentary && (
                    <span className="px-2 py-0.5 rounded-full text-[0.625rem] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      COMPLIMENTARY
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--app-text-muted)] mt-0.5">
                  Joined {member.joined_date} · {member.phone}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setRenewModalOpen(true)}
                icon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Renew Plan
              </Button>
              <Button
                variant={member.blacklisted ? 'secondary' : 'danger'}
                size="sm"
                onClick={handleToggleBlacklist}
              >
                {member.blacklisted ? 'Unblock' : 'Blacklist'}
              </Button>
            </div>
          </div>

          {/* Special Inclusions Alert Banner */}
          {member.special_inclusions && (
            <div className="p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-xs text-teal-300 flex items-start gap-2.5 shadow-sm">
              <Sparkles className="w-4 h-4 mt-0.5 text-teal-400 flex-shrink-0" />
              <div>
                <strong className="font-semibold block text-teal-200">Special Inclusions / Custom Privileges:</strong>
                <span>{member.special_inclusions}</span>
              </div>
            </div>
          )}

          {/* Drawer Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="memberships">Plans ({member.active_memberships.length})</TabsTrigger>
              <TabsTrigger value="attendance">Access</TabsTrigger>
              <TabsTrigger value="notes">Timeline</TabsTrigger>
            </TabsList>

            {/* TAB 1: Overview */}
            <TabsContent value="overview" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl glass-card text-center">
                  <span className="text-[0.6875rem] text-[var(--app-text-muted)] block">Attendance Streak</span>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Flame className="w-4 h-4 text-[var(--app-warning)]" />
                    <span className="font-display text-lg font-bold text-[var(--app-text-primary)]">
                      {member.attendance_streak} d
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-xl glass-card text-center">
                  <span className="text-[0.6875rem] text-[var(--app-text-muted)] block">Total Check-ins</span>
                  <span className="font-display text-lg font-bold text-[var(--app-text-primary)] mt-1 block">
                    {member.total_check_ins}
                  </span>
                </div>
                <div className="p-3 rounded-xl glass-card text-center">
                  <span className="text-[0.6875rem] text-[var(--app-text-muted)] block">Pilates Credits</span>
                  <span className="font-display text-lg font-bold text-teal-400 mt-1 block">
                    {member.adjustment_credits_remaining} / 2
                  </span>
                </div>
                <div className="p-3 rounded-xl glass-card text-center">
                  <span className="text-[0.6875rem] text-[var(--app-text-muted)] block">Lifetime Value</span>
                  <span className="font-display text-sm font-bold text-[var(--aurora-1)] mt-1.5 block font-mono">
                    {formatINR(member.lifetime_value)}
                  </span>
                </div>
              </div>

              {/* KYC & Verification Details */}
              <div className="p-4 rounded-xl glass-card space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--app-text-muted)]">
                    KYC & Identity
                  </h4>
                  <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {member.kyc.id_verified ? `Verified (${member.kyc.id_type || 'Govt ID'})` : 'Pending Verification'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[var(--app-text-muted)] block">ID Number:</span>
                    <span className="font-mono text-[var(--app-text-primary)]">
                      {member.kyc.id_last_four ? `•••• •••• ${member.kyc.id_last_four}` : 'Not provided'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--app-text-muted)] block">Blood Group:</span>
                    <span className="font-semibold text-[var(--app-text-primary)]">{member.kyc.blood_group || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="text-[var(--app-text-muted)] block">Emergency Contact:</span>
                    <span className="text-[var(--app-text-primary)] font-medium">
                      {member.kyc.emergency_contact_name || 'None'} ({member.kyc.emergency_contact_phone || 'N/A'})
                    </span>
                  </div>
                </div>
              </div>

              {/* Marketing Consent */}
              <div className="p-4 rounded-xl glass-card space-y-2 text-xs">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--app-text-muted)]">
                  Marketing & Channel Consent
                </h4>
                <div className="flex items-center gap-4">
                  <span className={cn('flex items-center gap-1 font-medium', member.consent.sms ? 'text-emerald-400' : 'text-zinc-500')}>
                    {member.consent.sms ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />} SMS (Active)
                  </span>
                  <span className={cn('flex items-center gap-1 font-medium', member.consent.email ? 'text-emerald-400' : 'text-zinc-500')}>
                    {member.consent.email ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />} Email
                  </span>
                  <span className={cn('flex items-center gap-1 font-medium', member.consent.whatsapp ? 'text-emerald-400' : 'text-zinc-500')}>
                    {member.consent.whatsapp ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />} WhatsApp (Consent Required)
                  </span>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: Memberships & Packages */}
            <TabsContent value="memberships" className="space-y-3 pt-4">
              {member.active_memberships.length > 0 ? (
                member.active_memberships.map((ms) => (
                  <div key={ms.id} className="p-4 rounded-xl glass-card border border-[var(--aurora-1)]/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[0.625rem] uppercase tracking-wider text-[var(--aurora-1)] font-semibold">
                          Active Package
                        </span>
                        <h4 className="text-base font-semibold text-[var(--app-text-primary)]">
                          {ms.product_name}
                        </h4>
                      </div>
                      <StatusPill status={ms.status === 'active' ? 'success' : 'info'}>
                        {ms.status}
                      </StatusPill>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-[var(--app-text-muted)] block">Enrolled:</span>
                        <span className="text-[var(--app-text-secondary)]">{ms.enrolment_date}</span>
                      </div>
                      <div>
                        <span className="text-[var(--app-text-muted)] block">Activation:</span>
                        <span className="text-[var(--app-text-secondary)]">{ms.activation_date || 'Pending'}</span>
                      </div>
                      <div>
                        <span className="text-[var(--app-text-muted)] block">Expiry Date:</span>
                        <span className="font-semibold text-emerald-400">{ms.expiry_date || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[var(--app-text-muted)] block">Amount (GST Inc):</span>
                        <span className="font-mono font-bold text-[var(--app-text-primary)]">{formatINR(ms.amount_paid)}</span>
                      </div>
                    </div>

                    {ms.sessions_total !== null && (
                      <div className="pt-2 border-t border-[var(--app-glass-border)] flex items-center justify-between text-xs">
                        <span className="text-[var(--app-text-muted)]">Sessions Remaining:</span>
                        <span className="font-bold text-[var(--aurora-1)]">
                          {ms.sessions_remaining} of {ms.sessions_total} sessions
                        </span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-6 rounded-xl glass-input text-center text-xs text-[var(--app-text-muted)]">
                  No active memberships on file.
                </div>
              )}
            </TabsContent>

            {/* TAB 3: Attendance */}
            <TabsContent value="attendance" className="space-y-4 pt-4">
              <div className="p-4 rounded-xl glass-card text-xs space-y-2">
                <div className="flex justify-between py-1 border-b border-[var(--app-glass-border)]">
                  <span className="text-[var(--app-text-muted)]">Total Studio Check-ins:</span>
                  <span className="font-bold">{member.total_check_ins} visits</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--app-glass-border)]">
                  <span className="text-[var(--app-text-muted)]">Current Attendance Streak:</span>
                  <span className="font-bold text-amber-400">{member.attendance_streak} consecutive days</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[var(--app-text-muted)]">Last Turnstile Scan:</span>
                  <span className="font-mono">{member.last_visit_at ? formatDateTime(member.last_visit_at) : 'No recent scans'}</span>
                </div>
              </div>
            </TabsContent>

            {/* TAB 4: Timeline & Notes */}
            <TabsContent value="notes" className="space-y-4 pt-4">
              <form onSubmit={handleAddNote} className="space-y-2">
                <Input
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Add a staff note, call log, or medical update..."
                  className="text-xs"
                />
                <div className="flex justify-end">
                  <Button type="submit" size="sm" variant="primary" icon={<Send className="w-3.5 h-3.5" />}>
                    Save Note
                  </Button>
                </div>
              </form>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {member.staff_notes.map((note) => (
                  <div key={note.id} className="p-3 rounded-xl glass-card text-xs space-y-1">
                    <div className="flex items-center justify-between text-[0.6875rem] text-[var(--app-text-muted)]">
                      <span className="font-medium text-[var(--aurora-1)]">{note.authorName} ({note.authorRole})</span>
                      <span>{formatDateTime(note.timestamp)}</span>
                    </div>
                    <p className="text-[var(--app-text-primary)]">{note.content}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Drawer>

      <RenewMemberModal
        member={member}
        open={renewModalOpen}
        onOpenChange={setRenewModalOpen}
        onUpdated={onMemberUpdated}
      />
    </>
  )
}
