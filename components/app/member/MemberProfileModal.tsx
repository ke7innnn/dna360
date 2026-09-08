'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  X,
  User,
  Shield,
  FileText,
  HelpCircle,
  LogOut,
  Trash2,
  AlertTriangle,
  Building2,
  Sparkles,
  CheckCircle2,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getInitials } from '@/lib/utils'
import { toast } from '@/components/app/ui/toast'

interface MemberProfileModalProps {
  isOpen: boolean
  onClose: () => void
  memberCode?: string
  planName?: string
}

export default function MemberProfileModal({
  isOpen,
  onClose,
  memberCode = 'DNA-0412',
  planName = 'Annual All-Access Membership',
}: MemberProfileModalProps) {
  const router = useRouter()
  const { user, logout } = useAuth()

  const userName = user?.name || 'Aditi Deshpande'
  const userEmail = user?.email || 'aditi.d@example.com'
  const initials = getInitials(userName) || 'AD'

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [confirmWord, setConfirmWord] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  if (!isOpen) return null

  const handleSignOut = async () => {
    try {
      await logout()
      toast.success('Signed out successfully')
      onClose()
      router.push('/login')
    } catch {
      router.push('/login')
    }
  }

  const handleDeleteAccount = async () => {
    if (confirmWord.trim().toUpperCase() !== 'DELETE') {
      toast.error('Please type DELETE to confirm account removal')
      return
    }

    setIsDeleting(true)
    try {
      const res = await fetch('/api/member/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: user?.id,
          memberName: userName,
          email: userEmail,
          confirmationWord: confirmWord,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('Account deletion scheduled', {
          description: data.message,
        })
        setShowDeleteConfirm(false)
        onClose()
        await logout()
        router.push('/login')
      } else {
        toast.error('Deletion Request Failed', {
          description: data.error || 'Please contact club management directly.',
        })
      }
    } catch (err) {
      toast.error('Network Error', {
        description: 'Unable to reach the server. Please try again or visit the front desk.',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-[#0C1324] border border-[rgba(56,189,248,0.22)] rounded-3xl p-6 text-[#F5F2F4] shadow-[0_24px_64px_rgba(0,0,0,0.85)] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Close */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-pulse" />
            <h2 className="font-display text-base font-semibold text-white">Member Profile</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[var(--ink-3)] hover:text-white hover:bg-white/10 transition-all"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Member Identity Card */}
        <div className="mt-5 p-4 rounded-2xl bg-gradient-to-br from-[#111C35] to-[#0A1020] border border-[rgba(56,189,248,0.25)] flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#1E40AF] to-[#38BDF8] flex items-center justify-center text-white text-lg font-bold shadow-[0_0_16px_rgba(59,130,246,0.45)] shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-white text-base truncate">{userName}</h3>
            <p className="text-xs text-[var(--ink-3)] truncate">{userEmail}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#38BDF8]/15 border border-[#38BDF8]/30 font-data text-[10px] text-[#38BDF8]">
                <Sparkles className="w-3 h-3" />
                {memberCode}
              </span>
              <span className="text-[10px] text-[var(--ink-2)] truncate">{planName}</span>
            </div>
          </div>
        </div>

        {/* Club Details */}
        <div className="mt-4 p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
          <Building2 className="w-4 h-4 text-[#38BDF8] shrink-0" />
          <div className="text-xs">
            <span className="text-white font-medium block">DNA 360 — Powai Flagship Club</span>
            <span className="text-[var(--ink-3)] text-[11px] block">Base Fitness Private Limited • GSTIN 27AAICB3300R1ZH</span>
          </div>
        </div>

        {/* Legal & App Store Compliance Links */}
        <div className="mt-5 space-y-1.5">
          <p className="font-data text-[10px] uppercase tracking-wider text-[var(--ink-3)] px-1 mb-2">
            Legal & Support (App Store)
          </p>

          <Link
            href="/privacy-policy"
            onClick={onClose}
            className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 transition-all text-xs text-[var(--ink-2)] hover:text-white"
          >
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-[#38BDF8]" />
              <span>Privacy Policy</span>
            </div>
            <span className="text-[10px] text-[var(--ink-3)] font-data">dna360.in/privacy</span>
          </Link>

          <Link
            href="/terms-and-conditions"
            onClick={onClose}
            className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 transition-all text-xs text-[var(--ink-2)] hover:text-white"
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-[#38BDF8]" />
              <span>Terms and Conditions</span>
            </div>
            <span className="text-[10px] text-[var(--ink-3)] font-data">Terms of Service</span>
          </Link>

          <Link
            href="/contact"
            onClick={onClose}
            className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 transition-all text-xs text-[var(--ink-2)] hover:text-white"
          >
            <div className="flex items-center gap-2.5">
              <HelpCircle className="w-4 h-4 text-[#38BDF8]" />
              <span>Member Concierge & Support</span>
            </div>
            <span className="text-[10px] text-[var(--ink-3)] font-data">Club Desk</span>
          </Link>
        </div>

        {/* App Version Info */}
        <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-[var(--ink-3)]">
          <span>DNA 360 Mobile App</span>
          <span className="font-data text-[10px] bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
            v1.0.0 (Build 1)
          </span>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          className="mt-4 w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white flex items-center justify-center gap-2 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>

        {/* Apple Guideline 5.1.1 Account Deletion Section */}
        <div className="mt-5 pt-4 border-t border-red-500/20">
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full text-center text-xs text-red-400/80 hover:text-red-300 py-1.5 transition-colors flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete My Account</span>
            </button>
          ) : (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-left space-y-3 animate-fade-in">
              <div className="flex items-start gap-2 text-red-300 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <p>
                  <strong>Permanent Action:</strong> Deleting your account will revoke gym turnstile access, class bookings, and active personal training credits.
                </p>
              </div>
              <p className="text-[11px] text-[var(--ink-3)]">
                To confirm, type <span className="font-bold text-red-400">DELETE</span> below:
              </p>
              <input
                type="text"
                value={confirmWord}
                onChange={(e) => setConfirmWord(e.target.value)}
                placeholder="Type DELETE"
                className="w-full px-3 py-1.5 text-xs bg-black/60 border border-red-500/40 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-red-400 uppercase"
              />
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setConfirmWord('')
                  }}
                  className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || confirmWord.trim().toUpperCase() !== 'DELETE'}
                  className="flex-1 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-40 text-xs font-semibold text-white transition-all"
                >
                  {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
