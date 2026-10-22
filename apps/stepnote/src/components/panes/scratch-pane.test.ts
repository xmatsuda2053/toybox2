import * as fs from "node:fs";
import * as path from "node:path";
import { describe, it, expect, beforeEach } from "vitest";
import { flattenTemplate } from "@shared/utils";
import type { ScratchController } from "@/controllers/scratch.controller.js";
import { ScratchPane } from "./scratch-pane.js";

/**
 * 【ScratchPane 仕様 (全画面Scratchモード専用ペイン)】
 *
 * 1. ペイン基本構造とヘッダー描画
 *    - 1-1. ルート要素 .scratch-pane がレンダリングされること
 *    - 1-2. ヘッダー部 (.scratch-pane__header) が存在し、タイトルとして「SCRATCH」(.scratch-pane__title) が表示されること
 *
 * 2. メインコンテンツ描画
 *    - 2-1. コンテンツ領域 (.scratch-pane__content) 内に notes-view コンポーネントが存在し、.showTabId=${false} および .controller に scratchController がバインドされていること
 *    - 2-2. theme プロパティが notes-view に伝播されること
 *
 * 3. BEM設計およびSCSSスタイルの検証
 *    - 3-1. SCSSスタイルシート (scratch-pane.scss) が存在し、ルートブロック .scratch-pane および主要セレクタが定義されていること
 *    - 3-2. scratch-pane.scss に !important 宣言が一切含まれていないこと
 *    - 3-3. scratch-pane.scss に @extend が一切含まれていないこと
 *    - 3-4. scratch-pane.scss 全体においてハードコードされたカラーコードが 0 件であること
 */
describe("ScratchPane Component", () => {
  let element: ScratchPane;
  let mockScratchController: Partial<ScratchController>;

  beforeEach(() => {
    element = new ScratchPane();
    mockScratchController = {
      state: [],
      subscribe: () => () => {},
    };
    element.scratchController = mockScratchController as ScratchController;
  });

  describe("1. ペイン基本構造とヘッダー描画", () => {
    it("1-1. ルート要素 .scratch-pane がレンダリングされること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(/<div[^>]*class="[^"]*scratch-pane[^"]*"/);
    });

    it("1-2. ヘッダー部 (.scratch-pane__header) が存在し、タイトルとして「SCRATCH」が表示されること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(/<div[^>]*class="[^"]*scratch-pane__header[^"]*"/);
      expect(htmlStr).toMatch(
        /<span[^>]*class="[^"]*scratch-pane__title[^"]*"[^>]*>\s*SCRATCH\s*<\/span>/,
      );
    });
  });

  describe("2. メインコンテンツ描画", () => {
    it("2-1. コンテンツ領域内に notes-view コンポーネントが存在し、.showTabId=${false} および .controller に scratchController がバインドされていること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(/<div[^>]*class="[^"]*scratch-pane__content[^"]*"/);
      expect(htmlStr).toMatch(/<notes-view/);
    });

    it("2-2. theme プロパティが notes-view に伝播されること", () => {
      element.theme = "dark";
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(/<notes-view[^>]*data-theme=["']?dark["']?/);
    });
  });

  describe("3. BEM設計およびSCSSスタイルの検証", () => {
    const scssPath = path.resolve(__dirname, "./scratch-pane.scss");

    it("3-1. SCSSスタイルシート (scratch-pane.scss) が存在し、ルートブロック .scratch-pane が定義されていること", () => {
      expect(fs.existsSync(scssPath)).toBe(true);
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).toMatch(/\.scratch-pane\b/);
      expect(scss).toMatch(/&__header\b/);
      expect(scss).toMatch(/&__content\b/);
    });

    it("3-2. scratch-pane.scss に !important 宣言が一切含まれていないこと", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).not.toMatch(/!important/);
    });

    it("3-3. scratch-pane.scss に @extend が一切含まれていないこと", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).not.toMatch(/@extend\b/);
    });

    it("3-4. scratch-pane.scss 全体においてハードコードされたカラーコードが 0 件であること", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(scss).not.toMatch(/\brgb\(/);
      expect(scss).not.toMatch(/\brgba\(/);
    });

    it("3-5. scratch-pane.scss において &__content に適切な余白（padding）および box-sizing: border-box が設定されていること", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).toMatch(/&__content\s*\{[\s\S]*?padding:\s*[^;]+;/);
      expect(scss).toMatch(/&__content\s*\{[\s\S]*?box-sizing:\s*border-box;/);
    });
  });
});
