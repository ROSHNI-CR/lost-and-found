/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hitk: {
          navy: '#0a2540',
          darknavy: '#07192c',
          maroon: '#800000',
          deepmaroon: '#5c0000',
          gold: '#d4af37',
          lightgold: '#fdf6e2',
          accent: '#c59b27',
        },
        brand: {
          50: '#f0f5fa',
          100: '#e1ecf5',
          200: '#c3d8ec',
          300: '#95bee0',
          400: '#609ecc',
          500: '#2b6cb0',
          600: '#1b528a',
          700: '#123e6b',
          800: '#0d2d4f',
          900: '#0a2540', // Heritage Navy Blue
          950: '#061729',
        },
        navy: {
          800: '#0e1d30',
          900: '#0a2540',
          950: '#061729',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
