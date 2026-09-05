'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/sections/Footer'

export default function CancellationRefundPolicyPage() {
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
                <span>Cancellation & Refund Policy</span>
              </div>
              <h1 className="text-3xl lg:text-5xl font-black font-montserrat uppercase tracking-wider text-white">
                Cancellation & Refund Policy
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
              At <strong className="text-white">DNA 360 Fitness Centre</strong>, we strive to provide transparent, equitable, and professional service across all memberships, personal training sessions, and wellness programs. This Cancellation & Refund Policy outlines the terms governing membership cancellations, freeze requests, personal training rescheduling, and refund processing.
            </p>
          </div>

          {/* Section 1 */}
          <div className="space-y-3">
            <h2 className="text-xl lg:text-2xl font-bold font-montserrat text-white uppercase tracking-wide flex items-center gap-2">
              <span className="text-[#00c8c8]">01.</span> Membership Cancellation
            </h2>
            <ul className="list-disc list-inside space-y-2 text-[#ccc] pl-2">
              <li><strong className="text-white">Cooling-Off Cancellation:</strong> If you purchase a membership online and wish to cancel prior to your membership start date or within 24 hours of purchase (provided you have not checked into the gym or utilized the facilities), you are eligible for a full refund minus a 5% administrative and payment gateway processing fee.</li>
              <li><strong className="text-white">Active Memberships:</strong> Once a membership has commenced or the member has checked into the facility, memberships are considered active and are <strong className="text-white">non-refundable</strong>. Memberships cannot be prorated or terminated midway for cash refunds, as facility slots, capacity limits, and operational resources are reserved in advance.</li>
              <li><strong className="text-white">How to Submit a Request:</strong> All cancellation requests must be submitted in writing by emailing <a href="mailto:dna360fitness@gmail.com" className="text-[#00c8c8] hover:underline">dna360fitness@gmail.com</a> or in person at the DNA 360 front desk in Powai, quoting your registered Member ID and mobile number.</li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <h2 className="text-xl lg:text-2xl font-bold font-montserrat text-white uppercase tracking-wide flex items-center gap-2">
              <span className="text-[#00c8c8]">02.</span> Membership Freeze / Suspension Policy
            </h2>
            <p className="text-[#aaa]">
              We understand that unforeseen life events, medical procedures, or extended travel may interrupt your routine. Rather than losing your membership tenure, active annual and semi-annual members may apply to freeze their membership under the following guidelines:
            </p>
            <ul className="list-disc list-inside space-y-2 text-[#ccc] pl-2">
              <li><strong className="text-white">Medical Pause:</strong> In the event of prolonged illness, fracture, or surgical recovery, memberships may be frozen for up to 60 days upon presenting a verified medical certificate from a registered medical practitioner.</li>
              <li><strong className="text-white">Travel Pause:</strong> Members with annual packages may request a single freeze of up to 30 days by providing advance written notice of at least 7 days before departure.</li>
              <li>Membership tenure will be extended corresponding to the exact duration of the approved freeze period.</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="space-y-3">
            <h2 className="text-xl lg:text-2xl font-bold font-montserrat text-white uppercase tracking-wide flex items-center gap-2">
              <span className="text-[#00c8c8]">03.</span> Personal Training & Class Cancellations
            </h2>
            <ul className="list-disc list-inside space-y-2 text-[#ccc] pl-2">
              <li><strong className="text-white">24-Hour Rescheduling Notice:</strong> To cancel or reschedule a one-on-one Personal Training (PT) session or specialty class (Reformer Pilates, Spinning), members must notify their assigned trainer or the front desk at least 24 hours prior to the scheduled session.</li>
              <li><strong className="text-white">Late Cancellations & No-Shows:</strong> Cancellations made with less than 24 hours notice or unattended sessions will be charged and deducted as an attended session from your package balance.</li>
              <li><strong className="text-white">Trainer Unavailability:</strong> If your assigned trainer is unavailable due to sickness or emergency, DNA 360 will provide an equally qualified substitute trainer or reschedule the session at your earliest convenience without penalty.</li>
            </ul>
          </div>

          {/* Section 4 - Refund Processing & Razorpay */}
          <div className="space-y-3 border-l-2 border-[#00c8c8] pl-5 py-2">
            <h2 className="text-xl lg:text-2xl font-bold font-montserrat text-white uppercase tracking-wide flex items-center gap-2">
              <span className="text-[#00c8c8]">04.</span> Refund Processing & Timeline
            </h2>
            <p className="text-[#aaa]">
              In exceptional circumstances where a refund is approved in writing by DNA 360 management (e.g. duplicate charge, uncommenced membership within cooling-off, or verified medical permanent relocation):
            </p>
            <ul className="list-disc list-inside space-y-2 text-[#ccc] pl-2">
              <li><strong className="text-white">Refund Method:</strong> Approved refunds will be credited back strictly to the original payment source (Credit Card, Debit Card, Net Banking account, or UPI VPA) used during the initial transaction via our payment gateway partner, <strong className="text-white">Razorpay</strong>.</li>
              <li><strong className="text-white">Processing Timeline:</strong> Once processed by DNA 360, Razorpay and corresponding issuing banking networks typically take between <strong className="text-white">5 to 7 business days</strong> to reflect the credited funds in your bank account or credit card statement.</li>
              <li>Cash refunds are strictly not issued for payments received electronically.</li>
            </ul>
          </div>

          {/* Section 5 */}
          <div className="space-y-3">
            <h2 className="text-xl lg:text-2xl font-bold font-montserrat text-white uppercase tracking-wide flex items-center gap-2">
              <span className="text-[#00c8c8]">05.</span> Contact Us for Cancellations or Billing Inquiries
            </h2>
            <p className="text-[#aaa]">
              If you have any questions regarding your billing, payment transactions, or wish to request a cancellation or freeze, please get in touch with our billing desk:
            </p>
            <div className="bg-[#151515] border border-white/10 p-5 rounded-lg space-y-1 text-sm">
              <p><strong className="text-white">DNA 360 Fitness Centre</strong></p>
              <p className="text-[#aaa]">Attn: Billing & Membership Support</p>
              <p className="text-[#aaa]">Address: 502, Hiranandani Knowledge Park, Hiranandani Gardens Powai, Mumbai – 400076, India</p>
              <p className="text-[#aaa]">Email: <a href="mailto:dna360fitness@gmail.com" className="text-[#00c8c8] hover:underline">dna360fitness@gmail.com</a></p>
              <p className="text-[#aaa]">Phone: <a href="tel:+919324462384" className="text-[#00c8c8] hover:underline">+91 93244 62384</a></p>
              <p className="text-[#aaa]">Hours: Mon – Sat: 5:30 am – 12:00 am | Sun: 5:30 am – 11:00 pm</p>
            </div>
          </div>

        </section>
      </main>
      <Footer />
    </>
  )
}
