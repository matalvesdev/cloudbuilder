import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0a1128',
          'navy-dark': '#0D1B2A',
          lime: '#ccff00',
          'ice-blue': '#E3E2FD',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['SF Mono', 'Menlo', 'monospace'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        'card': '0 4px 20px rgba(10, 17, 40, 0.05)',
        'card-hover': '0 8px 32px rgba(10, 17, 40, 0.08)',
        'node': '0 2px 8px rgba(10, 17, 40, 0.06)',
        'node-selected': '0 0 0 2px #0a1128, 0 4px 20px rgba(10, 17, 40, 0.08)',
        'toolbar': '0 4px 20px rgba(10, 17, 40, 0.08)',
        'glow': '0 0 20px rgba(204, 255, 0, 0.25)',
      },
      backgroundImage: {
        'dot-grid': 'radial-gradient(#e0f2fe 1.5px, transparent 1.5px)',
        'brand-gradient': 'linear-gradient(135deg, #0a1128 0%, #0D1B2A 100%)',
      },
      backgroundSize: {
        'grid': '32px 32px',
      },
    },
  },
  plugins: [],
}

export default config
