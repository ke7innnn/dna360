'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Navbar from '@/components/Navbar'
import Footer from '@/components/sections/Footer'
import Link from 'next/link'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

const services = [
  'Personal Training',
  'General Fitness',
  'Reformer Pilates',
  'Spinning',
  'Bolly X Fitness Dance',
  'Zumba Fitness Dance',
  'Yoga',
  'Mat Pilates',
  'Mixed Martial Arts',
]

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    service: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 4000)
    setForm({ name: '', phone: '', service: '', message: '' })
  }

  return (
    <>
      <Navbar />
      <main className="bg-[#0a0a0a] min-h-screen pt-[70px]">
        {/* Banner Section */}
        <section className="relative h-[250px] lg:h-[300px] w-full flex items-center bg-cover bg-center" style={{ backgroundImage: 'url(/images/contact-header-image.jpg)' }}>
          <div className="absolute inset-0 bg-black/60"></div>
          <div className="max-w-7xl mx-auto px-4 w-full relative z-10 flex flex-col md:flex-row justify-between items-center text-white">
            <h1 className="text-4xl lg:text-5xl font-black font-montserrat uppercase tracking-wider mb-2 md:mb-0">Contacts</h1>
            <p className="font-montserrat font-semibold text-sm lg:text-base"><Link href="/" className="hover:text-[#00c8c8] transition-colors">Home</Link> / Contacts</p>
          </div>
        </section>

        {/* Full-width Map */}
        <section className="w-full h-[400px] lg:h-[500px] relative">
          {/* Dark overlay to match site vibe */}
          <div className="absolute inset-0 bg-black/40 z-10 pointer-events-none" />
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3769.8832506697!2d72.9133711!3d19.1199255!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c9f2b3e2e2e3%3A0x21b69f517dc76ee2!2sDNA%20360%20Fitness!5e0!3m2!1sen!2sin!4v1715200000000!5m2!1sen!2sin"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="DNA 360 Location"
            className="grayscale brightness-50 contrast-125"
          />
          {/* Clickable overlay that opens the exact map link */}
          <a
            href="https://www.google.com/maps?ll=19.119926,72.915946&z=16&t=m&hl=en&gl=IN&mapclient=embed&cid=2428573527651361506"
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 z-20"
            aria-label="Open DNA 360 on Google Maps"
          />
        </section>


        {/* Page Hero Banner */}
        <div className="bg-[#0f0f0f] py-16 px-4 text-center border-b border-white/5">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
          >
            <h1 className="text-5xl lg:text-6xl font-black font-montserrat mb-4">
              <span className="text-white">Contact </span>
              <span className="text-[#00c8c8]">Us</span>
            </h1>
            <div className="w-14 h-1 bg-[#00c8c8] mx-auto mb-6" />
            <p className="text-[#aaa] font-montserrat font-semibold uppercase tracking-widest text-sm mb-2">
              Got A Question?
            </p>
            <p className="text-[#ccc] font-opensans text-base max-w-md mx-auto leading-relaxed">
              Do not hesitate to give us a call or input your details below. Our
              experts will be happy to assist you.
            </p>
          </motion.div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Left: Info Cards */}
            <motion.div
              className="flex flex-col gap-0"
              variants={stagger}
              initial="hidden"
              animate="visible"
            >
              {/* Need Help */}
              <motion.div
                variants={fadeUp}
                id="contact-card-phone"
                className="flex items-center gap-0 bg-[#1c1c1c] hover:bg-[#222] transition-colors duration-300"
              >
                {/* Icon block */}
                <div className="flex flex-col items-center justify-center w-[110px] py-7 px-4 shrink-0">
                  <div className="mb-2">
                    <svg className="w-9 h-9 text-[#e63946]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                  </div>
                  <span className="text-white font-black font-montserrat text-xs uppercase tracking-widest text-center">
                    Need Help
                  </span>
                </div>
                {/* Teal divider */}
                <div className="w-0.5 self-stretch bg-[#00c8c8] shrink-0" />
                {/* Content */}
                <div className="px-6 py-7 flex flex-col gap-1">
                  <a href="tel:+919324462384" className="text-[#ccc] font-opensans text-sm hover:text-[#00c8c8] transition-colors">
                    +91 93244 62384
                  </a>
                  <a href="tel:02249691360" className="text-[#ccc] font-opensans text-sm hover:text-[#00c8c8] transition-colors">
                    022 4969 1360
                  </a>
                  <a href="tel:02249675663" className="text-[#ccc] font-opensans text-sm hover:text-[#00c8c8] transition-colors">
                    022 4967 5663
                  </a>
                </div>
              </motion.div>

              {/* Divider */}
              <div className="h-px bg-white/5" />

              {/* Questions */}
              <motion.div
                variants={fadeUp}
                id="contact-card-email"
                className="flex items-center gap-0 bg-[#1c1c1c] hover:bg-[#222] transition-colors duration-300"
              >
                <div className="flex flex-col items-center justify-center w-[110px] py-7 px-4 shrink-0">
                  <div className="mb-2">
                    <svg className="w-9 h-9 text-[#e63946]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </div>
                  <span className="text-white font-black font-montserrat text-xs uppercase tracking-widest text-center">
                    Questions
                  </span>
                </div>
                <div className="w-0.5 self-stretch bg-[#00c8c8] shrink-0" />
                <div className="px-6 py-7">
                  <a href="mailto:dna360fitness@gmail.com" className="text-[#ccc] font-opensans text-sm hover:text-[#00c8c8] transition-colors">
                    dna360fitness@gmail.com
                  </a>
                </div>
              </motion.div>

              {/* Divider */}
              <div className="h-px bg-white/5" />

              {/* Address */}
              <motion.div
                variants={fadeUp}
                id="contact-card-address"
                className="flex items-center gap-0 bg-[#1c1c1c] hover:bg-[#222] transition-colors duration-300"
              >
                <div className="flex flex-col items-center justify-center w-[110px] py-7 px-4 shrink-0">
                  <div className="mb-2">
                    <svg className="w-9 h-9 text-[#e63946]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                  </div>
                  <span className="text-white font-black font-montserrat text-xs uppercase tracking-widest text-center">
                    Address
                  </span>
                </div>
                <div className="w-0.5 self-stretch bg-[#00c8c8] shrink-0" />
                <div className="px-6 py-7">
                  <p className="text-[#ccc] font-opensans text-sm leading-relaxed">
                    502, Hiranandani Knowledge Park,<br />
                    Hiranandani Gardens Powai,<br />
                    Mumbai – 400076, India.
                  </p>
                </div>
              </motion.div>
            </motion.div>

            {/* Right: Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
            >
              <form
                onSubmit={handleSubmit}
                id="contact-form"
                className="flex flex-col gap-0"
              >
                {/* Name */}
                <div className="relative mb-0">
                  <input
                    type="text"
                    name="name"
                    id="contact-name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="NAME*"
                    className="w-full bg-[#1a1a1a] text-white font-opensans text-sm px-4 pt-4 pb-3 border-0 border-b-2 border-[#00c8c8] focus:outline-none focus:border-[#00e5e5] placeholder-[#777] placeholder:text-xs placeholder:tracking-widest placeholder:font-montserrat placeholder:font-semibold transition-colors"
                  />
                </div>

                <div className="h-px bg-transparent mt-1" />

                {/* Phone */}
                <div className="relative mt-1">
                  <input
                    type="tel"
                    name="phone"
                    id="contact-phone"
                    value={form.phone}
                    onChange={handleChange}
                    required
                    placeholder="PHONE*"
                    className="w-full bg-[#1a1a1a] text-white font-opensans text-sm px-4 pt-4 pb-3 border-0 border-b-2 border-[#00c8c8] focus:outline-none focus:border-[#00e5e5] placeholder-[#777] placeholder:text-xs placeholder:tracking-widest placeholder:font-montserrat placeholder:font-semibold transition-colors"
                  />
                </div>

                <div className="h-px bg-transparent mt-1" />

                {/* Service Select */}
                <div className="relative mt-1">
                  <select
                    name="service"
                    id="contact-service"
                    value={form.service}
                    onChange={handleChange}
                    className="w-full bg-[#1a1a1a] text-[#777] font-opensans text-sm px-4 pt-4 pb-3 border-0 border-b-2 border-[#00c8c8] focus:outline-none focus:border-[#00e5e5] appearance-none cursor-pointer transition-colors"
                    style={{ color: form.service ? '#fff' : '#777' }}
                  >
                    <option value="" disabled className="bg-[#1a1a1a] text-[#777]">
                      Select
                    </option>
                    {services.map((s) => (
                      <option key={s} value={s} className="bg-[#1a1a1a] text-white">
                        {s}
                      </option>
                    ))}
                  </select>
                  {/* Arrow */}
                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#777]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                <div className="h-px bg-transparent mt-1" />

                {/* Message */}
                <div className="relative mt-1">
                  <textarea
                    name="message"
                    id="contact-message"
                    value={form.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    placeholder="MESSAGE*"
                    className="w-full bg-[#1a1a1a] text-white font-opensans text-sm px-4 pt-4 pb-3 border-0 border-b-2 border-[#00c8c8] focus:outline-none focus:border-[#00e5e5] placeholder-[#777] placeholder:text-xs placeholder:tracking-widest placeholder:font-montserrat placeholder:font-semibold resize-none transition-colors"
                  />
                </div>

                <div className="mt-6">
                  <button
                    type="submit"
                    id="contact-submit"
                    className="bg-[#00c8c8] text-black font-black font-montserrat uppercase tracking-widest text-sm px-10 py-4 hover:bg-transparent hover:text-[#00c8c8] border-2 border-[#00c8c8] transition-all duration-300 active:scale-95"
                  >
                    {submitted ? '✓ Sent!' : 'Send Comment'}
                  </button>
                </div>

                {submitted && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[#00c8c8] font-opensans text-sm mt-4"
                  >
                    Thank you! We&apos;ll be in touch shortly.
                  </motion.p>
                )}
              </form>
            </motion.div>
          </div>
        </div>

        <Footer />
      </main>
    </>
  )
}
