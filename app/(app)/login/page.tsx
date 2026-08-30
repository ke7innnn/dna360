'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { KeyRound, Smartphone, Sparkles, Building2, Shield } from 'lucide-react'
import LoginForm from '@/components/app/auth/LoginForm'
import OtpLoginForm from '@/components/app/auth/OtpLoginForm'
import PersonaSwitcher from '@/components/app/auth/PersonaSwitcher'
import Card from '@/components/app/ui/glass-card'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'password' | 'otp'>('password')

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative select-none overflow-hidden">
      {/* 1. Custom Fluted Blue Slats Background */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-700 pointer-events-none"
        style={{
          backgroundImage: `url('/images/login-bg-fluted-blue.jpg')`,
        }}
      />

      {/* 2. Soft Ambient Radial & Dark Vignette Gradient */}
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-[#07090E]/50 via-[#07090E]/35 to-[#07090E]/75 pointer-events-none" />
      <div className="fixed inset-0 z-0 bg-[radial-gradient(circle_at_50%_35%,rgba(59,130,246,0.15),transparent_70%)] pointer-events-none" />

      {/* 3. Main Centered Authentication Container */}
      <motion.div
        className="w-full max-w-[440px] z-10 space-y-6 relative"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: 'easeOut' }}
      >
        {/* Brand Header */}
        <div className="text-center space-y-2">
          {/* Logo Badge */}
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#3B82F6] via-[#2563EB] to-[#1D4ED8] shadow-[0_8px_24px_-4px_rgba(59,130,246,0.6)] mb-1 ring-1 ring-[rgba(255,255,255,0.2)]">
            <span className="text-white font-display text-2xl font-bold tracking-tight">D</span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--ink)] tracking-tight drop-shadow-md">
            DNA 360
          </h1>
          <p className="font-ui text-xs uppercase tracking-[0.14em] text-[var(--muted)] font-semibold drop-shadow-sm">
            POWAI FLAGSHIP · STUDIO MANAGEMENT
          </p>
        </div>

        {/* Centred Signature Glass Card */}
        <Card
          className="p-6 sm:p-8 relative overflow-hidden shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85)] bg-[#07090E]/80 backdrop-blur-2xl border border-[rgba(255,255,255,0.10)]"
        >
          {/* Top Edge Aurora Glow Accent */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#3B82F6] to-transparent opacity-90 shadow-[0_0_12px_#3B82F6]" />

          {/* Auth Method Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-[var(--r-sm)] bg-[var(--surface-2)] border border-[var(--line)] mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('password')}
              className={cn(
                'flex items-center justify-center gap-2 py-2 text-xs font-ui font-semibold rounded-[var(--r-sm)] transition-all cursor-pointer',
                activeTab === 'password'
                  ? 'bg-[var(--accent-soft)] text-white border border-[rgba(59,130,246,0.40)] shadow-glow-sm'
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
                  ? 'bg-[var(--accent-soft)] text-white border border-[rgba(59,130,246,0.40)] shadow-glow-sm'
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
