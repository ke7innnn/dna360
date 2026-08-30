'use client'

import React from 'react'

/**
 * Aurora Background — Luxury Electric Blue & Indigo Gradient Canvas
 *
 * Fixed layer behind all content (z-index: 0, pointer-events: none)
 * Rich multi-stop electric sapphire, vibrant cyan, and deep indigo aurora radials.
 */
export default function AuroraBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Base Canvas */}
      <div className="absolute inset-0 bg-[#07090E]" />

      {/* Main Aurora Mesh Gradient Canvas */}
      <div
        className="absolute inset-0 aurora-blob-anim"
        style={{
          background: `
            radial-gradient(ellipse 75% 60% at 85% 5%, rgba(59, 130, 246, 0.35), rgba(99, 102, 241, 0.22) 45%, transparent 75%),
            radial-gradient(ellipse 55% 50% at 95% 35%, rgba(6, 182, 212, 0.22), transparent 60%),
            radial-gradient(ellipse 65% 55% at 10% 95%, rgba(79, 70, 229, 0.25), transparent 60%),
            radial-gradient(circle at 45% 0%, rgba(59, 130, 246, 0.15), transparent 55%),
            linear-gradient(180deg, #080D18 0%, #07090E 35%, #05060A 100%)
          `,
        }}
      />

      {/* Extra Top-Right Glowing Electric Blue Aura Orb */}
      <div
        className="absolute -top-[12%] right-[3%] w-[700px] h-[600px] rounded-full blur-[110px] pointer-events-none opacity-60 mix-blend-screen"
        style={{
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.50) 0%, rgba(37, 99, 235, 0.28) 45%, rgba(6, 182, 212, 0.12) 70%, transparent 85%)',
        }}
      />

      {/* Deep Indigo/Cyan Bottom-Left Ambient Orb */}
      <div
        className="absolute -bottom-[10%] left-[5%] w-[550px] h-[500px] rounded-full blur-[100px] pointer-events-none opacity-45 mix-blend-screen"
        style={{
          background: 'radial-gradient(circle, rgba(79, 70, 229, 0.35) 0%, rgba(6, 182, 212, 0.15) 50%, transparent 75%)',
        }}
      />
    </div>
  )
}
