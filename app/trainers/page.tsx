'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/sections/Footer'
import { trainers } from '@/data/trainers'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

export default function TrainersPage() {
  const [activeFilter, setActiveFilter] = useState('All')
  const categories = ['All', 'Head Coach', 'Premium Coach', 'Elite Coach', 'Super Elite Coach']

  const filteredTrainers = activeFilter === 'All' 
    ? trainers 
    : trainers.filter(t => t.role === activeFilter)

  return (
    <>
      <Navbar />
      <main className="bg-[#0a0a0a] min-h-screen pt-[105px]">
        {/* Banner Section */}
        <section
          className="relative h-[250px] lg:h-[300px] w-full flex items-center bg-cover bg-center"
          style={{ backgroundImage: 'url(/images/trainer-header-image.jpg)' }}
        >
          <div className="absolute inset-0 bg-black/60"></div>
          <div className="max-w-7xl mx-auto px-4 w-full relative z-10 flex flex-col md:flex-row justify-between items-center text-white">
            <h1 className="text-4xl lg:text-5xl font-black font-montserrat uppercase tracking-wider mb-2 md:mb-0">
              Trainers
            </h1>
            <p className="font-montserrat font-semibold text-sm lg:text-base">
              <Link href="/" className="hover:text-[#00c8c8] transition-colors">Home</Link> / Trainers
            </p>
          </div>
        </section>

        {/* Trainers Grid Section */}
        <section
          className="relative py-20 px-4 bg-cover bg-fixed bg-center"
          style={{ backgroundImage: 'url(/images/bg-trainer.jpg)' }}
        >
          {/* Subtle Dark Overlay for background - NOT covering cards */}
          <div className="absolute inset-0 bg-black/50 z-0"></div>

          <div className="max-w-7xl mx-auto relative z-10">
            <motion.div
              className="text-center mb-14"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <h2 className="text-4xl lg:text-5xl font-black font-montserrat mb-4">
                <span className="text-white">DNA 360 </span>
                <span className="text-[#00c8c8]">Trainers</span>
              </h2>
              <p className="text-white/60 font-montserrat font-bold uppercase tracking-[0.2em] text-sm mb-8">
                One More Rep, Common Common!!
              </p>
              
              {/* Filter Buttons */}
              <div className="flex flex-wrap justify-center gap-3 mb-12">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveFilter(cat)}
                    className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 border-2 ${
                      activeFilter === cat
                        ? 'bg-[#00c8c8] border-[#00c8c8] text-black shadow-[0_0_20px_rgba(0,200,200,0.4)]'
                        : 'bg-transparent border-white/20 text-white hover:border-[#00c8c8] hover:text-[#00c8c8]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="w-14 h-1 bg-[#00c8c8] mx-auto" />
            </motion.div>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <AnimatePresence mode="popLayout">
                {filteredTrainers.map((trainer, index) => {
                const pillColors = ['bg-[#9AE66E]', 'bg-[#F8A8B4]', 'bg-[#E5C77A]', 'bg-[#C6DD76]'];
                const pillColor = pillColors[index % pillColors.length];
                
                return (
                  <motion.div key={trainer.slug} variants={fadeUp} className="h-[500px] perspective-1000 group">
                    <div className="relative w-full h-full transform-style-3d cursor-pointer">

                      {/* FRONT — New Design */}
                      <div
                        className="absolute inset-0 w-full h-full backface-hidden flip-front overflow-hidden bg-[#151515] rounded-2xl flex flex-col border border-white/5"
                      >
                        {/* Image Section */}
                        <div className="relative h-[280px] w-full shrink-0 bg-[#222]">
                          <img
                            src={trainer.imageMain}
                            alt={trainer.name}
                            className="w-full h-full object-cover object-top rounded-t-2xl scale-110"
                          />
                          {/* Certified Badge */}
                          <div className="absolute top-4 right-4 w-14 h-14 border-[2px] border-[#4ade80] rounded-full flex flex-col items-center justify-center -rotate-12 bg-black/30 backdrop-blur-sm shadow-xl">
                            <span className="text-[#4ade80] text-[5px] font-bold tracking-widest uppercase mb-0.5">DNA 360</span>
                            <span className="text-[#4ade80] text-[8px] font-black tracking-tighter uppercase leading-none">Approved</span>
                          </div>
                        </div>

                        {/* Overlapping Pill */}
                        <div className="px-5 relative -mt-3 z-10">
                          <div className={`inline-flex items-center gap-1.5 ${pillColor} text-black px-3 py-1 rounded-full text-[10px] font-bold shadow-lg max-w-full`}>
                            <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                            </svg>
                            <span className="uppercase truncate">{trainer.role}{trainer.experience ? ` • ${trainer.experience}` : ''}</span>
                          </div>
                        </div>

                        {/* Content Section */}
                        <div className="px-5 pt-4 pb-5 flex flex-col flex-1">
                          <h3 className="text-white font-black font-montserrat text-xl mb-1 truncate" title={trainer.name}>{trainer.name}</h3>
                          <p className="text-[#aaa] text-xs font-opensans leading-relaxed line-clamp-3 mb-4">
                            {trainer.specialties && trainer.specialties.length > 0 
                              ? trainer.specialties.join(' • ') 
                              : ''}
                          </p>
                          

                        </div>
                      </div>

                      {/* BACK — Adjusted for rounded corners */}
                      <div
                        className="absolute inset-0 w-full h-full backface-hidden flip-back overflow-hidden rounded-2xl"
                      >
                        <img
                          src={trainer.imageMain}
                          alt={trainer.name}
                          className="w-full h-full object-cover object-top scale-110"
                        />
                        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center border-2 border-[#00c8c8] rounded-2xl">
                          <h3 className="text-white font-black font-montserrat uppercase text-xl mb-1">{trainer.name}</h3>
                          <h4 className="text-[#00c8c8] font-opensans font-bold text-sm uppercase tracking-wider mb-6">{trainer.role}</h4>
                          <Link
                            href={`/trainers/${trainer.slug}`}
                            className="bg-transparent border border-white text-white font-bold font-montserrat text-xs uppercase tracking-widest px-8 py-3 hover:bg-[#00c8c8] hover:border-[#00c8c8] hover:text-black transition-all duration-300 rounded-lg"
                          >
                            Read More
                          </Link>
                        </div>
                      </div>

                    </div>
                  </motion.div>
                );
              })}
              </AnimatePresence>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
