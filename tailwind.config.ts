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
        // ── Royal Purple & Obsidian brand palette ──────────────────────────
        surface: "#050505",               // Obsidian Black
        "surface-bright": "#1A1A1A",
        primary: "#7E22CE",               // Royal Purple
        "primary-container": "#581C87",
        "on-primary": "#FFFFFF",
        "on-surface": "#FFFFFF",
        outline: "#4C1D95",
        // ── Neutral surface shades ─────────────────────────────────────────
        "surface-container": "#111111",
        "surface-container-low": "#0A0A0A",
        "surface-container-high": "#1A1A1A",
        "outline-variant": "#2D1B69",
        "on-surface-variant": "#C4B5FD",  // soft lavender for secondary text
        secondary: "#A855F7",             // lighter purple accent
      },
      fontFamily: {
        headline: ["Noto Serif", "serif"],
        body: ["Manrope", "sans-serif"],
        label: ["Manrope", "sans-serif"],
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