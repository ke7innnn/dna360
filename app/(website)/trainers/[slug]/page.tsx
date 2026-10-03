import { notFound } from 'next/navigation'
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

  const roleColors: Record<string, { bg: string; text: string; border: string }> = {
    'Head Coach': { bg: 'bg-[#9AE66E]', text: 'text-black', border: 'border-[#9AE66E]/40' },
    'Premium Coach': { bg: 'bg-[#F8A8B4]', text: 'text-black', border: 'border-[#F8A8B4]/40' },
    'Elite Coach': { bg: 'bg-[#E5C77A]', text: 'text-black', border: 'border-[#E5C77A]/40' },
    'Super Elite Coach': { bg: 'bg-[#C6DD76]', text: 'text-black', border: 'border-[#C6DD76]/40' },
  }

  const roleStyle = roleColors[trainer.role] || { bg: 'bg-[#00c8c8]', text: 'text-black', border: 'border-[#00c8c8]/40' }
  const firstName = trainer.name.split(' ')[0]
  const whatsappMessage = encodeURIComponent(
    `Hi DNA 360, I would like to enquire about Personal Training with Coach ${trainer.name} (${trainer.role}).`
  )
  const whatsappUrl = `https://wa.me/919324462384?text=${whatsappMessage}`

  return (
    <>
      <Navbar />
      <main className="bg-[#08080a] min-h-screen pt-[100px] text-white">
        {/* Breadcrumb & Navigation Strip */}
        <div className="border-b border-white/10 bg-[#0d0d10]/80 backdrop-blur-md sticky top-[80px] z-30">
          <div className="max-w-7xl mx-auto px-4 py-3.5 flex items-center justify-between">
            <Link
              href="/trainers"
              className="inline-flex items-center gap-2 text-xs font-montserrat font-bold uppercase tracking-wider text-white/70 hover:text-[#00c8c8] transition-colors group"
            >
              <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Coaches</span>
            </Link>

            <div className="hidden sm:flex items-center gap-2 text-xs font-montserrat text-white/40">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <Link href="/trainers" className="hover:text-white transition-colors">Trainers</Link>
              <span>/</span>
              <span className="text-[#00c8c8] font-bold">{trainer.name}</span>
            </div>
          </div>
        </div>

        {/* Ambient Hero Glow */}
        <div className="relative overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#00c8c8]/5 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute top-20 right-1/4 w-[400px] h-[400px] bg-[#3B82F6]/5 rounded-full blur-[120px] pointer-events-none" />

          {/* Dossier Content Section */}
          <div className="max-w-7xl mx-auto px-4 py-12 lg:py-16 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
              
              {/* LEFT COLUMN: Sticky Coach Profile Card */}
              <div className="lg:col-span-5 lg:sticky lg:top-[145px]">
                <div className="bg-[#121216] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
                  
                  {/* Photo Enclosure */}
                  <div className="relative aspect-[4/5] w-full bg-[#1b1b22] overflow-hidden">
                    {trainer.imageDetail || trainer.imageMain ? (
                      <img
                        src={trainer.imageDetail || trainer.imageMain}
                        alt={trainer.name}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#15151a] to-[#252530] relative">
                        <div className="w-32 h-32 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3 shadow-inner">
                          <span className="text-[#00c8c8] text-5xl font-black font-montserrat tracking-tight">
                            {trainer.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <span className="text-white/40 text-xs font-black font-montserrat uppercase tracking-[0.2em]">DNA 360 Coach</span>
                      </div>
                    )}

                    {/* Gradient Vignette */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121216] via-transparent to-black/30 pointer-events-none" />

                    {/* Role Tag Top-Left */}
                    <div className="absolute top-4 left-4 z-10">
                      <div className={`inline-flex items-center gap-1.5 ${roleStyle.bg} ${roleStyle.text} px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider shadow-xl`}>
                        <span>{trainer.role}</span>
                      </div>
                    </div>

                    {/* Official Stamp Top-Right */}
                    <div className="absolute top-4 right-4 z-10 w-14 h-14 border-[2px] border-[#4ade80] rounded-full flex flex-col items-center justify-center -rotate-12 bg-black/50 backdrop-blur-md shadow-2xl">
                      <span className="text-[#4ade80] text-[5px] font-bold tracking-widest uppercase mb-0.5">DNA 360</span>
                      <span className="text-[#4ade80] text-[8px] font-black tracking-tighter uppercase leading-none">Approved</span>
                    </div>

                    {/* Name Overlay at base of image */}
                    <div className="absolute bottom-4 left-5 right-5 z-10">
                      <h2 className="text-2xl lg:text-3xl font-black font-montserrat text-white uppercase tracking-tight drop-shadow-md">
                        {trainer.name}
                      </h2>
                      <p className="text-[#00c8c8] font-montserrat text-xs uppercase font-bold tracking-widest mt-0.5">
                        DNA 360 Certified Faculty
                      </p>
                    </div>
                  </div>

                  {/* Vitals Summary Strip */}
                  <div className="p-6 border-t border-white/5 bg-[#14141a]">
                    <div className="grid grid-cols-3 gap-3 text-center mb-6 py-3 px-2 rounded-2xl bg-white/[0.03] border border-white/5">
                      <div>
                        <div className="text-[10px] font-montserrat uppercase tracking-wider text-white/40 mb-1">Status</div>
                        <div className="text-xs font-black font-montserrat text-[#4ade80] flex items-center justify-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" />
                          <span>Active</span>
                        </div>
                      </div>
                      <div className="border-x border-white/10">
                        <div className="text-[10px] font-montserrat uppercase tracking-wider text-white/40 mb-1">Credentials</div>
                        <div className="text-xs font-black font-montserrat text-white">
                          {trainer.qualifications.length > 0 ? `${trainer.qualifications.length} Certified` : 'Verified'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-montserrat uppercase tracking-wider text-white/40 mb-1">Focus</div>
                        <div className="text-xs font-black font-montserrat text-[#00c8c8]">
                          {trainer.specialties.length > 0 ? `${trainer.specialties.length} Disciplines` : '1-on-1 PT'}
                        </div>
                      </div>
                    </div>

                    {/* Direct Action Buttons */}
                    <div className="space-y-3">
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-4 px-6 rounded-2xl bg-[#00c8c8] hover:bg-white text-black font-black font-montserrat text-xs uppercase tracking-widest transition-all duration-300 shadow-[0_0_25px_rgba(0,200,200,0.35)] flex items-center justify-center gap-2 group"
                      >
                        <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                        </svg>
                        <span>Book 1-on-1 Trial Session</span>
                      </a>

                      <a
                        href="tel:+919324462384"
                        className="w-full py-3.5 px-6 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-montserrat font-bold text-xs uppercase tracking-wider transition-all duration-200 border border-white/10 flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4 text-[#00c8c8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span>Reception: +91 93244 62384</span>
                      </a>
                    </div>

                    <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-center text-center text-[11px] text-white/40 font-montserrat">
                      <span>📍 DNA 360 Hiranandani Knowledge Park, Powai</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* RIGHT COLUMN: Rich Coach Curriculum & Dossier */}
              <div className="lg:col-span-7 space-y-8">
                
                {/* Header Block */}
                <div>
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-[#00c8c8] text-xs font-montserrat font-black uppercase tracking-widest mb-4">
                    <span className="w-2 h-2 rounded-full bg-[#00c8c8] shadow-[0_0_8px_#00c8c8]" />
                    <span>DNA 360 Certified Master Coach</span>
                  </div>
                  <h1 className="text-4xl lg:text-6xl font-black font-montserrat text-white tracking-tight uppercase mb-3">
                    {trainer.name}
                  </h1>
                  <p className="text-white/60 font-opensans text-base lg:text-lg leading-relaxed max-w-2xl">
                    Dedicated fitness professional committed to scientific biomechanics, metabolic optimization, and sustainable lifestyle transformation at DNA 360.
                  </p>
                </div>

                {/* Experience Highlight Card */}
                {trainer.experience ? (
                  <div className="p-6 rounded-2xl bg-gradient-to-r from-[#14141c] to-[#191925] border border-white/10 shadow-lg flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#00c8c8]/10 border border-[#00c8c8]/30 flex items-center justify-center shrink-0 text-[#00c8c8]">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xs font-montserrat font-black uppercase tracking-widest text-[#00c8c8] mb-1">
                        Professional Track Record
                      </h3>
                      <p className="text-white font-montserrat font-bold text-lg leading-snug">
                        {trainer.experience}
                      </p>
                    </div>
                  </div>
                ) : null}

                {/* Speciality Areas */}
                {trainer.specialties.length > 0 && (
                  <div className="bg-[#121216] border border-white/10 rounded-3xl p-7 shadow-xl">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#00c8c8]/15 border border-[#00c8c8]/30 flex items-center justify-center text-[#00c8c8]">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <h2 className="text-xl font-black font-montserrat text-white uppercase tracking-wider">
                          Speciality Areas
                        </h2>
                      </div>
                      <span className="text-xs font-montserrat font-bold text-white/40 uppercase tracking-widest">
                        {trainer.specialties.length} Disciplines
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {trainer.specialties.map((specialty, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3.5 p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-[#00c8c8]/40 hover:bg-[#00c8c8]/5 transition-all duration-200 group"
                        >
                          <div className="w-7 h-7 rounded-md bg-[#00c8c8]/20 flex items-center justify-center text-[#00c8c8] shrink-0 font-black text-xs group-hover:scale-110 transition-transform">
                            ✓
                          </div>
                          <span className="font-montserrat font-bold text-sm text-white/90 group-hover:text-white transition-colors">
                            {specialty}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Verified Qualifications */}
                {trainer.qualifications.length > 0 && (
                  <div className="bg-[#121216] border border-white/10 rounded-3xl p-7 shadow-xl">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#4ade80]/15 border border-[#4ade80]/30 flex items-center justify-center text-[#4ade80]">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </div>
                        <h2 className="text-xl font-black font-montserrat text-white uppercase tracking-wider">
                          Verified Certifications & Credentials
                        </h2>
                      </div>
                      <span className="text-xs font-montserrat font-bold text-[#4ade80] uppercase tracking-widest flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#4ade80]" />
                        <span>Verified</span>
                      </span>
                    </div>

                    <div className="space-y-3">
                      {trainer.qualifications.map((q, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3.5 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition-all duration-200"
                        >
                          <div className="w-5 h-5 rounded-full bg-[#00c8c8]/20 text-[#00c8c8] flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                            ✓
                          </div>
                          <span className="text-white/85 font-opensans text-sm leading-relaxed">
                            {q}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* About / Coaching Philosophy */}
                {trainer.about ? (
                  <div className="bg-[#121216] border border-white/10 rounded-3xl p-7 shadow-xl">
                    <h2 className="text-xl font-black font-montserrat text-white uppercase tracking-wider mb-4 pb-3 border-b border-white/5">
                      About Coaching Services
                    </h2>
                    <p className="text-white/80 font-opensans text-base leading-relaxed">
                      {trainer.about}
                    </p>
                  </div>
                ) : null}

                {/* VIP Consultation CTA Banner */}
                <div className="relative rounded-3xl overflow-hidden p-8 border-2 border-[#00c8c8]/30 bg-gradient-to-br from-[#0c1f24] via-[#10141a] to-[#0c131a] shadow-[0_0_50px_rgba(0,200,200,0.15)]">
                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                      <div className="inline-block text-[#00c8c8] text-[10px] font-black font-montserrat uppercase tracking-[0.2em] mb-2">
                        Transform With {trainer.name}
                      </div>
                      <h3 className="text-2xl lg:text-3xl font-black font-montserrat text-white uppercase tracking-tight mb-2">
                        Start Your DNA 360 Journey
                      </h3>
                      <p className="text-white/60 font-opensans text-xs lg:text-sm max-w-md leading-relaxed">
                        Experience precision biometrics, posture correction, and personalized progressive overload supervised by certified experts at Powai.
                      </p>
                    </div>

                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 px-8 py-4 rounded-2xl bg-[#00c8c8] hover:bg-white text-black font-black font-montserrat text-xs uppercase tracking-widest transition-all duration-300 shadow-[0_0_25px_rgba(0,200,200,0.4)] flex items-center gap-2 group"
                    >
                      <span>Claim Trial Session</span>
                      <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </a>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
