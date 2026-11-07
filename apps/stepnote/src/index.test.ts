import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * 【StepNote index.html 仕様】
 *
 * 1. ルート要素の言語属性仕様
 *    - [x] 1-1. html 要素に lang="ja" が指定されていること
 *
 * 2. Favicon link タグの定義
 *    - [x] 2-1. index.html の head 内に rel="icon" の link 要素が存在すること
 *    - [x] 2-2. link 要素に type="image/svg+xml" が指定されていること
 *    - [x] 2-3. href 属性に SVG 形式の Data URI (data:image/svg+xml...) が指定されていること
 *
 * 3. Favicon SVG コンテンツ仕様
 *    - [x] 3-1. SVG データ内に cubes-stacked アイコンの path 形状データが含まれていること
 *    - [x] 3-2. SVG 内に prefers-color-scheme: dark に応じたダークモード・ライトモード切り替えスタイルが含まれていること
 */

describe("StepNote index.html 仕様", () => {
  const indexPath = resolve(__dirname, "../index.html");
  const htmlContent = readFileSync(indexPath, "utf-8");

  describe("1. ルート要素の言語属性仕様", () => {
    it("1-1. html 要素に lang=\"ja\" が指定されていること", () => {
      expect(htmlContent).toMatch(/<html\s+[^>]*lang=["']ja["'][^>]*>/i);
    });
  });

  describe("2. Favicon link タグの定義", () => {
    it("2-1. index.html の head 内に rel=\"icon\" の link 要素が存在すること", () => {
      expect(htmlContent).toMatch(/<link\s+[^>]*rel=["']icon["'][^>]*>/i);
    });

    it("2-2. link 要素に type=\"image/svg+xml\" が指定されていること", () => {
      const linkMatch = htmlContent.match(/<link\s+[^>]*rel=["']icon["'][^>]*>/i);
      expect(linkMatch).not.toBeNull();
      expect(linkMatch![0]).toMatch(/type=["']image\/svg\+xml["']/i);
    });

    it("2-3. href 属性に SVG 形式の Data URI (data:image/svg+xml...) が指定されていること", () => {
      const linkMatch = htmlContent.match(/<link\s+[^>]*rel=["']icon["'][^>]*>/i);
      expect(linkMatch).not.toBeNull();
      expect(linkMatch![0]).toMatch(/href=["']data:image\/svg\+xml[^"']*["']/i);
    });
  });

  describe("3. Favicon SVG コンテンツ仕様", () => {
    it("3-1. SVG データ内に cubes-stacked アイコンの path 形状データが含まれていること", () => {
      // cubes-stacked の代表的な座標点 'M256 96C256 78.3' または '256 96' を含むこと
      const linkMatch = htmlContent.match(/<link\s+[^>]*rel=["']icon["'][^>]*>/i);
      expect(linkMatch).not.toBeNull();
      const decodedHref = decodeURIComponent(linkMatch![0]);
      expect(decodedHref).toMatch(/256\s+96/);
    });

    it("3-2. SVG 内に prefers-color-scheme: dark に応じたダークモード・ライトモード切り替えスタイルが含まれていること", () => {
      const linkMatch = htmlContent.match(/<link\s+[^>]*rel=["']icon["'][^>]*>/i);
      expect(linkMatch).not.toBeNull();
      const decodedHref = decodeURIComponent(linkMatch![0]);
      expect(decodedHref).toMatch(/prefers-color-scheme:\s*dark/);
    });
  });
});

