'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  User,
  ShieldCheck,
  Building2,
  Clock,
  KeyRound,
  Mail,
  Phone,
  CheckCircle2,
  Calendar,
} from 'lucide-react'
import Card from '@/components/app/ui/glass-card'
import Badge from '@/components/app/ui/badge'
import Button from '@/components/app/ui/button'
import PageHeader from '@/components/app/ui/PageHeader'
import { useAuth } from '@/context/AuthContext'
import { getInitials } from '@/lib/utils'

export default function StaffSelfServiceProfilePage() {
  const router = useRouter()
  const { user, activeRole, isLoading } = useAuth()

  const isMember =
    user?.type === 'MEMBER' || String(user?.role?.slug || '').toLowerCase() === 'member'

  useEffect(() => {
    if (!isLoading && isMember) {
      router.replace('/m/ledger')
    }
  }, [isLoading, isMember, router])

  if (isLoading || isMember) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-[#38BDF8] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const displayName = user?.name || 'Staff Member'
  const designation = user?.designation || activeRole?.name || 'Staff'
  const email = user?.email || '—'
  const phone = user?.phone || '—'
  const branchName = user?.branches?.[0]?.name || 'Hiranandani Gardens, Powai'
  const capabilities = activeRole?.capabilities || user?.role?.capabilities || []

  return (
    <div className="max-w-5xl mx-auto space-y-6 select-none pb-12">
      <PageHeader
        eyebrow="STAFF SELF-SERVICE · POWAI FLAGSHIP"
        title="My Profile & Credentials"
        description="Employee identity, active shift assignment, biometric punch baseline, and granted RBAC security capabilities."
        actions={
          <Link href="/change-password">
            <Button variant="secondary" size="md" icon={<KeyRound className="w-3.5 h-3.5" />}>
              Change Password
            </Button>
          </Link>
        }
      />

      {/* Identity & Branch Card */}
      <Card className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#3B82F6] via-[#2563EB] to-[#1D4ED8] border border-[rgba(59,130,246,0.5)] flex items-center justify-center text-white font-display text-xl font-bold shrink-0 shadow-[0_0_20px_rgba(59,130,246,0.35)]">
            {getInitials(displayName)}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="font-display text-xl font-bold text-[var(--ink)]">{displayName}</h2>
              <Badge status="ok" size="sm">Active Staff</Badge>
            </div>
            <p className="font-ui text-xs text-[var(--muted)] uppercase tracking-wider font-semibold">
              {designation} · Role: {user?.role?.slug || 'staff'}
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-[var(--ink-2)]">
              <span className="inline-flex items-center gap-1.5 break-all">
                <Mail className="w-3.5 h-3.5 text-[var(--muted)] shrink-0" />
                {email}
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono">
                <Phone className="w-3.5 h-3.5 text-[var(--muted)]" />
                {phone}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[var(--accent)]" />
                {branchName}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Shift & Biometric Self-Service Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
              Assigned Shift Window
            </span>
            <Calendar className="w-4 h-4 text-[var(--accent)]" />
          </div>
          <p className="font-display text-lg font-bold text-[var(--ink)]">06:00 – 22:00 IST</p>
          <p className="text-xs text-[var(--muted)]">Powai Studio · Duty Roster Active</p>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
              Biometric Attendance
            </span>
            <Clock className="w-4 h-4 text-[#10B981]" />
          </div>
          <p className="font-display text-lg font-bold text-[#10B981]">Verified On-Duty</p>
          <p className="text-xs text-[var(--muted)]">Synced with Powai Turnstile Terminal</p>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
              Security Posture
            </span>
            <ShieldCheck className="w-4 h-4 text-[#60A5FA]" />
          </div>
          <p className="font-display text-lg font-bold text-[var(--ink)]">
            {user?.can_view_revenue ? 'Executive Revenue Tier' : 'Operational Scoped Tier'}
          </p>
          <p className="text-xs text-[var(--muted)]">
            {capabilities.length} atomic capabilities granted
          </p>
        </Card>
      </div>

      {/* Granted Capabilities */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[var(--accent)]" />
          <h3 className="font-display text-sm font-semibold text-[var(--ink)]">
            Granted RBAC Capabilities ({capabilities.length})
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {capabilities.map((cap) => (
            <span
              key={cap}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface-2)] border border-[var(--line)] font-mono text-[11px] text-[var(--ink-2)]"
            >
              <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
              {cap}
            </span>
          ))}
        </div>
      </Card>
    </div>
  )
}
