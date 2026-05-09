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
          className="relative h-[250px] lg:h-[300px] w-full flex items-center bg-cover bg-center"
          style={{ backgroundImage: `url(${service.bannerImage})` }}
        >
          <div className="absolute inset-0 bg-black/60" />
          <div className="max-w-7xl mx-auto px-4 w-full relative z-10 flex flex-col md:flex-row justify-between items-center text-white">
            <h1 className="text-4xl lg:text-5xl font-black font-montserrat uppercase tracking-wider mb-2 md:mb-0">
              SERVICES
            </h1>
            <p className="font-montserrat font-semibold text-sm lg:text-base text-right">
              <Link href="/" className="hover:text-[#00c8c8] transition-colors">Home</Link>{' '}
              /{' '}
              <Link href="/services" className="hover:text-[#00c8c8] transition-colors">Services</Link>{' '}
              / {service.title}
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-24 px-4 bg-[#1a1a1a]">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

              {/* Left: Overlapping Images */}
              <motion.div
                className="relative h-[420px] sm:h-[520px] w-full"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                {/* Yellow corner */}
                <div className="absolute top-8 right-0 lg:-right-8 w-60 h-60 border-4 border-[#ffb400] z-0 opacity-80 hidden md:block" />

                {/* Image 1 top-left */}
                <div className="absolute top-0 left-0 w-[78%] h-[58%] z-10 shadow-xl overflow-hidden">
                  <Image
                    src={service.images[1] || service.bannerImage}
                    alt={service.title}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>

                {/* Image 2 bottom-right */}
                <div className="absolute bottom-0 right-0 w-[63%] h-[58%] z-20 shadow-2xl border-4 border-[#1a1a1a] overflow-hidden">
                  <Image
                    src={service.images[2] || service.bannerImage}
                    alt={service.title}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
                
                {/* Enquire Now Image (Desktop) */}
                <div className="absolute -bottom-24 left-1/2 transform -translate-x-1/2 hidden lg:flex justify-center w-full z-30">
                  <Link href="/contact" className="hover:scale-105 transition-transform">
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
                    <p key={i} className="text-[#cccccc] font-opensans text-[15px] leading-relaxed">
                      {para}
                    </p>
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

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {services
                .filter((s) => s.slug !== slug)
                .slice(0, 4)
                .map((s, idx) => (
                  <motion.div
                    key={s.slug}
                    className="service-card-wrap"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <div className="service-flip-card">
                      <div
                        className="service-flip-front"
                        style={{ backgroundImage: `url(${s.images && s.images.length > 1 ? s.images[1] : s.bannerImage})` }}
                      >
                        <div className="service-flip-overlay" />
                        <div className="service-flip-inner">
                          <h3 className="service-flip-title">{s.title}</h3>
                        </div>
                      </div>
                      <div
                        className="service-flip-back"
                        style={{ backgroundImage: `url(${s.images && s.images.length > 1 ? s.images[1] : s.bannerImage})` }}
                      >
                        <div className="service-flip-overlay service-flip-overlay-dark" />
                        <div className="service-flip-inner">
                          <h3 className="service-flip-title">{s.title}</h3>
                          <Link href={`/services/${s.slug}`} className="service-flip-btn">
                            Read More
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
