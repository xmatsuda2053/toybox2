import { describe, it, expect } from "vitest";
import type { Rollup, UserConfig } from "vite";
import viteConfig from "./vite.config";

/**
 * テスト仕様一覧:
 * - entryFileNames が background チャンクに対して固定名 "background.js" を返すこと
 * - entryFileNames が sidepanel 等の他エントリーに対してハッシュを含まない "assets/[name].js" を返すこと
 * - chunkFileNames がハッシュを含まない固定名 "assets/[name].js" に設定されていること
 * - assetFileNames がハッシュを含まない固定名 "assets/[name][extname]" に設定されていること
 */

function getOutputOptions(config: UserConfig): Rollup.OutputOptions {
  const output = config.build?.rollupOptions?.output;
  if (!output || Array.isArray(output)) {
    throw new Error(
      "rollupOptions.output は単一の OutputOptions である必要があります",
    );
  }
  return output;
}

function createPreRenderedChunk(name: string): Rollup.PreRenderedChunk {
  return {
    name,
    exports: [],
    facadeModuleId: null,
    isDynamicEntry: false,
    isEntry: true,
    isImplicitEntry: false,
    moduleIds: [],
    type: "chunk",
  };
}

describe("extension-hubaddress vite.config.ts ビルド出力ファイル名設定", () => {
  const output = getOutputOptions(viteConfig);

  it("entryFileNames が background チャンクに対して background.js を返すこと", () => {
    expect(typeof output.entryFileNames).toBe("function");
    if (typeof output.entryFileNames !== "function") {
      return;
    }
    expect(output.entryFileNames(createPreRenderedChunk("background"))).toBe(
      "background.js",
    );
  });

  it("entryFileNames が sidepanel 等のエントリーに対してハッシュなしの assets/[name].js を返すこと", () => {
    expect(typeof output.entryFileNames).toBe("function");
    if (typeof output.entryFileNames !== "function") {
      return;
    }
    const result = output.entryFileNames(createPreRenderedChunk("sidepanel"));
    expect(result).toBe("assets/[name].js");
    expect(result).not.toContain("[hash]");
  });

  it("chunkFileNames がハッシュなしの assets/[name].js であること", () => {
    expect(output.chunkFileNames).toBe("assets/[name].js");
  });

  it("assetFileNames がハッシュなしの assets/[name][extname] であること", () => {
    expect(output.assetFileNames).toBe("assets/[name][extname]");
  });
});
