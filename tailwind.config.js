/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        "noto-sc": ["Noto Serif SC", "serif"],
        zentry: ["zentry", "Noto Serif SC", "sans-serif"],
        general: ["general", "Noto Serif SC", "sans-serif"],
        "circular-web": ["circular-web", "Noto Serif SC", "sans-serif"],
        "robert-medium": ["robert-medium", "Noto Serif SC", "sans-serif"],
        "robert-regular": ["robert-regular", "Noto Serif SC", "sans-serif"],
      },
      colors: {
        blue: {
          50: "#DFDFF0",
          75: "#dfdff2",
          100: "#F0F2FA",
          200: "#010101",
          300: "#4FB7DD",
        },
        violet: {
          300: "#5724ff",
        },
        yellow: {
          100: "#8e983f",
          300: "#edff66",
        },
      },
    },
  },
  plugins: [],
};
