import { describe, it, expect } from "vitest";
import type { NoteRecord } from "@/db/models/journal.model";
import {
  extractNoteTitle,
  filterNotes,
  sortNotesByCreatedAtAsc,
} from "./notes-view.utils";

/**
 * テスト仕様:
 * 1. extractNoteTitle (ノートタイトルの抽出)
 *    - ノート本文の1行目をタイトルとして抽出すること
 *    - 先頭の Markdown 見出し記号 (#, ##, ### 等) を除外してトリミングすること
 *    - 2行目以降のテキストを無視して1行目のみ抽出すること
 *    - 空文字列または空白のみの場合はフォールバック文字列（デフォルト「(無題のメモ)」または「ページ N」）を返すこと
 *    - 特殊文字や連続空白を含む場合も安全に処理すること
 * 2. filterNotes (ノートの検索フィルタリング)
 *    - 検索クエリが空文字または空白のみの場合はすべてのノートを返すこと
 *    - クエリが含まれるタイトルまたは本文を持つノートを大文字小文字無視で抽出すること
 *    - クエリに一致するノートが存在しない場合は空配列を返すこと
 * 3. sortNotesByCreatedAtAsc (ノート作成日時の昇順ソート)
 *    - ノート一覧を作成日時（createdAt）の昇順（古い順）にソートすること
 *    - createdAt が同日時の場合は ID 昇順で安定ソートすること
 */
describe("notes-view.utils", () => {
  describe("extractNoteTitle", () => {
    it("ノート本文の1行目をタイトルとして抽出すること", () => {
      const markdown = "仕様メモのタイトル\n詳細な説明文がここに入ります。";
      expect(extractNoteTitle(markdown)).toBe("仕様メモのタイトル");
    });

    it("先頭の Markdown 見出し記号（#）を除外してトリミングすること", () => {
      expect(extractNoteTitle("# 単一ハッシュ")).toBe("単一ハッシュ");
      expect(extractNoteTitle("## Note")).toBe("Note");
      expect(extractNoteTitle("### 3連ハッシュの小見出し")).toBe("3連ハッシュの小見出し");
      expect(extractNoteTitle("###### 6連ハッシュの見出し")).toBe("6連ハッシュの見出し");
    });

    it("2行目以降のテキストを無視して1行目のみ抽出すること", () => {
      const markdown = "## 議事録 2026-10-17\n- 参加者: A, B\n- 決定事項: なし";
      expect(extractNoteTitle(markdown)).toBe("議事録 2026-10-17");
    });

    it("空文字列または空白のみの場合にフォールバック文字列を返すこと", () => {
      expect(extractNoteTitle("")).toBe("(無題のメモ)");
      expect(extractNoteTitle("   \n\n")).toBe("(無題のメモ)");
      expect(extractNoteTitle("###   ")).toBe("(無題のメモ)");
      expect(extractNoteTitle("", 1)).toBe("ページ 1");
      expect(extractNoteTitle("   ", 3)).toBe("ページ 3");
    });
  });

  describe("filterNotes", () => {
    const sampleNotes: NoteRecord[] = [
      {
        id: 1,
        taskId: 10,
        value: "## 要件定義書\n画面レイアウトおよびデータフローの整理。",
        createdAt: new Date("2026-10-17T10:00:00Z"),
      },
      {
        id: 2,
        taskId: 10,
        value: "## API設計\nRESTful エンドポイントの定義とレスポンス仕様。",
        createdAt: new Date("2026-10-17T11:00:00Z"),
      },
      {
        id: 3,
        taskId: 10,
        value: "## リリースチェックリスト\n本番デプロイ前の動作確認項目。",
        createdAt: new Date("2026-10-17T12:00:00Z"),
      },
    ];

    it("検索クエリが空文字または空白のみの場合はすべてのノートを返すこと", () => {
      expect(filterNotes(sampleNotes, "")).toEqual(sampleNotes);
      expect(filterNotes(sampleNotes, "   ")).toEqual(sampleNotes);
    });

    it("クエリが含まれるタイトルまたは本文を持つノートを大文字小文字無視で抽出すること", () => {
      const resultByTitle = filterNotes(sampleNotes, "要件定義");
      expect(resultByTitle).toHaveLength(1);
      expect(resultByTitle[0].id).toBe(1);

      const resultByBody = filterNotes(sampleNotes, "デプロイ");
      expect(resultByBody).toHaveLength(1);
      expect(resultByBody[0].id).toBe(3);

      const resultIgnoreCase = filterNotes(sampleNotes, "api設計");
      expect(resultIgnoreCase).toHaveLength(1);
      expect(resultIgnoreCase[0].id).toBe(2);
    });

    it("クエリに一致するノートが存在しない場合は空配列を返すこと", () => {
      const result = filterNotes(sampleNotes, "存在しないキーワード");
      expect(result).toHaveLength(0);
    });
  });

  describe("sortNotesByCreatedAtAsc", () => {
    it("ノート一覧を作成日時の昇順（古い順）にソートすること", () => {
      const notes: NoteRecord[] = [
        {
          id: 3,
          taskId: 1,
          value: "3番目のノート",
          createdAt: new Date("2026-10-17T12:00:00Z"),
        },
        {
          id: 1,
          taskId: 1,
          value: "1番目のノート",
          createdAt: new Date("2026-10-17T10:00:00Z"),
        },
        {
          id: 2,
          taskId: 1,
          value: "2番目のノート",
          createdAt: new Date("2026-10-17T11:00:00Z"),
        },
      ];

      const sorted = sortNotesByCreatedAtAsc(notes);
      expect(sorted.map((n) => n.id)).toEqual([1, 2, 3]);
    });

    it("createdAt が同日時の場合は ID 昇順で安定ソートすること", () => {
      const sameDate = new Date("2026-10-17T10:00:00Z");
      const notes: NoteRecord[] = [
        { id: 10, taskId: 1, value: "ID 10", createdAt: sameDate },
        { id: 5, taskId: 1, value: "ID 5", createdAt: sameDate },
        { id: 8, taskId: 1, value: "ID 8", createdAt: sameDate },
      ];

      const sorted = sortNotesByCreatedAtAsc(notes);
      expect(sorted.map((n) => n.id)).toEqual([5, 8, 10]);
    });
  });
});
