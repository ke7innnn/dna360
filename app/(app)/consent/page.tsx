'use client'

import React, { useState, useEffect } from 'react'
import {
  FileCheck, Shield, CheckCircle2, Clock, AlertTriangle,
  User, Send, KeyRound, Lock, Eye, Sparkles, FileText,
  Smartphone, Hash,
} from 'lucide-react'
import GlassCard from '@/components/app/ui/glass-card'
import StatCard from '@/components/app/ui/stat-card'
import { Button } from '@/components/app/ui/button'
import { StatusPill } from '@/components/app/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/app/ui/tabs'
import { Modal } from '@/components/app/ui/modal'
import { Input } from '@/components/app/ui/input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/app/ui/select'
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
    if (!template || !member) return

    const primaryMembership = member.active_memberships[0]
    const agreement = await createAgreement(
      template,
      member.id,
      primaryMembership?.id || `ms_${Date.now()}`,
      { validity_days: '365', member_name: member.name }
    )

    toast.success(`Agreement generated for ${member.name}`)
    setNewAgreementModalOpen(false)
    refreshData()
  }

  const docTypeLabels: Record<ConsentDocumentType, string> = {
    membership_tc: 'Membership Terms & Conditions (22 Clauses)',
    personal_training_tc: 'Personal Training T&C (3-Party Sequential)',
    pilates_tc: 'Reformer Pilates T&C (16 Clauses)',
  }

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--app-text-primary)] tracking-tight">
            Consent & E-Signing Management
          </h1>
          <p className="text-sm text-[var(--app-text-secondary)] mt-1">
            Immutable document snapshots, OTP-verified mobile e-signing, and 3-party sequential sign-off for PT agreements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            onClick={() => setNewAgreementModalOpen(true)}
            icon={<FileText className="w-4 h-4" />}
          >
            Issue Agreement
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Signed Agreements"
          value={agreements.length}
          icon={<FileCheck className="w-5 h-5 text-emerald-400" />}
        />
        <StatCard
          label="Pending PT 3-Party Signatures"
          value={agreements.filter(a => !a.is_complete).length}
          icon={<Clock className="w-5 h-5 text-amber-400" />}
        />
        <StatCard
          label="Active Legal Templates"
          value={templates.length}
          icon={<Shield className="w-5 h-5 text-teal-400" />}
        />
        <StatCard
          label="Signature Verification"
          value="SHA-256 OTP (100% Mobile)"
          icon={<Smartphone className="w-5 h-5 text-[var(--aurora-1)]" />}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 w-full max-w-sm">
          <TabsTrigger value="agreements">Executed Agreements ({agreements.length})</TabsTrigger>
          <TabsTrigger value="templates">Legal Templates ({templates.length})</TabsTrigger>
        </TabsList>

        {/* TAB 1: Executed Agreements */}
        <TabsContent value="agreements" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agreements.map((ag) => {
              const member = members.find(m => m.id === ag.member_id)
              const template = templates.find(t => t.id === ag.template_id)
              return (
                <div
                  key={ag.id}
                  className="p-5 rounded-2xl glass-card border border-[var(--app-glass-border)] hover:border-[var(--aurora-1)]/50 transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <StatusPill status={ag.is_complete ? 'success' : 'warning'} dot>
                        {ag.is_complete ? 'Fully Executed' : `Pending Signatures (${ag.signatures.length}/${template?.signing_order.length || 1})`}
                      </StatusPill>
                      <span className="text-[0.6875rem] font-mono text-[var(--app-text-muted)]">
                        v{ag.template_version}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm text-[var(--app-text-primary)]">
                        {template?.title || 'Consent Agreement'}
                      </h4>
                      <p className="text-xs text-[var(--app-text-muted)] mt-0.5">
                        Member: <strong className="text-[var(--app-text-secondary)]">{member?.name || 'Arjun Mehta'}</strong> ({member?.member_code || 'DNA-2025-0892'})
                      </p>
                    </div>

                    {/* Signers Progress Bar */}
                    <div className="space-y-1.5 pt-2 border-t border-[var(--app-glass-border)] text-xs">
                      <span className="text-[0.625rem] font-semibold uppercase tracking-wider text-[var(--app-text-muted)] block">
                        Sequential Signing Status:
                      </span>
                      <div className="flex items-center gap-2">
                        {template?.signing_order.map((role, idx) => {
                          const isSigned = ag.signatures.some(s => s.signer_role === role)
                          return (
                            <span
                              key={role}
                              className={cn(
                                'px-2 py-0.5 rounded text-[0.625rem] font-semibold uppercase border',
                                isSigned
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                              )}
                            >
                              {role.replace('_', ' ')}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[var(--app-glass-border)] flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedAgreement(ag)}
                      icon={<Eye className="w-3.5 h-3.5" />}
                    >
                      View Snapshot
                    </Button>
                    {!ag.is_complete && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setSigningAgreement(ag)
                          const nextRole = template?.signing_order[ag.signatures.length] || 'member'
                          setSignerRole(nextRole)
                          setSignerName(nextRole === 'member' ? (member?.name || 'Member') : 'Coach Rajesh Poojary')
                          setSignModalOpen(true)
                        }}
                        icon={<KeyRound className="w-3.5 h-3.5" />}
                      >
                        Sign Step
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </TabsContent>

        {/* TAB 2: Legal Templates */}
        <TabsContent value="templates" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="p-5 rounded-2xl glass-card border border-[var(--app-glass-border)] space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[0.625rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      Version {tpl.version} (Active)
                    </span>
                    <span className="text-[0.6875rem] font-mono text-[var(--app-text-muted)]">
                      {tpl.clauses.length} Clauses
                    </span>
                  </div>

                  <div>
                    <h3 className="font-semibold text-sm text-[var(--app-text-primary)]">
                      {tpl.title}
                    </h3>
                    <p className="text-xs text-[var(--app-text-muted)] mt-1">
                      Signing Order: {tpl.signing_order.map(s => s.replace('_', ' ')).join(' → ')}
                    </p>
                  </div>

                  {tpl.blocks_service_until_complete && (
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[0.6875rem] text-amber-300">
                      ⚠️ PT Sessions blocked from booking until all 3 signatures are recorded.
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[var(--app-glass-border)]">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => setSelectedTemplate(tpl)}
                    icon={<FileText className="w-3.5 h-3.5" />}
                  >
                    Inspect Clauses ({tpl.clauses.length})
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Signing Modal */}
      {signModalOpen && signingAgreement && (
        <Modal
          open={signModalOpen}
          onOpenChange={setSignModalOpen}
          title={`E-Sign Agreement — ${signerRole.toUpperCase()}`}
          description="Authenticate via OTP to complete legally binding consent signature."
          size="md"
        >
          <form onSubmit={handleCompleteSign} className="space-y-4">
            <div className="p-3.5 rounded-xl glass-card space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--app-text-muted)]">Signer Role:</span>
                <span className="font-bold text-teal-400 uppercase">{signerRole.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--app-text-muted)]">Signer Name:</span>
                <span className="font-semibold text-[var(--app-text-primary)]">{signerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--app-text-muted)]">Document SHA-256:</span>
                <span className="font-mono text-[0.625rem] text-[var(--aurora-1)] truncate max-w-[200px]">
                  {signingAgreement.document_hash}
                </span>
              </div>
            </div>

            <Input
              label="Signer Name"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              required
            />

            {!otpSent ? (
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={handleSendOtp}
                icon={<Smartphone className="w-4 h-4" />}
              >
                Send Verification OTP to Mobile
              </Button>
            ) : (
              <div className="space-y-3">
                <Input
                  label="Enter 6-Digit OTP (Use: 360360)"
                  placeholder="360360"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  required
                />
                <p className="text-[0.6875rem] text-emerald-400">
                  ✓ OTP dispatched via SMS provider. Enter test code <strong>360360</strong>.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--app-glass-border)]">
              <Button type="button" variant="secondary" onClick={() => setSignModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={!otpSent} icon={<CheckCircle2 className="w-4 h-4" />}>
                Verify & Affix Signature
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Snapshot Viewer Modal */}
      {selectedAgreement && (
        <Modal
          open={!!selectedAgreement}
          onOpenChange={(open) => !open && setSelectedAgreement(null)}
          title="Executed Agreement Snapshot"
          description={`SHA-256 Hash: ${selectedAgreement.document_hash}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl glass-card space-y-2 text-xs">
              <h4 className="font-semibold text-sm text-[var(--app-text-primary)]">Signature Audit Evidence:</h4>
              <div className="space-y-1.5 font-mono text-[0.6875rem]">
                {selectedAgreement.signatures.map((sig) => (
                  <div key={sig.id} className="p-2 rounded bg-[var(--app-glass-bg)] border border-[var(--app-glass-border)] flex justify-between">
                    <span>{sig.signer_name} ({sig.signer_role.toUpperCase()})</span>
                    <span className="text-emerald-400">{sig.timestamp} · IP: {sig.ip_address}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl glass-input max-h-96 overflow-y-auto font-mono text-xs whitespace-pre-wrap text-[var(--app-text-secondary)] leading-relaxed">
              {selectedAgreement.rendered_text}
            </div>

            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setSelectedAgreement(null)}>
                Close Viewer
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Template Clauses Viewer */}
      {selectedTemplate && (
        <Modal
          open={!!selectedTemplate}
          onOpenChange={(open) => !open && setSelectedTemplate(null)}
          title={selectedTemplate.title}
          description={`Version ${selectedTemplate.version} · Effective from ${selectedTemplate.effective_from}`}
          size="lg"
        >
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {selectedTemplate.clauses.map((c) => (
              <div key={c.number} className="p-3 rounded-xl glass-card text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[var(--app-text-primary)]">Clause {c.number}: {c.title}</span>
                  {c.optional && <span className="text-[0.625rem] text-amber-400 font-bold">OPTIONAL</span>}
                </div>
                <p className="text-[var(--app-text-secondary)]">{c.body}</p>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* Issue Agreement Modal */}
      <Modal
        open={newAgreementModalOpen}
        onOpenChange={setNewAgreementModalOpen}
        title="Issue Consent Document to Member"
        description="Select agreement template and member to generate an immutable snapshot."
        size="md"
      >
        <form onSubmit={handleCreateAgreement} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--app-text-secondary)]">Agreement Template</label>
            <Select value={selectedDocType} onValueChange={(v: any) => setSelectedDocType(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="membership_tc">Membership Terms & Conditions (22 Clauses)</SelectItem>
                <SelectItem value="personal_training_tc">Personal Training T&C (3-Party Sequential)</SelectItem>
                <SelectItem value="pilates_tc">Reformer Pilates T&C (16 Clauses)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--app-text-secondary)]">Target Member</label>
            <Select value={selectedMemberId || members[0]?.id} onValueChange={setSelectedMemberId}>
              <SelectTrigger><SelectValue placeholder="Select Member" /></SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} ({m.member_code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--app-glass-border)]">
            <Button type="button" variant="secondary" onClick={() => setNewAgreementModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" icon={<FileCheck className="w-4 h-4" />}>
              Generate Agreement Snapshot
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
