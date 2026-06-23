import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: "#131318",
        primary: "#f2ca50",
        "primary-container": "#d4af37",
        "on-surface": "#e4e1e9",
        "surface-container": "#1f1f25",
        "surface-container-low": "#1b1b20",
        "surface-container-high": "#2a292f",
        "outline-variant": "#4d4635",
      },
      fontFamily: {
        headline: ["Noto Serif", "serif"],
        body: ["Manrope", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "1rem",
        lg: "2rem",
        xl: "3rem",
      },
    },
  },
  plugins: [],
};

export default config;