import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: process.env.CAP_BUILD ? "/" : "/BudgetR/", // GitHub Pages needs the subpath, Capacitor's WKWebView serves from root
  plugins: [react()],
  build: {
    // just raise the limit so the 500 kB warning goes away
    chunkSizeWarningLimit: 1000,
  },
});
