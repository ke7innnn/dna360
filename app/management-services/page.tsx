'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import Footer from '@/components/sections/Footer'

const points = [
  'Branding: DNA 360 and Café DNA for the duration of the contract.',
  'Operational SOPs, software and process implementation.',
  'Bi-monthly Quality and BOSS (Brand Operating Service Standards) Audit.',
  'Uniforms, collateral, stationery and on-premises signage design.',
  'Digital and online presence including location website, link to mother website, SEM and SEO support.',
  'Social media marketing including maintenance of Instagram and FB accounts, brand promotion and online customer dialogs.',
  'Implementation of Audit Systems.',
  'Selection and Training of Centre Head.',
  'Facility App Creation and Maintenance.',
  'Marketing, Pricing Guidance and Sales Support.',
  'Software selection, Training and Process Implementation.',
  'Owner MIS including Sales and Performance Dashboards.',
  'Implementation of Revenue and Cost Management Systems.',
  'CRM Guidance Staff Induction, Training and Evaluation on BOSS Standards and SOPs: Customer Acquisition, Retention and Recovery.',
  'Café DNA: Branding, Menu Design, Equipment Selection, Recipe Specifications, Swiggy & Zomato Hosting.',
]

export default function ManagementServicesPage() {
  return (
    <>
      <Navbar />
      <main className="bg-[#151515] min-h-screen pt-[70px]">
        {/* Banner Section */}
        <section
          className="relative h-[250px] lg:h-[300px] w-full flex items-center bg-cover bg-center"
          style={{ backgroundImage: 'url(/images/service-header-image.jpg)' }}
        >
          <div className="absolute inset-0 bg-black/60"></div>
          <div className="max-w-7xl mx-auto px-4 w-full relative z-10 flex flex-col md:flex-row justify-between items-center text-white">
            <h1 className="text-4xl lg:text-5xl font-black font-montserrat uppercase tracking-wider mb-2 md:mb-0">
              PARTNER DNA 360
            </h1>
            <p className="font-montserrat font-semibold text-sm lg:text-base">
              <Link href="/" className="hover:text-[#00c8c8] transition-colors">Home</Link> /{' '}
              <span className="text-white">Partner DNA 360</span> /{' '}
              Management Services
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-24 px-4 bg-[#1a1a1a]">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
              
              {/* Left Column: Overlapping Images */}
              <motion.div 
                className="relative h-[450px] sm:h-[550px] w-full sticky top-32"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                {/* Yellow Square Outline Graphic */}
                <div className="absolute top-10 right-0 lg:-right-10 w-64 h-64 border-4 border-[#ffb400] z-0 opacity-80 hidden md:block"></div>
                
                {/* Image 1 (Top Left) */}
                <div className="absolute top-0 left-0 w-[80%] h-[60%] z-10 bg-white shadow-xl">
                  <Image
                    src="/images/franchise/management-services-01.jpg"
                    alt="Management Services Graphic"
                    fill
                    unoptimized
                    className="object-contain p-4"
                  />
                </div>

                {/* Image 2 (Bottom Right) */}
                <div className="absolute bottom-0 right-0 w-[65%] h-[60%] z-20 shadow-2xl border-4 border-[#1a1a1a]">
                  <Image
                    src="/images/franchise/management-services-02.jpg"
                    alt="Management Services Gym"
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
                  Management <span className="text-[#00c8c8]">Services</span>
                </h2>
                <div className="w-16 h-1 bg-[#00c8c8] mb-8"></div>

                <ul className="space-y-4 mb-10">
                  {points.map((point, index) => (
                    <li key={index} className="flex items-start text-white font-opensans text-[15px] leading-relaxed">
                      <span className="text-[#00c8c8] mr-3 font-bold mt-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href="/DNA-360-Management-Services-2021.pdf"
                  download="DNA-360-Management-Services-2021.pdf"
                  className="inline-block bg-[#00c8c8] hover:bg-[#00a5a5] text-white font-bold font-montserrat text-sm uppercase tracking-wider px-8 py-4 transition-colors duration-300"
                >
                  Download Management Services Deck
                </a>

              </motion.div>

            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
