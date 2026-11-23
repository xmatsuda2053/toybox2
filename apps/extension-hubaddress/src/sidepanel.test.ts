import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { flattenTemplate } from "@shared/utils";
import { HubAddressApp } from "./hubaddress-app";
import {
  renderOrganizationCard,
  renderStaffCard,
} from "./components/directory-cards";

/**
 * テスト仕様: Side Panel シェル UI・カードレイアウト・SCSS 規約検証 (sidepanel.test.ts)
 *
 * - 仕様1: hubaddress-app.scss および directory-cards.scss にカラー直値（Hex / RGB / RGBA）・!important・@extend が含まれないこと
 * - 仕様2: テーマ切替時の点滅を防ぐため :host に背景色・文字色の transition が設定されていないこと、カードホバー背景色と中央揃えが定義されていること
 * - 仕様3: 検索入力に with-clear が設定され、「すべての所属」ドロップダウンが除去されていること、タブにアイコンがあること
 * - 仕様4: 職員カードは先頭に5桁職員番号が表示され、メール欄は初期非表示・展開操作時のみ表示されること
 * - 仕様5: 組織カードは「場所」が連絡先の下に配置されていること
 * - 仕様6: テンプレート内の全 wa-tooltip に trigger="hover" が明示指定されていること
 * - 仕様7: manifest.json に icons / action.default_icon (16/32/48/128) が設定され、PNG 実体が存在すること
 * - 仕様8: sidepanel.ts が ./hubaddress-app より先に ./bootstrap-webawesome をインポートし、アプリ内重複ヘッダーが削除されていること
 * - 仕様9: 職員・組織の追加ボタンがプラスアイコンのみで構成され、aria-label とホバーツールチップで説明が表示されること
 */
