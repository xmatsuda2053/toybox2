import { describe, expect, it } from "vitest";
import * as fs from "node:fs";

/**
 * StepNote ダイアログ共通スタイル仕様テスト（dialog-common.test.ts）
 *
 * 【仕様 1: dialog-common.scss モジュールの存在】
 * - 1-1: dialog-common.scss が存在すること
 *
 * 【仕様 2: Light モード ダイアログ共通 Mixin】
 * - 2-1: @mixin dialog-surface が定義され、ダイアログサーフェス（背景色、枠線、シャドウ、タイトル色・太さ）が指定されていること
 * - 2-2: @mixin dialog-form-layout が定義され、フォームレイアウト（flex, column, gap, padding）が指定されていること
 * - 2-3: @mixin dialog-field-layout が定義され、フォームフィールド（幅100%, コントロール背景色, 枠線, ラベル, input/textarea 文字色）が指定されていること
 * - 2-4: @mixin dialog-footer-layout が定義され、フッターボタングループ（flex, flex-end, gap）が指定されていること
 *
 * 【仕様 3: Dark モード ダイアログ共通 Mixin】
 * - 3-1: @mixin dialog-dark-surface が定義され、独立サーフェス背景色（#1c2128）、高コントラスト枠線（#444c56）、シャドウ、タイトル色（#ffffff）が指定されていること
 * - 3-2: @mixin dialog-field-dark-theme が定義され、コントロール背景色（#0d1117）、枠線（#444c56）、ラベル色、input/textarea 文字色（#ffffff）が指定されていること
 *
 * 【仕様 4: コンポーネント側での Mixin 適用と直書き重複排除】
 * - 4-1: navigation-labels.scss で dialog-common.scss がインポートされ、ダイアログおよびフォームに共通 Mixin が適用されていること
 * - 4-2: task-create-dialog.scss で dialog-common.scss がインポートされ、ダイアログおよびフォームに共通 Mixin が適用されていること
 */
