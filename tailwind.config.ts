import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['Onest', 'system-ui', 'sans-serif'],
      },
      colors: {
        // "midnight" = escala de Azul Océano Profundo (#043860) / Azul Venecia (#00578E)
        midnight: {
          950: '#031F33',
          900: '#043860',
          800: '#054A7D',
          700: '#075F9C',
          600: '#00578E',
          500: '#2C7BAA',
          400: '#5A9CC4',
          300: '#8DBEDD',
          200: '#B9DAEF',
          100: '#DEF1FF',
          50: '#F2FAFF',
        },
        // "teal" = color de acción primario, anclado en Azul Venecia
        teal: {
          700: '#032840',
          600: '#043860',
          500: '#00578E',
          400: '#2C7BAA',
          300: '#5A9CC4',
          200: '#9FCBE0',
          100: '#DEF1FF',
          50: '#F2FAFF',
        },
        // acento de marca (Amarillo Vivo) — uso puntual, no para texto/botones por contraste
        brand: {
          yellow: '#EFFD9E',
          sage: '#B1D1C4',
          cream: '#FCF6E6',
          mint: '#FBFEE8',
          ink: '#1D1D1B',
        },
        canvas: '#FCF6E6',
        ink: '#1D1D1B',
      },
      borderRadius: {
        md: '10px',
        lg: '14px',
        xl: '20px',
      },
      boxShadow: {
        card: '0 18px 50px rgba(4, 56, 96, 0.08)',
        modal: '0 24px 64px rgba(4, 56, 96, 0.14)',
      },
    },
  },
  plugins: [],
} satisfies Config
