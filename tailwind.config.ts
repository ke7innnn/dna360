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
        // Website tokens
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
        // App tokens (used via CSS vars in components, these are for Tailwind utility convenience)
        aurora: {
          blue: '#4F7DF3',
          violet: '#6E56CF',
          teal: '#2DD4BF',
        },
      },
      fontFamily: {
        montserrat: ['var(--font-montserrat)', 'sans-serif'],
        opensans: ['var(--font-opensans)', 'sans-serif'],
        syne: ['var(--font-syne)', 'sans-serif'],
        outfit: ['var(--font-outfit)', 'sans-serif'],
        sans: ['General Sans', 'Satoshi', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['Clash Display', 'General Sans', 'Satoshi', 'sans-serif'],
      },
      backgroundImage: {
        'teal-gradient': 'linear-gradient(135deg, #00c8c8, #009999)',
        'aurora-gradient': 'linear-gradient(135deg, #4F7DF3, #6E56CF)',
      },
      borderRadius: {
        'glass': '16px',
        'glass-input': '12px',
        'glass-pill': '999px',
      },
      transitionTimingFunction: {
        'aurora': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
        'fade-up': 'fadeUp 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
        'slide-in-right': 'slideInRight 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
export default config
