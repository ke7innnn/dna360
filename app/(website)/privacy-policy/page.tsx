'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/sections/Footer'

export default function PrivacyPolicyPage() {
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
                <span>Privacy Policy</span>
              </div>
              <h1 className="text-3xl lg:text-5xl font-black font-montserrat uppercase tracking-wider text-white">
                Privacy Policy
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
              At <strong className="text-white">DNA 360 Fitness Centre</strong> (&quot;DNA 360&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), your privacy is of utmost importance to us. This Privacy Policy outlines how we collect, use, disclose, and safeguard your personal information when you visit our fitness center in Powai, Mumbai, utilize our website (<span className="text-[#00c8c8]">dna360.in</span>), engage with our member mobile web application, or purchase memberships and personal training packages.
            </p>
          </div>

          {/* Section 1 */}
          <div className="space-y-3">
            <h2 className="text-xl lg:text-2xl font-bold font-montserrat text-white uppercase tracking-wide flex items-center gap-2">
              <span className="text-[#00c8c8]">01.</span> Information We Collect
            </h2>
            <p className="text-[#aaa]">
              We collect information that you voluntarily provide to us when registering for a membership, booking personal training sessions, scheduling trial classes, or communicating with our team:
            </p>
            <ul className="list-disc list-inside space-y-2 text-[#ccc] pl-2">
              <li><strong className="text-white">Personal Identification:</strong> Full name, date of birth, gender, and government identification (where required for verification).</li>
              <li><strong className="text-white">Contact Details:</strong> Phone number, email address, emergency contact name and phone number, and residential address.</li>
              <li><strong className="text-white">Health & Fitness Profiles:</strong> Physical activity readiness questionnaire (PAR-Q), medical disclosures, fitness goals, and trainer assessment notes to ensure workout safety.</li>
              <li><strong className="text-white">Access & Attendance Data:</strong> Dynamic rolling QR check-in logs, entry/exit timestamps, and class attendance records.</li>
              <li><strong className="text-white">Billing & Payment Information:</strong> Billing address, membership plan selected, invoice records, and payment gateway transaction references. <em className="text-[#00c8c8]">We do not store your credit card, debit card, or UPI PIN details on our servers.</em></li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <h2 className="text-xl lg:text-2xl font-bold font-montserrat text-white uppercase tracking-wide flex items-center gap-2">
              <span className="text-[#00c8c8]">02.</span> How We Use Your Information
            </h2>
            <p className="text-[#aaa]">
              The information we collect is utilized strictly for lawful fitness center operations, including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-[#ccc] pl-2">
              <li>Administering and managing your gym membership, digital ID pass, and locker allocations.</li>
              <li>Processing membership subscriptions, renewals, personal training packages, and cafe billing.</li>
              <li>Providing workout schedule alerts, booking confirmations, and membership expiry reminders via SMS or WhatsApp.</li>
              <li>Ensuring emergency medical readiness and safety while on the gym floor.</li>
              <li>Enhancing our facilities, equipment offerings, and customer support services.</li>
              <li>Complying with applicable statutory, tax, and legal obligations in India.</li>
            </ul>
          </div>

          {/* Section 3 - Razorpay & Payment Security */}
          <div className="space-y-3 border-l-2 border-[#00c8c8] pl-5 py-2">
            <h2 className="text-xl lg:text-2xl font-bold font-montserrat text-white uppercase tracking-wide flex items-center gap-2">
              <span className="text-[#00c8c8]">03.</span> Online Payments & Razorpay Security
            </h2>
            <p className="text-[#aaa]">
              All online payments made through our website or application are securely routed through our payment gateway partner, <strong className="text-white">Razorpay Software Private Limited</strong>.
            </p>
            <p className="text-[#aaa]">
              Razorpay adheres to the highest industry standards, including the <strong className="text-white">Payment Card Industry Data Security Standard (PCI-DSS)</strong> Level 1 certification. Your sensitive cardholder data, net banking credentials, and UPI authorizations are encrypted and handled solely by Razorpay and your issuing bank. DNA 360 does not view, collect, or store any sensitive payment card numbers, CVVs, or banking passwords.
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-3">
            <h2 className="text-xl lg:text-2xl font-bold font-montserrat text-white uppercase tracking-wide flex items-center gap-2">
              <span className="text-[#00c8c8]">04.</span> Sharing & Disclosure of Information
            </h2>
            <p className="text-[#aaa]">
              We do not sell, rent, or trade your personal information to third parties. We may disclose your information only under the following limited circumstances:
            </p>
            <ul className="list-disc list-inside space-y-2 text-[#ccc] pl-2">
              <li><strong className="text-white">Authorized Service Providers:</strong> Trusted cloud infrastructure (Supabase), SMS/WhatsApp notification services, and payment processors who assist us in operating our platform under strict confidentiality agreements.</li>
              <li><strong className="text-white">Medical Emergencies:</strong> Emergency medical personnel or designated emergency contacts in the event of an acute injury or health incident on our premises.</li>
              <li><strong className="text-white">Legal Obligations:</strong> When mandated by applicable Indian law, court order, or governmental law enforcement agency.</li>
            </ul>
          </div>

          {/* Section 5 */}
          <div className="space-y-3">
            <h2 className="text-xl lg:text-2xl font-bold font-montserrat text-white uppercase tracking-wide flex items-center gap-2">
              <span className="text-[#00c8c8]">05.</span> Data Retention & Security
            </h2>
            <p className="text-[#aaa]">
              We implement comprehensive physical, electronic, and managerial procedures to safeguard your personal data against unauthorized access, alteration, or disclosure. Your membership and attendance records are stored in secure, encrypted cloud databases. We retain your personal data for as long as your membership is active or as needed to provide you services and satisfy tax or legal reporting requirements.
            </p>
          </div>

          {/* Section 6 */}
          <div className="space-y-3">
            <h2 className="text-xl lg:text-2xl font-bold font-montserrat text-white uppercase tracking-wide flex items-center gap-2">
              <span className="text-[#00c8c8]">06.</span> Your Rights & Grievances
            </h2>
            <p className="text-[#aaa]">
              You retain the right to review, update, or request the correction of any personal information held in our records. If you have any inquiries, requests, or privacy grievances, please contact our designated Grievance Officer:
            </p>
            <div className="bg-[#151515] border border-white/10 p-5 rounded-lg space-y-1 text-sm">
              <p><strong className="text-white">DNA 360 Fitness Centre</strong></p>
              <p className="text-[#aaa]">Attn: Grievance Officer / Privacy Support</p>
              <p className="text-[#aaa]">Address: 502, Hiranandani Knowledge Park, Hiranandani Gardens Powai, Mumbai – 400076, India</p>
              <p className="text-[#aaa]">Email: <a href="mailto:dna360fitness@gmail.com" className="text-[#00c8c8] hover:underline">dna360fitness@gmail.com</a></p>
              <p className="text-[#aaa]">Phone: <a href="tel:+919324462384" className="text-[#00c8c8] hover:underline">+91 93244 62384</a></p>
            </div>
          </div>

        </section>
      </main>
      <Footer />
    </>
  )
}
