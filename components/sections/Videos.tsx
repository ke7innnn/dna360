'use client'

import { motion } from 'framer-motion'

const videos = [
  {
    id: 'video-showreel',
    embedUrl: 'https://www.youtube.com/embed/3EU76wj0M9I',
    caption: 'DNA 360 Showreel',
  },
  {
    id: 'video-experience',
    embedUrl: 'https://www.youtube.com/embed/_duotUR9NXw',
    caption: 'DNA 360 Experience',
  },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.2 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

export default function Videos() {
  return (
    <section id="videos" className="bg-[#111111] py-20 px-4">
      {/* Heading */}
      <motion.div
        className="text-center mb-14"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-4xl lg:text-5xl font-black font-montserrat mb-4">
          <span className="text-white">Let&apos;s check out </span>
          <span className="text-[#00c8c8]">DNA 360</span>
        </h2>
        <div className="w-14 h-1 bg-[#00c8c8] mx-auto" />
      </motion.div>

      {/* Videos grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
      >
        {videos.map((video) => (
          <motion.div key={video.id} id={video.id} variants={itemVariants}>
            {/* 16:9 wrapper */}
            <div className="relative w-full overflow-hidden rounded-lg" style={{ paddingBottom: '56.25%', height: 0 }}>
              <iframe
                src={video.embedUrl}
                title={video.caption}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute top-0 left-0 w-full h-full border-0 rounded-lg"
              />
            </div>
            <p className="text-white font-bold font-montserrat mt-4 text-lg">
              {video.caption}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
