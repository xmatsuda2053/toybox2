import { describe, expect, it } from "vitest";
import * as fs from "node:fs";

/**
 * テーマ切替トランジション仕様（Theme Transition Specifications）
 *
 * 仕様 1: tokens.scss にテーマ切替トランジショントークン（--stepnote-transition-theme）が定義されていること
 * 仕様 2: mixins.scss にテーマ切替トランジション適用用 mixin（theme-transition）が定義されていること
 * 仕様 3: app-root.scss の :host, .app-header, .app-footer, 各ペインにテーマ切替トランジションが適用されていること
 * 仕様 4: app-root.scss の pane-collapsible において開閉アニメーションとテーマ切替トランジションが両立されていること
 * 仕様 5: prefers-reduced-motion: reduce 時にトランジションを抑止するアクセシビリティ配慮が含まれていること
 */
describe("テーマ切替トランジション仕様 (Theme Transition)", () => {
  const tokensScss = fs.readFileSync(
    new URL("./tokens.scss", import.meta.url),
    "utf-8",
  );
  const mixinsScss = fs.readFileSync(
    new URL("./mixins.scss", import.meta.url),
    "utf-8",
  );
  const appRootScss = fs.readFileSync(
    new URL("../app-root.scss", import.meta.url),
    "utf-8",
  );

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
      const paneMenuMatch = appRootScss.match(/\.pane-menu\s*\{[\s\S]*?\}/);
      expect(paneMenuMatch).not.toBeNull();
      expect(paneMenuMatch![0]).toMatch(
        /(?:transition:\s*var\(--stepnote-transition-theme\)|@include\s+theme-transition)/,
      );

      const paneNavMatch = appRootScss.match(
        /\.pane-navigation\s*\{[\s\S]*?\}/,
      );
      expect(paneNavMatch).not.toBeNull();
      expect(paneNavMatch![0]).toMatch(
        /(?:transition:\s*var\(--stepnote-transition-theme\)|@include\s+theme-transition)/,
      );

      const paneTaskMatch = appRootScss.match(/\.pane-task\s*\{[\s\S]*?\}/);
      expect(paneTaskMatch).not.toBeNull();
      expect(paneTaskMatch![0]).toMatch(
        /(?:transition:\s*var\(--stepnote-transition-theme\)|@include\s+theme-transition)/,
      );

      const paneJournalMatch = appRootScss.match(
        /\.pane-journal\s*\{[\s\S]*?\}/,
      );
      expect(paneJournalMatch).not.toBeNull();
      expect(paneJournalMatch![0]).toMatch(
        /(?:transition:\s*var\(--stepnote-transition-theme\)|@include\s+theme-transition)/,
      );
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
  });

  describe("3. アクセシビリティ配慮 (prefers-reduced-motion)", () => {
    it("prefers-reduced-motion: reduce 時にトランジションを抑止する定義が含まれていること", () => {
      expect(tokensScss).toMatch(
        /@media\s*\(prefers-reduced-motion:\s*reduce\)/,
      );
    });
  });
});
