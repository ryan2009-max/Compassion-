import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  base: mode === "development" ? "/" : (process.env.VERCEL ? "/" : "/Compassion-/"),
  server: {
    host: "localhost",
    port: 8082,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: process.env.VERCEL ? "dist" : "docs",
  },
}));
