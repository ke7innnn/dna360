import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: '#00c8c8',
          dark: '#009999',
          light: '#00e5e5',
        },
        dark: {
          DEFAULT: '#0a0a0a',
          card: '#1a1a2e',
          section: '#111111',
          charcoal: '#1c1c1c',
        },
      },
      fontFamily: {
        montserrat: ['var(--font-montserrat)', 'sans-serif'],
        opensans: ['var(--font-opensans)', 'sans-serif'],
        syne: ['var(--font-syne)', 'sans-serif'],
        outfit: ['var(--font-outfit)', 'sans-serif'],
      },
      backgroundImage: {
        'teal-gradient': 'linear-gradient(135deg, #00c8c8, #009999)',
      },
    },
  },
  plugins: [],
}
export default config
