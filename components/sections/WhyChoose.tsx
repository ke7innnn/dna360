'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

const features = [
  {
    id: 'top-notch',
    title: 'Top-Notch Equipment',
    img: '/images/top-notch.jpg',
    desc: 'Train on the best equipment in use at Powai – from Merrithew Pilates to LifeFitness Spinning & Cardio and patented Hammer Strength.',
  },
  {
    id: 'hygiene',
    title: 'Hygiene & Cleanliness',
    img: '/images/hygiene-clean.jpg',
    desc: 'ISO standards, including separate rest rooms, shower and changing room for staff; only facility in Powai with such focus.',
  },
  {
    id: 'space',
    title: 'Unfettered Space',
    img: '/images/unfettered-space.jpg',
    desc: 'Enjoy the unique expanse of the 13,000 sq.ft. largest fitness facility of its kind in Mumbai with entry via 2000 sq.ft lobby and a bank of 8 lifts.',
  },
  {
    id: 'studios',
    title: 'Individual Studios',
    img: '/images/individual-studios.jpg',
    desc: 'Exclusive dedicated studios for Pilates, Spinning and other group classes.',
  },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
}

export default function WhyChoose() {
  return (
    <section id="why-choose" className="bg-[#0a0a0a] py-20 px-4">
      {/* Heading */}
      <motion.div
        className="text-center mb-14"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-4xl lg:text-5xl font-black font-montserrat mb-4">
          <span className="text-white">Why choose </span>
          <span className="text-[#00c8c8]">DNA 360</span>
        </h2>
        <div className="w-14 h-1 bg-[#00c8c8] mx-auto mb-5" />
        <p className="text-[#ccc] font-opensans text-base max-w-xl mx-auto">
          We are delighted to share the highlights of the facility.
        </p>
      </motion.div>

      {/* 2x2 Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-0 max-w-6xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
      >
        {features.map((feature) => (
          <motion.div
            key={feature.id}
            id={`why-card-${feature.id}`}
            variants={cardVariants}
            className="group flex flex-row bg-[#1e1e2e] hover:shadow-[0_0_25px_rgba(0,200,200,0.25)] transition-all duration-400 border border-transparent hover:border-[#00c8c8]/30"
          >
            {/* Image */}
            <div className="relative w-[160px] lg:w-[180px] shrink-0 overflow-hidden">
              <Image
                src={feature.img}
                alt={feature.title}
                fill
                unoptimized
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            {/* Text */}
            <div className="flex flex-col justify-center p-6 flex-1">
              <h3 className="text-white font-black uppercase tracking-wide text-base font-montserrat mb-3">
                {feature.title}
              </h3>
              <p className="text-[#aaa] font-opensans text-sm leading-relaxed">
                {feature.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
