'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface DataPoint {
  month: string
  gold: number
  silver: number
  platinum: number
  goldDisplay: string
  silverDisplay: string
  platinumDisplay: string
}

const DEFAULT_DATA: DataPoint[] = [
  { month: 'Jan', gold: 680, silver: 670, platinum: 820, goldDisplay: '1,120', silverDisplay: '28%', platinumDisplay: '24%' },
  { month: 'Feb', gold: 560, silver: 570, platinum: 710, goldDisplay: '980', silverDisplay: '25%', platinumDisplay: '22%' },
  { month: 'Mar', gold: 760, silver: 720, platinum: 880, goldDisplay: '1,210', silverDisplay: '29%', platinumDisplay: '27%' },
  { month: 'Apr', gold: 540, silver: 920, platinum: 700, goldDisplay: '940', silverDisplay: '34%', platinumDisplay: '21%' },
  { month: 'May', gold: 680, silver: 610, platinum: 820, goldDisplay: '1,150', silverDisplay: '26%', platinumDisplay: '28%' },
  { month: 'Jun', gold: 710, silver: 740, platinum: 830, goldDisplay: '1,240', silverDisplay: '30%', platinumDisplay: '30%' },
  { month: 'Jul', gold: 680, silver: 730, platinum: 880, goldDisplay: '1,180', silverDisplay: '31%', platinumDisplay: '29%' },
  { month: 'Aug', gold: 780, silver: 630, platinum: 910, goldDisplay: '1,290', silverDisplay: '27%', platinumDisplay: '32%' },
  { month: 'Sep', gold: 910, silver: 740, platinum: 990, goldDisplay: '1,420', silverDisplay: '29%', platinumDisplay: '35%' },
  { month: 'Nov', gold: 620, silver: 890, platinum: 810, goldDisplay: '1,080', silverDisplay: '33%', platinumDisplay: '28%' },
  { month: 'Oct', gold: 400, silver: 620, platinum: 590, goldDisplay: '780', silverDisplay: '24%', platinumDisplay: '20%' },
  { month: 'Dec', gold: 620, silver: 870, platinum: 760, goldDisplay: '1,100', silverDisplay: '32%', platinumDisplay: '26%' },
]

function getSmoothSplinePath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return ''
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] || p2

    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }
  return d
}

