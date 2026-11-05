'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/sections/Footer'
import { getServiceBySlug, services } from '@/data/services'

export default function ServiceDetailPage() {
  const params = useParams()
  const slug = params.slug as string
  const service = getServiceBySlug(slug)

  if (!service) {
    notFound()
  }

  const paragraphs = service.content.split('\n\n').filter(Boolean)

  return (
    <>
      <Navbar />
      <main className="bg-[#151515] min-h-screen pt-[105px]">
        {/* Banner Section */}
        <section
          className="relative h-[300px] lg:h-[350px] w-full flex items-center bg-cover bg-center"
          style={{ backgroundImage: `url(${service.bannerImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
          <div className="max-w-7xl mx-auto px-4 w-full relative z-10 flex flex-col md:flex-row justify-between items-center text-white">
            <motion.h1 
              className="text-4xl lg:text-6xl font-black font-syne uppercase tracking-tighter mb-2 md:mb-0"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              SERVICES
            </motion.h1>
            <motion.p 
              className="font-outfit font-semibold text-sm lg:text-base bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Link href="/" className="hover:text-[#00c8c8] transition-colors">Home</Link>{' '}
              /{' '}
              <Link href="/services" className="hover:text-[#00c8c8] transition-colors">Services</Link>{' '}
              / {service.title}
            </motion.p>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-24 px-4 bg-[#1a1a1a] overflow-x-clip">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
 
              {/* Left: Single Hero Image */}
              <motion.div
                className="relative h-[550px] sm:h-[750px] w-full"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                {/* Yellow corner decoration */}
                <div className="absolute -top-6 -left-6 w-48 h-48 border-4 border-[#ffb400] z-0 opacity-40 hidden md:block" />
                <div className="absolute -bottom-6 -right-6 w-48 h-48 border-4 border-[#00c8c8] z-0 opacity-40 hidden md:block" />

                {/* Main Image */}
                <div className="relative w-full h-full z-10 shadow-2xl overflow-hidden rounded-lg border border-white/10">
                  <Image
                    src={service.images && service.images.length > 1 ? service.images[1] : service.bannerImage}
                    alt={service.title}
                    fill
                    unoptimized
                    className="object-contain object-top"
                    style={{ clipPath: 'inset(0 0 10% 0)' }}
                  />
                </div>
                
                {/* Enquire Now Image (Desktop Overlay) */}
                <div className="absolute -bottom-10 left-10 hidden lg:flex justify-center z-30 drop-shadow-2xl">
                  <Link href="/contact" className="hover:scale-105 transition-all duration-300">
                    <Image
                      src="/images/enquire-now.png"
                      alt="Enquire Now"
                      width={180}
                      height={55}
                      unoptimized
                      className="object-contain"
                    />
                  </Link>
                </div>
              </motion.div>

              {/* Right: Text */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <h2 className="text-4xl lg:text-5xl font-black font-montserrat text-white mb-2">
                  {service.title.split(' ').slice(0, -1).join(' ')}{' '}
                  <span className="text-[#00c8c8]">{service.title.split(' ').slice(-1)}</span>
                </h2>
                <div className="w-16 h-1 bg-[#00c8c8] mb-8" />

                <div className="space-y-5">
                  {paragraphs.map((para, i) => (
                    <p 
                      key={i} 
                      className="text-[#cccccc] font-opensans text-[15px] leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: para }}
                    />
                  ))}
                </div>

                {service.benefits && service.benefits.length > 0 && (
                  <div className="mt-12 bg-[#1f2024] border border-[#2a2a2a] rounded-sm overflow-hidden p-0 max-w-lg mx-auto lg:mx-0 shadow-lg relative">
                    {/* Top cyan line decoration */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-[#00c8c8]"></div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#00c8c8]"></div>
                    <div className="absolute top-0 left-0 bottom-0 w-1 bg-[#00c8c8]"></div>
                    <div className="absolute top-0 right-0 bottom-0 w-1 bg-[#00c8c8]"></div>
                    
                    <div className="text-center pt-8 pb-4">
                      <span className="inline-block bg-[#00c8c8] text-white font-black font-montserrat uppercase px-8 py-3 tracking-widest text-sm shadow-md">
                        BENEFITS
                      </span>
                      <div className="w-10 h-[2px] bg-[#00c8c8] mx-auto mt-6"></div>
                    </div>
                    
                    <ul className="px-8 pb-8 pt-2">
                      {service.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-center text-[#ccc] font-opensans text-[14px] font-semibold border-b border-[#2a2a2a] py-4 last:border-0 last:pb-0">
                          <span className="text-[#00c8c8] mr-3 font-bold">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                          </span>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Enquire Now Image (Mobile/Tablet) */}
                <div className="mt-16 flex justify-center lg:hidden">
                  <Link href="/contact" className="block hover:scale-105 transition-transform">
                    <Image
                      src="/images/enquire-now.png"
                      alt="Enquire Now"
                      width={220}
                      height={65}
                      unoptimized
                      className="object-contain"
                    />
                  </Link>
                </div>
              </motion.div>
            </div>

            {/* Sessions / Pricing Section */}
            {service.sessions && service.sessions.length > 0 && (
              <div className="mt-28">
                <div className="flex flex-wrap justify-center gap-6 max-w-5xl mx-auto">
                  {service.sessions.map((session, idx) => (
                    <motion.div 
                      key={idx}
                      className="w-full md:w-[48%] lg:w-[45%] flex items-stretch bg-[#222429]"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <div className="w-1/3 bg-[#1c1d21] border-r-2 border-[#00c8c8] flex flex-col justify-center items-center py-10">
                        <span className="text-white text-5xl font-black font-montserrat leading-none mb-2">{session.durationNumber}</span>
                        <span className="text-white font-black font-montserrat uppercase tracking-widest text-xs">{session.durationUnit}</span>
                      </div>
                      <div className="w-2/3 flex items-center justify-center p-6">
                        <h3 className="text-[#e2e2e2] text-xl md:text-2xl font-black font-montserrat uppercase tracking-wider text-center">
                          {session.sessionText}
                        </h3>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Other Services Section */}
        <section className="py-20 px-4 bg-[#151515]">
          <div className="max-w-7xl mx-auto">
            <motion.div
              className="text-center mb-14"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl lg:text-4xl font-black font-montserrat text-white mb-4">
                Other <span className="text-[#00c8c8]">Services</span>
              </h2>
              <div className="w-16 h-1 bg-[#00c8c8] mx-auto" />
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {services
                .filter((s) => s.slug !== slug)
                .slice(0, 4)
                .map((s, idx) => (
                  <motion.div
                    key={s.slug}
                    className="w-full h-[360px] perspective-1000 group"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <div className="relative w-full h-full transform-style-3d cursor-pointer">
                      <div className="absolute inset-0 w-full h-full backface-hidden flip-front bg-[#151515] rounded-2xl overflow-hidden shadow-lg border border-white/10 flex flex-col">
                        <div className="relative flex-1 w-full">
                          <Image
                            src={s.images && s.images.length > 1 ? s.images[1] : s.bannerImage}
                            alt={s.title}
                            fill
                            unoptimized
                            className="object-cover object-top"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                          <div className="absolute bottom-4 left-4 right-4">
                            <h3 className="text-white font-black text-lg font-montserrat uppercase leading-tight">
                              {s.title}
                            </h3>
                          </div>
                        </div>
                      </div>
                      <div className="absolute inset-0 w-full h-full backface-hidden flip-back overflow-hidden rounded-2xl">
                        <Image
                          src={s.images && s.images.length > 1 ? s.images[1] : s.bannerImage}
                          alt={s.title}
                          fill
                          unoptimized
                          className="object-cover scale-110"
                        />
                        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center border-2 border-[#00c8c8] rounded-2xl">
                          <h3 className="text-white font-black font-montserrat uppercase text-lg mb-4">
                            {s.title}
                          </h3>
                          <Link
                            href={`/services/${s.slug}`}
                            className="bg-transparent border border-white text-white font-bold font-montserrat text-xs uppercase tracking-widest px-6 py-2.5 hover:bg-[#00c8c8] hover:border-[#00c8c8] hover:text-black transition-all duration-300 rounded-lg"
                          >
                            Explore Service
                          </Link>
                        </div>
                      </div>
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
