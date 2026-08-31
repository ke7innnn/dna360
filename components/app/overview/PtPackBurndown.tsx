'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Dumbbell, MessageSquare, ArrowRight, Sparkles, User } from 'lucide-react'
import Card from '@/components/app/ui/glass-card'
import Badge from '@/components/app/ui/badge'
import WhatsAppComposeModal from '@/components/app/whatsapp/WhatsAppComposeModal'
import { getStoredMembers } from '@/lib/members'

export default function PtPackBurndown() {
  const members = getStoredMembers()

  // Filter packs >=80% consumed or <=3 sessions remaining
  const burndownList = members
    .filter((m) => {
      const ms = m.active_memberships[0]
      return ms && ms.sessions_total && ms.sessions_remaining !== null && ms.sessions_remaining <= 3
    })
    .slice(0, 4)

  const [waModalOpen, setWaModalOpen] = useState(false)
  const [activeRecipient, setActiveRecipient] = useState<any>(null)

  const handleTriggerWhatsApp = (m: any) => {
    const ms = m.active_memberships[0]
    setActiveRecipient({
      memberId: m.id,
      memberName: m.name,
      phone: m.phone,
      planName: ms.product_name,
      sessionsLeft: ms.sessions_remaining,
      trainerName: m.assigned_trainer_name || 'Rajesh Poojary',
    })
    setWaModalOpen(true)
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--amber)] shadow-[0_0_8px_#F59E0B] animate-pulse" />
            <h3 className="font-display font-semibold text-base text-[var(--ink)]">
              PT &amp; Pilates Pack Burn-Down Radar
            </h3>
            <Badge status="warn" size="sm">
              &ge;80% Consumed
            </Badge>
          </div>
          <span className="font-ui text-xs text-[var(--muted)] hidden sm:inline">
            Top-up renewal pipeline
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {burndownList.map((m) => {
            const ms = m.active_memberships[0]
            const consumedPct = Math.round(
              (((ms.sessions_total || 12) - (ms.sessions_remaining || 0)) / (ms.sessions_total || 12)) * 100
            )

            return (
              <div
                key={m.id}
                className="p-4 rounded-xl bg-gradient-to-r from-[rgba(255,255,255,0.03)] to-[rgba(255,255,255,0.01)] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(245,158,11,0.35)] flex flex-col justify-between gap-3 transition-all duration-200"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-ui font-bold text-sm text-[var(--ink)]">
                      {m.name}
                    </span>
                    <span className="text-[10px] font-ui font-bold px-2 py-0.5 rounded-full bg-[rgba(245,158,11,0.15)] text-[#F59E0B] border border-[rgba(245,158,11,0.3)] uppercase">
                      {ms.sessions_remaining} Sessions Left
                    </span>
                  </div>

                  <p className="font-data text-[10.5px] text-[var(--muted)] mb-2">
                    {ms.product_name} · Coach {m.assigned_trainer_name || 'Rajesh Poojary'}
                  </p>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10.5px] font-data text-[var(--muted)]">
                      <span>Consumed: {consumedPct}%</span>
                      <span>{(ms.sessions_total || 12) - (ms.sessions_remaining || 0)} / {ms.sessions_total} Delivered</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[rgba(255,255,255,0.08)] overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#F59E0B] to-[#EF4444] rounded-full"
                        style={{ width: `${consumedPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[rgba(255,255,255,0.04)]">
                  <button
                    onClick={() => handleTriggerWhatsApp(m)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[rgba(37,211,102,0.12)] hover:bg-[#25D366] hover:text-white border border-[rgba(37,211,102,0.25)] text-[#25D366] text-xs font-ui font-semibold transition-all cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp Top-Up</span>
                  </button>

                  <Link
                    href={`/members/${m.id}`}
                    className="inline-flex items-center gap-1 text-xs font-ui font-semibold text-[var(--accent)] hover:underline"
                  >
                    <span>Member Detail</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* WhatsApp Modal */}
      {activeRecipient && (
        <WhatsAppComposeModal
          isOpen={waModalOpen}
          onClose={() => setWaModalOpen(false)}
          recipient={activeRecipient}
          defaultTemplateCategory="PT_UPSELL"
        />
      )}
    </>
  )
}
