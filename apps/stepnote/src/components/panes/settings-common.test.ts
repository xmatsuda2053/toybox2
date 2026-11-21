import * as fs from "node:fs";
import * as path from "node:path";
import { describe, it, expect } from "vitest";

/**
 * 【SettingsCommon SCSS 共通 Mixin 仕様 (settings-common.scss)】
 *
 * 1. settings-common.scss の基本品質
 *    - 1-1. settings-common.scss が存在し、!important / @extend / カラー直値を含まないこと
 *    - 1-2. 3階層以上の深いセレクタネストを含まないこと
 *
 * 2. 共通 Mixin 群の定義（SCSS-020）
 *    - 2-1. ホストレイアウト（@mixin settings-view-host）が定義されていること
 *    - 2-2. マスタ・ディテール基盤（@mixin settings-master-detail, settings-master-pane, settings-master-header, settings-master-title, settings-master-list, settings-detail-pane）が定義されていること
 *    - 2-3. リストアイテム・メニュー（@mixin settings-master-item, settings-master-item-selected, settings-item-main, settings-item-title, settings-item-dropdown, settings-btn-menu）が定義されていること
 *    - 2-4. アイコンボタン・空状態・セクション（@mixin settings-icon-action-btn, settings-empty-state, settings-section-title, settings-section-desc）が定義されていること
 *    - 2-5. フォーム・ダイアログ共通（@mixin settings-form-base, settings-form-header, settings-form-title, settings-form-actions, settings-form-error, settings-dialog-body, settings-dialog-footer）が定義されていること
 *
 * 3. 各設定サブビュー SCSS への適用
 *    - 3-1. settings-tags-view.scss, settings-tag-sets-view.scss, settings-templates-view.scss, settings-auto-export-view.scss, settings-history-view.scss が settings-common.scss を @use し、@include settings-view-host を適用していること
 */
describe("settings-common.scss 共通スタイル仕様", () => {
  const panesDir = path.resolve(__dirname);
  const commonPath = path.resolve(panesDir, "settings-common.scss");

  describe("1. 基本品質", () => {
    it("1-1. settings-common.scss が存在し、!important / @extend / カラー直値を含まないこと", () => {
      expect(fs.existsSync(commonPath)).toBe(true);
      const scss = fs.readFileSync(commonPath, "utf-8");
      expect(scss).not.toMatch(/!important/);
      expect(scss).not.toMatch(/@extend/);
      expect(scss).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(scss).not.toMatch(/\brgba?\([^)]+\)/);
    });
  });

  describe("2. 共通 Mixin 群の定義（SCSS-020）", () => {
    it("2-1. @mixin settings-view-host が定義されていること", () => {
      const scss = fs.readFileSync(commonPath, "utf-8");
      expect(scss).toMatch(/@mixin\s+settings-view-host\b/);
    });

    it("2-2. マスタ・ディテール基盤 Mixin 群が定義されていること", () => {
      const scss = fs.readFileSync(commonPath, "utf-8");
      expect(scss).toMatch(/@mixin\s+settings-master-detail\b/);
      expect(scss).toMatch(/@mixin\s+settings-master-pane\b/);
      expect(scss).toMatch(/@mixin\s+settings-master-header\b/);
      expect(scss).toMatch(/@mixin\s+settings-master-title\b/);
      expect(scss).toMatch(/@mixin\s+settings-master-list\b/);
      expect(scss).toMatch(/@mixin\s+settings-detail-pane\b/);
    });

    it("2-3. リストアイテム・メニュー Mixin 群が定義されていること", () => {
      const scss = fs.readFileSync(commonPath, "utf-8");
      expect(scss).toMatch(/@mixin\s+settings-master-item\b/);
      expect(scss).toMatch(/@mixin\s+settings-master-item-selected\b/);
      expect(scss).toMatch(/@mixin\s+settings-item-main\b/);
      expect(scss).toMatch(/@mixin\s+settings-item-title\b/);
      expect(scss).toMatch(/@mixin\s+settings-item-dropdown\b/);
      expect(scss).toMatch(/@mixin\s+settings-btn-menu\b/);
    });

    it("2-4. アイコンボタン・空状態・セクション Mixin 群が定義されていること", () => {
      const scss = fs.readFileSync(commonPath, "utf-8");
      expect(scss).toMatch(/@mixin\s+settings-icon-action-btn\b/);
      expect(scss).toMatch(/@mixin\s+settings-empty-state\b/);
      expect(scss).toMatch(/@mixin\s+settings-section-title\b/);
      expect(scss).toMatch(/@mixin\s+settings-section-desc\b/);
    });

    it("2-5. フォーム・ダイアログ共通 Mixin 群が定義されていること", () => {
      const scss = fs.readFileSync(commonPath, "utf-8");
      expect(scss).toMatch(/@mixin\s+settings-form-base\b/);
      expect(scss).toMatch(/@mixin\s+settings-form-header\b/);
      expect(scss).toMatch(/@mixin\s+settings-form-title\b/);
      expect(scss).toMatch(/@mixin\s+settings-form-actions\b/);
      expect(scss).toMatch(/@mixin\s+settings-form-error\b/);
      expect(scss).toMatch(/@mixin\s+settings-dialog-body\b/);
      expect(scss).toMatch(/@mixin\s+settings-dialog-footer\b/);
    });
  });

  describe("3. 各設定サブビュー SCSS への適用", () => {
    const targetFiles = [
      "settings-tags-view.scss",
      "settings-tag-sets-view.scss",
      "settings-templates-view.scss",
      "settings-auto-export-view.scss",
      "settings-history-view.scss",
    ];

    it("3-1. 全設定サブビュー SCSS が settings-common.scss を @use し、@include settings-view-host を適用していること", () => {
      for (const file of targetFiles) {
        const scss = fs.readFileSync(path.resolve(panesDir, file), "utf-8");
        expect(scss).toMatch(/@use\s+["']\.\/settings-common\.scss["']\s+as\s+\*;/);
        expect(scss).toContain("@include settings-view-host;");
      }
    });
  });
});
