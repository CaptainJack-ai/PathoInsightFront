/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        "noto-sc": ["Noto Sans SC", "sans-serif"],
        zentry: ["zentry", "Noto Sans SC", "sans-serif"],
        general: ["general", "Noto Sans SC", "sans-serif"],
        "circular-web": ["circular-web", "Noto Sans SC", "sans-serif"],
        "robert-medium": ["robert-medium", "Noto Sans SC", "sans-serif"],
        "robert-regular": ["robert-regular", "Noto Sans SC", "sans-serif"],
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
