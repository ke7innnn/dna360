'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import Footer from '@/components/sections/Footer'

const offerings = [
  {
    title: 'The best of internationally acclaimed fitness equipment',
    description: 'Calibrated cardio and spinning from LifeFitness (USA), optimum flexibility and conditioning from Merrithew Pilates (Canada) and patented performance strength from Hammer Strength (USA).',
    image: '/images/about-acclaimed-trainers.jpg'
  },
  {
    title: 'On-floor DJ with JBL Harman designed sound',
    description: 'Workout to the eclectic and vitalising beats by DNA 360’s on-floor DJ accompanied with high fidelity JBL Harman designed sound.',
    image: '/images/about-dj.jpg'
  },
  {
    title: 'Cafe DNA by DNA 360',
    description: 'Tantalise your taste buds with a sumptuous menu curated by our chefs fulfilling your nutritional requirements without compromising on taste.',
    image: '/images/about-dna-cafe.jpg'
  },
  {
    title: 'Ice Bath',
    description: 'Speed up your muscle recovery and rejuvenate like top athletes in the ice bath after a high intensity workout.',
    image: '/images/about-Ice-bath.jpg'
  },
  {
    title: 'Steam Shower',
    description: 'Relax and rejuvenate with DNA 360’s steam shower. Let your skin breathe through every pore.',
    image: '/images/about-steam-shower.jpg'
  },
  {
    title: 'Spa',
    description: 'Revitalise with deep tissue and specialty massages from DNA 360’s professional massage therapists trained in the art of healing and relaxation.',
    image: '/images/about-spa.jpg'
  },
  {
    title: 'Hitachi purified air',
    description: 'Recharge your senses with every breath that you take within DNA 360’s centres, purified by DNA 360’s 70 ton Hitachi fresh air conditioning system. It uses scroll compressors and mesh filtration to deliver excellent air quality at 20 micron.',
    image: '/images/about-hitachi.jpg'
  }
]

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="bg-[#151515] min-h-screen pt-[105px]">
        {/* Banner Section */}
        <section
          className="relative h-[300px] lg:h-[400px] w-full flex items-center bg-cover bg-center"
          style={{ backgroundImage: 'url(/images/header-image.jpg)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
          <div className="max-w-7xl mx-auto px-4 w-full relative z-10 flex flex-col md:flex-row justify-between items-center text-white">
            <motion.h1 
              className="text-5xl lg:text-7xl font-black font-syne uppercase tracking-tighter mb-2 md:mb-0"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              ABOUT
            </motion.h1>
            <motion.p 
              className="font-outfit font-semibold text-sm lg:text-base bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Link href="/" className="hover:text-[#00c8c8] transition-colors">Home</Link> / About
            </motion.p>
          </div>
        </section>

        {/* About DNA 360 Fitness Section */}
        <section className="py-24 px-4 bg-[#1a1a1a]">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
              
              {/* Left Column: Overlapping Images */}
              <motion.div 
                className="relative h-[450px] sm:h-[550px] w-full"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                {/* Yellow Square Outline Graphic */}
                <div className="absolute top-10 right-0 lg:-right-10 w-64 h-64 border-4 border-[#ffb400] z-0 opacity-80 hidden md:block"></div>
                
                {/* Image 1 (Top Left) */}
                <div className="absolute top-0 left-0 w-[80%] h-[60%] z-10 shadow-xl">
                  <Image
                    src="/images/about-top-1.jpg"
                    alt="About DNA 360 Gym"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>

                {/* Image 2 (Bottom Right) */}
                <div className="absolute bottom-0 right-0 w-[65%] h-[60%] z-20 shadow-2xl border-4 border-[#1a1a1a]">
                  <Image
                    src="/images/about-top-2.jpg"
                    alt="About DNA 360 Facilities"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
              </motion.div>

              {/* Right Column: Text Content */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <h2 className="text-4xl lg:text-5xl font-black font-montserrat text-white mb-2">
                  About <span className="text-[#00c8c8]">DNA 360 Fitness</span>
                </h2>
                <div className="w-16 h-1 bg-[#00c8c8] mb-8"></div>

                <div className="space-y-6 text-[#cccccc] font-opensans text-[15px] leading-relaxed">
                  <p>
                    At DNA 360 we believe that fitness is a way of life. Fitness is more than a meal plan or a workout schedule- more than the sum of its seeming parts. DNA 360 core philosophy values holistic wellbeing of your mind, body and soul. Such deep seated balance empowers you to do more everyday and become the best version of yourself. DNA 360 purpose is to help you achieve it.
                  </p>
                  <p>
                    DNA 360 renowned trainers handhold you while leveraging your individual strengths to help you achieve your goal. Get access to world class machinery in an ergonomically designed wellness space, offering a touch of elegance. Choose from a variety of classes and train under the watchful guidance of DNA 360&apos;s experienced trainers. Uncover your hidden potential and watch your targets materialize, week after week.
                  </p>
                  
                  <div className="pt-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[#00c8c8]">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                      </span>
                      <a href="tel:+919324462384" className="text-[#00c8c8] hover:text-white transition-colors">+91 93244 62384</a>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                      </span>
                      <a href="mailto:dna360fitness@gmail.com" className="text-[#00c8c8] hover:text-white transition-colors">dna360fitness@gmail.com</a>
                    </div>
                  </div>
                </div>

              </motion.div>
            </div>
          </div>
        </section>

        {/* Offerings Grid Section */}
        <section className="py-24 px-4 bg-[#151515]">
          <div className="max-w-7xl mx-auto">
            <motion.div
              className="text-center mb-16"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <h2 className="text-3xl lg:text-4xl font-black font-montserrat text-white mb-6 max-w-4xl mx-auto leading-snug">
                For fitness - and may we call it <span className="text-[#00c8c8]">wellness,</span> you can simply count on us, <span className="text-[#00c8c8]">blindfolded</span>. Because we offer:
              </h2>
              <div className="w-16 h-1 bg-[#00c8c8] mx-auto"></div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
              {offerings.map((offering, idx) => (
                <motion.div
                  key={idx}
                  className="relative group"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                >
                  {/* Decorative Yellow Corner offset to top-left */}
                  <div className="absolute -top-4 -left-4 w-20 h-20 border-t-4 border-l-4 border-[#ffb400] z-0"></div>
                  
                  {/* Image */}
                  <div className="relative w-full h-[250px] mb-6 overflow-hidden z-10">
                    <Image
                      src={offering.image}
                      alt={offering.title}
                      fill
                      unoptimized
                      className="object-cover transform group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* Text Content */}
                  <div className="relative z-10 px-2">
                    <h3 className="text-[#00c8c8] font-black font-montserrat text-xl mb-3 leading-tight">
                      {offering.title}
                    </h3>
                    <p className="text-[#cccccc] font-opensans text-[15px] leading-relaxed">
                      {offering.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
