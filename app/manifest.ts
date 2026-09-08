import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DNA 360 — Precision Gym Operations',
    short_name: 'DNA 360',
    description: 'Precision Gym Operations, Member Check-in, Workouts & Telemetry by Base Fitness',
    start_url: '/login',
    display: 'standalone',
    background_color: '#08080A',
    theme_color: '#08080A',
    orientation: 'portrait-primary',
    scope: '/',
    icons: [
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/apple-icon.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    categories: ['fitness', 'health', 'lifestyle'],
  }
}
