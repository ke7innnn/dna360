/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'www.dna360.in',
        port: '',
        pathname: '/assets/img/**',
      },
    ],
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      { source: '/privacy', destination: '/privacy-policy' },
      { source: '/terms', destination: '/terms-and-conditions' },
      { source: '/refund', destination: '/cancellation-refund-policy' },
      { source: '/refund-policy', destination: '/cancellation-refund-policy' },
      { source: '/cancellation-policy', destination: '/cancellation-refund-policy' },
    ]
  },
}

module.exports = nextConfig
