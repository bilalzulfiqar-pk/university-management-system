/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#102033",
          900: "#18314a",
          800: "#264966",
          700: "#325d7d",
          600: "#497393",
        },
        slate: {
          100: "#f5f8fb",
          200: "#e7edf4",
          300: "#d6e0ea",
          500: "#6d8092",
          700: "#425365",
        },
        success: {
          500: "#1f9d73",
        },
        warning: {
          500: "#c78510",
        },
        danger: {
          500: "#c44343",
        },
      },
      fontFamily: {
        sans: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "18px",
        input: "14px",
      },
    },
  },
  plugins: [],
};
