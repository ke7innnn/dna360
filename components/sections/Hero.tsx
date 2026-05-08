'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

const slides = [
  {
    id: 1,
    heading: 'Meditation',
    headingAccent: 'Room',
    ctaLabel: 'Read More',
    ctaHref: '/about',
    bg: '/images/home2-about.jpg',
  },
  {
    id: 2,
    heading: 'Book Your',
    headingAccent: 'Trial Pass',
    ctaLabel: 'Contact Us',
    ctaHref: '/contact',
    bg: '/images/home2-about-2.jpg',
  },
]

const slideVariants = {
  enter: { opacity: 0 },
  center: { opacity: 1, transition: { duration: 0.8, ease: 'easeInOut' } },
  exit: { opacity: 0, transition: { duration: 0.6, ease: 'easeInOut' } },
}

const headingVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut', delay: 0.3 },
  },
}

const ctaVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut', delay: 0.6 },
  },
}

export default function Hero() {
  const [current, setCurrent] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length)
  }, [])

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length)
  }, [])

  useEffect(() => {
    if (!isAutoPlaying) return
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [next, isAutoPlaying])

  const goToSlide = (index: number) => {
    setCurrent(index)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 8000)
  }

  return (
    <section className="relative w-full h-screen overflow-hidden" id="hero">
      {/* Slides */}
      <AnimatePresence mode="wait">
        <motion.div
          key={slides[current].id}
          className="absolute inset-0"
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
        >
          {/* Background Image */}
          <Image
            src={slides[current].bg}
            alt={slides[current].heading}
            fill
            unoptimized
            className="object-cover object-center"
            priority
          />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={`heading-${current}`}
            variants={headingVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}
            className="mb-8"
          >
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight font-montserrat leading-none">
              <span className="text-white">{slides[current].heading} </span>
              <span className="text-[#00c8c8]">{slides[current].headingAccent}</span>
            </h1>
          </motion.div>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={`cta-${current}`}
            variants={ctaVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0 }}
          >
            <Link
              href={slides[current].ctaHref}
              id={`hero-cta-${current}`}
              className="inline-block bg-[rgba(30,30,30,0.85)] text-white border border-white/30 px-10 py-4 text-base font-semibold uppercase tracking-widest font-montserrat hover:bg-[#00c8c8] hover:border-[#00c8c8] hover:text-black transition-all duration-300"
            >
              {slides[current].ctaLabel}
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation arrows + pagination - bottom center */}
      <div className="absolute bottom-10 left-0 right-0 z-20 flex items-center justify-center gap-6">
        {/* Prev arrow */}
        <button
          id="hero-prev"
          onClick={() => { prev(); setIsAutoPlaying(false); setTimeout(() => setIsAutoPlaying(true), 8000) }}
          className="text-[#00c8c8] hover:text-white transition-colors"
          aria-label="Previous slide"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Dot indicators */}
        <div className="flex items-center gap-3">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              id={`hero-dot-${index}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`transition-all duration-300 rounded-sm ${
                index === current
                  ? 'bg-[#00c8c8] w-7 h-2.5'
                  : 'bg-white/40 w-2.5 h-2.5 rounded-full'
              }`}
            />
          ))}
        </div>

        {/* Next arrow */}
        <button
          id="hero-next"
          onClick={() => { next(); setIsAutoPlaying(false); setTimeout(() => setIsAutoPlaying(true), 8000) }}
          className="text-[#00c8c8] hover:text-white transition-colors"
          aria-label="Next slide"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </section>
  )
}
