/**
 * DNA 360 — Renewal Collections Forecasting Engine
 *
 * Models forward renewal revenue over 30, 60, and 90-day horizons
 * across Conservative (Low), Expected (Base), and Optimistic (High) scenarios.
 */

import { getStoredMembers } from '@/lib/members'

export interface HorizonForecast {
  days: number // 30, 60, 90
  label: string
  expiringCount: number
  totalGrossValueMinor: number
  scenarios: {
    low: { ratePct: number; projectedCollectionsMinor: number }
    base: { ratePct: number; projectedCollectionsMinor: number }
    high: { ratePct: number; projectedCollectionsMinor: number }
  }
}

export function getRenewalForecast(): HorizonForecast[] {
  const members = getStoredMembers()

  const expiring30 = members.filter((m) => m.status === 'expiring_soon' || m.status === 'grace_period').length
  const expiring60 = expiring30 + 45
  const expiring90 = expiring60 + 58

  const avgPackagePriceMinor = 4350000 // ₹43,500

  const buildHorizon = (days: number, label: string, count: number): HorizonForecast => {
    const totalGross = count * avgPackagePriceMinor
    return {
      days,
      label,
      expiringCount: count,
      totalGrossValueMinor: totalGross,
      scenarios: {
        low: {
          ratePct: 65,
          projectedCollectionsMinor: Math.round(totalGross * 0.65),
        },
        base: {
          ratePct: 78,
          projectedCollectionsMinor: Math.round(totalGross * 0.78),
        },
        high: {
          ratePct: 90,
          projectedCollectionsMinor: Math.round(totalGross * 0.90),
        },
      },
    }
  }

  return [
    buildHorizon(30, 'Next 30 Days (Sep 2026)', expiring30),
    buildHorizon(60, 'Next 60 Days (Oct 2026)', expiring60),
    buildHorizon(90, 'Next 90 Days (Nov 2026)', expiring90),
  ]
}
