'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, ShieldCheck, HeartPulse, CreditCard,
  Flame, Activity, Clock, FileText, Send, Snowflake,
  RefreshCw, Building2, Dumbbell, Printer, Mail, Phone,
  Sparkles, Check, X,
} from 'lucide-react'
import GlassCard from '@/components/app/ui/glass-card'
import StatCard from '@/components/app/ui/stat-card'
import { Button } from '@/components/app/ui/button'
import { StatusPill } from '@/components/app/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/app/ui/tabs'
import FreezeMemberModal from '@/components/app/members/FreezeMemberModal'
import RenewMemberModal from '@/components/app/members/RenewMemberModal'
import { getMemberById, addStaffNote } from '@/lib/members'
import { formatINR } from '@/lib/gst'
import { formatDateTime, getInitials } from '@/lib/utils'
import type { Member, MemberStatus } from '@/types/member'
import { toast } from '@/components/app/ui/toast'
import { cn } from '@/lib/utils'

import Breadcrumbs from '@/components/app/ui/Breadcrumbs'
import { formatDualDate } from '@/lib/date-format'
import WhatsAppComposeModal from '@/components/app/whatsapp/WhatsAppComposeModal'

export default function MemberDetailPage() {
  const params = useParams()
  const router = useRouter()
  const memberId = params?.id as string

  const [member, setMember] = useState<Member | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [newNoteContent, setNewNoteContent] = useState('')
  const [newNoteType, setNewNoteType] = useState<'general' | 'call' | 'followup' | 'warning'>('general')
  const [freezeModalOpen, setFreezeModalOpen] = useState(false)
  const [renewModalOpen, setRenewModalOpen] = useState(false)
  const [waModalOpen, setWaModalOpen] = useState(false)

  const loadMember = () => {
    if (!memberId) return
    const found = getMemberById(memberId)
    setMember(found)
  }

  useEffect(() => {
    loadMember()
  }, [memberId])

  if (!member) {
    return (
      <div className="space-y-4 max-w-4xl py-12 text-center">
        <h2 className="font-display text-xl font-semibold text-[var(--app-text-primary)]">
          Member Not Found
        </h2>
        <p className="text-xs text-[var(--app-text-muted)]">
          The requested member record does not exist or has been removed.
        </p>
        <Link href="/members">
          <Button variant="secondary" icon={<ArrowLeft className="w-4 h-4" />}>
            Back to Directory
          </Button>
        </Link>
      </div>
    )
  }

  const statusMap: Record<MemberStatus, { status: 'success' | 'warning' | 'danger' | 'info' | 'neutral'; label: string }> = {
    active: { status: 'success', label: 'Active' },
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
    toast.success('Staff note recorded')
    loadMember()
  }

  return (
    <div className="space-y-8 max-w-6xl">
      <Breadcrumbs
        items={[
          { label: 'Member Directory', href: '/members' },
          { label: member.name },
        ]}
      />

      {/* Back link & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/members"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--app-text-muted)] hover:text-[var(--app-text-secondary)] transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Members Directory
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--app-text-primary)] tracking-tight">
              {member.name}
            </h1>
            <StatusPill status={currentStatus.status} dot>
              {currentStatus.label}
            </StatusPill>
            {member.complimentary && (
              <span className="px-2 py-0.5 rounded-full text-[0.625rem] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                COMPLIMENTARY
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--app-text-muted)] font-mono mt-1">
            {member.member_code} · Powai Flagship · Joined {member.joined_date}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setRenewModalOpen(true)}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Renew Plan
          </Button>
        </div>
      </div>

      {/* Special Inclusions Alert Banner */}
      {member.special_inclusions && (
        <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-xs text-teal-300 flex items-start gap-3 shadow-sm">
          <Sparkles className="w-5 h-5 mt-0.5 text-teal-400 flex-shrink-0" />
          <div>
            <strong className="font-semibold block text-sm text-teal-200">Special Inclusions / Custom Privileges:</strong>
            <p className="mt-0.5 text-xs">{member.special_inclusions}</p>
          </div>
        </div>
      )}

      {/* Profile KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Attendance Streak"
          value={`${member.attendance_streak} days`}
          strandValue={member.attendance_streak}
          strandMax={7}
          icon={<Activity className="w-4 h-4 text-[var(--teal)]" />}
        />
        <StatCard
          label="Total Studio Visits"
          value={member.total_check_ins}
          icon={<Activity className="w-4 h-4 text-[var(--teal)]" />}
        />
        <StatCard
          label="Pilates Adjustment Credits"
          value={`${member.adjustment_credits_remaining} / 2`}
          strandValue={member.adjustment_credits_remaining}
          strandMax={2}
          icon={<Clock className="w-4 h-4 text-[var(--teal)]" />}
        />
        <StatCard
          label="Lifetime Value (GST Inc)"
          value={formatINR(member.lifetime_value)}
          icon={<CreditCard className="w-4 h-4 text-[var(--blue)]" />}
        />
      </div>

      {/* Tabs Layout */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="memberships">Packages ({member.active_memberships.length})</TabsTrigger>
          <TabsTrigger value="kyc">KYC & Bio</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        {/* TAB 1: Overview */}
        <TabsContent value="overview" className="space-y-6 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Active Packages */}
              <GlassCard>
                <h3 className="font-semibold text-sm text-[var(--app-text-primary)] mb-4">Active Memberships & Packages</h3>
                <div className="space-y-4">
                  {member.active_memberships.map((ms) => (
                    <div key={ms.id} className="p-4 rounded-xl glass-input space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm text-[var(--app-text-primary)]">
                          {ms.product_name}
                        </h4>
                        <StatusPill status={ms.status === 'active' ? 'success' : 'info'}>
                          {ms.status}
                        </StatusPill>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-[var(--app-text-muted)] block">Enrolment:</span>
                          <span>{ms.enrolment_date}</span>
                        </div>
                        <div>
                          <span className="text-[var(--app-text-muted)] block">Activation:</span>
                          <span>{ms.activation_date || 'Pending'}</span>
                        </div>
                        <div>
                          <span className="text-[var(--app-text-muted)] block">Expiry:</span>
                          <span className="font-semibold text-emerald-400">{ms.expiry_date || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[var(--app-text-muted)] block">Amount (GST Inc):</span>
                          <span className="font-mono font-bold">{formatINR(ms.amount_paid)}</span>
                        </div>
                      </div>
                      {ms.sessions_total !== null && (
                        <div className="pt-2 border-t border-[var(--app-glass-border)] flex items-center justify-between text-xs">
                          <span className="text-[var(--app-text-muted)]">Session Balance:</span>
                          <span className="font-bold text-[var(--aurora-1)]">
                            {ms.sessions_remaining} of {ms.sessions_total} remaining
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>

            {/* Quick Details Sidebar */}
            <div className="space-y-6">
              <GlassCard>
                <h3 className="font-semibold text-sm text-[var(--app-text-primary)] mb-4">Contact & Channels</h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[var(--app-text-muted)] block">Phone (100% Reach):</span>
                    <span className="font-mono font-semibold">{member.phone}</span>
                  </div>
                  <div>
                    <span className="text-[var(--app-text-muted)] block">Email:</span>
                    <span>{member.email || <span className="text-[var(--app-text-muted)] italic">Not registered (7% base)</span>}</span>
                  </div>
                  <div className="pt-2 border-t border-[var(--app-glass-border)] space-y-1">
                    <span className="text-[var(--app-text-muted)] block">Marketing Consent:</span>
                    <div className="flex items-center gap-3">
                      <span className={cn('flex items-center gap-1 font-medium', member.consent.sms ? 'text-emerald-400' : 'text-zinc-500')}>
                        {member.consent.sms ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} SMS
                      </span>
                      <span className={cn('flex items-center gap-1 font-medium', member.consent.email ? 'text-emerald-400' : 'text-zinc-500')}>
                        {member.consent.email ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Email
                      </span>
                      <span className={cn('flex items-center gap-1 font-medium', member.consent.whatsapp ? 'text-emerald-400' : 'text-zinc-500')}>
                        {member.consent.whatsapp ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} WhatsApp
                      </span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: Packages */}
        <TabsContent value="memberships" className="space-y-4 pt-4">
          <GlassCard>
            <h3 className="font-semibold text-sm text-[var(--app-text-primary)] mb-4">All Membership Tenures</h3>
            <div className="space-y-4">
              {member.active_memberships.map((ms) => (
                <div key={ms.id} className="p-4 rounded-xl glass-card space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-[var(--app-text-primary)]">{ms.product_name}</span>
                    <span className="font-mono text-[var(--aurora-1)]">{ms.invoice_number}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                    <div><span className="text-[var(--app-text-muted)]">Enrolment:</span> {ms.enrolment_date}</div>
                    <div><span className="text-[var(--app-text-muted)]">Activation:</span> {ms.activation_date || '—'}</div>
                    <div><span className="text-[var(--app-text-muted)]">Expiry:</span> {ms.expiry_date || '—'}</div>
                    <div><span className="text-[var(--app-text-muted)]">Sales Rep:</span> {ms.sales_rep_name}</div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </TabsContent>

        {/* TAB 3: KYC */}
        <TabsContent value="kyc" className="space-y-4 pt-4">
          <GlassCard>
            <h3 className="font-semibold text-sm text-[var(--app-text-primary)] mb-4">KYC Verification & Emergency Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-[var(--app-text-muted)] block">ID Document:</span>
                <span className="font-semibold">{member.kyc.id_type || 'Govt ID'}</span>
              </div>
              <div>
                <span className="text-[var(--app-text-muted)] block">ID Number (Last 4):</span>
                <span className="font-mono font-bold">{member.kyc.id_last_four ? `•••• •••• ${member.kyc.id_last_four}` : '—'}</span>
              </div>
              <div>
                <span className="text-[var(--app-text-muted)] block">Verification Status:</span>
                <span className="text-emerald-400 font-semibold">{member.kyc.id_verified ? 'Verified' : 'Unverified'}</span>
              </div>
              <div>
                <span className="text-[var(--app-text-muted)] block">Blood Group:</span>
                <span className="font-semibold">{member.kyc.blood_group || '—'}</span>
              </div>
              <div>
                <span className="text-[var(--app-text-muted)] block">Emergency Contact:</span>
                <span>{member.kyc.emergency_contact_name || '—'} ({member.kyc.emergency_contact_phone || '—'})</span>
              </div>
              <div>
                <span className="text-[var(--app-text-muted)] block">Relationship:</span>
                <span>{member.kyc.emergency_contact_relation || '—'}</span>
              </div>
            </div>
          </GlassCard>
        </TabsContent>

        {/* TAB 4: Timeline */}
        <TabsContent value="timeline" className="space-y-4 pt-4">
          <GlassCard>
            <h3 className="font-semibold text-sm text-[var(--app-text-primary)] mb-4">Staff Notes & Interactions</h3>
            <form onSubmit={handleAddNote} className="space-y-3 mb-6">
              <input
                type="text"
                placeholder="Log a call, check-in note, or follow-up..."
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                className="w-full h-10 px-4 text-xs glass-input text-[var(--app-text-primary)] placeholder:text-[var(--app-text-muted)]"
              />
              <div className="flex justify-end">
                <Button type="submit" size="sm" variant="primary" icon={<Send className="w-3.5 h-3.5" />}>
                  Record Note
                </Button>
              </div>
            </form>

            <div className="space-y-3">
              {member.staff_notes.map((n) => (
                <div key={n.id} className="p-3.5 rounded-xl glass-input space-y-1 text-xs">
                  <div className="flex justify-between text-[0.6875rem] text-[var(--app-text-muted)]">
                    <span className="font-semibold text-[var(--aurora-1)]">{n.authorName} ({n.authorRole})</span>
                    <span>{formatDateTime(n.timestamp)}</span>
                  </div>
                  <p>{n.content}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </TabsContent>
      </Tabs>

      <RenewMemberModal
        member={member}
        open={renewModalOpen}
        onOpenChange={setRenewModalOpen}
        onUpdated={loadMember}
      />
    </div>
  )
}
