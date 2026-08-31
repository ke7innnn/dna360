'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Activity, AlertTriangle, ArrowRight,
  MessageSquare, UserCheck, Phone, ShieldCheck,
} from 'lucide-react'
import Card from '@/components/app/ui/glass-card'
import Badge from '@/components/app/ui/badge'
import WhatsAppComposeModal from '@/components/app/whatsapp/WhatsAppComposeModal'
import { computeChurnRadar, type ChurnRiskProfile } from '@/lib/churn'
import { maskPhoneNumber } from '@/lib/auth'

export default function ChurnRadar() {
  const [atRiskList] = useState<ChurnRiskProfile[]>(() => computeChurnRadar())
  const [waModalOpen, setWaModalOpen] = useState(false)
  const [activeRecipient, setActiveRecipient] = useState<any>(null)

  const handleTriggerWhatsApp = (member: ChurnRiskProfile) => {
    setActiveRecipient({
      memberId: member.memberId,
      memberName: member.memberName,
      phone: member.phone,
      planName: member.planName,
      trainerName: member.assignedTrainer,
    })
    setWaModalOpen(true)
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--red)] shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
            <h3 className="font-display font-semibold text-base text-[var(--ink)]">
              Churn Radar · Attendance Decay Velocity
            </h3>
            <Badge status="danger" size="sm">
              {atRiskList.length} Members At Risk
            </Badge>
          </div>
          <span className="font-ui text-xs text-[var(--muted)] hidden sm:inline">
            Triggered by &gt;50% visit frequency drop
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {atRiskList.map((m) => (
            <div
              key={m.memberId}
              className="p-4 rounded-xl bg-gradient-to-b from-[rgba(255,255,255,0.03)] to-[rgba(255,255,255,0.01)] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(239,68,68,0.35)] flex flex-col justify-between gap-3 transition-all duration-200"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-ui font-bold text-sm text-[var(--ink)] truncate">
                    {m.memberName}
                  </span>
                  <span
                    className={`text-[10px] font-ui font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      m.riskLevel === 'CRITICAL'
                        ? 'bg-[rgba(239,68,68,0.15)] text-[#EF4444] border border-[rgba(239,68,68,0.3)]'
                        : 'bg-[rgba(245,158,11,0.15)] text-[#F59E0B] border border-[rgba(245,158,11,0.3)]'
                    }`}
                  >
                    Risk {m.riskScore}
                  </span>
                </div>

                <p className="font-data text-[10.5px] text-[var(--muted)] mb-2">
                  {m.memberCode} · {m.planName}
                </p>

                <div className="p-2.5 rounded-lg bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.15)] text-xs font-ui text-[var(--ink-2)] space-y-1">
                  <div className="flex items-center gap-1.5 text-[#F87171] font-semibold text-[11px]">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    <span>{m.primaryRiskFactor}</span>
                  </div>
                  <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                    Rec: {m.recommendedIntervention}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[rgba(255,255,255,0.04)] gap-2">
                <button
                  onClick={() => handleTriggerWhatsApp(m)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[rgba(37,211,102,0.12)] hover:bg-[#25D366] hover:text-white border border-[rgba(37,211,102,0.25)] text-[#25D366] text-xs font-ui font-semibold transition-all cursor-pointer"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>Winback WA</span>
                </button>

                <Link
                  href={`/members/${m.memberId}`}
                  className="inline-flex items-center gap-1 text-xs font-ui font-semibold text-[var(--accent)] hover:underline"
                >
                  <span>Profile</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* WhatsApp Modal */}
      {activeRecipient && (
        <WhatsAppComposeModal
          isOpen={waModalOpen}
          onClose={() => setWaModalOpen(false)}
          recipient={activeRecipient}
          defaultTemplateCategory="CHURN_WINBACK"
        />
      )}
    </>
  )
}
