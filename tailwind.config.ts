import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "surface-container": "#1f1f25",
        "secondary-container": "#af8d11",
        surface: "#131318",
        primary: "#f2ca50",
      },
    },
  },
  plugins: [],
};

export default config;