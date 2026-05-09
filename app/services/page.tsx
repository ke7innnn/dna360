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
      <main className="min-h-screen pt-[105px]" style={{ backgroundColor: '#151515' }}>
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
            <div className="flex flex-wrap justify-center gap-8">
              {services.map((service, idx) => (
                <motion.div
                  key={service.slug}
                  className="w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.5rem)] xl:w-[calc(25%-1.5rem)] max-w-[320px] h-[420px] perspective-1000 group"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.07 }}
                >
                  <div className="relative w-full h-full transform-style-3d cursor-pointer">
                    
                    {/* Front */}
                    <div className="absolute inset-0 w-full h-full backface-hidden flip-front bg-[#151515] rounded-2xl overflow-hidden shadow-lg border border-white/5 flex flex-col">
                      {/* Image Section */}
                      <div className="relative h-[200px] shrink-0 w-full">
                        <img
                          src={service.images && service.images.length > 1 ? service.images[1] : service.bannerImage}
                          alt={service.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-4 right-4 bg-[#00c8c8] text-black text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-md shadow-lg">
                          {service.title}
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="p-6 flex flex-col flex-grow">
                        <h3 className="text-white font-black text-xl font-montserrat mb-3">{service.title}</h3>
                        <p className="text-[#aaa] font-opensans text-sm mb-4 line-clamp-3 leading-relaxed">
                          {(service.content || '').split('.').filter(s => s.trim().length > 0).slice(0, 3).join(' • ')}
                        </p>
                        <div className="inline-block mt-auto bg-[#00c8c8]/20 text-[#00c8c8] font-bold text-xs px-3 py-1.5 rounded-md self-start">
                          Premium Program
                        </div>
                      </div>
                    </div>

                    {/* Back */}
                    <div className="absolute inset-0 w-full h-full backface-hidden flip-back overflow-hidden rounded-2xl">
                      <img
                        src={service.images && service.images.length > 1 ? service.images[1] : service.bannerImage}
                        alt={service.title}
                        className="w-full h-full object-cover scale-110"
                      />
                      <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center border-2 border-[#00c8c8] rounded-2xl">
                        <h3 className="text-white font-black font-montserrat uppercase text-xl mb-4">{service.title}</h3>
                        <Link
                          href={`/services/${service.slug}`}
                          className="bg-transparent border border-white text-white font-bold font-montserrat text-xs uppercase tracking-widest px-8 py-3 hover:bg-[#00c8c8] hover:border-[#00c8c8] hover:text-black transition-all duration-300 rounded-lg"
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
