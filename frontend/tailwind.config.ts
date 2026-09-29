import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#F5F2EA",
        "cream-dark": "#EDE8DB",
        sidebar: "#ECE7D9",
        ink: "#30291F",
        "ink-soft": "#5C5347",
        muted: "#948C7C",
        border: "#DFD8C6",
        accent: "#C15F3C",
        "accent-hover": "#A94F30",
        "accent-soft": "#F1DECB",
        bubble: "#EADFC9",
        danger: "#B3492F",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(48, 41, 31, 0.06)",
        panel: "0 1px 3px rgba(48, 41, 31, 0.08)",
      },
      borderRadius: {
        xl2: "1.1rem",
      },
    },
  },
  plugins: [],
};

export default config;
