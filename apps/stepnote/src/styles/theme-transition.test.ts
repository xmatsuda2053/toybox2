import { beforeAll, describe, expect, it } from "vitest";

/**
 * テーマ切替トランジション仕様（Theme Transition Specifications）
 *
 * 仕様 1: tokens.scss にテーマ切替トランジショントークン（--stepnote-transition-theme）が定義されていること
 * 仕様 2: mixins.scss にテーマ切替トランジション適用用 mixin（theme-transition）が定義されていること
 * 仕様 3: app-root.scss の :host, .app-header, .app-footer, 各ペインにテーマ切替トランジションが適用されていること
 * 仕様 4: app-root.scss の pane-collapsible において開閉アニメーションとテーマ切替トランジションが両立されていること
 * 仕様 5: app-root.scss において .pane-collapsible が個別ペイン（.pane-navigation, .pane-task-list）より後に定義され、開閉トランジションが上書きされないこと
 * 仕様 6: prefers-reduced-motion: reduce 時にトランジションを抑止するアクセシビリティ配慮が含まれていること
 * 仕様 7: tokens.scss の prefers-reduced-motion: reduce において !important を使用せず安全にトランジショントークンが無効化されていること
 */
describe("テーマ切替トランジション仕様 (Theme Transition)", () => {
  let tokensScss = "";
  let mixinsScss = "";
  let appRootScss = "";

  beforeAll(async () => {
    const fsModule = "node:" + "fs";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fs: any = await import(/* @vite-ignore */ fsModule);
    tokensScss = fs.readFileSync(
      new URL("./tokens.scss", import.meta.url),
      "utf-8",
    );
    mixinsScss = fs.readFileSync(
      new URL("./mixins.scss", import.meta.url),
      "utf-8",
    );
    appRootScss = fs.readFileSync(
      new URL("../app-root.scss", import.meta.url),
      "utf-8",
    );
  });

  describe("1. デザイントークン & mixin 定義", () => {
    it("tokens.scss にテーマ切替トランジショントークン（--stepnote-transition-theme）が定義されていること", () => {
      expect(tokensScss).toMatch(
        /--stepnote-transition-theme:\s*background-color\s+0\.2s\s+ease,\s*color\s+0\.2s\s+ease,\s*border-color\s+0\.2s\s+ease;/,
      );
    });

    it("mixins.scss にテーマ切替トランジション用 mixin（theme-transition）が定義されていること", () => {
      expect(mixinsScss).toMatch(/@mixin\s+theme-transition\s*\{/);
      expect(mixinsScss).toMatch(
        /transition:\s*var\(--stepnote-transition-theme\);/,
      );
    });
  });

  describe("2. アプリケーションスタイルへの適用", () => {
    it("app-root.scss の :host にテーマ切替トランジションが適用されていること", () => {
      const hostMatch = appRootScss.match(/:host\s*\{[\s\S]*?\}/);
      expect(hostMatch).not.toBeNull();
      expect(hostMatch![0]).toMatch(
        /(?:transition:\s*var\(--stepnote-transition-theme\)|@include\s+theme-transition)/,
      );
    });

    it("app-root.scss の .app-header および .app-footer にテーマ切替トランジションが適用されていること", () => {
      const headerMatch = appRootScss.match(/\.app-header\s*\{[\s\S]*?\}/);
      expect(headerMatch).not.toBeNull();
      expect(headerMatch![0]).toMatch(
        /(?:transition:\s*var\(--stepnote-transition-theme\)|@include\s+theme-transition)/,
      );

      const footerMatch = appRootScss.match(/\.app-footer\s*\{[\s\S]*?\}/);
      expect(footerMatch).not.toBeNull();
      expect(footerMatch![0]).toMatch(
        /(?:transition:\s*var\(--stepnote-transition-theme\)|@include\s+theme-transition)/,
      );
    });

    it("app-root.scss の各ペインにテーマ切替トランジションが適用されていること", () => {
      const paneTransitionPattern =
        /(?:transition:\s*var\(--stepnote-transition-theme\)|@include\s+theme-transition|@include\s+pane-border-right)/;

      const paneMenuMatch = appRootScss.match(/\.pane-menu\s*\{[\s\S]*?\}/);
      expect(paneMenuMatch).not.toBeNull();
      expect(paneMenuMatch![0]).toMatch(paneTransitionPattern);

      const paneNavMatch = appRootScss.match(
        /\.pane-navigation\s*\{[\s\S]*?\}/,
      );
      expect(paneNavMatch).not.toBeNull();
      expect(paneNavMatch![0]).toMatch(paneTransitionPattern);

      const paneTaskMatch = appRootScss.match(/\.pane-task\s*\{[\s\S]*?\}/);
      expect(paneTaskMatch).not.toBeNull();
      expect(paneTaskMatch![0]).toMatch(paneTransitionPattern);

      const paneJournalMatch = appRootScss.match(
        /\.pane-journal\s*\{[\s\S]*?\}/,
      );
      expect(paneJournalMatch).not.toBeNull();
      expect(paneJournalMatch![0]).toMatch(paneTransitionPattern);
    });

    it("app-root.scss の pane-collapsible において開閉アニメーションとテーマ切替トランジション（background-color, color, border-color）が両立されていること", () => {
      const collapsibleMatch = appRootScss.match(
        /\.pane-collapsible\s*\{[\s\S]*?\}/,
      );
      expect(collapsibleMatch).not.toBeNull();
      expect(collapsibleMatch![0]).toMatch(/background-color/);
      expect(collapsibleMatch![0]).toMatch(/color/);
      expect(collapsibleMatch![0]).toMatch(/width/);
    });

    it("app-root.scss において .pane-collapsible が個別ペイン（.pane-navigation, .pane-task-list）より後に定義され、開閉トランジションが上書きされないこと", () => {
      const collapsibleIndex = appRootScss.indexOf(".pane-collapsible {");
      const navigationIndex = appRootScss.indexOf(".pane-navigation {");
      const taskListIndex = appRootScss.indexOf(".pane-task-list {");

      expect(collapsibleIndex).toBeGreaterThan(-1);
      expect(navigationIndex).toBeGreaterThan(-1);
      expect(taskListIndex).toBeGreaterThan(-1);

      // 同一詳細度 (0, 1, 0) において、修飾クラス .pane-collapsible のトランジションが
      // 個別ペインの @include theme-transition に上書きされないよう、後に配置されていること
      expect(collapsibleIndex).toBeGreaterThan(navigationIndex);
      expect(collapsibleIndex).toBeGreaterThan(taskListIndex);
    });
  });

  describe("3. アクセシビリティ配慮 (prefers-reduced-motion)", () => {
    it("prefers-reduced-motion: reduce 時にトランジションを抑止する定義が含まれていること", () => {
      expect(tokensScss).toMatch(
        /@media\s*\(prefers-reduced-motion:\s*reduce\)/,
      );
    });

    it("prefers-reduced-motion: reduce 内において !important を使用せず安全にトランジションが無効化されていること", () => {
      const mediaBlock = tokensScss.match(
        /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\}/,
      );
      expect(mediaBlock).not.toBeNull();
      expect(mediaBlock![0]).not.toContain("!important");
      expect(mediaBlock![0]).toMatch(/--stepnote-transition-theme:\s*none/);
    });
  });
});
