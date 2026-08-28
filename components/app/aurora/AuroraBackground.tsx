'use client'

import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useTheme } from '@/components/app/theme/ThemeProvider'

/**
 * Aurora Background — the signature ambient element.
 *
 * Three blurred colour blobs drift slowly and continuously on a 20s+ loop.
 * Sits BEHIND all content. Heavily blurred, low opacity.
 * Respects prefers-reduced-motion (no animation).
 * Adapts to light theme (paler wash).
 */
export default function AuroraBackground() {
  const prefersReducedMotion = useReducedMotion()
  const { resolvedTheme } = useTheme()
  const isLight = resolvedTheme === 'light'

  const opacity = isLight ? 0.20 : 0.18

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Base canvas */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: isLight ? '#F0F3FA' : '#0B0E14' }}
      />

      {/* Aurora blob 1 — Cool blue */}
      <div
        className={`aurora-blob ${prefersReducedMotion ? '' : 'aurora-blob-1'}`}
        style={{
          top: '-15%',
          left: '-10%',
          width: '60vw',
          height: '60vw',
          maxWidth: '800px',
          maxHeight: '800px',
          background: `radial-gradient(circle, var(--aurora-1) 0%, transparent 70%)`,
          opacity,
        }}
      />

      {/* Aurora blob 2 — Violet */}
      <div
        className={`aurora-blob ${prefersReducedMotion ? '' : 'aurora-blob-2'}`}
        style={{
          top: '10%',
          right: '-15%',
          width: '55vw',
          height: '55vw',
          maxWidth: '750px',
          maxHeight: '750px',
          background: `radial-gradient(circle, var(--aurora-2) 0%, transparent 70%)`,
          opacity: opacity * 0.85,
        }}
      />

      {/* Aurora blob 3 — Teal */}
      <div
        className={`aurora-blob ${prefersReducedMotion ? '' : 'aurora-blob-3'}`}
        style={{
          bottom: '-20%',
          left: '15%',
          width: '65vw',
          height: '65vw',
          maxWidth: '900px',
          maxHeight: '900px',
          background: `radial-gradient(circle, var(--aurora-3) 0%, transparent 70%)`,
          opacity: opacity * 0.75,
        }}
      />
    </div>
  )
}
