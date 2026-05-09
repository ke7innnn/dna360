import type { Metadata } from 'next'
import { Montserrat, Open_Sans, Syne, Outfit } from 'next/font/google'
import '../styles/globals.css'

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  weight: ['400', '500', '600', '700', '800', '900'],
})

const openSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-opensans',
  weight: ['300', '400', '600'],
})

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  weight: ['400', '500', '600', '700', '800'],
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  weight: ['300', '400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'Best Gym in Powai | Fitness Gym in Powai | DNA 360 Fitness Centre',
  description:
    'DNA 360 is the premier fitness centre in Powai, Mumbai. 13,000 sq.ft of world-class equipment, Reformer Pilates, Spinning, MMA, Yoga, and personal training at Hiranandani Gardens.',
  keywords:
    'Best Gym Powai, Fitness Gym Powai, DNA 360, Fitness Centre Powai, Pilates Mumbai, Personal Training Powai',
  openGraph: {
    title: 'DNA 360 Fitness | Best Gym in Powai, Mumbai',
    description:
      "Mumbai's largest integrated fitness centre at Hiranandani Powai. 13,000 sq.ft of premium fitness.",
    url: 'https://www.dna360.in',
    siteName: 'DNA 360 Fitness',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${montserrat.variable} ${openSans.variable} ${syne.variable} ${outfit.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-[#0a0a0a] text-white overflow-x-hidden">
        {children}
      </body>
    </html>
  )
}
