import { describe, expect, it } from "vitest";
import * as fs from "node:fs";

/**
 * StepNote デザイントークン検証テスト仕様
 *
 * 仕様 1: Light モード（:root / .wa-light / [data-theme="light"]）の背景色（--wa-color-surface-default）に #f1f2f3 が定義されていること
 * 仕様 2: Light モードのボーダー色（#d0d7de）および通常テキスト色（#1f2328）が定義されていること
 * 仕様 3: Dark モード（.wa-dark / [data-theme="dark"]）の背景色（--wa-color-surface-default）に #2f323f が定義されていること
 * 仕様 4: Dark モードのボーダー色（--wa-color-surface-border）に背景と同化しない #434857 が定義されていること
 * 仕様 5: Dark モードの控えめテキスト色（--wa-color-text-quiet）にコントラストを確保した #9da7b3 が定義されていること
 * 仕様 6: Dark モードのスクロールバーサム色（--scrollbar-thumb-color）に #434857 が定義されていること
 * 仕様 7: Dark モードのアクティブボタン背景色（--wa-color-neutral-fill-normal）に背景と同化しない #484d5e が定義されていること
 * 仕様 8: Dark モードの通常ボタンホバー背景色（--wa-color-neutral-fill-quiet）に基調色より暗い #252833 が定義されていること
 * 仕様 9: Light モードのアクティブボタン文字色（--wa-color-neutral-on-normal）に引き締まった漆黒 #0d1117 が定義されていること
 * 仕様 10: Dark モードのアクティブボタン文字色（--wa-color-neutral-on-normal）に純白トークン（var(--stepnote-color-white)）が定義されていること
 * 仕様 11: OS 連動ダークモード（@media (prefers-color-scheme: dark)）にも調整後の各トークン値が定義されていること
 * 仕様 12: Light モードの通常ボタンホバー背景色（--wa-color-neutral-fill-quiet）に基調色より暗い #e2e5e8 が定義されていること
 * 仕様 13: Light モードのアクティブボタン背景色（--wa-color-neutral-fill-normal）に通常ホバー色（#e2e5e8）より濃い #d8dce0 が定義されていること
 * 仕様 14: Light モードのアクティブボタンホバー混色（--wa-color-mix-hover）に白浮きせず暗く沈み込ませる #000000 12% が定義されていること
 * 仕様 15: Dark モードのアクティブボタンホバー混色（--wa-color-mix-hover）に暗く沈み込ませる #000000 20% が定義されていること
 * 仕様 16: Light モードのアクティブボタンホバー背景色（--wa-color-neutral-fill-normal-hover）に基調色より暗い #c2c7cd が定義されていること
 * 仕様 17: Dark モードのアクティブボタンホバー背景色（--wa-color-neutral-fill-normal-hover）に基調色より暗い #1f212b が定義されていること
 * 仕様 18: OS 連動ダークモードにも同様に #1f212b が定義されていること
 * 仕様 19: Light モードにダイアログ・フォーム・ドロップダウン用トークンが定義されていること（基本色はセマンティックトークン参照）
 * 仕様 20: Dark モードにダイアログ・フォーム・ドロップダウン用トークンが定義されていること（基本色はセマンティックトークン参照）
 * 仕様 21: OS 連動ダークモードにも同様にダイアログ・フォーム・ドロップダウン用トークンが定義されていること
 * 仕様 22: @mixin dark-theme-tokens が定義され、ダークテーマ用全トークンが集約されていること（SCSS-013）
 * 仕様 23: 手動 Dark テーマセレクタに @include dark-theme-tokens が適用されていること（SCSS-013）
 * 仕様 24: OS 連動ダークモードセレクタに @include dark-theme-tokens が適用されていること（SCSS-013）
 * 仕様 25: メニュートリガーおよびスクロールバーサム色が基底セマンティックトークンを参照していること
 * 仕様 26: 共通トークンとして純白テキスト・アイコン用トークン（--stepnote-color-white）が定義されていること
 * 仕様 27: Quick Access アクティブ時アイコンカラーが通常時アイコン変数を参照していること（直値重複の排除）
 * 仕様 28: Labels アクティブ時アイコンカラーが通常時変数を参照していること
 * 仕様 29: 未分類・開始待ちアイコン色がセマンティックトークン（--wa-color-text-normal / --stepnote-color-white）を参照していること
 * 仕様 30: Dark モードの Quick Access アクティブ時アイコンカラーが通常時アイコン変数を参照していること
 * 仕様 31: Dark モードの未分類・開始待ちアイコン色が純白セマンティックトークンを参照していること
 * 仕様 32: Light モードのダイアログ・ドロップダウン背景が純白トークン（var(--stepnote-color-white)）を参照していること
 * 仕様 33: Dark モード（@mixin dark-theme-tokens）の neutral-on-normal が純白トークン（var(--stepnote-color-white)）を参照していること
 * 仕様 34: Light モードにエレベーションシャドウトークン（--stepnote-shadow-dialog / --stepnote-shadow-dropdown）が定義され、参照されていること
 * 仕様 35: Dark モードにエレベーションシャドウトークン（--stepnote-shadow-dialog / --stepnote-shadow-dropdown）が定義され、参照されていること
 * 仕様 36: ドロップダウンの Danger カラーおよびホバー背景がセマンティックトークンを参照していること
 */
