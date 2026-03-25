/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#f8f6f1',
        ink: '#1f2937',
        accent: '#2563eb',
        accentSoft: '#dbeafe'
      },
      boxShadow: {
        card: '0 10px 30px rgba(15, 23, 42, 0.08)'
      }
    }
  },
  plugins: []
};
