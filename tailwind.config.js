/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6', // Niebieski akcent
        dark: {
          900: '#0f172a', // Tło główne
          800: '#1e293b', // Karty/Sidebar
          700: '#334155', // Obramowania
        }
      }
    },
  },
  plugins: [],
}
