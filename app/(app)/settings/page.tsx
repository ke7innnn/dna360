'use client'

import React, { useState, useEffect } from 'react'
import {
  Building2, Radio, CreditCard, MessageSquare,
  ShieldCheck, Download, Save, Plus, Edit2,
  CheckCircle, RadioTower, Wifi, Server, Sparkles,
  Phone, Mail, Globe, MapPin, KeyRound, AlertTriangle,
  Upload, Clock, FileCheck, CheckCircle2,
} from 'lucide-react'
import GlassCard from '@/components/app/ui/glass-card'
import StatCard from '@/components/app/ui/stat-card'
import { Button } from '@/components/app/ui/button'
import { Input } from '@/components/app/ui/input'
import { StatusPill } from '@/components/app/ui/badge'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/app/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/app/ui/tabs'
import {
  getProfile,
  saveProfile,
  getPendingConfig,
  savePendingConfig,
  getBankDetails,
  saveBankDetails,
  getNotificationsConfig,
  saveNotificationsConfig,
  getGoLiveBlockers,
} from '@/lib/settings'
import { executeGymexMigration, type GymexRawRow } from '@/lib/migration'
import type {
  BusinessProfile,
  PendingConfig,
  BankDetails,
  NotificationGatewayConfig,
} from '@/types/settings'
import { toast } from '@/components/app/ui/toast'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [profile, setProfile] = useState<BusinessProfile>(getProfile())
  const [pendingConfig, setPendingConfig] = useState<PendingConfig>(getPendingConfig())
  const [bankDetails, setBankDetails] = useState<BankDetails>(getBankDetails())
  const [notifications, setNotifications] = useState<NotificationGatewayConfig>(getNotificationsConfig())
  const [blockers, setBlockers] = useState<string[]>([])

  // Migration state
  const [migrationJson, setMigrationJson] = useState('')
  const [migrationReport, setMigrationReport] = useState<any>(null)
  const [isDryRun, setIsDryRun] = useState(true)

  const refreshData = () => {
    setProfile(getProfile())
    setPendingConfig(getPendingConfig())
    setBankDetails(getBankDetails())
    setNotifications(getNotificationsConfig())
    setBlockers(getGoLiveBlockers())
  }

  useEffect(() => {
    refreshData()
  }, [])

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    saveProfile(profile)
    toast.success('Business Profile & GSTIN Saved')
    refreshData()
  }

  const handleSavePendingConfig = (e: React.FormEvent) => {
    e.preventDefault()
    savePendingConfig(pendingConfig)
    toast.success('Club Policy & Lifecycle Configuration Saved')
    refreshData()
  }

  const handleSaveBankDetails = (e: React.FormEvent) => {
    e.preventDefault()
    saveBankDetails(bankDetails)
    toast.success('Bank Details for Invoice Footer Saved')
    refreshData()
  }

  const handleRunMigration = () => {
    try {
      const parsed: GymexRawRow[] = migrationJson ? JSON.parse(migrationJson) : [
        { first_name: 'Rohit', last_name: 'Verma', mobile: '9820088111', package_name: 'Annual Gym Membership Package 1', base_cost: 41428.57, sales_rep: 'Swati', gender: 'male', dob: '1990-04-12' },
        { first_name: 'Anjali', last_name: 'Desai', mobile: '9820088222', package_name: 'Reformer Pilates — 36 Sessions', base_cost: 42511.43, sales_rep: 'Krrish Rawat', gender: 'female', dob: '1994-08-20' },
      ]

      const rep = executeGymexMigration(parsed, isDryRun)
      setMigrationReport(rep)
      if (isDryRun) {
        toast.info(`Dry Run Completed: ${rep.validRows} valid rows evaluated.`)
      } else {
        toast.success(`Migration Committed: ${rep.membersCreated} members imported.`)
      }
    } catch (err: any) {
      toast.error(`Invalid JSON data: ${err.message}`)
    }
  }

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--app-text-primary)] tracking-tight">
            Club Configuration & Settings
          </h1>
          <p className="text-sm text-[var(--app-text-secondary)] mt-1">
            Base Fitness Private Limited business profile, GSTIN parameters, lifecycle state rules, and migration pipeline.
          </p>
        </div>

        {blockers.length === 0 ? (
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> Go-Live Ready
          </span>
        ) : (
          <span className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" /> {blockers.length} Go-Live Blockers
          </span>
        )}
      </div>

      {/* Go-Live Blockers Alert if any */}
      {blockers.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Go-Live Pending Configuration Items (§14):</span>
          </div>
          <ul className="list-disc list-inside space-y-1 font-mono text-[0.6875rem]">
            {blockers.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="profile">Legal Entity</TabsTrigger>
          <TabsTrigger value="rules">Lifecycle & Rules</TabsTrigger>
          <TabsTrigger value="happyhours">Happy Hours</TabsTrigger>
          <TabsTrigger value="bank">Bank & Invoicing</TabsTrigger>
          <TabsTrigger value="migration">Migration Pipeline</TabsTrigger>
        </TabsList>

        {/* TAB 1: Legal Entity */}
        <TabsContent value="profile" className="space-y-6 pt-4">
          <GlassCard>
            <h3 className="font-semibold text-sm text-[var(--app-text-primary)] mb-4">Entity & GST Registration Details</h3>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Club Brand Name"
                  value={profile.clubName}
                  onChange={(e) => setProfile({ ...profile, clubName: e.target.value })}
                  required
                />
                <Input
                  label="Legal Entity Name (Invoice Header) *"
                  value={profile.legalEntityName}
                  onChange={(e) => setProfile({ ...profile, legalEntityName: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="GSTIN *"
                  value={profile.gstin}
                  onChange={(e) => setProfile({ ...profile, gstin: e.target.value })}
                  required
                />
                <Input
                  label="Default Fitness SAC Code"
                  value={profile.sacCode}
                  onChange={(e) => setProfile({ ...profile, sacCode: e.target.value })}
                  required
                />
                <Input
                  label="PAN (Derived)"
                  value={profile.pan}
                  disabled
                />
              </div>

              <Input
                label="Registered Business Address *"
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Club Phone"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
                <Input
                  label="Official Email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />
                <Input
                  label="Timezone"
                  value={profile.timezone}
                  disabled
                />
              </div>

              <div className="flex justify-end pt-3 border-t border-[var(--app-glass-border)]">
                <Button type="submit" variant="primary" icon={<Save className="w-4 h-4" />}>
                  Save Legal Profile
                </Button>
              </div>
            </form>
          </GlassCard>
        </TabsContent>

        {/* TAB 2: Lifecycle Rules */}
        <TabsContent value="rules" className="space-y-6 pt-4">
          <GlassCard>
            <h3 className="font-semibold text-sm text-[var(--app-text-primary)] mb-4">Membership Lifecycle & Commission Policies</h3>
            <form onSubmit={handleSavePendingConfig} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Activation Window (Days) *"
                  type="number"
                  value={pendingConfig.activation_window_days}
                  onChange={(e) => setPendingConfig({ ...pendingConfig, activation_window_days: parseInt(e.target.value, 10) })}
                  required
                />
                <Input
                  label="Grace Period (Days) *"
                  type="number"
                  value={pendingConfig.grace_period_days}
                  onChange={(e) => setPendingConfig({ ...pendingConfig, grace_period_days: parseInt(e.target.value, 10) })}
                  required
                />
                <Input
                  label="Upgrade Window (Days) *"
                  type="number"
                  value={pendingConfig.upgrade_window_days}
                  onChange={(e) => setPendingConfig({ ...pendingConfig, upgrade_window_days: parseInt(e.target.value, 10) })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Starting Invoice Sequence Number"
                  type="number"
                  placeholder="e.g. 1"
                  value={pendingConfig.starting_invoice_number ?? ''}
                  onChange={(e) => setPendingConfig({ ...pendingConfig, starting_invoice_number: e.target.value ? parseInt(e.target.value, 10) : null })}
                />
                <Input
                  label="Front Desk Discount Ceiling (%)"
                  type="number"
                  value={pendingConfig.discount_ceiling_pct}
                  onChange={(e) => setPendingConfig({ ...pendingConfig, discount_ceiling_pct: parseInt(e.target.value, 10) })}
                />
                <Input
                  label="PT Commission Rate (%)"
                  type="number"
                  value={pendingConfig.pt_commission_pct}
                  onChange={(e) => setPendingConfig({ ...pendingConfig, pt_commission_pct: parseInt(e.target.value, 10) })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--app-text-secondary)]">PT Commission Basis (PENDING)</label>
                  <Select
                    value={pendingConfig.pt_commission_basis || 'none'}
                    onValueChange={(v) => setPendingConfig({ ...pendingConfig, pt_commission_basis: v === 'none' ? null : v as any })}
                  >
                    <SelectTrigger><SelectValue placeholder="Not configured" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not Configured (Blocks Payouts)</SelectItem>
                      <SelectItem value="gross">Gross (On List Price)</SelectItem>
                      <SelectItem value="net_of_gst">Net of GST (Taxable Base)</SelectItem>
                      <SelectItem value="post_discount">Post-Discount Collected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--app-text-secondary)]">Commission Earn Trigger</label>
                  <Select
                    value={pendingConfig.pt_commission_trigger || 'none'}
                    onValueChange={(v) => setPendingConfig({ ...pendingConfig, pt_commission_trigger: v === 'none' ? null : v as any })}
                  >
                    <SelectTrigger><SelectValue placeholder="Not configured" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not Configured</SelectItem>
                      <SelectItem value="on_delivery">On Session Delivery (Sign-off)</SelectItem>
                      <SelectItem value="on_sale">On Package Sale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pendingConfig.no_show_consumes_session}
                    onChange={(e) => setPendingConfig({ ...pendingConfig, no_show_consumes_session: e.target.checked })}
                    className="rounded"
                  />
                  <span>No-Show Consumes Session Balance (Default: Yes)</span>
                </label>
              </div>

              <div className="flex justify-end pt-3 border-t border-[var(--app-glass-border)]">
                <Button type="submit" variant="primary" icon={<Save className="w-4 h-4" />}>
                  Save Lifecycle Rules
                </Button>
              </div>
            </form>
          </GlassCard>
        </TabsContent>

        {/* TAB 3: Happy Hours */}
        <TabsContent value="happyhours" className="space-y-6 pt-4">
          <GlassCard>
            <h3 className="font-semibold text-sm text-[var(--app-text-primary)] mb-4">Happy Hours Time Windows (Two Separate Constants)</h3>
            <div className="p-4 rounded-xl glass-input text-xs space-y-4">
              <p className="text-[var(--app-text-secondary)]">
                DNA 360 enforces two distinct Happy Hours access schedules. Access outside these windows prompts front desk to collect ₹1,450 day pass.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                <div className="p-4 rounded-xl glass-card space-y-3">
                  <h4 className="font-semibold text-sm text-[var(--aurora-1)]">1. Main Gym Floor Happy Hours</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Start Time"
                      value={pendingConfig.happy_hours_gym.start}
                      onChange={(e) => setPendingConfig({
                        ...pendingConfig,
                        happy_hours_gym: { ...pendingConfig.happy_hours_gym, start: e.target.value },
                      })}
                    />
                    <Input
                      label="End Time"
                      value={pendingConfig.happy_hours_gym.end}
                      onChange={(e) => setPendingConfig({
                        ...pendingConfig,
                        happy_hours_gym: { ...pendingConfig.happy_hours_gym, end: e.target.value },
                      })}
                    />
                  </div>
                  <span className="text-[0.6875rem] text-[var(--app-text-muted)] block">Confirmed default: 12:00 PM – 3:30 PM</span>
                </div>

                <div className="p-4 rounded-xl glass-card space-y-3">
                  <h4 className="font-semibold text-sm text-teal-400">2. Reformer Pilates Happy Hours</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Start Time"
                      value={pendingConfig.happy_hours_pilates.start}
                      onChange={(e) => setPendingConfig({
                        ...pendingConfig,
                        happy_hours_pilates: { ...pendingConfig.happy_hours_pilates, start: e.target.value },
                      })}
                    />
                    <Input
                      label="End Time"
                      value={pendingConfig.happy_hours_pilates.end}
                      onChange={(e) => setPendingConfig({
                        ...pendingConfig,
                        happy_hours_pilates: { ...pendingConfig.happy_hours_pilates, end: e.target.value },
                      })}
                    />
                  </div>
                  <span className="text-[0.6875rem] text-[var(--app-text-muted)] block">Confirmed default: 2:00 PM – 4:00 PM (Separate constant)</span>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <Button onClick={handleSavePendingConfig} variant="primary" icon={<Save className="w-4 h-4" />}>
                  Save Happy Hours Windows
                </Button>
              </div>
            </div>
          </GlassCard>
        </TabsContent>

        {/* TAB 4: Bank Details */}
        <TabsContent value="bank" className="space-y-6 pt-4">
          <GlassCard>
            <h3 className="font-semibold text-sm text-[var(--app-text-primary)] mb-4">Bank Account Details for Tax Invoice Footer</h3>
            <form onSubmit={handleSaveBankDetails} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Bank Name *"
                  value={bankDetails.bankName}
                  onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                  required
                />
                <Input
                  label="Account Number *"
                  value={bankDetails.accountNumber}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                  placeholder="e.g. 921020038912345"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="IFSC Code *"
                  value={bankDetails.ifscCode}
                  onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value })}
                  placeholder="e.g. UTIB0000123"
                  required
                />
                <Input
                  label="Branch Name"
                  value={bankDetails.branchName}
                  onChange={(e) => setBankDetails({ ...bankDetails, branchName: e.target.value })}
                  placeholder="Hiranandani Powai Branch"
                />
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--app-text-secondary)]">Account Type</label>
                  <Select value={bankDetails.accountType} onValueChange={(v: any) => setBankDetails({ ...bankDetails, accountType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Current">Current Account</SelectItem>
                      <SelectItem value="Savings">Savings Account</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-[var(--app-glass-border)]">
                <Button type="submit" variant="primary" icon={<Save className="w-4 h-4" />}>
                  Save Bank Details
                </Button>
              </div>
            </form>
          </GlassCard>
        </TabsContent>

        {/* TAB 5: Migration Pipeline */}
        <TabsContent value="migration" className="space-y-6 pt-4">
          <GlassCard>
            <h3 className="font-semibold text-sm text-[var(--app-text-primary)] mb-4">Gymex 679-Member Migration Pipeline</h3>
            <div className="space-y-4">
              <p className="text-xs text-[var(--app-text-secondary)]">
                Import Gymex export rows (46 columns). Converts ex-tax costs (Base Cost × 1.05 = inclusive price), maps 6 historical sales reps, and flags unknown session counts.
              </p>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[var(--app-text-secondary)]">
                  Gymex Export JSON Batch (leave blank for built-in sample test batch)
                </label>
                <textarea
                  rows={4}
                  value={migrationJson}
                  onChange={(e) => setMigrationJson(e.target.value)}
                  placeholder='[{"first_name": "Arjun", "mobile": "9820011111", "package_name": "Annual Gym", "base_cost": 41428.57, "sales_rep": "Swati"}]'
                  className="w-full p-3 font-mono text-xs glass-input text-[var(--app-text-primary)] placeholder:text-[var(--app-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--app-focus-ring)]"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-xs text-[var(--app-text-secondary)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDryRun}
                    onChange={(e) => setIsDryRun(e.target.checked)}
                    className="rounded"
                  />
                  <span>Dry Run Mode (Validate & preview without writing to database)</span>
                </label>

                <Button onClick={handleRunMigration} variant="primary" icon={<Upload className="w-4 h-4" />}>
                  {isDryRun ? 'Execute Dry Run' : 'Commit & Import Data'}
                </Button>
              </div>

              {migrationReport && (
                <div className="p-4 rounded-xl glass-card border border-[var(--aurora-1)]/30 space-y-3 text-xs">
                  <div className="flex justify-between items-center font-semibold">
                    <span>Migration Report ({migrationReport.isDryRun ? 'DRY RUN' : 'COMMITTED'}):</span>
                    <StatusPill status={migrationReport.errorCount === 0 ? 'success' : 'warning'}>
                      {migrationReport.validRows} / {migrationReport.totalRows} Valid
                    </StatusPill>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                    <div><span className="text-[var(--app-text-muted)]">Members Created:</span> {migrationReport.membersCreated}</div>
                    <div><span className="text-[var(--app-text-muted)]">Memberships:</span> {migrationReport.membershipsCreated}</div>
                    <div><span className="text-[var(--app-text-muted)]">Historical Reps Mapped:</span> {migrationReport.historicalSalesRepsMapped}</div>
                    <div><span className="text-[var(--app-text-muted)]">Names Deduped:</span> {migrationReport.deduplicatedCount}</div>
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}
