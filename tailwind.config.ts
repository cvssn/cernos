import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"JetBrainsMono Nerd Font"',
          '"JetBrains Mono"',
          "ui-monospace",
          "Menlo",
          "Consolas",
          "monospace",
        ],
        mono: [
          '"JetBrainsMono Nerd Font"',
          '"JetBrains Mono"',
          "ui-monospace",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "float-slow": "float 10s ease-in-out infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "shimmer": "shimmer 2.5s linear infinite",
        "rain": "rain 1.2s linear infinite",
        "snow": "snow 8s linear infinite",
        "spin-slow": "spin 20s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        rain: {
          "0%": { transform: "translateY(-100vh)", opacity: "0" },
          "10%": { opacity: "1" },
          "100%": { transform: "translateY(100vh)", opacity: "0" },
        },
        snow: {
          "0%": { transform: "translateY(-10vh) translateX(0)", opacity: "0" },
          "10%": { opacity: "1" },
          "100%": { transform: "translateY(110vh) translateX(50px)", opacity: "0" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
} satisfies Config;
