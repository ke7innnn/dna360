'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import Footer from '@/components/sections/Footer'

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

const inputClass =
  'w-full bg-white/5 border border-white/10 text-white font-opensans text-sm px-4 py-3.5 rounded-none focus:outline-none focus:border-[#00c8c8] placeholder-white/30 transition-colors duration-200'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', phone: '', service: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 4000)
    setForm({ name: '', phone: '', service: '', message: '' })
  }

  return (
    <>
      <Navbar />
      <main className="bg-[#0a0a0a] min-h-screen pt-[105px]">

        {/* ── SPLIT HERO ─────────────────────────────────────────────── */}
        <section className="min-h-[calc(100vh-105px)] grid grid-cols-1 lg:grid-cols-2">

          {/* LEFT — full-height image/video + info overlay */}
          <div className="relative min-h-[400px] lg:min-h-0 overflow-hidden">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source src="/images/contact-bg.mp4" type="video/mp4" />
            </video>
            {/* gradient overlay */}
            <div className="absolute inset-0 bg-black/60" />

            {/* content over image/video */}
            <motion.div
              className="relative z-10 h-full flex flex-col justify-end p-10 lg:p-14"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              <p className="text-[#00c8c8] font-montserrat font-semibold text-xs uppercase tracking-[4px] mb-4">
                DNA 360 Fitness Centre
              </p>
              <h1 className="text-4xl lg:text-5xl font-black font-montserrat text-white leading-tight mb-6">
                Let&apos;s start your<br />
                <span className="text-[#00c8c8]">fitness journey.</span>
              </h1>

              <div className="w-10 h-0.5 bg-[#00c8c8] mb-8" />

              {/* contact details */}
              <div className="flex flex-col gap-5">
                {/* Phone */}
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full border border-[#00c8c8]/40 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-3.5 h-3.5 text-[#00c8c8]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white/40 font-montserrat text-[10px] uppercase tracking-widest mb-1">Phone</p>
                    <a href="tel:+919324462384" className="text-white/80 font-opensans text-sm hover:text-[#00c8c8] transition-colors block">+91 93244 62384</a>
                    <a href="tel:02249691360" className="text-white/80 font-opensans text-sm hover:text-[#00c8c8] transition-colors block">022 4969 1360</a>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full border border-[#00c8c8]/40 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-3.5 h-3.5 text-[#00c8c8]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white/40 font-montserrat text-[10px] uppercase tracking-widest mb-1">Email</p>
                    <a href="mailto:dna360fitness@gmail.com" className="text-white/80 font-opensans text-sm hover:text-[#00c8c8] transition-colors">dna360fitness@gmail.com</a>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full border border-[#00c8c8]/40 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-3.5 h-3.5 text-[#00c8c8]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white/40 font-montserrat text-[10px] uppercase tracking-widest mb-1">Address</p>
                    <p className="text-white/80 font-opensans text-sm leading-relaxed">502, Hiranandani Knowledge Park,<br />Hiranandani Gardens Powai,<br />Mumbai – 400076</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* RIGHT — form panel */}
          <motion.div
            className="flex items-center justify-center bg-[#0d0d0d] px-8 py-14 lg:px-14"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
          >
            <div className="w-full max-w-md">
              <p className="text-[#00c8c8] font-montserrat font-semibold text-xs uppercase tracking-[4px] mb-3">
                Get in touch
              </p>
              <h2 className="text-3xl font-black font-montserrat text-white mb-2">
                Send us a message
              </h2>
              <p className="text-white/40 font-opensans text-sm mb-10 leading-relaxed">
                Our experts will be happy to assist you. Fill out the form and we&apos;ll get back to you shortly.
              </p>

              <form onSubmit={handleSubmit} id="contact-form" className="flex flex-col gap-4">
                {/* Name */}
                <div>
                  <label className="text-white/40 font-montserrat text-[10px] uppercase tracking-widest block mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    id="contact-name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Rahul Sharma"
                    className={inputClass}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="text-white/40 font-montserrat text-[10px] uppercase tracking-widest block mb-1.5">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    id="contact-phone"
                    value={form.phone}
                    onChange={handleChange}
                    required
                    placeholder="+91 XXXXX XXXXX"
                    className={inputClass}
                  />
                </div>

                {/* Service */}
                <div>
                  <label className="text-white/40 font-montserrat text-[10px] uppercase tracking-widest block mb-1.5">Interested In</label>
                  <div className="relative">
                    <select
                      name="service"
                      id="contact-service"
                      value={form.service}
                      onChange={handleChange}
                      className={`${inputClass} appearance-none cursor-pointer`}
                      style={{ color: form.service ? '#fff' : 'rgba(255,255,255,0.3)' }}
                    >
                      <option value="" className="bg-[#0d0d0d] text-white/40">Select a service</option>
                      {services.map((s) => (
                        <option key={s} value={s} className="bg-[#0d0d0d] text-white">{s}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/30">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="text-white/40 font-montserrat text-[10px] uppercase tracking-widest block mb-1.5">Message *</label>
                  <textarea
                    name="message"
                    id="contact-message"
                    value={form.message}
                    onChange={handleChange}
                    required
                    rows={4}
                    placeholder="Tell us about your fitness goals..."
                    className={`${inputClass} resize-none`}
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  id="contact-submit"
                  className="w-full mt-2 bg-[#00c8c8] text-black font-black font-montserrat uppercase tracking-widest text-sm py-4 hover:bg-white transition-all duration-300 active:scale-95"
                >
                  {submitted ? '✓ Message Sent!' : 'Send Message'}
                </button>

                {submitted && (
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[#00c8c8] font-opensans text-sm text-center"
                  >
                    Thank you! We&apos;ll be in touch shortly.
                  </motion.p>
                )}
              </form>
            </div>
          </motion.div>
        </section>

        {/* ── MAP ─────────────────────────────────────────────────────── */}
        <section className="relative w-full h-[400px]">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3769.8832506697!2d72.9133711!3d19.1199255!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c9f2b3e2e2e3%3A0x21b69f517dc76ee2!2sDNA%20360%20Fitness!5e0!3m2!1sen!2sin!4v1715200000000!5m2!1sen!2sin"
            width="100%"
            height="100%"
            style={{ border: 0, filter: 'invert(100%) grayscale(100%) brightness(0.85) contrast(1.1)' }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="DNA 360 Location"
          />
          <a
            href="https://www.google.com/maps?ll=19.119926,72.915946&z=16&t=m&hl=en&gl=IN&mapclient=embed&cid=2428573527651361506"
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 z-20"
            aria-label="Open DNA 360 on Google Maps"
          />
        </section>

        <Footer />
      </main>
    </>
  )
}
