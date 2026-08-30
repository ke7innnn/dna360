import type { Metadata } from 'next'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: {
    template: '%s | DNA 360',
    default: 'DNA 360 — Precision Operations',
  },
  description: 'DNA 360 — Gym Management Platform by Pinnacle Studios',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Clash Display & Satoshi Fonts from Fontshare */}
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&f[]=satoshi@400,500,700,900&display=swap"
        />
        {/* Martian Mono from Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Martian+Mono:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="overflow-x-hidden bg-[#08080A] text-[#F5F2F4] antialiased">
        {children}
      </body>
    </html>
  )
}
