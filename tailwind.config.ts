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
        bg: {
          DEFAULT: 'var(--bg)',
          elev: 'var(--bg-elev)',
        },
        surface: {
          DEFAULT: 'var(--surface)',
          2: 'var(--surface-2)',
          raised: 'var(--bg-elev)',
          sunken: 'rgba(0, 0, 0, 0.35)',
        },
        line: {
          DEFAULT: 'var(--line)',
          soft: 'var(--line-soft)',
          strong: 'var(--line-strong)',
        },
        ink: {
          DEFAULT: 'var(--ink)',
          2: 'var(--ink-2)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          2: 'var(--muted-2)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          deep: 'var(--accent-deep)',
          soft: 'var(--accent-soft)',
        },
        green: {
          DEFAULT: 'var(--green)',
          dim: 'var(--ok-dim)',
        },
        amber: {
          DEFAULT: 'var(--amber)',
          dim: 'var(--warn-dim)',
        },
        indigo: {
          DEFAULT: 'var(--indigo)',
          dim: 'var(--blue-dim)',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Clash Display', 'sans-serif'],
        ui: ['var(--font-ui)', 'Satoshi', 'sans-serif'],
        sans: ['var(--font-ui)', 'Satoshi', 'sans-serif'],
        body: ['var(--font-ui)', 'Satoshi', 'sans-serif'],
        data: ['var(--font-data)', 'Satoshi', 'sans-serif'],
        mono: ['var(--font-data)', 'Satoshi', 'sans-serif'],
      },
      borderRadius: {
        'sm': 'var(--r-sm)',
        'md': 'var(--r-md)',
        'lg': 'var(--r-lg)',
        'xl': 'var(--r-xl)',
        'pill': 'var(--r-pill)',
        'full': '999px',
      },
      boxShadow: {
        card: '0 20px 40px -30px rgba(0, 0, 0, 0.9), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
        glow: '0 8px 24px -8px rgba(59, 130, 246, 0.7)',
        'glow-sm': '0 4px 16px -4px rgba(59, 130, 246, 0.5)',
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
        'aurora-glow': 'radial-gradient(60% 55% at 82% 8%, rgba(59,130,246,0.20), transparent 60%)',
      },
    },
  },
  plugins: [],
}

export default config
