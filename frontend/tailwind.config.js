/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14171C",
        paper: "#F3F5F7",
        line: "#DDE1E6",
        jacaranda: { DEFAULT: "#5B3E96", deep: "#3F2A6B", mist: "#ECE7F6" },
        acacia: "#2F6B4F",
        matatu: "#F2B705",
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', "system-ui", "sans-serif"],
        sans: ['"Source Sans 3"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
