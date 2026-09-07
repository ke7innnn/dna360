'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import Button from '@/components/app/ui/button'
import Input from '@/components/app/ui/input'
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
      setError('Please enter your Username (e.g. Keith Shah) or Email/Phone')
      return
    }
    if (!password) {
      setError('Please enter your password (e.g. Keith@123)')
      return
    }

    setError(null)
    setLoading(true)

    const res = await loginWithPassword(identifier.trim(), password)
    setLoading(false)

    if (res.success && res.redirectUrl) {
      toast.success('Signed in successfully')
      router.push(res.redirectUrl)
    } else {
      setError(res.error || 'Invalid credentials. Check your name/email and password.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-[var(--r-sm)] bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.25)] text-xs text-[#EF4444] leading-relaxed">
          {error}
        </div>
      )}

      <Input
        label="Username (Name & Surname), Email, or Phone"
        placeholder="e.g. Keith Shah or Keith.mktg@dna360.in"
        value={identifier}
        onChange={(e) => {
          setIdentifier(e.target.value)
          if (error) setError(null)
        }}
        icon={<User className="w-4 h-4" />}
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
            placeholder="e.g. Keith@123"
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

      <div className="p-2.5 rounded-[var(--r-sm)] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] text-[11px] text-[var(--muted)] leading-relaxed">
        <span className="text-[var(--accent)] font-semibold">Tip:</span> Login using your registered Name & Surname as Username (e.g. <span className="text-white font-mono">Keith Shah</span>) and password (<span className="text-white font-mono">Keith@123</span>).
      </div>

      <div className="pt-1">
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
