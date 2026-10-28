/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        emergency: {
          50: '#fff1f2',
          100: '#ffe4e6',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
        },
        cyber: {
          dark: '#f8fafc',
          card: '#ffffff',
          border: '#e2e8f0',
          glow: '#2563eb'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow': '0 0 20px -3px rgba(37, 99, 235, 0.3)',
        'glow-red': '0 0 20px -3px rgba(244, 63, 94, 0.3)',
        'glass': '0 4px 20px -2px rgba(37, 99, 235, 0.06), 0 1px 3px 0 rgba(15, 23, 42, 0.04)'
      }
    },
  },
  plugins: [],
}
