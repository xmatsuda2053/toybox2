import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  build: {
    target: "es2022",
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        content: resolve(import.meta.dirname, "src/content.ts"),
      },
      output: {
        entryFileNames: "[name].js",
        format: "iife",
      },
    },
  },
});

