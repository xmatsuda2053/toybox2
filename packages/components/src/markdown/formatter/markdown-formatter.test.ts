/**
 * MarkdownFormatter 単体テスト仕様
 *
 * 1. 基本的な構文フォーマット
 *   - 見出しや段落の空行・余白が標準的に整形されること
 *   - リスト記号やインデントが標準フォーマットに正規化されること
 * 2. GFM 拡張構文のフォーマット
 *   - テーブル記法が正しく整形されて出力されること
 *   - 日本語（全角文字）を含むテーブルのパイプ位置が表示幅（全角=2, 半角=1）に合わせて縦に整列されること
 *   - テーブルの列アライメント（左揃え・中央揃え・右揃え）が維持されること
 *   - タスクリスト（チェックボックス）が正しく出力されること
 * 3. 境界値・エッジケース処理
 *   - 空文字列や空白のみのテキストが渡された場合に安全に空文字列を返すこと
 */

import { describe, it, expect } from "vitest";
import { formatMarkdown } from "./markdown-formatter";

describe("MarkdownFormatter (formatMarkdown)", () => {
  describe("基本的な構文フォーマット", () => {
    it("見出しや段落の空行・余白が標準的に整形されること", async () => {
      const input = "#  見出し1 \n\n\n\n本文段落です。   ";
      const result = await formatMarkdown(input);
      expect(result.trim()).toBe("# 見出し1\n\n本文段落です。");
    });

    it("箇条書きリストの記法が標準フォーマットに正規化されること", async () => {
      const input = "* 項目1\n* 項目2";
      const result = await formatMarkdown(input);
      expect(result).toContain("- 項目1\n- 項目2");
    });
  });

  describe("GFM 拡張構文のフォーマット", () => {
    it("テーブル記法が正しく整形されて出力されること", async () => {
      const input = "|列1|列2|\n|---|---|\n|値1|値2|";
      const result = await formatMarkdown(input);
      expect(result).toContain("| 列1 | 列2 |");
      expect(result).toContain("| 値1 | 値2 |");
    });

    it("日本語（全角文字）を含むテーブルのパイプ位置が表示幅（全角=2, 半角=1）に合わせて縦に整列されること", async () => {
      const input = `
| 名前 | 役割 |
| --- | --- |
| 鈴木 | デザイナー |
| 山田太郎 | PM |
      `.trim();

      const result = await formatMarkdown(input);
      const lines = result.trim().split("\n");

      // 各行の区切りパイプ数と、パイプで挟まれた各セルの表示幅を検証
      expect(lines).toHaveLength(4);
      // 列1: 最大幅は「山田太郎」(8)。「名前」(4) には空白4個、「鈴木」(4) にも空白4個
      expect(lines[0]).toBe("| 名前     | 役割       |");
      expect(lines[1]).toBe("| -------- | ---------- |");
      expect(lines[2]).toBe("| 鈴木     | デザイナー |");
      expect(lines[3]).toBe("| 山田太郎 | PM         |");
    });

    it("テーブルの列アライメント（左揃え・中央揃え・右揃え）が維持されること", async () => {
      const input = `
| 左 | 中央 | 右 |
| :--- | :---: | ---: |
| A | B | C |
      `.trim();

      const result = await formatMarkdown(input);
      expect(result).toContain("| :--- | :---: | ---: |");
    });

    it("タスクリスト記法が保持されて出力されること", async () => {
      const input = "- [ ] 未完了タスク\n- [x] 完了タスク";
      const result = await formatMarkdown(input);
      expect(result).toContain("- [ ] 未完了タスク");
      expect(result).toContain("- [x] 完了タスク");
    });
  });

  describe("境界値・エッジケース処理", () => {
    it("空文字列が渡された場合に安全に空文字列を返すこと", async () => {
      const result = await formatMarkdown("");
      expect(result).toBe("");
    });

    it("空白のみのテキストが渡された場合に空文字列を返すこと", async () => {
      const result = await formatMarkdown("   \n\n  ");
      expect(result).toBe("");
    });
  });
});
