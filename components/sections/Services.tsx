'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { services } from '@/data/services'

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

export default function Services() {
  return (
    <section id="services" className="bg-[#0a0a0a] py-20 px-4">
      {/* Heading */}
      <motion.div
        className="text-center mb-14"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-4xl lg:text-5xl font-black font-montserrat mb-4">
          <span className="text-white">DNA 360 </span>
          <span className="text-[#00c8c8]">Fitness Services</span>
        </h2>
        <div className="w-14 h-1 bg-[#00c8c8] mx-auto mb-5" />
        <p className="text-[#ccc] font-opensans text-base max-w-lg mx-auto">
          Fall in love with taking care of your body by experiencing our
          top-notch services.
        </p>
      </motion.div>

      {/* Grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0 max-w-7xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
      >
        {services.map((service) => (
          <motion.div
            key={service.slug}
            variants={cardVariants}
            className="service-card group relative h-[380px] overflow-hidden"
          >
            <Image
              src={service.images && service.images.length > 1 ? service.images[1] : service.bannerImage}
              alt={service.title}
              fill
              unoptimized
              className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent transition-all duration-400 group-hover:from-[#00c8c8]/40 group-hover:via-black/40" />
            {/* Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-8 px-4">
              <h3 className="text-white font-black uppercase tracking-wider text-lg font-montserrat text-center mb-3">
                {service.title}
              </h3>
              <Link
                href={`/services/${service.slug}`}
                className="bg-[#00c8c8] text-black text-xs font-bold font-montserrat uppercase tracking-widest px-8 py-3 opacity-0 group-hover:opacity-100 transition-all duration-300"
              >
                Read More
              </Link>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Book your trial now / View More */}
      <motion.div
        className="text-center mt-12 space-y-6"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Link
          href="/contact"
          className="inline-block bg-white text-black font-black uppercase tracking-widest text-lg px-12 py-4 font-montserrat hover:bg-[#00c8c8] transition-all duration-300"
        >
          Book your trial now
        </Link>
        <div className="block pt-4">
            <Link
              href="/services"
              className="text-[#00c8c8] font-bold uppercase tracking-widest text-sm border-b-2 border-[#00c8c8] pb-1 hover:text-white hover:border-white transition-all duration-300"
            >
              View All Services
            </Link>
        </div>
      </motion.div>
    </section>
  )
}
