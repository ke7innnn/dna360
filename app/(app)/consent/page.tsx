'use client'

import React, { useState, useEffect } from 'react'
import {
  FileCheck, Shield, CheckCircle2, Clock, AlertTriangle,
  User, Send, KeyRound, Lock, Eye, Sparkles, FileText,
  Smartphone, Hash, Plus,
} from 'lucide-react'
import Card from '@/components/app/ui/glass-card'
import StatTile from '@/components/app/ui/StatTile'
import Button from '@/components/app/ui/button'
import Badge, { StatusPill } from '@/components/app/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/app/ui/tabs'
import Modal from '@/components/app/ui/modal'
import Input from '@/components/app/ui/input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/app/ui/select'
import PageHeader from '@/components/app/ui/PageHeader'
import {
  getTemplates,
  getSignedAgreements,
  createAgreement,
  recordSignature,
  recordClauseConsent,
  getCurrentTemplate,
} from '@/lib/consent'
import { getStoredMembers } from '@/lib/members'
import type { ConsentTemplate, SignedAgreement, ConsentDocumentType, SignerRole } from '@/types/consent'
import { toast } from '@/components/app/ui/toast'
import { cn } from '@/lib/utils'

export default function ConsentPage() {
  const [templates, setTemplates] = useState<ConsentTemplate[]>([])
  const [agreements, setAgreements] = useState<SignedAgreement[]>([])
  const [activeTab, setActiveTab] = useState('agreements')
  const [selectedTemplate, setSelectedTemplate] = useState<ConsentTemplate | null>(null)
  const [selectedAgreement, setSelectedAgreement] = useState<SignedAgreement | null>(null)

  // Signing Modal State
  const [signModalOpen, setSignModalOpen] = useState(false)
  const [signingAgreement, setSigningAgreement] = useState<SignedAgreement | null>(null)
  const [signerRole, setSignerRole] = useState<SignerRole>('member')
  const [signerName, setSignerName] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)

  // New Agreement Generation Modal
  const [newAgreementModalOpen, setNewAgreementModalOpen] = useState(false)
  const [selectedDocType, setSelectedDocType] = useState<ConsentDocumentType>('membership_tc')
  const [selectedMemberId, setSelectedMemberId] = useState('')

  const members = getStoredMembers()

  const refreshData = () => {
    setTemplates(getTemplates())
    setAgreements(getSignedAgreements())
  }

  useEffect(() => {
    refreshData()
  }, [])

  const handleSendOtp = () => {
    setOtpSent(true)
    toast.info('OTP Sent to registered mobile (+91•••• ••••)', {
      description: 'Use code 360360 to verify electronic signature.',
    })
  }

  const handleCompleteSign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signingAgreement) return

    if (otpCode !== '360360' && otpCode.length < 4) {
      toast.error('Invalid OTP code. Enter 360360 to verify.')
      return
    }

    try {
      const updated = await recordSignature(
        signingAgreement.id,
        'usr_signer',
        signerName || 'Signer',
        signerRole,
        `OTP_VERIFIED_${Date.now()}`
      )
      toast.success(`E-Signature recorded for ${signerRole.toUpperCase()}`, {
        description: 'Document hash verified against immutable snapshot.',
      })
      setSignModalOpen(false)
      setOtpSent(false)
      setOtpCode('')
      refreshData()
    } catch (err: any) {
      toast.error(err.message || 'Signing failed')
    }
  }

  const handleCreateAgreement = async (e: React.FormEvent) => {
    e.preventDefault()
    const template = getCurrentTemplate(selectedDocType)
    const member = members.find(m => m.id === selectedMemberId) || members[0]

    try {
      await createAgreement(
        selectedDocType,
        template.version,
        member.id,
        member.name,
        member.phone
      )
      toast.success(`Generated ${template.title} for ${member.name}`)
      setNewAgreementModalOpen(false)
      refreshData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create agreement')
    }
  }

  const executedCount = agreements.filter((a) => a.status === 'fully_signed').length
  const pendingCount = agreements.filter((a) => a.status.startsWith('pending')).length

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none">
      {/* 1. Header */}
      <PageHeader
        eyebrow="LEGAL & COMPLIANCE · AUDITABLE CONSENT"
        title="Agreements & T&C"
        description="Immutable electronic consent architecture, 3-party sequential signatures, and WhatsApp/SMS audit logs."
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={() => setNewAgreementModalOpen(true)}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Generate new agreement
          </Button>
        }
      />

      {/* 2. Stat Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="EXECUTED AGREEMENTS"
          value={executedCount}
          unit="FULLY SIGNED"
          icon={<FileCheck className="w-4 h-4 text-[var(--green)]" />}
        />
        <StatTile
          label="PENDING COUNTERSIGN"
          value={pendingCount}
          unit="IN FLIGHT"
          icon={<Clock className="w-4 h-4 text-[var(--amber)]" />}
          delta={{ text: 'Sequential workflow', type: 'warn' }}
        />
        <StatTile
          label="ACTIVE TEMPLATES"
          value={templates.length}
          unit="TEMPLATES"
          icon={<Shield className="w-4 h-4 text-[var(--accent)]" />}
        />
        <StatTile
          label="AUDITABLE HASH"
          value="SHA-256"
          unit="IMMUTABLE"
          icon={<Lock className="w-4 h-4 text-[var(--indigo)]" />}
          delta={{ text: 'Tamper-proof storage', type: 'ok' }}
        />
      </div>

      {/* 3. Main Tabs & Table */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
          <h3 className="font-display text-base font-semibold text-[var(--ink)]">
            Signed Member Agreement Archive
          </h3>
          <span className="font-data text-xs text-[var(--muted)]">
            {agreements.length} Total Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[var(--bg-elev)] border-b border-[var(--line)] h-[44px] font-data text-[10.5px] uppercase tracking-[0.16em] font-medium text-[var(--muted)]">
                <th className="px-5 py-2.5 text-left">Document & Version</th>
                <th className="px-5 py-2.5 text-left">Member Prospect</th>
                <th className="px-5 py-2.5 text-center">Status</th>
                <th className="px-5 py-2.5 text-left">Signature Trail</th>
                <th className="px-5 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line-soft)]">
              {agreements.map((agr) => (
                <tr key={agr.id} className="h-[52px] hover:bg-[var(--surface-2)] transition-colors">
                  <td className="px-5 py-3">
                    <span className="font-ui font-semibold text-xs text-[var(--ink)] block">
                      {agr.documentType.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="font-data text-[10px] text-[var(--muted)]">
                      Version: {agr.templateVersion}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-ui text-xs text-[var(--ink)]">
                    <span className="font-semibold block">{agr.memberName}</span>
                    <span className="font-data text-[10.5px] text-[var(--muted)]">{agr.memberPhone}</span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <Badge status={agr.status === 'fully_signed' ? 'ok' : 'warn'} size="sm">
                      {agr.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5 font-data text-[11px] text-[var(--muted)]">
                      {agr.signatures.map((sig, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-[var(--surface-2)] text-[var(--ink)] border border-[var(--line)]">
                          {sig.role.toUpperCase()} ✓
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSigningAgreement(agr)
                        setSignerName(agr.memberName)
                        setSignModalOpen(true)
                      }}
                    >
                      Sign / Verify
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Signing Modal */}
      <Modal
        open={signModalOpen}
        onOpenChange={setSignModalOpen}
        title="Electronic Consent Signer"
        description="Verify 3-party sequential e-signature with OTP verification."
        size="md"
      >
        <form onSubmit={handleCompleteSign} className="space-y-4">
          <Input
            label="Signer Name"
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="font-data text-[10.5px] uppercase tracking-[0.16em] font-medium text-[var(--muted)]">
              Signer Capacity / Role
            </label>
            <select
              value={signerRole}
              onChange={(e) => setSignerRole(e.target.value as SignerRole)}
              className="w-full h-[38px] px-3.5 font-ui text-[13.5px] rounded-[var(--r-sm)] bg-[var(--bg-elev)] border border-[var(--line)] text-[var(--ink)] outline-none"
            >
              <option value="member">Member Prospect</option>
              <option value="trainer">Assigned Coach / Personal Trainer</option>
              <option value="fitness_consultant">Fitness Consultant / Witness</option>
              <option value="general_manager">Club General Manager</option>
            </select>
          </div>

          <div className="p-4 rounded-[var(--r-md)] bg-[var(--surface-2)] border border-[var(--line)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-ui text-xs text-[var(--ink)] font-semibold">SMS OTP Authorization</span>
              <Button type="button" variant="secondary" size="sm" onClick={handleSendOtp}>
                {otpSent ? 'Resend OTP' : 'Send OTP'}
              </Button>
            </div>
            {otpSent && (
              <Input
                label="Enter 6-Digit OTP (Hint: 360360)"
                placeholder="360360"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                required
              />
            )}
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[var(--line)]">
            <Button type="button" variant="secondary" size="md" onClick={() => setSignModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              Complete signature
            </Button>
          </div>
        </form>
      </Modal>

      {/* New Agreement Generation Modal */}
      <Modal
        open={newAgreementModalOpen}
        onOpenChange={setNewAgreementModalOpen}
        title="Generate New Consent Agreement"
        description="Select a legal document template and bind it to a member record."
        size="md"
      >
        <form onSubmit={handleCreateAgreement} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-data text-[10.5px] uppercase tracking-[0.16em] font-medium text-[var(--muted)]">
              Document Type
            </label>
            <select
              value={selectedDocType}
              onChange={(e) => setSelectedDocType(e.target.value as ConsentDocumentType)}
              className="w-full h-[38px] px-3.5 font-ui text-[13.5px] rounded-[var(--r-sm)] bg-[var(--bg-elev)] border border-[var(--line)] text-[var(--ink)] outline-none"
            >
              <option value="membership_tc">Membership Terms & General Rules</option>
              <option value="health_waiver">PAR-Q Medical Health & Liability Waiver</option>
              <option value="pt_agreement">Personal Training Service Agreement</option>
              <option value="pilates_waiver">Reformer Pilates Safety Consent</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-data text-[10.5px] uppercase tracking-[0.16em] font-medium text-[var(--muted)]">
              Member Recipient
            </label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full h-[38px] px-3.5 font-ui text-[13.5px] rounded-[var(--r-sm)] bg-[var(--bg-elev)] border border-[var(--line)] text-[var(--ink)] outline-none"
            >
              {members.slice(0, 30).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.member_code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[var(--line)]">
            <Button type="button" variant="secondary" size="md" onClick={() => setNewAgreementModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              Create agreement
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
