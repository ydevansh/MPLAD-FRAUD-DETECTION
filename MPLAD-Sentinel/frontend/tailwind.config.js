/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sentinel: {
          blue: '#1B4FFF',
          navy: '#0A0F1E',
          surface: '#111827',
          card: '#1a2235',
        },
        risk: {
          low: '#38A169',
          medium: '#D69E2E',
          high: '#DD6B20',
          critical: '#E53E3E',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(27,79,255,0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(27,79,255,0.8)' },
        }
      }
    },
  },
  plugins: [],
}
