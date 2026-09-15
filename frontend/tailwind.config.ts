import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#F8F7FF",
        primary: {
          DEFAULT: "#7C3AED",
          hover: "#6D28D9",
          light: "#EDE9FE",
        },
        secondary: {
          DEFAULT: "#8B5CF6",
          hover: "#7C3AED",
          light: "#F5F3FF",
        },
        accent: "#A78BFA",
        surface: "#FFFFFF",
        ink: "#1E1B4B",
        muted: "#64748B",
        mint: "#0D9488",
        teal: "#0F766E",
        sky: "#38BDF8",
        amber: "#D97706",
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#DC2626",
        lavender: {
          50: "#FAF8FF",
          100: "#F3EFFF",
          200: "#E9E2FE",
          300: "#D8CCFD",
          400: "#BBA5FB",
          500: "#9D7FF7",
          600: "#7C3AED",
          700: "#6D28D9",
          800: "#5B21B6",
          900: "#4C1D95",
          950: "#2E1065",
        },
      },
      borderRadius: {
        card: "24px",
      },
      boxShadow: {
        glow: "0 20px 60px rgba(124, 58, 237, 0.16)",
        card: "0 10px 30px rgba(91, 33, 182, 0.08)",
        soft: "0 6px 20px rgba(91, 33, 182, 0.05)",
        emergency: "0 10px 30px rgba(220, 38, 38, 0.22)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
