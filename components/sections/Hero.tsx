'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

const slides = [
  {
    id: 1,
    bg: '/hero-section/hero-1.jpg',
    imageClass: 'object-cover object-[center_top] lg:object-center scale-110 lg:scale-150 lg:translate-y-12',
    badge: '⚡ PREMIUM INTEGRATED WELLNESS STUDIO',
    heading: 'Be healthier.',
    subheadings: ['Be stronger.', 'Be confident.'],
    ctaLeft: { label: 'Contact Us', href: '/contact' },
    ctaRight: { label: 'Read More', href: '/about' },
  },
  {
    id: 2,
    bg: '/hero-section/hero-2.png',
    imageClass: 'object-cover object-[center_top] lg:object-center scale-105 lg:scale-125',
    badge: '💪 POWAI\'S LARGEST FITNESS ARENA',
    heading: 'Train Hard.',
    subheadings: ['Stay Focused.', 'Achieve More.'],
    ctaLeft: { label: 'Our Services', href: '/services' },
    ctaRight: { label: 'Meet Our Trainers', href: '/trainers' },
  },
]

export default function Hero() {
  const [current, setCurrent] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length)
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
    <section className="relative w-full h-[85dvh] sm:h-[80vh] lg:h-screen min-h-[580px] lg:min-h-screen overflow-hidden" id="hero">
      {/* Slides */}
      <AnimatePresence mode="wait">
        <motion.div
          key={slides[current].id}
          className="absolute inset-0 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.9, ease: 'easeInOut' } }}
          exit={{ opacity: 0, transition: { duration: 0.6, ease: 'easeInOut' } }}
        >
          <motion.div 
            className="absolute inset-0"
            initial={{ scale: 1.15 }}
            animate={{ scale: 1 }}
            transition={{ duration: 6, ease: 'easeOut' }}
          >
            <Image
              src={slides[current].bg}
              alt={slides[current].heading}
              fill
              unoptimized
              priority
              className={slides[current].imageClass}
            />
          </motion.div>
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/55" />
        </motion.div>
      </AnimatePresence>

      {/* Content Container (Unified text & buttons to prevent overlapping) */}
      <div className="absolute inset-0 z-10 flex flex-col justify-end pb-20 pt-[115px] px-6 sm:px-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${current}`}
            className="flex flex-col items-start w-full"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut', delay: 0.1 } }}
            exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}
          >

            {/* Typography */}
            <div className="text-white font-black font-syne text-[30px] xs:text-[35px] sm:text-5xl lg:text-7xl leading-[1.05] uppercase tracking-tighter drop-shadow-md mb-8 sm:mb-10 w-full">
              {/* Slide 1 Logic: Be [Color] */}
              {current === 0 ? (
                <p>
                  Be <span className="text-[#00c8c8]">healthier.</span>
                </p>
              ) : (
                <p>
                  <span className="text-[#00c8c8]">Train</span> Hard.
                </p>
              )}

              {slides[current].subheadings.map((line, i) => (
                <p key={i}>
                  {current === 0 ? (
                    <>
                      Be <span className="text-[#00c8c8]">{line.replace('Be ', '')}</span>
                    </>
                  ) : (
                    line
                  )}
                </p>
              ))}
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 items-center w-full sm:w-auto">
              <Link
                href={slides[current].ctaLeft.href}
                id={`hero-cta-left-${current}`}
                className="w-full sm:w-auto text-center bg-[#00c8c8] text-black px-8 py-4 text-sm font-bold uppercase tracking-widest font-outfit hover:bg-white hover:scale-105 active:scale-95 transition-all duration-300 rounded-sm shadow-lg shadow-[#00c8c8]/25"
              >
                {slides[current].ctaLeft.label}
              </Link>

              <Link
                href={slides[current].ctaRight.href}
                id={`hero-cta-right-${current}`}
                className="w-full sm:w-auto text-center bg-transparent text-white border border-white/80 px-8 py-4 text-sm font-semibold uppercase tracking-widest font-outfit hover:bg-[#00c8c8] hover:border-[#00c8c8] hover:text-black hover:scale-105 active:scale-95 transition-all duration-300 rounded-sm backdrop-blur-sm"
              >
                {slides[current].ctaRight.label}
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Slide Indicators - Centered at very bottom of viewport on mobile, bottom right on desktop */}
      <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center gap-2.5 sm:bottom-14 sm:left-auto sm:right-16 sm:justify-end">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
            className={`transition-all duration-300 rounded-full ${
              index === current
                ? 'bg-[#00c8c8] w-8 h-2 rounded-sm'
                : 'bg-white/40 w-2 h-2 hover:bg-white'
            }`}
          />
        ))}
      </div>
    </section>
  )
}
