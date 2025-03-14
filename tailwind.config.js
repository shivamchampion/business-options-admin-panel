/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0031AC',
          dark: '#002A99',
          light: '#0045AC'
        }
      }
    },
  },
  plugins: [],
}