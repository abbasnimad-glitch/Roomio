import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2563EB",
          50: "#EFF4FF",
          100: "#DBE6FE",
          500: "#2563EB",
          600: "#1D4ED8",
          700: "#1E40AF",
        },
        secondary: {
          DEFAULT: "#22C55E",
          50: "#EFFDF4",
          100: "#D9FBE4",
          500: "#22C55E",
          600: "#16A34A",
        },
        accent: {
          DEFAULT: "#F97316",
          50: "#FFF4EB",
          100: "#FFE4CC",
          500: "#F97316",
          600: "#EA580C",
        },
        ink: {
          900: "#111827",
          700: "#374151",
          500: "#6B7280",
          300: "#D1D5DB",
          100: "#F3F4F6",
        },
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      boxShadow: {
        soft: "0 4px 24px -4px rgba(17, 24, 39, 0.08)",
        card: "0 2px 12px -2px rgba(17, 24, 39, 0.10)",
        lift: "0 12px 32px -8px rgba(17, 24, 39, 0.16)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
