import { describe, expect, it } from "vitest";
import * as fs from "node:fs";

/**
 * StepNote SCSS Mixins 仕様テスト（mixins.test.ts）
 *
 * 仕様 1: mixins.scss に @mixin custom-scrollbar が定義されていること
 * 仕様 2: @mixin custom-scrollbar にモダン標準プロパティ（scrollbar-width, scrollbar-color）が定義されていること
 * 仕様 3: @mixin custom-scrollbar に WebKit 系スタイリング（幅 6px、トラック、角丸 2px のサム、ホバー色）が定義されていること
 * 仕様 4: 既存レイアウト Mixin（flex-center, flex-between, text-ellipsis, theme-transition）が維持されていること
 * 仕様 5: @mixin box-sizing-reset が定義され、*, *::before, *::after の box-sizing: border-box が設定されていること
 * 仕様 6: @mixin stepnote-tag-styles が定義され、border 非表示および全10色のタグ専用トークン参照が含まれていること
 * 仕様 7: @mixin tag-variant-select-styles が全10色に対応し、--stepnote-tag-*-color を参照していること
 * 仕様 8: SCSS-018: @mixin tag-variant-select-styles の ::part(display-input) が3階層ネストされずフラット展開されていること
 */
describe("mixins.scss 汎用レイアウト Mixin 仕様", () => {
  const mixinsScss = fs.readFileSync(
    new URL("./mixins.scss", import.meta.url),
    "utf-8",
  );

  describe("1. カスタムスクロールバー Mixin (@mixin custom-scrollbar)", () => {
    it("仕様 1: mixins.scss に @mixin custom-scrollbar が定義されていること", () => {
      expect(mixinsScss).toMatch(/@mixin\s+custom-scrollbar\s*\{/);
    });

    it("仕様 2: @mixin custom-scrollbar にモダン標準プロパティ（scrollbar-width, scrollbar-color）が定義されていること", () => {
      const scrollbarBlock = mixinsScss.match(
        /@mixin\s+custom-scrollbar\s*\{[\s\S]*?\n\}/,
      );
      expect(scrollbarBlock).not.toBeNull();
      expect(scrollbarBlock![0]).toMatch(/scrollbar-width:\s*thin;/);
      expect(scrollbarBlock![0]).toMatch(
        /scrollbar-color:\s*var\(--scrollbar-thumb-color\)\s+var\(--scrollbar-track-color\);/,
      );
    });

    it("仕様 3: @mixin custom-scrollbar に WebKit 系スタイリング（幅 6px、角丸 2px サム、ホバー色）が定義されていること", () => {
      const scrollbarBlock = mixinsScss.match(
        /@mixin\s+custom-scrollbar\s*\{[\s\S]*?\n\}/,
      );
      expect(scrollbarBlock).not.toBeNull();
      expect(scrollbarBlock![0]).toMatch(/&::-webkit-scrollbar\s*\{[\s\S]*?width:\s*6px;/);
      expect(scrollbarBlock![0]).toMatch(
        /&::-webkit-scrollbar-thumb\s*\{[\s\S]*?border-radius:\s*2px;/,
      );
      expect(scrollbarBlock![0]).toMatch(
        /var\(--scrollbar-thumb-hover-color\)/,
      );
    });
  });

  describe("2. 既存レイアウト Mixin の維持", () => {
    it("仕様 4: flex-center, flex-between, text-ellipsis, theme-transition が定義されていること", () => {
      expect(mixinsScss).toMatch(/@mixin\s+flex-center\s*\{/);
      expect(mixinsScss).toMatch(/@mixin\s+flex-between\s*\{/);
      expect(mixinsScss).toMatch(/@mixin\s+text-ellipsis\s*\{/);
      expect(mixinsScss).toMatch(/@mixin\s+theme-transition\s*\{/);
    });
  });

  describe("3. SCSS-016: Box-sizing リセット Mixin (@mixin box-sizing-reset)", () => {
    it("仕様 5: mixins.scss に @mixin box-sizing-reset が定義され、*, *::before, *::after の box-sizing: border-box が設定されていること", () => {
      expect(mixinsScss).toMatch(/@mixin\s+box-sizing-reset\s*\{/);

      const block = mixinsScss.match(/@mixin\s+box-sizing-reset\s*\{[\s\S]*?\n\}/);
      expect(block).not.toBeNull();
      expect(block![0]).toContain("box-sizing: border-box;");
      expect(block![0]).toContain("*::before");
      expect(block![0]).toContain("*::after");
    });
  });

  describe("4. タグ共通スタイル・カラー選択 Mixin", () => {
    const allVariants = [
      "neutral",
      "brand",
      "success",
      "warning",
      "danger",
      "purple",
      "pink",
      "cyan",
      "orange",
      "indigo",
    ] as const;

    it("仕様 6: @mixin stepnote-tag-styles が定義され、border 非表示および全10色マッピングが含まれていること", () => {
      expect(mixinsScss).toMatch(/@mixin\s+stepnote-tag-styles\s*\{/);
      expect(mixinsScss).toContain(".stepnote-tag");
      expect(mixinsScss).toContain("border-width: 0;");
      expect(mixinsScss).toContain("--stepnote-tag-#{$variant}-bg");
      expect(mixinsScss).toContain("--stepnote-tag-#{$variant}-color");
      for (const variant of allVariants) {
        expect(mixinsScss).toContain(`"${variant}"`);
      }
    });

    it("仕様 7: @mixin tag-variant-select-styles が全10色に対応し、--stepnote-tag-*-color を参照していること", () => {
      for (const variant of allVariants) {
        expect(mixinsScss).toMatch(
          new RegExp(`"${variant}":\\s*var\\(--stepnote-tag-${variant}-color\\)`),
        );
      }
    });

    it("仕様 8: SCSS-018: @mixin tag-variant-select-styles の ::part(display-input) が3階層ネストされずフラット展開されていること", () => {
      expect(mixinsScss).toMatch(
        /\.#\{\$block\}__variant-select--#\{\$variant\}::part\(display-input\)/,
      );
      expect(mixinsScss).not.toMatch(/&::part\(display-input\)/);
    });
  });
});

