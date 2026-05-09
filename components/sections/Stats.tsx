'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

function RotatingLogos() {
  const logos = [
    '/images/equipment-partner/logo-1.png',
    '/images/equipment-partner/logo-2.png',
    '/images/equipment-partner/logo-3.png'
  ]
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % logos.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: index === 1 ? 1.3 : 1 }}
          animate={{ opacity: 1, scale: index === 1 ? 1.3 : 1 }}
          exit={{ opacity: 0, scale: index === 1 ? 1.3 : 1 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <Image
            src={logos[index]}
            alt="Equipment Partner"
            fill
            unoptimized
            className="object-contain"
          />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

interface AnimatedCounterProps {
  target: number
  duration?: number
  suffix?: string
}

function AnimatedCounter({ target, duration = 2000, suffix = '+' }: AnimatedCounterProps) {
  const [count, setCount] = useState(0)
  const hasTriggered = useRef(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasTriggered.current) {
          hasTriggered.current = true
          const startTime = performance.now()
          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime
            const progress = Math.min(elapsed / duration, 1)
            const easedProgress = 1 - Math.pow(1 - progress, 3)
            setCount(Math.floor(easedProgress * target))
            if (progress < 1) requestAnimationFrame(animate)
          }
          requestAnimationFrame(animate)
        }
      },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target, duration])

  return (
    <span ref={ref} className="text-6xl lg:text-7xl font-black font-montserrat text-white leading-none flex items-center justify-center h-[72px]">
      {count.toLocaleString()}{suffix}
    </span>
  )
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

export default function Stats() {
  return (
    <section
      id="stats"
      className="py-20 px-4"
      style={{
        background: 'linear-gradient(135deg, #0a3d3d 0%, #005555 50%, #007070 100%)',
      }}
    >
      <motion.div
        className="text-center mb-14"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-4xl lg:text-5xl font-black font-montserrat text-white">
          Pro Human <span className="text-white">Evolution</span>
        </h2>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        {/* Stat 1 - GYM Space */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col items-center text-center"
          id="stat-gym-space"
        >
          <AnimatedCounter target={13000} duration={2500} suffix="+" />
          <p className="text-white/80 font-opensans text-base mt-3 uppercase tracking-widest">
            Sq. Ft. GYM Space
          </p>
        </motion.div>

        {/* Stat 2 - Team */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col items-center text-center"
          id="stat-team"
        >
          <AnimatedCounter target={35} duration={1800} suffix="+" />
          <p className="text-white/80 font-opensans text-base mt-3 uppercase tracking-widest">
            Professional Team
          </p>
        </motion.div>

        {/* Stat 3 - Equipment partner Rotating Logos */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col items-center text-center"
          id="stat-equipment"
        >
          <div className="relative w-full h-[72px] flex items-center justify-center">
            <div className="absolute w-[350px] md:w-[450px] h-[200px] pointer-events-none z-0">
              <RotatingLogos />
            </div>
          </div>
          <p className="text-white/80 font-opensans text-base mt-3 uppercase tracking-widest relative z-10">
            Equipment Partner
          </p>
        </motion.div>
      </motion.div>
    </section>
  )
}
