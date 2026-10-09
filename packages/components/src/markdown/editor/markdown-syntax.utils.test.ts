/**
 * markdown-syntax.utils 単体テスト仕様
 *
 * 1. エディタ未初期化時のフォールバック構文生成 (getFallbackMarkdownText)
 *   - 現在のテキストが空の場合、各アクション種別に応じた既定プレースホルダーを返すこと
 *   - 現在のテキストが存在する場合、そのテキストを装飾または包含した構文を返すこと
 * 2. 行頭プレフィックス判定 (getLinePrefixForAction)
 *   - 行頭装飾アクション（heading, bullet-list, ordered-list, task-list, quote）に対して適切なプレフィックスを返すこと
 *   - インライン装飾やテーブル等に対しては null を返すこと
 * 3. 囲み構文およびカーソル選択範囲計算 (getSurroundingSyntax)
 *   - bold: 選択文字列の有無に応じた囲みとカーソル位置（anchor, head）を返すこと
 *   - italic: 選択文字列の有無に応じた囲みとカーソル位置を返すこと
 *   - code: 単行文字列はインライン、改行を含む文字列はブロックコードとして囲むこと
 *   - link: 選択文字列がある場合は URL 位置、ない場合は表示テキスト位置を選択状態にすること
 *   - table: 直前の改行有無に応じたプレフィックス付与とカーソル移動を行うこと
 * 4. 複数行リストプレフィックス適用 (applyMultiLineListPrefix)
 *   - bullet-list: 複数行テキストの各行頭に '- ' を付与すること
 *   - task-list: 複数行テキストの各行頭に '- [ ] ' を付与すること
 *   - ordered-list: 複数行テキストの各行頭に '1. ' を付与すること
 *   - 途中の空行はスキップしてプレフィックスを付与しないこと
 */

import { describe, it, expect } from "vitest";
import {
  getFallbackMarkdownText,
  getLinePrefixForAction,
  getSurroundingSyntax,
  applyMultiLineListPrefix,
} from "./markdown-syntax.utils.js";

