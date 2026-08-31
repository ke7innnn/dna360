'use client'

import React, { useState } from 'react'
import {
  MessageSquare, X, Send, ShieldCheck,
  AlertCircle, CheckCircle2, Sparkles, Phone,
} from 'lucide-react'
import Button from '@/components/app/ui/button'
import Badge from '@/components/app/ui/badge'
import {
  APPROVED_TEMPLATES,
  getWhatsAppBudget,
  sendWhatsAppMessage,
  interpolateTemplate,
  type WhatsAppTemplate,
} from '@/lib/whatsapp'
import { maskPhoneNumber } from '@/lib/auth'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/components/app/ui/toast'

interface WhatsAppComposeModalProps {
  isOpen: boolean
  onClose: () => void
  recipient: {
    memberId: string
    memberName: string
    phone: string
    planName?: string
    expiryDate?: string
    sessionsLeft?: number | string
    trainerName?: string
    memberCode?: string
    daysLeft?: number | string
  }
  defaultTemplateCategory?: 'RENEWAL' | 'GRACE_PERIOD' | 'PT_UPSELL' | 'CHURN_WINBACK' | 'ONBOARDING'
  onSuccess?: () => void
}

export default function WhatsAppComposeModal({
  isOpen,
  onClose,
  recipient,
  defaultTemplateCategory = 'RENEWAL',
  onSuccess,
}: WhatsAppComposeModalProps) {
  const { user } = useAuth()
  const budget = getWhatsAppBudget()

  const availableTemplates = APPROVED_TEMPLATES.filter((t) =>
    defaultTemplateCategory ? t.category === defaultTemplateCategory || true : true
  )

  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate>(() => {
    return (
      APPROVED_TEMPLATES.find((t) => t.category === defaultTemplateCategory) ||
      APPROVED_TEMPLATES[0]
    )
  })

  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  // Build interpolation variable map
  const variables: Record<string, string> = {
    member_name: recipient.memberName,
    plan_name: recipient.planName || 'Annual Gym Membership',
    expiry_date: recipient.expiryDate || '15 Sep 2026',
    sessions_left: String(recipient.sessionsLeft || '2'),
    trainer_name: recipient.trainerName || 'Rajesh Poojary',
    member_code: recipient.memberCode || 'DNA-2025-001',
    days_left: String(recipient.daysLeft || '5'),
  }

  const messagePreview = interpolateTemplate(selectedTemplate, variables)

  const handleSend = () => {
    setLoading(true)

    const actor = {
      id: user?.id || 'usr_staff',
      name: user?.name || 'Staff Member',
      email: user?.email || '',
      role: user?.role.name || 'Staff',
    }

    const res = sendWhatsAppMessage({
      memberId: recipient.memberId,
      memberName: recipient.memberName,
      phone: recipient.phone,
      templateId: selectedTemplate.id,
      variables,
      actor,
      branchId: user?.branchId || 'pow',
    })

    setLoading(false)

    if (res.success) {
      toast.success(`WhatsApp message sent to ${recipient.memberName}`, {
        description: `Remaining monthly budget: ₹${res.remainingBudgetInr?.toFixed(2)}`,
      })
      onSuccess?.()
      onClose()
    } else {
      toast.error('Send Failed', {
        description: res.error,
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="w-full max-w-lg bg-[#0C0E14] border border-[rgba(255,255,255,0.12)] rounded-[20px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[rgba(255,255,255,0.08)] bg-gradient-to-r from-[rgba(37,211,102,0.10)] to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(37,211,102,0.15)] border border-[rgba(37,211,102,0.30)] flex items-center justify-center text-[#25D366] shadow-[0_0_12px_rgba(37,211,102,0.25)]">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-base text-[var(--ink)]">
                WhatsApp Cloud Compose
              </h3>
              <p className="font-ui text-xs text-[var(--muted)]">
                Meta Official Verified Channel · Powai
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--muted)] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Recipient Card */}
          <div className="p-3 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] flex items-center justify-between">
            <div>
              <span className="font-ui text-[11px] uppercase tracking-wider text-[var(--muted)] font-semibold block">
                Recipient
              </span>
              <span className="font-ui text-sm font-bold text-[var(--ink)]">
                {recipient.memberName}
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-data text-xs text-[#25D366] bg-[rgba(37,211,102,0.10)] border border-[rgba(37,211,102,0.20)] px-2.5 py-1 rounded-full">
              <Phone className="w-3 h-3" />
              <span>{maskPhoneNumber(recipient.phone)}</span>
            </div>
          </div>

          {/* Template Selector */}
          <div>
            <label className="font-ui text-xs font-semibold text-[var(--ink-2)] block mb-1.5">
              Select Approved Meta Template
            </label>
            <select
              value={selectedTemplate.id}
              onChange={(e) => {
                const found = APPROVED_TEMPLATES.find((t) => t.id === e.target.value)
                if (found) setSelectedTemplate(found)
              }}
              className="w-full bg-[#13161F] border border-[rgba(255,255,255,0.12)] text-[var(--ink)] text-xs font-ui rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[var(--accent)]"
            >
              {availableTemplates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name} ({tpl.category})
                </option>
              ))}
            </select>
          </div>

          {/* Message Preview (WhatsApp Chat Bubble Look) */}
          <div>
            <span className="font-ui text-xs font-semibold text-[var(--ink-2)] block mb-1.5">
              Live Message Preview
            </span>
            <div className="p-4 rounded-2xl bg-[#054640]/60 border border-[rgba(37,211,102,0.30)] text-[var(--ink)] space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between text-[11px] text-[#25D366] font-semibold">
                <span>{selectedTemplate.headerText || 'DNA 360 Powai'}</span>
                <span className="text-[10px] text-[var(--muted)]">Preview</span>
              </div>
              <p className="font-ui text-[13px] text-white/90 leading-relaxed whitespace-pre-wrap">
                {messagePreview}
              </p>
              <div className="text-right">
                <span className="font-data text-[10px] text-white/40">Now · Sent from Meta API</span>
              </div>
            </div>
          </div>

          {/* Budget Guard Meter */}
          <div className="p-3 rounded-xl bg-[rgba(59,130,246,0.06)] border border-[rgba(59,130,246,0.18)] flex items-center justify-between text-xs font-ui">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span className="font-semibold text-[var(--ink)]">Meta Budget Guard Active</span>
              </div>
              <p className="text-[11px] text-[var(--muted)]">
                ₹{budget.spentThisMonthInr.toFixed(2)} spent of ₹{budget.monthlyLimitInr.toLocaleString()} monthly cap (₹0.85/msg)
              </p>
            </div>
            <Badge status="ok" size="sm">
              ₹{(budget.monthlyLimitInr - budget.spentThisMonthInr).toFixed(0)} Available
            </Badge>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[rgba(255,255,255,0.08)] bg-[#080A0E] flex items-center justify-end gap-2.5">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSend}
            disabled={loading || budget.isBudgetExceeded}
            icon={<Send className="w-3.5 h-3.5" />}
          >
            {loading ? 'Transmitting...' : 'Send WhatsApp Message'}
          </Button>
        </div>
      </div>
    </div>
  )
}
