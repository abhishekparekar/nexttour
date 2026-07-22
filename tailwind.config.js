/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#F5B301',
          400: '#FFC933',
          500: '#F5B301',
          600: '#E5A100',
        },
        dark: {
          600: '#2D3748',
          700: '#1E2533',
          800: '#151C28',
          900: '#0D1117',
        },
        primarylight: '#F5B301',
        primarydark: '#E5A100',
        luxury: {
          white: '#FFFFFF',
          50: '#F8F9FB',
          100: '#F3F4F6',
          200: '#EEEEEE',
          300: '#E5E7EB',
          400: '#D1D5DB',
          500: '#9CA3AF',
          600: '#6B7280',
          700: '#555555',
          800: '#374151',
          900: '#111111',
          muted: '#888888',
        }
      },
      fontFamily: {
        sans: ['Lato', 'sans-serif'],
        lato: ['Lato', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 4px 20px rgba(0, 0, 0, 0.04)',
        'premium-hover': '0 8px 30px rgba(0, 0, 0, 0.08)',
        'card': '0 2px 12px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 12px 40px rgba(0, 0, 0, 0.1)',
        'glow': '0 0 20px rgba(245, 179, 1, 0.3)',
      },
      borderRadius: {
        'premium': '16px',
        'premium-lg': '20px',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      }
    },
  },
  plugins: [],
}