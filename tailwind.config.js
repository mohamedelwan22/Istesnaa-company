/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0A1F44', // Navy Blue
        background: '#F8F8F6', // Off-White
        accent: '#E5E7EB', // Light Gray
      },
      fontFamily: {
        sans: ['Cairo', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
