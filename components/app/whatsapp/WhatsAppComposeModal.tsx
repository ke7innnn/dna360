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
  type WhatsAppCategory,
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
    dueAmount?: number | string
  }
  defaultTemplateCategory?: WhatsAppCategory
  onSuccess?: () => void
}

export default function WhatsAppComposeModal({
  isOpen,
  onClose,
  recipient,
  defaultTemplateCategory = 'ALL',
  onSuccess,
}: WhatsAppComposeModalProps) {
  const { user } = useAuth()
  const budget = getWhatsAppBudget()

  const [activeCategory, setActiveCategory] = useState<WhatsAppCategory>(defaultTemplateCategory)

  const filteredTemplates = APPROVED_TEMPLATES.filter((t) =>
    activeCategory === 'ALL' ? true : t.category === activeCategory
  )

  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate>(() => {
    if (defaultTemplateCategory && defaultTemplateCategory !== 'ALL') {
      const match = APPROVED_TEMPLATES.find((t) => t.category === defaultTemplateCategory)
      if (match) return match
    }
    return APPROVED_TEMPLATES[0]
  })

  // Dynamic variable map
  const [customVariables, setCustomVariables] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  // Build current merged variables
  const currentVariables: Record<string, string> = {
    1: recipient.memberName,
    member_name: recipient.memberName,
    2: selectedTemplate.parameters.find((p) => p.index === 2)?.placeholder || '',
    3: selectedTemplate.parameters.find((p) => p.index === 3)?.placeholder || '',
    4: selectedTemplate.parameters.find((p) => p.index === 4)?.placeholder || '',
    ...customVariables,
  }

  // Pre-seed known context values
  if (recipient.planName && !customVariables['plan_name'] && !customVariables['2']) {
    currentVariables['plan_name'] = recipient.planName
    if (selectedTemplate.id === 'tpl_membership_update' || selectedTemplate.id === 'tpl_membership_renewal_confirmed') {
      currentVariables['2'] = recipient.planName
    }
  }
  if (recipient.expiryDate && !customVariables['expiry_date']) {
    currentVariables['expiry_date'] = recipient.expiryDate
    if (selectedTemplate.id === 'tpl_membership_expiry_reminder') {
      currentVariables['2'] = recipient.expiryDate
    }
  }
  if (recipient.dueAmount && !customVariables['due_amount']) {
    currentVariables['due_amount'] = String(recipient.dueAmount)
    if (selectedTemplate.id === 'tpl_payment_reminder') {
      currentVariables['2'] = String(recipient.dueAmount)
    }
  }

  const messagePreview = interpolateTemplate(selectedTemplate, currentVariables)

  const handleSend = async () => {
    setLoading(true)

    const actor = {
      id: user?.id || 'usr_staff',
      name: user?.name || 'Staff Member',
      email: user?.email || '',
      role: user?.role.name || 'Staff',
    }

    try {
      const res = await sendWhatsAppMessage({
        memberId: recipient.memberId,
        memberName: recipient.memberName,
        phone: recipient.phone,
        templateId: selectedTemplate.id,
        variables: currentVariables,
        actor,
        branchId: user?.branchId || 'pow',
      })

      setLoading(false)

      if (res.success) {
        toast.success(`WhatsApp message sent to ${recipient.memberName}`, {
          description: `Template: ${selectedTemplate.metaTemplateName}. Remaining budget: ₹${res.remainingBudgetInr?.toFixed(2)}`,
        })
        onSuccess?.()
        onClose()
      } else {
        toast.error('Send Failed', {
          description: res.error,
        })
      }
    } catch (err: any) {
      setLoading(false)
      toast.error('Transmission Error', {
        description: err.message || 'Unable to send WhatsApp message.',
      })
    }
  }

  const categories: { key: WhatsAppCategory; label: string }[] = [
    { key: 'ALL', label: 'All (11)' },
    { key: 'ONBOARDING', label: 'Onboarding' },
    { key: 'BILLING', label: 'Billing' },
    { key: 'RENEWAL', label: 'Renewal' },
    { key: 'CLASSES', label: 'Classes' },
    { key: 'ANNOUNCEMENTS', label: 'Notices' },
    { key: 'MARKETING', label: 'Marketing' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="w-full max-w-xl bg-[#0C0E14] border border-[rgba(255,255,255,0.12)] rounded-[24px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[rgba(255,255,255,0.08)] bg-gradient-to-r from-[rgba(37,211,102,0.12)] to-transparent shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(37,211,102,0.15)] border border-[rgba(37,211,102,0.30)] flex items-center justify-center text-[#25D366] shadow-[0_0_12px_rgba(37,211,102,0.25)]">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-base text-[var(--ink)]">
                WhatsApp Cloud Official Dispatch
              </h3>
              <p className="font-ui text-xs text-[var(--muted)]">
                Meta Official WhatsApp Business API · DNA 360 Fitness
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

        {/* Scrollable Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Recipient Card */}
          <div className="p-3 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] flex items-center justify-between">
            <div>
              <span className="font-ui text-[11px] uppercase tracking-wider text-[var(--muted)] font-semibold block">
                Recipient Member
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

          {/* Category Filter Pills */}
          <div>
            <span className="font-ui text-xs font-semibold text-[var(--muted)] block mb-1.5">
              Filter by Flow
            </span>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => {
                    setActiveCategory(c.key)
                    const firstInCat = APPROVED_TEMPLATES.find((t) =>
                      c.key === 'ALL' ? true : t.category === c.key
                    )
                    if (firstInCat) setSelectedTemplate(firstInCat)
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-ui font-medium transition-all ${
                    activeCategory === c.key
                      ? 'bg-[#25D366] text-black font-semibold shadow-sm'
                      : 'bg-[#181B24] text-[var(--muted)] hover:text-white hover:bg-[#202430]'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Template Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-ui text-xs font-semibold text-[var(--ink-2)]">
                Select Approved Template ({filteredTemplates.length})
              </label>
              <Badge
                status={selectedTemplate.metaCategory === 'UTILITY' ? 'ok' : 'pending'}
                size="sm"
              >
                Meta {selectedTemplate.metaCategory}
              </Badge>
            </div>
            <select
              value={selectedTemplate.id}
              onChange={(e) => {
                const found = APPROVED_TEMPLATES.find((t) => t.id === e.target.value)
                if (found) {
                  setSelectedTemplate(found)
                  setCustomVariables({})
                }
              }}
              className="w-full bg-[#13161F] border border-[rgba(255,255,255,0.12)] text-[var(--ink)] text-xs font-ui rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#25D366]"
            >
              {filteredTemplates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name} [{tpl.metaTemplateName}]
                </option>
              ))}
            </select>
          </div>

          {/* Template Variables Editor */}
          {selectedTemplate.parameters.length > 0 && (
            <div className="p-3.5 rounded-xl bg-[#13161F] border border-[rgba(255,255,255,0.08)] space-y-2.5">
              <span className="font-ui text-xs font-semibold text-[var(--ink)] block">
                Template Variables (Live Parameters)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {selectedTemplate.parameters.map((p) => {
                  const currentValue =
                    customVariables[String(p.index)] ||
                    customVariables[p.key] ||
                    currentVariables[String(p.index)] ||
                    ''
                  return (
                    <div key={p.index} className="space-y-1">
                      <label className="text-[11px] font-ui text-[var(--muted)] flex items-center justify-between">
                        <span>{p.label}</span>
                        <code className="text-[10px] text-[#25D366]">{'{{' + p.index + '}}'}</code>
                      </label>
                      <input
                        type="text"
                        value={currentValue}
                        placeholder={p.placeholder}
                        onChange={(e) => {
                          setCustomVariables((prev) => ({
                            ...prev,
                            [String(p.index)]: e.target.value,
                            [p.key]: e.target.value,
                          }))
                        }}
                        className="w-full bg-[#0A0C12] border border-[rgba(255,255,255,0.10)] text-[var(--ink)] text-xs font-ui rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#25D366]"
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Message Preview (WhatsApp Chat Bubble Look) */}
          <div>
            <span className="font-ui text-xs font-semibold text-[var(--ink-2)] block mb-1.5">
              Live WhatsApp Chat Bubble Preview
            </span>
            <div className="p-4 rounded-2xl bg-[#054640]/60 border border-[rgba(37,211,102,0.30)] text-[var(--ink)] space-y-2 relative overflow-hidden shadow-inner">
              <div className="flex items-center justify-between text-[11px] text-[#25D366] font-semibold border-b border-[rgba(37,211,102,0.20)] pb-1.5">
                <span>{selectedTemplate.headerText || 'DNA 360 Fitness'}</span>
                <span className="text-[10px] text-[var(--muted)] font-mono">{selectedTemplate.metaTemplateName}</span>
              </div>
              <p className="font-ui text-[13px] text-white/95 leading-relaxed whitespace-pre-wrap">
                {messagePreview}
              </p>
              <div className="text-right pt-1">
                <span className="font-data text-[10px] text-white/40">Now · Sent via Meta Cloud API</span>
              </div>
            </div>
          </div>

          {/* Budget Guard Meter */}
          <div className="p-3 rounded-xl bg-[rgba(59,130,246,0.06)] border border-[rgba(59,130,246,0.18)] flex items-center justify-between text-xs font-ui">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span className="font-semibold text-[var(--ink)]">Meta Cloud API Guard Active</span>
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
        <div className="p-4 border-t border-[rgba(255,255,255,0.08)] bg-[#080A0E] flex items-center justify-end gap-2.5 shrink-0">
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
