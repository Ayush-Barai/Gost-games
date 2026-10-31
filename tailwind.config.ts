import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./games/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#080812",
        abyss: "#111126",
        spectral: "#8B5CF6",
        ecto: "#22D3EE",
        "blood-moon": "#F472B6",
      },
      fontFamily: {
        display: ["Cinzel", "Georgia", "serif"],
        body: ["Sora", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 30px -6px rgba(139, 92, 246, 0.55)",
        "glow-cyan": "0 0 30px -6px rgba(34, 211, 238, 0.5)",
      },
      keyframes: {
        flicker: {
          "0%, 100%": { opacity: "1" },
          "45%": { opacity: "0.85" },
          "47%": { opacity: "0.35" },
          "49%": { opacity: "0.9" },
          "70%": { opacity: "0.6" },
        },
        drift: {
          "0%, 100%": { transform: "translate3d(0,0,0)" },
          "50%": { transform: "translate3d(0,-12px,0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "100%": { transform: "scale(1.4)", opacity: "0" },
        },
      },
      animation: {
        flicker: "flicker 5s infinite",
        drift: "drift 6s ease-in-out infinite",
        shimmer: "shimmer 8s linear infinite",
        "pulse-ring": "pulse-ring 2s ease-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
