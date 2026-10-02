import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/db/schema/database.schema";
import { TaskListQuery } from "./task-list.query";

/**
 * 【TaskListQuery テスト仕様】
 *
 * 1. 横断検索機能（searchTasks / searchTaskIds）
 *    - 1-1. タスクの name にキーワードが含まれる場合、合致するタスクが抽出されること
 *    - 1-2. タスクの description にキーワードが含まれる場合、合致するタスクが抽出されること
 *    - 1-3. 紐づく issues の title または value にキーワードが含まれる場合、親タスクが抽出されること
 *    - 1-4. 紐づく logs の content にキーワードが含まれる場合、親タスクが抽出されること
 *    - 1-5. 紐づく notes の content にキーワードが含まれる場合、親タスクが抽出されること
 *    - 1-6. 大文字小文字を区別せず部分一致すること
 *    - 1-7. キーワードが空または空白のみの場合、全件抽出されること
 *
 * 2. QuickAccess フィルタリング機能
 *    - 2-1. isBookmarkSelected が true の場合、bookmark が true のタスクのみ抽出されること
 *    - 2-2. isUncategorizedSelected が true の場合、labelId が未分類（undefined または 0）のタスクのみ抽出されること
 *    - 2-3. isOverdueSelected が true の場合、期限切れ（isOverdue）のタスクのみ抽出されること
 *    - 2-4. isAsapSelected が true の場合、期限当日（isAsap）のタスクのみ抽出されること
 *    - 2-5. isUpcomingSelected が true の場合、期限間近（isUpcoming: 3日以内）のタスクのみ抽出されること
 *    - 2-6. isDoneSelected が false の場合、ステータスが完了（statusCode: 9）のタスクが除外されること
 *    - 2-7. isProgressSelected が false の場合、ステータスが対応中（statusCode: 5）のタスクが除外されること
 *    - 2-8. isPendingSelected が false の場合、ステータスが未着手（statusCode: 0）のタスクが除外されること
 *
 * 3. 複合フィルタリングおよびソート
 *    - 3-1. fiscalYear, labelId, QuickAccess, 検索キーワードを同時に指定した場合、全ての条件を満たすタスクのみ抽出されること
 *    - 3-2. 抽出されたタスクが第1キー: dueDate 昇順、第2キー: name 昇順（五十音順）で正しくソートされること
 *
 * 4. QuickAccess タスク件数の集計機能（getQuickAccessTaskCounts）
 *    - 4-1. 対象年度に属するタスクのうち、bookmark が true の件数が正しく集計されること（全ステータス対象）
 *    - 4-2. 対象年度に属するタスクのうち、未分類（labelId が 0 または undefined）の件数が正しく集計されること（全ステータス対象）
 *    - 4-3. 対象年度に属する未完了タスク（対応中・開始待ち）のうち、期限切れ（isOverdue）の件数が正しく集計され、完了タスクは除外されること
 *    - 4-4. 対象年度に属する未完了タスク（対応中・開始待ち）のうち、期限当日（isAsap）の件数が正しく集計され、完了タスクは除外されること
 *    - 4-5. 対象年度に属する未完了タスク（対応中・開始待ち）のうち、期限間近（isWithinAnyDaysBefore 3日以内）の件数が正しく集計され、完了タスクは除外されること
 *    - 4-6. 異なる年度のタスクが混在する場合、指定した年度のタスクのみが集計対象となること
 */
