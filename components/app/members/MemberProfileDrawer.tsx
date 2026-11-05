'use client'

import React, { useState, useEffect } from 'react'
import {
  User, Mail, Phone, Calendar, ShieldCheck,
  CreditCard, Activity, Clock, FileText, Send,
  RefreshCw, Sparkles, Check, X, Ban, CheckCircle2,
  AlertTriangle, ShieldAlert, MessageSquare,
} from 'lucide-react'
import WhatsAppComposeModal from '@/components/app/whatsapp/WhatsAppComposeModal'
import Drawer from '@/components/app/ui/drawer'
import Button from '@/components/app/ui/button'
import Badge from '@/components/app/ui/badge'
import Input from '@/components/app/ui/input'
import Modal from '@/components/app/ui/modal'
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
  onRenew,
  onFreeze,
}: {
  member: Member | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onMemberUpdated?: () => void
  onRenew?: (member: Member) => void
  onFreeze?: (member: Member) => void
}) {
  const [activeTab, setActiveTab] = useState('overview')
  const [newNoteContent, setNewNoteContent] = useState('')
  const [newNoteType, setNewNoteType] = useState<'general' | 'call' | 'followup' | 'warning'>('general')
  const [renewModalOpen, setRenewModalOpen] = useState(false)
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false)
  const [blockModalOpen, setBlockModalOpen] = useState(false)
  const [blockReason, setBlockReason] = useState('Turnstile misconduct / conduct violation')
  const [customBlockReason, setCustomBlockReason] = useState('')
  const [remoteProfile, setRemoteProfile] = useState<any>(null)

  useEffect(() => {
    if (!open || !member?.id) {
      setRemoteProfile(null)
      return
    }
    fetch(`/api/member/profile?memberId=${encodeURIComponent(member.id)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.profile || data?.member) {
          setRemoteProfile(data.profile || data.member)
        }
      })
      .catch(() => {})
  }, [open, member?.id])

  if (!member) return null

  const isBlocked = remoteProfile?.blacklisted ?? (member.blacklisted || member.status === 'blacklisted')

  const statusMap: Record<string, { status: string; label: string }> = {
    active: { status: 'ok', label: 'Active Member' },
    expiring_soon: { status: 'warn', label: 'Expiring Soon' },
    grace_period: { status: 'warn', label: 'Grace Period' },
    inactive: { status: 'neutral', label: 'Expired' },
    blacklisted: { status: 'danger', label: 'Blocked' },
  }

  const effectiveStatus = remoteProfile?.status || member.status
  const currentStatus = isBlocked
    ? { status: 'danger', label: 'Blocked' }
    : statusMap[effectiveStatus] || { status: 'neutral', label: effectiveStatus || 'Active' }

  const activeMemberships =
    remoteProfile?.activePlans && remoteProfile.activePlans.length > 0
      ? remoteProfile.activePlans.map((p: any) => ({
          id: p.id,
          product_name: p.productName,
          category: p.category,
          status: p.status,
          amount_paid: p.amountPaid,
          start_date: p.startDate,
          expiry_date: p.expiryDate,
          sessions_total: p.sessionsTotal,
          sessions_remaining: p.sessionsRemaining,
          freeze_days_used: 0,
          max_freeze_days: 30,
        }))
      : member.active_memberships || []
  const effectiveStreak = remoteProfile?.streakCount ?? (member.attendance_streak || 0)
  const effectiveCheckIns = remoteProfile?.visitCount ?? (member.total_check_ins || 0)
  const effectiveCredits = remoteProfile?.adjustmentCreditsRemaining ?? (member.adjustment_credits_remaining ?? 2)
  const effectiveLtv = remoteProfile?.lifetimeValue ?? (member.lifetime_value || 0)
  const effectiveLastVisit = remoteProfile?.lastVisitAt || member.last_visit_at
  const effectiveSpecialInclusions = remoteProfile?.specialInclusions || member.special_inclusions
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

  // Block member action
  const handleConfirmBlock = () => {
    const finalReason = customBlockReason.trim()
      ? `${blockReason}: ${customBlockReason.trim()}`
      : blockReason

    blacklistMember({
      memberId: member.id,
      reason: finalReason,
      blacklistedBy: 'Rajesh Poojary (Duty Manager)',
    })

    toast.error(`${member.name} is now Blocked — turnstile access revoked`)
    setBlockModalOpen(false)
    setCustomBlockReason('')
    if (onMemberUpdated) onMemberUpdated()
  }

  // Unblock member action
  const handleUnblock = () => {
    unblacklistMember(member.id)
    toast.success(`${member.name} unblocked — turnstile access restored`)
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[var(--r-md)] bg-[var(--surface-2)] border border-[var(--line)]">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[rgba(59,130,246,0.35)] to-[rgba(99,102,241,0.25)] border border-[rgba(59,130,246,0.5)] flex items-center justify-center text-white font-ui text-base font-bold shrink-0 shadow-[0_0_12px_rgba(59,130,246,0.25)]">
                {getInitials(member.name || 'MB')}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg font-semibold text-[var(--ink)]">
                    {member.name}
                  </h3>
                  <Badge status={currentStatus.status} size="sm">
                    {currentStatus.label}
                  </Badge>
                  {member.complimentary && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-ui font-semibold bg-[var(--amber-dim)] text-[var(--amber)] border border-[rgba(245,158,11,0.30)]">
                      COMPLIMENTARY
                    </span>
                  )}
                </div>
                <p className="font-ui text-xs text-[var(--muted)] mt-0.5">
                  Joined {member.joined_date} · {member.phone}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setWhatsAppModalOpen(true)}
                className="bg-[#25D366] hover:bg-[#20bd5a] text-black font-semibold border-none shadow-[0_0_12px_rgba(37,211,102,0.25)]"
                icon={<MessageSquare className="w-3.5 h-3.5" />}
              >
                WhatsApp
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  if (onRenew) onRenew(member)
                  else setRenewModalOpen(true)
                }}
                icon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Renew Plan
              </Button>

              {isBlocked ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleUnblock}
                  className="border-[#4ADE80] text-[#4ADE80] hover:bg-[rgba(74,222,128,0.1)]"
                  icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                >
                  Unblock Member
                </Button>
              ) : (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setBlockModalOpen(true)}
                  icon={<Ban className="w-3.5 h-3.5" />}
                >
                  Block Member
                </Button>
              )}
            </div>
          </div>

          {/* Blocked Status Banner */}
          {isBlocked && (
            <div className="p-3.5 rounded-[var(--r-sm)] bg-[rgba(255,92,122,0.12)] border border-[rgba(255,92,122,0.35)] text-xs text-[#FF5C7A] flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 shrink-0 text-[#FF5C7A]" />
                <div>
                  <strong className="block font-semibold text-white">Member is currently Blocked</strong>
                  <span className="text-[11px] text-[var(--ink-2)]">
                    Turnstile gate entry denied. Reason: {member.blacklist_reason || 'Administrative hold on account'}
                  </span>
                </div>
              </div>
              <button
                onClick={handleUnblock}
                className="px-3 py-1.5 rounded-full bg-[rgba(74,222,128,0.15)] hover:bg-[#4ADE80] hover:text-[#12040A] text-[#4ADE80] border border-[rgba(74,222,128,0.3)] font-semibold text-xs transition-all shrink-0 cursor-pointer"
              >
                Unblock Now
              </button>
            </div>
          )}

          {/* Special Inclusions Alert Banner */}
          {effectiveSpecialInclusions && (
            <div className="p-3.5 rounded-[var(--r-sm)] bg-[var(--accent-soft)] border border-[rgba(59,130,246,0.30)] text-xs text-[var(--accent)] flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 mt-0.5 text-[var(--accent)] flex-shrink-0" />
              <div>
                <strong className="font-semibold block text-[var(--ink)]">Special Inclusions / Custom Privileges:</strong>
                <span>{effectiveSpecialInclusions}</span>
              </div>
            </div>
          )}

          {/* Drawer Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex w-full overflow-x-auto h-auto min-h-10 bg-[var(--surface-2)] border border-[var(--line)] rounded-[var(--r-sm)] p-1">
              <TabsTrigger value="overview" className="shrink-0">Overview</TabsTrigger>
              <TabsTrigger value="memberships" className="shrink-0">Plans ({activeMemberships.length})</TabsTrigger>
              <TabsTrigger value="attendance" className="shrink-0">Access</TabsTrigger>
              <TabsTrigger value="notes" className="shrink-0">Timeline</TabsTrigger>
            </TabsList>

            {/* TAB 1: Overview */}
            <TabsContent value="overview" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-[var(--r-md)] bg-[var(--surface-2)] border border-[var(--line)] text-center">
                  <span className="font-data text-[10px] uppercase tracking-[0.14em] text-[var(--muted)] block">Attendance Streak</span>
                  <div className="flex items-center justify-center gap-1.5 mt-1">
                    <Activity className="w-4 h-4 text-[var(--accent)]" />
                    <span className="font-data text-lg font-bold text-[var(--ink)] tabular-nums">
                      {effectiveStreak}d
                    </span>
                  </div>
                </div>
                <div className="p-3.5 rounded-[var(--r-md)] bg-[var(--surface-2)] border border-[var(--line)] text-center">
                  <span className="font-data text-[10px] uppercase tracking-[0.14em] text-[var(--muted)] block">Total Check-ins</span>
                  <span className="font-data text-lg font-bold text-[var(--ink)] mt-1 block tabular-nums">
                    {effectiveCheckIns}
                  </span>
                </div>
                <div className="p-3.5 rounded-[var(--r-md)] bg-[var(--surface-2)] border border-[var(--line)] text-center">
                  <span className="font-data text-[10px] uppercase tracking-[0.14em] text-[var(--muted)] block">Pilates Credits</span>
                  <span className="font-data text-lg font-bold text-[var(--accent)] mt-1 block tabular-nums">
                    {effectiveCredits} / 2
                  </span>
                </div>
                <div className="p-3.5 rounded-[var(--r-md)] bg-[var(--surface-2)] border border-[var(--line)] text-center">
                  <span className="font-data text-[10px] uppercase tracking-[0.14em] text-[var(--muted)] block">Lifetime Value</span>
                  <span className="font-data text-sm font-bold text-[var(--ink)] mt-1.5 block tabular-nums">
                    {formatINR(effectiveLtv)}
                  </span>
                </div>
              </div>

              {/* KYC & Verification Details */}
              <div className="p-4 rounded-[var(--r-md)] bg-[var(--surface-2)] border border-[var(--line)] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-data text-[10.5px] uppercase tracking-[0.14em] font-semibold text-[var(--muted)]">
                    KYC & Identity
                  </h4>
                  <span className="font-ui text-xs text-[var(--green)] flex items-center gap-1 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {kyc.id_verified ? `Verified (${kyc.id_type || 'Govt ID'})` : 'Pending Verification'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="font-data text-[10.5px] text-[var(--muted)] block">ID Number:</span>
                    <span className="font-data text-[var(--ink)] tabular-nums font-medium">
                      {kyc.id_last_four ? `•••• •••• ${kyc.id_last_four}` : 'Not provided'}
                    </span>
                  </div>
                  <div>
                    <span className="font-data text-[10.5px] text-[var(--muted)] block">Blood Group:</span>
                    <span className="font-ui font-medium text-[var(--ink)]">{kyc.blood_group || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="font-data text-[10.5px] text-[var(--muted)] block">Emergency Contact:</span>
                    <span className="font-ui text-[var(--ink)] font-medium">
                      {kyc.emergency_contact_name || 'None'} ({kyc.emergency_contact_phone || 'N/A'})
                    </span>
                  </div>
                </div>
              </div>

              {/* Marketing Consent */}
              <div className="p-4 rounded-[var(--r-md)] bg-[var(--surface-2)] border border-[var(--line)] space-y-2 text-xs">
                <h4 className="font-data text-[10.5px] uppercase tracking-[0.14em] font-semibold text-[var(--muted)]">
                  Marketing & Channel Consent
                </h4>
                <div className="flex items-center gap-4 font-ui">
                  <span className={cn('flex items-center gap-1.5 font-medium', consent.sms ? 'text-[var(--green)]' : 'text-[var(--muted)]')}>
                    {consent.sms ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />} SMS (Active)
                  </span>
                  <span className={cn('flex items-center gap-1.5 font-medium', consent.email ? 'text-[var(--green)]' : 'text-[var(--muted)]')}>
                    {consent.email ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />} Email
                  </span>
                  <span className={cn('flex items-center gap-1.5 font-medium', consent.whatsapp ? 'text-[var(--green)]' : 'text-[var(--muted)]')}>
                    {consent.whatsapp ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />} WhatsApp
                  </span>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: Memberships & Packages */}
            <TabsContent value="memberships" className="space-y-4 pt-4">
              {activeMemberships.map((pkg: any, idx: number) => (
                <div
                  key={pkg.id || idx}
                  className="p-4 rounded-[var(--r-md)] bg-[var(--surface-2)] border border-[var(--line)] space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-display text-sm font-semibold text-[var(--ink)]">
                        {pkg.product_name || pkg.packageName}
                      </h4>
                      <p className="font-ui text-xs text-[var(--muted)] mt-0.5">
                        {pkg.category === 'reformer_pilates' ? 'Reformer Pilates Studio' : 'Gym Floor & Group Fitness'}
                      </p>
                    </div>
                    <Badge status={pkg.status === 'active' ? 'ok' : 'warn'} size="sm">
                      {pkg.status?.toUpperCase() || 'ACTIVE'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-[var(--line)] text-xs">
                    <div>
                      <span className="font-data text-[10px] text-[var(--muted)] block">Tariff:</span>
                      <span className="font-data font-bold text-[var(--ink)] tabular-nums">{formatINR(pkg.amount_paid || 0)}</span>
                    </div>
                    <div>
                      <span className="font-data text-[10px] text-[var(--muted)] block">Started:</span>
                      <span className="font-data tabular-nums text-[var(--ink)]">{pkg.start_date || member.joined_date || '—'}</span>
                    </div>
                    <div>
                      <span className="font-data text-[10px] text-[var(--muted)] block">Expires:</span>
                      <span className="font-data tabular-nums text-[var(--ink)] font-bold">{pkg.expiry_date || '—'}</span>
                    </div>
                    <div>
                      <span className="font-data text-[10px] text-[var(--muted)] block">
                        {pkg.sessions_total ? 'Sessions Left:' : 'Freeze Used:'}
                      </span>
                      <span className="font-data tabular-nums text-[var(--ink)]">
                        {pkg.sessions_total
                          ? `${pkg.sessions_remaining ?? 0} / ${pkg.sessions_total}`
                          : `${pkg.freeze_days_used || 0} / ${pkg.max_freeze_days || 30}d`}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {activeMemberships.length === 0 && (
                <div className="text-center py-8 text-xs text-[var(--muted)]">
                  No active memberships on file.
                </div>
              )}
            </TabsContent>

            {/* TAB 3: Attendance */}
            <TabsContent value="attendance" className="space-y-4 pt-4">
              <div className="p-4 rounded-[var(--r-md)] bg-[var(--surface-2)] border border-[var(--line)] text-xs space-y-2.5">
                <div className="flex justify-between py-1.5 border-b border-[var(--line)]">
                  <span className="font-ui text-[var(--muted)]">Total Studio Check-ins:</span>
                  <span className="font-data font-bold text-[var(--ink)] tabular-nums">{effectiveCheckIns} visits</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[var(--line)]">
                  <span className="font-ui text-[var(--muted)]">Current Attendance Streak:</span>
                  <span className="font-data font-bold text-[var(--amber)] tabular-nums">{effectiveStreak} consecutive days</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="font-ui text-[var(--muted)]">Last Turnstile Scan:</span>
                  <span className="font-data tabular-nums text-[var(--ink)]">{effectiveLastVisit ? formatDateTime(effectiveLastVisit) : 'No recent scans'}</span>
                </div>
              </div>

              {remoteProfile?.recentBookings && remoteProfile.recentBookings.length > 0 && (
                <div className="p-4 rounded-[var(--r-md)] bg-[var(--surface-2)] border border-[var(--line)] text-xs space-y-2">
                  <h4 className="font-data text-[10.5px] uppercase tracking-[0.14em] font-semibold text-[var(--muted)]">
                    Recent Class Bookings (Member Portal Sync)
                  </h4>
                  <div className="space-y-1.5">
                    {remoteProfile.recentBookings.map((b: any) => (
                      <div key={b.id} className="flex items-center justify-between py-1 border-b border-[var(--line)] last:border-0">
                        <span className="font-ui text-[var(--ink)] font-medium">{b.title} ({b.date} · {b.startTime})</span>
                        <Badge status={b.status === 'confirmed' || b.status === 'attended' ? 'ok' : 'warn'} size="sm">
                          {String(b.status).toUpperCase()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                  <div key={note.id} className="p-3 rounded-[var(--r-sm)] bg-[var(--surface-2)] border border-[var(--line)] text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-[var(--muted)]">
                      <span className="font-semibold text-[var(--accent)]">{note.authorName} ({note.authorRole})</span>
                      <span className="font-data tabular-nums">{formatDateTime(note.timestamp)}</span>
                    </div>
                    <p className="font-ui text-[var(--ink)]">{note.content}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Drawer>

      {/* Renew Modal */}
      <RenewMemberModal
        member={member}
        open={renewModalOpen}
        onOpenChange={setRenewModalOpen}
        onUpdated={onMemberUpdated}
      />

      {/* Block Member Confirmation Modal */}
      <Modal
        open={blockModalOpen}
        onOpenChange={setBlockModalOpen}
        title={`Block Member: ${member.name}`}
        description="Blocking revokes RFID/QR turnstile access immediately at the Powai studio."
        size="md"
      >
        <div className="space-y-4 pt-1 text-xs">
          <div className="p-3 rounded-xl bg-[rgba(255,92,122,0.12)] border border-[rgba(255,92,122,0.3)] text-[#FF5C7A] flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#FF5C7A]" />
            <p className="leading-relaxed">
              <strong>Warning:</strong> The member&apos;s RFID card, QR token, and live check-in access will be disabled until manually unblocked by an authorized manager.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white block">
              Reason for Block / Blacklist
            </label>
            <select
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              className="w-full h-[38px] px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] text-white text-xs outline-none focus:border-[#FF5C7A]"
            >
              <option value="Turnstile misconduct / conduct violation">Turnstile misconduct / conduct violation</option>
              <option value="Unpaid membership dues over 30 days">Unpaid membership dues over 30 days</option>
              <option value="Disciplinary hold / studio policy breach">Disciplinary hold / studio policy breach</option>
              <option value="Medical hold pending physician clearance">Medical hold pending physician clearance</option>
              <option value="Other administrative restriction">Other administrative restriction</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white block">
              Additional Notes / Incident Details (Optional)
            </label>
            <textarea
              value={customBlockReason}
              onChange={(e) => setCustomBlockReason(e.target.value)}
              placeholder="e.g. Disputed chargeback, verbal warning issued on 1st floor..."
              rows={3}
              className="w-full p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] text-white text-xs outline-none focus:border-[#FF5C7A] placeholder:text-[var(--ink-3)]"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--line)]">
            <button
              onClick={() => setBlockModalOpen(false)}
              className="px-4 py-2 rounded-full bg-[var(--surface)] text-[var(--ink-2)] hover:text-white border border-[var(--line)] font-medium text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmBlock}
              className="px-4 py-2 rounded-full bg-[#FF5C7A] text-[#12040A] font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow-[0_0_14px_rgba(255,92,122,0.4)] flex items-center gap-1.5 cursor-pointer"
            >
              <Ban className="w-3.5 h-3.5" /> Confirm Block
            </button>
          </div>
        </div>
      </Modal>

      <WhatsAppComposeModal
        isOpen={whatsAppModalOpen}
        onClose={() => setWhatsAppModalOpen(false)}
        recipient={{
          memberId: member.id,
          memberName: member.name,
          phone: member.phone,
          planName: activeMemberships[0]?.product_name,
          expiryDate: activeMemberships[0]?.expiry_date || undefined,
          memberCode: member.member_code,
          trainerName: member.assigned_trainer_name || undefined,
        }}
      />
    </>
  )
}
