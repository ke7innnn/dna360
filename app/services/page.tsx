'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/sections/Footer'
import { services } from '@/data/services'

export default function ServicesPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-[70px]" style={{ backgroundColor: '#151515' }}>
        {/* Banner Section */}
        <section
          className="relative h-[250px] lg:h-[300px] w-full flex items-center bg-cover bg-center"
          style={{ backgroundImage: 'url(/images/service-header-image.jpg)' }}
        >
          <div className="absolute inset-0 bg-black/60" />
          <div className="max-w-7xl mx-auto px-4 w-full relative z-10 flex flex-col md:flex-row justify-between items-center text-white">
            <h1 className="text-4xl lg:text-5xl font-black font-montserrat uppercase tracking-wider mb-2 md:mb-0">
              SERVICES
            </h1>
            <p className="font-montserrat font-semibold text-sm lg:text-base">
              <Link href="/" className="hover:text-[#00c8c8] transition-colors">Home</Link>{' '}
              / Services
            </p>
          </div>
        </section>

        {/* Services Grid */}
        <section
          className="py-20 px-4"
          style={{
            backgroundImage: 'url(/images/bg-programs.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {services.map((service, idx) => (
                <motion.div
                  key={service.slug}
                  className="service-card-wrap"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.07 }}
                >
                  {/* Flip card container */}
                  <div className="service-flip-card">
                    {/* FRONT */}
                    <div
                      className="service-flip-front"
                      style={{ backgroundImage: `url(${service.images && service.images.length > 1 ? service.images[1] : service.bannerImage})` }}
                    >
                      <div className="service-flip-overlay" />
                      <div className="service-flip-inner">
                        <h3 className="service-flip-title">{service.title}</h3>
                      </div>
                    </div>

                    {/* BACK */}
                    <div
                      className="service-flip-back"
                      style={{ backgroundImage: `url(${service.images && service.images.length > 1 ? service.images[1] : service.bannerImage})` }}
                    >
                      <div className="service-flip-overlay service-flip-overlay-dark" />
                      <div className="service-flip-inner">
                        <h3 className="service-flip-title">{service.title}</h3>
                        <Link
                          href={`/services/${service.slug}`}
                          className="service-flip-btn"
                        >
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
