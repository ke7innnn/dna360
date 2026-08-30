'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Phone, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react'
import Button from '@/components/app/ui/button'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/components/app/ui/toast'
import { normaliseIndianPhone } from '@/lib/auth'

export default function OtpLoginForm() {
  const router = useRouter()
  const { loginWithOtp, sendLoginOtp } = useAuth()

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

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    const clean = phone.replace(/\D/g, '')
    if (clean.length < 10) {
      setError('Please enter a valid 10-digit mobile number')
      return
    }

    setError(null)
    setLoading(true)

    const res = await sendLoginOtp(phone)
    setLoading(false)

    if (res.success) {
      setStep('otp')
      setCountdown(30)
      setCanResend(false)
      toast.info(res.message)
    } else {
      setError(res.message)
    }
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

  const handleResend = async () => {
    if (!canResend) return
    setOtp(['', '', '', '', '', ''])
    setCountdown(30)
    setCanResend(false)
    const res = await sendLoginOtp(phone)
    toast.info(res.message)
  }

  if (step === 'phone') {
    return (
      <form onSubmit={handleSendOtp} className="space-y-4">
        {error && (
          <div className="p-3 rounded-[var(--r-sm)] bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.25)] text-xs text-[#EF4444]">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="font-ui text-[10.5px] uppercase tracking-[0.14em] font-semibold text-[var(--muted)]">
            Mobile Number (India)
          </label>
          <div className="relative flex items-center">
            <div className="absolute left-3 flex items-center gap-1.5 pointer-events-none text-[var(--ink-2)] font-medium font-ui text-xs border-r border-[var(--line)] pr-2">
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
              className="w-full h-10 pl-20 pr-3 font-ui text-xs rounded-[var(--r-sm)] bg-[var(--bg-elev)] border border-[var(--line)] text-[var(--ink)] placeholder:text-[var(--muted-2)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] outline-none"
              autoComplete="tel"
              disabled={loading}
              autoFocus
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full"
          disabled={loading}
          icon={<ArrowRight className="w-4 h-4" />}
        >
          {loading ? 'Sending OTP...' : 'Send WhatsApp / SMS OTP'}
        </Button>

        {/* 1-Click Quick Demo Number */}
        <div className="pt-2 border-t border-[var(--line)] space-y-2">
          <p className="font-ui text-[11px] text-[var(--muted)] text-center font-medium">
            Quick Demo Mobile (1-Click Fill):
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setPhone('9999900001')
                setError(null)
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-[var(--r-sm)] bg-[rgba(59,130,246,0.12)] hover:bg-[rgba(59,130,246,0.22)] text-[#60A5FA] border border-[rgba(59,130,246,0.30)] text-xs font-ui font-semibold transition-all cursor-pointer shadow-sm"
            >
              <span>👤 Member (+91 99999 00001)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPhone('9820011111')
                setError(null)
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-[var(--r-sm)] bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.10)] text-[var(--ink)] border border-[rgba(255,255,255,0.12)] text-xs font-ui font-semibold transition-all cursor-pointer shadow-sm"
            >
              <span>👑 Exec (+91 98200 11111)</span>
            </button>
          </div>
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={handleVerifyOtp} className="space-y-4">
      {error && (
        <div className="p-3 rounded-[var(--r-sm)] bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.25)] text-xs text-[#EF4444]">
          {error}
        </div>
      )}

      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-soft)] border border-[rgba(59,130,246,0.30)] font-ui text-[11px] text-[var(--accent)] font-semibold mb-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>OTP Sent to {normaliseIndianPhone(phone)}</span>
        </div>
        <p className="font-ui text-xs text-[var(--muted)]">
          Enter code below or click{' '}
          <button
            type="button"
            onClick={() => setOtp(['1', '2', '3', '4', '5', '6'])}
            className="text-[var(--accent)] underline font-data font-semibold cursor-pointer"
          >
            123456
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
            className="w-11 h-12 text-center text-lg font-bold rounded-[var(--r-sm)] bg-[var(--bg-elev)] border border-[var(--line)] text-[var(--ink)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] outline-none font-data tabular-nums"
            autoFocus={idx === 0}
          />
        ))}
      </div>

      <Button
        type="submit"
        variant="primary"
        size="md"
        className="w-full"
        disabled={loading || otp.join('').length < 6}
        icon={<ArrowRight className="w-4 h-4" />}
      >
        {loading ? 'Verifying OTP...' : 'Verify & Continue'}
      </Button>

      <div className="flex items-center justify-between pt-1 text-xs font-ui">
        <button
          type="button"
          onClick={() => {
            setStep('phone')
            setOtp(['', '', '', '', '', ''])
          }}
          className="text-[var(--muted)] hover:text-white transition-colors cursor-pointer"
        >
          Change number
        </button>

        {canResend ? (
          <button
            type="button"
            onClick={handleResend}
            className="text-[var(--accent)] font-medium inline-flex items-center gap-1 hover:underline cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            Resend OTP
          </button>
        ) : (
          <span className="text-[var(--muted)] font-data text-[11px] tabular-nums">
            Resend in {countdown}s
          </span>
        )}
      </div>
    </form>
  )
}