export default function MembershipStatusReportGraph({
  className,
}: {
  className?: string
}) {
  const [hoverIndex, setHoverIndex] = useState<number>(5) // Jun by default
  const [activeTab, setActiveTab] = useState<'tiers' | 'retention' | 'checkins'>('tiers')

  const width = 860
  const height = 300
  const padLeft = 46
  const padRight = 24
  const padTop = 30
  const padBottom = 40

  const plotWidth = width - padLeft - padRight
  const plotHeight = height - padTop - padBottom
  const maxVal = 1000

  // Coordinates mapping
  const xStep = plotWidth / (DEFAULT_DATA.length - 1)

  const getY = (val: number) => {
    const clamped = Math.max(0, Math.min(maxVal, val))
    return padTop + plotHeight - (clamped / maxVal) * plotHeight
  }

  const getX = (index: number) => {
    return padLeft + index * xStep
  }

  const goldPoints = DEFAULT_DATA.map((d, i) => ({ x: getX(i), y: getY(d.gold) }))
  const silverPoints = DEFAULT_DATA.map((d, i) => ({ x: getX(i), y: getY(d.silver) }))
  const platinumPoints = DEFAULT_DATA.map((d, i) => ({ x: getX(i), y: getY(d.platinum) }))

  const goldPath = getSmoothSplinePath(goldPoints)
  const silverPath = getSmoothSplinePath(silverPoints)
  const platinumPath = getSmoothSplinePath(platinumPoints)

  const yTicks = [1000, 900, 800, 600, 400, 200, 0]

  const activeData = DEFAULT_DATA[hoverIndex]
  const activeGold = goldPoints[hoverIndex]

  return (
    <div
      className={cn(
        'bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-card)] p-5 sm:p-6 relative overflow-hidden shadow-2xl select-none',
        className
      )}
    >
      {/* ─── Header: Title & Legend ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg sm:text-xl font-medium text-white font-display tracking-tight">
            Membership Status Report
          </h3>
          <p className="text-xs text-[var(--ink-3)] font-data mt-0.5">
            POWAI FLAGSHIP · MULTI-TIER RETENTION & CHECK-IN DYNAMICS
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EAB308] shadow-[0_0_8px_rgba(234,179,8,0.7)]" />
            <span className="text-[var(--ink)]">Gold</span>
          </div>

          <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F97316] shadow-[0_0_8px_rgba(249,115,22,0.7)]" />
            <span className="text-[var(--ink)]">Silver</span>
          </div>

          <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
            <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E] shadow-[0_0_8px_rgba(34,197,94,0.7)]" />
            <span className="text-[var(--ink)]">Platinum</span>
          </div>
        </div>
      </div>

      {/* ─── Responsive Graph SVG Container ─── */}
      <div className="relative w-full overflow-x-auto overflow-y-hidden no-scrollbar pt-2">
        <div className="min-w-[680px]">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto overflow-visible cursor-crosshair"
            onMouseLeave={() => setHoverIndex(5)}
          >
            <defs>
              {/* Spline Glowing Filters */}
              <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#EAB308" floodOpacity="0.45" />
              </filter>
              <filter id="silverGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#F97316" floodOpacity="0.45" />
              </filter>
              <filter id="platGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#22C55E" floodOpacity="0.45" />
              </filter>

              <linearGradient id="areaGold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EAB308" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#EAB308" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Y-Axis Horizontal Grid Lines */}
            {yTicks.map((tick) => {
              const yPos = getY(tick)
              return (
                <g key={tick}>
                  <line
                    x1={padLeft}
                    y1={yPos}
                    x2={width - padRight}
                    y2={yPos}
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth="1"
                    strokeDasharray="3 5"
                  />
                  <text
                    x={padLeft - 10}
                    y={yPos + 3.5}
                    textAnchor="end"
                    className="font-data text-[10px] fill-[var(--ink-3)] font-normal select-none"
                  >
                    {tick}
                  </text>
                </g>
              )
            })}

            {/* 3 Spline Curves */}
            {/* Platinum (Green) */}
            <path
              d={platinumPath}
              fill="none"
              stroke="#22C55E"
              strokeWidth="2.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#platGlow)"
            />

            {/* Silver (Orange) */}
            <path
              d={silverPath}
              fill="none"
              stroke="#F97316"
              strokeWidth="2.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#silverGlow)"
            />

            {/* Gold (Yellow) */}
            <path
              d={goldPath}
              fill="none"
              stroke="#EAB308"
              strokeWidth="2.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#goldGlow)"
            />

            {/* Vertical Guideline to Active Month */}
            {activeGold && (
              <g>
                <line
                  x1={activeGold.x}
                  y1={padTop}
                  x2={activeGold.x}
                  y2={padTop + plotHeight}
                  stroke="#EAB308"
                  strokeWidth="1.5"
                  strokeDasharray="3 4"
                  strokeOpacity="0.8"
                />

                {/* Point Halo on Gold */}
                <circle
                  cx={activeGold.x}
                  cy={activeGold.y}
                  r="6"
                  fill="#FFFFFF"
                  stroke="#EAB308"
                  strokeWidth="3.5"
                  className="shadow-lg"
                />
              </g>
            )}

            {/* Interactive Hit Areas for Month Columns */}
            {DEFAULT_DATA.map((d, idx) => {
              const xPos = getX(idx)
              const isHovered = hoverIndex === idx

              return (
                <g
                  key={d.month}
                  onMouseEnter={() => setHoverIndex(idx)}
                  className="cursor-pointer group"
                >
                  {/* Invisible Wide Hit Area */}
                  <rect
                    x={xPos - xStep / 2}
                    y={padTop}
                    width={xStep}
                    height={plotHeight + 35}
                    fill="transparent"
                  />

                  {/* X-Axis Month Label */}
                  <text
                    x={xPos}
                    y={padTop + plotHeight + 24}
                    textAnchor="middle"
                    className={cn(
                      'font-ui text-[11.5px] transition-colors select-none font-medium',
                      isHovered
                        ? 'fill-[#EAB308] font-bold text-xs'
                        : 'fill-[var(--ink-3)] group-hover:fill-white'
                    )}
                  >
                    {d.month}
                  </text>
                </g>
              )
            })}
          </svg>

          {/* ─── Floating Dark-Luxe Glass Tooltip ─── */}
          {activeGold && activeData && (
            <div
              className="absolute pointer-events-none transition-all duration-150 z-20"
              style={{
                left: `${(activeGold.x / width) * 100}%`,
                top: `${(activeGold.y / height) * 100}%`,
                transform: 'translate(-50%, -125%)',
              }}
            >
              <div className="bg-[#121318]/95 border border-[rgba(255,255,255,0.14)] rounded-2xl p-3.5 shadow-[0_20px_45px_rgba(0,0,0,0.9),0_0_24px_rgba(234,179,8,0.18)] backdrop-blur-2xl min-w-[170px] space-y-2">
                <div className="flex items-center justify-between text-xs pb-1.5 border-b border-[rgba(255,255,255,0.08)]">
                  <span className="font-display font-semibold text-white tracking-wide">
                    {activeData.month} 2026
                  </span>
                  <span className="font-data text-[10px] text-[#EAB308] font-bold uppercase">
                    Status
                  </span>
                </div>

                <div className="space-y-1.5 text-xs font-medium">
                  {/* Gold */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#EAB308] shrink-0" />
                      <span className="text-[var(--ink-2)] text-[11.5px]">Gold</span>
                    </div>
                    <span className="font-data font-bold text-white text-[12px]">
                      : {activeData.goldDisplay}
                    </span>
                  </div>

                  {/* Silver */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#F97316] shrink-0" />
                      <span className="text-[var(--ink-2)] text-[11.5px]">Silver</span>
                    </div>
                    <span className="font-data font-bold text-white text-[12px]">
                      : {activeData.silverDisplay}
                    </span>
                  </div>

                  {/* Platinum */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E] shrink-0" />
                      <span className="text-[var(--ink-2)] text-[11.5px]">Platinum</span>
                    </div>
                    <span className="font-data font-bold text-white text-[12px]">
                      : {activeData.platinumDisplay}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
