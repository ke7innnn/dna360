'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/sections/Footer'
import { ShieldAlert, Trash2, CheckCircle2, AlertCircle, Info, Lock } from 'lucide-react'

export default function DeleteAccountPage() {
  const [emailOrPhone, setEmailOrPhone] = useState('')
  const [reason, setReason] = useState('')
  const [confirmationChecked, setConfirmationChecked] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailOrPhone.trim()) {
      setStatus('error')
      setMessage('Please enter your registered email address or phone number.')
      return
    }

    if (!confirmationChecked) {
      setStatus('error')
      setMessage('Please check the confirmation box to authorize account deletion.')
      return
    }

    setStatus('loading')
    setMessage('')

    try {
      const isEmail = emailOrPhone.includes('@')
      const payload: any = {
        reason: reason.trim() || 'User submitted web deletion form',
        confirmationWord: 'DELETE',
      }
      if (isEmail) {
        payload.email = emailOrPhone.trim()
      } else {
        payload.phone = emailOrPhone.trim()
      }

      const res = await fetch('/api/member/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (res.ok) {
        setStatus('success')
        setMessage(data.message || 'Account deletion request processed successfully.')
      } else {
        setStatus('error')
        setMessage(data.error || 'Failed to process deletion request. Please contact support.')
      }
    } catch {
      setStatus('error')
      setMessage('Network error. Please try again or contact support at support@dna360.in.')
    }
  }

  return (
    <>
      <Navbar />
      <main className="bg-[#0a0a0a] min-h-screen pt-[105px] text-[#e0e0e0]">
        {/* Banner Section */}
        <section
          className="relative h-[240px] lg:h-[300px] w-full flex items-center bg-cover bg-center"
          style={{ backgroundImage: 'url(/images/header-image.jpg)' }}
        >
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />
          <div className="relative max-w-7xl mx-auto px-4 w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#00c8c8] font-semibold mb-3">
                <Link href="/" className="hover:underline text-[#aaa]">Home</Link>
                <span>/</span>
                <span>Account & Data Deletion</span>
              </div>
              <h1 className="text-3xl lg:text-5xl font-black font-montserrat uppercase tracking-wider text-white">
                Delete Account & Data
              </h1>
              <p className="text-sm text-[#aaa] mt-2 font-opensans">
                Google Play Store & Apple App Store Privacy & Data Safety Policy Compliance
              </p>
            </motion.div>
          </div>
        </section>

        {/* Content Section */}
        <section className="max-w-4xl mx-auto px-4 py-12 font-opensans leading-relaxed text-sm lg:text-base space-y-10">
          <div className="bg-[#151515] border border-white/10 p-6 rounded-xl flex items-start gap-4">
            <ShieldAlert className="w-6 h-6 text-[#00c8c8] shrink-0 mt-1" />
            <div className="space-y-1">
              <h2 className="text-base font-bold text-white uppercase tracking-wide font-montserrat">
                User Right to Erasure & Account Deletion
              </h2>
              <p className="text-[#ccc] text-xs lg:text-sm">
                At <strong>DNA 360 Fitness Centre</strong>, we respect your privacy and provide full transparency regarding your personal data. In compliance with Google Play Developer User Data Policies and applicable data protection regulations, any user may request permanent deletion of their account and associated data through this web portal or directly within the mobile application.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* What is Deleted */}
            <div className="bg-[#121214] border border-emerald-500/20 p-5 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold font-montserrat uppercase tracking-wide text-sm">
                <Trash2 className="w-4 h-4" />
                <span>What Is Permanently Deleted</span>
              </div>
              <ul className="text-xs text-[#bbb] space-y-2 list-disc list-inside">
                <li>Personal identity records (name, email, phone number, address)</li>
                <li>Login credentials, session tokens, and passwords</li>
                <li>Dynamic Turnstile biometric QR codes and security tokens</li>
                <li>Class reservation history and personal workout tracking logs</li>
                <li>Device identifiers and mobile push notification tokens</li>
              </ul>
            </div>

            {/* What is Retained */}
            <div className="bg-[#121214] border border-amber-500/20 p-5 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold font-montserrat uppercase tracking-wide text-sm">
                <Lock className="w-4 h-4" />
                <span>Statutory Legal Retention</span>
              </div>
              <p className="text-xs text-[#bbb]">
                Under Section 36 of the Indian Central Goods and Services Tax (CGST) Act, 2017, registered commercial establishments are legally obligated to maintain books of accounts and financial Tax Invoices for a minimum retention period of 6 years (72 months). Historical tax invoices issued by Base Fitness Private Limited under GSTIN 27AAICB3300R1ZH are archived securely for tax audit compliance and cannot be expunged.
              </p>
            </div>
          </div>

          {/* Interactive Deletion Form */}
          <div className="bg-[#121216] border border-white/10 p-6 lg:p-8 rounded-2xl shadow-xl space-y-6">
            <div>
              <h3 className="text-lg lg:text-xl font-bold font-montserrat text-white uppercase tracking-wide">
                Submit Account Deletion Request
              </h3>
              <p className="text-xs text-[#888] mt-1">
                Enter your registered email address or mobile number. All device sessions will be revoked immediately and your profile anonymized within 24 hours.
              </p>
            </div>

            {status === 'success' ? (
              <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-3">
                <div className="flex items-center gap-2 text-base font-bold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Request Processed Successfully</span>
                </div>
                <p className="text-xs text-[#ccc]">{message}</p>
                <div className="pt-2">
                  <Link
                    href="/"
                    className="inline-block px-5 py-2 rounded-lg bg-[#00c8c8] text-black font-bold text-xs uppercase tracking-wider hover:bg-[#00e0e0] transition-colors"
                  >
                    Return to Homepage
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {status === 'error' && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{message}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs uppercase font-semibold text-[#aaa] mb-1.5 tracking-wider">
                    Registered Email Address or 10-Digit Mobile Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    placeholder="e.g. member@dna360.in or +91 98200 00000"
                    className="w-full px-4 py-3 rounded-xl bg-[#0a0a0c] border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#00c8c8] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase font-semibold text-[#aaa] mb-1.5 tracking-wider">
                    Reason for Deletion (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Let us know how we could improve our services..."
                    className="w-full px-4 py-3 rounded-xl bg-[#0a0a0c] border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#00c8c8] transition-colors resize-none"
                  />
                </div>

                <div className="flex items-start gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="confirmDelete"
                    checked={confirmationChecked}
                    onChange={(e) => setConfirmationChecked(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-white/20 bg-black/40 text-[#00c8c8] focus:ring-[#00c8c8] cursor-pointer"
                  />
                  <label htmlFor="confirmDelete" className="text-xs text-[#aaa] cursor-pointer select-none">
                    I understand that deleting my account is permanent and irreversible. My workout history, active gym check-in passes, and membership access will be revoked immediately.
                  </label>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white font-bold font-montserrat text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-red-900/30 flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{status === 'loading' ? 'Processing...' : 'Permanently Delete My Account'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Alternative Methods & Physical Contact */}
          <div className="p-6 rounded-xl bg-[#151515] border border-white/10 space-y-2 text-xs text-[#aaa]">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-montserrat">
              In-App Deletion & Support Contact
            </h4>
            <p>
              You may also delete your account directly inside the DNA 360 mobile app by tapping your <strong>Profile Avatar → Settings → Delete Account</strong>.
            </p>
            <p>
              For privacy inquiries, contact our Data Protection Officer at <a href="mailto:support@dna360.in" className="text-[#00c8c8] hover:underline">support@dna360.in</a> or visit DNA 360 Flagship Studio, Hiranandani Gardens, Powai, Mumbai 400076.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
