/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // Añadimos una nueva familia de fuentes
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Mantenemos la fuente por defecto
        handwriting: ['Caveat', 'cursive'], // Definimos la nueva fuente manuscrita
      },
    },
  },
  plugins: [],
}
