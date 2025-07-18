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
        sans: ['Nunito Sans', 'sans-serif'], // Actualizamos la fuente por defecto
        // Fuentes manuscritas
        caveat: ['Caveat', 'cursive'],
        'patrick-hand': ['"Patrick Hand"', 'cursive'],
        'indie-flower': ['"Indie Flower"', 'cursive'],
        kalam: ['Kalam', 'cursive'],
        'gochi-hand': ['"Gochi Hand"', 'cursive'],
        // Nuevas fuentes clásicas
        lora: ['Lora', 'serif'],
      },
    },
  },
  plugins: [],
}
