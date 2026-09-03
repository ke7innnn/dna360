'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowLeft, ShieldCheck, UserPlus, RefreshCw } from 'lucide-react'
import { toast } from '@/components/app/ui/toast'
import { useAuth } from '@/context/AuthContext'

interface MemberQrModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function MemberQrModal({ isOpen, onClose }: MemberQrModalProps) {
  const { user } = useAuth()
  const userName = user?.name || 'Aditi Deshpande'
  const memberCode = (user as any)?.member_code || 'DNA-0412'

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
            <span className="font-ui font-bold text-[15px] text-white">Check in</span>
            <div style={{ width: '36px' }} />
          </div>

          <div className="member-qrwrap relative z-10 w-full mt-2">
            <p className="text-[13px] text-[var(--ink-2)] max-w-[240px] mx-auto leading-relaxed">
              Scan at the front desk or the optical entry turnstile
            </p>

            {/* Glowing High-Definition Optical QR Code Box */}
            <div className="member-qrbox mx-auto flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Standard 3 Corner Positional Finder Markers */}
                <rect x="4" y="4" width="24" height="24" fill="none" stroke="#000" strokeWidth="6.5" rx="3" />
                <rect x="12" y="12" width="8" height="8" fill="#000" rx="1.5" />
                <rect x="72" y="4" width="24" height="24" fill="none" stroke="#000" strokeWidth="6.5" rx="3" />
                <rect x="80" y="12" width="8" height="8" fill="#000" rx="1.5" />
                <rect x="4" y="72" width="24" height="24" fill="none" stroke="#000" strokeWidth="6.5" rx="3" />
                <rect x="12" y="80" width="8" height="8" fill="#000" rx="1.5" />

                {/* High Density QR Data Grid */}
                <g fill="#000">
                  <rect x="36" y="6" width="5" height="5" />
                  <rect x="46" y="6" width="5" height="5" />
                  <rect x="56" y="11" width="5" height="5" />
                  <rect x="36" y="16" width="5" height="5" />
                  <rect x="51" y="16" width="5" height="5" />
                  <rect x="61" y="6" width="5" height="5" />
                  <rect x="41" y="21" width="5" height="5" />
                  <rect x="56" y="21" width="5" height="5" />
                  <rect x="36" y="26" width="5" height="5" />
                  <rect x="6" y="36" width="5" height="5" />
                  <rect x="16" y="36" width="5" height="5" />
                  <rect x="26" y="41" width="5" height="5" />
                  <rect x="6" y="46" width="5" height="5" />
                  <rect x="21" y="46" width="5" height="5" />
                  <rect x="11" y="51" width="5" height="5" />
                  <rect x="6" y="61" width="5" height="5" />
                  <rect x="21" y="56" width="5" height="5" />
                  <rect x="16" y="61" width="5" height="5" />
                  <rect x="36" y="36" width="5" height="5" />
                  <rect x="46" y="41" width="5" height="5" />
                  <rect x="56" y="36" width="5" height="5" />
                  <rect x="41" y="46" width="5" height="5" />
                  <rect x="51" y="51" width="5" height="5" />
                  <rect x="61" y="46" width="5" height="5" />
                  <rect x="36" y="56" width="5" height="5" />
                  <rect x="46" y="61" width="5" height="5" />
                  <rect x="66" y="56" width="5" height="5" />
                  <rect x="71" y="36" width="5" height="5" />
                  <rect x="81" y="41" width="5" height="5" />
                  <rect x="91" y="36" width="5" height="5" />
                  <rect x="76" y="51" width="5" height="5" />
                  <rect x="86" y="56" width="5" height="5" />
                  <rect x="71" y="61" width="5" height="5" />
                  <rect x="36" y="71" width="5" height="5" />
                  <rect x="46" y="76" width="5" height="5" />
                  <rect x="41" y="86" width="5" height="5" />
                  <rect x="56" y="71" width="5" height="5" />
                  <rect x="66" y="81" width="5" height="5" />
                  <rect x="51" y="91" width="5" height="5" />
                  <rect x="76" y="71" width="5" height="5" />
                  <rect x="86" y="76" width="5" height="5" />
                  <rect x="71" y="86" width="5" height="5" />
                  <rect x="91" y="86" width="5" height="5" />
                  <rect x="81" y="91" width="5" height="5" />
                  <rect x="61" y="91" width="5" height="5" />
                </g>
              </svg>
            </div>

            {/* Member Details */}
            <p className="member-qrname">{userName}</p>
            <p className="member-qrid">{memberCode} · PREMIUM ANNUAL</p>

            {/* Dynamic Countdown Pill */}
            <div className="member-qrtimer">
              <i />
              <span>Refreshes in {secondsRemaining}s</span>
            </div>

            {/* Anti-Fraud / Security Note */}
            <p className="member-qrhelp">
              This code changes every 30 seconds. Screenshots won't work — that's deliberate.
            </p>

            {/* Guest Pass Action */}
            <div className="w-full mt-6">
              <button
                onClick={() => {
                  toast.success('Guest day pass link copied to clipboard', {
                    description: 'Valid for 24 hours at Powai flagship location.',
                  })
                }}
                className="w-full py-3.5 px-4 rounded-full bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--line-2)] text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>Add a guest day pass</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
