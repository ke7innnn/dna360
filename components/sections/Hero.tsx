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

      {/* Subtle dark overlay */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Bottom buttons — left and right */}
      <div className="absolute bottom-10 left-0 right-0 z-10 flex items-end justify-between px-8 sm:px-16">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
        >
          <Link
            href="/contact"
            id="hero-cta-contact"
            className="inline-block bg-[#00c8c8] text-black px-8 py-4 text-sm font-bold uppercase tracking-widest font-montserrat hover:bg-white transition-all duration-300"
          >
            Contact Us
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
        >
          <Link
            href="/about"
            id="hero-cta-about"
            className="inline-block bg-transparent text-white border border-white px-8 py-4 text-sm font-semibold uppercase tracking-widest font-montserrat hover:bg-[#00c8c8] hover:border-[#00c8c8] hover:text-black transition-all duration-300"
          >
            Read More
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
