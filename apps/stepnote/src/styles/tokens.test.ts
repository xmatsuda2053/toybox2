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
 * 仕様 10: Dark モードのアクティブボタン文字色（--wa-color-neutral-on-normal）に高コントラストな純白 #ffffff が定義されていること
 * 仕様 11: OS 連動ダークモード（@media (prefers-color-scheme: dark)）にも調整後の各トークン値が定義されていること
 * 仕様 12: Light モードの通常ボタンホバー背景色（--wa-color-neutral-fill-quiet）に基調色より暗い #e2e5e8 が定義されていること
 * 仕様 13: Light モードのアクティブボタン背景色（--wa-color-neutral-fill-normal）に通常ホバー色（#e2e5e8）より濃い #d8dce0 が定義されていること
 * 仕様 14: Light モードのアクティブボタンホバー混色（--wa-color-mix-hover）に白浮きせず暗く沈み込ませる #000000 12% が定義されていること
 * 仕様 15: Dark モードのアクティブボタンホバー混色（--wa-color-mix-hover）に暗く沈み込ませる #000000 20% が定義されていること
 * 仕様 16: Light モードのアクティブボタンホバー背景色（--wa-color-neutral-fill-normal-hover）に基調色より暗い #c2c7cd が定義されていること
 * 仕様 17: Dark モードのアクティブボタンホバー背景色（--wa-color-neutral-fill-normal-hover）に基調色より暗い #1f212b が定義されていること
 * 仕様 18: OS 連動ダークモードにも同様に #1f212b が定義されていること
 * 仕様 19: Light モードにダイアログ・フォーム・ドロップダウン用トークンが定義されていること
 * 仕様 20: Dark モードにダイアログ・フォーム・ドロップダウン用トークンが定義されていること
 * 仕様 21: OS 連動ダークモードにも同様にダイアログ・フォーム・ドロップダウン用トークンが定義されていること
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
      expect(lightBlock).toMatch(/--stepnote-dialog-bg:\s*#ffffff;/);
      expect(lightBlock).toMatch(/--stepnote-dialog-border:\s*#d0d7de;/);
      expect(lightBlock).toMatch(/--stepnote-dialog-title-color:\s*#1f2328;/);
      expect(lightBlock).toMatch(/--stepnote-dialog-body-color:\s*#1f2328;/);
      expect(lightBlock).toMatch(/--stepnote-form-bg:\s*#f6f8fa;/);
      expect(lightBlock).toMatch(/--stepnote-form-border:\s*#d0d7de;/);
      expect(lightBlock).toMatch(/--stepnote-form-label-color:\s*#1f2328;/);
      expect(lightBlock).toMatch(/--stepnote-form-value-color:\s*#1f2328;/);
      expect(lightBlock).toMatch(/--stepnote-form-placeholder-color:\s*#8c959f;/);
      expect(lightBlock).toMatch(/--stepnote-dropdown-bg:\s*#ffffff;/);
      expect(lightBlock).toMatch(/--stepnote-dropdown-border:\s*#d0d7de;/);
      expect(lightBlock).toMatch(/--stepnote-dropdown-color:\s*#1f2328;/);
      expect(lightBlock).toMatch(/--stepnote-dropdown-item-hover-bg:\s*#f6f8fa;/);
      expect(lightBlock).toMatch(/--stepnote-dropdown-item-icon-color:\s*#57606a;/);
      expect(lightBlock).toMatch(/--stepnote-dropdown-danger-color:\s*#cf222e;/);
    });
  });

  describe("Dark モードの基調色定義", () => {
    it("Dark モードの背景色（--wa-color-surface-default）に過度なコントラストを緩和する #2f323f が定義されていること", () => {
      const darkBlock = extractBlock(
        tokensScss,
        /:root\.wa-dark\s*,\s*:root\[data-theme="dark"\]/,
      );
      expect(darkBlock).toMatch(/--wa-color-surface-default:\s*#2f323f;/);
    });

    it("Dark モードのボーダー色（--wa-color-surface-border）に背景と同化しない #434857 が定義されていること", () => {
      const darkBlock = extractBlock(
        tokensScss,
        /:root\.wa-dark\s*,\s*:root\[data-theme="dark"\]/,
      );
      expect(darkBlock).toMatch(/--wa-color-surface-border:\s*#434857;/);
    });

    it("Dark モードの控えめテキスト色（--wa-color-text-quiet）にコントラストを確保した #9da7b3 が定義されていること", () => {
      const darkBlock = extractBlock(
        tokensScss,
        /:root\.wa-dark\s*,\s*:root\[data-theme="dark"\]/,
      );
      expect(darkBlock).toMatch(/--wa-color-text-quiet:\s*#9da7b3;/);
    });

    it("Dark モードのスクロールバーサム色（--scrollbar-thumb-color）にボーダーと調和する #434857 が定義されていること", () => {
      const darkBlock = extractBlock(
        tokensScss,
        /:root\.wa-dark\s*,\s*:root\[data-theme="dark"\]/,
      );
      expect(darkBlock).toMatch(/--scrollbar-thumb-color:\s*#434857;/);
    });

    it("Dark モードのアクティブボタン背景色（--wa-color-neutral-fill-normal）に背景と同化しない #484d5e が定義されていること", () => {
      const darkBlock = extractBlock(
        tokensScss,
        /:root\.wa-dark\s*,\s*:root\[data-theme="dark"\]/,
      );
      expect(darkBlock).toMatch(/--wa-color-neutral-fill-normal:\s*#484d5e;/);
    });

    it("Dark モードの通常ボタンホバー背景色（--wa-color-neutral-fill-quiet）に基調色より暗い #252833 が定義されていること", () => {
      const darkBlock = extractBlock(
        tokensScss,
        /:root\.wa-dark\s*,\s*:root\[data-theme="dark"\]/,
      );
      expect(darkBlock).toMatch(/--wa-color-neutral-fill-quiet:\s*#252833;/);
    });

    it("Dark モードのアクティブボタン文字色（--wa-color-neutral-on-normal）に高コントラストな純白 #ffffff が定義されていること", () => {
      const darkBlock = extractBlock(
        tokensScss,
        /:root\.wa-dark\s*,\s*:root\[data-theme="dark"\]/,
      );
      expect(darkBlock).toMatch(/--wa-color-neutral-on-normal:\s*#ffffff;/);
    });

    it("Dark モードのアクティブボタンホバー混色（--wa-color-mix-hover）に暗く沈み込ませる #000000 20% が定義されていること", () => {
      const darkBlock = extractBlock(
        tokensScss,
        /:root\.wa-dark\s*,\s*:root\[data-theme="dark"\]/,
      );
      expect(darkBlock).toMatch(/--wa-color-mix-hover:\s*#000000 20%;/);
    });

    it("Dark モードのアクティブボタンホバー背景色（--wa-color-neutral-fill-normal-hover）に基調色より暗い #1f212b が定義されていること", () => {
      const darkBlock = extractBlock(
        tokensScss,
        /:root\.wa-dark\s*,\s*:root\[data-theme="dark"\]/,
      );
      expect(darkBlock).toMatch(
        /--wa-color-neutral-fill-normal-hover:\s*#1f212b;/,
      );
    });

    it("Dark モードにダイアログ・フォーム・ドロップダウン用セマンティックトークンが定義されていること", () => {
      const darkBlock = extractBlock(
        tokensScss,
        /:root\.wa-dark\s*,\s*:root\[data-theme="dark"\]/,
      );
      expect(darkBlock).toMatch(/--stepnote-dialog-bg:\s*#1c2128;/);
      expect(darkBlock).toMatch(/--stepnote-dialog-border:\s*#444c56;/);
      expect(darkBlock).toMatch(/--stepnote-dialog-title-color:\s*#ffffff;/);
      expect(darkBlock).toMatch(/--stepnote-dialog-body-color:\s*#f0f6fc;/);
      expect(darkBlock).toMatch(/--stepnote-form-bg:\s*#0d1117;/);
      expect(darkBlock).toMatch(/--stepnote-form-border:\s*#444c56;/);
      expect(darkBlock).toMatch(/--stepnote-form-label-color:\s*#e6edf3;/);
      expect(darkBlock).toMatch(/--stepnote-form-value-color:\s*#ffffff;/);
      expect(darkBlock).toMatch(/--stepnote-form-placeholder-color:\s*#768390;/);
      expect(darkBlock).toMatch(/--stepnote-dropdown-bg:\s*#1c2128;/);
      expect(darkBlock).toMatch(/--stepnote-dropdown-border:\s*#444c56;/);
      expect(darkBlock).toMatch(/--stepnote-dropdown-color:\s*#ffffff;/);
      expect(darkBlock).toMatch(/--stepnote-dropdown-item-hover-bg:\s*#30363d;/);
      expect(darkBlock).toMatch(/--stepnote-dropdown-item-icon-color:\s*#e6edf3;/);
      expect(darkBlock).toMatch(/--stepnote-dropdown-danger-color:\s*#ff7b72;/);
    });
  });

  describe("OS 連動ダークモードの基調色定義", () => {
    it("OS 連動ダークモード（@media (prefers-color-scheme: dark)）にも同一の各トークン値が定義されていること", () => {
      const mediaBlock = extractBlock(
        tokensScss,
        /@media\s*\(prefers-color-scheme:\s*dark\)/,
      );
      expect(mediaBlock).toMatch(/--wa-color-surface-default:\s*#2f323f;/);
      expect(mediaBlock).toMatch(/--wa-color-surface-border:\s*#434857;/);
      expect(mediaBlock).toMatch(/--wa-color-text-quiet:\s*#9da7b3;/);
      expect(mediaBlock).toMatch(/--scrollbar-thumb-color:\s*#434857;/);
      expect(mediaBlock).toMatch(/--wa-color-neutral-fill-normal:\s*#484d5e;/);
      expect(mediaBlock).toMatch(/--wa-color-neutral-fill-quiet:\s*#252833;/);
      expect(mediaBlock).toMatch(/--wa-color-neutral-on-normal:\s*#ffffff;/);
      expect(mediaBlock).toMatch(/--wa-color-mix-hover:\s*#000000 20%;/);
      expect(mediaBlock).toMatch(
        /--wa-color-neutral-fill-normal-hover:\s*#1f212b;/,
      );
      expect(mediaBlock).toMatch(/--stepnote-dialog-bg:\s*#1c2128;/);
      expect(mediaBlock).toMatch(/--stepnote-dialog-border:\s*#444c56;/);
      expect(mediaBlock).toMatch(/--stepnote-dialog-title-color:\s*#ffffff;/);
      expect(mediaBlock).toMatch(/--stepnote-dialog-body-color:\s*#f0f6fc;/);
      expect(mediaBlock).toMatch(/--stepnote-form-bg:\s*#0d1117;/);
      expect(mediaBlock).toMatch(/--stepnote-form-border:\s*#444c56;/);
      expect(mediaBlock).toMatch(/--stepnote-form-label-color:\s*#e6edf3;/);
      expect(mediaBlock).toMatch(/--stepnote-form-value-color:\s*#ffffff;/);
      expect(mediaBlock).toMatch(/--stepnote-form-placeholder-color:\s*#768390;/);
      expect(mediaBlock).toMatch(/--stepnote-dropdown-bg:\s*#1c2128;/);
      expect(mediaBlock).toMatch(/--stepnote-dropdown-border:\s*#444c56;/);
      expect(mediaBlock).toMatch(/--stepnote-dropdown-color:\s*#ffffff;/);
      expect(mediaBlock).toMatch(/--stepnote-dropdown-item-hover-bg:\s*#30363d;/);
      expect(mediaBlock).toMatch(/--stepnote-dropdown-item-icon-color:\s*#e6edf3;/);
      expect(mediaBlock).toMatch(/--stepnote-dropdown-danger-color:\s*#ff7b72;/);
    });
  });
});
