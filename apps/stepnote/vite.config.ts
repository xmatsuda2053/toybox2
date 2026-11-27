import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { viteSingleFile } from "vite-plugin-singlefile";

const pkg = JSON.parse(
  readFileSync(resolve(import.meta.dirname, "package.json"), "utf-8"),
) as { version: string };

export default defineConfig({
  plugins: [tsconfigPaths(), viteSingleFile()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    target: "es2020",
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 100000000,
    cssCodeSplit: false,
    reportCompressedSize: false,
  },
});
