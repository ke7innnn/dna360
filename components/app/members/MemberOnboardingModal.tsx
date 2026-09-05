'use client'

import React, { useState } from 'react'
import {
  User, Mail, Phone, Calendar, ShieldCheck, HeartPulse,
  CreditCard, CheckCircle, ArrowRight, ArrowLeft, Sparkles, Building2,
} from 'lucide-react'
import { Modal } from '@/components/app/ui/modal'
import { Button } from '@/components/app/ui/button'
import { Input } from '@/components/app/ui/input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/app/ui/select'
import { formatINR, backCalculateGst } from '@/lib/gst'
import { createMember } from '@/lib/members'
import { getNextInvoiceNumber } from '@/lib/billing'
import { openRazorpayCheckout } from '@/lib/razorpay'
import type { Member, IdDocumentType } from '@/types/member'
import { toast } from '@/components/app/ui/toast'
import { cn } from '@/lib/utils'

const ONBOARDING_PACKAGES = [
  { id: 'prod_001', name: 'Annual Gym Membership Package 1', durationMonths: 12, validityDays: 365, priceInclusiveMinor: 4350000, category: 'gym_membership', description: 'Full Gym Floor & Cardio access, Steam & Locker' },
  { id: 'prod_002', name: 'Annual Gym — Ice Bath Included', durationMonths: 12, validityDays: 365, priceInclusiveMinor: 5500000, category: 'gym_membership', description: 'Gym Floor + Ice Bath recovery sessions' },
  { id: 'prod_003', name: 'Annual Gym — All Activities', durationMonths: 12, validityDays: 365, priceInclusiveMinor: 6549900, category: 'gym_membership', description: 'Gym Floor + All 7 Group Activities (Yoga, MMA, Spinning, etc.)' },
  { id: 'prod_004', name: 'Annual Happy Hours Gym Membership', durationMonths: 12, validityDays: 365, priceInclusiveMinor: 2999900, category: 'gym_membership', description: 'Gym Floor access restricted to 12:00–15:30' },
  { id: 'prod_029', name: 'Reformer Pilates — 36 Sessions (3 Months)', durationMonths: 3, validityDays: 90, priceInclusiveMinor: 4463700, category: 'reformer_pilates', description: '36 Group Reformer Pilates sessions (MWF/TThSat)' },
  { id: 'prod_day_pass', name: 'Gym Day Pass', durationMonths: 0, validityDays: 1, priceInclusiveMinor: 145000, category: 'day_pass', description: '1-Day All Access Gym Floor Pass' },
]

