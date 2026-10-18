import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        elevated: 'rgb(var(--elevated) / <alpha-value>)',
        fg: 'rgb(var(--fg) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        faint: 'rgb(var(--faint) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        'accent-ink': 'rgb(var(--accent-ink) / <alpha-value>)',
        accent2: 'rgb(var(--accent-2) / <alpha-value>)',
        'accent-2': 'rgb(var(--accent-2) / <alpha-value>)',
        green: 'rgb(var(--green) / <alpha-value>)',
        'green-deep': 'rgb(var(--green-deep) / <alpha-value>)',
        purple: 'rgb(var(--purple) / <alpha-value>)',
        'purple-deep': 'rgb(var(--purple-deep) / <alpha-value>)',
      },
      fontFamily: {
        // Body text is Bricolage at its text optical size (next/font/google
        // serves the opsz-14 default), so Inter is gone and each face does one
        // job. No stack may reference --font-sans any more: var() of an
        // undefined property invalidates the whole font-family declaration.
        sans: ['var(--font-display)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        cond: ['var(--font-display-cond)', 'var(--font-display)', 'sans-serif'],
        name: ['var(--font-name)', 'var(--font-display)', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
        jp: ['var(--font-jp)', 'Hiragino Mincho ProN', 'Yu Mincho', 'serif'],
      },
      fontSize: {
        '10xl': ['9rem', { lineHeight: '0.85', letterSpacing: '-0.04em' }],
        '11xl': ['12rem', { lineHeight: '0.82', letterSpacing: '-0.045em' }],
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
        128: '32rem',
      },
      maxWidth: {
        container: '88rem',
      },
      transitionTimingFunction: {
        expo: 'cubic-bezier(0.16, 1, 0.3, 1)',
        'in-expo': 'cubic-bezier(0.7, 0, 0.84, 0)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'marquee-rev': {
          '0%': { transform: 'translateX(-50%)' },
          '100%': { transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '80%, 100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        blink: {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        'spin-reverse': {
          from: { transform: 'rotate(360deg)' },
          to: { transform: 'rotate(0deg)' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(400%)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.35' },
          '50%': { opacity: '0.8' },
        },
      },
      animation: {
        marquee: 'marquee var(--marquee-duration, 40s) linear infinite',
        'marquee-rev': 'marquee-rev var(--marquee-duration, 40s) linear infinite',
        float: 'float 6s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2.4s cubic-bezier(0.24, 0, 0.38, 1) infinite',
        blink: 'blink 1.1s step-end infinite',
        'spin-slow': 'spin-slow 44s linear infinite',
        'spin-reverse': 'spin-reverse 62s linear infinite',
        'scan-line': 'scan-line 7s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 3.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
