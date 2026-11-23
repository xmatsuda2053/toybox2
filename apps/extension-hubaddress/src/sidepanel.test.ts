import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
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

  it("HubAddressApp カスタム要素クラスが定義されていること", () => {
    expect(HubAddressApp).toBeDefined();
  });
});
