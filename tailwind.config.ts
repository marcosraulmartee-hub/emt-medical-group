import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        midnight: {
          950: '#08101F',
          900: '#0F1C33',
          800: '#162B44',
          700: '#1F3F5F',
          600: '#2F5678',
          500: '#3F71A3',
        },
        teal: {
          600: '#1EA8A1',
          500: '#2EC8C0',
          400: '#5ED8D1',
          100: '#E6F7F6',
          50: '#F2FCFB',
        },
        canvas: '#F7FAFC',
        ink: '#172331',
      },
      borderRadius: {
        md: '10px',
        lg: '14px',
        xl: '20px',
      },
      boxShadow: {
        card: '0 18px 50px rgba(15, 38, 58, 0.08)',
        modal: '0 24px 64px rgba(15, 38, 58, 0.12)',
      },
    },
  },
  plugins: [],
} satisfies Config
