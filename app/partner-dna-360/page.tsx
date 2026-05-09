'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import Footer from '@/components/sections/Footer'

const leftServices = [
  'Market And Customer Preferences Study',
  'Space Planning, Architectural And Design Services',
  'Integrated MEP, HVAC And Fire-Fighting Services',
  'Equipment Selection And Procurement',
  'Set Up And Operations Of Cafe DNA',
  'Operational SOPs, Software And Process Implementation',
  'In House Sales And Pricing Support'
]

const rightServices = [
  'Branding, Website Creation, Hosting And Support',
  'Digital And Social Media Marketing Including SEM And SEO Support',
  'Performance Measurement And Quality Assurance Audits',
  'Owner MIS Including Sales And Performance Dashboards',
  'Staff Recruitment And Training',
  'Local Area Sales Activation To Drive Visibility And Footfalls'
]

const beforeImages = [
  '/images/franchise/before-drawings-01.jpg',
  '/images/franchise/before-drawings-02.jpg',
  '/images/franchise/before-drawings-03.jpg',
  '/images/franchise/before-drawings-04.jpg',
  '/images/franchise/before-drawings-05.jpg'
]

const afterImages = [
  '/images/franchise/after-drawings-01.jpg',
  '/images/franchise/after-drawings-02.jpg',
  '/images/franchise/after-drawings-03.jpg',
  '/images/franchise/after-drawings-04.jpg'
]

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
}

const testimonials = [
  {
    name: 'Siddhanth Suryavanshi',
    text: '“DNA 360 is not just a fitness center. its a complete experience. I’ve trained in various gyms over the last 28 years and i can confidently bet that DNA 360 is one of the finest in India. The amount of personalised plans \u0026 attention given to members is one of its kinds. its Super spacious, which is a rarity in mumbai \u0026 also filled with top of the line equipments. Definitely worth every penny invested.”',
    image: '/images/testimonials-siddhaanth.png'
  },
  {
    name: 'Sumona Chakravarti',
    text: '“Hi, I’m at Powai’s largest fitness studio, DNA 360 and of course it has your largest reformer Pilates studio. It’s extremely well – equipped with latest equipment from across the world - Life Fitness, Hammer Strength, Merrithew Pilates. It also has a meditation room \u0026 ice bath so it kind of caters to all your fitness lifestyle requirements.”',
    image: '/images/sumona-chakravarti.png'
  },
  {
    name: 'Rohit shetty',
    text: '“Hi, this is Rohit Shetty and I would like to share my personal experience at Mumbai’s best integrated fitness centre. The fitness centre is equipped with amazing cardio set up and strength training machines all from Life Fitness \u0026 Hammer Strength and few of them are very unique and cannot be found in Mumbai. It also has a spinning studio with latest version Life Fitness IC5 bikes with virtual image function. They also have a special studio for reformer Pilates which is an advanced form of Pilates and it also a pretty huge group activity studio.”',
    image: '/images/rohit-shetty.png'
  },
  {
    name: 'Surbhi Chandna',
    text: '“Hi, I\'m surbhi chandna and I\'m at Mumbai\'s one of the largest pilates studio and my personal favourite gym, DNA 360 at hiranandani powai. You know this beastly 13,000 sft facility is eqquiped with best in bio-mechanics Merrithew Pilates to Life Fitness and Hammer Strength. Ask me what I love the most, it\'s pilates you know it strengthens my core, tones my body and it also works on the tiniest of the muscles. If you really want to enjoy nice healthy regimen, then DNA 360 is your to fitness centre. They have some amazing facilities they have the ice bath, meditation centre also when have those cravings you can have tasty bites at their healthy cafe. So checkin at DNA 360 and book your session right away.”',
    image: '/images/surbhi-chandna.png'
  }
]

