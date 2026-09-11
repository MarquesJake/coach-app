import type { Config } from "tailwindcss";

// Theme colours are CSS variables holding hex values, which Tailwind cannot add
// opacity to: every class like bg-primary/10 or hover:bg-secondary/50 used to be
// dropped from the build (770 uses). color-mix applies the opacity instead; with
// no modifier <alpha-value> is 1, so solid colours are unchanged.
const tone = (variable: string) =>
  `color-mix(in srgb, ${variable} calc(<alpha-value> * 100%), transparent)`;

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
          DEFAULT: tone("var(--background)"),
          subtle: tone("var(--background-subtle, var(--background))"),
        },
        foreground: {
          DEFAULT: tone("var(--foreground)"),
          muted: tone("var(--foreground-muted, var(--muted-foreground))"),
        },
        card: {
          DEFAULT: tone("var(--card)"),
          foreground: tone("var(--card-foreground)"),
        },
        popover: {
          DEFAULT: tone("var(--popover)"),
          foreground: tone("var(--popover-foreground)"),
        },
        primary: {
          DEFAULT: tone("var(--primary)"),
          foreground: tone("var(--primary-foreground)"),
        },
        secondary: {
          DEFAULT: tone("var(--secondary)"),
          foreground: tone("var(--secondary-foreground)"),
        },
        muted: {
          DEFAULT: tone("var(--muted)"),
          foreground: tone("var(--muted-foreground)"),
        },
        accent: {
          DEFAULT: tone("var(--accent)"),
          foreground: tone("var(--accent-foreground)"),
        },
        destructive: {
          DEFAULT: tone("var(--destructive)"),
          foreground: tone("var(--destructive-foreground)"),
        },
        border: {
          DEFAULT: tone("var(--border)"),
          subtle: tone("var(--border-subtle, var(--border))"),
          light: tone("var(--light-border)"),
        },
        input: tone("var(--input)"),
        ring: tone("var(--ring)"),
        surface: {
          DEFAULT: tone("var(--surface)"),
          raised: tone("var(--surface-raised, var(--surface))"),
          overlay: tone("var(--surface-overlay, var(--surface))"),
        },
        light: {
          DEFAULT: tone("var(--light-surface)"),
          hover: tone("var(--light-surface-hover, var(--light-surface))"),
          fg: tone("var(--light-foreground, var(--foreground))"),
          muted: tone("var(--light-foreground-muted, var(--muted-foreground))"),
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
        "2xs": ["0.75rem", { lineHeight: "1.125rem" }],
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
