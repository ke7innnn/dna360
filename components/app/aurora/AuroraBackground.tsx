'use client'

import React from 'react'

/**
 * Aurora Background — Aurora Dark-Luxe (§2)
 *
 * Fixed layer behind all content (z-index: 0, pointer-events: none)
 * radial-gradient(60% 55% at 82% 8%,  rgba(244,63,94,0.20), transparent 60%),
 * radial-gradient(45% 45% at 96% 40%, rgba(190,24,93,0.16), transparent 60%),
 * radial-gradient(50% 50% at 10% 100%,rgba(129,140,248,0.08),transparent 55%),
 * linear-gradient(180deg,#0B0A0D,#08080A 40%)
 */
export default function AuroraBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Base Canvas */}
      <div className="absolute inset-0 bg-[#08080A]" />

      {/* Main Aurora Mesh Gradient */}
      <div
        className="absolute inset-0 aurora-blob-anim"
        style={{
          background: `
            radial-gradient(60% 55% at 82% 8%, rgba(244, 63, 94, 0.20), transparent 60%),
            radial-gradient(45% 45% at 96% 40%, rgba(190, 24, 93, 0.16), transparent 60%),
            radial-gradient(50% 50% at 10% 100%, rgba(129, 140, 248, 0.08), transparent 55%),
            linear-gradient(180deg, #0B0A0D 0%, #08080A 40%)
          `,
        }}
      />
    </div>
  )
}
