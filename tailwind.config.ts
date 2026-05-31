import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        "bg-soft": "var(--bg-soft)",
        surface: "var(--surface)",
        "surface-soft": "var(--surface-soft)",
        "surface-glass": "var(--surface-glass)",
        border: "var(--border-soft)",
        blue: "var(--blue)",
        teal: "var(--teal)",
        amber: "var(--amber)",
        red: "var(--red)"
      },
      fontFamily: {
        heading: ["var(--font-heading)", "ui-sans-serif", "system-ui"],
        body: ["var(--font-body)", "ui-sans-serif", "system-ui"]
      },
      boxShadow: {
        glow: "0 24px 90px rgba(91,142,240,0.16)",
        panel: "0 20px 70px rgba(0,0,0,0.38)"
      },
      opacity: {
        22: "0.22",
        32: "0.32",
        35: "0.35",
        38: "0.38",
        42: "0.42",
        45: "0.45",
        55: "0.55",
        58: "0.58",
        62: "0.62",
        65: "0.65",
        72: "0.72",
        88: "0.88",
        92: "0.92"
      }
    }
  },
  plugins: []
};

export default config;
