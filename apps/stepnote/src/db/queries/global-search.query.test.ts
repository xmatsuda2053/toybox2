/**
 * global-search.query.test.ts
 *
 * 全体検索クエリ（GlobalSearchQuery）の単体テスト
 *
 * 【テスト仕様一覧】
 * 1. 全会計年度・全ステータス横断検索
 *    - 1-1. 過去年度・当年度・完了タスクを含むすべてのタスクからキーワードに合致するものが抽出されること
 *    - 1-2. キーワードが空文字または空白のみの場合は空配列が返ること
 *    - 1-3. 英字の大文字・小文字を区別せずに一致すること
 * 2. 検索対象テーブルとリッチスニペットの生成
 *    - 2-1. task.name に合致する場合、sourceType: "task_name" のスニペットが付与されること
 *    - 2-2. task.description に合致する場合、sourceType: "task_description" のスニペットが付与されること
 *    - 2-3. issue の title / value に合致する場合、親タスクが抽出され sourceType: "issue" のスニペットが付与されること
 *    - 2-4. note の value に合致する場合、親タスクが抽出され sourceType: "note" のスニペットが付与されること
 *    - 2-5. log の value に合致する場合、親タスクが抽出され sourceType: "log" のスニペットが付与されること
 *    - 2-6. 1つのタスクに複数のマッチ要素がある場合、すべてのスニペットが収集されること
 *    - 2-7. log の value がシステムログ（### sys: で始まる文字列）の場合は全体検索の対象外となること
 * 3. 関連ラベル名の解決
 *    - 3-1. labelId に対応するラベル名が labelName として付与されること
 *    - 3-2. labelId が未設定の場合は labelName が undefined であること
 * 4. 複数キーワードによるAND検索
 *    - 4-1. 半角スペース区切りの複数キーワードですべて一致するタスクのみが抽出されること
 *    - 4-2. 全角スペース区切りの複数キーワードでも正しく AND 検索として抽出されること
 *    - 4-3. タスク本体とサブアイテム（issues/notes/logs）にまたがってキーワードが存在する場合も抽出されること
 *    - 4-4. 一部のキーワードしか含まないタスクは除外されること
 * 5. 年度（fiscalYear）による検索
 *    - 5-1. 西暦4桁（例: 2024）で検索した場合、該当年度のタスクが抽出され、sourceType: "task_fiscal_year" のスニペットが付与されること
 *    - 5-2. 「〜年度」（例: 2024年度）で検索した場合も、該当年度のタスクが正しく抽出されること
 *    - 5-3. 年度と他のキーワードを組み合わせたAND検索（例: 2024 要件定義）で、該当年度かつキーワードを満たすタスクのみが抽出されること
 */

import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/db/schema/database.schema";
import type { TaskRecord } from "@/db/models/task.model";
import { GlobalSearchQuery } from "./global-search.query.js";

