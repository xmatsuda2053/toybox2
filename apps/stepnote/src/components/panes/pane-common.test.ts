import { describe, expect, it } from "vitest";
import * as fs from "node:fs";

/**
 * StepNote Panes 共通セクションスタイル仕様テスト（pane-common.test.ts）
 *
 * 【仕様 1: pane-common.scss の Mixin 定義】
 * - 1-1: @mixin pane-section-header が定義され、ヘッダー高さ・枠線・余白が指定されていること
 * - 1-2: @mixin pane-section-title が定義され、フォントサイズ・太字・レタースペーシング・text-ellipsis が指定されていること
 * - 1-3: 既存の .section-header および .section-title クラスが対応する Mixin を @include していること
 *
 * 【仕様 2: pane-task-list.scss における共通ヘッダー Mixin の適用】
 * - 2-1: pane-task-list.scss で pane-common.scss がインポートされていること
 * - 2-2: &__header に @include pane-section-header が適用されていること
 * - 2-3: &__title に @include pane-section-title が適用されていること
 *
 * 【仕様 3: task-list-item.scss における共通 Mixin・トークン標準化】
 * - 3-1: task-list-item.scss で mixins.scss がインポートされていること
 * - 3-2: .task-list-item__title に @include text-ellipsis が適用され、直書き省略スタイルが排除されていること
 * - 3-3: .task-list-item__label に @include text-ellipsis が適用され、直書き省略スタイルが排除されていること
 * - 3-4: .task-list-item の font-family にデザイントークン var(--wa-font-family-body) が適用されていること
 *
 * 【仕様 4: pane-common.scss のスクロール可能コンテンツ領域 Mixin】
 * - 4-1: @mixin pane-scrollable-content が定義され、スクロール基本レイアウト、パディング、カスタムスクロールバーが指定されていること
 *
 * 【仕様 5: 各ペインにおける共通スクロール Mixin の適用】
 * - 5-1: navigation-labels.scss の .labels__content に @include pane-scrollable-content が適用されていること
 * - 5-2: pane-task-list.scss の &__list に @include pane-scrollable-content が適用されていること
 */
