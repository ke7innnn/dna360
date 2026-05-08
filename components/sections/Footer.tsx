'use client'

import Image from 'next/image'
import Link from 'next/link'

const footerLinks = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Partner DNA 360', href: '/partner-dna-360' },
  { label: 'Services', href: '/services' },
  { label: 'Trainers', href: '/trainers' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Contact Us', href: '/contact' },
]

export default function Footer() {
  return (
    <footer className="bg-[#0d0d0d] border-t-2 border-[#00c8c8]">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Col 1 - Logo + Tagline */}
          <div>
            <div className="mb-5">
              <Image
                src="http://www.dna360.in/assets/img/logo-2.png"
                alt="DNA 360 Fitness Logo"
                width={80}
                height={80}
                unoptimized
                className="object-contain"
              />
            </div>
            <p className="text-[#aaa] font-opensans text-sm leading-relaxed mb-4">
              DNA 360 we believe that fitness is a way of life.
            </p>
            <div className="border-t border-white/10 pt-4">
              <p className="text-[#00c8c8] font-montserrat font-bold text-sm uppercase tracking-wider mb-1">
                Gym Timings
              </p>
              <p className="text-white font-opensans text-sm">
                5:00 am – 12:00 am
              </p>
            </div>
          </div>

          {/* Col 2 - Social Media */}
          <div>
            <h4 className="text-white font-black font-montserrat uppercase tracking-wider text-base mb-6 relative pb-3 after:absolute after:bottom-0 after:left-0 after:w-8 after:h-0.5 after:bg-[#00c8c8]">
              Social Media
            </h4>
            <div className="flex flex-col gap-4">
              <a
                href="https://www.facebook.com/dna360fitness"
                target="_blank"
                rel="noopener noreferrer"
                id="footer-facebook"
                className="flex items-center gap-3 text-[#aaa] hover:text-[#00c8c8] transition-colors group"
              >
                <span className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center group-hover:border-[#00c8c8] transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </span>
                Facebook
              </a>
              <a
                href="https://www.instagram.com/dna360fitness"
                target="_blank"
                rel="noopener noreferrer"
                id="footer-instagram"
                className="flex items-center gap-3 text-[#aaa] hover:text-[#00c8c8] transition-colors group"
              >
                <span className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center group-hover:border-[#00c8c8] transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </span>
                Instagram
              </a>
              <a
                href="https://www.youtube.com/channel/UCIL51PkrBEW2xhqMCZewn2g"
                target="_blank"
                rel="noopener noreferrer"
                id="footer-youtube"
                className="flex items-center gap-3 text-[#aaa] hover:text-[#00c8c8] transition-colors group"
              >
                <span className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center group-hover:border-[#00c8c8] transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </span>
                YouTube
              </a>
            </div>
          </div>

          {/* Col 3 - Contact Us */}
          <div>
            <h4 className="text-white font-black font-montserrat uppercase tracking-wider text-base mb-6 relative pb-3 after:absolute after:bottom-0 after:left-0 after:w-8 after:h-0.5 after:bg-[#00c8c8]">
              Contact Us
            </h4>
            <div className="flex flex-col gap-4 text-[#aaa] font-opensans text-sm">
              <div>
                <p className="font-semibold text-white mb-1">Phone</p>
                <a href="tel:+919324462384" className="block hover:text-[#00c8c8] transition-colors">
                  +91 93244 62384
                </a>
                <a href="tel:02249691360" className="block hover:text-[#00c8c8] transition-colors">
                  022 4969 1360
                </a>
                <a href="tel:02249675663" className="block hover:text-[#00c8c8] transition-colors">
                  022 4967 5663
                </a>
              </div>
              <div>
                <p className="font-semibold text-white mb-1">Email</p>
                <a
                  href="mailto:dna360fitness@gmail.com"
                  className="hover:text-[#00c8c8] transition-colors"
                >
                  dna360fitness@gmail.com
                </a>
              </div>
              <div>
                <p className="font-semibold text-white mb-1">Address</p>
                <p className="leading-relaxed">
                  502, Hiranandani Knowledge Park,<br />
                  Hiranandani Gardens Powai,<br />
                  Mumbai – 400076, India.
                </p>
              </div>
            </div>
          </div>

          {/* Col 4 - Social Activity / FB embed placeholder */}
          <div>
            <h4 className="text-white font-black font-montserrat uppercase tracking-wider text-base mb-6 relative pb-3 after:absolute after:bottom-0 after:left-0 after:w-8 after:h-0.5 after:bg-[#00c8c8]">
              Social Activity
            </h4>
            <div className="bg-[#1a1a1a] border border-white/10 rounded p-4 flex flex-col items-center justify-center h-40 text-center">
              <svg className="w-10 h-10 text-[#00c8c8] mb-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <a
                href="https://www.facebook.com/dna360fitness"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#00c8c8] text-sm font-montserrat font-bold uppercase tracking-wider hover:underline"
              >
                DNA 360 Fitness
              </a>
              <p className="text-[#666] text-xs mt-1">Follow us on Facebook</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Links Row */}
      <div className="border-t border-white/10 py-4 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center gap-x-6 gap-y-2">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[#aaa] text-sm font-opensans hover:text-[#00c8c8] transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-white/5 py-4 px-4 text-center">
        <p className="text-[#666] font-opensans text-sm">
          DNA 360 Fitness © 2021. All Rights Reserved.
        </p>
      </div>
    </footer>
  )
}
