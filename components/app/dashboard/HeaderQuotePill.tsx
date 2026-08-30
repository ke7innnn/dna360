'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, RefreshCw, Quote } from 'lucide-react'

interface SubtleQuote {
  quote: string
  author: string
}

const SUBTLE_MEMBER_QUOTES: SubtleQuote[] = [
  {
    quote: "The body achieves what the mind believes.",
    author: "Arnold Schwarzenegger",
  },
  {
    quote: "Don't count the days, make the days count.",
    author: "Muhammad Ali",
  },
  {
    quote: "Dedication sees dreams become realities.",
    author: "Kobe Bryant",
  },
  {
    quote: "You don't have to be extreme, just consistent.",
    author: "Rich Froning",
  },
  {
    quote: "Discipline is doing what needs to be done.",
    author: "David Goggins",
  },
  {
    quote: "You have power over your mind, not outside events.",
    author: "Marcus Aurelius",
  },
  {
    quote: "I've failed over and over, and that is why I succeed.",
    author: "Michael Jordan",
  },
]

export default function HeaderQuotePill() {
  const [index, setIndex] = useState(0)
  const [isAuto, setIsAuto] = useState(true)

  const current = SUBTLE_MEMBER_QUOTES[index]

  useEffect(() => {
    if (!isAuto) return
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % SUBTLE_MEMBER_QUOTES.length)
    }, 8000)
    return () => clearInterval(timer)
  }, [isAuto])

  const shuffleNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsAuto(false)
    let nextIdx = Math.floor(Math.random() * SUBTLE_MEMBER_QUOTES.length)
    if (nextIdx === index && SUBTLE_MEMBER_QUOTES.length > 1) {
      nextIdx = (nextIdx + 1) % SUBTLE_MEMBER_QUOTES.length
    }
    setIndex(nextIdx)
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(59,130,246,0.35)] transition-all select-none backdrop-blur-md shadow-sm group">
      <Sparkles className="w-2.5 h-2.5 text-[#3B82F6] shrink-0 animate-pulse" />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -3 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="flex items-center gap-1 text-[10.5px] sm:text-[11px] font-ui text-[var(--muted)]"
        >
          <span className="italic text-[var(--ink-2)] truncate max-w-[180px] sm:max-w-[280px] md:max-w-[360px]">
            &ldquo;{current.quote}&rdquo;
          </span>
          <span className="font-medium text-[var(--ink)] shrink-0 hidden sm:inline text-[10px] opacity-75">
            — {current.author}
          </span>
        </motion.div>
      </AnimatePresence>

      <button
        onClick={shuffleNext}
        title="Shuffle inspirational quote"
        className="p-0.5 rounded-full text-[var(--muted)] hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
      >
        <RefreshCw className="w-2.5 h-2.5" />
      </button>
    </div>
  )
}
