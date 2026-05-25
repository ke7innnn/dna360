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
      <main className="bg-[#0a0a0a] min-h-screen pt-[105px]">
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
                <div className="overflow-hidden rounded-xl border border-white/10 shadow-2xl">
                  {trainer.imageDetail ? (
                    <img
                      src={trainer.imageDetail}
                      alt={trainer.name}
                      className="w-full h-auto object-cover scale-110"
                    />
                  ) : (
                    <div className="w-full h-[450px] bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] flex flex-col items-center justify-center relative overflow-hidden">
                      <div className="absolute w-48 h-48 rounded-full bg-[#00c8c8]/5 blur-3xl top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                      <div className="w-28 h-28 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3 z-10 shadow-inner">
                        <span className="text-[#00c8c8] text-5xl font-black font-montserrat tracking-tight">
                          {trainer.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <span className="text-white/40 text-xs font-black font-montserrat uppercase tracking-[0.2em] z-10">DNA 360 Coach</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Info */}
              <div className="lg:col-span-7 flex flex-col justify-center">
                <div className="mb-8">
                  <h2 className="text-4xl lg:text-6xl font-black font-montserrat text-white mb-2 leading-tight">
                    {trainer.name}
                  </h2>
                  <div className="inline-block bg-[#00c8c8] text-black font-black uppercase tracking-widest text-xs px-4 py-1.5 rounded-full">
                    {trainer.role}
                  </div>
                </div>

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
                          <span className="text-[#00c8c8] mr-3 font-bold shrink-0">✓</span>
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
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {trainer.specialties.map((s, idx) => (
                        <li key={idx} className="flex items-center text-[#ccc] font-opensans text-base bg-white/5 p-3 rounded-lg border border-white/10">
                          <span className="text-[#00c8c8] mr-3 font-bold">▹</span>
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
