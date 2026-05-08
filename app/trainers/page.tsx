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
                <motion.div
                  key={trainer.slug}
                  variants={fadeUp}
                  className="group relative h-[380px] overflow-hidden cursor-pointer"
                >
                  {/* Photo — full color, no overlay */}
                  <img
                    src={trainer.imageMain}
                    alt={trainer.name}
                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Name bar at bottom — only on lower 30% */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/60 to-transparent pt-12 pb-5 px-4">
                    <p className="text-white font-black font-montserrat uppercase text-base text-center tracking-wide">
                      {trainer.name}
                    </p>
                    <p className="text-[#00c8c8] font-opensans text-xs uppercase tracking-widest text-center mb-3">
                      {trainer.role}
                    </p>
                    <div className="flex justify-center">
                      <Link
                        href={`/trainers/${trainer.slug}`}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[#00c8c8] text-black font-bold font-montserrat text-xs uppercase tracking-widest px-6 py-2"
                      >
                        Read More
                      </Link>
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
