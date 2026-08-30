'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Quote, Sparkles, RefreshCw, ChevronLeft, ChevronRight, Copy, Check, Flame, Trophy } from 'lucide-react'

interface FitnessQuote {
  id: number
  quote: string
  author: string
  title: string
  category: 'Mindset' | 'Strength' | 'Discipline' | 'Philosophy'
  highlight: string
}

const FITNESS_QUOTES: FitnessQuote[] = [
  {
    id: 1,
    quote: "The only place where success comes before work is in the dictionary. Transformation happens in the reps you refuse to quit on.",
    author: "Vince Lombardi",
    title: "Legendary Championship Coach",
    category: "Philosophy",
    highlight: "reps you refuse to quit on",
  },
  {
    id: 2,
    quote: "The last three or four reps is what makes the muscle grow. This area of pain divides a champion from someone who is not a champion.",
    author: "Arnold Schwarzenegger",
    title: "7x Mr. Olympia & Fitness Icon",
    category: "Strength",
    highlight: "divides a champion",
  },
  {
    id: 3,
    quote: "I hated every minute of training, but I said, 'Don't quit. Suffer now and live the rest of your life as a champion.'",
    author: "Muhammad Ali",
    title: "The Greatest of All Time",
    category: "Mindset",
    highlight: "live as a champion",
  },
  {
    id: 4,
    quote: "Great things come from hard work and perseverance. No excuses. Dedication sees dreams become realities.",
    author: "Kobe Bryant",
    title: "5x NBA Champion & Mamba Mindset",
    category: "Discipline",
    highlight: "Mamba Mindset",
  },
  {
    id: 5,
    quote: "You have to believe in yourself when no one else does. That's what makes you a winner right there.",
    author: "Venus Williams",
    title: "7x Grand Slam Champion",
    category: "Mindset",
    highlight: "believe in yourself",
  },
  {
    id: 6,
    quote: "Discipline is doing what needs to be done, even if you don't want to do it. Excuses will always be there, opportunity won't.",
    author: "David Goggins",
    title: "Ultramarathon Champion & Navy SEAL",
    category: "Discipline",
    highlight: "opportunity won't",
  },
  {
    id: 7,
    quote: "I've missed more than 9,000 shots in my career. I've lost almost 300 games. I've failed over and over again. And that is why I succeed.",
    author: "Michael Jordan",
    title: "6x NBA Champion & Legend",
    category: "Mindset",
    highlight: "why I succeed",
  },
  {
    id: 8,
    quote: "Your body can stand almost anything. It's your mind that you have to convince. You have power over your mind, not outside events.",
    author: "Marcus Aurelius",
    title: "Stoic Philosopher & Emperor",
    category: "Philosophy",
    highlight: "power over your mind",
  },
]

