/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#e0fcf9',
          100: '#bdfaf1',
          200: '#89f3e4',
          300: '#4ee8d5',
          400: '#1bd4c2',
          500: '#06b6a6',
          600: '#029286',
          700: '#05756d',
          800: '#085d58',
          900: '#0a4d49',
          950: '#042e2c',
        },
        dark: {
          50: '#f6f7f9',
          100: '#eceff3',
          200: '#d5dae4',
          300: '#b1bbcd',
          400: '#8796b0',
          500: '#667796',
          600: '#515e7a',
          700: '#414c64',
          800: '#384153',
          900: '#313846',
          950: '#14171d', // Very dark slate for backgrounds
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'blob': 'blob 7s infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        }
      }
    },
  },
  plugins: [],
}
