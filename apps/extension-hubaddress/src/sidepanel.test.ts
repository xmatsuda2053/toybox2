import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { HubAddressApp } from "./hubaddress-app";

/**
 * テスト仕様: Side Panel シェル UI および SCSS 規約検証 (sidepanel.test.ts)
 *
 * - 仕様1: hubaddress-app.scss および directory-cards.scss にカラー直値（Hex / RGB / RGBA）・!important・@extend が含まれないこと
 * - 仕様2: hubaddress-app.scss に幅広時（min-width: 680px）の並列レイアウト用メディアクエリが定義されていること
 * - 仕様3: hubaddress-app.ts / カードテンプレート内の wa-tooltip に trigger="hover" が明示指定されていること
 * - 仕様4: お気に入り機能関連の UI / スタイル / 文言が含まれていないこと
 * - 仕様5: HubAddressApp カスタム要素クラスが定義されていること
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

  it("hubaddress-app.scss に幅広時（min-width: 680px）の並列レイアウト定義が含まれること", () => {
    const scss = readFileSync(resolve(srcRoot, "hubaddress-app.scss"), "utf-8");
    expect(scss).toMatch(/@media\s*\(\s*min-width:\s*680px\s*\)/);
    expect(scss).toContain(".hubaddress-shell__split-grid");
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

  it("お気に入り関連の UI やクラス・文言が存在しないこと", () => {
    const checkTargets = [
      ...scssFiles,
      ...templateFiles,
      resolve(srcRoot, "components/settings-view.ts"),
      resolve(srcRoot, "components/editor-dialogs.ts"),
    ];
    for (const filePath of checkTargets) {
      const content = readFileSync(filePath, "utf-8");
      expect(content).not.toContain("お気に入り");
      expect(content).not.toContain("directory-card--favorite");
      expect(content).not.toContain("directory-card__fav-btn");
      expect(content).not.toContain("hubaddress-fav-filter-btn");
    }
  });

  it("HubAddressApp カスタム要素クラスが定義されていること", () => {
    expect(HubAddressApp).toBeDefined();
  });
});
