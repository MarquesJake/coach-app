import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "var(--background)",
          subtle: "var(--background-subtle, var(--background))",
        },
        foreground: {
          DEFAULT: "var(--foreground)",
          muted: "var(--foreground-muted, var(--muted-foreground))",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: {
          DEFAULT: "var(--border)",
          subtle: "var(--border-subtle, var(--border))",
          light: "var(--light-border)",
        },
        input: "var(--input)",
        ring: "var(--ring)",
        surface: {
          DEFAULT: "var(--surface)",
          raised: "var(--surface-raised, var(--surface))",
          overlay: "var(--surface-overlay, var(--surface))",
        },
        light: {
          DEFAULT: "var(--light-surface)",
          hover: "var(--light-surface-hover, var(--light-surface))",
          fg: "var(--light-foreground, var(--foreground))",
          muted: "var(--light-foreground-muted, var(--muted-foreground))",
        },
        score: {
          excellent: "#10b981",
          good: "#eab308",
          fair: "#f97316",
          poor: "#ef4444",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "var(--radius-lg)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", "monospace"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      keyframes: {
        "score-fill": {
          from: { width: "0%" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { opacity: "0", transform: "translateX(-8px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
      animation: {
        "score-fill": "score-fill 0.8s ease-out",
        "fade-in": "fade-in 0.3s ease-out forwards",
        "slide-in": "slide-in 0.3s ease-out",
        "pulse-subtle": "pulse-subtle 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
