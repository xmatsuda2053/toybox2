import * as fs from "node:fs";
import * as path from "node:path";
import { describe, it, expect } from "vitest";

/**
 * 【HubOffice SCSS 共通 Mixin 規約テスト (styles/mixins.scss)】
 *
 * 1. 共通 Mixin 定義（mixins.scss）
 *    - 1-1. apps/extension-huboffice/src/styles/mixins.scss が存在し、主要共通 Mixin（surface-card / surface-row-card / tool-section-heading / tool-hint-box / tool-container）が定義されていること
 *    - 1-2. settings-view.scss / qr-generator-tool.scss / wareki-converter-tool.scss が共通 mixins.scss を @use して @include していること
 *
 * 2. SCSS 品質予防規約の遵守
 *    - 2-1. HubOffice 配下の全 SCSS ファイルにおいて !important、@extend、およびカラー直値（Hex / RGB / RGBA）が 0 件であること
 */

const SRC_DIR = path.resolve(__dirname, "..");

function collectScssFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectScssFiles(full, out);
    } else if (entry.name.endsWith(".scss")) {
      out.push(full);
    }
  }
  return out;
}

describe("HubOffice SCSS Common Mixins", () => {
  it("1-1. mixins.scss が存在し、主要共通 Mixin が定義されていること", () => {
    const mixinsPath = path.join(__dirname, "mixins.scss");
    expect(fs.existsSync(mixinsPath)).toBe(true);
    const content = fs.readFileSync(mixinsPath, "utf-8");

    expect(content).toContain("@mixin surface-card");
    expect(content).toContain("@mixin surface-row-card");
    expect(content).toContain("@mixin tool-section-heading");
    expect(content).toContain("@mixin tool-hint-box");
    expect(content).toContain("@mixin tool-container");
  });

  it("1-2. 各コンポーネント・ツール SCSS が共通 mixins.scss を @use して @include していること", () => {
    const targets = [
      path.join(SRC_DIR, "components", "settings-view.scss"),
      path.join(SRC_DIR, "tools", "qr-generator", "qr-generator-tool.scss"),
      path.join(
        SRC_DIR,
        "tools",
        "wareki-converter",
        "wareki-converter-tool.scss",
      ),
    ];

    for (const filePath of targets) {
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content, `${path.basename(filePath)} should @use mixins`).toMatch(
        /@use\s+["'][^"']*styles\/mixins\.scss["']/,
      );
      expect(
        content,
        `${path.basename(filePath)} should @include common mixin`,
      ).toContain("@include ");
    }
  });

  it("2-1. HubOffice 配下の全 SCSS ファイルにおいて !important、@extend、カラー直値が 0 件であること", () => {
    const scssFiles = collectScssFiles(SRC_DIR);
    expect(scssFiles.length).toBeGreaterThan(0);

    for (const filePath of scssFiles) {
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content, `${filePath} has !important`).not.toMatch(/!important/);
      expect(content, `${filePath} has @extend`).not.toMatch(/@extend\b/);
      expect(content, `${filePath} has raw color`).not.toMatch(
        /(#[0-9a-fA-F]{3,8}\b|rgba?\s*\()/,
      );
    }
  });
});
