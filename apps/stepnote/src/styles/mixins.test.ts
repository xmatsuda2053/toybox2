import { describe, expect, it } from "vitest";
import * as fs from "node:fs";

/**
 * StepNote SCSS Mixins 仕様テスト（mixins.test.ts）
 *
 * 仕様 1: mixins.scss に @mixin custom-scrollbar が定義されていること
 * 仕様 2: @mixin custom-scrollbar にモダン標準プロパティ（scrollbar-width, scrollbar-color）が定義されていること
 * 仕様 3: @mixin custom-scrollbar に WebKit 系スタイリング（幅 6px、トラック、角丸 2px のサム、ホバー色）が定義されていること
 * 仕様 4: 既存レイアウト Mixin（flex-center, flex-between, text-ellipsis, theme-transition）が維持されていること
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
});
