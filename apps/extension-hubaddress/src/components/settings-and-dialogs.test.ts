import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { flattenTemplate } from "@shared/utils";
import { renderSettingsView } from "./settings-view";
import { createStaffFormState, renderEditorDialogs } from "./editor-dialogs";

/**
 * テスト仕様: 設定ビュー・編集ダイアログの UI / SCSS 規約検証 (settings-and-dialogs.test.ts)
 *
 * - 仕様1: settings-view.scss および editor-dialogs.scss にカラー直値・!important・@extend が含まれないこと
 * - 仕様2: settings-view.ts および editor-dialogs.ts 内の wa-tooltip に trigger="hover" が明示指定されていること
 * - 仕様3: manifest.json にショートカットコマンド (Alt+Shift+H) が定義され、設定ビューにも案内が含まれること
 * - 仕様4: 設定ビューのカラーテーマボタンがアイコンのみ＋ホバーツールチップ（ライト・ダーク・システム）で構成されていること
 * - 仕様5: renderSettingsView / renderEditorDialogs 関数がエクスポートされていること
 * - 仕様6: settings-view.ts / editor-dialogs.ts 内で Web Awesome 非推奨の size 属性値（small / medium / large）が使われていないこと
 * - 仕様7: 設定画面のショートカット説明で英単語・設定 URL に折り返し防止が設定されていること
 * - 仕様8: データ管理セクションに冗長な文字コード自動判別・インポート説明文が含まれないこと
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

  it("設定ビューのテーマ切替がアイコンボタン＋ホバーツールチップで構成されていること", () => {
    const rendered = flattenTemplate(
      renderSettingsView({
        staffCount: 1,
        organizationCount: 1,
        themeMode: "system",
        onChangeTheme: () => {},
        onRequestImport: () => {},
        onExportStaffCsv: () => {},
        onExportOrgCsv: () => {},
        onExportJson: () => {},
        onRequestClearAll: () => {},
      }),
    );
    expect(rendered).toContain("<wa-button-group");
    expect(rendered).toContain("sun-solid-full");
    expect(rendered).toContain("moon-solid-full");
    expect(rendered).toContain("display-solid-full");
    expect(rendered).toMatch(/for="?theme-btn-light"?\s+trigger="hover"/);
    expect(rendered).toMatch(/for="?theme-btn-dark"?\s+trigger="hover"/);
    expect(rendered).toMatch(/for="?theme-btn-system"?\s+trigger="hover"/);
  });

  it("renderSettingsView と renderEditorDialogs が定義されていること", () => {
    expect(renderSettingsView).toBeTypeOf("function");
    expect(renderEditorDialogs).toBeTypeOf("function");
  });

  it("職員編集ダイアログにフリガナ入力欄が含まれ、createStaffFormState で初期値を受け継ぐこと", () => {
    const form = createStaffFormState({
      id: 1,
      staffId: "0010001",
      name: "田中 太郎",
      furigana: "たなか たろう",
      department: "総務課",
      title: "課長",
      emails: [],
    });
    expect(form.furigana).toBe("たなか たろう");

    const rendered = flattenTemplate(
      renderEditorDialogs({
        staffForm: form,
        orgForm: null,
        deleteTarget: null,
        pendingImport: null,
        isClearAllConfirmOpen: false,
        onUpdateStaffForm: () => {},
        onSaveStaffForm: () => {},
        onCloseStaffForm: () => {},
        onUpdateOrgForm: () => {},
        onSaveOrgForm: () => {},
        onCloseOrgForm: () => {},
        onConfirmDelete: () => {},
        onCancelDelete: () => {},
        onConfirmImport: () => {},
        onCancelImport: () => {},
        onConfirmClearAll: () => {},
        onCancelClearAll: () => {},
      }),
    );
    expect(rendered).toContain('label="フリガナ"');
  });

  it("テンプレート内で Web Awesome 非推奨の size='small' / 'medium' / 'large' が使われていないこと", () => {
    for (const filePath of templateFiles) {
      const content = readFileSync(filePath, "utf-8");
      expect(content).not.toMatch(/size\s*=\s*["'](?:small|medium|large)["']/);
    }
  });

  it("設定画面のショートカット説明で英文や設定 URL が途中改行されないよう定義されていること", () => {
    const settingsScss = readFileSync(
      resolve(__dirname, "settings-view.scss"),
      "utf-8",
    );
    expect(settingsScss).toMatch(
      /\.settings-view__shortcut-code\s*\{[^}]*white-space:\s*nowrap/s,
    );
    expect(settingsScss).toMatch(
      /\.settings-view__nowrap\s*\{[^}]*white-space:\s*nowrap/s,
    );
    expect(settingsScss).toMatch(
      /\.settings-view__shortcut-url\s*\{[^}]*white-space:\s*nowrap/s,
    );

    const rendered = flattenTemplate(
      renderSettingsView({
        staffCount: 0,
        organizationCount: 0,
        themeMode: "system",
        onChangeTheme: () => {},
        onRequestImport: () => {},
        onExportStaffCsv: () => {},
        onExportOrgCsv: () => {},
        onExportJson: () => {},
        onRequestClearAll: () => {},
      }),
    );
    expect(rendered).toContain('class="settings-view__nowrap">HubAddress<');
    expect(rendered).toMatch(
      /class="settings-view__shortcut-url"\s*>chrome:\/\/extensions\/shortcuts\s*<\/code\s*>/,
    );
    expect(rendered).toMatch(
      /class="settings-view__shortcut-url"\s*>edge:\/\/extensions\/shortcuts\s*<\/code\s*>/,
    );
  });

  it("データ管理セクションに冗長な文字コード自動判別・インポート説明文が含まれないこと", () => {
    const rendered = flattenTemplate(
      renderSettingsView({
        staffCount: 0,
        organizationCount: 0,
        themeMode: "system",
        onChangeTheme: () => {},
        onRequestImport: () => {},
        onExportStaffCsv: () => {},
        onExportOrgCsv: () => {},
        onExportJson: () => {},
        onRequestClearAll: () => {},
      }),
    );
    expect(rendered).not.toContain("UTF-8 / Shift_JIS 自動判別");
    expect(rendered).not.toContain("確認後に全件洗い替え");
    expect(rendered).toContain("データ管理（CSV / JSON）");
    expect(rendered).toContain("職員 CSV をインポート");
    expect(rendered).toContain("組織 CSV をインポート");
    expect(rendered).toContain("一括 JSON をインポート");
  });
});