describe("tokens.scss デザイントークン & テーマ基調色", () => {
  const tokensScss = fs.readFileSync(
    new URL("./tokens.scss", import.meta.url),
    "utf-8",
  );

  // SCSS から指定セレクタ配下のブロックを抽出するヘルパー
  const extractBlock = (css: string, selectorRegex: RegExp): string => {
    const match = css.match(selectorRegex);
    if (!match || match.index === undefined) return "";
    const startIndex = css.indexOf("{", match.index);
    if (startIndex === -1) return "";
    let depth = 1;
    let endIndex = startIndex + 1;
    while (depth > 0 && endIndex < css.length) {
      if (css[endIndex] === "{") depth++;
      else if (css[endIndex] === "}") depth--;
      endIndex++;
    }
    return css.slice(startIndex + 1, endIndex - 1);
  };

  describe("Light モードの基調色定義", () => {
    it("Light モードの背景色（--wa-color-surface-default）に眩しさを抑えた #f1f2f3 が定義されていること", () => {
      const lightBlock = extractBlock(
        tokensScss,
        /:root[\s\S]*?\[data-theme="light"\]/,
      );
      expect(lightBlock).toMatch(/--wa-color-surface-default:\s*#f1f2f3;/);
    });

    it("Light モードのボーダー色（#d0d7de）およびテキスト色（#1f2328）が維持・定義されていること", () => {
      const lightBlock = extractBlock(
        tokensScss,
        /:root[\s\S]*?\[data-theme="light"\]/,
      );
      expect(lightBlock).toMatch(/--wa-color-surface-border:\s*#d0d7de;/);
      expect(lightBlock).toMatch(/--wa-color-text-normal:\s*#1f2328;/);
      expect(lightBlock).toMatch(/--wa-color-text-quiet:\s*#57606a;/);
    });

    it("Light モードのアクティブボタン文字色（--wa-color-neutral-on-normal）に引き締まった漆黒 #0d1117 が定義されていること", () => {
      const lightBlock = extractBlock(
        tokensScss,
        /:root[\s\S]*?\[data-theme="light"\]/,
      );
      expect(lightBlock).toMatch(/--wa-color-neutral-on-normal:\s*#0d1117;/);
    });

    it("Light モードの通常ボタンホバー背景色（--wa-color-neutral-fill-quiet）に基調色より暗い #e2e5e8 が定義されていること", () => {
      const lightBlock = extractBlock(
        tokensScss,
        /:root[\s\S]*?\[data-theme="light"\]/,
      );
      expect(lightBlock).toMatch(/--wa-color-neutral-fill-quiet:\s*#e2e5e8;/);
    });

    it("Light モードのアクティブボタン背景色（--wa-color-neutral-fill-normal）に通常ホバー色より濃い #d8dce0 が定義されていること", () => {
      const lightBlock = extractBlock(
        tokensScss,
        /:root[\s\S]*?\[data-theme="light"\]/,
      );
      expect(lightBlock).toMatch(/--wa-color-neutral-fill-normal:\s*#d8dce0;/);
    });

    it("Light モードのアクティブボタンホバー混色（--wa-color-mix-hover）に白浮きせず暗く沈み込ませる #000000 12% が定義されていること", () => {
      const lightBlock = extractBlock(
        tokensScss,
        /:root[\s\S]*?\[data-theme="light"\]/,
      );
      expect(lightBlock).toMatch(/--wa-color-mix-hover:\s*#000000 12%;/);
    });

    it("Light モードのアクティブボタンホバー背景色（--wa-color-neutral-fill-normal-hover）に基調色より暗い #c2c7cd が定義されていること", () => {
      const lightBlock = extractBlock(
        tokensScss,
        /:root[\s\S]*?\[data-theme="light"\]/,
      );
      expect(lightBlock).toMatch(
        /--wa-color-neutral-fill-normal-hover:\s*#c2c7cd;/,
      );
    });

    it("Light モードのセレクタに Dark モードと同様の .wa-light および [data-theme=\"light\"] が定義されていること", () => {
      expect(tokensScss).toMatch(
        /:root[\s\S]*?\.wa-light[\s\S]*?\[data-theme="light"\]\s*\{/,
      );
      // .wa-light 単独または [data-theme="light"] 単独がセレクタに含まれることを確認
      const selectorMatch = tokensScss.match(
        /([\s\S]*?)\{\s*\/\*\s*Web Awesome 標準デザイントークン/,
      );
      expect(selectorMatch?.[1]).toContain(".wa-light");
      expect(selectorMatch?.[1]).toContain('[data-theme="light"]');
      // :root プレフィックスなしの .wa-light / [data-theme="light"] がセレクタに含まれること
      expect(selectorMatch?.[1]).toMatch(/(?:^|,)\s*\.wa-light\s*(?:,|$)/m);
      expect(selectorMatch?.[1]).toMatch(/(?:^|,)\s*\[data-theme="light"\]\s*(?:,|$)/m);
    });

    it("Light モードにダイアログ・フォーム・ドロップダウン用セマンティックトークンが定義されていること", () => {
      const lightBlock = extractBlock(
        tokensScss,
        /:root[\s\S]*?\[data-theme="light"\]/,
      );
      expect(lightBlock).toMatch(/--stepnote-dialog-bg:\s*var\(--stepnote-color-white\);/);
      expect(lightBlock).toMatch(/--stepnote-dialog-border:\s*var\(--wa-color-surface-border\);/);
      expect(lightBlock).toMatch(/--stepnote-dialog-title-color:\s*var\(--wa-color-text-normal\);/);
      expect(lightBlock).toMatch(/--stepnote-dialog-body-color:\s*var\(--wa-color-text-normal\);/);
      expect(lightBlock).toMatch(/--stepnote-form-bg:\s*#f6f8fa;/);
      expect(lightBlock).toMatch(/--stepnote-form-border:\s*var\(--wa-color-surface-border\);/);
      expect(lightBlock).toMatch(/--stepnote-form-label-color:\s*var\(--wa-color-text-normal\);/);
      expect(lightBlock).toMatch(/--stepnote-form-value-color:\s*var\(--wa-color-text-normal\);/);
      expect(lightBlock).toMatch(/--stepnote-form-placeholder-color:\s*#8c959f;/);
      expect(lightBlock).toMatch(/--stepnote-dropdown-bg:\s*var\(--stepnote-color-white\);/);
      expect(lightBlock).toMatch(/--stepnote-dropdown-border:\s*var\(--wa-color-surface-border\);/);
      expect(lightBlock).toMatch(/--stepnote-dropdown-color:\s*var\(--wa-color-text-normal\);/);
      expect(lightBlock).toMatch(/--stepnote-dropdown-item-hover-bg:\s*var\(--stepnote-form-bg\);/);
      expect(lightBlock).toMatch(/--stepnote-dropdown-item-icon-color:\s*var\(--wa-color-text-quiet\);/);
      expect(lightBlock).toMatch(/--stepnote-dropdown-danger-color:\s*var\(--quick-access-icon-overdue\);/);
    });

    it("Light モードのメニュートリガーおよびスクロールバーサム色が基底セマンティックトークンを参照していること", () => {
      const lightBlock = extractBlock(
        tokensScss,
        /:root[\s\S]*?\[data-theme="light"\]/,
      );
      expect(lightBlock).toMatch(/--label-menu-trigger-color:\s*var\(--wa-color-text-quiet\);/);
      expect(lightBlock).toMatch(/--label-menu-trigger-hover-color:\s*var\(--wa-color-text-normal\);/);
      expect(lightBlock).toMatch(/--label-menu-trigger-active-color:\s*var\(--wa-color-text-normal\);/);
      expect(lightBlock).toMatch(/--scrollbar-thumb-color:\s*var\(--wa-color-surface-border\);/);
    });

    it("共通トークンとして純白テキスト・アイコン用トークン（--stepnote-color-white）が定義されていること", () => {
      const lightBlock = extractBlock(
        tokensScss,
        /:root[\s\S]*?\[data-theme="light"\]/,
      );
      expect(lightBlock).toMatch(/--stepnote-color-white:\s*#ffffff;/);
    });
  });

  describe("Dark モードの基調色定義", () => {
    const darkBlock = extractBlock(
      tokensScss,
      /:root\.wa-dark\s*,\s*:root\[data-theme="dark"\]/,
    );
    const mixinBlock = extractBlock(
      tokensScss,
      /@mixin\s+dark-theme-tokens/,
    );
    const resolvedDarkBlock = darkBlock.includes("@include dark-theme-tokens")
      ? mixinBlock
      : darkBlock;

    it("Dark モードの背景色（--wa-color-surface-default）に過度なコントラストを緩和する #2f323f が定義されていること", () => {
      expect(resolvedDarkBlock).toMatch(/--wa-color-surface-default:\s*#2f323f;/);
    });

    it("Dark モードのボーダー色（--wa-color-surface-border）に背景と同化しない #434857 が定義されていること", () => {
      expect(resolvedDarkBlock).toMatch(/--wa-color-surface-border:\s*#434857;/);
    });

    it("Dark モードの控えめテキスト色（--wa-color-text-quiet）にコントラストを確保した #9da7b3 が定義されていること", () => {
      expect(resolvedDarkBlock).toMatch(/--wa-color-text-quiet:\s*#9da7b3;/);
    });

    it("Dark モードのスクロールバーサム色（--scrollbar-thumb-color）にボーダーと調和する #434857 が定義されていること", () => {
      expect(resolvedDarkBlock).toMatch(/--scrollbar-thumb-color:\s*var\(--wa-color-surface-border\);/);
    });

    it("Dark モードのアクティブボタン背景色（--wa-color-neutral-fill-normal）に背景と同化しない #484d5e が定義されていること", () => {
      expect(resolvedDarkBlock).toMatch(/--wa-color-neutral-fill-normal:\s*#484d5e;/);
    });

    it("Dark モードの通常ボタンホバー背景色（--wa-color-neutral-fill-quiet）に基調色より暗い #252833 が定義されていること", () => {
      expect(resolvedDarkBlock).toMatch(/--wa-color-neutral-fill-quiet:\s*#252833;/);
    });

    it("Dark モードのアクティブボタン文字色（--wa-color-neutral-on-normal）に純白トークンが定義されていること", () => {
      expect(resolvedDarkBlock).toMatch(/--wa-color-neutral-on-normal:\s*var\(--stepnote-color-white\);/);
    });

    it("Dark モードのアクティブボタンホバー混色（--wa-color-mix-hover）に暗く沈み込ませる #000000 20% が定義されていること", () => {
      expect(resolvedDarkBlock).toMatch(/--wa-color-mix-hover:\s*#000000 20%;/);
    });

    it("Dark モードのアクティブボタンホバー背景色（--wa-color-neutral-fill-normal-hover）に基調色より暗い #1f212b が定義されていること", () => {
      expect(resolvedDarkBlock).toMatch(
        /--wa-color-neutral-fill-normal-hover:\s*#1f212b;/,
      );
    });

    it("Dark モードにダイアログ・フォーム・ドロップダウン用セマンティックトークンが定義されていること", () => {
      expect(resolvedDarkBlock).toMatch(/--stepnote-dialog-bg:\s*#1c2128;/);
      expect(resolvedDarkBlock).toMatch(/--stepnote-dialog-border:\s*#444c56;/);
      expect(resolvedDarkBlock).toMatch(/--stepnote-dialog-title-color:\s*var\(--wa-color-neutral-on-normal\);/);
      expect(resolvedDarkBlock).toMatch(/--stepnote-dialog-body-color:\s*#f0f6fc;/);
      expect(resolvedDarkBlock).toMatch(/--stepnote-form-bg:\s*#0d1117;/);
      expect(resolvedDarkBlock).toMatch(/--stepnote-form-border:\s*var\(--stepnote-dialog-border\);/);
      expect(resolvedDarkBlock).toMatch(/--stepnote-form-label-color:\s*var\(--wa-color-text-normal\);/);
      expect(resolvedDarkBlock).toMatch(/--stepnote-form-value-color:\s*var\(--wa-color-neutral-on-normal\);/);
      expect(resolvedDarkBlock).toMatch(/--stepnote-form-placeholder-color:\s*#768390;/);
      expect(resolvedDarkBlock).toMatch(/--stepnote-dropdown-bg:\s*var\(--stepnote-dialog-bg\);/);
      expect(resolvedDarkBlock).toMatch(/--stepnote-dropdown-border:\s*var\(--stepnote-dialog-border\);/);
      expect(resolvedDarkBlock).toMatch(/--stepnote-dropdown-color:\s*var\(--wa-color-neutral-on-normal\);/);
      expect(resolvedDarkBlock).toMatch(/--stepnote-dropdown-item-hover-bg:\s*#30363d;/);
      expect(resolvedDarkBlock).toMatch(/--stepnote-dropdown-item-icon-color:\s*var\(--wa-color-text-normal\);/);
      expect(resolvedDarkBlock).toMatch(/--stepnote-dropdown-danger-color:\s*var\(--wa-color-danger-70,\s*#ff7b72\);/);
    });

    it("Dark モードのメニュートリガーが基底セマンティックトークンを参照していること", () => {
      expect(resolvedDarkBlock).toMatch(/--label-menu-trigger-hover-color:\s*var\(--wa-color-neutral-on-normal\);/);
      expect(resolvedDarkBlock).toMatch(/--label-menu-trigger-active-color:\s*var\(--wa-color-neutral-on-normal\);/);
    });
  });

  describe("OS 連動ダークモードの基調色定義", () => {
    const mediaBlock = extractBlock(
      tokensScss,
      /@media\s*\(prefers-color-scheme:\s*dark\)/,
    );
    const mixinBlock = extractBlock(
      tokensScss,
      /@mixin\s+dark-theme-tokens/,
    );
    const resolvedMediaBlock = mediaBlock.includes("@include dark-theme-tokens")
      ? mixinBlock
      : mediaBlock;

    it("OS 連動ダークモード（@media (prefers-color-scheme: dark)）にも同一の各トークン値が定義されていること", () => {
      expect(resolvedMediaBlock).toMatch(/--wa-color-surface-default:\s*#2f323f;/);
      expect(resolvedMediaBlock).toMatch(/--wa-color-surface-border:\s*#434857;/);
      expect(resolvedMediaBlock).toMatch(/--wa-color-text-quiet:\s*#9da7b3;/);
      expect(resolvedMediaBlock).toMatch(/--scrollbar-thumb-color:\s*var\(--wa-color-surface-border\);/);
      expect(resolvedMediaBlock).toMatch(/--wa-color-neutral-fill-normal:\s*#484d5e;/);
      expect(resolvedMediaBlock).toMatch(/--wa-color-neutral-fill-quiet:\s*#252833;/);
      expect(resolvedMediaBlock).toMatch(/--wa-color-neutral-on-normal:\s*var\(--stepnote-color-white\);/);
      expect(resolvedMediaBlock).toMatch(/--wa-color-mix-hover:\s*#000000 20%;/);
      expect(resolvedMediaBlock).toMatch(
        /--wa-color-neutral-fill-normal-hover:\s*#1f212b;/,
      );
      expect(resolvedMediaBlock).toMatch(/--stepnote-dialog-bg:\s*#1c2128;/);
      expect(resolvedMediaBlock).toMatch(/--stepnote-dialog-border:\s*#444c56;/);
      expect(resolvedMediaBlock).toMatch(/--stepnote-dialog-title-color:\s*var\(--wa-color-neutral-on-normal\);/);
      expect(resolvedMediaBlock).toMatch(/--stepnote-dialog-body-color:\s*#f0f6fc;/);
      expect(resolvedMediaBlock).toMatch(/--stepnote-form-bg:\s*#0d1117;/);
      expect(resolvedMediaBlock).toMatch(/--stepnote-form-border:\s*var\(--stepnote-dialog-border\);/);
      expect(resolvedMediaBlock).toMatch(/--stepnote-form-label-color:\s*var\(--wa-color-text-normal\);/);
      expect(resolvedMediaBlock).toMatch(/--stepnote-form-value-color:\s*var\(--wa-color-neutral-on-normal\);/);
      expect(resolvedMediaBlock).toMatch(/--stepnote-form-placeholder-color:\s*#768390;/);
      expect(resolvedMediaBlock).toMatch(/--stepnote-dropdown-bg:\s*var\(--stepnote-dialog-bg\);/);
      expect(resolvedMediaBlock).toMatch(/--stepnote-dropdown-border:\s*var\(--stepnote-dialog-border\);/);
      expect(resolvedMediaBlock).toMatch(/--stepnote-dropdown-color:\s*var\(--wa-color-neutral-on-normal\);/);
      expect(resolvedMediaBlock).toMatch(/--stepnote-dropdown-item-hover-bg:\s*#30363d;/);
      expect(resolvedMediaBlock).toMatch(/--stepnote-dropdown-item-icon-color:\s*var\(--wa-color-text-normal\);/);
      expect(resolvedMediaBlock).toMatch(/--stepnote-dropdown-danger-color:\s*var\(--wa-color-danger-70,\s*#ff7b72\);/);
    });
  });

  describe("SCSS-013: ダークテーマ共通トークン Mixin（@mixin dark-theme-tokens）仕様", () => {
    it("仕様 22: @mixin dark-theme-tokens が定義され、ダークテーマ用全トークンが集約されていること", () => {
      const mixinBlock = extractBlock(
        tokensScss,
        /@mixin\s+dark-theme-tokens/,
      );
      expect(mixinBlock).not.toBe("");
      expect(mixinBlock).toMatch(/--wa-color-surface-default:\s*#2f323f;/);
      expect(mixinBlock).toMatch(/--wa-color-surface-border:\s*#434857;/);
      expect(mixinBlock).toMatch(/--wa-color-text-normal:\s*#e6edf3;/);
      expect(mixinBlock).toMatch(/--wa-color-text-quiet:\s*#9da7b3;/);
      expect(mixinBlock).toMatch(/--scrollbar-thumb-color:\s*var\(--wa-color-surface-border\);/);
      expect(mixinBlock).toMatch(/--stepnote-dialog-bg:\s*#1c2128;/);
      expect(mixinBlock).toMatch(/--stepnote-form-bg:\s*#0d1117;/);
      expect(mixinBlock).toMatch(/--stepnote-dropdown-bg:\s*var\(--stepnote-dialog-bg\);/);
    });

    it("仕様 23: 手動 Dark テーマセレクタに @include dark-theme-tokens が適用されていること", () => {
      const darkBlock = extractBlock(
        tokensScss,
        /:root\.wa-dark\s*,\s*:root\[data-theme="dark"\]/,
      );
      expect(darkBlock).toMatch(/@include\s+dark-theme-tokens;/);
    });

    it("仕様 24: OS 連動ダークモードセレクタに @include dark-theme-tokens が適用されていること", () => {
      const mediaBlock = extractBlock(
        tokensScss,
        /@media\s*\(prefers-color-scheme:\s*dark\)/,
      );
      expect(mediaBlock).toMatch(/@include\s+dark-theme-tokens;/);
    });
  });

  describe("Phase 2: アクセント・状態カラーのセマンティック集約仕様", () => {
    it("仕様 27: Light モードの Quick Access アクティブ時アイコンカラーが通常時アイコン変数を参照していること", () => {
      const lightBlock = extractBlock(
        tokensScss,
        /:root[\s\S]*?\[data-theme="light"\]/,
      );
      expect(lightBlock).toMatch(/--quick-access-icon-active-bookmark:\s*var\(--quick-access-icon-bookmark\);/);
      expect(lightBlock).toMatch(/--quick-access-icon-active-overdue:\s*var\(--quick-access-icon-overdue\);/);
      expect(lightBlock).toMatch(/--quick-access-icon-active-asap:\s*var\(--quick-access-icon-asap\);/);
      expect(lightBlock).toMatch(/--quick-access-icon-active-upcoming:\s*var\(--quick-access-icon-upcoming\);/);
      expect(lightBlock).toMatch(/--quick-access-icon-active-done:\s*var\(--quick-access-icon-done\);/);
      expect(lightBlock).toMatch(/--quick-access-icon-active-progress:\s*var\(--quick-access-icon-progress\);/);
    });

    it("仕様 28: Light モードの Labels アクティブ時アイコンカラーが通常時変数を参照していること", () => {
      const lightBlock = extractBlock(
        tokensScss,
        /:root[\s\S]*?\[data-theme="light"\]/,
      );
      expect(lightBlock).toMatch(/--label-icon-active-color:\s*var\(--label-icon-color\);/);
    });

    it("仕様 29: Light モードの未分類・開始待ちアイコン色がセマンティックトークンを参照していること", () => {
      const lightBlock = extractBlock(
        tokensScss,
        /:root[\s\S]*?\[data-theme="light"\]/,
      );
      expect(lightBlock).toMatch(/--quick-access-icon-uncategorized:\s*var\(--wa-color-text-normal\);/);
      expect(lightBlock).toMatch(/--quick-access-icon-pending:\s*var\(--wa-color-text-normal\);/);
    });

    it("仕様 30: Dark モード（@mixin dark-theme-tokens）の Quick Access アクティブ時アイコンカラーが通常時アイコン変数を参照していること", () => {
      const mixinBlock = extractBlock(
        tokensScss,
        /@mixin\s+dark-theme-tokens/,
      );
      expect(mixinBlock).toMatch(/--quick-access-icon-active-bookmark:\s*var\(--quick-access-icon-bookmark\);/);
      expect(mixinBlock).toMatch(/--quick-access-icon-active-overdue:\s*var\(--quick-access-icon-overdue\);/);
      expect(mixinBlock).toMatch(/--quick-access-icon-active-asap:\s*var\(--quick-access-icon-asap\);/);
      expect(mixinBlock).toMatch(/--quick-access-icon-active-upcoming:\s*var\(--quick-access-icon-upcoming\);/);
      expect(mixinBlock).toMatch(/--quick-access-icon-active-done:\s*var\(--quick-access-icon-done\);/);
      expect(mixinBlock).toMatch(/--quick-access-icon-active-progress:\s*var\(--quick-access-icon-progress\);/);
      expect(mixinBlock).toMatch(/--label-icon-active-color:\s*var\(--label-icon-color\);/);
    });

    it("仕様 31: Dark モードの未分類・開始待ちアイコン色が純白セマンティックトークンを参照していること", () => {
      const mixinBlock = extractBlock(
        tokensScss,
        /@mixin\s+dark-theme-tokens/,
      );
      expect(mixinBlock).toMatch(/--quick-access-icon-uncategorized:\s*var\(--stepnote-color-white\);/);
      expect(mixinBlock).toMatch(/--quick-access-icon-pending:\s*var\(--stepnote-color-white\);/);
    });
  });

  describe("Phase 3: 半透明シャドウ・残余カラーのセマンティック集約仕様", () => {
    it("仕様 32: Light モードのダイアログ・ドロップダウン背景が純白トークン（var(--stepnote-color-white)）を参照していること", () => {
      const lightBlock = extractBlock(
        tokensScss,
        /:root[\s\S]*?\[data-theme="light"\]/,
      );
      expect(lightBlock).toMatch(/--stepnote-dialog-bg:\s*var\(--stepnote-color-white\);/);
      expect(lightBlock).toMatch(/--stepnote-dropdown-bg:\s*var\(--stepnote-color-white\);/);
    });

    it("仕様 33: Dark モード（@mixin dark-theme-tokens）の neutral-on-normal が純白トークンを参照していること", () => {
      const mixinBlock = extractBlock(
        tokensScss,
        /@mixin\s+dark-theme-tokens/,
      );
      expect(mixinBlock).toMatch(/--wa-color-neutral-on-normal:\s*var\(--stepnote-color-white\);/);
    });

    it("仕様 34: Light モードにエレベーションシャドウトークン（--stepnote-shadow-dialog / --stepnote-shadow-dropdown）が定義され、参照されていること", () => {
      const lightBlock = extractBlock(
        tokensScss,
        /:root[\s\S]*?\[data-theme="light"\]/,
      );
      expect(lightBlock).toMatch(/--stepnote-shadow-dialog:\s*0 12px 28px rgba\(140, 149, 159, 0\.3\);/);
      expect(lightBlock).toMatch(/--stepnote-shadow-dropdown:\s*0 8px 24px rgba\(140, 149, 159, 0\.2\);/);
      expect(lightBlock).toMatch(/--stepnote-dialog-shadow:\s*var\(--stepnote-shadow-dialog\);/);
      expect(lightBlock).toMatch(/--stepnote-dropdown-shadow:\s*var\(--stepnote-shadow-dropdown\);/);
    });

    it("仕様 35: Dark モードにエレベーションシャドウトークン（--stepnote-shadow-dialog / --stepnote-shadow-dropdown）が定義され、参照されていること", () => {
      const mixinBlock = extractBlock(
        tokensScss,
        /@mixin\s+dark-theme-tokens/,
      );
      expect(mixinBlock).toMatch(/--stepnote-shadow-dialog:\s*0 16px 36px rgba\(0, 0, 0, 0\.8\),\s*0 0 0 1px rgba\(255, 255, 255, 0\.08\);/);
      expect(mixinBlock).toMatch(/--stepnote-shadow-dropdown:\s*0 12px 28px rgba\(0, 0, 0, 0\.8\),\s*0 0 0 1px rgba\(255, 255, 255, 0\.08\);/);
      expect(mixinBlock).toMatch(/--stepnote-dialog-shadow:\s*var\(--stepnote-shadow-dialog\);/);
      expect(mixinBlock).toMatch(/--stepnote-dropdown-shadow:\s*var\(--stepnote-shadow-dropdown\);/);
    });

    it("仕様 36: ドロップダウンの Danger カラーおよびホバー背景がセマンティックトークンを参照していること", () => {
      const lightBlock = extractBlock(
        tokensScss,
        /:root[\s\S]*?\[data-theme="light"\]/,
      );
      const mixinBlock = extractBlock(
        tokensScss,
        /@mixin\s+dark-theme-tokens/,
      );
      // Light モード
      expect(lightBlock).toMatch(/--stepnote-dropdown-danger-color:\s*var\(--quick-access-icon-overdue\);/);
      expect(lightBlock).toMatch(/--stepnote-dropdown-item-hover-bg:\s*var\(--stepnote-form-bg\);/);
      // Dark モード
      expect(mixinBlock).toMatch(/--stepnote-dropdown-danger-color:\s*var\(--wa-color-danger-70,\s*#ff7b72\);/);
      expect(mixinBlock).toMatch(/--stepnote-dropdown-bg:\s*var\(--stepnote-dialog-bg\);/);
      expect(mixinBlock).toMatch(/--stepnote-form-border:\s*var\(--stepnote-dialog-border\);/);
      expect(mixinBlock).toMatch(/--stepnote-dropdown-border:\s*var\(--stepnote-dialog-border\);/);
    });
  });
});


