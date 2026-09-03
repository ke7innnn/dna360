'use client'

import React, { useState } from 'react'
import MemberBottomTabs from '@/components/app/member/MemberBottomTabs'
import MemberTopNav from '@/components/app/member/MemberTopNav'
import MemberQrModal from '@/components/app/member/MemberQrModal'

export default function MemberTrainingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [qrModalOpen, setQrModalOpen] = useState(false)

  return (
    <div className="member-app-root min-h-screen bg-[#05070E] text-[#ECF1FA] relative overflow-x-hidden flex flex-col">
      {/* Background Ambient Radial Glows (matching mockup spec) */}
      <div
        className="absolute top-0 left-0 w-[500px] h-[350px] pointer-events-none opacity-40 z-0"
        style={{
          background: 'radial-gradient(ellipse at 30% 30%, rgba(59,130,246,0.25), rgba(30,64,175,0.08) 50%, transparent 75%)',
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-[500px] h-[350px] pointer-events-none opacity-30 z-0"
        style={{
          background: 'radial-gradient(ellipse at 70% 70%, rgba(56,189,248,0.2), transparent 70%)',
        }}
      />

      {/* Desktop PC Top Navigation Header */}
      <MemberTopNav onOpenQr={() => setQrModalOpen(true)} />

      {/* Main Screen Content */}
      <main className="flex-1 relative z-10 w-full">
        {children}
      </main>

      {/* Mobile Floating Bottom Tab Bar */}
      <MemberBottomTabs />

      {/* Globally Accessible Check-in QR Modal */}
      <MemberQrModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
      />
    </div>
  )
}
