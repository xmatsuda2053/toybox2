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
 * 仕様 9: SCSS-021〜023: タブビュー・タスク詳細共通 Mixin 群が定義され、task-tag-bar.scss に checkbox-center-alignment が適用され、issues-view / logs-view / task-history-menu の深いネストが解消されていること
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

  describe("5. SCSS-021〜023: タブビュー・タスク詳細共通 Mixin 群およびネスト平坦化", () => {
    const issuesViewScss = fs.readFileSync(
      new URL("../components/issues/issues-view.scss", import.meta.url),
      "utf-8",
    );
    const logsViewScss = fs.readFileSync(
      new URL("../components/logs/logs-view.scss", import.meta.url),
      "utf-8",
    );
    const taskHistoryMenuScss = fs.readFileSync(
      new URL("../components/navigation/task-history-menu.scss", import.meta.url),
      "utf-8",
    );
    const taskTagBarScss = fs.readFileSync(
      new URL("../components/task/task-tag-bar.scss", import.meta.url),
      "utf-8",
    );

    it("仕様 9-1: mixins.scss にタスク詳細・タブビュー共通 Mixin 群が定義されていること", () => {
      expect(mixinsScss).toMatch(/@mixin\s+task-detail-host\b/);
      expect(mixinsScss).toMatch(/@mixin\s+task-detail-empty\b/);
      expect(mixinsScss).toMatch(/@mixin\s+task-detail-label\b/);
      expect(mixinsScss).toMatch(/@mixin\s+task-status-icon-colors\b/);
      expect(mixinsScss).toMatch(/@mixin\s+task-due-icon-colors\b/);
      expect(mixinsScss).toMatch(/@mixin\s+pane-header-icon-btn\b/);
      expect(mixinsScss).toMatch(/@mixin\s+tab-view-header\b/);
      expect(mixinsScss).toMatch(/@mixin\s+tab-view-dialog-body\b/);
      expect(mixinsScss).toMatch(/@mixin\s+tab-view-dialog-footer\b/);
    });

    it("仕様 9-2: task-tag-bar.scss に @include checkbox-center-alignment が適用されていること", () => {
      expect(taskTagBarScss).toContain("@include checkbox-center-alignment;");
    });

    it("仕様 9-3: issues-view.scss / logs-view.scss / task-history-menu.scss がフラット展開され 3階層ネストを含まないこと", () => {
      expect(issuesViewScss).not.toMatch(/&__header\s*\{/);
      expect(issuesViewScss).not.toMatch(/&__item\s*\{/);
      expect(logsViewScss).toMatch(
        /\.logs-view__row:hover\s+\.logs-view__graph-node\s*\{/,
      );
      expect(logsViewScss).not.toMatch(
        /&:hover\s*\{[^}]*\.logs-view__graph-node/,
      );
      expect(taskHistoryMenuScss).toMatch(/\.task-history-menu__trigger\s*\{/);
      expect(taskHistoryMenuScss).not.toMatch(/&__trigger\s*\{/);
    });
  });
});

