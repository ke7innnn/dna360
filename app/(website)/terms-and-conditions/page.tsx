'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/sections/Footer'

export default function TermsAndConditionsPage() {
  return (
    <>
      <Navbar />
      <main className="bg-[#0a0a0a] min-h-screen pt-[105px] text-[#e0e0e0]">
        {/* Banner Section */}
        <section
          className="relative h-[240px] lg:h-[300px] w-full flex items-center bg-cover bg-center"
          style={{ backgroundImage: 'url(/images/header-image.jpg)' }}
        >
          <div className="absolute inset-0 bg-black/80" />
          <div className="relative max-w-7xl mx-auto px-4 w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#00c8c8] font-semibold mb-3">
                <Link href="/" className="hover:underline text-[#aaa]">Home</Link>
                <span>/</span>
                <span>Terms & Conditions</span>
              </div>
              <h1 className="text-3xl lg:text-5xl font-black font-montserrat uppercase tracking-wider text-white">
                Terms & Conditions
              </h1>
              <p className="text-sm text-[#aaa] mt-2 font-opensans">
                Last updated: September 2026 | DNA 360 Fitness Centre
              </p>
            </motion.div>
          </div>
        </section>

        {/* Content Section */}
        <section className="max-w-4xl mx-auto px-4 py-16 font-opensans leading-relaxed text-sm lg:text-base space-y-10">
          
          <div className="bg-[#151515] border border-white/10 p-6 rounded-lg">
            <p className="text-[#ccc]">
              Welcome to <strong className="text-white">DNA 360 Fitness Centre</strong>. By enrolling as a member, purchasing services or personal training packages, accessing our 13,000 sq.ft. facility in Powai, Mumbai, or utilizing our website and web applications, you agree to comply with and be bound by the following terms and conditions. Please review them carefully.
            </p>
          </div>

          {/* Section 1 */}
          <div className="space-y-3">
            <h2 className="text-xl lg:text-2xl font-bold font-montserrat text-white uppercase tracking-wide flex items-center gap-2">
              <span className="text-[#00c8c8]">01.</span> Membership Eligibility & Access
            </h2>
            <ul className="list-disc list-inside space-y-2 text-[#ccc] pl-2">
              <li>Members must be at least 18 years of age. Individuals aged 14 to 17 may join solely with written consent and indemnity signed by a parent or legal guardian.</li>
              <li>Membership is strictly <strong className="text-white">personal, non-transferable, and non-assignable</strong> to any other individual without prior written management approval.</li>
              <li>Facility entry requires authenticating via the DNA 360 dynamic QR check-in code on your registered mobile device. Lending your account or QR code to non-members will result in immediate termination without refund.</li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <h2 className="text-xl lg:text-2xl font-bold font-montserrat text-white uppercase tracking-wide flex items-center gap-2">
              <span className="text-[#00c8c8]">02.</span> Health, Fitness & Assumption of Risk
            </h2>
            <ul className="list-disc list-inside space-y-2 text-[#ccc] pl-2">
              <li>Physical exercise, weight training, cardiovascular conditioning, reformer pilates, spinning, and ice bath therapy involve inherent risks of physical injury.</li>
              <li>Members represent and warrant that they are in good physical condition and have consulted a qualified medical physician prior to commencing any strenuous exercise program.</li>
              <li>You agree to participate entirely at your own risk. DNA 360, its owners, directors, and trainers shall not be liable for any injury, accident, or aggravation of pre-existing health conditions sustained on the premises.</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="space-y-3">
            <h2 className="text-xl lg:text-2xl font-bold font-montserrat text-white uppercase tracking-wide flex items-center gap-2">
              <span className="text-[#00c8c8]">03.</span> Facility Rules & Code of Conduct
            </h2>
            <ul className="list-disc list-inside space-y-2 text-[#ccc] pl-2">
              <li><strong className="text-white">Appropriate Attire:</strong> Clean athletic wear and closed-toe workout shoes must be worn on the gym floor at all times. Outdoor footwear is prohibited on studio flooring.</li>
              <li><strong className="text-white">Hygiene & Courtesy:</strong> Members must carry a workout towel and wipe down equipment, benches, and machines after each set. Free weights and dumbbells must be re-racked in their designated holders.</li>
              <li><strong className="text-white">Prohibited Conduct:</strong> Aggressive behavior, harassment of staff or members, filming other individuals without consent, or using illicit substances will result in immediate expulsion and permanent ban.</li>
              <li><strong className="text-white">Operating Timings:</strong> Monday to Saturday: 5:30 am to 12:00 am; Sunday: 5:30 am to 11:00 pm. Members must vacate the floor by the designated closing hour.</li>
            </ul>
          </div>

          {/* Section 4 - Fees & Payment Terms */}
          <div className="space-y-3 border-l-2 border-[#00c8c8] pl-5 py-2">
            <h2 className="text-xl lg:text-2xl font-bold font-montserrat text-white uppercase tracking-wide flex items-center gap-2">
              <span className="text-[#00c8c8]">04.</span> Membership Fees & Payment Processing
            </h2>
            <p className="text-[#aaa]">
              All membership plans, renewal fees, personal training packages, and cafe dues are payable in advance before service commencement.
            </p>
            <ul className="list-disc list-inside space-y-2 text-[#ccc] pl-2">
              <li>Online payments are processed securely through our authorized payment gateway partner, <strong className="text-white">Razorpay</strong>, supporting Credit Cards, Debit Cards, Net Banking, and UPI.</li>
              <li>All quoted prices are subject to applicable Goods and Services Tax (GST) as mandated by the Government of India.</li>
              <li>Tax invoices are generated electronically and made accessible via your member dashboard and registered email.</li>
            </ul>
          </div>

          {/* Section 5 */}
          <div className="space-y-3">
            <h2 className="text-xl lg:text-2xl font-bold font-montserrat text-white uppercase tracking-wide flex items-center gap-2">
              <span className="text-[#00c8c8]">05.</span> Lockers & Personal Property
            </h2>
            <p className="text-[#aaa]">
              Daily day-lockers are provided for member convenience while working out on the premises. Lockers must be emptied before leaving the facility at the end of each session. DNA 360 accepts no responsibility or liability for lost, stolen, or damaged personal belongings, cash, jewelry, or electronics kept inside lockers or within the facility.
            </p>
          </div>

          {/* Section 6 */}
          <div className="space-y-3">
            <h2 className="text-xl lg:text-2xl font-bold font-montserrat text-white uppercase tracking-wide flex items-center gap-2">
              <span className="text-[#00c8c8]">06.</span> Personal Training & Specialist Classes
            </h2>
            <p className="text-[#aaa]">
              Personal training (PT) sessions and specialty classes (Reformer Pilates, Spinning) must be scheduled in advance with assigned trainers. Only certified trainers employed or authorized by DNA 360 are permitted to provide personal coaching within our premises. Unauthorized personal training by third parties or members is strictly prohibited.
            </p>
          </div>

          {/* Section 7 */}
          <div className="space-y-3">
            <h2 className="text-xl lg:text-2xl font-bold font-montserrat text-white uppercase tracking-wide flex items-center gap-2">
              <span className="text-[#00c8c8]">07.</span> Governing Law & Jurisdiction
            </h2>
            <p className="text-[#aaa]">
              These Terms & Conditions are governed by and construed in accordance with the laws of the Republic of India. Any disputes, claims, or legal proceedings arising under or related to your membership or facility use shall be subject to the exclusive jurisdiction of the competent courts located in <strong className="text-white">Mumbai, Maharashtra</strong>.
            </p>
          </div>

          {/* Contact Details */}
          <div className="bg-[#151515] border border-white/10 p-5 rounded-lg space-y-1 text-sm">
            <p><strong className="text-white">DNA 360 Fitness Centre</strong></p>
            <p className="text-[#aaa]">Address: 502, Hiranandani Knowledge Park, Hiranandani Gardens Powai, Mumbai – 400076, India</p>
            <p className="text-[#aaa]">Email: <a href="mailto:dna360fitness@gmail.com" className="text-[#00c8c8] hover:underline">dna360fitness@gmail.com</a></p>
            <p className="text-[#aaa]">Phone: <a href="tel:+919324462384" className="text-[#00c8c8] hover:underline">+91 93244 62384</a></p>
          </div>

        </section>
      </main>
      <Footer />
    </>
  )
}
