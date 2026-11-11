'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, UserPlus, DoorOpen, CheckCircle2, ShieldAlert } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/components/app/ui/toast'
import { QRCodeSVG } from 'qrcode.react'
import { getMemberPortalState, resolveMember } from '@/lib/memberportal'
import { scanTurnstilePass } from '@/lib/attendance'

export default function MemberCheckinPage() {
  const { user } = useAuth()
  const [portalState, setPortalState] = useState(() => getMemberPortalState(user?.id || user?.name))
  const member = React.useMemo(() => resolveMember(user?.id || user?.name), [user?.id, user?.name])
  const isExpiredOrBlocked =
    member?.status === 'inactive' || member?.status === 'blacklisted'

  useEffect(() => {
    const local = getMemberPortalState(user?.id || user?.name)
    setPortalState(local)
    const userRef = user?.id || user?.name || ''
    if (userRef && typeof window !== 'undefined') {
      fetch(`/api/member/profile?memberId=${encodeURIComponent(userRef)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.profile) {
            setPortalState((prev) => ({ ...prev, ...data.profile }))
          }
        })
        .catch(() => {})
    }
  }, [user?.id, user?.name])

  const userName = portalState.memberName || user?.name || 'Member'
  const memberCode = portalState.memberCode || (user as any)?.member_code || ''
  const planName = portalState.planName || 'No Active Plan'

  const [secondsRemaining, setSecondsRemaining] = useState(18)
  const [tokenSeed, setTokenSeed] = useState(Date.now())
  const [isUnlockingDoor, setIsUnlockingDoor] = useState(false)
  const [doorUnlockStatus, setDoorUnlockStatus] = useState<'idle' | 'granted' | 'denied'>('idle')

  const handleSelfVerifyAndUnlockDoor = async () => {
    if (isUnlockingDoor) return
    setIsUnlockingDoor(true)
    try {
      const qrPayload = `DNA360:${memberCode || user?.id || 'DNA-2025-0001'}:${tokenSeed}`
      const { entry } = scanTurnstilePass(qrPayload, 'gate_pow_01', 'QR')
      const granted =
        entry.decision === 'GRANTED' || entry.decision === 'GRANTED_GRACE_PERIOD'

      if (granted) {
        setDoorUnlockStatus('granted')
        toast.success('Door Unlocked · Check-In Verified', {
          description: `${entry.reason} (eSSL Gate 1 Relay Activated)`,
        })
        setTokenSeed(Date.now())
        setSecondsRemaining(30)
        setTimeout(() => setDoorUnlockStatus('idle'), 5000)
      } else {
        setDoorUnlockStatus('denied')
        toast.error('Access Denied at Turnstile', {
          description: entry.reason,
        })
        setTimeout(() => setDoorUnlockStatus('idle'), 5000)
      }
    } catch {
      toast.error('Unable to reach door controller')
    } finally {
      setIsUnlockingDoor(false)
    }
  }

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
    <div className="w-full max-w-md mx-auto pt-2 pb-28 px-4 select-none">
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

        {/* Optical QR Code Box (Locked when Membership Expired / Blacklisted) */}
        {isExpiredOrBlocked ? (
          <div className="w-[232px] h-[232px] rounded-3xl bg-rose-500/10 border-2 border-rose-500/40 flex flex-col items-center justify-center p-5 text-center space-y-2 my-3">
            <ShieldAlert className="w-10 h-10 text-rose-400" />
            <p className="text-sm font-bold text-rose-200">
              {member?.status === 'blacklisted' ? 'Account Restricted' : 'Membership Expired'}
            </p>
            <p className="text-[11px] text-rose-300/80 leading-relaxed">
              Entry QR generation and door access are disabled until your package is renewed.
            </p>
            <Link
              href="/m"
              className="mt-1 px-4 py-1.5 rounded-full bg-rose-500 text-white text-[11px] font-bold"
            >
              Renew Membership
            </Link>
          </div>
        ) : (
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
        )}

        <p className="member-qrname max-w-[280px] truncate">{userName}</p>
        <p className="member-qrid max-w-[280px] truncate">{memberCode} · {planName.toUpperCase()}</p>

        <div className="member-qrtimer">
          <i />
          <span>Refreshes in {secondsRemaining}s</span>
        </div>

        <p className="member-qrhelp">
          This code changes every 30 seconds. Screenshots won&apos;t work — that&apos;s deliberate.
        </p>

        <div className="w-full mt-6 max-w-[320px] space-y-2.5">
          <button
            onClick={handleSelfVerifyAndUnlockDoor}
            disabled={isUnlockingDoor}
            className={`w-full py-3.5 px-4 rounded-full font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
              doorUnlockStatus === 'granted'
                ? 'bg-emerald-500 text-slate-950'
                : doorUnlockStatus === 'denied'
                  ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                  : 'bg-[#38BDF8] hover:bg-[#0EA5E9] text-slate-950'
            }`}
          >
            {doorUnlockStatus === 'granted' ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Door Unlocked · Checked In!</span>
              </>
            ) : doorUnlockStatus === 'denied' ? (
              <>
                <ShieldAlert className="w-4 h-4" />
                <span>Access Denied · Contact Front Desk</span>
              </>
            ) : (
              <>
                <DoorOpen className="w-4 h-4" />
                <span>{isUnlockingDoor ? 'Verifying with eSSL Door...' : 'Verify & Unlock Entry Door'}</span>
              </>
            )}
          </button>

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
