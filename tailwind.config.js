/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6C5CE7',
        'primary-light': '#A29BFE',
        accent: '#FD79A8',
        success: '#00B894',
      }
    },
  },
  plugins: [],
}