export default function DynamicQuotes() {
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Mindset' | 'Strength' | 'Discipline' | 'Philosophy'>('All')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [copied, setCopied] = useState(false)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  const filteredQuotes = selectedCategory === 'All' 
    ? FITNESS_QUOTES 
    : FITNESS_QUOTES.filter((q) => q.category === selectedCategory)

  // Auto cycle every 6 seconds
  useEffect(() => {
    if (!isAutoPlaying) return
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % filteredQuotes.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [filteredQuotes.length, isAutoPlaying])

  // Reset index when category changes
  useEffect(() => {
    setCurrentIndex(0)
  }, [selectedCategory])

  const currentQuote = filteredQuotes[currentIndex] || FITNESS_QUOTES[0]

  const handleNext = () => {
    setIsAutoPlaying(false)
    setCurrentIndex((prev) => (prev + 1) % filteredQuotes.length)
  }

  const handlePrev = () => {
    setIsAutoPlaying(false)
    setCurrentIndex((prev) => (prev - 1 + filteredQuotes.length) % filteredQuotes.length)
  }

  const handleRandomQuote = () => {
    setIsAutoPlaying(false)
    let nextIdx = Math.floor(Math.random() * filteredQuotes.length)
    if (nextIdx === currentIndex && filteredQuotes.length > 1) {
      nextIdx = (nextIdx + 1) % filteredQuotes.length
    }
    setCurrentIndex(nextIdx)
  }

  const handleCopyQuote = () => {
    navigator.clipboard.writeText(`"${currentQuote.quote}" — ${currentQuote.author}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-[#07090E] overflow-hidden select-none border-t border-b border-[rgba(255,255,255,0.06)]">
      {/* Background Ambient Aurora Glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] rounded-full blur-[100px] pointer-events-none opacity-25"
        style={{
          background: 'radial-gradient(circle, rgba(59,130,246,0.6) 0%, rgba(6,182,212,0.3) 50%, transparent 80%)',
        }}
      />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header Eyebrow */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-ui uppercase font-bold tracking-[0.14em] bg-[rgba(59,130,246,0.12)] text-[#60A5FA] border border-[rgba(59,130,246,0.30)] shadow-sm">
                <Sparkles className="w-3 h-3 text-[#3B82F6] animate-pulse" />
                DAILY MOTIVATIONAL PULSE
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-ui uppercase font-semibold text-[var(--muted)] border border-white/5 bg-white/5">
                <Flame className="w-3 h-3 text-orange-400" />
                Live Feed
              </span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
              Fuel Your <span className="bg-gradient-to-r from-[#60A5FA] via-[#38BDF8] to-[#93C5FD] bg-clip-text text-transparent">Daily Drive</span>
            </h2>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center flex-wrap gap-1.5 p-1 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] backdrop-blur-md">
            {(['All', 'Mindset', 'Strength', 'Discipline', 'Philosophy'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 text-xs font-ui font-semibold rounded-lg transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#3B82F6] text-white shadow-[0_0_12px_rgba(59,130,246,0.6)]'
                    : 'text-[var(--muted)] hover:text-white hover:bg-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Main Quote Glassmorphism Card */}
        <div className="relative rounded-3xl bg-[rgba(13,17,23,0.75)] backdrop-blur-2xl border border-[rgba(255,255,255,0.10)] p-8 sm:p-12 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85)] overflow-hidden group">
          {/* Top Glowing Blue Aurora Line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#3B82F6] to-transparent opacity-80" />

          {/* Giant Background Quote Watermark */}
          <Quote className="absolute -top-4 -right-4 w-40 h-40 text-white/[0.03] pointer-events-none rotate-12" />

          {/* Quote Content with Animated Transition */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuote.id}
              initial={{ opacity: 0, y: 15, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -15, filter: 'blur(4px)' }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="space-y-6 relative z-10"
            >
              {/* Category Pill + Highlight Badge */}
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-ui font-bold uppercase tracking-wider bg-[rgba(59,130,246,0.15)] text-[#60A5FA] border border-[rgba(59,130,246,0.35)]">
                  {currentQuote.category}
                </span>
                <span className="text-[11px] font-ui text-[var(--muted)] flex items-center gap-1 font-medium">
                  <Trophy className="w-3 h-3 text-amber-400" />
                  Key Theme: <span className="text-white font-semibold">{currentQuote.highlight}</span>
                </span>
              </div>

              {/* The Dynamic Quote Text */}
              <blockquote className="font-display text-xl sm:text-2xl lg:text-3xl font-semibold text-white leading-relaxed tracking-tight">
                &ldquo;{currentQuote.quote}&rdquo;
              </blockquote>

              {/* Author & Citation */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[rgba(255,255,255,0.06)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#3B82F6] to-[#06B6D4] flex items-center justify-center text-white font-display font-bold text-sm shadow-[0_0_14px_rgba(59,130,246,0.5)]">
                    {currentQuote.author.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-ui text-sm sm:text-base font-bold text-white">
                      {currentQuote.author}
                    </h4>
                    <p className="font-ui text-xs text-[var(--muted)] font-medium">
                      {currentQuote.title}
                    </p>
                  </div>
                </div>

                {/* Interactive Tools */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyQuote}
                    title="Copy Quote"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-ui font-medium text-[var(--muted)] hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 transition-all cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleRandomQuote}
                    title="Shuffle Random Quote"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-ui font-medium text-[#60A5FA] bg-[rgba(59,130,246,0.12)] hover:bg-[rgba(59,130,246,0.20)] border border-[rgba(59,130,246,0.25)] transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Shuffle</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Bottom Controls Bar: Dots + Arrows */}
          <div className="mt-8 pt-4 flex items-center justify-between border-t border-[rgba(255,255,255,0.06)]">
            {/* Indicator Dots */}
            <div className="flex items-center gap-1.5">
              {filteredQuotes.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => {
                    setIsAutoPlaying(false)
                    setCurrentIndex(idx)
                  }}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    idx === currentIndex
                      ? 'w-6 bg-[#3B82F6] shadow-[0_0_8px_rgba(59,130,246,0.8)]'
                      : 'w-1.5 bg-white/20 hover:bg-white/40'
                  }`}
                  aria-label={`Go to quote ${idx + 1}`}
                />
              ))}
            </div>

            {/* Navigation Arrows */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white transition-colors cursor-pointer"
                aria-label="Previous quote"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                className="w-8 h-8 rounded-full bg-[#3B82F6] hover:bg-[#2563EB] shadow-[0_0_12px_rgba(59,130,246,0.5)] flex items-center justify-center text-white transition-colors cursor-pointer"
                aria-label="Next quote"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