export default function PartnerDNA360Page() {
  return (
    <>
      <Navbar />
      <main className="bg-[#151515] min-h-screen pt-[105px]">
        {/* Banner Section */}
        <section
          className="relative h-[250px] lg:h-[300px] w-full flex items-center bg-cover bg-center"
          style={{ backgroundImage: 'url(/images/header-image.jpg)' }}
        >
          <div className="absolute inset-0 bg-black/60"></div>
          <div className="max-w-7xl mx-auto px-4 w-full relative z-10 flex flex-col md:flex-row justify-between items-center text-white">
            <h1 className="text-4xl lg:text-5xl font-black font-montserrat uppercase tracking-wider mb-2 md:mb-0">
              PARTNER DNA 360
            </h1>
            <p className="font-montserrat font-semibold text-sm lg:text-base">
              <Link href="/" className="hover:text-[#00c8c8] transition-colors">Home</Link> / Partner DNA 360
            </p>
          </div>
        </section>

        {/* Intro Section */}
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
                    src="/images/franchise-top-1.jpg"
                    alt="Partner DNA 360 Front Desk"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>

                {/* Image 2 (Bottom Right) */}
                <div className="absolute bottom-0 right-0 w-[65%] h-[60%] z-20 shadow-2xl border-4 border-[#1a1a1a]">
                  <Image
                    src="/images/franchise-top-2.jpg"
                    alt="Partner DNA 360 Gym Area"
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
                <h2 className="text-3xl lg:text-4xl font-black font-montserrat text-white mb-6 leading-snug">
                  Enjoy a <span className="text-[#00c8c8]">reputable, high quality, profitable fitness center franchise pan India</span>
                </h2>
                <div className="w-16 h-1 bg-[#00c8c8] mb-8"></div>

                <p className="text-white font-opensans text-[15px] mb-6">
                  Are you an asset owner or developer looking at:
                </p>

                <ul className="space-y-4 mb-10">
                  <li className="flex items-start text-white font-opensans text-[15px]">
                    <span className="text-[#00c8c8] mr-3 font-bold mt-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                    </span>
                    Enjoying stable yields in an alternate asset class
                  </li>
                  <li className="flex items-start text-white font-opensans text-[15px]">
                    <span className="text-[#00c8c8] mr-3 font-bold mt-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                    </span>
                    Providing a benchmark fitness facility in your development
                  </li>
                  <li className="flex items-start text-white font-opensans text-[15px]">
                    <span className="text-[#00c8c8] mr-3 font-bold mt-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                    </span>
                    Operating an upscale, high quality fitness center
                  </li>
                  <li className="flex items-start text-white font-opensans text-[15px]">
                    <span className="text-[#00c8c8] mr-3 font-bold mt-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                    </span>
                    Converting your exiting facility to boost earnings
                  </li>
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Domain Services List Section */}
        <section className="py-24 px-4 bg-[#151515]">
          <div className="max-w-6xl mx-auto">
            <motion.div
              className="text-center mb-16"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <h2 className="text-3xl lg:text-4xl font-black font-montserrat text-white mb-6 leading-snug">
                Benefit from our <span className="text-[#00c8c8]">international access, top industry talent</span> and the following domain services:
              </h2>
              <div className="w-16 h-1 bg-[#00c8c8] mx-auto"></div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
              {/* Left Column */}
              <div className="space-y-4">
                {leftServices.map((service, index) => (
                  <motion.div 
                    key={`left-${index}`}
                    className="flex items-start"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <span className="text-[#00c8c8] mr-3 font-bold mt-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                    </span>
                    <span className="text-white font-opensans text-[15px] font-semibold">{service}</span>
                  </motion.div>
                ))}
              </div>
              
              {/* Right Column */}
              <div className="space-y-4">
                {rightServices.map((service, index) => (
                  <motion.div 
                    key={`right-${index}`}
                    className="flex items-start"
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <span className="text-[#00c8c8] mr-3 font-bold mt-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                    </span>
                    <span className="text-white font-opensans text-[15px] font-semibold">{service}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Before & After Galleries Section */}
        <section className="py-24 px-4 bg-[#1a1a1a]">
          <div className="max-w-7xl mx-auto">
            {/* Before */}
            <div className="mb-20">
              <motion.div
                className="text-center mb-12"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
              >
                <h2 className="text-4xl lg:text-5xl font-black font-montserrat text-white mb-6">Before</h2>
                <div className="w-16 h-1 bg-[#00c8c8] mx-auto"></div>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 justify-center">
                {beforeImages.slice(0, 4).map((img, idx) => (
                  <motion.div 
                    key={idx} 
                    className="relative h-[220px] w-full group overflow-hidden cursor-pointer"
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Image
                      src={img}
                      alt={`Before Image ${idx + 1}`}
                      fill
                      unoptimized
                      className="object-cover transform group-hover:scale-110 transition-transform duration-500"
                    />
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center border-4 border-[#00c8c8]">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* After */}
            <div>
              <motion.div
                className="text-center mb-12"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
              >
                <h2 className="text-4xl lg:text-5xl font-black font-montserrat text-white mb-6">After</h2>
                <div className="w-16 h-1 bg-[#00c8c8] mx-auto"></div>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 justify-center">
                {afterImages.map((img, idx) => (
                  <motion.div 
                    key={idx} 
                    className="relative h-[220px] w-full group overflow-hidden cursor-pointer"
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Image
                      src={img}
                      alt={`After Image ${idx + 1}`}
                      fill
                      unoptimized
                      className="object-cover transform group-hover:scale-110 transition-transform duration-500"
                    />
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center border-4 border-[#00c8c8]">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Video Walkthrough Section */}
        <section className="py-24 px-4 bg-[#151515]">
          <div className="max-w-5xl mx-auto">
            <motion.div
              className="text-center mb-16"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <h2 className="text-4xl lg:text-5xl font-black font-montserrat text-white mb-6">
                DNA 360 <span className="text-[#00c8c8]">Walk Through</span>
              </h2>
              <div className="w-16 h-1 bg-[#00c8c8] mx-auto"></div>
            </motion.div>

            <motion.div 
              className="relative w-full aspect-video shadow-2xl rounded-lg overflow-hidden border-4 border-[#1a1a1a]"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/3EU76wj0M9I" 
                title="DNA 360 Walk Through"
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              ></iframe>
            </motion.div>
          </div>
        </section>

        {/* Testimonials Slider Section */}
        <section 
          className="relative py-24 px-4 bg-cover bg-center overflow-hidden"
          style={{ backgroundImage: 'url(/images/bg-testimonials.jpg)' }}
        >
          <div className="absolute inset-0 bg-black/70"></div>
          <div className="max-w-4xl mx-auto relative z-10 text-center">
            <TestimonialSlider />
          </div>
        </section>

        {/* Space Required Section */}
        <section className="py-24 px-4 bg-[#1a1a1a]">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              className="mb-16"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <h2 className="text-4xl lg:text-5xl font-black font-montserrat text-white mb-6 uppercase tracking-wider">
                Space <span className="text-[#00c8c8]">Required</span>
              </h2>
              <div className="w-16 h-1 bg-[#00c8c8] mx-auto"></div>
            </motion.div>

            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 mb-20">
              <div className="text-center">
                <span className="text-5xl md:text-7xl font-black font-montserrat text-[#00c8c8] block mb-2">6000</span>
                <span className="text-white font-montserrat font-bold text-lg uppercase tracking-wider">Sq. Ft. Carpet</span>
              </div>
              <div className="hidden md:block text-5xl font-black text-white">-</div>
              <div className="text-center">
                <span className="text-5xl md:text-7xl font-black font-montserrat text-[#00c8c8] block mb-2">9329</span>
                <span className="text-white font-montserrat font-bold text-lg uppercase tracking-wider">Sq. Ft. Carpet</span>
              </div>
            </div>

            <div className="max-w-3xl mx-auto">
              <p className="text-white font-montserrat font-bold text-xl lg:text-2xl mb-12 leading-relaxed italic">
                Get in touch with us and discover how we con support you in operating an admired and profitable Fitness Center franchise.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link 
                  href="/contact"
                  className="w-full sm:w-auto px-10 py-4 bg-[#00c8c8] hover:bg-[#00b4b4] text-white font-black font-montserrat uppercase tracking-widest transition-colors duration-300 rounded-sm"
                >
                  Contact Us
                </Link>
                <a
                  href="/DNA-360-Partnership-Deck-2021.pdf"
                  download="DNA-360-Partnership-Deck-2021.pdf"
                  className="w-full sm:w-auto px-10 py-4 border-2 border-[#00c8c8] text-white hover:bg-[#00c8c8] hover:text-black font-black font-montserrat uppercase tracking-widest transition-all duration-300 rounded-sm text-center"
                >
                  Download Partnership Deck
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

function TestimonialSlider() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="relative h-[450px] md:h-[400px] flex flex-col items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center"
        >
          <p className="text-white text-lg md:text-xl font-opensans leading-relaxed mb-10 italic max-w-3xl">
            {testimonials[current].text}
          </p>
          <div className="relative w-24 h-24 rounded-full border-4 border-[#00c8c8] overflow-hidden mb-6">
            <Image
              src={testimonials[current].image}
              alt={testimonials[current].name}
              fill
              unoptimized
              className="object-cover"
            />
          </div>
          <h3 className="text-[#00c8c8] font-black font-montserrat text-xl uppercase tracking-widest">
            {testimonials[current].name}
          </h3>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center gap-3 mt-12">
        {testimonials.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              idx === current ? 'bg-[#00c8c8] w-8' : 'bg-white/40'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
