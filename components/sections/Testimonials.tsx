'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

const testimonials = [
  {
    id: 1,
    name: 'Siddhanth Suryavanshi',
    img: '/images/testimonials-siddhaanth.png',
    quote:
      '"DNA 360 is not just a fitness center, it\'s a complete experience. I\'ve trained in various gyms over the last 28 years and I can confidently bet that DNA 360 is one of the finest in India. The amount of personalised plans & attention given to members is one of its kinds. It\'s super spacious, which is a rarity in Mumbai & also filled with top of the line equipments. Definitely worth every penny invested."',
  },
  {
    id: 2,
    name: 'Sumona Chakravarti',
    img: '/images/sumona-chakravarti.png',
    quote:
      '"Hi, I\'m at Powai\'s largest fitness studio, DNA 360 and of course it has your largest reformer Pilates studio. It\'s extremely well-equipped with latest equipment from across the world – Life Fitness, Hammer Strength, Merrithew Pilates. It also has a meditation room & ice bath so it kind of caters to all your fitness lifestyle requirements."',
  },
  {
    id: 3,
    name: 'Rohit Shetty',
    img: '/images/rohit-shetty.png',
    quote:
      '"Hi, this is Rohit Shetty and I would like to share my personal experience at Mumbai\'s best integrated fitness centre. The fitness centre is equipped with amazing cardio setup and strength training machines all from Life Fitness & Hammer Strength. They also have a special studio for reformer Pilates and a pretty huge group activity studio."',
  },
  {
    id: 4,
    name: 'Surbhi Chandna',
    img: '/images/surbhi-chandna.png',
    quote:
      '"Hi, I\'m Surbhi Chandna and I\'m at Mumbai\'s one of the largest pilates studio and my personal favourite gym, DNA 360 at Hiranandani Powai. This beastly 13,000 sqft facility is equipped with best-in-bio-mechanics Merrithew Pilates to Life Fitness and Hammer Strength. DNA 360 is your go-to fitness centre!"',
  },
]

const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 80 : -80 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -80 : 80, transition: { duration: 0.35 } }),
}

export default function Testimonials() {
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(1)
  const [isAuto, setIsAuto] = useState(true)

  const goNext = useCallback(() => {
    setDirection(1)
    setCurrent((prev) => (prev + 1) % testimonials.length)
  }, [])

  const goPrev = useCallback(() => {
    setDirection(-1)
    setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }, [])

  useEffect(() => {
    if (!isAuto) return
    const timer = setInterval(goNext, 6000)
    return () => clearInterval(timer)
  }, [goNext, isAuto])

  const handleNav = (fn: () => void) => {
    fn()
    setIsAuto(false)
    setTimeout(() => setIsAuto(true), 10000)
  }

  return (
    <section id="testimonials" className="bg-[#0d0d0d] py-20 px-4 relative overflow-hidden">
      {/* Red accent top line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#00c8c8]" />

      {/* Heading */}
      <motion.div
        className="text-center mb-14"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-4xl lg:text-5xl font-black font-montserrat text-white mb-4">
          What Our <span className="text-[#00c8c8]">Members Say</span>
        </h2>
        <div className="w-14 h-1 bg-[#00c8c8] mx-auto" />
      </motion.div>

      {/* Testimonial Carousel */}
      <div className="max-w-3xl mx-auto relative min-h-[320px] flex flex-col items-center justify-center">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="flex flex-col items-center text-center px-4"
          >
            {/* Avatar */}
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-[#00c8c8] mb-6 shrink-0">
              <Image
                src={testimonials[current].img}
                alt={testimonials[current].name}
                fill
                unoptimized
                className="object-cover object-top"
              />
            </div>
            {/* Quote */}
            <p className="text-[#ccc] font-opensans text-sm md:text-base leading-relaxed italic mb-6 max-w-2xl">
              {testimonials[current].quote}
            </p>
            {/* Name */}
            <p className="text-white font-black font-montserrat uppercase tracking-widest text-sm">
              — {testimonials[current].name}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-6 mt-10">
        <button
          id="testimonial-prev"
          onClick={() => handleNav(goPrev)}
          className="w-10 h-10 rounded-full border border-[#00c8c8] flex items-center justify-center text-[#00c8c8] hover:bg-[#00c8c8] hover:text-black transition-all duration-300"
          aria-label="Previous testimonial"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        {/* Dots */}
        <div className="flex gap-2 items-center">
          {testimonials.map((_, i) => (
            <button
              key={i}
              id={`testimonial-dot-${i}`}
              onClick={() => {
                setDirection(i > current ? 1 : -1)
                setCurrent(i)
                setIsAuto(false)
                setTimeout(() => setIsAuto(true), 10000)
              }}
              aria-label={`Testimonial ${i + 1}`}
              className={`transition-all duration-300 rounded-sm ${
                i === current
                  ? 'bg-[#00c8c8] w-6 h-2'
                  : 'bg-white/30 w-2 h-2 rounded-full'
              }`}
            />
          ))}
        </div>
        <button
          id="testimonial-next"
          onClick={() => handleNav(goNext)}
          className="w-10 h-10 rounded-full border border-[#00c8c8] flex items-center justify-center text-[#00c8c8] hover:bg-[#00c8c8] hover:text-black transition-all duration-300"
          aria-label="Next testimonial"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </section>
  )
}
