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
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-2px)" },
          "20%, 40%, 60%, 80%": { transform: "translateX(2px)" },
        },
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
        shake: "shake 0.5s cubic-bezier(.36,.07,.19,.97) both",
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

