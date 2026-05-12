import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          soft: 'hsl(var(--primary-soft))',
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
        cream: {
          50: 'hsl(35 40% 99%)',
          100: 'hsl(35 35% 97%)',
          200: 'hsl(33 30% 93%)',
        },
        cocoa: {
          50: 'hsl(20 30% 96%)',
          400: 'hsl(20 18% 45%)',
          700: 'hsl(20 25% 22%)',
          900: 'hsl(20 30% 12%)',
        },
        raspberry: {
          50: 'hsl(345 70% 97%)',
          100: 'hsl(345 70% 93%)',
          500: 'hsl(345 75% 47%)',
          600: 'hsl(345 78% 42%)',
          700: 'hsl(345 80% 35%)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
        '3xl': 'calc(var(--radius) + 16px)',
      },
      boxShadow: {
        soft: '0 1px 2px 0 rgb(20 15 10 / 0.04), 0 1px 3px 0 rgb(20 15 10 / 0.06)',
        lift: '0 4px 6px -1px rgb(20 15 10 / 0.06), 0 2px 4px -2px rgb(20 15 10 / 0.04)',
        elevated: '0 10px 15px -3px rgb(20 15 10 / 0.08), 0 4px 6px -4px rgb(20 15 10 / 0.05)',
        glow: '0 0 0 4px hsl(var(--primary) / 0.12)',
        'inner-soft': 'inset 0 1px 2px 0 rgb(20 15 10 / 0.04)',
      },
      backgroundImage: {
        'gradient-hero':
          'radial-gradient(ellipse 80% 60% at 50% 0%, hsl(345 70% 95% / 0.6), transparent 60%), radial-gradient(ellipse 60% 50% at 100% 100%, hsl(35 60% 93% / 0.5), transparent 60%), hsl(35 40% 99%)',
        'gradient-primary':
          'linear-gradient(135deg, hsl(345 75% 47%) 0%, hsl(335 78% 50%) 100%)',
        'gradient-cream':
          'linear-gradient(180deg, hsl(35 40% 99%) 0%, hsl(33 30% 96%) 100%)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'fade-in-up': 'fade-in-up 0.4s ease-out',
        shimmer: 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
