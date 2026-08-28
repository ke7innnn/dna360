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
        // App Tokens (Mapped to CSS variables)
        surface: {
          DEFAULT: 'var(--surface)',
          raised: 'var(--surface-raised)',
          sunken: 'var(--surface-sunken)',
          bg: 'var(--bg)',
        },
        brand: {
          teal: 'var(--teal)',
          blue: 'var(--blue)',
          'teal-dim': 'var(--teal-dim)',
          'blue-dim': 'var(--blue-dim)',
        },
        line: {
          DEFAULT: 'var(--line)',
          strong: 'var(--line-strong)',
        },
        txt: {
          DEFAULT: 'var(--text)',
          muted: 'var(--text-muted)',
          faint: 'var(--text-faint)',
        },
        sem: {
          ok: 'var(--ok)',
          warn: 'var(--warn)',
          danger: 'var(--danger)',
          'ok-dim': 'var(--ok-dim)',
          'warn-dim': 'var(--warn-dim)',
          'danger-dim': 'var(--danger-dim)',
        },
      },
      fontFamily: {
        display: ['Archivo', 'system-ui', 'sans-serif'],
        ui: ['Archivo', 'system-ui', '-apple-system', 'sans-serif'],
        sans: ['Archivo', 'system-ui', '-apple-system', 'sans-serif'],
        data: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(180deg, #1BA79C 0%, #2AA8E2 100%)',
        'teal-gradient': 'linear-gradient(180deg, #1BA79C 0%, #2AA8E2 100%)',
      },
      borderRadius: {
        'sm': '6px',
        'md': '10px',
        'lg': '14px',
        'full': '999px',
        'glass': '14px',
        'glass-input': '6px',
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
