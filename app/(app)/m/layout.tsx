'use client'

import React, { useState, useEffect } from 'react'
import MemberBottomTabs from '@/components/app/member/MemberBottomTabs'
import MemberTopNav from '@/components/app/member/MemberTopNav'
import MemberQrModal from '@/components/app/member/MemberQrModal'
import MemberProfileModal from '@/components/app/member/MemberProfileModal'
import MemberUpgradeModal from '@/components/app/member/MemberUpgradeModal'
import { useAuth } from '@/context/AuthContext'
import { getMemberPortalState } from '@/lib/memberportal'

export default function MemberTrainingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useAuth()
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)

  const [memberCode, setMemberCode] = useState('')
  const [memberName, setMemberName] = useState('')
  const [planName, setPlanName] = useState('')

  useEffect(() => {
    const syncIdentity = async () => {
      const local = getMemberPortalState(user?.id || user?.name)
      setMemberCode(local.memberCode || '')
      setMemberName(local.memberName || user?.name || 'Member')
      setPlanName(local.planName || 'No active plan')

      const userRef = user?.id || user?.name || ''
      if (userRef && typeof window !== 'undefined') {
        try {
          const res = await fetch(`/api/member/profile?memberId=${encodeURIComponent(userRef)}`)
          if (res.ok) {
            const data = await res.json()
            if (data.profile) {
              setMemberCode(data.profile.memberCode || local.memberCode || '')
              setMemberName(data.profile.memberName || local.memberName || 'Member')
              setPlanName(data.profile.planName || local.planName || 'No active plan')
            }
          }
        } catch {
          // Offline fallback
        }
      }
    }
    syncIdentity()
    window.addEventListener('dna360_memberportal_updated', syncIdentity)
    return () => window.removeEventListener('dna360_memberportal_updated', syncIdentity)
  }, [user?.id, user?.name])

  useEffect(() => {
    const handleOpenProfile = () => setProfileModalOpen(true)
    const handleOpenQr = () => setQrModalOpen(true)
    const handleOpenUpgrade = () => setUpgradeModalOpen(true)
    window.addEventListener('dna:open-profile', handleOpenProfile)
    window.addEventListener('dna:open-qr', handleOpenQr)
    window.addEventListener('dna:open-upgrade', handleOpenUpgrade)
    return () => {
      window.removeEventListener('dna:open-profile', handleOpenProfile)
      window.removeEventListener('dna:open-qr', handleOpenQr)
      window.removeEventListener('dna:open-upgrade', handleOpenUpgrade)
    }
  }, [])

  return (
    <div className="member-app-root min-h-screen bg-[#070415] text-[#ECF1FA] relative overflow-x-hidden flex flex-col selection:bg-purple-500 selection:text-white">
      {/* Background Ambient Radial Glows (matching mockup spec) */}
      <div
        className="absolute top-0 inset-x-0 h-[480px] pointer-events-none opacity-50 z-0"
        style={{
          background: 'radial-gradient(ellipse at 50% -10%, rgba(168,85,247,0.22), rgba(236,72,153,0.12) 40%, transparent 70%)',
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-[400px] h-[350px] pointer-events-none opacity-25 z-0"
        style={{
          background: 'radial-gradient(ellipse at 80% 80%, rgba(139,92,246,0.2), transparent 70%)',
        }}
      />

      {/* Desktop / Tablet Top Navigation Bar */}
      <MemberTopNav
        onOpenQr={() => setQrModalOpen(true)}
        onOpenProfile={() => setProfileModalOpen(true)}
        planName={planName}
      />

      {/* Main Screen Content - Responsive Mobile-to-Desktop Container (no z-index trap!) */}
      <main className="flex-1 relative w-full max-w-lg md:max-w-4xl lg:max-w-5xl mx-auto pt-[env(safe-area-inset-top,0px)] md:pt-0">
        {children}
      </main>

      {/* Floating Bottom Tab Bar - Mobile Only */}
      <MemberBottomTabs />

      {/* Globally Accessible Check-in QR Modal */}
      <MemberQrModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        memberCode={memberCode}
        memberName={memberName}
        planName={planName}
      />

      {/* Member Profile & Settings Modal (Apple Guideline 5.1.1 compliant) */}
      <MemberProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        memberCode={memberCode}
        planName={planName}
      />

      {/* Member Plan Upgrade & PT Buy Modal */}
      <MemberUpgradeModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        onUpgraded={() => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('dna360_memberportal_updated'))
          }
        }}
      />
    </div>
  )
}
