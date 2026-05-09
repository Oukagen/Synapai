import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        surface: {
          1: "var(--surface1)",
          2: "var(--surface2)",
          3: "var(--surface3)",
        },
        border: {
          DEFAULT: "var(--border)",
          visible: "var(--border-visible)",
        },
        text: {
          1: "var(--text1)",
          2: "var(--text2)",
          3: "var(--text3)",
          4: "var(--text4)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          subtle: "var(--accent-subtle)",
        },
      },
      fontFamily: {
        display: ["Playfair Display", "Georgia", "serif"],
        headline: ["Oswald", "Impact", "Helvetica", "sans-serif"],
        body: ["IBM Plex Sans", "Helvetica", "Arial", "sans-serif"],
        mono: ["IBM Plex Mono", "Courier New", "Courier", "monospace"],
      },
      spacing: {
        "xs": "4px",
        "sm": "8px",
        "md": "16px",
        "lg": "24px",
        "xl": "32px",
        "2xl": "48px",
        "3xl": "64px",
      },
      borderRadius: {
        "none": "0px",
      },
      transitionTimingFunction: {
        "verge": "ease-out",
      },
      transitionDuration: {
        "fast": "100ms",
        "medium": "150ms",
        "slow": "200ms",
      },
    },
  },
  plugins: [],
};
export default config;
