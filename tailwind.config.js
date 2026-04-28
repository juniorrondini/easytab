/** @type {import('tailwindcss').Config} */
export default {
  content: ['./popup.html', './options.html', './hibernate.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#111827',
        panel: '#172033',
        line: '#263348'
      },
      boxShadow: {
        glow: '0 18px 80px rgba(0,0,0,0.35)'
      }
    }
  },
  plugins: []
};
