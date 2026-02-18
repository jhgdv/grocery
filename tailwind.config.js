/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#000000",       // Black for highest readability
        accent: "#8E8AFB",        // Soft Purple from image
        coral: "#FF7E73",         // Coral from image
        background: "#F2F1FF",    // Soft Lavender
        surface: "rgba(255, 255, 255, 0.75)", // Glass effect base
        muted: "#71717A",         // Zinc-500
      },
    },
  },
  plugins: [],
};
