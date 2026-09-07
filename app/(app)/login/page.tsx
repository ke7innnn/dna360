'use client'

import React from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import LoginForm from '@/components/app/auth/LoginForm'
import Card from '@/components/app/ui/glass-card'

export default function LoginPage() {
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
        className="w-full max-w-[440px] z-10 space-y-5 relative"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: 'easeOut' }}
      >
        {/* Brand Header with Official DNA 360 Logo */}
        <div className="text-center space-y-2 flex flex-col items-center">
          <div className="relative p-3 rounded-2xl bg-[rgba(255,255,255,0.03)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)] shadow-[0_12px_32px_rgba(0,0,0,0.5)]">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-[rgba(59,130,246,0.3)] to-[rgba(6,182,212,0.2)] opacity-40 blur-lg pointer-events-none" />
            <Image
              src="/images/main-logo/main-logo.png"
              alt="DNA 360 Fitness"
              width={160}
              height={180}
              className="h-20 w-auto object-contain relative z-10 drop-shadow-[0_4px_16px_rgba(59,130,246,0.5)]"
              priority
            />
          </div>

          <p className="font-ui text-[10.5px] uppercase tracking-[0.18em] text-[var(--accent)] font-bold pt-1">
            POWAI FLAGSHIP · STUDIO MANAGEMENT
          </p>
        </div>

        {/* Centred Signature Glass Card */}
        <Card
          className="p-6 sm:p-8 relative overflow-hidden shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85)] bg-[#07090E]/80 backdrop-blur-2xl border border-[rgba(255,255,255,0.10)]"
        >
          {/* Top Edge Aurora Glow Accent */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#3B82F6] to-transparent opacity-90 shadow-[0_0_12px_#3B82F6]" />

          <div className="text-center space-y-1 pb-4 mb-5 border-b border-[var(--line)]">
            <h2 className="font-display font-semibold text-lg text-white">
              Member & Staff Portal Sign In
            </h2>
            <p className="font-ui text-xs text-[var(--muted)]">
              Sign in with your Name & Surname or Email, and your password.
            </p>
          </div>

          {/* Form view */}
          <LoginForm />
        </Card>
      </motion.div>
    </div>
  )
}
