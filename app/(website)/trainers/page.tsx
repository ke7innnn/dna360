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
  const [flippedSlug, setFlippedSlug] = useState<string | null>(null)
  const categories = ['All', 'Head Coach', 'Premium Coach', 'Elite Coach', 'Super Elite Coach']

  const filteredTrainers = activeFilter === 'All' 
    ? trainers 
    : trainers.filter(t => {
        if (activeFilter === 'Super Elite Coach') {
          return t.role === 'Super Elite Coach' || t.role === 'Head Coach';
        }
        return t.role === activeFilter;
      })

  return (
    <>
      <Navbar />
      <main className="bg-[#0a0a0a] min-h-screen pt-[105px]">
        {/* Banner Section */}
        <section
          className="relative h-[300px] lg:h-[400px] w-full flex items-center bg-cover bg-center"
          style={{ backgroundImage: 'url(/images/trainer-header-image.jpg)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent"></div>
          <div className="max-w-7xl mx-auto px-4 w-full relative z-10 flex flex-col md:flex-row justify-between items-center text-white">
            <motion.h1 
              className="text-5xl lg:text-7xl font-black font-syne uppercase tracking-tighter mb-2 md:mb-0"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              Trainers
            </motion.h1>
            <motion.p 
              className="font-outfit font-semibold text-sm lg:text-base bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Link href="/" className="hover:text-[#00c8c8] transition-colors">Home</Link> / Trainers
            </motion.p>
          </div>
        </section>

        {/* Trainers Grid Section */}
        <section
          className="relative py-20 px-4 bg-cover bg-fixed bg-center"
          style={{ backgroundImage: 'url(/images/bg-trainer.jpg)' }}
        >
          {/* Subtle Dark Overlay for background */}
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
                One More Rep, Come on!!
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
                const isFlipped = flippedSlug === trainer.slug;
                
                return (
                  <motion.div 
                    key={trainer.slug} 
                    variants={fadeUp} 
                    className={`h-[540px] perspective-1000 group ${isFlipped ? 'is-flipped' : ''}`}
                    onClick={() => setFlippedSlug(prev => prev === trainer.slug ? null : trainer.slug)}
                  >
                    <div className="relative w-full h-full transform-style-3d cursor-pointer">

                      {/* FRONT CARD */}
                      <div
                        className="absolute inset-0 w-full h-full backface-hidden flip-front overflow-hidden bg-[#151515] rounded-2xl flex flex-col border border-white/10 shadow-xl transition-all duration-300 group-hover:border-[#00c8c8]/40"
                      >
                        {/* Image Section */}
                        <div className="relative h-[340px] w-full shrink-0 bg-[#222]">
                          {trainer.imageMain ? (
                            <img
                              src={trainer.imageMain}
                              alt={trainer.name}
                              className="w-full h-full object-cover object-top rounded-t-2xl transition-transform duration-700 group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] flex flex-col items-center justify-center rounded-t-2xl border-b border-white/5 relative overflow-hidden">
                              <div className="absolute w-32 h-32 rounded-full bg-[#00c8c8]/10 blur-2xl top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                              <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-2 z-10 shadow-inner">
                                <span className="text-[#00c8c8] text-3xl font-black font-montserrat tracking-tight">
                                  {trainer.name.split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>
                              <span className="text-white/40 text-[10px] font-black font-montserrat uppercase tracking-[0.2em] z-10">DNA 360 Coach</span>
                            </div>
                          )}
                          {/* Certified Badge */}
                          <div className="absolute top-4 right-4 w-14 h-14 border-[2px] border-[#4ade80] rounded-full flex flex-col items-center justify-center -rotate-12 bg-black/40 backdrop-blur-sm shadow-xl pointer-events-none">
                            <span className="text-[#4ade80] text-[5px] font-bold tracking-widest uppercase mb-0.5">DNA 360</span>
                            <span className="text-[#4ade80] text-[8px] font-black tracking-tighter uppercase leading-none">Approved</span>
                          </div>
                        </div>

                        {/* Overlapping Pill */}
                        <div className="px-5 relative -mt-3.5">
                          <div className={`inline-flex items-center gap-1.5 ${pillColor} text-black px-3.5 py-1 rounded-full text-[10px] font-extrabold shadow-lg max-w-full tracking-wide`}>
                            <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                            </svg>
                            <span className="uppercase truncate">{trainer.role}{trainer.experience ? ` • ${trainer.experience}` : ''}</span>
                          </div>
                        </div>

                        {/* Content Section */}
                        <div className="px-5 pt-3.5 pb-4 flex flex-col flex-1 justify-between">
                          <div>
                            <h3 className="text-white font-black font-montserrat text-xl mb-1 truncate" title={trainer.name}>{trainer.name}</h3>
                            <p className="text-[#aaa] text-xs font-opensans leading-relaxed line-clamp-3">
                              {trainer.specialties && trainer.specialties.length > 0 
                                ? trainer.specialties.join(' • ') 
                                : (trainer.qualifications && trainer.qualifications.length > 0 
                                  ? trainer.qualifications.join(' • ') 
                                  : '')}
                            </p>
                          </div>

                          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
                            <span className="text-white/40 font-montserrat uppercase tracking-wider text-[9px] font-bold">DNA 360</span>
                            <span className="text-[#00c8c8] font-montserrat font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                              Hover for Details ↻
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* BACK CARD */}
                      <div
                        className="absolute inset-0 w-full h-full backface-hidden flip-back overflow-hidden rounded-2xl"
                      >
                        {trainer.imageMain ? (
                          <img
                            src={trainer.imageMain}
                            alt={trainer.name}
                            className="w-full h-full object-cover object-top filter brightness-[0.6]"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#151515]" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/85 to-black/75 backdrop-blur-[2px] flex flex-col items-center justify-between p-7 text-center border-2 border-[#00c8c8] rounded-2xl shadow-[0_0_35px_rgba(0,200,200,0.25)]">
                          {/* Top Coach Info */}
                          <div className="flex flex-col items-center w-full">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00c8c8]/15 border border-[#00c8c8]/30 text-[#00c8c8] text-[10px] font-bold uppercase tracking-wider mb-3">
                              <span>DNA 360 Certified</span>
                            </div>
                            <h3 className="text-white font-black font-montserrat uppercase text-xl leading-tight mb-1">{trainer.name}</h3>
                            <h4 className="text-[#00c8c8] font-montserrat font-bold text-xs uppercase tracking-widest">{trainer.role}</h4>
                          </div>

                          {/* Specialties / Highlights */}
                          <div className="my-auto py-2 w-full">
                            {trainer.qualifications && trainer.qualifications.length > 0 && (
                              <div className="text-white/80 text-xs font-montserrat mb-3 flex items-center justify-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#00c8c8]" />
                                <span className="font-semibold text-white">{trainer.qualifications.length} Verified Qualifications</span>
                              </div>
                            )}
                            <div className="flex flex-wrap justify-center gap-1.5 max-h-[110px] overflow-hidden">
                              {(trainer.specialties && trainer.specialties.length > 0 ? trainer.specialties : trainer.qualifications)
                                .slice(0, 3)
                                .map((item, idx) => (
                                  <span
                                    key={idx}
                                    className="text-[10px] font-medium font-opensans bg-white/10 text-white/90 px-2.5 py-1 rounded-md border border-white/10"
                                  >
                                    {item}
                                  </span>
                                ))}
                            </div>
                          </div>

                          {/* Read More Button */}
                          <div className="w-full flex flex-col items-center gap-2">
                            <Link
                              href={`/trainers/${trainer.slug}`}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full py-3.5 px-6 bg-[#00c8c8] hover:bg-white text-black font-extrabold font-montserrat text-xs uppercase tracking-widest rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(0,200,200,0.4)] flex items-center justify-center gap-2 group/btn"
                            >
                              <span>Read More</span>
                              <svg className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                              </svg>
                            </Link>
                            <span className="text-[10px] text-white/40 font-montserrat uppercase tracking-wider">Tap to view full profile</span>
                          </div>
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
