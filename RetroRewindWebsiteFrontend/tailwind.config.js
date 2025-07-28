/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}", "./index.html"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        dark: {
          bg: "#0f172a",
          surface: "#1e293b",
          border: "#334155",
        },
      },
    },
  },
  plugins: [],
  important: true,
};
