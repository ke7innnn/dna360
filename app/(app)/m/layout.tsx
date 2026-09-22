'use client'

import React, { useState, useEffect } from 'react'
import MemberBottomTabs from '@/components/app/member/MemberBottomTabs'
import MemberQrModal from '@/components/app/member/MemberQrModal'
import MemberProfileModal from '@/components/app/member/MemberProfileModal'
import MemberUpgradeModal from '@/components/app/member/MemberUpgradeModal'

export default function MemberTrainingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)

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

      {/* Main Screen Content - Centered Mobile App Container */}
      <main className="flex-1 relative z-10 w-full max-w-lg mx-auto">
        {children}
      </main>

      {/* Floating Bottom Tab Bar - Always Present on App */}
      <MemberBottomTabs />

      {/* Globally Accessible Check-in QR Modal */}
      <MemberQrModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
      />

      {/* Member Profile & Settings Modal (Apple Guideline 5.1.1 compliant) */}
      <MemberProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />

      {/* Member Plan Upgrade & PT Buy Modal */}
      <MemberUpgradeModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        onUpgraded={() => {
          if (typeof window !== 'undefined') {
            window.location.reload()
          }
        }}
      />
    </div>
  )
}
