/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#6BA0D8",       // Calm light blue
        accent: "#B39DDB",        // Soft lavender/purple
        background: "#F4F6FC",   // Light blue-white
        surface: "#FFFFFF",
        muted: "#5C6E82",
        border: "#DDE6F4",
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
