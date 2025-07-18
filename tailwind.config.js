/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        // Definimos todas las fuentes manuscritas que ofreceremos
        caveat: ['Caveat', 'cursive'],
        'patrick-hand': ['"Patrick Hand"', 'cursive'],
        'indie-flower': ['"Indie Flower"', 'cursive'],
        kalam: ['Kalam', 'cursive'],
        'gochi-hand': ['"Gochi Hand"', 'cursive'],
      },
    },
  },
  plugins: [],
}
