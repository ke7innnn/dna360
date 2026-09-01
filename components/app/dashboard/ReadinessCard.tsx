'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Check, ArrowRight, Zap, Moon, Activity } from 'lucide-react'
import {
  getTodayReadiness,
  isReadinessDismissedToday,
  dismissReadinessToday,
  recordReadiness,
  getReadinessRecommendation,
  ENERGY_LABELS,
  type ReadinessCheckInRecord,
} from '@/lib/readiness'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

export default function ReadinessCard({
  memberId,
  memberName = 'Aditi',
  onComplete,
}: {
  memberId: string
  memberName?: string
  onComplete?: (record: ReadinessCheckInRecord) => void
}) {
  const [record, setRecord] = useState<ReadinessCheckInRecord | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [step, setStep] = useState<'energy' | 'details' | 'summary'>('energy')
  const [selectedEnergy, setSelectedEnergy] = useState<number | null>(null)
  const [selectedSleep, setSelectedSleep] = useState<number | null>(null)
  const [selectedSoreness, setSelectedSoreness] = useState<number | null>(null)

  useEffect(() => {
    const existing = getTodayReadiness(memberId)
    setRecord(existing)
    setDismissed(isReadinessDismissedToday(memberId))

    const handleUpdate = () => {
      setRecord(getTodayReadiness(memberId))
      setDismissed(isReadinessDismissedToday(memberId))
    }
    window.addEventListener('dna360_readiness_updated', handleUpdate)
    return () => window.removeEventListener('dna360_readiness_updated', handleUpdate)
  }, [memberId])

  if (dismissed) return null

  const handleSelectEnergy = (val: number) => {
    setSelectedEnergy(val)
    const rec = recordReadiness({
      memberId,
      energy: val,
      createdVia: 'HOME_CARD',
    })
    setRecord(rec)
    setStep('details')
  }

  const handleSaveDetails = (skip = false) => {
    if (!selectedEnergy) return
    const rec = recordReadiness({
      memberId,
      energy: selectedEnergy,
      sleep: skip ? undefined : selectedSleep ?? undefined,
      soreness: skip ? undefined : selectedSoreness ?? undefined,
      createdVia: 'HOME_CARD',
    })
    setRecord(rec)
    setStep('summary')
    if (onComplete) onComplete(rec)
  }

  const handleDismiss = () => {
    dismissReadinessToday(memberId)
    setDismissed(true)
  }

  const recommendation = record ? getReadinessRecommendation(record.energy) : null

  // If already answered and in summary state or reloaded
  if (record && step !== 'details') {
    return (
      <div className="p-4 rounded-[20px] bg-[#0E131F]/90 border border-[rgba(59,130,246,0.25)] relative overflow-hidden backdrop-blur-xl mb-5 shadow-[0_12px_32px_rgba(0,0,0,0.4)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[rgba(59,130,246,0.15)] border border-[rgba(59,130,246,0.35)] flex items-center justify-center text-[#3B82F6]">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-ui text-xs font-semibold text-white">Daily Readiness</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#3B82F6]/20 text-[#60A5FA] border border-[#3B82F6]/30">
                  {ENERGY_LABELS[record.energy]?.label || 'Logged'}
                </span>
              </div>
              <p className="font-ui text-xs text-[var(--ink-2)] mt-0.5">
                {recommendation?.description}
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="text-[var(--ink-3)] hover:text-white p-1 rounded-full cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-5 sm:p-6 rounded-[22px] bg-gradient-to-br from-[#0B0F19]/95 via-[#111726]/90 to-[#0B0F19]/95 border border-[rgba(59,130,246,0.22)] relative overflow-hidden backdrop-blur-2xl mb-5 shadow-[0_18px_45px_rgba(0,0,0,0.6)]">
      {/* Top Edge Ambient Blue Light */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#3B82F6]/50 to-transparent" />

      {/* Dismiss Button */}
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 p-1.5 rounded-full text-[var(--ink-3)] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all cursor-pointer z-10"
        aria-label="Dismiss readiness check-in"
      >
        <X className="w-4 h-4" />
      </button>

      <AnimatePresence mode="wait">
        {step === 'energy' ? (
          <motion.div
            key="energy"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="space-y-4"
          >
            {/* Serif Personalized Greeting & Question */}
            <div>
              <p className="font-data text-[10px] uppercase tracking-[0.14em] text-[#60A5FA] font-medium mb-1">
                DAILY READINESS · 30 SEC
              </p>
              <h3 className="font-serif text-xl sm:text-2xl text-white font-normal leading-tight tracking-tight">
                {memberName}, how&apos;s your <em className="italic text-[#93C5FD]">energy today?</em>
              </h3>
            </div>

            {/* 5 Energy Tap Targets */}
            <div className="grid grid-cols-5 gap-2 sm:gap-2.5 pt-1">
              {[
                { val: 1, label: 'Drained' },
                { val: 2, label: 'Low' },
                { val: 3, label: 'Steady' },
                { val: 4, label: 'Good' },
                { val: 5, label: 'Strong' },
              ].map((item) => (
                <button
                  key={item.val}
                  onClick={() => handleSelectEnergy(item.val)}
                  className={cn(
                    'py-3.5 px-2 rounded-xl border text-center transition-all duration-150 cursor-pointer flex flex-col items-center justify-center gap-1',
                    'bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.08)] hover:bg-[#3B82F6]/15 hover:border-[#3B82F6]/40 hover:scale-[1.02] active:scale-95',
                    selectedEnergy === item.val && 'bg-[#2563EB]/25 border-[#3B82F6] text-white shadow-[0_0_15px_rgba(37,99,235,0.35)]'
                  )}
                >
                  <span className="font-ui text-xs sm:text-[13px] font-semibold text-white">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="details"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="space-y-4"
          >
            <div>
              <p className="font-data text-[10px] uppercase tracking-[0.14em] text-[#60A5FA] font-medium mb-1">
                OPTIONAL DETAILS
              </p>
              <h3 className="font-serif text-lg sm:text-xl text-white font-normal tracking-tight">
                How did you <em className="italic text-[#93C5FD]">sleep & recover?</em>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Sleep Quality */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-[var(--ink-2)]">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Moon className="w-3.5 h-3.5 text-[#60A5FA]" /> Sleep (1–5)
                  </span>
                  <span className="font-data text-white font-bold">{selectedSleep ? `${selectedSleep}/5` : 'Optional'}</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      onClick={() => setSelectedSleep(num)}
                      className={cn(
                        'py-2 rounded-lg border text-xs font-semibold font-data transition-all',
                        selectedSleep === num
                          ? 'bg-[#3B82F6] text-white border-[#3B82F6]'
                          : 'bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.08)] text-[var(--ink-2)] hover:border-white/20'
                      )}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Muscle Soreness */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-[var(--ink-2)]">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Activity className="w-3.5 h-3.5 text-[#60A5FA]" /> Soreness (1 fresh, 5 sore)
                  </span>
                  <span className="font-data text-white font-bold">{selectedSoreness ? `${selectedSoreness}/5` : 'Optional'}</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      onClick={() => setSelectedSoreness(num)}
                      className={cn(
                        'py-2 rounded-lg border text-xs font-semibold font-data transition-all',
                        selectedSoreness === num
                          ? 'bg-[#3B82F6] text-white border-[#3B82F6]'
                          : 'bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.08)] text-[var(--ink-2)] hover:border-white/20'
                      )}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => handleSaveDetails(true)}
                className="font-ui text-xs text-[var(--ink-3)] hover:text-white px-3 py-1.5 rounded-full cursor-pointer transition-colors"
              >
                Skip
              </button>
              <button
                onClick={() => handleSaveDetails(false)}
                className="px-4 py-1.5 rounded-full bg-[#2563EB] hover:bg-[#3B82F6] text-white text-xs font-bold transition-all shadow-[0_0_12px_rgba(37,99,235,0.35)] cursor-pointer"
              >
                Save
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
