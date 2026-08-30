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
  { label: 'Dance Fitness', href: '/services/bolly-x-fitness' },
  { label: 'Yoga', href: '/services/yoga' },
  { label: 'Mat Pilates', href: '/services/mat-pilates' },
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
  const pathname = usePathname()
  const lastScrollY = useRef(0)

  const navLinkClass = (href: string) =>
    `font-semibold text-sm uppercase tracking-wider font-ui transition-colors ${
      pathname === href ? 'text-[#F43F5E]' : 'text-white hover:text-[#F43F5E]'
    }`

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      setScrolled(currentScrollY > 80)
      
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
          ? 'bg-[#08080A]/95 backdrop-blur-md shadow-lg shadow-black/80 border-b border-white/5'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-[96px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image
              src="/images/main-logo/main-logo.png"
              alt="DNA 360 Fitness"
              width={260}
              height={80}
              unoptimized
              className="object-contain h-16 w-auto"
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-7">
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
              <Link href="/partner-dna-360" className={`font-semibold text-sm uppercase tracking-wider font-ui hover:text-[#F43F5E] transition-colors flex items-center gap-1 ${pathname === '/partner-dna-360' ? 'text-[#F43F5E]' : 'text-white'}`}>
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
            
            {/* Direct App Link Button */}
            <Link
              href="/members"
              className="ml-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#F43F5E] to-[#E11D48] text-white font-bold font-ui text-xs uppercase tracking-wider shadow-[0_4px_16px_rgba(244,63,94,0.5)] hover:shadow-[0_6px_22px_rgba(244,63,94,0.7)] hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center gap-2 shrink-0"
              title="659 Live Members Directory"
            >
              <span>Members</span>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10.5px] font-data font-bold">
                659
              </span>
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
              className="lg:hidden border-t border-white/10 bg-[#08080A] overflow-hidden"
              variants={mobileMenuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="py-4 flex flex-col gap-0">
                <Link
                  href="/members"
                  className="px-4 py-3.5 bg-gradient-to-r from-[#F43F5E]/20 to-transparent text-[#F43F5E] font-bold text-sm uppercase tracking-wider border-b border-white/10 flex items-center justify-between"
                  onClick={() => setMobileOpen(false)}
                >
                  <span className="flex items-center gap-2">
                    👥 Members Section
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#F43F5E]/20 text-[#F43F5E] text-xs font-bold font-data">
                    659
                  </span>
                </Link>

                <Link
                  href="/"
                  className="px-4 py-3 text-white font-semibold text-sm uppercase tracking-wider border-b border-white/5"
                  onClick={() => setMobileOpen(false)}
                >
                  Home
                </Link>
                <Link
                  href="/about"
                  className="px-4 py-3 text-white text-sm uppercase tracking-wider border-b border-white/5 hover:text-[#F43F5E]"
                  onClick={() => setMobileOpen(false)}
                >
                  About
                </Link>
                <Link
                  href="/services"
                  className="px-4 py-3 text-white text-sm uppercase tracking-wider border-b border-white/5 hover:text-[#F43F5E]"
                  onClick={() => setMobileOpen(false)}
                >
                  Services
                </Link>
                <Link
                  href="/trainers"
                  className="px-4 py-3 text-white text-sm uppercase tracking-wider border-b border-white/5 hover:text-[#F43F5E]"
                  onClick={() => setMobileOpen(false)}
                >
                  Trainers
                </Link>
                <Link
                  href="/gallery"
                  className="px-4 py-3 text-white text-sm uppercase tracking-wider border-b border-white/5 hover:text-[#F43F5E]"
                  onClick={() => setMobileOpen(false)}
                >
                  Gallery
                </Link>
                <Link
                  href="/contact"
                  className="px-4 py-3 text-white text-sm uppercase tracking-wider border-b border-white/5 hover:text-[#F43F5E]"
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
