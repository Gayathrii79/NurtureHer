import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#FFF8FB",
        primary: "#EC4899",
        secondary: "#F472B6",
        accent: "#C084FC",
        ink: "#251827",
        muted: "#7B6874",
        mint: "#8DD7C3",
        sky: "#93C5FD",
        amber: "#FBBF24",
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
      },
      borderRadius: {
        card: "24px",
      },
      boxShadow: {
        glow: "0 24px 80px rgba(236, 72, 153, 0.16)",
        card: "0 18px 50px rgba(126, 52, 98, 0.10)",
        soft: "0 10px 32px rgba(126, 52, 98, 0.08)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
