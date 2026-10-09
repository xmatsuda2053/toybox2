/**
 * テーブルフォーマッター ユーティリティ 単体テスト
 *
 * 1. 文字表示幅の計算
 *   - 半角英数字・半角カナ・ASCII記号が表示幅1として計算されること
 *   - 全角ひらがな・カタカナ・漢字・全角英数記号が表示幅2として計算されること
 * 2. セパレータとアライメント解析
 *   - 各アライメント指定（左揃え、中央揃え、右揃え、なし）が正しく識別されること
 * 3. 行の構文解析
 *   - エスケープされたパイプ（\\|）を含むセルが分割されずにパースされること
 * 4. テーブルブロックの整形
 *   - セパレータ行のないブロックは変更されずにそのまま返されること
 */

import { describe, it, expect } from "vitest";
import {
  getCharacterWidth,
  getStringDisplayWidth,
  parseSeparatorCell,
  parseTableRow,
  formatSingleTableBlock,
} from "./table-formatter.utils";

describe("table-formatter.utils", () => {
  describe("文字表示幅の計算", () => {
    it("半角英数字・半角カナ・ASCII記号が表示幅1として計算されること", () => {
      expect(getCharacterWidth("a")).toBe(1);
      expect(getCharacterWidth("1")).toBe(1);
      expect(getCharacterWidth("-")).toBe(1);
      expect(getCharacterWidth("ｱ")).toBe(1); // 半角カナ
      expect(getStringDisplayWidth("Hello World!")).toBe(12);
      expect(getStringDisplayWidth("ﾃｽﾄ123")).toBe(6);
    });

    it("全角ひらがな・カタカナ・漢字・全角英数記号が表示幅2として計算されること", () => {
      expect(getCharacterWidth("あ")).toBe(2);
      expect(getCharacterWidth("ア")).toBe(2);
      expect(getCharacterWidth("漢")).toBe(2);
      expect(getCharacterWidth("１")).toBe(2);
      expect(getCharacterWidth("Ａ")).toBe(2);
      expect(getStringDisplayWidth("日本語テスト")).toBe(12);
    });
  });

  describe("セパレータとアライメント解析", () => {
    it("各アライメント指定が正しく識別されること", () => {
      expect(parseSeparatorCell("---")).toBe("none");
      expect(parseSeparatorCell(":---")).toBe("left");
      expect(parseSeparatorCell(":---:")).toBe("center");
      expect(parseSeparatorCell("---:")).toBe("right");
      expect(parseSeparatorCell("not-sep")).toBeNull();
    });
  });

  describe("行の構文解析", () => {
    it("エスケープされたパイプ（\\|）を含むセルが分割されずにパースされること", () => {
      const line = "| A \\| B | C |";
      const cells = parseTableRow(line);
      expect(cells).toEqual(["A \\| B", "C"]);
    });

    it("テーブル構文でない行は null を返すこと", () => {
      expect(parseTableRow("通常のテキスト")).toBeNull();
      expect(parseTableRow("| 途中で終わる")).toBeNull();
    });
  });

  describe("テーブルブロックの整形", () => {
    it("セパレータ行のないブロックは変更されずにそのまま返されること", () => {
      const raw = ["| A | B |", "| C | D |"];
      const result = formatSingleTableBlock(raw);
      expect(result).toEqual(raw);
    });
  });
});
