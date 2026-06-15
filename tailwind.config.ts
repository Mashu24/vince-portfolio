import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        void: "#05070f",
        panel: "rgba(9, 16, 32, 0.74)",
        cyanCore: "#27f4ff",
        greenCore: "#69ff8f",
        ink: "#d7fbff"
      },
      boxShadow: {
        glow: "0 0 32px rgba(39, 244, 255, 0.28)",
        greenGlow: "0 0 30px rgba(105, 255, 143, 0.24)"
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(39,244,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(105,255,143,.06) 1px, transparent 1px)"
      }
    }
  },
  plugins: []
};

export default config;
