'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Mail, Lock, CheckCircle, ArrowRight, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/app/ui/button'
import { Input } from '@/components/app/ui/input'
import { toast } from '@/components/app/ui/toast'
import { logAuditEvent } from '@/lib/audit'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<'request' | 'reset' | 'success'>('request')
  const [identifier, setIdentifier] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRequest = (e: React.FormEvent) => {
    e.preventDefault()
    if (!identifier.trim()) {
      setError('Please enter your registered email or phone')
      return
    }
    setError(null)
    setLoading(true)

    setTimeout(() => {
      setLoading(false)
      setStep('reset')
      toast.info('Password reset instructions sent', {
        description: 'Test reset OTP code: 360360',
      })
    }, 600)
  }

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault()
    if (otp !== '360360' && otp !== '123456') {
      setError('Invalid reset verification code. Use demo code: 360360')
      return
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setError(null)
    setLoading(true)

    setTimeout(() => {
      setLoading(false)
      setStep('success')
      logAuditEvent({
        actor: { id: 'usr_guest', name: identifier, email: identifier, role: 'Member' },
        action: 'UPDATE',
        entity: 'Auth',
        entityId: 'reset_pass',
        branchId: 'pow',
        description: `Password reset successfully for ${identifier}`,
      })
      toast.success('Password updated successfully')
    }, 600)
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative">
      <motion.div
        className="w-full max-w-[440px] z-10 space-y-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--app-text-muted)] hover:text-[var(--app-text-secondary)] transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Sign In
          </Link>
          <h1 className="font-display text-2xl font-semibold text-[var(--app-text-primary)] tracking-tight">
            Reset Password
          </h1>
          <p className="text-sm text-[var(--app-text-secondary)]">
            {step === 'request'
              ? 'Enter your details to receive password recovery instructions'
              : step === 'reset'
              ? 'Enter the 6-digit code and choose a new password'
              : 'Your password has been successfully reset'}
          </p>
        </div>

        {/* Card */}
        <div className="glass-card p-6 sm:p-8 border border-[var(--app-glass-border)]">
          {error && (
            <div className="p-3 rounded-xl bg-[var(--app-danger)]/10 border border-[var(--app-danger)]/20 text-xs text-[var(--app-danger)] mb-4">
              {error}
            </div>
          )}

          {step === 'request' && (
            <form onSubmit={handleRequest} className="space-y-4">
              <Input
                label="Registered Email or Phone"
                placeholder="admin@dna360.in or +919820011111"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value)
                  if (error) setError(null)
                }}
                icon={<Mail className="w-4 h-4" />}
                autoFocus
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full h-11 text-base mt-2"
                loading={loading}
              >
                Send Reset Code
                {!loading && <ArrowRight className="w-4 h-4 ml-1" />}
              </Button>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handleReset} className="space-y-4">
              <Input
                label="Reset Verification Code"
                placeholder="360360"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value)
                  if (error) setError(null)
                }}
                hint="Demo verification code: 360360"
                autoFocus
              />

              <Input
                type="password"
                label="New Password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value)
                  if (error) setError(null)
                }}
                icon={<Lock className="w-4 h-4" />}
              />

              <Input
                type="password"
                label="Confirm New Password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (error) setError(null)
                }}
                icon={<Lock className="w-4 h-4" />}
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full h-11 text-base mt-2"
                loading={loading}
              >
                Update Password
              </Button>
            </form>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4 py-3">
              <div className="w-14 h-14 rounded-full bg-[var(--app-success)]/10 text-[var(--app-success)] flex items-center justify-center mx-auto">
                <CheckCircle className="w-7 h-7" />
              </div>
              <p className="text-sm text-[var(--app-text-secondary)]">
                You can now log in using your updated password.
              </p>
              <Button
                variant="primary"
                className="w-full h-11 text-base"
                onClick={() => router.push('/login')}
              >
                Sign In Now
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