describe("markdown-syntax.utils", () => {
  describe("getFallbackMarkdownText (フォールバック構文生成)", () => {
    it("現在のテキストが空の場合、各アクションの既定プレースホルダー構文を返すこと", () => {
      expect(getFallbackMarkdownText("bold", "")).toBe("**太字**");
      expect(getFallbackMarkdownText("italic", "")).toBe("*斜体*");
      expect(getFallbackMarkdownText("heading", "")).toBe("### 見出し");
      expect(getFallbackMarkdownText("bullet-list", "")).toBe("- 項目");
      expect(getFallbackMarkdownText("ordered-list", "")).toBe("1. 項目");
      expect(getFallbackMarkdownText("task-list", "")).toBe("- [ ] タスク");
      expect(getFallbackMarkdownText("quote", "")).toBe("> 引用文");
      expect(getFallbackMarkdownText("code", "")).toBe("`コード`");
      expect(getFallbackMarkdownText("link", "")).toBe("[リンク](url)");
      expect(getFallbackMarkdownText("table", "")).toContain("| 列1 | 列2 | 列3 |");
    });

    it("現在のテキストが存在する場合、そのテキストを装飾して返すこと", () => {
      expect(getFallbackMarkdownText("bold", "重要")).toBe("**重要**");
      expect(getFallbackMarkdownText("heading", "セクション1")).toBe("### セクション1");
      expect(getFallbackMarkdownText("link", "公式サイト")).toBe("[公式サイト](url)");
    });
  });

  describe("getLinePrefixForAction (行頭プレフィックス判定)", () => {
    it("行頭装飾アクションに対して適切なプレフィックスを返すこと", () => {
      expect(getLinePrefixForAction("heading")).toBe("### ");
      expect(getLinePrefixForAction("bullet-list")).toBe("- ");
      expect(getLinePrefixForAction("ordered-list")).toBe("1. ");
      expect(getLinePrefixForAction("task-list")).toBe("- [ ] ");
      expect(getLinePrefixForAction("quote")).toBe("> ");
    });

    it("行頭装飾以外のアクションに対しては null を返すこと", () => {
      expect(getLinePrefixForAction("bold")).toBeNull();
      expect(getLinePrefixForAction("italic")).toBeNull();
      expect(getLinePrefixForAction("code")).toBeNull();
      expect(getLinePrefixForAction("link")).toBeNull();
      expect(getLinePrefixForAction("table")).toBeNull();
    });
  });

  describe("getSurroundingSyntax (囲み構文およびカーソル選択範囲計算)", () => {
    it("bold: テキスト選択ありの場合は文字列を ** で囲み、選択範囲を内側に設定すること", () => {
      const result = getSurroundingSyntax("bold", "hello", 10, 15);
      expect(result.insertText).toBe("**hello**");
      expect(result.anchor).toBe(12); // 10 + 2
      expect(result.head).toBe(17); // 15 + 2
    });

    it("bold: テキスト選択なしの場合は **太字** を挿入し、太字テキストを選択状態にすること", () => {
      const result = getSurroundingSyntax("bold", "", 5, 5);
      expect(result.insertText).toBe("**太字**");
      expect(result.anchor).toBe(7); // 5 + 2
      expect(result.head).toBe(9); // 5 + 4
    });

    it("code: 改行を含まない単行テキストはインラインコードにすること", () => {
      const result = getSurroundingSyntax("code", "const x = 1;", 0, 12);
      expect(result.insertText).toBe("`const x = 1;`");
      expect(result.anchor).toBe(1);
      expect(result.head).toBe(13);
    });

    it("code: 改行を含む複数行テキストはブロックコード（```）にすること", () => {
      const result = getSurroundingSyntax("code", "line1\nline2", 0, 11);
      expect(result.insertText).toBe("```\nline1\nline2\n```");
      expect(result.anchor).toBe(4);
      expect(result.head).toBe(15);
    });

    it("link: テキスト選択ありの場合は URL 入力部分（url）を選択状態にすること", () => {
      const result = getSurroundingSyntax("link", "Google", 0, 6);
      expect(result.insertText).toBe("[Google](url)");
      expect(result.anchor).toBe(9); // 6 + 3
      expect(result.head).toBe(12); // 6 + 6
    });

    it("table: 直前に改行がない場合は改行を先行付与すること", () => {
      const result = getSurroundingSyntax("table", "", 10, 10, false);
      expect(result.insertText.startsWith("\n\n")).toBe(true);
      expect(result.anchor).toBe(10 + result.insertText.length);
    });
  });

  describe("applyMultiLineListPrefix (複数行リストプレフィックス適用)", () => {
    it("bullet-list: 複数行テキストの各行頭に '- ' を付与すること", () => {
      const input = "りんご\nみかん\nバナナ";
      const result = applyMultiLineListPrefix("bullet-list", input);
      expect(result).toBe("- りんご\n- みかん\n- バナナ");
    });

    it("task-list: 複数行テキストの各行頭に '- [ ] ' を付与すること", () => {
      const input = "タスク1\nタスク2";
      const result = applyMultiLineListPrefix("task-list", input);
      expect(result).toBe("- [ ] タスク1\n- [ ] タスク2");
    });

    it("ordered-list: 複数行テキストの各行頭に '1. ' を付与すること", () => {
      const input = "ステップA\nステップB\nステップC";
      const result = applyMultiLineListPrefix("ordered-list", input);
      expect(result).toBe("1. ステップA\n1. ステップB\n1. ステップC");
    });

    it("途中の空行はスキップしてプレフィックスを付与しないこと", () => {
      const input = "項目1\n\n項目2";
      const result = applyMultiLineListPrefix("bullet-list", input);
      expect(result).toBe("- 項目1\n\n- 項目2");
    });
  });
});

