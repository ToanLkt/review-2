/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: { inter: ["Inter_400Regular"] },
      colors: {
        canvas: "#F3F8F4",
        ink: "#1A2E1F",
        forest: "#4F8F68",
        mint: "#E8F3EB",
        muted: "#6B7280",
      },
    },
  },
  plugins: [],
};
