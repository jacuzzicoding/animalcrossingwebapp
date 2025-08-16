/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wood: '#7B5E3B',
        paper: '#F5E9D4', 
        ink: '#2A2A2A',
        leaf: '#3CA370',
        ocean: '#1A2B4A',
        cube: '#6E5AA3',
      },
    },
  },
  plugins: [],
}