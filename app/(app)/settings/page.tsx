'use client'

import React, { useState, useEffect } from 'react'
import {
  Building2, Radio, CreditCard, MessageSquare,
  ShieldCheck, Download, Save, Plus, Edit2,
  CheckCircle, RadioTower, Wifi, Server, Sparkles,
  Phone, Mail, Globe, MapPin, KeyRound, AlertTriangle,
  Upload, Clock, FileCheck, CheckCircle2,
} from 'lucide-react'
import Card from '@/components/app/ui/glass-card'
import StatTile from '@/components/app/ui/StatTile'
import Button from '@/components/app/ui/button'
import Input from '@/components/app/ui/input'
import Badge, { StatusPill } from '@/components/app/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/app/ui/tabs'
import PageHeader from '@/components/app/ui/PageHeader'
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
import { openRazorpayCheckout } from '@/lib/razorpay'
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
  const [testPaymentLoading, setTestPaymentLoading] = useState(false)

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

  const handleTestRazorpayPayment = async () => {
    setTestPaymentLoading(true)
    try {
      // 1. Create a ₹1 live verification test order (100 paise)
      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountMinor: 100, // ₹1.00
          receipt: `rcpt_live_test_${Date.now()}`,
          notes: {
            description: 'Live Gateway ₹1 Verification Test',
            tester: profile.legalName,
          },
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.orderId) {
        throw new Error(data.error || 'Failed to initialize test payment order.')
      }

      // 2. Launch Razorpay live checkout modal
      await openRazorpayCheckout({
        orderId: data.orderId,
        amountMinor: 100,
        name: 'DNA 360 Fitness',
        description: 'Gateway Live ₹1 Connectivity Verification',
        prefill: {
          name: profile.legalName,
          email: profile.email,
          contact: profile.phone,
        },
        onSuccess: (paymentData) => {
          setTestPaymentLoading(false)
          toast.success('Live Payment Completed & Verified!', {
            description: `Razorpay Payment ID: ${paymentData.razorpay_payment_id}. Funds routed to your merchant account.`,
          })
        },
        onDismiss: () => {
          setTestPaymentLoading(false)
          toast.info('Test checkout modal dismissed')
        },
      })
    } catch (err: any) {
      console.error('Test payment failed:', err)
      setTestPaymentLoading(false)
      toast.error('Payment Test Error', {
        description: err.message || 'Unable to launch Razorpay checkout modal.',
      })
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none">
      {/* 1. Header */}
      <PageHeader
        eyebrow="ADMINISTRATION · MASTER CONFIG"
        title="Club Settings"
        description="Business legal entity, GSTIN registration, bank accounts, turnstile device endpoints, WhatsApp API, and data migration."
      />

      {/* 2. Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 sm:grid-cols-5 w-full bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-sm)] p-1">
          <TabsTrigger value="profile">Business & GSTIN</TabsTrigger>
          <TabsTrigger value="policies">Rules & Lifecycles</TabsTrigger>
          <TabsTrigger value="bank">Bank Accounts</TabsTrigger>
          <TabsTrigger value="gateways">API & Gateways</TabsTrigger>
          <TabsTrigger value="migration">Data Migration</TabsTrigger>
        </TabsList>

        {/* TAB 1: Business Profile & GSTIN */}
        <TabsContent value="profile" className="pt-4">
          <Card className="p-6">
            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="border-b border-[var(--line)] pb-4">
                <h3 className="font-display text-base font-semibold text-[var(--ink)]">
                  Business Legal Entity & Tax Information
                </h3>
                <p className="font-ui text-xs text-[var(--muted)] mt-0.5">
                  Appears on all member tax invoices, receipts, and GSTR-1 filings.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Legal Business / Entity Name"
                  value={profile.legalName}
                  onChange={(e) => setProfile({ ...profile, legalName: e.target.value })}
                  required
                />
                <Input
                  label="Brand / Trading Name"
                  value={profile.brandName}
                  onChange={(e) => setProfile({ ...profile, brandName: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="GSTIN (15-Character Pan-India)"
                  value={profile.gstin}
                  onChange={(e) => setProfile({ ...profile, gstin: e.target.value })}
                  required
                />
                <Input
                  label="State & State Code"
                  value={profile.stateCode}
                  onChange={(e) => setProfile({ ...profile, stateCode: e.target.value })}
                  required
                />
                <Input
                  label="PAN Number"
                  value={profile.pan}
                  onChange={(e) => setProfile({ ...profile, pan: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Club Location Address"
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  required
                />
                <Input
                  label="Support Email / Invoicing Desk"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  required
                />
              </div>

              <div className="flex justify-end pt-3 border-t border-[var(--line)]">
                <Button type="submit" variant="primary" size="md" icon={<Save className="w-3.5 h-3.5" />}>
                  Save business profile
                </Button>
              </div>
            </form>
          </Card>
        </TabsContent>

        {/* TAB 2: Rules & Lifecycle */}
        <TabsContent value="policies" className="pt-4">
          <Card className="p-6">
            <form onSubmit={handleSavePendingConfig} className="space-y-5">
              <div className="border-b border-[var(--line)] pb-4">
                <h3 className="font-display text-base font-semibold text-[var(--ink)]">
                  Membership Lifecycle & Grace Periods
                </h3>
                <p className="font-ui text-xs text-[var(--muted)] mt-0.5">
                  Configure turnstile grace window, freeze allowances, and session carryover policies.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Turnstile Grace Period (Days)"
                  type="number"
                  value={pendingConfig.gracePeriodDays}
                  onChange={(e) => setPendingConfig({ ...pendingConfig, gracePeriodDays: parseInt(e.target.value, 10) || 7 })}
                  hint="Members can scan for X days after expiry before being blocked."
                />
                <Input
                  label="Max Freeze Days Allowed / Year"
                  type="number"
                  value={pendingConfig.maxFreezeDaysPerYear}
                  onChange={(e) => setPendingConfig({ ...pendingConfig, maxFreezeDaysPerYear: parseInt(e.target.value, 10) || 30 })}
                  hint="Maximum cumulative hold per annual plan."
                />
                <Input
                  label="Complimentary Assessment Window"
                  type="number"
                  value={pendingConfig.complimentaryWindowDays}
                  onChange={(e) => setPendingConfig({ ...pendingConfig, complimentaryWindowDays: parseInt(e.target.value, 10) || 60 })}
                  hint="Validity for initial fitness assessment & massage."
                />
              </div>

              <div className="flex justify-end pt-3 border-t border-[var(--line)]">
                <Button type="submit" variant="primary" size="md" icon={<Save className="w-3.5 h-3.5" />}>
                  Save lifecycle policies
                </Button>
              </div>
            </form>
          </Card>
        </TabsContent>

        {/* TAB 3: Bank Details */}
        <TabsContent value="bank" className="pt-4">
          <Card className="p-6">
            <form onSubmit={handleSaveBankDetails} className="space-y-5">
              <div className="border-b border-[var(--line)] pb-4">
                <h3 className="font-display text-base font-semibold text-[var(--ink)]">
                  Designated Bank Account for Invoices
                </h3>
                <p className="font-ui text-xs text-[var(--muted)] mt-0.5">
                  Printed on tax invoice PDFs for NEFT/RTGS wire transfers.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Beneficiary Account Name"
                  value={bankDetails.beneficiaryName}
                  onChange={(e) => setBankDetails({ ...bankDetails, beneficiaryName: e.target.value })}
                  required
                />
                <Input
                  label="Bank Name & Branch"
                  value={bankDetails.bankName}
                  onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Current Account Number"
                  value={bankDetails.accountNumber}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                  required
                />
                <Input
                  label="IFSC Code"
                  value={bankDetails.ifsc}
                  onChange={(e) => setBankDetails({ ...bankDetails, ifsc: e.target.value })}
                  required
                />
              </div>

              <div className="flex justify-end pt-3 border-t border-[var(--line)]">
                <Button type="submit" variant="primary" size="md" icon={<Save className="w-3.5 h-3.5" />}>
                  Save bank details
                </Button>
              </div>
            </form>
          </Card>
        </TabsContent>

        {/* TAB 4: Gateways */}
        <TabsContent value="gateways" className="pt-4">
          <Card className="p-6 space-y-4">
            <div className="border-b border-[var(--line)] pb-4">
              <h3 className="font-display text-base font-semibold text-[var(--ink)]">
                Notification Gateways & Turnstile Devices
              </h3>
              <p className="font-ui text-xs text-[var(--muted)] mt-0.5">
                Status of connected hardware devices and communication APIs.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-[var(--r-md)] bg-[var(--surface-2)] border border-[var(--aurora-1)]/40 space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-ui font-semibold text-xs text-[var(--ink)]">Razorpay Payment Gateway</span>
                  <Badge status="ok" size="sm">Live Mode</Badge>
                </div>
                <p className="font-ui text-xs text-[var(--muted)]">Key: <code className="text-[10px] font-mono text-[var(--aurora-1)]">rzp_live_TYHC...</code>. Real-time UPI QR, Cards, and NetBanking.</p>
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    loading={testPaymentLoading}
                    onClick={handleTestRazorpayPayment}
                    icon={<CreditCard className="w-3.5 h-3.5" />}
                  >
                    Test ₹1 Live Checkout
                  </Button>
                </div>
              </div>

              <div className="p-4 rounded-[var(--r-md)] bg-[var(--surface-2)] border border-[var(--line)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-ui font-semibold text-xs text-[var(--ink)]">WhatsApp Business API</span>
                  <Badge status="ok" size="sm">Connected</Badge>
                </div>
                <p className="font-ui text-xs text-[var(--muted)]">Automated payment receipt & OTP delivery via Gupshup / Meta.</p>
              </div>

              <div className="p-4 rounded-[var(--r-md)] bg-[var(--surface-2)] border border-[var(--line)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-ui font-semibold text-xs text-[var(--ink)]">SMS Gateway (DLT)</span>
                  <Badge status="ok" size="sm">Active</Badge>
                </div>
                <p className="font-ui text-xs text-[var(--muted)]">Transactional SMS template approved on TRAI DLT portal.</p>
              </div>

              <div className="p-4 rounded-[var(--r-md)] bg-[var(--surface-2)] border border-[var(--line)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-ui font-semibold text-xs text-[var(--ink)]">Turnstile Optical Gate</span>
                  <Badge status="ok" size="sm">Online</Badge>
                </div>
                <p className="font-ui text-xs text-[var(--muted)]">ZKTeco / Hikvision optical turnstile controllers on LAN.</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* TAB 5: Migration */}
        <TabsContent value="migration" className="pt-4">
          <Card className="p-6 space-y-4">
            <div className="border-b border-[var(--line)] pb-4">
              <h3 className="font-display text-base font-semibold text-[var(--ink)]">
                Gymex Legacy Data Migration Engine
              </h3>
              <p className="font-ui text-xs text-[var(--muted)] mt-0.5">
                Bulk importer with schema transformation, tax back-calculation, and duplicate resolution.
              </p>
            </div>

            <div className="space-y-3">
              <label className="font-data text-[10.5px] uppercase tracking-[0.16em] font-medium text-[var(--muted)]">
                Paste Gymex CSV/JSON Export Dump
              </label>
              <textarea
                value={migrationJson}
                onChange={(e) => setMigrationJson(e.target.value)}
                placeholder='[{"first_name": "Rohit", "last_name": "Verma", "mobile": "9820088111", "package_name": "Annual Gym", "base_cost": 41428.57}]'
                rows={5}
                className="w-full p-3 font-data text-xs rounded-[var(--r-sm)] bg-[var(--bg-elev)] border border-[var(--line)] text-[var(--ink)] placeholder:text-[var(--muted-2)] outline-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  setIsDryRun(true)
                  handleRunMigration()
                }}
              >
                Run dry-run simulation
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setIsDryRun(false)
                  handleRunMigration()
                }}
              >
                Commit data migration
              </Button>
            </div>

            {migrationReport && (
              <div className="p-4 rounded-[var(--r-md)] bg-[var(--surface-2)] border border-[var(--line)] font-data text-xs space-y-1">
                <span className="font-bold text-[var(--green)]">Migration Report Summary:</span>
                <p>Valid Rows Evaluated: {migrationReport.validRows}</p>
                <p>Members Created: {migrationReport.membersCreated}</p>
                <p>Errors / Skipped: {migrationReport.errors?.length || 0}</p>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
