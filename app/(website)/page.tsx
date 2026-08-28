'use client'

import Navbar from '@/components/Navbar'
import Hero from '@/components/sections/Hero'
import About from '@/components/sections/About'
import Services from '@/components/sections/Services'
import WhyChoose from '@/components/sections/WhyChoose'
import Videos from '@/components/sections/Videos'
import Testimonials from '@/components/sections/Testimonials'
import Stats from '@/components/sections/Stats'
import Footer from '@/components/sections/Footer'

export default function HomePage() {
  return (
    <main>
      <Navbar />
      <Hero />
      <About />
      <Services />
      <WhyChoose />
      <Videos />
      <Testimonials />
      <Stats />
      <Footer />
    </main>
  )
}
