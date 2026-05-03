import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
    "../../packages/lib/src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      keyframes: {
        "sheet-slide-up": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "sheet-slide-down": {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(100%)" },
        },
        "sheet-fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "sheet-fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
      },
      animation: {
        "sheet-slide-up": "sheet-slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "sheet-slide-down": "sheet-slide-down 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "sheet-fade-in": "sheet-fade-in 0.4s ease-out forwards",
        "sheet-fade-out": "sheet-fade-out 0.3s ease-out forwards",
      },
    }
  },
  plugins: []
};

export default config;

