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

      {/* Centered Flex Container */}
      <motion.div
        className="flex flex-wrap justify-center gap-8 max-w-7xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
      >
        {services.map((service) => (
          <motion.div
            key={service.slug}
            variants={cardVariants}
            className="w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.5rem)] xl:w-[calc(25%-1.5rem)] max-w-[320px] h-[420px] perspective-1000 group"
          >
            <div className="relative w-full h-full transform-style-3d cursor-pointer">
              
              {/* Front */}
              <div className="absolute inset-0 w-full h-full backface-hidden flip-front bg-[#151515] rounded-2xl overflow-hidden shadow-lg border border-white/5 flex flex-col">
                {/* Image Section */}
                <div className="relative h-[200px] shrink-0 w-full">
                  <Image
                    src={service.images && service.images.length > 1 ? service.images[1] : service.bannerImage}
                    alt={service.title}
                    fill
                    unoptimized
                    className="object-cover"
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
                <Image
                  src={service.images && service.images.length > 1 ? service.images[1] : service.bannerImage}
                  alt={service.title}
                  fill
                  unoptimized
                  className="object-cover scale-110"
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
