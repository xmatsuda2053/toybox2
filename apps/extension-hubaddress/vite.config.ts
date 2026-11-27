import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import { resolve } from "path";

const pkg = JSON.parse(
  readFileSync(resolve(import.meta.dirname, "package.json"), "utf-8"),
) as { version: string };

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    target: "es2022",
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        sidepanel: resolve(import.meta.dirname, "sidepanel.html"),
        background: resolve(import.meta.dirname, "src/background.ts"),
      },
      output: {
        entryFileNames: (chunkInfo) =>
          chunkInfo.name === "background"
            ? "background.js"
            : "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
});
