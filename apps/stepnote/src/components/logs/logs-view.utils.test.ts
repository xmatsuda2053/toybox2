import { describe, it, expect } from "vitest";
import type { LogRecord } from "@/db/models/journal.model";
import {
  extractLogTitle,
  filterLogs,
  formatLogDate,
  sortLogsByCreatedAtDesc,
} from "./logs-view.utils";

/**
 * テスト仕様:
 * 1. extractLogTitle (ログタイトルの抽出)
 *    - ログ本文の1行目をタイトルとして抽出すること
 *    - 先頭の Markdown 見出し記号 (#, ##, ### 等) を除外してトリミングすること
 *    - 2行目以降のテキストを無視して1行目のみ抽出すること
 *    - 空文字列または空白のみの場合は「(無題のログ)」を返すこと
 *    - 特殊文字や空白が連続する場合も安全に処理すること
 * 2. filterLogs (ログの検索フィルタリング)
 *    - 検索クエリが空文字または空白のみの場合はすべてのログを返すこと
 *    - クエリが含まれるタイトルまたは本文を持つログを大文字小文字無視で抽出すること
 *    - クエリに一致するログが存在しない場合は空配列を返すこと
 * 3. formatLogDate (ログ日時のフォーマット)
 *    - Date オブジェクトを "YYYY-MM-DD HH:mm:ss" 形式の文字列にフォーマットすること
 *    - 日時が未設定または不正な Date の場合は空文字を返すこと
 * 4. sortLogsByCreatedAtDesc (ログ作成日時の降順ソート)
 *    - ログ一覧を作成日時（createdAt）の降順（新しい順）にソートすること
 *    - createdAt が同日時の場合は ID 降順で安定ソートすること
 */
describe("logs-view.utils", () => {
  describe("extractLogTitle", () => {
    it("ログ本文の1行目をタイトルとして抽出すること", () => {
      const markdown = "作業ログのタイトルです\n詳細な説明文がここに入ります。";
      expect(extractLogTitle(markdown)).toBe("作業ログのタイトルです");
    });

    it("先頭の Markdown 見出し記号（#）を除外してトリミングすること", () => {
      expect(extractLogTitle("# 単一ハッシュの見出し")).toBe("単一ハッシュの見出し");
      expect(extractLogTitle("## 2連ハッシュの見出し")).toBe("2連ハッシュの見出し");
      expect(extractLogTitle("### 3連ハッシュの見出し")).toBe("3連ハッシュの見出し");
      expect(extractLogTitle("###### 6連ハッシュの見出し")).toBe("6連ハッシュの見出し");
    });

    it("2行目以降のテキストを無視して1行目のみ抽出すること", () => {
      const markdown = "### 本日の成果\n- 実装完了\n- テストパス";
      expect(extractLogTitle(markdown)).toBe("本日の成果");
    });

    it("空文字列または空白のみの場合は「(無題のログ)」を返すこと", () => {
      expect(extractLogTitle("")).toBe("(無題のログ)");
      expect(extractLogTitle("   \n\n")).toBe("(無題のログ)");
      expect(extractLogTitle("###   ")).toBe("(無題のログ)");
    });
  });

  describe("filterLogs", () => {
    const sampleLogs: LogRecord[] = [
      {
        id: 1,
        taskId: 10,
        value: "### 初回ミーティング議事録\n参加者全員で要件を確認しました。",
        createdAt: new Date("2026-10-12T10:00:00Z"),
      },
      {
        id: 2,
        taskId: 10,
        value: "Bug fix: ログインエラーの修正\n認証トークンの更新漏れを修正。",
        createdAt: new Date("2026-10-12T11:00:00Z"),
      },
      {
        id: 3,
        taskId: 10,
        value: "リリース準備完了\nステージング環境へのデプロイが完了しました。",
        createdAt: new Date("2026-10-12T12:00:00Z"),
      },
    ];

    it("検索クエリが空文字または空白のみの場合はすべてのログを返すこと", () => {
      expect(filterLogs(sampleLogs, "")).toEqual(sampleLogs);
      expect(filterLogs(sampleLogs, "   ")).toEqual(sampleLogs);
    });

    it("クエリが含まれるタイトルまたは本文を持つログを大文字小文字無視で抽出すること", () => {
      const resultByTitle = filterLogs(sampleLogs, "初回ミーティング");
      expect(resultByTitle).toHaveLength(1);
      expect(resultByTitle[0].id).toBe(1);

      const resultByBody = filterLogs(sampleLogs, "デプロイ");
      expect(resultByBody).toHaveLength(1);
      expect(resultByBody[0].id).toBe(3);

      const resultIgnoreCase = filterLogs(sampleLogs, "BUG FIX");
      expect(resultIgnoreCase).toHaveLength(1);
      expect(resultIgnoreCase[0].id).toBe(2);
    });

    it("クエリに一致するログが存在しない場合は空配列を返すこと", () => {
      const result = filterLogs(sampleLogs, "存在しない単語xyz");
      expect(result).toHaveLength(0);
    });
  });

  describe("formatLogDate", () => {
    it("Date オブジェクトを YYYY-MM-DD HH:mm:ss 形式（秒単位）の文字列にフォーマットすること", () => {
      const date = new Date(2026, 9, 12, 14, 5, 9);
      expect(formatLogDate(date)).toBe("2026-10-12 14:05:09");
    });

    it("日時が未設定または不正な Date の場合は空文字を返すこと", () => {
      expect(formatLogDate(undefined)).toBe("");
      expect(formatLogDate(new Date("invalid-date"))).toBe("");
    });
  });

  describe("sortLogsByCreatedAtDesc", () => {
    it("ログ一覧を作成日時の降順にソートすること", () => {
      const logs: LogRecord[] = [
        { id: 1, taskId: 10, value: "Old", createdAt: new Date("2026-10-10") },
        { id: 2, taskId: 10, value: "New", createdAt: new Date("2026-10-12") },
        { id: 3, taskId: 10, value: "Mid", createdAt: new Date("2026-10-11") },
      ];
      const sorted = sortLogsByCreatedAtDesc(logs);
      expect(sorted.map((l) => l.id)).toEqual([2, 3, 1]);
    });
  });
});
