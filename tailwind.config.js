/** @type {import('tailwindcss').Config} */
export default {
  // Añadimos la estrategia 'class' para el modo oscuro
  darkMode: 'class',
  
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        handwriting: ['Caveat', 'cursive'],
      },
    },
  },
  plugins: [],
}