describe("pane-common.scss および Task List スタイル標準化仕様", () => {
  const paneCommonScssPath = new URL("./pane-common.scss", import.meta.url);
  const paneTaskListScssPath = new URL(
    "./pane-task-list/pane-task-list.scss",
    import.meta.url,
  );
  const taskListItemScssPath = new URL(
    "./pane-task-list/task-list-item.scss",
    import.meta.url,
  );
  const navigationLabelsScssPath = new URL(
    "./pane-navigation/navigation-labels.scss",
    import.meta.url,
  );

  describe("1. pane-common.scss の Mixin 定義", () => {
    it("仕様 1-1: @mixin pane-section-header が定義され、ヘッダー高さ・枠線・余白が指定されていること", () => {
      const scss = fs.readFileSync(paneCommonScssPath, "utf-8");
      expect(scss).toMatch(/@mixin\s+pane-section-header\s*\{/);

      const match = scss.match(/@mixin\s+pane-section-header\s*\{[\s\S]*?\n\}/);
      expect(match).not.toBeNull();
      const content = match![0];
      expect(content).toContain("@include flex-between");
      expect(content).toMatch(/height:\s*48px;/);
      expect(content).toContain("var(--wa-color-surface-border)");
    });

    it("仕様 1-2: @mixin pane-section-title が定義され、フォントサイズ・太字・レタースペーシング・text-ellipsis が指定されていること", () => {
      const scss = fs.readFileSync(paneCommonScssPath, "utf-8");
      expect(scss).toMatch(/@mixin\s+pane-section-title\s*\{/);

      const match = scss.match(/@mixin\s+pane-section-title\s*\{[\s\S]*?\n\}/);
      expect(match).not.toBeNull();
      const content = match![0];
      expect(content).toContain("var(--wa-font-size-s)");
      expect(content).toMatch(/font-weight:\s*700;/);
      expect(content).toContain("@include text-ellipsis");
    });

    it("仕様 1-3: 既存の .section-header および .section-title クラスが対応する Mixin を @include していること", () => {
      const scss = fs.readFileSync(paneCommonScssPath, "utf-8");
      const headerBlock = scss.match(/\.section-header\s*\{[\s\S]*?\n\}/);
      expect(headerBlock).not.toBeNull();
      expect(headerBlock![0]).toContain("@include pane-section-header");

      const titleBlock = scss.match(/\.section-title\s*\{[\s\S]*?\n\}/);
      expect(titleBlock).not.toBeNull();
      expect(titleBlock![0]).toContain("@include pane-section-title");
    });
  });

  describe("2. pane-task-list.scss における共通ヘッダー Mixin の適用", () => {
    it("仕様 2-1: pane-task-list.scss で pane-common.scss がインポートされていること", () => {
      const scss = fs.readFileSync(paneTaskListScssPath, "utf-8");
      expect(scss).toMatch(/pane-common\.scss/);
    });

    it("仕様 2-2: &__header に @include pane-section-header が適用されていること", () => {
      const scss = fs.readFileSync(paneTaskListScssPath, "utf-8");
      expect(scss).toContain("@include pane-section-header");
    });

    it("仕様 2-3: &__title に @include pane-section-title が適用されていること", () => {
      const scss = fs.readFileSync(paneTaskListScssPath, "utf-8");
      expect(scss).toContain("@include pane-section-title");
    });
  });

  describe("3. task-list-item.scss における共通 Mixin・トークン標準化", () => {
    it("仕様 3-1: task-list-item.scss で mixins.scss がインポートされていること", () => {
      const scss = fs.readFileSync(taskListItemScssPath, "utf-8");
      expect(scss).toMatch(/mixins\.scss/);
    });

    it("仕様 3-2: .task-list-item__title に @include text-ellipsis が適用され、直書き省略スタイルが排除されていること", () => {
      const scss = fs.readFileSync(taskListItemScssPath, "utf-8");
      const titleBlock = scss.match(/\.task-list-item__title\s*\{[\s\S]*?\n\}/);
      expect(titleBlock).not.toBeNull();
      expect(titleBlock![0]).toContain("@include text-ellipsis");
      expect(titleBlock![0]).not.toContain("text-overflow: ellipsis");
    });

    it("仕様 3-3: .task-list-item__label に @include text-ellipsis が適用され、直書き省略スタイルが排除されていること", () => {
      const scss = fs.readFileSync(taskListItemScssPath, "utf-8");
      const labelBlock = scss.match(/\.task-list-item__label\s*\{[\s\S]*?\n\}/);
      expect(labelBlock).not.toBeNull();
      expect(labelBlock![0]).toContain("@include text-ellipsis");
      expect(labelBlock![0]).not.toContain("text-overflow: ellipsis");
    });

    it("仕様 3-4: .task-list-item の font-family にデザイントークン var(--wa-font-family-body) が適用されていること", () => {
      const scss = fs.readFileSync(taskListItemScssPath, "utf-8");
      const rootBlock = scss.match(/\.task-list-item\s*\{[\s\S]*?\n\}/);
      expect(rootBlock).not.toBeNull();
      expect(rootBlock![0]).toContain("var(--wa-font-family-body)");
    });
  });

  describe("4. pane-common.scss のスクロール可能コンテンツ領域 Mixin", () => {
    it("仕様 4-1: @mixin pane-scrollable-content が定義され、スクロール基本レイアウト、パディング、カスタムスクロールバーが指定されていること", () => {
      const scss = fs.readFileSync(paneCommonScssPath, "utf-8");
      expect(scss).toMatch(/@mixin\s+pane-scrollable-content\s*\{/);

      const match = scss.match(
        /@mixin\s+pane-scrollable-content\s*\{[\s\S]*?\n\}/,
      );
      expect(match).not.toBeNull();
      const content = match![0];
      expect(content).toMatch(/flex:\s*1;/);
      expect(content).toMatch(/min-height:\s*0;/);
      expect(content).toMatch(/overflow-y:\s*auto;/);
      expect(content).toMatch(/scrollbar-gutter:\s*stable;/);
      expect(content).toMatch(/padding-block:\s*6px;/);
      expect(content).toContain("var(--wa-space-s");
      expect(content).toContain("var(--wa-space-2xs");
      expect(content).toContain("@include custom-scrollbar");
    });
  });

  describe("5. 各ペインにおける共通スクロール Mixin の適用", () => {
    it("仕様 5-1: navigation-labels.scss の .labels__content に @include pane-scrollable-content が適用されていること", () => {
      const scss = fs.readFileSync(navigationLabelsScssPath, "utf-8");
      const contentBlock = scss.match(/\.labels__content\s*\{[\s\S]*?\n\}/);
      expect(contentBlock).not.toBeNull();
      expect(contentBlock![0]).toContain("@include pane-scrollable-content");
    });

    it("仕様 5-2: pane-task-list.scss の &__list に @include pane-scrollable-content が適用されていること", () => {
      const scss = fs.readFileSync(paneTaskListScssPath, "utf-8");
      const listBlock = scss.match(/&__list\s*\{[\s\S]*?\n\}/);
      expect(listBlock).not.toBeNull();
      expect(listBlock![0]).toContain("@include pane-scrollable-content");
    });
  });
});
