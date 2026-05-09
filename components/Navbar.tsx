'use client'

import { useState, useEffect, useRef } from 'react'
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
  const [hidden, setHidden] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [partnerOpen, setPartnerOpen] = useState(false)
  const [servicesOpen, setServicesOpen] = useState(false)
  const [mobilePartnerOpen, setMobilePartnerOpen] = useState(false)
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false)
  const pathname = usePathname()
  const lastScrollY = useRef(0)

  const navLinkClass = (href: string) =>
    `font-semibold text-base uppercase tracking-wider font-montserrat transition-colors ${
      pathname === href ? 'text-[#00c8c8]' : 'text-white hover:text-[#00c8c8]'
    }`

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Transparent at top, solid when scrolled
      setScrolled(currentScrollY > 80)
      
      // Hide on scroll down, show on scroll up
      if (currentScrollY > lastScrollY.current && currentScrollY > 150) {
        setHidden(true)
      } else {
        setHidden(false)
      }
      
      lastScrollY.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        hidden ? '-translate-y-full' : 'translate-y-0'
      } ${
        scrolled
          ? 'bg-[#0a0a0a]/95 backdrop-blur-md shadow-lg shadow-black/50'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-[105px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image
              src="/images/main-logo/main-logo.png"
              alt="DNA 360 Fitness"
              width={270}
              height={90}
              unoptimized
              className="object-contain h-20 w-auto"
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
            
            <a
              href="https://www.youtube.com/channel/UCIL51PkrBEW2xhqMCZewn2g"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-white hover:text-[#ff0000] transition-colors"
              title="YouTube"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>
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
                  className="px-4 py-3 text-white text-sm uppercase tracking-wider border-b border-white/5 hover:text-[#00c8c8]"
                  onClick={() => setMobileOpen(false)}
                >
                  Contact Us
                </Link>

                <div className="px-4 py-4 border-b border-white/5">
                  <a
                    href="https://www.youtube.com/channel/UCIL51PkrBEW2xhqMCZewn2g"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-white hover:text-[#ff0000] transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                    <span className="text-sm font-medium uppercase tracking-wider">YouTube</span>
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  )
}
