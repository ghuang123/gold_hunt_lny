/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'green-deep': '#0D1F0D',
        'green-mid': '#1A3A1A',
        'red-deep': '#8B0000',
        'red-hunt': '#CC0000',
        'gold-primary': '#FFD700',
        'gold-dark': '#B8960C',
        'black-felt': '#0A0A0A',
        'white-smoke': '#F5F0E8',
        'green-tint': 'rgba(0,200,80,0.15)',
        'red-tint': 'rgba(200,0,0,0.15)',
      },
      borderRadius: {
        xl: '12px',
      },
    },
  },
  plugins: [],
}
