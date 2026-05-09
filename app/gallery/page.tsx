'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import Footer from '@/components/sections/Footer'

// All 53 gallery images locally saved from original site
const galleryImages = Array.from({ length: 53 }, (_, i) => {
  const num = (i + 1).toString().padStart(2, '0')
  return `/images/gallery/${num}.jpg`
})

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } },
}

export default function GalleryPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  return (
    <>
      <Navbar />
      <main className="bg-[#0a0a0a] min-h-screen pt-[140px] pb-20">
        <div className="max-w-7xl mx-auto px-4">
          {/* Heading */}
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl lg:text-6xl font-black font-montserrat mb-4">
              <span className="text-white">Our </span>
              <span className="text-[#00c8c8]">Gallery</span>
            </h1>
            <div className="w-14 h-1 bg-[#00c8c8] mx-auto" />
          </motion.div>

          {/* Masonry / Grid Gallery */}
          <motion.div
            className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {galleryImages.map((src, index) => (
              <motion.div
                key={src}
                variants={itemVariants}
                className="relative overflow-hidden group cursor-pointer break-inside-avoid"
                onClick={() => setSelectedImage(src)}
              >
                <div className="relative w-full overflow-hidden border-2 border-transparent group-hover:border-[#00c8c8] transition-colors duration-300">
                  <Image
                    src={src}
                    alt={`DNA 360 Gallery Image ${index + 1}`}
                    width={500}
                    height={500}
                    unoptimized
                    className="w-full h-auto object-cover transform transition-transform duration-500 group-hover:scale-110"
                  />
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-[#00c8c8]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Lightbox Modal */}
        <AnimatePresence>
          {selectedImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 sm:p-10"
              onClick={() => setSelectedImage(null)}
            >
              <button
                className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center text-white hover:text-[#00c8c8] bg-white/10 rounded-full transition-colors z-50"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedImage(null)
                }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative max-w-5xl w-full max-h-full flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  src={selectedImage}
                  alt="Enlarged view"
                  width={1200}
                  height={800}
                  unoptimized
                  className="w-auto h-auto max-w-full max-h-[85vh] object-contain border-4 border-[#1a1a1a]"
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <Footer />
    </>
  )
}
