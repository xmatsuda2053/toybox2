/**
 * global-search.utils.test.ts
 *
 * 全体検索用ユーティリティ関数の単体テスト
 *
 * 【テスト仕様一覧】
 * 1. extractSnippet
 *    - キーワードが含まれる場合、キーワード周辺のテキストをスニペットとして切り出すこと
 *    - テキスト長が maxLength 以下の場合は省略記号なしで全文を返すこと
 *    - キーワードが先頭付近にある場合、先頭から切り出し末尾に省略記号を付加すること
 *    - キーワードが末尾付近にある場合、先頭に省略記号を付加して末尾まで切り出すこと
 *    - キーワードが中央にある場合、前後に省略記号を付加して切り出すこと
 *    - キーワードの大文字・小文字を区別せずに一致箇所を特定できること
 *    - キーワードが空文字または合致しない場合、先頭から maxLength 分を切り出すこと
 *    - 改行や連続空白を1つの半角スペースに正規化してスニペットを生成すること
 * 2. formatSourceLabel
 *    - task_name の場合は「タスク名」を返すこと
 *    - task_description の場合は「詳細説明」を返すこと
 *    - task_fiscal_year の場合は「年度」を返すこと
 *    - issue でタイトルがある場合は「課題: [タイトル]」を返すこと
 *    - issue でタイトルがない場合は「課題」を返すこと
 *    - note の場合は「ノート」を返すこと
 *    - log の場合は「ログ」を返すこと
 * 3. tokenizeSearchQuery
 *    - 半角スペースで区切られた複数の単語を小文字の配列に分割すること
 *    - 全角スペース（\u3000）で区切られた場合も正しく分割すること
 *    - 連続する空白や前後の空白を除去し、空文字列を含めないこと
 *    - 重複するキーワードをユニークに統合すること
 *    - 空文字列または空白のみの場合は空配列を返すこと
 */

import { describe, it, expect } from "vitest";
import {
  extractSnippet,
  formatSourceLabel,
  tokenizeSearchQuery,
} from "./global-search.utils.js";

describe("global-search.utils", () => {
  describe("1. extractSnippet", () => {
    it("テキスト長が maxLength 以下の場合は省略記号なしで全文を返すこと", () => {
      const text = "短いテキストの検索テスト";
      const result = extractSnippet(text, "検索", 60);
      expect(result).toBe("短いテキストの検索テスト");
    });

    it("キーワードが先頭付近にある場合、先頭から切り出し末尾に省略記号を付加すること", () => {
      const text =
        "検索キーワードが先頭にあり、その後に非常に長いテキストが延々と続いていく文章のテストケースです。";
      const result = extractSnippet(text, "検索", 20);
      expect(result).toMatch(/^検索キーワード.+…$/);
      expect(result.endsWith("…")).toBe(true);
    });

    it("キーワードが末尾付近にある場合、先頭に省略記号を付加して末尾まで切り出すこと", () => {
      const text =
        "文章の最初には何もなく長い文章が続いたあとにようやく最後のほうで検索キーワードが出現します";
      const result = extractSnippet(text, "検索", 20);
      expect(result.startsWith("…")).toBe(true);
      expect(result).toContain("検索キーワード");
    });

    it("キーワードが中央にある場合、前後に省略記号を付加して切り出すこと", () => {
      const text =
        "前方にかなり長い文章が記述されていてその中間に検索ターゲットの文字が含まれておりさらに後方にも長い文章が続きます";
      const result = extractSnippet(text, "検索ターゲット", 25);
      expect(result.startsWith("…")).toBe(true);
      expect(result.endsWith("…")).toBe(true);
      expect(result).toContain("検索ターゲット");
    });

    it("キーワードの大文字・小文字を区別せずに一致箇所を特定できること", () => {
      const text = "This is a Great Feature for StepNote omnisearch testing.";
      const result = extractSnippet(text, "feature", 20);
      expect(result).toContain("Feature");
    });

    it("改行や連続空白を1つの半角スペースに正規化してスニペットを生成すること", () => {
      const text = "一行目のテキスト\n\n二行目に 検索対象    があり\n三行目へと続く";
      const result = extractSnippet(text, "検索対象", 30);
      expect(result).not.toContain("\n");
      expect(result).not.toContain("    ");
      expect(result).toContain("検索対象");
    });

    it("キーワードが見つからない場合は先頭から maxLength 分を切り出して省略記号を付加すること", () => {
      const text =
        "これは一致しないキーワードのテストで非常に長い文章をテストするためのテキストです。";
      const result = extractSnippet(text, "存在しない", 15);
      expect(result.endsWith("…")).toBe(true);
    });
  });

  describe("2. formatSourceLabel", () => {
    it("task_name の場合は「タスク名」を返すこと", () => {
      expect(formatSourceLabel("task_name")).toBe("タスク名");
    });

    it("task_description の場合は「詳細説明」を返すこと", () => {
      expect(formatSourceLabel("task_description")).toBe("詳細説明");
    });

    it("task_fiscal_year の場合は「年度」を返すこと", () => {
      expect(formatSourceLabel("task_fiscal_year")).toBe("年度");
    });

    it("issue でタイトルがある場合は「課題: [タイトル]」を返すこと", () => {
      expect(formatSourceLabel("issue", "画面崩れ調査")).toBe(
        "課題: 画面崩れ調査",
      );
    });

    it("issue でタイトルがない場合は「課題」を返すこと", () => {
      expect(formatSourceLabel("issue")).toBe("課題");
    });

    it("note の場合は「ノート」を返すこと", () => {
      expect(formatSourceLabel("note")).toBe("ノート");
    });

    it("log の場合は「ログ」を返すこと", () => {
      expect(formatSourceLabel("log")).toBe("ログ");
    });
  });

  describe("3. tokenizeSearchQuery", () => {
    it("半角スペースで区切られた複数の単語を小文字の配列に分割すること", () => {
      const result = tokenizeSearchQuery("UI バグ ログイン");
      expect(result).toEqual(["ui", "バグ", "ログイン"]);
    });

    it("全角スペース（\u3000）で区切られた場合も正しく分割すること", () => {
      const result = tokenizeSearchQuery("全体検索　モーダル　ダイアログ");
      expect(result).toEqual(["全体検索", "モーダル", "ダイアログ"]);
    });

    it("連続する空白や前後の空白を除去し、空文字列を含めないこと", () => {
      const result = tokenizeSearchQuery("   IndexedDB    Dexie　　最適化   ");
      expect(result).toEqual(["indexeddb", "dexie", "最適化"]);
    });

    it("重複するキーワードをユニークに統合すること", () => {
      const result = tokenizeSearchQuery("React react REACT");
      expect(result).toEqual(["react"]);
    });

    it("空文字列または空白のみの場合は空配列を返すこと", () => {
      expect(tokenizeSearchQuery("")).toEqual([]);
      expect(tokenizeSearchQuery("   ")).toEqual([]);
      expect(tokenizeSearchQuery("　　")).toEqual([]);
    });
  });
});
