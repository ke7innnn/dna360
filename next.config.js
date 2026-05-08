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
}

module.exports = nextConfig
