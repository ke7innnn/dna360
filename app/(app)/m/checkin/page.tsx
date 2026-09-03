'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, UserPlus, ShieldCheck, Clock } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/components/app/ui/toast'

export default function MemberCheckinPage() {
  const { user } = useAuth()
  const userName = user?.name || 'Aditi Deshpande'
  const memberCode = (user as any)?.member_code || 'DNA-0412'

  const [secondsRemaining, setSecondsRemaining] = useState(18)

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev <= 1 ? 30 : prev - 1))
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
        <div className="member-qrbox flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <rect x="4" y="4" width="24" height="24" fill="none" stroke="#000" strokeWidth="6.5" rx="3" />
            <rect x="12" y="12" width="8" height="8" fill="#000" rx="1.5" />
            <rect x="72" y="4" width="24" height="24" fill="none" stroke="#000" strokeWidth="6.5" rx="3" />
            <rect x="80" y="12" width="8" height="8" fill="#000" rx="1.5" />
            <rect x="4" y="72" width="24" height="24" fill="none" stroke="#000" strokeWidth="6.5" rx="3" />
            <rect x="12" y="80" width="8" height="8" fill="#000" rx="1.5" />

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
