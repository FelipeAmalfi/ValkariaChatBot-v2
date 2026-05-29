import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Valkaria purple scale
        valkaria: {
          50:  '#f5f0ff',
          100: '#ede0ff',
          200: '#d8c1ff',
          300: '#bb94ff',
          400: '#9a5fff',
          500: '#7c32f5',
          600: '#6b17e4',
          700: '#5a10c0',
          800: '#4b119e',
          900: '#3f1080',
          950: '#270961',
        },
        // Midnight dark backgrounds
        midnight: {
          900: '#0d0a1a',
          800: '#140f2a',
          700: '#1c1638',
        },
        // Semantic dark-fantasy tokens
        void:     '#0d0717',
        night:    '#1a0d2e',
        shadow:   '#2d1b4e',
        mist:     '#4a3a6e',
        parchment:'#e8d5a3',
        gold:     '#c9a84c',
        ember:    '#8b1a1a',
        silver:   '#b8a8c8',
        sage:     '#7a9e7e',
        'gold-dim': '#8a6a2a',
        // shadcn CSS variable mappings
        background: 'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        border:  'hsl(var(--border))',
        input:   'hsl(var(--input))',
        ring:    'hsl(var(--ring))',
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        popover: {
          DEFAULT:    'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
      },
      fontFamily: {
        display: ['var(--font-cinzel)', 'Georgia', 'serif'],
        body:    ['var(--font-inter)', 'system-ui', 'sans-serif'],
        sans:    ['var(--font-inter)', 'system-ui', 'sans-serif'],
        fantasy: ['var(--font-cinzel)', 'Georgia', 'serif'],
        serif:   ['Georgia', 'Cambria', 'serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      backgroundImage: {
        'gradient-valkaria': 'linear-gradient(135deg, #270961 0%, #0d0a1a 50%, #1c1638 100%)',
      },
      keyframes: {
        'pulse-dot': {
          '0%, 80%, 100%': { transform: 'scale(0.8)', opacity: '0.5' },
          '40%':            { transform: 'scale(1.2)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-20px)' },
        },
      },
      animation: {
        'pulse-dot': 'pulse-dot 1.4s ease-in-out infinite',
        float:       'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