describe("TaskListQuery Tests", () => {
  let query: TaskListQuery;

  // 基準日（テスト実行時の現在日）
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueDate = new Date(today.getTime() - 24 * 60 * 60 * 1000); // 昨日（期限切れ）
  const asapDate = new Date(today.getTime()); // 当日
  const upcomingDate = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000); // 2日後（間近）
  const futureDate = new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000); // 10日後（将来）

  beforeEach(async () => {
    await db.tasks.clear();
    await db.issues.clear();
    await db.logs.clear();
    await db.notes.clear();

    query = new TaskListQuery(db);
  });

  describe("1. 横断検索機能（searchTasks / searchTaskIds）", () => {
    it("1-1. タスクの name にキーワードが含まれる場合、合致するタスクが抽出されること", async () => {
      const id1 = await db.tasks.add({
        name: "要件定義書の作成",
        statusCode: 0,
        dueDate: futureDate,
        contacts: [],
        description: "特記事項なし",
        fiscalYear: 2026,
        labelId: 1,
        bookmark: false,
        selected: false,
      });
      await db.tasks.add({
        name: "画面モックアップ設計",
        statusCode: 0,
        dueDate: futureDate,
        contacts: [],
        description: "特記事項なし",
        fiscalYear: 2026,
        labelId: 1,
        bookmark: false,
        selected: false,
      });

      const results = await query.getFilteredTasks({
        fiscalYear: 2026,
        searchKeyword: "要件定義",
      });

      expect(results.length).toBe(1);
      expect(results[0].id).toBe(id1);
    });

    it("1-2. タスクの description にキーワードが含まれる場合、合致するタスクが抽出されること", async () => {
      const id1 = await db.tasks.add({
        name: "タスクA",
        statusCode: 0,
        dueDate: futureDate,
        contacts: [],
        description: "データベース設計の確認が必要",
        fiscalYear: 2026,
        labelId: 1,
        bookmark: false,
        selected: false,
      });
      await db.tasks.add({
        name: "タスクB",
        statusCode: 0,
        dueDate: futureDate,
        contacts: [],
        description: "UI実装の確認",
        fiscalYear: 2026,
        labelId: 1,
        bookmark: false,
        selected: false,
      });

      const results = await query.getFilteredTasks({
        fiscalYear: 2026,
        searchKeyword: "データベース",
      });

      expect(results.length).toBe(1);
      expect(results[0].id).toBe(id1);
    });

    it("1-3. 紐づく issues の title または value にキーワードが含まれる場合、親タスクが抽出されること", async () => {
      const taskId = await db.tasks.add({
        name: "タスクA",
        statusCode: 0,
        dueDate: futureDate,
        contacts: [],
        description: "特記事項なし",
        fiscalYear: 2026,
        labelId: 1,
        bookmark: false,
        selected: false,
      });
      await db.issues.add({
        taskId,
        statusCode: 0,
        title: "API認証エラーの解消",
        value: "トークンのリフレッシュ処理に不具合あり",
        dueDate: futureDate,
      });

      const results = await query.getFilteredTasks({
        fiscalYear: 2026,
        searchKeyword: "トークン",
      });

      expect(results.length).toBe(1);
      expect(results[0].id).toBe(taskId);
    });

    it("1-4. 紐づく logs の content にキーワードが含まれる場合、親タスクが抽出されること", async () => {
      const taskId = await db.tasks.add({
        name: "タスクA",
        statusCode: 0,
        dueDate: futureDate,
        contacts: [],
        description: "特記事項なし",
        fiscalYear: 2026,
        labelId: 1,
        bookmark: false,
        selected: false,
      });
      await db.logs.add({
        taskId,
        value: "クライアントと打合せ実施、仕様合意完了",
        createdAt: new Date(),
      });

      const results = await query.getFilteredTasks({
        fiscalYear: 2026,
        searchKeyword: "打合せ",
      });

      expect(results.length).toBe(1);
      expect(results[0].id).toBe(taskId);
    });

    it("1-5. 紐づく notes の content にキーワードが含まれる場合、親タスクが抽出されること", async () => {
      const taskId = await db.tasks.add({
        name: "タスクA",
        statusCode: 0,
        dueDate: futureDate,
        contacts: [],
        description: "特記事項なし",
        fiscalYear: 2026,
        labelId: 1,
        bookmark: false,
        selected: false,
      });
      await db.notes.add({
        taskId,
        value: "参考URL: https://example.com/spec",
      });

      const results = await query.getFilteredTasks({
        fiscalYear: 2026,
        searchKeyword: "example.com",
      });

      expect(results.length).toBe(1);
      expect(results[0].id).toBe(taskId);
    });

    it("1-6. 大文字小文字を区別せず部分一致すること", async () => {
      const taskId = await db.tasks.add({
        name: "StepNote Project",
        statusCode: 0,
        dueDate: futureDate,
        contacts: [],
        description: "Frontend Work",
        fiscalYear: 2026,
        labelId: 1,
        bookmark: false,
        selected: false,
      });

      const results = await query.getFilteredTasks({
        fiscalYear: 2026,
        searchKeyword: "stepnote",
      });

      expect(results.length).toBe(1);
      expect(results[0].id).toBe(taskId);
    });

    it("1-7. キーワードが空または空白のみの場合、全件抽出されること", async () => {
      await db.tasks.add({
        name: "タスク1",
        statusCode: 0,
        dueDate: futureDate,
        contacts: [],
        description: "",
        fiscalYear: 2026,
        labelId: 1,
        bookmark: false,
        selected: false,
      });
      await db.tasks.add({
        name: "タスク2",
        statusCode: 0,
        dueDate: futureDate,
        contacts: [],
        description: "",
        fiscalYear: 2026,
        labelId: 1,
        bookmark: false,
        selected: false,
      });

      const results = await query.getFilteredTasks({
        fiscalYear: 2026,
        searchKeyword: "   ",
      });

      expect(results.length).toBe(2);
    });
  });

  describe("2. QuickAccess フィルタリング機能", () => {
    it("2-1. isBookmarkSelected が true の場合、bookmark が true のタスクのみ抽出されること", async () => {
      const id1 = await db.tasks.add({
        name: "ブックマーク済みタスク",
        statusCode: 0,
        dueDate: futureDate,
        contacts: [],
        description: "",
        fiscalYear: 2026,
        labelId: 1,
        bookmark: true,
        selected: false,
      });
      await db.tasks.add({
        name: "通常タスク",
        statusCode: 0,
        dueDate: futureDate,
        contacts: [],
        description: "",
        fiscalYear: 2026,
        labelId: 1,
        bookmark: false,
        selected: false,
      });

      const results = await query.getFilteredTasks({
        fiscalYear: 2026,
        quickAccess: { isBookmarkSelected: true },
      });

      expect(results.length).toBe(1);
      expect(results[0].id).toBe(id1);
    });

    it("2-2. isUncategorizedSelected が true の場合、labelId が未分類（undefined または 0）のタスクのみ抽出されること", async () => {
      const id1 = await db.tasks.add({
        name: "未分類タスク",
        statusCode: 0,
        dueDate: futureDate,
        contacts: [],
        description: "",
        fiscalYear: 2026,
        labelId: 0,
        bookmark: false,
        selected: false,
      });
      await db.tasks.add({
        name: "分類済みタスク",
        statusCode: 0,
        dueDate: futureDate,
        contacts: [],
        description: "",
        fiscalYear: 2026,
        labelId: 2,
        bookmark: false,
        selected: false,
      });

      const results = await query.getFilteredTasks({
        fiscalYear: 2026,
        quickAccess: { isUncategorizedSelected: true },
      });

      expect(results.length).toBe(1);
      expect(results[0].id).toBe(id1);
    });

    it("2-3. isOverdueSelected が true の場合、期限切れ（isOverdue）のタスクのみ抽出されること", async () => {
      const idOverdue = await db.tasks.add({
        name: "期限切れタスク",
        statusCode: 0,
        dueDate: overdueDate,
        contacts: [],
        description: "",
        fiscalYear: 2026,
        labelId: 1,
        bookmark: false,
        selected: false,
      });
      await db.tasks.add({
        name: "将来タスク",
        statusCode: 0,
        dueDate: futureDate,
        contacts: [],
        description: "",
        fiscalYear: 2026,
        labelId: 1,
        bookmark: false,
        selected: false,
      });

      const results = await query.getFilteredTasks({
        fiscalYear: 2026,
        quickAccess: { isOverdueSelected: true },
      });

      expect(results.length).toBe(1);
      expect(results[0].id).toBe(idOverdue);
    });

    it("2-4. isAsapSelected が true の場合、期限当日（isAsap）のタスクのみ抽出されること", async () => {
      const idAsap = await db.tasks.add({
        name: "当日タスク",
        statusCode: 0,
        dueDate: asapDate,
        contacts: [],
        description: "",
        fiscalYear: 2026,
        labelId: 1,
        bookmark: false,
        selected: false,
      });
      await db.tasks.add({
        name: "将来タスク",
        statusCode: 0,
        dueDate: futureDate,
        contacts: [],
        description: "",
        fiscalYear: 2026,
        labelId: 1,
        bookmark: false,
        selected: false,
      });

      const results = await query.getFilteredTasks({
        fiscalYear: 2026,
        quickAccess: { isAsapSelected: true },
      });

      expect(results.length).toBe(1);
      expect(results[0].id).toBe(idAsap);
    });

    it("2-5. isUpcomingSelected が true の場合、期限間近（isUpcoming: 3日以内）のタスクのみ抽出されること", async () => {
      const idUpcoming = await db.tasks.add({
        name: "間近タスク",
        statusCode: 0,
        dueDate: upcomingDate,
        contacts: [],
        description: "",
        fiscalYear: 2026,
        labelId: 1,
        bookmark: false,
        selected: false,
      });
      await db.tasks.add({
        name: "将来タスク",
        statusCode: 0,
        dueDate: futureDate,
        contacts: [],
        description: "",
        fiscalYear: 2026,
        labelId: 1,
        bookmark: false,
        selected: false,
      });

      const results = await query.getFilteredTasks({
        fiscalYear: 2026,
        quickAccess: { isUpcomingSelected: true },
      });

      expect(results.length).toBe(1);
      expect(results[0].id).toBe(idUpcoming);
    });

    it("2-6. isDoneSelected が false の場合、ステータスが完了（statusCode: 9）のタスクが除外されること", async () => {
      await db.tasks.add({
        name: "完了タスク",
        statusCode: 9,
        dueDate: futureDate,
        contacts: [],
        description: "",
        fiscalYear: 2026,
        labelId: 1,
        bookmark: false,
        selected: false,
      });
      const idProgress = await db.tasks.add({
        name: "対応中タスク",
        statusCode: 5,
        dueDate: futureDate,
        contacts: [],
        description: "",
        fiscalYear: 2026,
        labelId: 1,
        bookmark: false,
        selected: false,
      });

      const results = await query.getFilteredTasks({
        fiscalYear: 2026,
        quickAccess: { isDoneSelected: false, isProgressSelected: true, isPendingSelected: true },
      });

      expect(results.length).toBe(1);
      expect(results[0].id).toBe(idProgress);
    });

    it("2-7. isProgressSelected が false の場合、ステータスが対応中（statusCode: 5）のタスクが除外されること", async () => {
      await db.tasks.add({
        name: "対応中タスク",
        statusCode: 5,
        dueDate: futureDate,
        contacts: [],
        description: "",
        fiscalYear: 2026,
        labelId: 1,
        bookmark: false,
        selected: false,
      });
      const idPending = await db.tasks.add({
        name: "未着手タスク",
        statusCode: 0,
        dueDate: futureDate,
        contacts: [],
        description: "",
        fiscalYear: 2026,
        labelId: 1,
        bookmark: false,
        selected: false,
      });

      const results = await query.getFilteredTasks({
        fiscalYear: 2026,
        quickAccess: { isDoneSelected: true, isProgressSelected: false, isPendingSelected: true },
      });

      expect(results.length).toBe(1);
      expect(results[0].id).toBe(idPending);
    });

    it("2-8. isPendingSelected が false の場合、ステータスが未着手（statusCode: 0）のタスクが除外されること", async () => {
      await db.tasks.add({
        name: "未着手タスク",
        statusCode: 0,
        dueDate: futureDate,
        contacts: [],
        description: "",
        fiscalYear: 2026,
        labelId: 1,
        bookmark: false,
        selected: false,
      });
      const idDone = await db.tasks.add({
        name: "完了タスク",
        statusCode: 9,
        dueDate: futureDate,
        contacts: [],
        description: "",
        fiscalYear: 2026,
        labelId: 1,
        bookmark: false,
        selected: false,
      });

      const results = await query.getFilteredTasks({
        fiscalYear: 2026,
        quickAccess: { isDoneSelected: true, isProgressSelected: true, isPendingSelected: false },
      });

      expect(results.length).toBe(1);
      expect(results[0].id).toBe(idDone);
    });
  });

  describe("3. 複合フィルタリングおよびソート", () => {
    it("3-1. fiscalYear, labelId, QuickAccess, 検索キーワードを同時に指定した場合、全ての条件を満たすタスクのみ抽出されること", async () => {
      const matchId = await db.tasks.add({
        name: "本命タスク（重要開発）",
        statusCode: 5,
        dueDate: upcomingDate,
        contacts: [],
        description: "マッチするタスク",
        fiscalYear: 2026,
        labelId: 10,
        bookmark: true,
        selected: false,
      });

      // 年度違い
      await db.tasks.add({
        name: "他年度タスク（重要開発）",
        statusCode: 5,
        dueDate: upcomingDate,
        contacts: [],
        description: "マッチしない",
        fiscalYear: 2025,
        labelId: 10,
        bookmark: true,
        selected: false,
      });

      // ラベル違い
      await db.tasks.add({
        name: "他ラベルタスク（重要開発）",
        statusCode: 5,
        dueDate: upcomingDate,
        contacts: [],
        description: "マッチしない",
        fiscalYear: 2026,
        labelId: 99,
        bookmark: true,
        selected: false,
      });

      // ブックマークなし
      await db.tasks.add({
        name: "非ブックマーク（重要開発）",
        statusCode: 5,
        dueDate: upcomingDate,
        contacts: [],
        description: "マッチしない",
        fiscalYear: 2026,
        labelId: 10,
        bookmark: false,
        selected: false,
      });

      // キーワード不一致
      await db.tasks.add({
        name: "別件タスク",
        statusCode: 5,
        dueDate: upcomingDate,
        contacts: [],
        description: "マッチしない",
        fiscalYear: 2026,
        labelId: 10,
        bookmark: true,
        selected: false,
      });

      const results = await query.getFilteredTasks({
        fiscalYear: 2026,
        labelId: 10,
        quickAccess: { isBookmarkSelected: true },
        searchKeyword: "重要開発",
      });

      expect(results.length).toBe(1);
      expect(results[0].id).toBe(matchId);
    });

    it("3-2. 抽出されたタスクが第1キー: dueDate 昇順、第2キー: name 昇順（五十音順）で正しくソートされること", async () => {
      const date1 = new Date("2026-05-01");
      const date2 = new Date("2026-06-01");

      const t1 = await db.tasks.add({
        name: "いタスク",
        statusCode: 0,
        dueDate: date1,
        contacts: [],
        description: "",
        fiscalYear: 2026,
        labelId: 1,
        bookmark: false,
        selected: false,
      });
      const t2 = await db.tasks.add({
        name: "あタスク",
        statusCode: 0,
        dueDate: date1,
        contacts: [],
        description: "",
        fiscalYear: 2026,
        labelId: 1,
        bookmark: false,
        selected: false,
      });
      const t3 = await db.tasks.add({
        name: "かタスク",
        statusCode: 0,
        dueDate: date2,
        contacts: [],
        description: "",
        fiscalYear: 2026,
        labelId: 1,
        bookmark: false,
        selected: false,
      });

      const results = await query.getFilteredTasks({ fiscalYear: 2026 });

      expect(results.length).toBe(3);
      // date1 で名前昇順: "あタスク" (t2) -> "いタスク" (t1)
      expect(results[0].id).toBe(t2);
      expect(results[1].id).toBe(t1);
      // date2: "かタスク" (t3)
      expect(results[2].id).toBe(t3);
    });
  });

  describe("4. QuickAccess タスク件数の集計機能（getQuickAccessTaskCounts）", () => {
    it("4-1. 対象年度に属するタスクのうち、bookmark が true の件数が正しく集計されること（全ステータス対象）", async () => {
      await db.tasks.bulkAdd([
        {
          name: "未着手・ブックマークあり",
          statusCode: 0,
          dueDate: futureDate,
          contacts: [],
          description: "",
          fiscalYear: 2026,
          labelId: 1,
          bookmark: true,
          selected: false,
        },
        {
          name: "完了・ブックマークあり",
          statusCode: 9,
          dueDate: futureDate,
          contacts: [],
          description: "",
          fiscalYear: 2026,
          labelId: 1,
          bookmark: true,
          selected: false,
        },
        {
          name: "未着手・ブックマークなし",
          statusCode: 0,
          dueDate: futureDate,
          contacts: [],
          description: "",
          fiscalYear: 2026,
          labelId: 1,
          bookmark: false,
          selected: false,
        },
      ]);

      const counts = await query.getQuickAccessTaskCounts(2026);
      expect(counts.bookmark).toBe(2);
    });

    it("4-2. 対象年度に属するタスクのうち、未分類（labelId が 0 または undefined）の件数が正しく集計されること（全ステータス対象）", async () => {
      await db.tasks.bulkAdd([
        {
          name: "未分類タスク（labelId: 0）",
          statusCode: 0,
          dueDate: futureDate,
          contacts: [],
          description: "",
          fiscalYear: 2026,
          labelId: 0,
          bookmark: false,
          selected: false,
        },
        {
          name: "未分類タスク（完了・labelId: 0）",
          statusCode: 9,
          dueDate: futureDate,
          contacts: [],
          description: "",
          fiscalYear: 2026,
          labelId: 0,
          bookmark: false,
          selected: false,
        },
        {
          name: "分類済みタスク（labelId: 2）",
          statusCode: 0,
          dueDate: futureDate,
          contacts: [],
          description: "",
          fiscalYear: 2026,
          labelId: 2,
          bookmark: false,
          selected: false,
        },
      ]);

      const counts = await query.getQuickAccessTaskCounts(2026);
      expect(counts.uncategorized).toBe(2);
    });

    it("4-3. 対象年度に属する未完了タスク（対応中・開始待ち）のうち、期限切れ（isOverdue）の件数が正しく集計され、完了タスクは除外されること", async () => {
      await db.tasks.bulkAdd([
        {
          name: "期限切れ（未着手）",
          statusCode: 0,
          dueDate: overdueDate,
          contacts: [],
          description: "",
          fiscalYear: 2026,
          labelId: 1,
          bookmark: false,
          selected: false,
        },
        {
          name: "期限切れ（対応中）",
          statusCode: 5,
          dueDate: overdueDate,
          contacts: [],
          description: "",
          fiscalYear: 2026,
          labelId: 1,
          bookmark: false,
          selected: false,
        },
        {
          name: "期限切れ（完了：除外対象）",
          statusCode: 9,
          dueDate: overdueDate,
          contacts: [],
          description: "",
          fiscalYear: 2026,
          labelId: 1,
          bookmark: false,
          selected: false,
        },
        {
          name: "期限内（未着手）",
          statusCode: 0,
          dueDate: futureDate,
          contacts: [],
          description: "",
          fiscalYear: 2026,
          labelId: 1,
          bookmark: false,
          selected: false,
        },
      ]);

      const counts = await query.getQuickAccessTaskCounts(2026);
      expect(counts.overdue).toBe(2);
    });

    it("4-4. 対象年度に属する未完了タスク（対応中・開始待ち）のうち、期限当日（isAsap）の件数が正しく集計され、完了タスクは除外されること", async () => {
      await db.tasks.bulkAdd([
        {
          name: "期限当日（未着手）",
          statusCode: 0,
          dueDate: asapDate,
          contacts: [],
          description: "",
          fiscalYear: 2026,
          labelId: 1,
          bookmark: false,
          selected: false,
        },
        {
          name: "期限当日（対応中）",
          statusCode: 5,
          dueDate: asapDate,
          contacts: [],
          description: "",
          fiscalYear: 2026,
          labelId: 1,
          bookmark: false,
          selected: false,
        },
        {
          name: "期限当日（完了：除外対象）",
          statusCode: 9,
          dueDate: asapDate,
          contacts: [],
          description: "",
          fiscalYear: 2026,
          labelId: 1,
          bookmark: false,
          selected: false,
        },
        {
          name: "将来タスク（未着手）",
          statusCode: 0,
          dueDate: futureDate,
          contacts: [],
          description: "",
          fiscalYear: 2026,
          labelId: 1,
          bookmark: false,
          selected: false,
        },
      ]);

      const counts = await query.getQuickAccessTaskCounts(2026);
      expect(counts.asap).toBe(2);
    });

    it("4-5. 対象年度に属する未完了タスク（対応中・開始待ち）のうち、期限間近（isWithinAnyDaysBefore 3日以内）の件数が正しく集計され、完了タスクは除外されること", async () => {
      await db.tasks.bulkAdd([
        {
          name: "期限間近（未着手）",
          statusCode: 0,
          dueDate: upcomingDate,
          contacts: [],
          description: "",
          fiscalYear: 2026,
          labelId: 1,
          bookmark: false,
          selected: false,
        },
        {
          name: "期限間近（対応中）",
          statusCode: 5,
          dueDate: upcomingDate,
          contacts: [],
          description: "",
          fiscalYear: 2026,
          labelId: 1,
          bookmark: false,
          selected: false,
        },
        {
          name: "期限間近（完了：除外対象）",
          statusCode: 9,
          dueDate: upcomingDate,
          contacts: [],
          description: "",
          fiscalYear: 2026,
          labelId: 1,
          bookmark: false,
          selected: false,
        },
        {
          name: "遠い将来タスク（10日後）",
          statusCode: 0,
          dueDate: futureDate,
          contacts: [],
          description: "",
          fiscalYear: 2026,
          labelId: 1,
          bookmark: false,
          selected: false,
        },
      ]);

      const counts = await query.getQuickAccessTaskCounts(2026);
      expect(counts.upcoming).toBe(2);
    });

    it("4-6. 異なる年度のタスクが混在する場合、指定した年度のタスクのみが集計対象となること", async () => {
      await db.tasks.bulkAdd([
        {
          name: "2026年度タスク",
          statusCode: 0,
          dueDate: overdueDate,
          contacts: [],
          description: "",
          fiscalYear: 2026,
          labelId: 0,
          bookmark: true,
          selected: false,
        },
        {
          name: "2025年度タスク（集計対象外）",
          statusCode: 0,
          dueDate: overdueDate,
          contacts: [],
          description: "",
          fiscalYear: 2025,
          labelId: 0,
          bookmark: true,
          selected: false,
        },
      ]);

      const counts = await query.getQuickAccessTaskCounts(2026);
      expect(counts.bookmark).toBe(1);
      expect(counts.uncategorized).toBe(1);
      expect(counts.overdue).toBe(1);
    });
  });
});
