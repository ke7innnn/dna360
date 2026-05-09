'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

export default function Hero() {
  return (
    <section className="relative w-full h-screen overflow-hidden" id="hero">
      {/* Static Hero Background Image */}
      <Image
        src="/images/hero-banner.jpg"
        alt="DNA 360 Fitness Centre"
        fill
        unoptimized
        priority
        className="object-cover object-center"
      />

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="mb-8"
        >
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight font-montserrat leading-none">
            <span className="text-white">DNA </span>
            <span className="text-[#00c8c8]">360</span>
          </h1>
          <p className="text-white/80 font-montserrat text-lg sm:text-xl mt-4 tracking-widest uppercase">
            Best Gym in Powai, Mumbai
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.4 }}
          className="flex gap-4 flex-wrap justify-center"
        >
          <Link
            href="/contact"
            id="hero-cta-contact"
            className="inline-block bg-[#00c8c8] text-black px-10 py-4 text-base font-bold uppercase tracking-widest font-montserrat hover:bg-white transition-all duration-300"
          >
            Contact Us
          </Link>
          <Link
            href="/about"
            id="hero-cta-about"
            className="inline-block bg-transparent text-white border border-white/60 px-10 py-4 text-base font-semibold uppercase tracking-widest font-montserrat hover:bg-[#00c8c8] hover:border-[#00c8c8] hover:text-black transition-all duration-300"
          >
            Read More
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
