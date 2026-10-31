import * as fs from "node:fs";
import * as path from "node:path";
import { describe, it, expect, beforeEach } from "vitest";
import { flattenTemplate } from "@shared/utils";
import { SettingsPane } from "./settings-pane.js";

/**
 * 【SettingsPane 仕様 (全画面設定モード専用ペイン)】
 *
 * 1. ペイン基本構造とヘッダー描画
 *    - 1-1. ルート要素 .settings-pane がレンダリングされること
 *    - 1-2. ヘッダー部 (.settings-pane__header) が存在し、タイトルとして「SETTINGS」(.settings-pane__title) が表示されること
 *
 * 2. タブグループとダミータブの描画・切り替え
 *    - 2-1. コンテンツ領域 (.settings-pane__content) 内に placement="start" が指定された wa-tab-group.settings-pane__tab-group がレンダリングされること
 *    - 2-2. ダミータブとして panel="general"（General）および panel="appearance"（Appearance）の wa-tab と、対応する wa-tab-panel がレンダリングされること
 *    - 2-3. 初期状態の activeTab が "general" であり、handleTabShow イベントハンドラーにより activeTab が切り替わること（未定義のタブ名では切り替わらないこと）
 *
 * 3. BEM設計およびSCSSスタイルの検証
 *    - 3-1. SCSSスタイルシート (settings-pane.scss) が存在し、ルートブロック .settings-pane および主要セレクタが定義されていること
 *    - 3-2. settings-pane.scss に !important 宣言が一切含まれていないこと
 *    - 3-3. settings-pane.scss に @extend が一切含まれていないこと
 *    - 3-4. settings-pane.scss 全体においてハードコードされたカラーコード（Hex / RGB / RGBA）が 0 件であること
 *    - 3-5. settings-pane.scss において wa-tab-group の周囲に余白（padding）および box-sizing: border-box が設定されていること
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

  describe("2. タブグループとダミータブの描画・切り替え", () => {
    it("2-1. コンテンツ領域 (.settings-pane__content) 内に placement=\"start\" が指定された wa-tab-group.settings-pane__tab-group がレンダリングされること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<div[^>]*class="[^"]*settings-pane__content[^"]*"/,
      );
      expect(htmlStr).toMatch(
        /<wa-tab-group[^>]*class="[^"]*settings-pane__tab-group[^"]*"[^>]*placement="start"/,
      );
    });

    it("2-2. ダミータブとして panel=\"general\"（General）および panel=\"appearance\"（Appearance）の wa-tab と、対応する wa-tab-panel がレンダリングされること", () => {
      const htmlStr = flattenTemplate(element.render());
      expect(htmlStr).toMatch(
        /<wa-tab[^>]*panel="general"[^>]*>\s*General\s*<\/wa-tab>/,
      );
      expect(htmlStr).toMatch(
        /<wa-tab[^>]*panel="appearance"[^>]*>\s*Appearance\s*<\/wa-tab>/,
      );
      expect(htmlStr).toMatch(/<wa-tab-panel[^>]*name="general"/);
      expect(htmlStr).toMatch(/<wa-tab-panel[^>]*name="appearance"/);
    });

    it("2-3. 初期状態の activeTab が \"general\" であり、handleTabShow イベントハンドラーにより activeTab が切り替わること", () => {
      expect(element.activeTab).toBe("general");

      element.handleTabShow(
        new CustomEvent("wa-tab-show", { detail: { name: "appearance" } }),
      );
      expect(element.activeTab).toBe("appearance");

      element.handleTabShow(
        new CustomEvent("wa-tab-show", { detail: { name: "unknown" } }),
      );
      expect(element.activeTab).toBe("appearance");
    });
  });

  describe("3. BEM設計およびSCSSスタイルの検証", () => {
    const scssPath = path.resolve(__dirname, "./settings-pane.scss");

    it("3-1. SCSSスタイルシート (settings-pane.scss) が存在し、ルートブロック .settings-pane が定義されていること", () => {
      expect(fs.existsSync(scssPath)).toBe(true);
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).toMatch(/\.settings-pane\b/);
      expect(scss).toMatch(/__header\b/);
      expect(scss).toMatch(/__content\b/);
      expect(scss).toMatch(/__tab-group\b/);
    });

    it("3-2. settings-pane.scss に !important 宣言が一切含まれていないこと", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).not.toMatch(/!important/);
    });

    it("3-3. settings-pane.scss に @extend が一切含まれていないこと", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).not.toMatch(/@extend\b/);
    });

    it("3-4. settings-pane.scss 全体においてハードコードされたカラーコードが 0 件であること", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(scss).not.toMatch(/\brgb\(/);
      expect(scss).not.toMatch(/\brgba\(/);
    });

    it("3-5. settings-pane.scss において wa-tab-group の周囲に余白（padding）および box-sizing: border-box が設定されていること", () => {
      const scss = fs.readFileSync(scssPath, "utf-8");
      expect(scss).toMatch(/padding:\s*[^;]+;/);
      expect(scss).toMatch(/box-sizing:\s*border-box;/);
    });
  });
});

