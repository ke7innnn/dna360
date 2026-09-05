'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Lock, Eye, EyeOff, ShieldAlert, CheckCircle2, XCircle, ArrowRight, ShieldCheck } from 'lucide-react'
import Button from '@/components/app/ui/button'
import Input from '@/components/app/ui/input'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/components/app/ui/toast'

export default function ChangePasswordPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Complexity rules check
  const checks = useMemo(() => {
    return {
      length: newPassword.length >= 10,
      uppercase: /[A-Z]/.test(newPassword),
      lowercase: /[a-z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
      special: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?~`\\/]/.test(newPassword),
      matches: newPassword.length > 0 && newPassword === confirmPassword,
    }
  }, [newPassword, confirmPassword])

  const passedCount = Object.values(checks).filter(Boolean).length
  const allValid = checks.length && checks.uppercase && checks.lowercase && checks.number && checks.special && checks.matches

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!allValid) {
      setError('Please satisfy all password complexity rules and ensure confirmation matches.')
      return
    }

    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword, confirmPassword }),
      })

      const data = await res.json()
      setLoading(false)

      if (!res.ok) {
        setError(data.error || 'Failed to update password')
        return
      }

      toast.success('Password updated successfully', {
        description: 'Your account is now secured with your personal password.',
      })

      // Redirect to assigned landing page or overview
      router.push(data.redirectUrl || '/overview')
    } catch (err: any) {
      setLoading(false)
      setError(err.message || 'An unexpected error occurred')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#05070E] select-none">
      <div className="w-full max-w-md bg-[#0A0E1A] border border-[rgba(56,189,248,0.2)] rounded-[24px] p-6 sm:p-8 shadow-[0_0_40px_rgba(0,0,0,0.7)]">
        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0E162B] to-[#0A0E1A] border border-[rgba(56,189,248,0.35)] flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(59,130,246,0.3)]">
            <Image
              src="/images/dna-emblem.png"
              alt="DNA 360"
              width={28}
              height={28}
              priority
              unoptimized
              className="object-contain filter drop-shadow-[0_0_6px_rgba(56,189,248,0.7)]"
            />
          </div>
          <h1 className="font-display font-semibold text-xl sm:text-2xl text-white tracking-tight">
            Set Your Permanent Password
          </h1>
          <p className="font-ui text-xs text-[var(--ink-2)] max-w-xs mx-auto">
            Mandatory security policy (§1). Your temporary credentials must be replaced with a secure password before continuing.
          </p>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.25)] text-xs text-[#EF4444] leading-relaxed flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Input
              label="New Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter new strong password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value)
                if (error) setError(null)
              }}
              icon={<Lock className="w-4 h-4" />}
              autoFocus
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[28px] text-[var(--muted-2)] hover:text-white cursor-pointer p-1"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div>
            <Input
              label="Confirm New Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                if (error) setError(null)
              }}
              icon={<Lock className="w-4 h-4" />}
              required
            />
          </div>

          {/* Strength Meter Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[11px] font-ui text-[var(--ink-3)]">
              <span>Security Strength</span>
              <span className="font-semibold text-white">
                {passedCount <= 2 ? 'Weak' : passedCount <= 4 ? 'Moderate' : 'Strong & Compliant'}
              </span>
            </div>
            <div className="h-1.5 w-full bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden flex gap-1">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  passedCount >= 1 ? (passedCount <= 2 ? 'bg-[#EF4444] w-1/3' : passedCount <= 4 ? 'bg-[#F59E0B] w-2/3' : 'bg-[#10B981] w-full') : 'w-0'
                }`}
              />
            </div>
          </div>

          {/* Complexity Rules Checklist */}
          <div className="p-3.5 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] space-y-2 text-xs">
            <p className="text-[11px] font-semibold text-[var(--ink-2)] uppercase tracking-wider">
              Password Requirements
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11.5px]">
              <div className="flex items-center gap-1.5">
                {checks.length ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-[var(--ink-3)] shrink-0" />
                )}
                <span className={checks.length ? 'text-white' : 'text-[var(--ink-3)]'}>10+ characters</span>
              </div>
              <div className="flex items-center gap-1.5">
                {checks.uppercase ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-[var(--ink-3)] shrink-0" />
                )}
                <span className={checks.uppercase ? 'text-white' : 'text-[var(--ink-3)]'}>Uppercase letter</span>
              </div>
              <div className="flex items-center gap-1.5">
                {checks.lowercase ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-[var(--ink-3)] shrink-0" />
                )}
                <span className={checks.lowercase ? 'text-white' : 'text-[var(--ink-3)]'}>Lowercase letter</span>
              </div>
              <div className="flex items-center gap-1.5">
                {checks.number ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-[var(--ink-3)] shrink-0" />
                )}
                <span className={checks.number ? 'text-white' : 'text-[var(--ink-3)]'}>Numeric digit (0-9)</span>
              </div>
              <div className="flex items-center gap-1.5">
                {checks.special ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-[var(--ink-3)] shrink-0" />
                )}
                <span className={checks.special ? 'text-white' : 'text-[var(--ink-3)]'}>Special character (!@#)</span>
              </div>
              <div className="flex items-center gap-1.5">
                {checks.matches ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-[var(--ink-3)] shrink-0" />
                )}
                <span className={checks.matches ? 'text-white' : 'text-[var(--ink-3)]'}>Passwords match</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !allValid}
            className="w-full py-3 px-4 rounded-full bg-gradient-to-r from-[#1E40AF] via-[#3B82F6] to-[#38BDF8] text-white font-bold text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span>Saving Secure Password...</span>
            ) : (
              <>
                <span>Update Password &amp; Proceed</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
