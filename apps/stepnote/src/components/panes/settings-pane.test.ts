import * as fs from "node:fs";
import * as path from "node:path";
import * as sass from "sass-embedded";
import { describe, it, expect, beforeEach } from "vitest";
import { flattenTemplate } from "@shared/utils";
import { SettingsPane } from "./settings-pane.js";

/**
 * 【SettingsPane 仕様 (全画面設定モード専用ペイン・タブシェル)】
 *
 * 1. ペイン基本構造とヘッダー描画
 *    - 1-1. ルート要素 .settings-pane がレンダリングされること
 *    - 1-2. ヘッダー部 (.settings-pane__header) が存在し、タイトルとして「SETTINGS」(.settings-pane__title) が表示されること
 *
 * 2. タブグループと各サブビューの統合描画
 *    - 2-1. コンテンツ領域 (.settings-pane__content) 内に placement="start" が指定された wa-tab-group がレンダリングされること
 *    - 2-2. panel="templates" の wa-tab / wa-tab-panel がレンダリングされ、<settings-templates-view> が含まれること
 *    - 2-3. panel="tags" の wa-tab / wa-tab-panel がレンダリングされ、<settings-tags-view> が含まれること
 *    - 2-4. panel="auto-export" の wa-tab / wa-tab-panel がレンダリングされ、<settings-auto-export-view> が含まれること
 *    - 2-5. panel="history" の wa-tab / wa-tab-panel がレンダリングされ、<settings-history-view> が含まれること
 *    - 2-6. 旧ダミータブ（general, appearance）が存在しないこと
 *    - 2-7. settings-pane.ts 内に各サブビューの固有メソッド（renderHistoryPanel 等）が残存していないこと
 *
 * 3. BEM設計およびSCSSスタイルの検証
 *    - 3-1. SCSSスタイルシート (settings-pane.scss) が存在し、ルートブロック .settings-pane および主要シェルセレクタが定義されていること
 *    - 3-2. settings-pane.scss に !important 宣言が一切含まれていないこと
 *    - 3-3. settings-pane.scss に @extend が一切含まれていないこと
 *    - 3-4. settings-pane.scss 全体においてハードコードされたカラーコード（Hex / RGB / RGBA）が 0 件であること
 *    - 3-5. .settings-pane__tab-panel[active] の内部スロット（::part(base)）に高さ伝播スタイル（height: 100%）が定義され、3階層ネストが解消されていること
 */
describe("SettingsPane Component", () => {
  let element: SettingsPane;

  beforeEach(() => {
    element = new SettingsPane();
  });

  describe("1. ペイン基本構造とヘッダー描画", () => {
    it("1-1. ルート要素 .settings-pane がレンダリングされること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(/<div[^>]*class="[^"]*settings-pane[^"]*"/);
    });

    it("1-2. ヘッダー部 (.settings-pane__header) が存在し、タイトルとして「SETTINGS」が表示されること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<div[^>]*class="[^"]*settings-pane__header[^"]*"/,
      );
      expect(htmlStr).toMatch(
        /<span[^>]*class="[^"]*settings-pane__title[^"]*"[^>]*>\s*SETTINGS\s*<\/span>/,
      );
    });
  });

  describe("2. タブグループと各サブビューの統合描画", () => {
    it('2-1. コンテンツ領域内に placement="start" が指定された wa-tab-group がレンダリングされること', () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<div[^>]*class="[^"]*settings-pane__content[^"]*"/,
      );
      expect(htmlStr).toMatch(
        /<wa-tab-group[^>]*class="[^"]*settings-pane__tab-group[^"]*"[^>]*placement="start"/,
      );
    });

    it('2-2. panel="templates" の wa-tab / wa-tab-panel がレンダリングされ、<settings-templates-view> が含まれること', () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(/<wa-tab[^>]*panel="templates"/);
      expect(htmlStr).toMatch(/<wa-tab-panel[^>]*name="templates"/);
      expect(htmlStr).toContain("<settings-templates-view");
    });

    it('2-3. panel="tags" の wa-tab / wa-tab-panel がレンダリングされ、<settings-tags-view> が含まれること', () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(/<wa-tab[^>]*panel="tags"/);
      expect(htmlStr).toMatch(/<wa-tab-panel[^>]*name="tags"/);
      expect(htmlStr).toContain("<settings-tags-view");
    });

    it('2-4. panel="auto-export" の wa-tab / wa-tab-panel がレンダリングされ、<settings-auto-export-view> が含まれること', () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(/<wa-tab[^>]*panel="auto-export"/);
      expect(htmlStr).toMatch(/<wa-tab-panel[^>]*name="auto-export"/);
      expect(htmlStr).toContain("<settings-auto-export-view");
    });

    it('2-5. panel="history" の wa-tab / wa-tab-panel がレンダリングされ、<settings-history-view> が含まれること', () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(/<wa-tab[^>]*panel="history"/);
      expect(htmlStr).toMatch(/<wa-tab-panel[^>]*name="history"/);
      expect(htmlStr).toContain("<settings-history-view");
    });

    it("2-6. 旧ダミータブ（general, appearance）が存在しないこと", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).not.toContain('panel="general"');
      expect(htmlStr).not.toContain('panel="appearance"');
    });

    it("2-7. settings-pane.ts 内に各サブビューの固有メソッド（renderHistoryPanel 等）が残存していないこと", () => {
      const tsPath = path.resolve(__dirname, "./settings-pane.ts");
      const tsContent = fs.readFileSync(tsPath, "utf-8");
      expect(tsContent).not.toContain("renderHistoryPanel");
      expect(tsContent).not.toContain("renderAutoExportPanel");
      expect(tsContent).not.toContain("renderDetailForm");
    });
  });

  describe("3. BEM設計およびSCSSスタイルの検証", () => {
    const scssPath = path.resolve(__dirname, "./settings-pane.scss");

    it("3-1. SCSSスタイルシート (settings-pane.scss) が存在し、ルートブロック .settings-pane および主要シェルセレクタが定義されていること", () => {
      expect(fs.existsSync(scssPath)).toBe(true);
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).toMatch(/\.settings-pane\b/);
      expect(scss).toMatch(/__header\b/);
      expect(scss).toMatch(/__title\b/);
      expect(scss).toMatch(/__content\b/);
      expect(scss).toMatch(/__tab-group\b/);
      expect(scss).toMatch(/__tab-panel\b/);
    });

    it("3-2. settings-pane.scss に !important 宣言が一切含まれていないこと", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).not.toMatch(/!important/);
    });

    it("3-3. settings-pane.scss に @extend が一切含まれていないこと", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).not.toMatch(/@extend/);
    });

    it("3-4. settings-pane.scss 全体においてハードコードされたカラーコードが 0 件であること", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      const hexMatches = scss.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
      const rgbMatches = scss.match(/\brgba?\([^)]+\)/g) || [];
      expect(hexMatches.length + rgbMatches.length).toBe(0);
    });

    it("3-5. .settings-pane__tab-panel[active]::part(base) に高さ伝播スタイル（height: 100%）が定義され、3階層ネストが解消されていること", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).toMatch(/&\[active\]::part\(base\)\s*\{/);
      expect(scss).not.toMatch(/&\[active\]\s*\{[\s\S]*?&::part\(base\)/);
      const compiledCss = sass.compile(scssPath).css;
      expect(compiledCss).toMatch(
        /\.settings-pane__tab-panel\[active\]::part\(base\)\s*\{[^}]*?height:\s*100%/,
      );
    });
  });
});
