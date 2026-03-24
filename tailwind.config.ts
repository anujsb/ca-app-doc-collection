
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        playfair: ["'Playfair Display'", "serif"],
      },
      colors: {
        tf: {
          bg:     "#F5F0E8",
          card:   "#FDFAF4",
          beige:  "#EDE5D4",
          tan:    "#D4C5A9",
          brown:  "#8B6F47",
          dark:   "#2C2416",
          muted:  "#7A6E60",
          accent: "#C17F3C",
          green:  "#5A7A5A",
          border: "#D9CEB8",
        },
      },
    },
  },
  plugins: [],
};

export default config;

/* ─────────────────────────────────────────────────
   Add this to globals.css (after your Tailwind directives)
   ───────────────────────────────────────────────── */

/*
*/