describe("Side Panel Shell & SCSS Compliance Tests", () => {
  const srcRoot = resolve(__dirname);
  const scssFiles = [
    resolve(srcRoot, "hubaddress-app.scss"),
    resolve(srcRoot, "components/directory-cards.scss"),
  ];
  const templateFiles = [
    resolve(srcRoot, "hubaddress-app.ts"),
    resolve(srcRoot, "components/directory-cards.ts"),
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

  it("点滅防止・ホバー背景色・カードヘッダー中央揃え・文字サイズ拡大・並列レイアウトが定義されていること", () => {
    const shellScss = readFileSync(
      resolve(srcRoot, "hubaddress-app.scss"),
      "utf-8",
    );
    expect(shellScss).toMatch(/@media\s*\(\s*min-width:\s*680px\s*\)/);
    expect(shellScss).toContain(".hubaddress-shell__split-grid");
    expect(shellScss).not.toMatch(/:host\s*\{[^}]*transition:/s);

    const cardScss = readFileSync(
      resolve(srcRoot, "components/directory-cards.scss"),
      "utf-8",
    );
    expect(cardScss).toContain(".directory-card:hover");
    expect(cardScss).toMatch(
      /\.directory-card__header\s*\{[^}]*align-items:\s*center/s,
    );
    expect(cardScss).toContain("--wa-font-size-m");
    expect(cardScss).toMatch(
      /\.directory-card__staff-id\s*\{[^}]*font-size:\s*var\(--wa-font-size-s\)/s,
    );
  });

  it("検索入力に with-clear が設定され、すべての所属ドロップダウンがなく、タブにアイコンが設定されていること", () => {
    const appSource = readFileSync(
      resolve(srcRoot, "hubaddress-app.ts"),
      "utf-8",
    );
    expect(appSource).toContain("with-clear");
    expect(appSource).not.toContain("clearable");
    expect(appSource).not.toContain("すべての所属");
    expect(appSource).not.toContain("<wa-select");
    expect(appSource).toContain("user-solid-full");
    expect(appSource).toContain("building-solid-full");
  });

  it("職員カード先頭に5桁職員番号が表示され、メールは初期非表示・展開時のみ表示されること", () => {
    const staff = {
      id: 1,
      staffId: "0010001",
      name: "田中 太郎",
      department: "総務部 総務課",
      title: "課長",
      emails: ["tanaka@example.com"],
    };

    const collapsedHtml = flattenTemplate(
      renderStaffCard(staff, 0, {
        isEmailsExpanded: false,
        onToggleEmails: () => {},
        onJumpToDepartment: () => {},
        onCopy: () => {},
      }),
    );
    const idIdx = collapsedHtml.indexOf("10001");
    const nameIdx = collapsedHtml.indexOf("田中 太郎");
    expect(idIdx).toBeGreaterThan(-1);
    expect(nameIdx).toBeGreaterThan(idIdx);
    expect(collapsedHtml).toContain("envelope-solid-full");
    expect(collapsedHtml).toContain("angle-down-solid-full");
    expect(collapsedHtml).not.toContain("tanaka@example.com");

    const expandedHtml = flattenTemplate(
      renderStaffCard(staff, 0, {
        isEmailsExpanded: true,
        onToggleEmails: () => {},
        onJumpToDepartment: () => {},
        onCopy: () => {},
      }),
    );
    expect(expandedHtml).toContain("tanaka@example.com");
  });

  it("組織カードでは場所が連絡先の下に配置されていること", () => {
    const org = {
      id: 1,
      department: "総務部 総務課",
      extra: "本庁舎 3階",
      location: "3F-A",
      title: "課長席",
      extensionNumber: "2101",
      phoneNumber: "03-1234-2101",
      faxNumber: "03-1234-2109",
      notes: "代表窓口",
    };

    const htmlStr = flattenTemplate(
      renderOrganizationCard(org, 0, {
        onCopy: () => {},
      }),
    );
    const contactsIdx = htmlStr.indexOf("2101");
    const placeIdx = htmlStr.indexOf("本庁舎 3階");
    expect(contactsIdx).toBeGreaterThan(-1);
    expect(placeIdx).toBeGreaterThan(contactsIdx);
  });

  it("テンプレート内の全 wa-tooltip に trigger='hover' が明示指定されていること", () => {
    let tooltipCount = 0;
    for (const filePath of templateFiles) {
      const content = readFileSync(filePath, "utf-8");
      const matches = content.match(/<wa-tooltip\b[^>]*>/g) ?? [];
      for (const tag of matches) {
        tooltipCount++;
        expect(tag).toContain('trigger="hover"');
      }
    }
    expect(tooltipCount).toBeGreaterThan(0);
  });

  it("manifest.json にツールバー・拡張機能アイコン (16/32/48/128) が設定され、PNG ファイルが存在すること", () => {
    const publicDir = resolve(srcRoot, "../public");
    const manifest = JSON.parse(
      readFileSync(resolve(publicDir, "manifest.json"), "utf-8"),
    ) as {
      icons?: Record<string, string>;
      action?: { default_icon?: Record<string, string> };
    };

    const requiredSizes = ["16", "32", "48", "128"];
    const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

    for (const size of requiredSizes) {
      const iconPath = manifest.icons?.[size];
      const actionIconPath = manifest.action?.default_icon?.[size];
      expect(iconPath).toBeTruthy();
      expect(actionIconPath).toBe(iconPath);

      const fullPath = resolve(publicDir, iconPath!);
      expect(existsSync(fullPath)).toBe(true);
      const header = Array.from(readFileSync(fullPath).subarray(0, 8));
      expect(header).toEqual(pngSignature);
    }
  });

  it("sidepanel.ts が hubaddress-app より先にアイコン登録ブートストラップを読み込み、アプリ内重複ヘッダーが削除されていること", () => {
    const bootstrapPath = resolve(srcRoot, "bootstrap-webawesome.ts");
    expect(existsSync(bootstrapPath)).toBe(true);
    const bootstrapSource = readFileSync(bootstrapPath, "utf-8");
    expect(bootstrapSource).toContain("registerWebAwesome()");

    const sidepanelSource = readFileSync(
      resolve(srcRoot, "sidepanel.ts"),
      "utf-8",
    );
    const bootstrapImportIdx = sidepanelSource.indexOf(
      'import "./bootstrap-webawesome"',
    );
    const appImportIdx = sidepanelSource.indexOf('import "./hubaddress-app"');
    expect(bootstrapImportIdx).toBeGreaterThan(-1);
    expect(appImportIdx).toBeGreaterThan(bootstrapImportIdx);

    const appSource = readFileSync(
      resolve(srcRoot, "hubaddress-app.ts"),
      "utf-8",
    );
    expect(appSource).not.toContain("hubaddress-shell__header");
    expect(appSource).not.toContain("hubaddress-shell__brand");
    expect(appSource).not.toContain("hubaddress-shell__title");
    expect(appSource).not.toContain("renderHeader");

    const shellScss = readFileSync(
      resolve(srcRoot, "hubaddress-app.scss"),
      "utf-8",
    );
    expect(shellScss).not.toContain(".hubaddress-shell__header");
    expect(shellScss).not.toContain(".hubaddress-shell__brand");
    expect(shellScss).not.toContain(".hubaddress-shell__title");
  });

  it("職員・組織の追加ボタンがプラスアイコンのみで、ホバーツールチップにより説明が表示されること", () => {
    const appSource = readFileSync(
      resolve(srcRoot, "hubaddress-app.ts"),
      "utf-8",
    );

    const staffBtnMatch = appSource.match(
      /<wa-button[^>]*id="add-staff-btn"[^>]*>([\s\S]*?)<\/wa-button>/,
    );
    expect(staffBtnMatch).not.toBeNull();
    expect(staffBtnMatch?.[0]).toContain('aria-label="職員を追加"');
    expect(staffBtnMatch?.[1]).toContain('name="plus-solid-full"');
    expect(staffBtnMatch?.[1]).not.toContain("職員を追加");
    expect(appSource).toMatch(
      /<wa-tooltip\s+for="add-staff-btn"\s+trigger="hover"\s*>\s*職員を追加\s*<\/wa-tooltip\s*>/,
    );

    const orgBtnMatch = appSource.match(
      /<wa-button[^>]*id="add-organization-btn"[^>]*>([\s\S]*?)<\/wa-button>/,
    );
    expect(orgBtnMatch).not.toBeNull();
    expect(orgBtnMatch?.[0]).toContain('aria-label="組織を追加"');
    expect(orgBtnMatch?.[1]).toContain('name="plus-solid-full"');
    expect(orgBtnMatch?.[1]).not.toContain("組織を追加");
    expect(appSource).toMatch(
      /<wa-tooltip\s+for="add-organization-btn"\s+trigger="hover"\s*>\s*組織を追加\s*<\/wa-tooltip\s*>/,
    );
  });

  it("HubAddressApp カスタム要素クラスが定義されていること", () => {
    expect(HubAddressApp).toBeDefined();
  });
});
