'use client'

import { useRef } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

const slideFromLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: 'easeOut' } },
}

const slideFromRight = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: 'easeOut', delay: 0.1 } },
}

export default function About() {
  const sectionRef = useRef<HTMLElement>(null)

  return (
    <section
      ref={sectionRef}
      id="about"
      className="bg-[#0a0a0a] overflow-hidden py-0"
    >
      <div className="flex flex-col lg:flex-row min-h-[500px]">
        {/* Left: Images stacked */}
        <motion.div
          className="relative lg:w-[55%] w-full flex flex-col"
          variants={slideFromLeft}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="relative w-full h-[300px] lg:h-[400px]">
            <Image
              src="/images/home2-about.jpg"
              alt="DNA 360 Gym Floor"
              fill
              unoptimized
              className="object-cover"
            />
          </div>
          <div className="relative w-full h-[200px] lg:h-[280px]">
            <Image
              src="/images/home2-about-2.jpg"
              alt="DNA 360 Treadmills"
              fill
              unoptimized
              className="object-cover"
            />
          </div>
        </motion.div>

        {/* Right: Teal border text box */}
        <motion.div
          className="lg:w-[45%] w-full flex items-center justify-center bg-[#0a0a0a] p-6 lg:p-10"
          variants={slideFromRight}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div
            className="border-2 border-[#00c8c8] bg-black/80 p-8 lg:p-12 w-full max-w-lg"
          >
            <p className="text-sm uppercase tracking-widest text-[#ccc] mb-1 font-opensans">
              Welcome To
            </p>
            <h2 className="text-3xl lg:text-4xl font-black font-montserrat mb-6 leading-tight">
              <span className="text-white">DNA 360 </span>
              <span className="text-[#00c8c8]">Fitness</span>
            </h2>
            <p className="text-[#ccc] font-opensans text-sm leading-relaxed mb-8">
              At DNA 360 we believe that fitness is a way of life. Fitness is
              more than a meal plan or a workout schedule– more than the sum of
              its seeming parts. DNA 360 core philosophy ...
            </p>
            <Link
              href="/about"
              id="about-read-more"
              className="inline-block bg-[#00c8c8] text-black font-bold uppercase tracking-widest text-sm px-8 py-3 font-montserrat hover:bg-transparent hover:text-[#00c8c8] border border-[#00c8c8] transition-all duration-300"
            >
              Read More
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
