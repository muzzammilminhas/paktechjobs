import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: { ink: "#0f172a", panel: "#1e293b", accent: "#6366f1" },
      boxShadow: { glow: "0 16px 48px -24px rgba(99, 102, 241, .55)" },
    },
  },
  plugins: [],
};

export default config;
