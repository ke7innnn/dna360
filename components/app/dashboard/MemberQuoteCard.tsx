'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Quote, Sparkles, RefreshCw, Copy, Check, Flame, Dumbbell } from 'lucide-react'
import Card from '@/components/app/ui/glass-card'

interface QuoteItem {
  id: number
  quote: string
  author: string
  focus: string
  category: 'Mindset' | 'Strength' | 'Discipline' | 'Recovery'
}

const MEMBER_QUOTES: QuoteItem[] = [
  {
    id: 1,
    quote: "You don't have to be extreme, just consistent. 1% better every single workout compounds into unmatched strength.",
    author: "DNA 360 Head Coach",
    focus: "Consistency",
    category: "Discipline",
  },
  {
    id: 2,
    quote: "The body achieves what the mind believes. Push past the comfort zone where real transformation happens.",
    author: "Arnold Schwarzenegger",
    focus: "Mind Over Muscle",
    category: "Strength",
  },
  {
    id: 3,
    quote: "Don't count the days, make the days count. Every drop of sweat today is your armor for tomorrow.",
    author: "Muhammad Ali",
    focus: "Execution",
    category: "Mindset",
  },
  {
    id: 4,
    quote: "Rest is not quitting; it is rebuilding. Respect your sleep, hydration, and nutrition as much as your heaviest lifts.",
    author: "DNA 360 Recovery Lab",
    focus: "Hypertrophy & Longevity",
    category: "Recovery",
  },
  {
    id: 5,
    quote: "Dedication is not what others expect of you, it is what you can give to yourself when nobody is watching.",
    author: "Kobe Bryant",
    focus: "Mamba Focus",
    category: "Discipline",
  },
  {
    id: 6,
    quote: "The pain of discipline is far less than the pain of regret. Show up, lock in, and own today's session.",
    author: "DNA 360 Master Trainer",
    focus: "Daily Standard",
    category: "Mindset",
  },
]

export default function MemberQuoteCard() {
  const [index, setIndex] = useState(0)
  const [copied, setCopied] = useState(false)
  const [isAutoCycling, setIsAutoCycling] = useState(true)

  const current = MEMBER_QUOTES[index]

  useEffect(() => {
    if (!isAutoCycling) return
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % MEMBER_QUOTES.length)
    }, 7000)
    return () => clearInterval(timer)
  }, [isAutoCycling])

  const handleNext = () => {
    setIsAutoCycling(false)
    let nextIdx = Math.floor(Math.random() * MEMBER_QUOTES.length)
    if (nextIdx === index && MEMBER_QUOTES.length > 1) {
      nextIdx = (nextIdx + 1) % MEMBER_QUOTES.length
    }
    setIndex(nextIdx)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(`"${current.quote}" — ${current.author}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="p-5 sm:p-6 relative overflow-hidden bg-gradient-to-br from-[rgba(13,17,23,0.95)] to-[rgba(17,24,39,0.75)] border border-[rgba(59,130,246,0.25)] shadow-[0_16px_36px_-12px_rgba(0,0,0,0.7)] group">
      {/* Aurora edge light */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#3B82F6] to-transparent opacity-80" />
      
      {/* Subtle watermark */}
      <Quote className="absolute -top-3 -right-3 w-24 h-24 text-white/[0.03] pointer-events-none rotate-12" />

      <div className="relative z-10 space-y-4">
        {/* Eyebrow / Category Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-ui font-bold uppercase tracking-wider bg-[rgba(59,130,246,0.15)] text-[#60A5FA] border border-[rgba(59,130,246,0.30)]">
              <Sparkles className="w-3 h-3 text-[#3B82F6] animate-pulse" />
              DAILY MOTIVATION
            </span>
            <span className="px-2 py-0.5 rounded-full text-[9.5px] font-ui font-semibold uppercase tracking-wider bg-white/5 text-[var(--muted)] border border-white/5">
              {current.category}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopy}
              title="Copy quote"
              className="p-1.5 rounded-md text-[var(--muted)] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleNext}
              title="New quote"
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-ui font-medium text-[#60A5FA] bg-[rgba(59,130,246,0.12)] hover:bg-[rgba(59,130,246,0.22)] border border-[rgba(59,130,246,0.25)] transition-all cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Shuffle</span>
            </button>
          </div>
        </div>

        {/* Dynamic Quote Text */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 8, filter: 'blur(3px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(3px)' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="space-y-3"
          >
            <p className="font-display text-sm sm:text-base font-semibold text-[var(--ink)] leading-snug tracking-tight">
              &ldquo;{current.quote}&rdquo;
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-[rgba(255,255,255,0.06)] text-xs">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#3B82F6] to-[#06B6D4] flex items-center justify-center text-white text-[10px] font-bold">
                  {current.author.charAt(0)}
                </div>
                <span className="font-ui font-semibold text-white text-xs">{current.author}</span>
              </div>
              <span className="font-ui text-[11px] text-[var(--muted)] flex items-center gap-1 font-medium">
                <Flame className="w-3 h-3 text-orange-400" />
                {current.focus}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Dots pagination */}
        <div className="flex items-center justify-center gap-1 pt-1">
          {MEMBER_QUOTES.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setIsAutoCycling(false)
                setIndex(i)
              }}
              className={`h-1 rounded-full transition-all cursor-pointer ${
                i === index ? 'w-4 bg-[#3B82F6]' : 'w-1 bg-white/20 hover:bg-white/40'
              }`}
              aria-label={`Go to quote ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </Card>
  )
}
