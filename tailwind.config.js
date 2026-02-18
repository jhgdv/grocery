/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#1f2937",       // Dark gray for text (readable, neutral)
        accent: "#D97D73",        // Old Rose
        background: "#f0fdf4",    // Very light green
        surface: "#ffffff",       // White cards
        muted: "#6b7280",         // Gray-500 for secondary text
      },
    },
  },
  plugins: [],
};
