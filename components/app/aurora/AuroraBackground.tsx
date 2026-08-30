'use client'

import React from 'react'

/**
 * Aurora Background — Aurora Dark-Luxe (§2, §3)
 *
 * Fixed layer behind all content (z-index: 0, pointer-events: none)
 * Rich multi-stop rose/crimson/magenta and indigo aurora radials.
 */
export default function AuroraBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Base Canvas */}
      <div className="absolute inset-0 bg-[#08080A]" />

      {/* Main Aurora Mesh Gradient Canvas */}
      <div
        className="absolute inset-0 aurora-blob-anim"
        style={{
          background: `
            radial-gradient(ellipse 70% 55% at 85% 5%, rgba(244, 63, 94, 0.28), rgba(190, 24, 93, 0.16) 45%, transparent 70%),
            radial-gradient(ellipse 50% 45% at 95% 35%, rgba(225, 29, 72, 0.20), transparent 60%),
            radial-gradient(ellipse 60% 50% at 10% 95%, rgba(129, 140, 248, 0.12), transparent 55%),
            radial-gradient(circle at 45% 0%, rgba(244, 63, 94, 0.10), transparent 50%),
            linear-gradient(180deg, #0B0A0E 0%, #08080A 35%, #050507 100%)
          `,
        }}
      />

      {/* Extra Top-Right Glowing Rose/Crimson Aura Orb */}
      <div
        className="absolute -top-[10%] right-[5%] w-[650px] h-[550px] rounded-full blur-[100px] pointer-events-none opacity-50 mix-blend-screen"
        style={{
          background: 'radial-gradient(circle, rgba(244, 63, 94, 0.45) 0%, rgba(190, 24, 93, 0.2) 50%, transparent 80%)',
        }}
      />

      {/* Subtle Indigo Bottom Ambient Orb */}
      <div
        className="absolute -bottom-[10%] left-[5%] w-[500px] h-[450px] rounded-full blur-[90px] pointer-events-none opacity-40 mix-blend-screen"
        style={{
          background: 'radial-gradient(circle, rgba(129, 140, 248, 0.25) 0%, transparent 70%)',
        }}
      />
    </div>
  )
}
