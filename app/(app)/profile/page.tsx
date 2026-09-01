'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  ArrowUp,
  Dumbbell,
  Clock,
  FileText,
  Calendar,
  Sparkles,
  Award,
  ShieldCheck,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/components/app/ui/toast'
import FreezeMemberModal from '@/components/app/members/FreezeMemberModal'
import RenewMemberModal from '@/components/app/members/RenewMemberModal'

export default function MemberProfileMembershipPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [freezeModalOpen, setFreezeModalOpen] = useState(false)
  const [renewModalOpen, setRenewModalOpen] = useState(false)
  const [whatsIncludedOpen, setWhatsIncludedOpen] = useState(true)

  return (
    <div className="max-w-5xl mx-auto py-2 sm:py-6 px-2 sm:px-4 space-y-6 select-none">
      {/* ─── Top Nav Header ─── */}
      <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-white hover:text-[#FF5C7A] transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="font-bold text-base sm:text-lg font-display">Membership & Entitlements</span>
        </button>
        <button
          onClick={() => toast.info('Support concierge available 24/7 on WhatsApp')}
          className="text-xs text-[var(--ink-2)] hover:text-white font-medium px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--line)]"
        >
          Help & Support
        </button>
      </div>

      {/* ─── Responsive Grid: 2-Columns on PC, Single on Mobile ─── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column (6 cols on PC) */}
        <div className="md:col-span-6 space-y-6">
          {/* Active Membership Card */}
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-card)] p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="member-pill member-pill-live">
                ACTIVE
              </span>
              <span className="font-data text-[10px] text-[var(--ink-3)]">
                DNA-POW-2025-0892
              </span>
            </div>

            <div className="flex items-start justify-between gap-3 pt-1">
              <h3 className="text-xl sm:text-2xl font-bold text-white font-display leading-tight">
                12 months<br />Premium Annual
              </h3>

              {/* 5 Capsule Gradient Bars */}
              <div className="flex items-end gap-[3px]">
                <i className="w-[3px] h-[14px] rounded-[2px] bg-[#FF5C7A]/50 block" />
                <i className="w-[3px] h-[20px] rounded-[2px] bg-[#F0699C]/60 block" />
                <i className="w-[3px] h-[26px] rounded-[2px] bg-[#C86DD7]/70 block" />
                <i className="w-[3px] h-[20px] rounded-[2px] bg-[#9B7BE8]/60 block" />
                <i className="w-[3px] h-[14px] rounded-[2px] bg-[#6E8CF0]/50 block" />
              </div>
            </div>

            {/* Validity Progress Bar */}
            <div>
              <div className="member-bar">
                <i style={{ width: '71%' }} />
              </div>
              <div className="member-bar-meta">
                <span>STARTS 12 OCT &apos;25</span>
                <span>ENDS 11 OCT &apos;26</span>
              </div>
            </div>

            {/* Card Split Action Buttons (Freeze | Upgrade) */}
            <div className="member-card-split">
              <button onClick={() => setFreezeModalOpen(true)}>
                <Pause className="w-3.5 h-3.5" /> Freeze
              </button>
              <div className="divider" />
              <button onClick={() => setRenewModalOpen(true)}>
                <ArrowUp className="w-3.5 h-3.5" /> Upgrade
              </button>
            </div>
          </div>

          {/* Early Renewal Benefit Tile */}
          <div className="bg-[rgba(255,92,122,0.06)] border border-[rgba(255,92,122,0.3)] rounded-[var(--r-card)] p-5 space-y-2">
            <div className="flex items-center justify-between">
              <b className="text-sm font-bold text-white">Early Renewal Benefit</b>
              <span className="font-data text-xs text-[#FF5C7A] font-bold">SAVE ₹4,000</span>
            </div>
            <p className="text-xs text-[var(--ink-2)] leading-relaxed">
              Renew before 11 October 2026 to lock in your foundation tariff and waive annual registration fee.
            </p>
            <button
              onClick={() => setRenewModalOpen(true)}
              className="w-full mt-2 py-3 rounded-full bg-[#FF5C7A] text-[#12040A] font-bold text-xs hover:brightness-110 active:scale-[0.99] transition-all shadow-[0_0_14px_rgba(255,92,122,0.3)]"
            >
              Renew early · save ₹4,000
            </button>
          </div>
        </div>

        {/* Right Column (6 cols on PC) */}
        <div className="md:col-span-6 space-y-6">
          {/* Entitlement Rows */}
          <div className="member-rows">
            <Link href="/m/ledger">
              <div className="member-row cursor-pointer">
                <div className="member-row-ic">
                  <Dumbbell className="w-4 h-4 stroke-[#FF5C7A]" />
                </div>
                <div className="member-row-txt">
                  <b className="text-white">6 of 12 PT sessions left</b>
                  <span>Elite tier · with Rohan</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--ink-3)]" />
              </div>
            </Link>

            <div
              onClick={() => setFreezeModalOpen(true)}
              className="member-row cursor-pointer"
            >
              <div className="member-row-ic">
                <Clock className="w-4 h-4 stroke-[#FF5C7A]" />
              </div>
              <div className="member-row-txt">
                <b className="text-white">18 of 30 freeze days left</b>
                <span>Resets on renewal</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--ink-3)]" />
            </div>

            <Link href="/billing">
              <div className="member-row cursor-pointer">
                <div className="member-row-ic">
                  <FileText className="w-4 h-4 stroke-[#FF5C7A]" />
                </div>
                <div className="member-row-txt">
                  <b className="text-white">Invoices & Receipts</b>
                  <span>11 receipts</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--ink-3)]" />
              </div>
            </Link>
          </div>

          {/* What's Included Card */}
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-card)] p-5 space-y-3">
            <div
              onClick={() => setWhatsIncludedOpen(!whatsIncludedOpen)}
              className="flex items-center justify-between cursor-pointer"
            >
              <h4 className="text-sm font-bold text-white tracking-tight">
                What&apos;s included in your plan
              </h4>
              <ChevronRight
                className={`w-4 h-4 text-[var(--ink-3)] transition-transform ${
                  whatsIncludedOpen ? 'rotate-90' : ''
                }`}
              />
            </div>

            {whatsIncludedOpen && (
              <div className="divide-y divide-[var(--line)] pt-1 text-xs">
                <div className="py-2.5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--surface-2)] flex items-center justify-center shrink-0">
                    <Dumbbell className="w-4 h-4 stroke-[#FF5C7A]" />
                  </div>
                  <div>
                    <b className="text-white block font-medium">Unlimited gym floor access</b>
                    <span className="text-[var(--ink-3)] text-[11px] block mt-0.5">6 am to 11 pm, all 365 days</span>
                  </div>
                </div>

                <div className="py-2.5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--surface-2)] flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 stroke-[#FF5C7A]" />
                  </div>
                  <div>
                    <b className="text-white block font-medium">4 group classes a week</b>
                    <span className="text-[var(--ink-3)] text-[11px] block mt-0.5">Yoga, HIIT, Zumba, Spin</span>
                  </div>
                </div>

                <div className="py-2.5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--surface-2)] flex items-center justify-center shrink-0">
                    <Award className="w-4 h-4 stroke-[#FF5C7A]" />
                  </div>
                  <div>
                    <b className="text-white block font-medium">2 Reformer Pilates sessions</b>
                    <span className="text-[var(--ink-3)] text-[11px] block mt-0.5">Per month, booking required</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <FreezeMemberModal
        open={freezeModalOpen}
        onOpenChange={setFreezeModalOpen}
        member={null}
        onFrozen={() => toast.success('Membership frozen')}
      />

      <RenewMemberModal
        open={renewModalOpen}
        onOpenChange={setRenewModalOpen}
        member={null}
        onRenewed={() => toast.success('Membership renewed')}
      />
    </div>
  )
}
