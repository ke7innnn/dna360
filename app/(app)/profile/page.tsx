'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  ArrowUp,
  User,
  Clock,
  FileText,
  Sparkles,
  Gift,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
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

  return (
    <div className="max-w-4xl mx-auto py-2 sm:py-6 px-3 sm:px-6 space-y-6 select-none">
      {/* ─── Top Nav Header ─── */}
      <div className="flex items-center justify-between pb-2">
        <button
          onClick={() => router.push('/dashboard')}
          className="w-10 h-10 rounded-full bg-[#111726] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-white hover:border-[#3B82F6] transition-colors cursor-pointer"
          aria-label="Back to Dashboard"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <h1 className="font-serif text-xl sm:text-2xl text-white font-normal tracking-tight">
          Membership
        </h1>

        <button
          onClick={() => toast.info('Support concierge available 24/7 on WhatsApp: +91 98200 36036')}
          className="text-xs text-[var(--ink-2)] hover:text-white font-medium px-3.5 py-1.5 rounded-full bg-[#111726] border border-[rgba(255,255,255,0.08)] cursor-pointer"
        >
          Help
        </button>
      </div>

      {/* ─── Main Membership Plan Card ─── */}
      <div className="rounded-[24px] bg-[#0E131F] border border-[rgba(255,255,255,0.08)] p-6 space-y-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/30 uppercase">
            ACTIVE
          </span>
          <span className="font-data text-[10.5px] text-[var(--ink-3)]">
            DNA-POW-2025-0892
          </span>
        </div>

        <div>
          <h2 className="font-serif text-2xl sm:text-3xl text-white font-normal leading-tight">
            12 months <em className="italic text-[#93C5FD]">Premium Annual</em>
          </h2>
        </div>

        {/* Validity Progress Bar */}
        <div className="space-y-2 pt-1">
          <div className="h-2 w-full bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#2563EB] to-[#60A5FA] rounded-full w-[78%]" />
          </div>
          <div className="flex items-center justify-between text-xs font-data text-[var(--ink-3)]">
            <span>Started 12 Oct &apos;25</span>
            <span>Ends 11 Oct &apos;26</span>
          </div>
        </div>

        {/* Card Split Action Buttons (Freeze | Upgrade) */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => setFreezeModalOpen(true)}
            className="py-3 rounded-xl bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.08)] text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <Pause className="w-3.5 h-3.5 text-[var(--ink-3)]" /> Freeze
          </button>
          <button
            onClick={() => setRenewModalOpen(true)}
            className="py-3 rounded-xl bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.08)] text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <ArrowUp className="w-3.5 h-3.5 text-[var(--ink-3)]" /> Upgrade
          </button>
        </div>
      </div>

      {/* ─── Entitlement List Rows ─── */}
      <div className="space-y-3">
        {/* Row 1: PT Sessions */}
        <Link
          href="/m/progress"
          className="p-4 rounded-[20px] bg-[#0E131F] border border-[rgba(255,255,255,0.07)] hover:border-[#3B82F6] hover:bg-[#111726] transition-all flex items-center justify-between cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[rgba(59,130,246,0.15)] border border-[rgba(59,130,246,0.3)] flex items-center justify-center text-[#60A5FA] group-hover:scale-105 transition-transform">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-ui text-sm font-bold text-white">
                6 of 12 PT sessions left
              </h4>
              <p className="font-ui text-xs text-[var(--ink-3)]">
                Elite tier · Rohan Kulkarni
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[var(--ink-3)] group-hover:text-white transition-colors" />
        </Link>

        {/* Row 2: Freeze Days */}
        <div
          onClick={() => setFreezeModalOpen(true)}
          className="p-4 rounded-[20px] bg-[#0E131F] border border-[rgba(255,255,255,0.07)] hover:border-[#3B82F6] hover:bg-[#111726] transition-all flex items-center justify-between cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[rgba(59,130,246,0.15)] border border-[rgba(59,130,246,0.3)] flex items-center justify-center text-[#60A5FA] group-hover:scale-105 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-ui text-sm font-bold text-white">
                18 of 30 freeze days left
              </h4>
              <p className="font-ui text-xs text-[var(--ink-3)]">
                Resets on renewal
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[var(--ink-3)] group-hover:text-white transition-colors" />
        </div>

        {/* Row 3: Invoices & Payments */}
        <Link
          href="/billing"
          className="p-4 rounded-[20px] bg-[#0E131F] border border-[rgba(255,255,255,0.07)] hover:border-[#3B82F6] hover:bg-[#111726] transition-all flex items-center justify-between cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[rgba(52,211,153,0.15)] border border-[rgba(52,211,153,0.3)] flex items-center justify-center text-[#34D399] group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-ui text-sm font-bold text-white">
                Invoices &amp; payments
              </h4>
              <p className="font-ui text-xs text-[var(--ink-3)]">
                11 receipts · nothing due
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[var(--ink-3)] group-hover:text-white transition-colors" />
        </Link>

        {/* Row 4: Refer a Friend */}
        <div
          onClick={() => toast.success('Referral link copied! Share with friends to earn ₹2,000 credit.')}
          className="p-4 rounded-[20px] bg-[#0E131F] border border-[rgba(255,255,255,0.07)] hover:border-[#3B82F6] hover:bg-[#111726] transition-all flex items-center justify-between cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[rgba(96,165,250,0.15)] border border-[rgba(96,165,250,0.3)] flex items-center justify-center text-[#60A5FA] group-hover:scale-105 transition-transform">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-ui text-sm font-bold text-white">
                Refer a friend
              </h4>
              <p className="font-ui text-xs text-[var(--ink-3)]">
                ₹2,000 credit each
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[var(--ink-3)] group-hover:text-white transition-colors" />
        </div>
      </div>

      {/* ─── Bottom CTA: Early Renewal Button ─── */}
      <div className="pt-2">
        <button
          onClick={() => setRenewModalOpen(true)}
          className="w-full py-4 rounded-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white font-bold font-ui text-sm shadow-[0_0_24px_rgba(37,99,235,0.45)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] active:scale-[0.99] transition-all cursor-pointer"
        >
          Renew early · save ₹4,000
        </button>
      </div>

      {/* Freeze & Renew Modals */}
      <FreezeMemberModal
        open={freezeModalOpen}
        onOpenChange={setFreezeModalOpen}
        onFrozen={() => toast.success('Membership freeze submitted')}
      />

      <RenewMemberModal
        member={{
          id: user?.id || 'mem_01',
          name: user?.name || 'Aditi',
          email: user?.email || 'aditi@gmail.com',
          phone: '+919820011223',
          member_code: 'DNA-POW-2026-88',
          status: 'active',
          joined_date: '12 Oct 2025',
          branch_id: 'pow',
          branch_name: 'Powai Flagship',
          active_memberships: [
            {
              id: 'mem_pkg_01',
              packageId: 'pkg_annual_01',
              product_name: '12 Months Premium Annual',
              category: 'gym_floor',
              status: 'active',
              start_date: '12 Oct 2025',
              expiry_date: '11 Oct 2026',
              amount_paid: 5400000,
              freeze_days_used: 12,
              max_freeze_days: 30,
            },
          ],
        } as any}
        open={renewModalOpen}
        onOpenChange={setRenewModalOpen}
        onUpdated={() => toast.success('Plan renewed successfully')}
      />
    </div>
  )
}
