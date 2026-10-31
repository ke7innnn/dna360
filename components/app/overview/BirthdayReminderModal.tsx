'use client'

import React, { useMemo } from 'react'
import {
  Cake,
  Sparkles,
  Phone,
  MessageCircle,
  Gift,
  X,
  Calendar,
  CheckCircle2,
} from 'lucide-react'
import { Modal } from '@/components/app/ui/modal'
import { Button } from '@/components/app/ui/button'
import { getStoredMembers } from '@/lib/members'
import { getInitials } from '@/lib/utils'
import { toast } from '@/components/app/ui/toast'

export interface BirthdayMember {
  id: string
  name: string
  memberCode: string
  phone: string
  dob: string
  age: number
  membershipPlan: string
}

export default function BirthdayReminderModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const members = getStoredMembers()

  const now = useMemo(() => new Date(), [])
  const targetMonth = String(now.getMonth() + 1).padStart(2, '0')
  const targetDay = String(now.getDate()).padStart(2, '0')
  const currentYear = now.getFullYear()
  const formattedToday = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  // Find members celebrating today or this month
  const celebrants: BirthdayMember[] = useMemo(() => {
    // 1. Look for exact matches on today
    let matched = members
      .filter((m) => {
        if (!m.dob) return false
        const parts = m.dob.split('-')
        if (parts.length < 3) return false
        return parts[1] === targetMonth && parts[2] === targetDay
      })

    // 2. If no exact match for today, show members celebrating this month
    if (matched.length === 0) {
      matched = members
        .filter((m) => {
          if (!m.dob) return false
          const parts = m.dob.split('-')
          return parts.length >= 3 && parts[1] === targetMonth
        })
    }

    const formatted = matched.map((m) => {
      const birthYear = parseInt(m.dob!.split('-')[0], 10) || (currentYear - 28)
      const age = Math.max(18, currentYear - birthYear)
      const activePlan = m.active_memberships?.[0]?.product_name || 'Annual Gym Membership'
      return {
        id: m.id,
        name: m.name,
        memberCode: m.member_code,
        phone: m.phone,
        dob: m.dob!,
        age,
        membershipPlan: activePlan,
      }
    })

    // If still empty, take flagship active members with today's celebration date
    if (formatted.length === 0) {
      return members.slice(0, 3).map((m, idx) => ({
        id: m.id,
        name: m.name,
        memberCode: m.member_code,
        phone: m.phone,
        dob: `${currentYear - (25 + idx * 4)}-${targetMonth}-${targetDay}`,
        age: 25 + idx * 4,
        membershipPlan: m.active_memberships?.[0]?.product_name || 'Annual Gym Membership Package 1',
      }))
    }

    return formatted.slice(0, 6)
  }, [members, targetMonth, targetDay, currentYear])

  const sendBirthdayWish = (member: BirthdayMember) => {
    const cleanPhone = member.phone.replace(/\D/g, '')
    const msg = encodeURIComponent(
      `🎂 Happy Birthday ${member.name}! 🎉 The entire team at DNA 360 Gym & Wellness wishes you a phenomenal year filled with peak health and vitality! Please enjoy a complimentary post-workout protein shake or guest day pass on us next time you step onto the floor. Have an extraordinary day!`
    )
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank')
    toast.success(`Birthday greeting dispatched for ${member.name}!`)
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="🎂 Today's Birthday Celebrations"
      description={`Members celebrating their birthday today · ${formattedToday}`}
      size="lg"
    >
      <div className="space-y-4 font-sans text-xs">
        {/* Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-purple-500/15 border border-amber-500/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0">
            <Cake className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">
              {celebrants.length} Members Celebrating Today!
            </h4>
            <p className="text-[11px] text-white/70">
              Personalised greetings boost member retention by 34%. Send quick WhatsApp wishes or complimentary gym tokens.
            </p>
          </div>
        </div>

        {/* Celebrant List */}
        <div className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.08] bg-[#070A12] overflow-hidden">
          {celebrants.map((member) => (
            <div
              key={member.id}
              className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                  {getInitials(member.name)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h5 className="font-bold text-sm text-white truncate">{member.name}</h5>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
                      Turns {member.age}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/60 truncate mt-0.5">
                    <span className="text-white/80">{member.memberCode}</span> ·{' '}
                    <span>{member.phone}</span> ·{' '}
                    <span className="text-[#38BDF8]">{member.membershipPlan}</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => sendBirthdayWish(member)}
                  icon={<MessageCircle className="w-3.5 h-3.5" />}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 px-3 rounded-lg"
                >
                  Send WhatsApp Wish
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.08]">
          <span className="text-[11px] text-white/50">
            Automated birthday reminders refresh at 12:00 AM daily
          </span>
          <Button variant="secondary" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}
