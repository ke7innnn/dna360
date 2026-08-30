'use client'

import React, { useState } from 'react'
import {
  User, Mail, Phone, Calendar, ShieldCheck,
  CreditCard, Activity, Clock, FileText, Send,
  RefreshCw, Sparkles, Check, X,
} from 'lucide-react'
import { Drawer } from '@/components/app/ui/drawer'
import { Button } from '@/components/app/ui/button'
import { Badge } from '@/components/app/ui/badge'
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

  const statusMap: Record<string, { status: string; label: string }> = {
    active: { status: 'ok', label: 'Active Member' },
    expiring_soon: { status: 'warn', label: 'Expiring Soon' },
    grace_period: { status: 'warn', label: 'Grace Period' },
    inactive: { status: 'neutral', label: 'Expired' },
    blacklisted: { status: 'danger', label: 'Blocked' },
  }

  const currentStatus = statusMap[member.status] || { status: 'neutral', label: member.status || 'Active' }
  const activeMemberships = member.active_memberships || []
  const kyc = member.kyc || {
    id_type: null,
    id_last_four: null,
    id_verified: false,
    blood_group: null,
    emergency_contact_name: null,
    emergency_contact_phone: null,
  }
  const consent = member.consent || { sms: true, email: true, whatsapp: false }
  const staffNotes = member.staff_notes || []

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
    toast.success('Staff note recorded on timeline')
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
        title={member.name || 'Member Details'}
        description={`Member Code: ${member.member_code || member.memberCode} · Powai Flagship`}
        size="lg"
      >
        <div className="space-y-5 select-none">
          {/* Header Profile Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[var(--r-md)] bg-[var(--surface-sunken)] border border-[var(--line)]">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-[var(--r-sm)] bg-[var(--surface-raised)] border border-[var(--line-strong)] flex items-center justify-center text-[var(--text)] font-ui text-base font-bold shrink-0">
                {getInitials(member.name || 'MB')}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-ui text-base font-semibold text-[var(--text)]">
                    {member.name}
                  </h3>
                  <Badge status={currentStatus.status} size="sm">
                    {currentStatus.label}
                  </Badge>
                  {member.complimentary && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--warn-dim)] text-[var(--warn)] border border-[rgba(217,154,60,0.30)]">
                      COMPLIMENTARY
                    </span>
                  )}
                </div>
                <p className="font-ui text-xs text-[var(--text-faint)] mt-0.5">
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
            <div className="p-3.5 rounded-[var(--r-sm)] bg-[var(--teal-dim)] border border-[rgba(27,167,156,0.30)] text-xs text-[var(--teal)] flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 mt-0.5 text-[var(--teal)] flex-shrink-0" />
              <div>
                <strong className="font-semibold block text-[var(--text)]">Special Inclusions / Custom Privileges:</strong>
                <span>{member.special_inclusions}</span>
              </div>
            </div>
          )}

          {/* Drawer Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="memberships">Plans ({activeMemberships.length})</TabsTrigger>
              <TabsTrigger value="attendance">Access</TabsTrigger>
              <TabsTrigger value="notes">Timeline</TabsTrigger>
            </TabsList>

            {/* TAB 1: Overview */}
            <TabsContent value="overview" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-[var(--r-sm)] bg-[var(--surface-sunken)] border border-[var(--line)] text-center">
                  <span className="font-ui text-[11px] uppercase tracking-wider text-[var(--text-faint)] block">Attendance Streak</span>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Activity className="w-4 h-4 text-[var(--teal)]" />
                    <span className="font-data text-lg font-bold text-[var(--text)] tabular-nums">
                      {member.attendance_streak || 0}d
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-[var(--r-sm)] bg-[var(--surface-sunken)] border border-[var(--line)] text-center">
                  <span className="font-ui text-[11px] uppercase tracking-wider text-[var(--text-faint)] block">Total Check-ins</span>
                  <span className="font-data text-lg font-bold text-[var(--text)] mt-1 block tabular-nums">
                    {member.total_check_ins || 0}
                  </span>
                </div>
                <div className="p-3 rounded-[var(--r-sm)] bg-[var(--surface-sunken)] border border-[var(--line)] text-center">
                  <span className="font-ui text-[11px] uppercase tracking-wider text-[var(--text-faint)] block">Pilates Credits</span>
                  <span className="font-data text-lg font-bold text-[var(--teal)] mt-1 block tabular-nums">
                    {member.adjustment_credits_remaining ?? 2} / 2
                  </span>
                </div>
                <div className="p-3 rounded-[var(--r-sm)] bg-[var(--surface-sunken)] border border-[var(--line)] text-center">
                  <span className="font-ui text-[11px] uppercase tracking-wider text-[var(--text-faint)] block">Lifetime Value</span>
                  <span className="font-data text-sm font-bold text-[var(--text)] mt-1.5 block tabular-nums">
                    {formatINR(member.lifetime_value || 0)}
                  </span>
                </div>
              </div>

              {/* KYC & Verification Details */}
              <div className="p-4 rounded-[var(--r-md)] bg-[var(--surface-sunken)] border border-[var(--line)] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-ui text-xs font-semibold uppercase tracking-wider text-[var(--text-faint)]">
                    KYC & Identity
                  </h4>
                  <span className="font-ui text-xs text-[var(--ok)] flex items-center gap-1 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {kyc.id_verified ? `Verified (${kyc.id_type || 'Govt ID'})` : 'Pending Verification'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[var(--text-faint)] block">ID Number:</span>
                    <span className="font-data text-[var(--text)] tabular-nums">
                      {kyc.id_last_four ? `•••• •••• ${kyc.id_last_four}` : 'Not provided'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-faint)] block">Blood Group:</span>
                    <span className="font-medium text-[var(--text)]">{kyc.blood_group || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-faint)] block">Emergency Contact:</span>
                    <span className="text-[var(--text)] font-medium">
                      {kyc.emergency_contact_name || 'None'} ({kyc.emergency_contact_phone || 'N/A'})
                    </span>
                  </div>
                </div>
              </div>

              {/* Marketing Consent */}
              <div className="p-4 rounded-[var(--r-md)] bg-[var(--surface-sunken)] border border-[var(--line)] space-y-2 text-xs">
                <h4 className="font-ui text-xs font-semibold uppercase tracking-wider text-[var(--text-faint)]">
                  Marketing & Channel Consent
                </h4>
                <div className="flex items-center gap-4">
                  <span className={cn('flex items-center gap-1 font-medium', consent.sms ? 'text-[var(--ok)]' : 'text-[var(--text-faint)]')}>
                    {consent.sms ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />} SMS (Active)
                  </span>
                  <span className={cn('flex items-center gap-1 font-medium', consent.email ? 'text-[var(--ok)]' : 'text-[var(--text-faint)]')}>
                    {consent.email ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />} Email
                  </span>
                  <span className={cn('flex items-center gap-1 font-medium', consent.whatsapp ? 'text-[var(--ok)]' : 'text-[var(--text-faint)]')}>
                    {consent.whatsapp ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />} WhatsApp
                  </span>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: Memberships & Packages */}
            <TabsContent value="memberships" className="space-y-3 pt-4">
              {activeMemberships.length > 0 ? (
                activeMemberships.map((ms) => (
                  <div key={ms.id} className="p-4 rounded-[var(--r-md)] bg-[var(--surface-sunken)] border border-[var(--line)] space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-ui text-[10px] uppercase tracking-wider text-[var(--teal)] font-semibold">
                          Active Package
                        </span>
                        <h4 className="font-ui text-sm font-semibold text-[var(--text)]">
                          {ms.product_name}
                        </h4>
                      </div>
                      <Badge status={ms.status === 'active' ? 'ok' : 'info'} size="sm">
                        {ms.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-[var(--text-faint)] block">Enrolled:</span>
                        <span className="text-[var(--text-muted)]">{ms.enrolment_date}</span>
                      </div>
                      <div>
                        <span className="text-[var(--text-faint)] block">Activation:</span>
                        <span className="text-[var(--text-muted)]">{ms.activation_date || 'Pending'}</span>
                      </div>
                      <div>
                        <span className="text-[var(--text-faint)] block">Expiry Date:</span>
                        <span className="font-semibold text-[var(--ok)]">{ms.expiry_date || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[var(--text-faint)] block">Amount (GST Inc):</span>
                        <span className="font-data font-bold text-[var(--text)] tabular-nums">{formatINR(ms.amount_paid)}</span>
                      </div>
                    </div>

                    {ms.sessions_total !== null && (
                      <div className="pt-2 border-t border-[var(--line)] flex items-center justify-between text-xs">
                        <span className="text-[var(--text-faint)]">Sessions Remaining:</span>
                        <span className="font-data font-bold text-[var(--teal)] tabular-nums">
                          {ms.sessions_remaining} of {ms.sessions_total} sessions
                        </span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-6 rounded-[var(--r-md)] bg-[var(--surface-sunken)] border border-[var(--line)] text-center text-xs text-[var(--text-faint)]">
                  No active memberships on file.
                </div>
              )}
            </TabsContent>

            {/* TAB 3: Attendance */}
            <TabsContent value="attendance" className="space-y-4 pt-4">
              <div className="p-4 rounded-[var(--r-md)] bg-[var(--surface-sunken)] border border-[var(--line)] text-xs space-y-2">
                <div className="flex justify-between py-1 border-b border-[var(--line)]">
                  <span className="text-[var(--text-faint)]">Total Studio Check-ins:</span>
                  <span className="font-data font-bold text-[var(--text)] tabular-nums">{member.total_check_ins || 0} visits</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--line)]">
                  <span className="text-[var(--text-faint)]">Current Attendance Streak:</span>
                  <span className="font-data font-bold text-[var(--warn)] tabular-nums">{member.attendance_streak || 0} consecutive days</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[var(--text-faint)]">Last Turnstile Scan:</span>
                  <span className="font-data tabular-nums text-[var(--text)]">{member.last_visit_at ? formatDateTime(member.last_visit_at) : 'No recent scans'}</span>
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
                {staffNotes.map((note) => (
                  <div key={note.id} className="p-3 rounded-[var(--r-sm)] bg-[var(--surface-sunken)] border border-[var(--line)] text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-[var(--text-faint)]">
                      <span className="font-medium text-[var(--teal)]">{note.authorName} ({note.authorRole})</span>
                      <span className="font-data tabular-nums">{formatDateTime(note.timestamp)}</span>
                    </div>
                    <p className="text-[var(--text)]">{note.content}</p>
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
