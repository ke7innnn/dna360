'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

const slides = [
  {
    id: 1,
    bg: '/hero-section/hero-1.jpg',
    imageClass: 'object-cover object-center scale-150 translate-y-12',
    heading: 'Be healthier.',
    subheadings: ['Be stronger.', 'Be confident.'],
    ctaLeft: { label: 'Contact Us', href: '/contact' },
    ctaRight: { label: 'Read More', href: '/about' },
  },
  {
    id: 2,
    bg: '/hero-section/hero-2.png',
    imageClass: 'object-cover object-center scale-125',
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
    <section className="relative w-full h-screen overflow-hidden" id="hero">
      {/* Slides */}
      <AnimatePresence mode="wait">
        <motion.div
          key={slides[current].id}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.9, ease: 'easeInOut' } }}
          exit={{ opacity: 0, transition: { duration: 0.6, ease: 'easeInOut' } }}
        >
          <Image
            src={slides[current].bg}
            alt={slides[current].heading}
            fill
            unoptimized
            priority
            className={slides[current].imageClass}
          />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/50" />
        </motion.div>
      </AnimatePresence>

      {/* Left side text */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`text-${current}`}
          className="absolute left-8 sm:left-16 top-[40%] -translate-y-1/2 z-10"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0, transition: { duration: 0.7, ease: 'easeOut', delay: 0.2 } }}
          exit={{ opacity: 0, x: -20, transition: { duration: 0.3 } }}
        >
          <div className="text-white font-black font-syne text-3xl sm:text-4xl lg:text-5xl leading-[1.1] uppercase tracking-tighter">
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
        </motion.div>
      </AnimatePresence>

      {/* Bottom buttons — left and right */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`btns-${current}`}
          className="absolute bottom-10 left-0 right-0 z-10 flex items-end justify-between px-8 sm:px-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut', delay: 0.4 } }}
          exit={{ opacity: 0 }}
        >
          <Link
            href={slides[current].ctaLeft.href}
            id={`hero-cta-left-${current}`}
            className="inline-block bg-[#00c8c8] text-black px-8 py-4 text-sm font-bold uppercase tracking-widest font-outfit hover:bg-white transition-all duration-300 rounded-sm"
          >
            {slides[current].ctaLeft.label}
          </Link>

          <div className="flex items-center gap-4">
            {/* Dot indicators */}
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
                className={`transition-all duration-300 rounded-sm ${
                  index === current
                    ? 'bg-[#00c8c8] w-7 h-2.5'
                    : 'bg-white/50 w-2.5 h-2.5 rounded-full'
                }`}
              />
            ))}
          </div>

          <Link
            href={slides[current].ctaRight.href}
            id={`hero-cta-right-${current}`}
            className="inline-block bg-transparent text-white border border-white px-8 py-4 text-sm font-semibold uppercase tracking-widest font-outfit hover:bg-[#00c8c8] hover:border-[#00c8c8] hover:text-black transition-all duration-300 rounded-sm"
          >
            {slides[current].ctaRight.label}
          </Link>
        </motion.div>
      </AnimatePresence>
    </section>
  )
}
