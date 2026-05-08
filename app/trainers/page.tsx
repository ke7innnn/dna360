'use client'

import { motion } from 'framer-motion'
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
  return (
    <>
      <Navbar />
      <main className="bg-[#0a0a0a] min-h-screen pt-[70px]">
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
              <div className="w-14 h-1 bg-[#00c8c8] mx-auto mb-4" />
              <p className="text-[#ccc] font-opensans text-base italic">
                One More Rep, Common Common!!
              </p>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
            >
              {trainers.map((trainer) => (
                <motion.div key={trainer.slug} variants={fadeUp} className="h-[380px] perspective-1000 group">
                  <div className="relative w-full h-full transform-style-3d">

                    {/* FRONT — full color photo, NO overlay */}
                    <div
                      className="absolute inset-0 w-full h-full backface-hidden flip-front overflow-hidden bg-[#1a1a1a]"
                    >
                      <img
                        src={trainer.imageMain}
                        alt={trainer.name}
                        className="w-full h-full object-cover object-top"
                      />
                      {/* Name label at bottom - no gradient, just text with shadow */}
                      <div className="absolute bottom-0 left-0 right-0 pb-4 px-4 text-center">
                        <p className="text-white font-black font-montserrat uppercase text-base tracking-wide drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">{trainer.name}</p>
                        <p className="text-[#00c8c8] font-opensans text-xs uppercase tracking-widest drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">{trainer.role}</p>
                      </div>
                    </div>

                    {/* BACK — dark overlay with info + link */}
                    <div
                      className="absolute inset-0 w-full h-full backface-hidden flip-back overflow-hidden"
                    >
                      <img
                        src={trainer.imageMain}
                        alt={trainer.name}
                        className="w-full h-full object-cover object-top"
                      />
                      <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center border-2 border-[#00c8c8]">
                        <h3 className="text-white font-black font-montserrat uppercase text-xl mb-1">{trainer.name}</h3>
                        <h4 className="text-[#00c8c8] font-opensans font-bold text-sm uppercase tracking-wider mb-6">{trainer.role}</h4>
                        <Link
                          href={`/trainers/${trainer.slug}`}
                          className="bg-transparent border border-white text-white font-bold font-montserrat text-xs uppercase tracking-widest px-8 py-3 hover:bg-[#00c8c8] hover:border-[#00c8c8] hover:text-black transition-all duration-300"
                        >
                          Read More
                        </Link>
                      </div>
                    </div>

                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
