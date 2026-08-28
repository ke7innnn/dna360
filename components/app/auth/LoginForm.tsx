'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { Button } from '@/components/app/ui/button'
import { Input } from '@/components/app/ui/input'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/components/app/ui/toast'

export default function LoginForm() {
  const router = useRouter()
  const { loginWithPassword } = useAuth()

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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

    if (res.success && res.redirectUrl) {
      toast.success('Signed in successfully')
      router.push(res.redirectUrl)
    } else {
      setError(res.error || 'Authentication failed')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-xl bg-[var(--app-danger)]/10 border border-[var(--app-danger)]/20 text-xs text-[var(--app-danger)] leading-relaxed">
          {error}
        </div>
      )}

      <Input
        label="Email or Phone Number"
        placeholder="kevin@pinnacle.studio or +919820011111"
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
          <label className="text-sm font-medium text-[var(--app-text-secondary)]">Password</label>
          <Link
            href="/forgot-password"
            className="text-xs text-[var(--aurora-1)] hover:underline transition-colors"
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
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--app-text-muted)] hover:text-[var(--app-text-primary)] transition-colors p-1"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        variant="primary"
        className="w-full h-11 text-base mt-2"
        loading={loading}
      >
        Sign In
        {!loading && <ArrowRight className="w-4 h-4 ml-1" />}
      </Button>

      <div className="pt-2 text-center">
        <p className="text-xs text-[var(--app-text-muted)]">
          Demo accounts password: <span className="text-[var(--app-text-primary)] font-mono font-medium">password123</span>
        </p>
      </div>
    </form>
  )
}
