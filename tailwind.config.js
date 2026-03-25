/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      boxShadow: {
        card: '0 10px 30px rgba(2, 6, 23, 0.08)'
      },
      keyframes: {
        pulseSoft: {
          '0%, 100%': { opacity: '0.85', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.02)' }
        }
      },
      animation: {
        pulseSoft: 'pulseSoft 2.2s ease-in-out infinite'
      }
    }
  },
  plugins: []
};
