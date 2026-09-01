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
    <div className="max-w-md mx-auto py-2 sm:py-4 px-1 select-none">
      {/* ─── Phone Shell Container ─── */}
      <div className="relative bg-[#08090C] border border-[rgba(255,255,255,0.13)] rounded-[32px] sm:rounded-[38px] p-4 sm:p-5 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9)] overflow-hidden space-y-4">
        <div className="absolute -left-[20%] -bottom-[30%] w-[140%] h-[60%] bg-[radial-gradient(ellipse_at_50%_100%,rgba(255,92,122,0.13),rgba(120,90,220,0.07)_45%,transparent_70%)] pointer-events-none" />

        {/* ─── Nav Header ─── */}
        <div className="flex items-center justify-between pt-1 pb-2">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1 text-[var(--ink-2)] hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <span className="font-bold text-sm text-white">Membership</span>
          <button
            onClick={() => toast.info('Support concierge available 24/7 on WhatsApp')}
            className="text-[11px] text-[var(--ink-2)] hover:text-white font-medium"
          >
            Help
          </button>
        </div>

        {/* ─── Active Membership Card ─── */}
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-card)] p-4 sm:p-5 space-y-3">
          <span className="member-pill member-pill-live">
            ACTIVE
          </span>

          <div className="flex items-start justify-between gap-3 pt-1">
            <h3 className="text-xl sm:text-2xl font-bold text-white font-display leading-tight max-w-[200px]">
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

        {/* ─── Entitlement Rows ─── */}
        <div className="member-rows">
          {/* Row 1: PT Sessions */}
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

          {/* Row 2: Freeze Days */}
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

          {/* Row 3: Invoices */}
          <Link href="/billing">
            <div className="member-row cursor-pointer">
              <div className="member-row-ic">
                <FileText className="w-4 h-4 stroke-[#FF5C7A]" />
              </div>
              <div className="member-row-txt">
                <b className="text-white">Invoices</b>
                <span>11 receipts</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--ink-3)]" />
            </div>
          </Link>
        </div>

        {/* ─── What's Included Section ─── */}
        <div>
          <div
            onClick={() => setWhatsIncludedOpen(!whatsIncludedOpen)}
            className="flex items-center justify-between py-2 cursor-pointer"
          >
            <h4 className="text-xs font-bold text-white tracking-tight">
              What&apos;s included
            </h4>
            <ChevronRight
              className={`w-3.5 h-3.5 text-[var(--ink-3)] transition-transform ${
                whatsIncludedOpen ? 'rotate-90' : ''
              }`}
            />
          </div>

          {whatsIncludedOpen && (
            <div className="member-rows">
              <div className="member-row">
                <div className="member-row-ic">
                  <Dumbbell className="w-4 h-4 stroke-[#FF5C7A]" />
                </div>
                <div className="member-row-txt">
                  <b className="text-white">Unlimited gym floor access</b>
                  <span>6 am to 11 pm, all days</span>
                </div>
              </div>

              <div className="member-row">
                <div className="member-row-ic">
                  <Clock className="w-4 h-4 stroke-[#FF5C7A]" />
                </div>
                <div className="member-row-txt">
                  <b className="text-white">4 group classes a week</b>
                  <span>Yoga, HIIT, Zumba, spin</span>
                </div>
              </div>

              <div className="member-row">
                <div className="member-row-ic">
                  <Award className="w-4 h-4 stroke-[#FF5C7A]" />
                </div>
                <div className="member-row-txt">
                  <b className="text-white">2 Reformer Pilates sessions</b>
                  <span>Per month, booking required</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── Bottom CTA ─── */}
        <div className="pt-2">
          <button
            onClick={() => setRenewModalOpen(true)}
            className="w-full py-3.5 rounded-full bg-transparent border border-[var(--line-strong)] text-white hover:border-[#FF5C7A] hover:text-[#FF5C7A] font-bold text-xs transition-all flex items-center justify-center gap-1.5"
          >
            Renew early · save ₹4,000
          </button>
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
