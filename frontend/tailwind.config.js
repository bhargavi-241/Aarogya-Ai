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
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488', // Main teal
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        navy: {
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'soft-xs': '0 1px 3px 0 rgba(15, 23, 42, 0.04)',
        'soft-sm': '0 2px 6px -1px rgba(15, 23, 42, 0.06), 0 1px 4px -1px rgba(15, 23, 42, 0.04)',
        'soft-md': '0 6px 16px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -2px rgba(15, 23, 42, 0.03)',
        'soft-lg': '0 12px 24px -4px rgba(15, 23, 42, 0.08), 0 4px 10px -3px rgba(15, 23, 42, 0.03)',
        'soft-xl': '0 20px 32px -6px rgba(15, 23, 42, 0.1), 0 8px 16px -4px rgba(15, 23, 42, 0.04)',
        'teal-glow': '0 10px 30px -5px rgba(13, 148, 136, 0.25)',
        'rose-glow': '0 10px 30px -5px rgba(225, 29, 72, 0.25)',
      }
    },
  },
  plugins: [],
}
