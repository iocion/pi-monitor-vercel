/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#10b981',
        'primary-dark': '#059669',
        'primary-light': '#d1fae5',
        secondary: '#64748b',
        background: '#f8fafc',
        surface: '#ffffff',
        border: '#e2e8f0',
      }
    },
  },
  plugins: [],
}