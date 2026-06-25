/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        app: "rgb(var(--color-bg) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        subtle: "rgb(var(--color-border) / <alpha-value>)",
        fg: "rgb(var(--color-fg) / <alpha-value>)",
        fgMuted: "rgb(var(--color-fg-muted) / <alpha-value>)",
        fgSubtle: "rgb(var(--color-fg-subtle) / <alpha-value>)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        heroFrom: "rgb(var(--color-hero-from) / <alpha-value>)",
        heroTo: "rgb(var(--color-hero-to) / <alpha-value>)",
      },
      boxShadow: {
        appSoft: "0 10px 25px rgba(0,0,0,0.5)",
      },
      borderRadius: {
        appLg: "1rem",
        appXl: "1.5rem",
      },
    },
  },
  plugins: [],
};
