'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  User,
  Users,
  Dumbbell,
  ArrowRight,
  Sparkles,
  Check,
  ShieldCheck,
} from 'lucide-react'
import { Card } from '@/components/app/ui/glass-card'
import Button from '@/components/app/ui/button'
import { toast } from '@/components/app/ui/toast'

export default function MemberOnboardingForkPage() {
  const router = useRouter()
  const [selectedMode, setSelectedMode] = useState<'SELF' | 'TRAINER' | null>(null)
  const [requestSubmitted, setRequestSubmitted] = useState(false)

  const handleSelectSelfCoached = () => {
    toast.success('Self-Coached Mode Active', {
      description: 'You have full access to freestyle logging, gym library, and PR tracking.',
    })
    router.push('/m')
  }

  const handleSelectTrainerLed = () => {
    // In our system, if member already has assigned trainer, route them to /m
    // Otherwise show request-a-trainer prompt
    setSelectedMode('TRAINER')
  }

  const handleSubmitTrainerRequest = () => {
    setRequestSubmitted(true)
    toast.success('Trainer Request Sent', {
      description: 'Head Coach Rajesh Poojary has received your PT inquiry lead.',
    })
    setTimeout(() => {
      router.push('/m')
    }, 1500)
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6 sm:p-8 border-[rgba(59,130,246,0.3)] shadow-2xl space-y-6">
        <div className="text-center space-y-1.5">
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#60A5FA] font-semibold">
            Welcome to DNA 360 Training
          </span>
          <h2 className="text-2xl font-bold text-white font-display">
            How do you want to train?
          </h2>
          <p className="text-xs text-[var(--muted)]">
            One question, two choices. You can change this anytime in settings (§4).
          </p>
        </div>

        {/* The Two Choices */}
        <div className="space-y-3">
          {/* Choice 1: Self-Coached */}
          <div
            onClick={handleSelectSelfCoached}
            className="p-4 rounded-2xl bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--line)] hover:border-[#3B82F6] cursor-pointer transition-all flex items-start gap-4 group"
          >
            <div className="w-10 h-10 rounded-xl bg-[rgba(59,130,246,0.15)] text-[#60A5FA] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-[#60A5FA] transition-colors">
                I train on my own
              </h4>
              <p className="text-xs text-[var(--muted)] mt-1">
                Browse gym library, build your own split, or freestyle-log whatever you lift. Full PR tracking included.
              </p>
            </div>
          </div>

          {/* Choice 2: Trainer-Led */}
          <div
            onClick={handleSelectTrainerLed}
            className="p-4 rounded-2xl bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--line)] hover:border-[#34D399] cursor-pointer transition-all flex items-start gap-4 group"
          >
            <div className="w-10 h-10 rounded-xl bg-[rgba(52,211,153,0.15)] text-[#34D399] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-[#34D399] transition-colors">
                I have a trainer
              </h4>
              <p className="text-xs text-[var(--muted)] mt-1">
                Access your coach’s tailored prescriptions, side-by-side session review, and form check feedback.
              </p>
            </div>
          </div>
        </div>

        {/* Request Trainer Lead Confirmation if chosen */}
        {selectedMode === 'TRAINER' && (
          <div className="p-4 rounded-2xl bg-[rgba(52,211,153,0.08)] border border-[rgba(52,211,153,0.3)] space-y-3">
            <h5 className="text-xs font-semibold text-white">
              Connect with DNA 360 Coaching Team
            </h5>
            <p className="text-xs text-[var(--ink-2)]">
              We will match you with a certified coach (Premium, Elite, or Super Elite) based on your fitness goals.
            </p>
            <Button
              variant="primary"
              onClick={handleSubmitTrainerRequest}
              disabled={requestSubmitted}
              className="w-full justify-center text-xs bg-[#34D399] text-black font-bold"
            >
              {requestSubmitted ? 'Inquiry Sent ✓' : 'Send Trainer Request'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