export default function MemberOnboardingModal({
  open,
  onOpenChange,
  onMemberCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onMemberCreated?: (member: Member) => void
}) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)

  // Step 1: Personal
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('+91 ')
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male')
  const [dob, setDob] = useState('1995-01-01')
  const [referredBy, setReferredBy] = useState('')

  // Step 2: KYC & Medical
  const [idType, setIdType] = useState<IdDocumentType>('Aadhaar')
  const [idLastFour, setIdLastFour] = useState('')
  const [bloodGroup, setBloodGroup] = useState<'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'>('O+')
  const [emergencyName, setEmergencyName] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('+91 ')
  const [emergencyRelation, setEmergencyRelation] = useState('Spouse')
  const [medicalNotes, setMedicalNotes] = useState('')
  const [specialInclusions, setSpecialInclusions] = useState('')
  const [consentSms, setConsentSms] = useState(true)
  const [consentEmail, setConsentEmail] = useState(true)
  const [consentWhatsapp, setConsentWhatsapp] = useState(false)

  // Step 3: Plan & Payment
  const [selectedPlanId, setSelectedPlanId] = useState('prod_001')
  const [discountMinor, setDiscountMinor] = useState(0)
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'Card' | 'Cash' | 'NetBanking'>('UPI')
  const [salesRep, setSalesRep] = useState('Amit Sharma')

  // Result
  const [createdMember, setCreatedMember] = useState<Member | null>(null)
  const [error, setError] = useState<string | null>(null)

  const selectedPlan = ONBOARDING_PACKAGES.find((p) => p.id === selectedPlanId) || ONBOARDING_PACKAGES[0]
  const grossInclusiveMinor = selectedPlan.priceInclusiveMinor
  const netInclusiveMinor = Math.max(0, grossInclusiveMinor - discountMinor)
  const gst = backCalculateGst(netInclusiveMinor, 0.05)

  const [loading, setLoading] = useState(false)

  const executeCompleteOnboarding = (paymentRef?: string, chosenMode?: string) => {
    const todayStr = new Date().toISOString().slice(0, 10)
    const endDateObj = new Date()
    endDateObj.setDate(endDateObj.getDate() + selectedPlan.validityDays)
    const expiryDate = endDateObj.toISOString().slice(0, 10)
    const invoiceNumber = getNextInvoiceNumber()

    const member = createMember({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      name: `${firstName.trim()} ${lastName.trim()}`,
      email: email.trim() || null,
      phone: phone.trim(),
      gender,
      dob,
      status: 'active',
      kyc: {
        id_type: idType,
        id_last_four: idLastFour.trim() || null,
        id_verified: !!idLastFour.trim(),
        id_verifier: salesRep,
        id_verified_at: new Date().toISOString(),
        blood_group: bloodGroup,
        emergency_contact_name: emergencyName.trim() || null,
        emergency_contact_phone: emergencyPhone.trim() || null,
        emergency_contact_relation: emergencyRelation || null,
        medical_notes: medicalNotes.trim() || null,
        injuries: null,
      },
      consent: {
        sms: consentSms,
        email: consentEmail,
        whatsapp: consentWhatsapp,
        updated_at: new Date().toISOString(),
      },
      active_memberships: [
        {
          id: `ms_${Date.now()}`,
          product_id: selectedPlan.id,
          product_name: selectedPlan.name,
          product_category: selectedPlan.category,
          enrolment_date: todayStr,
          activation_date: todayStr,
          expiry_date: expiryDate,
          amount_paid: netInclusiveMinor,
          discount_amount: discountMinor,
          discount_reason: discountMinor > 0 ? 'Onboarding Discount' : null,
          discount_approved_by: null,
          tax_rate: 0.05,
          status: 'active',
          invoice_id: `inv_${Date.now()}`,
          invoice_number: invoiceNumber,
          sales_rep_id: 'usr_fc_01',
          sales_rep_name: salesRep,
          sessions_total: selectedPlan.category === 'reformer_pilates' ? 36 : null,
          sessions_consumed: 0,
          sessions_remaining: selectedPlan.category === 'reformer_pilates' ? 36 : null,
          access_window: selectedPlan.name.includes('Happy Hours') ? { start: '12:00', end: '15:30' } : null,
          void_reason: null,
          voided_by: null,
          voided_at: null,
          transferred_from: null,
          transferred_to: null,
          transfer_fee_invoice_id: null,
        },
      ],
      past_memberships: [],
      fitness_metrics: [],
      staff_notes: [
        {
          id: `sn_onb_${Date.now()}`,
          authorId: 'usr_fc_01',
          authorName: salesRep,
          authorRole: 'Fitness Consultant',
          timestamp: new Date().toISOString(),
          content: `Onboarded with ${selectedPlan.name}. Invoice: ${invoiceNumber}${paymentRef ? ` (Razorpay Ref: ${paymentRef})` : ''}`,
          type: 'general',
        },
      ],
      tags: ['New Member', selectedPlan.category === 'gym_membership' ? 'Gym Tier' : 'Pilates Tier'],
      blacklisted: false,
      blacklist_reason: null,
      blacklisted_by: null,
      blacklisted_at: null,
      complimentary: false,
      special_inclusions: specialInclusions.trim() || null,
      referred_by: referredBy.trim() || null,
      referral_code: `${firstName.toUpperCase()}360`,
      media_consent: null,
      adjustment_credits_remaining: selectedPlan.category === 'reformer_pilates' ? 2 : 0,
      assigned_trainer_id: null,
      assigned_trainer_name: null,
    })

    setCreatedMember(member)
    if (onMemberCreated) onMemberCreated(member)
    toast.success(`Member registered: ${member.name}`, {
      description: `Member Code: ${member.member_code}${paymentRef ? ` · Ref: ${paymentRef}` : ''}`,
    })
    setLoading(false)
    setStep(4)
  }

  const handleRazorpayOnboard = async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountMinor: netInclusiveMinor,
          receipt: `rcpt_onb_${Date.now()}`,
          notes: {
            memberName: `${firstName.trim()} ${lastName.trim()}`,
            planName: selectedPlan.name,
            phone: phone.trim(),
          },
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.orderId) {
        throw new Error(data.error || 'Failed to initialize Razorpay payment order.')
      }

      await openRazorpayCheckout({
        orderId: data.orderId,
        amountMinor: netInclusiveMinor,
        name: 'DNA 360 Gym & Wellness',
        description: `New Membership Onboarding: ${selectedPlan.name}`,
        prefill: {
          name: `${firstName.trim()} ${lastName.trim()}`,
          email: email.trim() || undefined,
          contact: phone.trim() || undefined,
        },
        onSuccess: (paymentData) => {
          executeCompleteOnboarding(paymentData.razorpay_payment_id, 'UPI')
          toast.success('Razorpay Payment Verified', {
            description: `Payment ID: ${paymentData.razorpay_payment_id}`,
          })
        },
        onDismiss: () => {
          setLoading(false)
          toast.info('Online payment cancelled')
        },
      })
    } catch (err: any) {
      console.error('Razorpay Onboarding Checkout failed:', err)
      setLoading(false)
      setError(err.message || 'Unable to open Razorpay payment gateway.')
      toast.error('Payment Initialization Failed', {
        description: err.message || 'Unable to open Razorpay payment gateway.',
      })
    }
  }

  const handleNext = () => {
    setError(null)
    if (step === 1) {
      if (!firstName.trim() || !lastName.trim()) {
        setError('First and last name are required')
        return
      }
      if (phone.replace(/\D/g, '').length < 10) {
        setError('Valid 10-digit Indian phone number is required')
        return
      }
      setStep(2)
    } else if (step === 2) {
      if (idLastFour && idLastFour.trim().length !== 4) {
        setError('Please provide exactly the last 4 digits of the ID document')
        return
      }
      setStep(3)
    } else if (step === 3) {
      executeCompleteOnboarding(undefined, paymentMode)
    }
  }

  const handleClose = () => {
    setStep(1)
    setFirstName('')
    setLastName('')
    setEmail('')
    setPhone('+91 ')
    setIdLastFour('')
    setEmergencyName('')
    setEmergencyPhone('+91 ')
    setMedicalNotes('')
    setSpecialInclusions('')
    setCreatedMember(null)
    setError(null)
    onOpenChange(false)
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={step === 4 ? 'Registration Completed' : `Member Onboarding — Step ${step} of 3`}
      description={
        step === 1
          ? 'Personal contact & profile details'
          : step === 2
          ? 'KYC verification, channels & emergency info'
          : step === 3
          ? 'Membership package & GST invoice generation'
          : 'Member profile and QR pass generated successfully'
      }
      size="lg"
    >
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-[var(--app-danger)]/10 border border-[var(--app-danger)]/20 text-xs text-[var(--app-danger)] font-medium">
          {error}
        </div>
      )}

      {/* STEP 1: Personal Details */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First Name *"
              placeholder="e.g. Siddharth"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <Input
              label="Last Name *"
              placeholder="e.g. Rao"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Mobile Phone (+91) *"
              placeholder="+91 98200 12345"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <Input
              label="Email Address (Optional)"
              type="email"
              placeholder="sid.rao@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--app-text-secondary)]">
                Gender
              </label>
              <Select value={gender} onValueChange={(val: any) => setGender(val)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other / Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Input
              label="Date of Birth"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />

            <Input
              label="Referred By (Member Code)"
              placeholder="e.g. ARJUN360"
              value={referredBy}
              onChange={(e) => setReferredBy(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--app-glass-border)]">
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleNext} icon={<ArrowRight className="w-4 h-4" />}>
              Proceed to KYC
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: KYC & Medical */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--app-text-secondary)]">
                ID Document Type
              </label>
              <Select value={idType} onValueChange={(val: any) => setIdType(val)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aadhaar">Aadhaar (Last 4 digits)</SelectItem>
                  <SelectItem value="PAN">PAN Card</SelectItem>
                  <SelectItem value="Passport">Passport</SelectItem>
                  <SelectItem value="Driving License">Driving License</SelectItem>
                  <SelectItem value="Voter ID">Voter ID</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Input
              label="ID Number (Last 4 Digits Only)"
              placeholder="e.g. 8912"
              maxLength={4}
              value={idLastFour}
              onChange={(e) => setIdLastFour(e.target.value)}
            />

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--app-text-secondary)]">
                Blood Group
              </label>
              <Select value={bloodGroup} onValueChange={(val: any) => setBloodGroup(val)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                    <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Emergency Contact Name"
              placeholder="e.g. Kavita Rao"
              value={emergencyName}
              onChange={(e) => setEmergencyName(e.target.value)}
            />
            <Input
              label="Emergency Phone"
              placeholder="+91 98200 99999"
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
            />
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--app-text-secondary)]">
                Relation
              </label>
              <Select value={emergencyRelation} onValueChange={setEmergencyRelation}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Spouse">Spouse</SelectItem>
                  <SelectItem value="Parent">Parent</SelectItem>
                  <SelectItem value="Sibling">Sibling</SelectItem>
                  <SelectItem value="Friend">Friend</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Input
            label="Special Inclusions / Custom Privileges (Prominently shown at check-in)"
            placeholder="e.g. Complimentary weekend locker & valet parking"
            value={specialInclusions}
            onChange={(e) => setSpecialInclusions(e.target.value)}
          />

          <Input
            label="Medical Notes / Health Conditions"
            placeholder="e.g. Shoulder rehab, hypertension, etc."
            value={medicalNotes}
            onChange={(e) => setMedicalNotes(e.target.value)}
          />

          {/* Marketing consent toggles */}
          <div className="p-3 rounded-xl glass-input space-y-2 text-xs">
            <span className="font-semibold text-[var(--app-text-primary)] block">Marketing Communication Consent:</span>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={consentSms} onChange={(e) => setConsentSms(e.target.checked)} className="rounded" />
                <span>SMS Alerts (100% reach)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={consentEmail} onChange={(e) => setConsentEmail(e.target.checked)} className="rounded" />
                <span>Email Newsletter</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={consentWhatsapp} onChange={(e) => setConsentWhatsapp(e.target.checked)} className="rounded" />
                <span>WhatsApp Opt-in</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[var(--app-glass-border)]">
            <Button variant="secondary" onClick={() => setStep(1)} icon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </Button>
            <Button variant="primary" onClick={handleNext} icon={<ArrowRight className="w-4 h-4" />}>
              Select Package & Billing
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: Plan & Payment */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--app-text-secondary)]">
              Choose Product Package (GST-Inclusive)
            </label>
            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ONBOARDING_PACKAGES.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name} — {formatINR(plan.priceInclusiveMinor)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-[var(--app-text-muted)] mt-1">{selectedPlan.description}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--app-text-secondary)]">
                Discount (Minor Paise)
              </label>
              <Select value={String(discountMinor)} onValueChange={(v) => setDiscountMinor(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">₹0 (Standard)</SelectItem>
                  <SelectItem value="200000">₹2,000 (Welcome Privilege)</SelectItem>
                  <SelectItem value="500000">₹5,000 (Corporate Privilege)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--app-text-secondary)]">
                Payment Mode
              </label>
              <Select value={paymentMode} onValueChange={(v: any) => setPaymentMode(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="UPI">UPI (GPay / PhonePe)</SelectItem>
                  <SelectItem value="Card">Credit / Debit Card</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="NetBanking">Net Banking</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--app-text-secondary)]">
                Sales Rep Attribution
              </label>
              <Select value={salesRep} onValueChange={setSalesRep}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Amit Sharma">Amit Sharma (Fitness Consultant)</SelectItem>
                  <SelectItem value="Neha Kapoor">Neha Kapoor (Fitness Consultant)</SelectItem>
                  <SelectItem value="Karan Malhotra">Karan Malhotra (Fitness Consultant)</SelectItem>
                  <SelectItem value="Vikramaditya Shinde">Vikramaditya Shinde (Asst. Sales Head)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* GST Breakdown Box */}
          <div className="p-3.5 rounded-xl glass-input space-y-2 text-xs font-mono">
            <div className="flex justify-between text-[var(--app-text-secondary)]">
              <span>List Price (GST Inclusive):</span>
              <span>{formatINR(grossInclusiveMinor)}</span>
            </div>
            {discountMinor > 0 && (
              <div className="flex justify-between text-[var(--app-success)]">
                <span>Discount:</span>
                <span>-{formatINR(discountMinor)}</span>
              </div>
            )}
            <div className="flex justify-between text-[var(--app-text-secondary)]">
              <span>Taxable Value (SAC 999723):</span>
              <span>{formatINR(gst.taxable)}</span>
            </div>
            <div className="flex justify-between text-[var(--app-text-secondary)]">
              <span>GST (5% Intra-State: 2.5% CGST + 2.5% SGST):</span>
              <span>{formatINR(gst.totalTax)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-[var(--app-text-primary)] pt-2 border-t border-[var(--app-glass-border)]">
              <span>Total Payable:</span>
              <span className="text-[var(--aurora-1)]">{formatINR(netInclusiveMinor)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[var(--app-glass-border)] gap-2">
            <Button variant="secondary" onClick={() => setStep(2)} icon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                disabled={loading}
                onClick={handleNext}
                icon={<CheckCircle className="w-4 h-4" />}
              >
                Complete (Manual / Cash)
              </Button>
              <Button
                variant="primary"
                loading={loading}
                onClick={handleRazorpayOnboard}
                icon={<CreditCard className="w-4 h-4" />}
              >
                Pay via Razorpay Live ({formatINR(netInclusiveMinor)})
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: Success */}
      {step === 4 && createdMember && (
        <div className="space-y-5 text-center py-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <CheckCircle className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-lg font-display font-semibold text-[var(--app-text-primary)]">
              {createdMember.name} Registered!
            </h3>
            <p className="text-xs text-[var(--app-text-muted)] mt-1">
              Member Code: <strong className="font-mono text-emerald-400">{createdMember.member_code}</strong>
            </p>
          </div>

          <div className="p-4 rounded-xl glass-card border border-[var(--aurora-1)]/30 text-xs space-y-2 text-left">
            <p><strong>Package:</strong> {createdMember.active_memberships[0]?.product_name}</p>
            <p><strong>Valid Until:</strong> {createdMember.active_memberships[0]?.expiry_date}</p>
            <p><strong>Invoice Number:</strong> <span className="font-mono text-[var(--aurora-1)]">{createdMember.active_memberships[0]?.invoice_number}</span></p>
          </div>

          <div className="flex justify-center pt-2">
            <Button variant="primary" onClick={handleClose}>
              Done & View Members
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