describe("GlobalSearchQuery Tests", () => {
  let query: GlobalSearchQuery;

  beforeEach(async () => {
    await db.tasks.clear();
    await db.issues.clear();
    await db.logs.clear();
    await db.notes.clear();
    await db.labels.clear();

    query = new GlobalSearchQuery(db);

    // テスト用ラベル
    await db.labels.bulkAdd([
      { id: 1, name: "フロントエンド", description: "UI開発", isSelected: false },
      { id: 2, name: "バックエンド", description: "API開発", isSelected: false },
    ]);

    // 複数年度・複数ステータスのタスク
    const tasks: TaskRecord[] = [
      {
        id: 1,
        name: "全体検索の要件定義",
        description: "全画面から呼び出せるOmnisearchモーダルを検討する",
        dueDate: new Date("2024-05-10"),
        fiscalYear: 2024,
        labelId: 1,
        statusCode: 9, // 完了
        bookmark: false,
        selected: false,
        contacts: [],
        createdAt: new Date("2024-05-01"),
        updatedAt: new Date("2024-05-10"),
      },
      {
        id: 2,
        name: "IndexedDBのインデックス最適化",
        description: "Dexieを用いた全文検索のパフォーマンス向上策",
        dueDate: new Date("2025-06-15"),
        fiscalYear: 2025,
        labelId: 2,
        statusCode: 5, // 対応中
        bookmark: false,
        selected: false,
        contacts: [],
        createdAt: new Date("2025-06-01"),
        updatedAt: new Date("2025-06-02"),
      },
      {
        id: 3,
        name: "UIコンポーネントのテスト作成",
        description: "Web Awesomeのダイアログ共通化",
        dueDate: new Date("2026-07-20"),
        fiscalYear: 2026,
        labelId: 0,
        statusCode: 0, // 未着手
        bookmark: false,
        selected: false,
        contacts: [],
        createdAt: new Date("2026-07-01"),
        updatedAt: new Date("2026-07-01"),
      },
    ];
    await db.tasks.bulkAdd(tasks);

    // サブアイテム
    await db.issues.bulkAdd([
      {
        id: 101,
        taskId: 3,
        statusCode: 0,
        dueDate: new Date("2026-07-20"),
        title: "ダイアログのアニメーション調整",
        value: "キーボードショートカットCtrl+Kのイベント登録を行う",
        createdAt: new Date("2026-07-01"),
        updatedAt: new Date("2026-07-01"),
      },
    ]);

    await db.notes.bulkAdd([
      {
        id: 201,
        taskId: 2,
        value: "Dexieのコレクション操作における注意点メモ",
        createdAt: new Date("2025-06-01"),
        updatedAt: new Date("2025-06-01"),
      },
    ]);

    await db.logs.bulkAdd([
      {
        id: 301,
        taskId: 1,
        value: "顧客との仕様合意ミーティングで要件定義を確定した",
        createdAt: new Date("2024-05-02"),
        updatedAt: new Date("2024-05-02"),
      },
      {
        id: 302,
        taskId: 1,
        value: '### sys: タスク名変更: "旧名称" → "全体検索の要件定義"',
        createdAt: new Date("2024-05-03"),
        updatedAt: new Date("2024-05-03"),
      },
    ]);
  });


  describe("1. 全会計年度・全ステータス横断検索", () => {
    it("1-1. 過去年度・当年度・完了タスクを含むすべてのタスクからキーワードに合致するものが抽出されること", async () => {
      // 2024年度・完了タスク(ID: 1)の description に "Omnisearch" が含まれる
      const results = await query.search("Omnisearch");
      expect(results).toHaveLength(1);
      expect(results[0].task.id).toBe(1);
      expect(results[0].task.fiscalYear).toBe(2024);
      expect(results[0].task.statusCode).toBe(9);
    });

    it("1-2. キーワードが空文字または空白のみの場合は空配列が返ること", async () => {
      expect(await query.search("")).toEqual([]);
      expect(await query.search("   ")).toEqual([]);
    });

    it("1-3. 英字の大文字・小文字を区別せずに一致すること", async () => {
      const results = await query.search("omnisearch");
      expect(results).toHaveLength(1);
      expect(results[0].task.id).toBe(1);
    });
  });

  describe("2. 検索対象テーブルとリッチスニペットの生成", () => {
    it("2-1. task.name に合致する場合、sourceType: 'task_name' のスニペットが付与されること", async () => {
      const results = await query.search("IndexedDB");
      expect(results).toHaveLength(1);
      expect(results[0].task.id).toBe(2);
      const nameSnippet = results[0].snippets.find(
        (s) => s.sourceType === "task_name",
      );
      expect(nameSnippet).toBeDefined();
      expect(nameSnippet?.snippet).toContain("IndexedDB");
    });

    it("2-2. task.description に合致する場合、sourceType: 'task_description' のスニペットが付与されること", async () => {
      const results = await query.search("パフォーマンス");
      expect(results).toHaveLength(1);
      expect(results[0].task.id).toBe(2);
      const descSnippet = results[0].snippets.find(
        (s) => s.sourceType === "task_description",
      );
      expect(descSnippet).toBeDefined();
      expect(descSnippet?.snippet).toContain("パフォーマンス");
    });

    it("2-3. issue の title / value に合致する場合、親タスクが抽出され sourceType: 'issue' のスニペットが付与されること", async () => {
      const results = await query.search("Ctrl+K");
      expect(results).toHaveLength(1);
      expect(results[0].task.id).toBe(3);
      const issueSnippet = results[0].snippets.find(
        (s) => s.sourceType === "issue",
      );
      expect(issueSnippet).toBeDefined();
      expect(issueSnippet?.sourceLabel).toContain("ダイアログのアニメーション調整");
      expect(issueSnippet?.snippet).toContain("Ctrl+K");
    });

    it("2-4. note の value に合致する場合、親タスクが抽出され sourceType: 'note' のスニペットが付与されること", async () => {
      const results = await query.search("注意点メモ");
      expect(results).toHaveLength(1);
      expect(results[0].task.id).toBe(2);
      const noteSnippet = results[0].snippets.find(
        (s) => s.sourceType === "note",
      );
      expect(noteSnippet).toBeDefined();
      expect(noteSnippet?.snippet).toContain("注意点メモ");
    });

    it("2-5. log の value に合致する場合、親タスクが抽出され sourceType: 'log' のスニペットが付与されること", async () => {
      const results = await query.search("仕様合意");
      expect(results).toHaveLength(1);
      expect(results[0].task.id).toBe(1);
      const logSnippet = results[0].snippets.find(
        (s) => s.sourceType === "log",
      );
      expect(logSnippet).toBeDefined();
      expect(logSnippet?.snippet).toContain("仕様合意");
    });

    it("2-6. 1つのタスクに複数のマッチ要素がある場合、すべてのスニペットが収集されること", async () => {
      // タスク2 は name に "最適化"、description に "Dexie"、note に "Dexie" がある
      const results = await query.search("Dexie");
      expect(results).toHaveLength(1);
      expect(results[0].task.id).toBe(2);
      // description と note の両方でマッチ
      expect(results[0].snippets.length).toBeGreaterThanOrEqual(2);
      expect(results[0].snippets.some((s) => s.sourceType === "task_description")).toBe(true);
      expect(results[0].snippets.some((s) => s.sourceType === "note")).toBe(true);
    });

    it("2-7. log の value がシステムログ（### sys: で始まる文字列）の場合は全体検索の対象外となること", async () => {
      // タスク1のログ(ID: 302)に "旧名称" というシステムログがあるが、除外されてヒットしない
      const results = await query.search("旧名称");
      expect(results).toEqual([]);
    });
  });

  describe("3. 関連ラベル名の解決", () => {
    it("3-1. labelId に対応するラベル名が labelName として付与されること", async () => {
      const results = await query.search("IndexedDB");
      expect(results).toHaveLength(1);
      expect(results[0].labelName).toBe("バックエンド");
    });

    it("3-2. labelId が未設定の場合は labelName が undefined であること", async () => {
      const results = await query.search("ダイアログ");
      expect(results).toHaveLength(1);
      expect(results[0].labelName).toBeUndefined();
    });
  });

  describe("4. 複数キーワードによるAND検索", () => {
    it("4-1. 半角スペース区切りの複数キーワードですべて一致するタスクのみが抽出されること", async () => {
      // タスク2: name に "IndexedDB", description に "パフォーマンス"
      const results = await query.search("IndexedDB パフォーマンス");
      expect(results).toHaveLength(1);
      expect(results[0].task.id).toBe(2);
    });

    it("4-2. 全角スペース区切りの複数キーワードでも正しく AND 検索として抽出されること", async () => {
      // タスク1: name に "全体検索"、"要件定義"、description に "Omnisearch"
      const results = await query.search("全体検索　Omnisearch");
      expect(results).toHaveLength(1);
      expect(results[0].task.id).toBe(1);
    });

    it("4-3. タスク本体とサブアイテム（issues/notes/logs）にまたがってキーワードが存在する場合も抽出されること", async () => {
      // タスク3: description に "ダイアログ"、issue に "Ctrl+K"
      const results = await query.search("ダイアログ Ctrl+K");
      expect(results).toHaveLength(1);
      expect(results[0].task.id).toBe(3);
    });

    it("4-4. 一部のキーワードしか含まないタスクは除外されること", async () => {
      // "IndexedDB" はタスク2にあるが、"存在しないワード" はどこにもない
      const results1 = await query.search("IndexedDB 存在しないワード");
      expect(results1).toEqual([]);

      // "Dexie" はタスク2、"Ctrl+K" はタスク3にあるが、単一タスク内に両方は揃っていない
      const results2 = await query.search("Dexie Ctrl+K");
      expect(results2).toEqual([]);
    });
  });

  describe("5. 年度（fiscalYear）による検索", () => {
    it("5-1. 西暦4桁（例: 2024）で検索した場合、該当年度のタスクが抽出され、sourceType: 'task_fiscal_year' のスニペットが付与されること", async () => {
      const results = await query.search("2024");
      expect(results).toHaveLength(1);
      expect(results[0].task.id).toBe(1);
      const yearSnippet = results[0].snippets.find(
        (s) => s.sourceType === "task_fiscal_year",
      );
      expect(yearSnippet).toBeDefined();
      expect(yearSnippet?.snippet).toContain("2024");
    });

    it("5-2. 「〜年度」（例: 2024年度）で検索した場合も、該当年度のタスクが正しく抽出されること", async () => {
      const results = await query.search("2024年度");
      expect(results).toHaveLength(1);
      expect(results[0].task.id).toBe(1);
    });

    it("5-3. 年度と他のキーワードを組み合わせたAND検索（例: 2024 要件定義）で、該当年度かつキーワードを満たすタスクのみが抽出されること", async () => {
      const results = await query.search("2024 要件定義");
      expect(results).toHaveLength(1);
      expect(results[0].task.id).toBe(1);

      // 該当年度でない組み合わせはヒットしない
      const mismatchResults = await query.search("2025 要件定義");
      expect(mismatchResults).toEqual([]);
    });
  });
});
