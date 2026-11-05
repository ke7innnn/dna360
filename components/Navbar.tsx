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
      pathname === href ? 'text-[#3B82F6]' : 'text-white hover:text-[#3B82F6]'
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
              <Link href="/partner-dna-360" className={`font-semibold text-sm uppercase tracking-wider font-ui hover:text-[#3B82F6] transition-colors flex items-center gap-1 ${pathname === '/partner-dna-360' ? 'text-[#3B82F6]' : 'text-white'}`}>
                Partner DNA 360
                <svg className="w-3 h-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Link>
              <AnimatePresence>
                {partnerOpen && (
                  <motion.div
                    className="absolute left-0 top-full pt-3 w-64 z-50"
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <div className="rounded-xl bg-[#0B0D14]/95 backdrop-blur-xl border border-white/10 shadow-2xl py-2 flex flex-col overflow-hidden">
                      {partnerLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-200 hover:text-[#3B82F6] hover:bg-white/5 transition-colors"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
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
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg bg-[#00c8c8] hover:bg-[#00b4b4] text-black font-bold text-xs uppercase tracking-wider transition-colors"
            >
              Member Portal
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="text-white p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              className="lg:hidden border-t border-white/10 bg-[#08080A] max-h-[calc(100dvh-96px)] overflow-y-auto"
              variants={mobileMenuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="py-4 flex flex-col gap-0">
                <Link
                  href="/"
                  className="px-4 py-3 text-white font-semibold text-sm uppercase tracking-wider border-b border-white/5"
                  onClick={() => setMobileOpen(false)}
                >
                  Home
                </Link>
                <Link
                  href="/about"
                  className="px-4 py-3 text-white text-sm uppercase tracking-wider border-b border-white/5 hover:text-[#3B82F6]"
                  onClick={() => setMobileOpen(false)}
                >
                  About
                </Link>
                <Link
                  href="/partner-dna-360"
                  className="px-4 py-3 text-white text-sm uppercase tracking-wider border-b border-white/5 hover:text-[#3B82F6]"
                  onClick={() => setMobileOpen(false)}
                >
                  Partner DNA 360
                </Link>
                {partnerLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="pl-8 pr-4 py-2.5 text-gray-300 text-xs uppercase tracking-wider border-b border-white/5 hover:text-[#3B82F6]"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href="/services"
                  className="px-4 py-3 text-white text-sm uppercase tracking-wider border-b border-white/5 hover:text-[#3B82F6]"
                  onClick={() => setMobileOpen(false)}
                >
                  Services
                </Link>
                <Link
                  href="/trainers"
                  className="px-4 py-3 text-white text-sm uppercase tracking-wider border-b border-white/5 hover:text-[#3B82F6]"
                  onClick={() => setMobileOpen(false)}
                >
                  Trainers
                </Link>
                <Link
                  href="/gallery"
                  className="px-4 py-3 text-white text-sm uppercase tracking-wider border-b border-white/5 hover:text-[#3B82F6]"
                  onClick={() => setMobileOpen(false)}
                >
                  Gallery
                </Link>
                <Link
                  href="/contact"
                  className="px-4 py-3 text-white text-sm uppercase tracking-wider border-b border-white/5 hover:text-[#3B82F6]"
                  onClick={() => setMobileOpen(false)}
                >
                  Contact Us
                </Link>
                <div className="p-4">
                  <Link
                    href="/login"
                    className="block w-full text-center px-4 py-3 rounded-lg bg-[#00c8c8] hover:bg-[#00b4b4] text-black font-bold text-sm uppercase tracking-wider transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    Member Portal / Login
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  )
}
