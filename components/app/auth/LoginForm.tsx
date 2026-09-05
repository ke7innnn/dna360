'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react'
import Button from '@/components/app/ui/button'
import Input from '@/components/app/ui/input'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/components/app/ui/toast'

export default function LoginForm() {
  const router = useRouter()
  const { loginWithPassword, verifyTwoFactor, isTwoFactorPending } = useAuth()

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [twoFactorOtp, setTwoFactorOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!identifier.trim()) {
      setError('Please enter your email or phone number')
      return
    }
    if (!password) {
      setError('Please enter your password')
      return
    }

    setError(null)
    setLoading(true)

    const res = await loginWithPassword(identifier, password)
    setLoading(false)

    if (res.requires2FA) {
      toast.info('2FA Challenge Required', {
        description: 'Enter your 6-digit authenticator code from your authenticator app.',
      })
      return
    }

    if (res.success && res.redirectUrl) {
      if (res.redirectUrl === '/change-password') {
        toast.info('Initial Login Security Requirement', {
          description: 'Please set your permanent password to access the platform.',
        })
      } else {
        toast.success('Signed in successfully')
      }
      router.push(res.redirectUrl)
    } else {
      setError(res.error || 'Authentication failed')
    }
  }

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (twoFactorOtp.length < 6) {
      setError('Please enter the 6-digit 2FA authenticator code')
      return
    }
    setLoading(true)
    const res = await verifyTwoFactor(twoFactorOtp)
    setLoading(false)
    if (!res.success) {
      setError(res.error || 'Invalid 2FA code')
    }
  }

  if (isTwoFactorPending) {
    return (
      <form onSubmit={handle2FASubmit} className="space-y-4">
        <div className="text-center space-y-1.5 pb-2 border-b border-[var(--line)]">
          <div className="w-10 h-10 rounded-full bg-[var(--accent-soft)] border border-[rgba(59,130,246,0.30)] flex items-center justify-center text-[var(--accent)] mx-auto shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-display font-semibold text-base text-[var(--ink)]">
            Two-Factor Authentication
          </h3>
          <p className="font-ui text-xs text-[var(--muted)]">
            Required for Owner & Revenue Leadership tiers. Enter your 6-digit TOTP code.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-[var(--r-sm)] bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.25)] text-xs text-[#EF4444] leading-relaxed">
            {error}
          </div>
        )}

        <Input
          label="6-Digit Authenticator Code"
          placeholder="123456"
          value={twoFactorOtp}
          onChange={(e) => {
            setTwoFactorOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
            if (error) setError(null)
          }}
          icon={<KeyRound className="w-4 h-4" />}
          autoFocus
          disabled={loading}
        />

        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full"
          disabled={loading || twoFactorOtp.length < 6}
          icon={<ArrowRight className="w-4 h-4" />}
        >
          {loading ? 'Verifying 2FA...' : 'Verify & Continue'}
        </Button>
      </form>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-[var(--r-sm)] bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.25)] text-xs text-[#EF4444] leading-relaxed">
          {error}
        </div>
      )}

      <Input
        label="Email or Phone Number"
        placeholder="admin@dna360.in or +919820011111"
        value={identifier}
        onChange={(e) => {
          setIdentifier(e.target.value)
          if (error) setError(null)
        }}
        icon={<Mail className="w-4 h-4" />}
        autoComplete="username"
        disabled={loading}
      />

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="font-data text-[10.5px] uppercase tracking-[0.16em] font-medium text-[var(--muted)]">
            Password
          </label>
          <Link
            href="/forgot-password"
            className="font-ui text-xs text-[var(--accent)] hover:underline transition-colors"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (error) setError(null)
            }}
            icon={<Lock className="w-4 h-4" />}
            autoComplete="current-password"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)] transition-colors p-1 cursor-pointer"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full"
          disabled={loading}
          icon={<ArrowRight className="w-4 h-4" />}
        >
          {loading ? 'Authenticating...' : 'Sign In'}
        </Button>
      </div>
    </form>
  )
}
