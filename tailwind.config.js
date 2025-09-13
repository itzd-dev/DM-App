
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "brand-primary": "#634832", // Main Brown
        "brand-accent": "#E67E22", // Accent Orange/Gold
        "brand-bg": "#FBF9F6", // Off-white/Cream
        "brand-subtle": "#EAE0D5", // Light Beige for borders/hover
        "brand-text": "#3D2C1D", // Darker Brown for text
        "brand-text-light": "#7E6C5A", // Muted Brown for subtext
      },
    },
  },
  plugins: [],
}
