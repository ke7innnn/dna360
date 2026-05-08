import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/sections/Footer'
import { trainers } from '@/data/trainers'

export function generateStaticParams() {
  return trainers.map((t) => ({
    slug: t.slug,
  }))
}

export default function TrainerDetail({ params }: { params: { slug: string } }) {
  const trainer = trainers.find((t) => t.slug === params.slug)

  if (!trainer) {
    notFound()
  }

  return (
    <>
      <Navbar />
      <main className="bg-[#0a0a0a] min-h-screen pt-[70px]">
        {/* Banner Section */}
        <section
          className="relative h-[250px] lg:h-[300px] w-full flex items-center bg-cover bg-center"
          style={{ backgroundImage: 'url(/images/trainer-header-image.jpg)' }}
        >
          <div className="absolute inset-0 bg-black/60"></div>
          <div className="max-w-7xl mx-auto px-4 w-full relative z-10 flex flex-col md:flex-row justify-between items-center text-white">
            <h1 className="text-4xl lg:text-5xl font-black font-montserrat uppercase tracking-wider mb-2 md:mb-0">
              {trainer.name}
            </h1>
            <p className="font-montserrat font-semibold text-sm lg:text-base">
              <Link href="/" className="hover:text-[#00c8c8] transition-colors">Home</Link> /{' '}
              <Link href="/trainers" className="hover:text-[#00c8c8] transition-colors">Trainers</Link> /{' '}
              {trainer.name}
            </p>
          </div>
        </section>

        {/* Details Section */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
              
              {/* Left Column: Image */}
              <div className="lg:col-span-5">
                <img
                  src={trainer.imageDetail}
                  alt={trainer.name}
                  className="w-full h-auto object-cover brightness-110 contrast-105"
                />
              </div>

              {/* Right Column: Info */}
              <div className="lg:col-span-7 flex flex-col justify-center">
                <h2 className="text-4xl lg:text-5xl font-black font-montserrat text-white mb-8">
                  {trainer.name}
                </h2>

                {trainer.experience && (
                  <div className="mb-8">
                    <h3 className="text-[#00c8c8] font-black font-montserrat uppercase tracking-widest text-lg mb-3">
                      Experience:
                    </h3>
                    <p className="text-[#ccc] font-opensans text-base leading-relaxed">
                      {trainer.experience}
                    </p>
                  </div>
                )}

                {trainer.qualifications.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-[#00c8c8] font-black font-montserrat uppercase tracking-widest text-lg mb-4">
                      Qualifications:
                    </h3>
                    <ul className="space-y-3">
                      {trainer.qualifications.map((q, idx) => (
                        <li key={idx} className="flex items-start text-[#ccc] font-opensans text-base">
                          <span className="text-[#00c8c8] mr-3 font-bold">✓</span>
                          <span>{q}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {trainer.specialties.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-[#00c8c8] font-black font-montserrat uppercase tracking-widest text-lg mb-4">
                      Speciality Areas:
                    </h3>
                    <ul className="space-y-3">
                      {trainer.specialties.map((s, idx) => (
                        <li key={idx} className="flex items-start text-[#ccc] font-opensans text-base">
                          <span className="text-[#e63946] mr-3 font-bold">▹</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {trainer.about && (
                  <div className="mb-8">
                    <h3 className="text-[#00c8c8] font-black font-montserrat uppercase tracking-widest text-lg mb-3">
                      About My Services:
                    </h3>
                    <p className="text-[#ccc] font-opensans text-base leading-relaxed">
                      {trainer.about}
                    </p>
                  </div>
                )}

              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
