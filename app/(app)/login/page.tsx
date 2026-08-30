'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { KeyRound, Smartphone, Sparkles, Building2 } from 'lucide-react'
import LoginForm from '@/components/app/auth/LoginForm'
import OtpLoginForm from '@/components/app/auth/OtpLoginForm'
import PersonaSwitcher from '@/components/app/auth/PersonaSwitcher'
import Card from '@/components/app/ui/glass-card'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'password' | 'otp'>('password')

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative select-none">
      {/* Main Orchestrated Container */}
      <motion.div
        className="w-full max-w-[440px] z-10 space-y-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: 'easeOut' }}
      >
        {/* Brand Header */}
        <div className="text-center space-y-2">
          {/* Logo Badge */}
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#F43F5E] to-[#E11D48] shadow-[0_8px_24px_-4px_rgba(244,63,94,0.6)] mb-1">
            <span className="text-white font-display text-2xl font-bold tracking-tight">D</span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--ink)] tracking-tight">
            DNA 360
          </h1>
          <p className="font-data text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
            POWAI FLAGSHIP · STUDIO MANAGEMENT
          </p>
        </div>

        {/* Centred Signature Card */}
        <Card
          className="p-6 sm:p-8 relative overflow-hidden shadow-card"
        >
          {/* Top Edge Aurora Glow Accent */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-80" />

          {/* Auth Method Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-[var(--r-sm)] bg-[var(--bg-elev)] border border-[var(--line)] mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('password')}
              className={cn(
                'flex items-center justify-center gap-2 py-2 text-xs font-ui font-semibold rounded-[var(--r-sm)] transition-all cursor-pointer',
                activeTab === 'password'
                  ? 'bg-[var(--accent-soft)] text-white border border-[rgba(244,63,94,0.30)] shadow-glow-sm'
                  : 'text-[var(--muted)] hover:text-white'
              )}
            >
              <KeyRound className="w-3.5 h-3.5" />
              Password
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('otp')}
              className={cn(
                'flex items-center justify-center gap-2 py-2 text-xs font-ui font-semibold rounded-[var(--r-sm)] transition-all cursor-pointer',
                activeTab === 'otp'
                  ? 'bg-[var(--accent-soft)] text-white border border-[rgba(244,63,94,0.30)] shadow-glow-sm'
                  : 'text-[var(--muted)] hover:text-white'
              )}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Phone OTP
            </button>
          </div>

          {/* Form views */}
          {activeTab === 'password' ? <LoginForm /> : <OtpLoginForm />}
        </Card>

        {/* Demo Persona Switcher */}
        <PersonaSwitcher />
      </motion.div>
    </div>
  )
}
