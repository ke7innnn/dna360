'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const partnerLinks = [
  { label: 'Franchise Services', href: '/franchise-services' },
  { label: 'Management Services', href: '/management-services' },
  { label: 'Facility Setup Services', href: '/facility-setup-services' },
]

const serviceLinks = [
  { label: 'Personal Training', href: '/services/personal-training' },
  { label: 'General Fitness', href: '/services/general-fitness' },
  { label: 'Reformer Pilates', href: '/services/reformer-pilates' },
  { label: 'Spinning', href: '/services/spinning' },
  { label: 'Bolly X Fitness Dance', href: '/services/bolly-x-fitness' },
  { label: 'Zumba Fitness Dance', href: '/services/zumba-fitness' },
  { label: 'Yoga', href: '/services/yoga' },
  { label: 'Mat Pilates', href: '/services/mat-pilates' },
  { label: 'Mixed Martial Arts', href: '/services/mixed-martial-arts' },
]

const dropdownVariants = {
  hidden: { opacity: 0, y: -8, scaleY: 0.95 },
  visible: { opacity: 1, y: 0, scaleY: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, scaleY: 0.95, transition: { duration: 0.15 } },
}

const mobileMenuVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: { opacity: 1, height: 'auto', transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, height: 0, transition: { duration: 0.2 } },
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [partnerOpen, setPartnerOpen] = useState(false)
  const [servicesOpen, setServicesOpen] = useState(false)
  const [mobilePartnerOpen, setMobilePartnerOpen] = useState(false)
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false)
  const pathname = usePathname()

  const navLinkClass = (href: string) =>
    `font-semibold text-sm uppercase tracking-wider font-montserrat transition-colors ${
      pathname === href ? 'text-[#00c8c8]' : 'text-white hover:text-[#00c8c8]'
    }`

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0a0a0a] shadow-lg shadow-black/50'
          : 'bg-[rgba(0,0,0,0.85)] backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-[70px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image
              src="http://www.dna360.in/assets/img/logo-2.png"
              alt="DNA 360 Fitness"
              width={60}
              height={60}
              unoptimized
              className="object-contain"
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-8">
            <Link href="/" className={navLinkClass('/')}>
              Home
            </Link>
            <Link href="/about" className={navLinkClass('/about')}>
              About
            </Link>

            {/* Partner DNA 360 Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setPartnerOpen(true)}
              onMouseLeave={() => setPartnerOpen(false)}
            >
              <Link href="/partner-dna-360" className={`font-semibold text-sm uppercase tracking-wider font-montserrat hover:text-[#00c8c8] transition-colors flex items-center gap-1 ${pathname === '/partner-dna-360' ? 'text-[#00c8c8]' : 'text-white'}`}>
                Partner DNA 360
                <svg className="w-3 h-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Link>
              <AnimatePresence>
                {partnerOpen && (
                  <motion.div
                    className="dropdown-menu"
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    {partnerLinks.map((link) => (
                      <Link key={link.href} href={link.href}>
                        {link.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link href="/services" className={navLinkClass('/services')}>
              Services
            </Link>

            <Link href="/trainers" className={navLinkClass('/trainers')}>
              Trainers
            </Link>
            <Link href="/gallery" className={navLinkClass('/gallery')}>
              Gallery
            </Link>
            <Link href="/contact" className={navLinkClass('/contact')}>
              Contact Us
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            id="mobile-menu-btn"
            className="lg:hidden text-white p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle mobile menu"
          >
            <div className="w-6 flex flex-col gap-1.5">
              <span
                className={`block h-0.5 bg-white transition-all duration-300 ${
                  mobileOpen ? 'rotate-45 translate-y-2' : ''
                }`}
              />
              <span
                className={`block h-0.5 bg-white transition-all duration-300 ${
                  mobileOpen ? 'opacity-0' : ''
                }`}
              />
              <span
                className={`block h-0.5 bg-white transition-all duration-300 ${
                  mobileOpen ? '-rotate-45 -translate-y-2' : ''
                }`}
              />
            </div>
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              className="lg:hidden border-t border-white/10 bg-[#0a0a0a] overflow-hidden"
              variants={mobileMenuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="py-4 flex flex-col gap-0">
                <Link
                  href="/"
                  className="px-4 py-3 text-[#00c8c8] font-semibold text-sm uppercase tracking-wider border-b border-white/5"
                  onClick={() => setMobileOpen(false)}
                >
                  Home
                </Link>
                <Link
                  href="/about"
                  className="px-4 py-3 text-white text-sm uppercase tracking-wider border-b border-white/5 hover:text-[#00c8c8]"
                  onClick={() => setMobileOpen(false)}
                >
                  About
                </Link>

                {/* Mobile Partner Dropdown */}
                <div>
                  <div className="flex items-center justify-between border-b border-white/5 w-full">
                    <Link
                      href="/partner-dna-360"
                      className="flex-grow px-4 py-3 text-white text-sm uppercase tracking-wider hover:text-[#00c8c8]"
                      onClick={() => setMobileOpen(false)}
                    >
                      Partner DNA 360
                    </Link>
                    <button
                      className="p-3 pr-4 text-white hover:text-[#00c8c8]"
                      onClick={() => setMobilePartnerOpen(!mobilePartnerOpen)}
                    >
                      <svg
                        className={`w-4 h-4 transition-transform ${mobilePartnerOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  <AnimatePresence>
                    {mobilePartnerOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-black/30"
                      >
                        {partnerLinks.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            className="block px-8 py-2.5 text-[#ccc] text-sm hover:text-[#00c8c8] border-b border-white/5"
                            onClick={() => setMobileOpen(false)}
                          >
                            {link.label}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Link
                  href="/services"
                  className="px-4 py-3 text-white text-sm uppercase tracking-wider border-b border-white/5 hover:text-[#00c8c8]"
                  onClick={() => setMobileOpen(false)}
                >
                  Services
                </Link>

                <Link
                  href="/trainers"
                  className="px-4 py-3 text-white text-sm uppercase tracking-wider border-b border-white/5 hover:text-[#00c8c8]"
                  onClick={() => setMobileOpen(false)}
                >
                  Trainers
                </Link>
                <Link
                  href="/gallery"
                  className="px-4 py-3 text-white text-sm uppercase tracking-wider border-b border-white/5 hover:text-[#00c8c8]"
                  onClick={() => setMobileOpen(false)}
                >
                  Gallery
                </Link>
                <Link
                  href="/contact"
                  className="px-4 py-3 text-white text-sm uppercase tracking-wider hover:text-[#00c8c8]"
                  onClick={() => setMobileOpen(false)}
                >
                  Contact Us
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  )
}
