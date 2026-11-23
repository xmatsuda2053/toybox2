import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { renderSettingsView } from "./settings-view";
import { renderEditorDialogs } from "./editor-dialogs";

/**
 * テスト仕様: 設定ビュー・編集ダイアログの UI / SCSS 規約検証 (settings-and-dialogs.test.ts)
 *
 * - 仕様1: settings-view.scss および editor-dialogs.scss にカラー直値・!important・@extend が含まれないこと
 * - 仕様2: settings-view.ts および editor-dialogs.ts 内の wa-tooltip に trigger="hover" が明示指定されていること
 * - 仕様3: manifest.json にショートカットコマンド (Alt+Shift+H) が定義され、設定ビューにも案内が含まれること
 * - 仕様4: renderSettingsView / renderEditorDialogs 関数がエクスポートされていること
 */
describe("Settings View & Editor Dialogs Compliance Tests", () => {
  const srcRoot = resolve(__dirname, "..");
  const scssFiles = [
    resolve(__dirname, "settings-view.scss"),
    resolve(__dirname, "editor-dialogs.scss"),
  ];
  const templateFiles = [
    resolve(__dirname, "settings-view.ts"),
    resolve(__dirname, "editor-dialogs.ts"),
  ];

  it("SCSS ファイルにカラー直値・!important・@extend が含まれないこと", () => {
    for (const filePath of scssFiles) {
      const scss = readFileSync(filePath, "utf-8");
      expect(scss).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(scss).not.toMatch(/\brgba?\(/i);
      expect(scss).not.toMatch(/!important/i);
      expect(scss).not.toMatch(/@extend\b/);
    }
  });

  it("テンプレート内の wa-tooltip に trigger='hover' が明示指定されていること", () => {
    for (const filePath of templateFiles) {
      const content = readFileSync(filePath, "utf-8");
      const matches = content.match(/<wa-tooltip\b[^>]*>/g) ?? [];
      for (const tag of matches) {
        expect(tag).toContain('trigger="hover"');
      }
    }
  });

  it("manifest.json にショートカットコマンドが定義され、設定画面にもショートカット案内が含まれること", () => {
    const manifestRaw = readFileSync(
      resolve(srcRoot, "../public/manifest.json"),
      "utf-8",
    );
    const manifest = JSON.parse(manifestRaw) as {
      commands?: Record<string, { suggested_key?: { default?: string } }>;
    };
    expect(
      manifest.commands?.["open-hubaddress-sidepanel"]?.suggested_key?.default,
    ).toBe("Alt+Shift+H");

    const settingsSource = readFileSync(
      resolve(__dirname, "settings-view.ts"),
      "utf-8",
    );
    expect(settingsSource).toContain("Alt+Shift+H");
  });

  it("renderSettingsView と renderEditorDialogs が定義されていること", () => {
    expect(renderSettingsView).toBeTypeOf("function");
    expect(renderEditorDialogs).toBeTypeOf("function");
  });
});
