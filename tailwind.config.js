/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "!./src/**/server/**/*",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          850: '#111d33',
          900: '#0b1329',
          950: '#060a17'
        }
      }
    },
  },
  plugins: [],
}
