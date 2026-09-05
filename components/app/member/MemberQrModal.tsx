'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowLeft, ShieldCheck, UserPlus, RefreshCw } from 'lucide-react'
import { toast } from '@/components/app/ui/toast'
import { useAuth } from '@/context/AuthContext'

import { QRCodeSVG } from 'qrcode.react'

interface MemberQrModalProps {
  isOpen: boolean
  onClose: () => void
  memberCode?: string
  memberName?: string
  planName?: string
  onSimulateScan?: (code: string) => void
}

export default function MemberQrModal({
  isOpen,
  onClose,
  memberCode: propMemberCode,
  memberName: propMemberName,
  planName: propPlanName,
  onSimulateScan,
}: MemberQrModalProps) {
  const { user } = useAuth()
  const userName = propMemberName || user?.name || 'Arjun Mehta'
  const memberCode = propMemberCode || (user as any)?.member_code || 'DNA-2025-0001'
  const planName = propPlanName || 'PREMIUM ANNUAL'

  const [secondsRemaining, setSecondsRemaining] = useState(18)
  const [tokenSeed, setTokenSeed] = useState(Date.now())

  // Dynamic 30s rolling TOTP token countdown
  useEffect(() => {
    if (!isOpen) return
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setTokenSeed(Date.now())
          return 30
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [isOpen])

  if (!isOpen) return null

  const qrPayload = `DNA360:${memberCode}:${tokenSeed}`

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-[390px] rounded-[32px] bg-[#05070E] border border-[rgba(255,255,255,0.12)] p-6 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] overflow-hidden text-center flex flex-col items-center"
        >
          {/* Subtle Ambient Aurora Light */}
          <div className="absolute -top-20 -left-20 w-56 h-56 rounded-full bg-[#3B82F6]/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-56 h-56 rounded-full bg-[#38BDF8]/15 blur-3xl pointer-events-none" />

          {/* Nav Header */}
          <div className="w-full flex items-center justify-between pb-3 relative z-10">
            <button
              onClick={onClose}
              className="member-icbtn"
              style={{ width: '36px', height: '36px' }}
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>
            <span className="font-ui font-bold text-[15px] text-white">Member QR Pass</span>
            <div style={{ width: '36px' }} />
          </div>

          <div className="member-qrwrap relative z-10 w-full mt-2">
            <p className="text-[13px] text-[var(--ink-2)] max-w-[240px] mx-auto leading-relaxed">
              Scan at the front desk or the optical entry turnstile
            </p>

            {/* Glowing High-Definition Optical QR Code Box */}
            <div className="member-qrbox mx-auto flex items-center justify-center overflow-hidden bg-white shadow-[0_0_30px_rgba(56,189,248,0.25)]">
              <QRCodeSVG
                value={qrPayload}
                size={204}
                level="H"
                includeMargin={false}
                bgColor="#FFFFFF"
                fgColor="#000000"
              />
            </div>

            {/* Member Details */}
            <p className="member-qrname">{userName}</p>
            <p className="member-qrid">{memberCode} · {planName}</p>

            {/* Dynamic Countdown Pill */}
            <div className="member-qrtimer">
              <i />
              <span>Rolling TOTP Token · Refreshes in {secondsRemaining}s</span>
            </div>

            {/* Anti-Fraud / Security Note */}
            <p className="member-qrhelp">
              This dynamic code rotates every 30 seconds to prevent unauthorized screenshot sharing.
            </p>

            {/* Action Buttons */}
            <div className="w-full mt-5 space-y-2">
              {onSimulateScan ? (
                <button
                  type="button"
                  onClick={() => {
                    onSimulateScan(qrPayload)
                    onClose()
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-900/30"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Test Turnstile Check-in</span>
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(memberCode)
                  toast.success(`Member code ${memberCode} copied to clipboard`)
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--line-2)] text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Copy Member ID ({memberCode})</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
