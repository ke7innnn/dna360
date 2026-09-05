'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, UserPlus, ShieldCheck, Clock } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/components/app/ui/toast'
import { QRCodeSVG } from 'qrcode.react'

export default function MemberCheckinPage() {
  const { user } = useAuth()
  const userName = user?.name || 'Aditi Deshpande'
  const memberCode = (user as any)?.member_code || 'DNA-0412'

  const [secondsRemaining, setSecondsRemaining] = useState(18)
  const [tokenSeed, setTokenSeed] = useState(Date.now())

  useEffect(() => {
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
  }, [])

  return (
    <div className="w-full max-w-md mx-auto pt-2 pb-24 px-4 select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between py-2 mb-2">
        <Link href="/m" className="member-icbtn" style={{ width: '36px', height: '36px' }}>
          <ArrowLeft className="w-4 h-4 text-white" />
        </Link>
        <span className="font-ui font-bold text-[15px] text-white">Check in</span>
        <div style={{ width: '36px' }} />
      </div>

      <div className="member-qrwrap">
        <p className="text-[13px] text-[var(--ink-2)] max-w-[240px] leading-relaxed">
          Scan at the front desk or the optical entry turnstile
        </p>

        {/* Optical QR Code Box */}
        <div className="member-qrbox flex items-center justify-center overflow-hidden bg-white">
          <QRCodeSVG
            value={`DNA360:${memberCode}:${tokenSeed}`}
            size={204}
            level="H"
            includeMargin={false}
            bgColor="#FFFFFF"
            fgColor="#000000"
          />
        </div>

        <p className="member-qrname">{userName}</p>
        <p className="member-qrid">{memberCode} · PREMIUM ANNUAL</p>

        <div className="member-qrtimer">
          <i />
          <span>Refreshes in {secondsRemaining}s</span>
        </div>

        <p className="member-qrhelp">
          This code changes every 30 seconds. Screenshots won't work — that's deliberate.
        </p>

        <div className="w-full mt-8 max-w-[320px]">
          <button
            onClick={() => {
              toast.success('Guest day pass link copied to clipboard', {
                description: 'Valid for 24 hours at Powai flagship location.',
              })
            }}
            className="w-full py-3.5 px-4 rounded-full bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--line-2)] text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>Add a guest day pass</span>
          </button>
        </div>
      </div>
    </div>
  )
}
