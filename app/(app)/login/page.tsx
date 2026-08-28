'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { KeyRound, Smartphone, Sparkles, Building2 } from 'lucide-react'
import LoginForm from '@/components/app/auth/LoginForm'
import OtpLoginForm from '@/components/app/auth/OtpLoginForm'
import PersonaSwitcher from '@/components/app/auth/PersonaSwitcher'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'password' | 'otp'>('password')

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative">
      {/* Background Subtle Atmosphere Vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--app-bg-base)]/40 to-[var(--app-bg-base)] pointer-events-none" />

      {/* Main Orchestrated Container */}
      <motion.div
        className="w-full max-w-[440px] z-10 space-y-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Brand Header */}
        <motion.div
          className="text-center space-y-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Logo Badge */}
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--aurora-1)] via-[var(--aurora-2)] to-[var(--aurora-3)] p-[1px] shadow-xl shadow-[var(--aurora-1)]/20 mb-1">
            <div className="w-full h-full rounded-[15px] bg-[#0B0E14] flex items-center justify-center">
              <span className="text-white font-display text-xl font-bold tracking-tight">D</span>
            </div>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--app-text-primary)] tracking-tight">
            DNA 360
          </h1>
          <p className="text-sm text-[var(--app-text-secondary)]">
            Gym Management Platform · Powai, Mumbai
          </p>
        </motion.div>

        {/* Centred Signature Glass Card */}
        <motion.div
          className={cn(
            'glass-card p-6 sm:p-8 relative overflow-hidden',
            'border border-[var(--app-glass-border)]',
            'shadow-2xl shadow-black/40'
          )}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Top Edge Aurora Glow Accent */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--aurora-1)] to-transparent opacity-60" />

          {/* Auth Method Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl glass-input mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('password')}
              className={cn(
                'flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all',
                activeTab === 'password'
                  ? 'bg-[var(--app-sidebar-active)] text-[var(--app-text-primary)] shadow-sm'
                  : 'text-[var(--app-text-muted)] hover:text-[var(--app-text-secondary)]'
              )}
            >
              <KeyRound className="w-3.5 h-3.5" />
              Password
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('otp')}
              className={cn(
                'flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all',
                activeTab === 'otp'
                  ? 'bg-[var(--app-sidebar-active)] text-[var(--app-text-primary)] shadow-sm'
                  : 'text-[var(--app-text-muted)] hover:text-[var(--app-text-secondary)]'
              )}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Phone OTP
            </button>
          </div>

          {/* Form views */}
          {activeTab === 'password' ? <LoginForm /> : <OtpLoginForm />}
        </motion.div>

        {/* Demo Persona Switcher */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="glass-card p-4"
        >
          <PersonaSwitcher />
        </motion.div>

        {/* Footer */}
        <p className="text-center text-xs text-[var(--app-text-muted)]">
          Built by Pinnacle Studios · Powered by Aurora Glass
        </p>
      </motion.div>
    </div>
  )
}
