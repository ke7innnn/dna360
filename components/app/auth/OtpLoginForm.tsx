'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Phone, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react'
import { Button } from '@/components/app/ui/button'
import { Input } from '@/components/app/ui/input'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/components/app/ui/toast'
import { normaliseIndianPhone } from '@/lib/auth'

export default function OtpLoginForm() {
  const router = useRouter()
  const { loginWithOtp } = useAuth()

  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [countdown, setCountdown] = useState(30)
  const [canResend, setCanResend] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([])

  // Resend timer countdown
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (step === 'otp' && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    } else if (countdown === 0) {
      setCanResend(true)
    }
    return () => clearTimeout(timer)
  }, [step, countdown])

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault()
    const clean = phone.replace(/\D/g, '')
    if (clean.length < 10) {
      setError('Please enter a valid 10-digit mobile number')
      return
    }

    setError(null)
    setLoading(true)

    setTimeout(() => {
      setLoading(false)
      setStep('otp')
      setCountdown(30)
      setCanResend(false)
      toast.info(`OTP sent to ${normaliseIndianPhone(phone)}`, {
        description: 'Demo code: 360360',
      })
    }, 600)
  }

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    if (error) setError(null)

    // Auto-advance
    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return

    const newOtp = [...otp]
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i]
    }
    setOtp(newOtp)
    if (pasted.length === 6) {
      otpInputsRef.current[5]?.focus()
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    const enteredOtp = otp.join('')
    if (enteredOtp.length < 6) {
      setError('Please enter the full 6-digit verification code')
      return
    }

    setError(null)
    setLoading(true)

    const res = await loginWithOtp(phone, enteredOtp)
    setLoading(false)

    if (res.success && res.redirectUrl) {
      toast.success('Signed in via Phone OTP')
      router.push(res.redirectUrl)
    } else {
      setError(res.error || 'Verification failed')
    }
  }

  const handleResend = () => {
    if (!canResend) return
    setOtp(['', '', '', '', '', ''])
    setCountdown(30)
    setCanResend(false)
    toast.info(`New OTP sent to ${normaliseIndianPhone(phone)}`, {
      description: 'Demo code: 360360',
    })
  }

  if (step === 'phone') {
    return (
      <form onSubmit={handleSendOtp} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-[var(--app-danger)]/10 border border-[var(--app-danger)]/20 text-xs text-[var(--app-danger)]">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--app-text-secondary)]">Phone Number</label>
          <div className="relative flex items-center">
            <div className="absolute left-3 flex items-center gap-1.5 pointer-events-none text-[var(--app-text-secondary)] font-medium text-sm border-r border-[var(--app-glass-border)] pr-2">
              <span>🇮🇳</span>
              <span>+91</span>
            </div>
            <input
              type="tel"
              placeholder="98200 11111"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value)
                if (error) setError(null)
              }}
              className="w-full h-10 pl-20 pr-3 text-sm glass-input text-[var(--app-text-primary)] placeholder:text-[var(--app-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--app-focus-ring)] transition-all"
              autoComplete="tel"
              disabled={loading}
              autoFocus
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full h-11 text-base mt-2"
          loading={loading}
        >
          Send One-Time Password
          {!loading && <ArrowRight className="w-4 h-4 ml-1" />}
        </Button>

        <p className="text-xs text-center text-[var(--app-text-muted)] pt-1">
          We will send a 6-digit verification code via SMS
        </p>
      </form>
    )
  }

  return (
    <form onSubmit={handleVerifyOtp} className="space-y-4">
      {error && (
        <div className="p-3 rounded-xl bg-[var(--app-danger)]/10 border border-[var(--app-danger)]/20 text-xs text-[var(--app-danger)]">
          {error}
        </div>
      )}

      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--aurora-1)]/10 border border-[var(--aurora-1)]/20 text-xs text-[var(--aurora-1)] font-medium mb-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>OTP Sent to {normaliseIndianPhone(phone)}</span>
        </div>
        <p className="text-xs text-[var(--app-text-muted)]">
          Enter code below or test with{' '}
          <button
            type="button"
            onClick={() => setOtp(['3', '6', '0', '3', '6', '0'])}
            className="text-[var(--aurora-1)] underline font-mono font-semibold"
          >
            360360
          </button>
        </p>
      </div>

      {/* 6 Digit Boxes */}
      <div className="flex items-center justify-between gap-2 pt-2" onPaste={handlePaste}>
        {otp.map((digit, idx) => (
          <input
            key={idx}
            ref={(el) => {
              otpInputsRef.current[idx] = el
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleOtpChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            className="w-11 h-12 text-center text-lg font-bold glass-input text-[var(--app-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--app-focus-ring)] transition-all font-mono"
            autoFocus={idx === 0}
          />
        ))}
      </div>

      <Button
        type="submit"
        variant="primary"
        className="w-full h-11 text-base mt-2"
        loading={loading}
      >
        Verify & Continue
        {!loading && <ArrowRight className="w-4 h-4 ml-1" />}
      </Button>

      <div className="flex items-center justify-between pt-1 text-xs">
        <button
          type="button"
          onClick={() => {
            setStep('phone')
            setOtp(['', '', '', '', '', ''])
          }}
          className="text-[var(--app-text-muted)] hover:text-[var(--app-text-secondary)] transition-colors"
        >
          Change number
        </button>

        {canResend ? (
          <button
            type="button"
            onClick={handleResend}
            className="text-[var(--aurora-1)] font-medium inline-flex items-center gap-1 hover:underline"
          >
            <RefreshCw className="w-3 h-3" />
            Resend OTP
          </button>
        ) : (
          <span className="text-[var(--app-text-muted)] tabular-nums">
            Resend code in {countdown}s
          </span>
        )}
      </div>
    </form>
  )
}