describe("dialog-common.scss ダイアログ共通スタイル仕様", () => {
  const dialogCommonScssPath = new URL("./dialog-common.scss", import.meta.url);

  describe("1. モジュールの存在", () => {
    it("仕様 1-1: dialog-common.scss が存在すること", () => {
      expect(fs.existsSync(dialogCommonScssPath)).toBe(true);
    });
  });

  describe("2. Light モード ダイアログ共通 Mixin", () => {
    it("仕様 2-1: @mixin dialog-surface が定義され、ダイアログサーフェスが指定されていること", () => {
      const scss = fs.readFileSync(dialogCommonScssPath, "utf-8");
      expect(scss).toMatch(/@mixin\s+dialog-surface\s*\{/);

      const match = scss.match(/@mixin\s+dialog-surface\s*\{[\s\S]*?\n\}/);
      expect(match).not.toBeNull();
      const content = match![0];
      expect(content).toContain("--wa-form-control-label-color");
      expect(content).toContain("&::part(dialog)");
      expect(content).toContain("box-shadow");
      expect(content).toContain("&::part(title)");
      expect(content).toContain("&::part(body)");
    });

    it("仕様 2-2: @mixin dialog-form-layout が定義され、フォームレイアウトが指定されていること", () => {
      const scss = fs.readFileSync(dialogCommonScssPath, "utf-8");
      expect(scss).toMatch(/@mixin\s+dialog-form-layout\s*\{/);

      const match = scss.match(/@mixin\s+dialog-form-layout\s*\{[\s\S]*?\n\}/);
      expect(match).not.toBeNull();
      const content = match![0];
      expect(content).toMatch(/display:\s*flex;/);
      expect(content).toMatch(/flex-direction:\s*column;/);
      expect(content).toContain("gap:");
      expect(content).toContain("padding-block:");
    });

    it("仕様 2-3: @mixin dialog-field-layout が定義され、フォームフィールドが指定されていること", () => {
      const scss = fs.readFileSync(dialogCommonScssPath, "utf-8");
      expect(scss).toMatch(/@mixin\s+dialog-field-layout\s*\{/);

      const match = scss.match(/@mixin\s+dialog-field-layout\s*\{[\s\S]*?\n\}/);
      expect(match).not.toBeNull();
      const content = match![0];
      expect(content).toMatch(/width:\s*100%;/);
      expect(content).toContain("--wa-form-control-background-color");
      expect(content).toContain("--wa-form-control-border-color");
      expect(content).toContain("&::part(form-control-label)");
      expect(content).toContain("&::part(input)");
    });

    it("仕様 2-4: @mixin dialog-footer-layout が定義され、フッターボタングループが指定されていること", () => {
      const scss = fs.readFileSync(dialogCommonScssPath, "utf-8");
      expect(scss).toMatch(/@mixin\s+dialog-footer-layout\s*\{/);

      const match = scss.match(/@mixin\s+dialog-footer-layout\s*\{[\s\S]*?\n\}/);
      expect(match).not.toBeNull();
      const content = match![0];
      expect(content).toMatch(/display:\s*flex;/);
      expect(content).toMatch(/justify-content:\s*flex-end;/);
      expect(content).toContain("gap:");
    });
  });

  describe("3. Dark モード ダイアログ共通 Mixin", () => {
    it("仕様 3-1: @mixin dialog-dark-surface が定義され、高コントラスト独立サーフェスが指定されていること", () => {
      const scss = fs.readFileSync(dialogCommonScssPath, "utf-8");
      expect(scss).toMatch(/@mixin\s+dialog-dark-surface\s*\{/);

      const match = scss.match(/@mixin\s+dialog-dark-surface\s*\{[\s\S]*?\n\}/);
      expect(match).not.toBeNull();
      const content = match![0];
      expect(content).toContain("#1c2128");
      expect(content).toContain("#444c56");
      expect(content).toContain("#f0f6fc");
      expect(content).toContain("#ffffff");
    });

    it("仕様 3-2: @mixin dialog-field-dark-theme が定義され、コントロール背景色・文字色が指定されていること", () => {
      const scss = fs.readFileSync(dialogCommonScssPath, "utf-8");
      expect(scss).toMatch(/@mixin\s+dialog-field-dark-theme\s*\{/);

      const match = scss.match(/@mixin\s+dialog-field-dark-theme\s*\{[\s\S]*?\n\}/);
      expect(match).not.toBeNull();
      const content = match![0];
      expect(content).toContain("#0d1117");
      expect(content).toContain("#444c56");
      expect(content).toContain("#ffffff");
    });
  });

  describe("4. コンポーネント側での Mixin 適用と直書き重複排除", () => {
    const navLabelsScssPath = new URL(
      "../components/panes/pane-navigation/navigation-labels.scss",
      import.meta.url,
    );
    const taskCreateDialogScssPath = new URL(
      "../components/panes/pane-task-list/task-create-dialog.scss",
      import.meta.url,
    );

    it("仕様 4-1: navigation-labels.scss で dialog-common.scss がインポートされ、ダイアログ共通 Mixin が適用されていること", () => {
      const scss = fs.readFileSync(navLabelsScssPath, "utf-8");
      expect(scss).toMatch(/dialog-common\.scss/);
      expect(scss).toContain("@include dialog-surface");
      expect(scss).toContain("@include dialog-form-layout");
      expect(scss).toContain("@include dialog-field-layout");
      expect(scss).toContain("@include dialog-footer-layout");
      expect(scss).toContain("@include dialog-dark-surface");
    });

    it("仕様 4-2: task-create-dialog.scss で dialog-common.scss がインポートされ、ダイアログ共通 Mixin が適用されていること", () => {
      const scss = fs.readFileSync(taskCreateDialogScssPath, "utf-8");
      expect(scss).toMatch(/dialog-common\.scss/);
      expect(scss).toContain("@include dialog-surface");
      expect(scss).toContain("@include dialog-form-layout");
      expect(scss).toContain("@include dialog-field-layout");
      expect(scss).toContain("@include dialog-footer-layout");
      expect(scss).toContain("@include dialog-dark-surface");
    });
  });
});
