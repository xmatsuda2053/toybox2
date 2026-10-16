import { describe, it, expect } from "vitest";
import type { IssueRecord, TaskRecord } from "@/db/models/task.model";
import type { QuickAccessRecord } from "@/db/models/navigation.model";
import {
  matchesDueDateFilter,
  matchesStatusFilter,
  applyQuickAccessFilter,
  sortTasksByDueDateAndName,
  sortIssuesByDueDateAndTitle,
  toDueDateTimestamp,
  compareDueDates,
  filterIssuesByKeyword,
  extractIssueTitle,
  parseBulkIssuesInput,
  groupAndSortIssues,
} from "./task-filter.utils";

/**
 * テスト仕様一覧:
 * 1. matchesDueDateFilter
 *    - 期限フィルター条件が未指定の場合は true を返すこと
 *    - isOverdueSelected が有効な場合、期限切れタスクのみ true を返すこと
 *    - isAsapSelected が有効な場合、ASAP（当日）タスクのみ true を返すこと
 *    - isUpcomingSelected が有効な場合、近日（3日以内）タスクのみ true を返すこと
 * 2. matchesStatusFilter
 *    - ステータスフィルター条件が未指定の場合は true を返すこと
 *    - isDoneSelected が false の場合、完了（statusCode=9）タスクで false を返すこと
 *    - isProgressSelected が false の場合、進行中（statusCode=5）タスクで false を返すこと
 *    - isPendingSelected が false の場合、未着手（statusCode=0）タスクで false を返すこと
 * 3. applyQuickAccessFilter
 *    - フィルター条件が空の場合は全タスクを返すこと
 *    - isBookmarkSelected が true の場合、ブックマーク付きタスクのみ抽出すること
 *    - isUncategorizedSelected が true の場合、未分類（labelId 未指定または 0）タスクのみ抽出すること
 *    - 期限フィルターとステータスフィルターの複合条件を正しく判定・除外すること
 * 4. sortTasksByDueDateAndName
 *    - 期限日（dueDate）の昇順で正しくソートされること
 *    - 期限日が同一の場合、タスク名の日本語五十音順で正しくソートされること
 * 5. sortIssuesByDueDateAndTitle
 *    - 期限日（dueDate）の昇順で正しくソートされること
 *    - 期限日が同一の場合、Issueタイトルの日本語五十音順で正しくソートされること
 * 6. filterIssuesByKeyword
 *    - キーワードが空または空白のみの場合、全Issueをそのまま返すこと
 *    - タイトルにキーワードが含まれるIssueを抽出できること（大文字小文字無視）
 *    - 本文（value）にキーワードが含まれるIssueを抽出できること（大文字小文字無視）
 *    - タイトル・本文のいずれにも合致しないIssueは除外されること
 * 7. extractIssueTitle
 *    - Markdown本文の1行目からタイトル文字列を抽出すること
 *    - 先頭の Markdown 見出し記号（# 等）は除外されること
 *    - 空文字または無効値の場合は (無題のIssue) を返すこと
 * 8. parseBulkIssuesInput
 *    - 改行区切りのテキストから1行ずつのタイトル配列を抽出すること
 *    - 空行や空白文字のみの行を除外すること
 *    - 前後の余白（空白）がトリムされること
 *    - 有効な行が存在しない場合は空配列を返すこと
 * 9. groupAndSortIssues
 *    - 未完了Issue（statusCode !== 9）と完了Issue（statusCode === 9）に分離されること
 *    - 未完了・完了のそれぞれの中で期日昇順・五十音順でソートされること
 *    - 該当するIssueが存在しないグループは空配列となること
 */

describe("task-filter.utils", () => {
  const createDummyTask = (
    overrides: Partial<TaskRecord> = {},
  ): TaskRecord => ({
    id: 1,
    fiscalYear: 2026,
    name: "テストタスク",
    statusCode: 0,
    dueDate: new Date("2026-10-15T00:00:00.000Z"),
    bookmark: false,
    labelId: 0,
    contacts: [],
    description: "",
    selected: false,
    ...overrides,
  });

  describe("matchesDueDateFilter", () => {
    it("期限フィルター条件が未指定の場合は true を返すこと", () => {
      const qa: Partial<QuickAccessRecord> = {};
      const date = new Date("2026-10-15T00:00:00.000Z");
      expect(matchesDueDateFilter(date, qa)).toBe(true);
    });

    it("isOverdueSelected が有効な場合、期限切れタスクのみ true を返すこと", () => {
      const qa: Partial<QuickAccessRecord> = { isOverdueSelected: true };
      const pastDate = new Date("2020-01-01T00:00:00.000Z");
      const futureDate = new Date("2099-01-01T00:00:00.000Z");

      expect(matchesDueDateFilter(pastDate, qa)).toBe(true);
      expect(matchesDueDateFilter(futureDate, qa)).toBe(false);
    });

    it("isAsapSelected が有効な場合、ASAP（当日）タスクのみ true を返すこと", () => {
      const qa: Partial<QuickAccessRecord> = { isAsapSelected: true };
      const today = new Date();
      const pastDate = new Date("2020-01-01T00:00:00.000Z");
      const futureDate = new Date("2099-01-01T00:00:00.000Z");

      expect(matchesDueDateFilter(today, qa)).toBe(true);
      expect(matchesDueDateFilter(pastDate, qa)).toBe(false);
      expect(matchesDueDateFilter(futureDate, qa)).toBe(false);
    });

    it("isUpcomingSelected が有効な場合、近日（3日以内）タスクのみ true を返すこと", () => {
      const qa: Partial<QuickAccessRecord> = { isUpcomingSelected: true };
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const farFuture = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      expect(matchesDueDateFilter(tomorrow, qa)).toBe(true);
      expect(matchesDueDateFilter(farFuture, qa)).toBe(false);
    });
  });

  describe("matchesStatusFilter", () => {
    it("ステータスフィルター条件が未指定の場合は true を返すこと", () => {
      const qa: Partial<QuickAccessRecord> = {};
      expect(matchesStatusFilter(0, qa)).toBe(true);
      expect(matchesStatusFilter(5, qa)).toBe(true);
      expect(matchesStatusFilter(9, qa)).toBe(true);
    });

    it("isDoneSelected が false の場合、完了（statusCode=9）タスクで false を返すこと", () => {
      const qa: Partial<QuickAccessRecord> = { isDoneSelected: false };
      expect(matchesStatusFilter(9, qa)).toBe(false);
      expect(matchesStatusFilter(0, qa)).toBe(true);
      expect(matchesStatusFilter(5, qa)).toBe(true);
    });

    it("isProgressSelected が false の場合、進行中（statusCode=5）タスクで false を返すこと", () => {
      const qa: Partial<QuickAccessRecord> = { isProgressSelected: false };
      expect(matchesStatusFilter(5, qa)).toBe(false);
      expect(matchesStatusFilter(0, qa)).toBe(true);
      expect(matchesStatusFilter(9, qa)).toBe(true);
    });

    it("isPendingSelected が false の場合、未着手（statusCode=0）タスクで false を返すこと", () => {
      const qa: Partial<QuickAccessRecord> = { isPendingSelected: false };
      expect(matchesStatusFilter(0, qa)).toBe(false);
      expect(matchesStatusFilter(5, qa)).toBe(true);
      expect(matchesStatusFilter(9, qa)).toBe(true);
    });
  });

  describe("applyQuickAccessFilter", () => {
    it("フィルター条件が空の場合は全タスクを返すこと", () => {
      const tasks = [
        createDummyTask({ id: 1, name: "タスク1" }),
        createDummyTask({ id: 2, name: "タスク2" }),
      ];
      const result = applyQuickAccessFilter(tasks, {});
      expect(result).toHaveLength(2);
    });

    it("isBookmarkSelected が true の場合、ブックマーク付きタスクのみ抽出すること", () => {
      const tasks = [
        createDummyTask({ id: 1, bookmark: true }),
        createDummyTask({ id: 2, bookmark: false }),
      ];
      const result = applyQuickAccessFilter(tasks, {
        isBookmarkSelected: true,
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it("isUncategorizedSelected が true の場合、未分類（labelId 未指定または 0）タスクのみ抽出すること", () => {
      const tasks = [
        createDummyTask({ id: 1, labelId: 0 }),
        createDummyTask({ id: 2, labelId: 0 }),
        createDummyTask({ id: 3, labelId: 10 }),
      ];
      const result = applyQuickAccessFilter(tasks, {
        isUncategorizedSelected: true,
      });
      expect(result).toHaveLength(2);
      expect(result.map((t) => t.id)).toEqual([1, 2]);
    });

    it("期限フィルターとステータスフィルターの複合条件を正しく判定・除外すること", () => {
      const tasks = [
        createDummyTask({
          id: 1,
          statusCode: 9,
          dueDate: new Date("2020-01-01T00:00:00.000Z"),
        }),
        createDummyTask({
          id: 2,
          statusCode: 0,
          dueDate: new Date("2020-01-01T00:00:00.000Z"),
        }),
        createDummyTask({
          id: 3,
          statusCode: 0,
          dueDate: new Date("2099-01-01T00:00:00.000Z"),
        }),
      ];
      // 完了タスクを除外し、期限切れのみ抽出
      const result = applyQuickAccessFilter(tasks, {
        isDoneSelected: false,
        isOverdueSelected: true,
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
    });
  });

  describe("sortTasksByDueDateAndName", () => {
    it("期限日（dueDate）の昇順で正しくソートされること", () => {
      const tasks = [
        createDummyTask({
          id: 1,
          dueDate: new Date("2026-10-20T00:00:00.000Z"),
          name: "A",
        }),
        createDummyTask({
          id: 2,
          dueDate: new Date("2026-10-10T00:00:00.000Z"),
          name: "B",
        }),
        createDummyTask({
          id: 3,
          dueDate: new Date("2026-10-15T00:00:00.000Z"),
          name: "C",
        }),
      ];
      const sorted = sortTasksByDueDateAndName(tasks);
      expect(sorted.map((t) => t.id)).toEqual([2, 3, 1]);
    });

    it("期限日が同一の場合、タスク名の日本語五十音順で正しくソートされること", () => {
      const sameDueDate = new Date("2026-10-15T00:00:00.000Z");
      const tasks = [
        createDummyTask({ id: 1, dueDate: sameDueDate, name: "さとう" }),
        createDummyTask({ id: 2, dueDate: sameDueDate, name: "あさひ" }),
        createDummyTask({ id: 3, dueDate: sameDueDate, name: "かとう" }),
      ];
      const sorted = sortTasksByDueDateAndName(tasks);
      expect(sorted.map((t) => t.id)).toEqual([2, 3, 1]);
    });
  });

  describe("sortIssuesByDueDateAndTitle", () => {
    const createDummyIssue = (
      overrides: Partial<IssueRecord> = {},
    ): IssueRecord => ({
      id: 1,
      taskId: 1,
      statusCode: 0,
      title: "テストIssue",
      value: "",
      dueDate: new Date("2026-10-15T00:00:00.000Z"),
      ...overrides,
    });

    it("期限日（dueDate）の昇順で正しくソートされること", () => {
      const issues = [
        createDummyIssue({
          id: 1,
          dueDate: new Date("2026-10-20T00:00:00.000Z"),
          title: "Issue A",
        }),
        createDummyIssue({
          id: 2,
          dueDate: new Date("2026-10-10T00:00:00.000Z"),
          title: "Issue B",
        }),
        createDummyIssue({
          id: 3,
          dueDate: new Date("2026-10-15T00:00:00.000Z"),
          title: "Issue C",
        }),
      ];
      const sorted = sortIssuesByDueDateAndTitle(issues);
      expect(sorted.map((i) => i.id)).toEqual([2, 3, 1]);
    });

    it("期限日が同一の場合、Issueタイトルの日本語五十音順で正しくソートされること", () => {
      const sameDueDate = new Date("2026-10-15T00:00:00.000Z");
      const issues = [
        createDummyIssue({ id: 1, dueDate: sameDueDate, title: "さとう" }),
        createDummyIssue({ id: 2, dueDate: sameDueDate, title: "あさひ" }),
        createDummyIssue({ id: 3, dueDate: sameDueDate, title: "かとう" }),
      ];
      const sorted = sortIssuesByDueDateAndTitle(issues);
      expect(sorted.map((i) => i.id)).toEqual([2, 3, 1]);
    });
  });

  describe("toDueDateTimestamp", () => {
    it("Date インスタンスから正しいエポックミリ秒を取得できること", () => {
      const date = new Date("2026-10-15T00:00:00.000Z");
      expect(toDueDateTimestamp(date)).toBe(date.getTime());
    });

    it("ISO文字列から正しいエポックミリ秒を取得できること", () => {
      const isoStr = "2026-10-15T00:00:00.000Z";
      expect(toDueDateTimestamp(isoStr)).toBe(new Date(isoStr).getTime());
    });
  });

  describe("compareDueDates", () => {
    it("期限日Aが期限日Bより過去の場合、負の数値を返すこと", () => {
      const past = new Date("2026-10-10T00:00:00.000Z");
      const future = new Date("2026-10-20T00:00:00.000Z");
      expect(compareDueDates(past, future)).toBeLessThan(0);
    });

    it("期限日Aが期限日Bより未来の場合、正の数値を返すこと", () => {
      const past = new Date("2026-10-10T00:00:00.000Z");
      const future = new Date("2026-10-20T00:00:00.000Z");
      expect(compareDueDates(future, past)).toBeGreaterThan(0);
    });

    it("期限日Aと期限日Bが同一の場合、0 を返すこと", () => {
      const dateA = new Date("2026-10-15T00:00:00.000Z");
      const dateB = "2026-10-15T00:00:00.000Z";
      expect(compareDueDates(dateA, dateB)).toBe(0);
    });
  });

  describe("filterIssuesByKeyword", () => {
    const dummyIssues: IssueRecord[] = [
      {
        id: 1,
        taskId: 10,
        title: "API エンドポイント設計",
        value: "REST API の仕様を OpenAPI 形式で記述する",
        statusCode: 0,
        dueDate: new Date("2026-04-15"),
      },
      {
        id: 2,
        taskId: 10,
        title: "UI コンポーネント実装",
        value: "Web Awesome の wa-switch を活用してスイッチを配置",
        statusCode: 5,
        dueDate: new Date("2026-04-20"),
      },
      {
        id: 3,
        taskId: 10,
        title: "単体テスト作成",
        value: "Vitest を使用してユニットテストを実装する",
        statusCode: 9,
        dueDate: new Date("2026-04-25"),
      },
    ];

    it("キーワードが空または空白のみの場合、全Issueをそのまま返すこと", () => {
      expect(filterIssuesByKeyword(dummyIssues, "")).toEqual(dummyIssues);
      expect(filterIssuesByKeyword(dummyIssues, "   ")).toEqual(dummyIssues);
    });

    it("タイトルにキーワードが含まれるIssueを抽出できること（大文字小文字無視）", () => {
      const result = filterIssuesByKeyword(dummyIssues, "api");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);

      const resultJa = filterIssuesByKeyword(dummyIssues, "コンポーネント");
      expect(resultJa).toHaveLength(1);
      expect(resultJa[0].id).toBe(2);
    });

    it("本文（value）にキーワードが含まれるIssueを抽出できること（大文字小文字無視）", () => {
      const result = filterIssuesByKeyword(dummyIssues, "vitest");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(3);

      const resultOpenApi = filterIssuesByKeyword(dummyIssues, "openapi");
      expect(resultOpenApi).toHaveLength(1);
      expect(resultOpenApi[0].id).toBe(1);
    });

    it("タイトル・本文のいずれにも合致しないIssueは除外されること", () => {
      const result = filterIssuesByKeyword(dummyIssues, "該当なしキーワード");
      expect(result).toHaveLength(0);
    });
  });

  describe("extractIssueTitle", () => {
    it("Markdown本文の1行目からタイトル文字列を抽出すること", () => {
      const md = "Issueのタイトル\n\nここから詳細な本文が続きます。";
      expect(extractIssueTitle(md)).toBe("Issueのタイトル");
    });

    it("先頭の Markdown 見出し記号（# 等）は除外されること", () => {
      expect(extractIssueTitle("# メインタイトル\n本文")).toBe("メインタイトル");
      expect(extractIssueTitle("###   スペース付き見出し\n本文")).toBe("スペース付き見出し");
    });

    it("空文字または無効値の場合は (無題のIssue) を返すこと", () => {
      expect(extractIssueTitle("")).toBe("(無題のIssue)");
      expect(extractIssueTitle("   ")).toBe("(無題のIssue)");
      expect(extractIssueTitle("### ")).toBe("(無題のIssue)");
      expect(extractIssueTitle(undefined as unknown as string)).toBe("(無題のIssue)");
    });
  });

  describe("parseBulkIssuesInput", () => {
    it("改行区切りのテキストから1行ずつのタイトル配列を抽出すること", () => {
      const text = "タスク1\nタスク2\nタスク3";
      expect(parseBulkIssuesInput(text)).toEqual(["タスク1", "タスク2", "タスク3"]);
    });

    it("空行や空白文字のみの行を除外すること", () => {
      const text = "タスク1\n\n  \nタスク2\n\nタスク3\n";
      expect(parseBulkIssuesInput(text)).toEqual(["タスク1", "タスク2", "タスク3"]);
    });

    it("前後の余白（空白）がトリムされること", () => {
      const text = "  タスク1  \n\tタスク2\t";
      expect(parseBulkIssuesInput(text)).toEqual(["タスク1", "タスク2"]);
    });

    it("有効な行が存在しない場合は空配列を返すこと", () => {
      expect(parseBulkIssuesInput("")).toEqual([]);
      expect(parseBulkIssuesInput("   \n\n  \t  ")).toEqual([]);
    });
  });

  describe("groupAndSortIssues", () => {
    const mixedIssues: IssueRecord[] = [
      {
        id: 1,
        taskId: 10,
        title: "未完了タスクB",
        value: "",
        statusCode: 0,
        dueDate: new Date("2026-05-10"),
      },
      {
        id: 2,
        taskId: 10,
        title: "完了タスクA",
        value: "",
        statusCode: 9,
        dueDate: new Date("2026-05-02"),
      },
      {
        id: 3,
        taskId: 10,
        title: "未完了タスクA",
        value: "",
        statusCode: 5,
        dueDate: new Date("2026-05-01"),
      },
      {
        id: 4,
        taskId: 10,
        title: "完了タスクB",
        value: "",
        statusCode: 9,
        dueDate: new Date("2026-05-05"),
      },
    ];

    it("未完了Issue（statusCode !== 9）と完了Issue（statusCode === 9）に分離されること", () => {
      const { openIssues, completedIssues } = groupAndSortIssues(mixedIssues);
      expect(openIssues).toHaveLength(2);
      expect(completedIssues).toHaveLength(2);
      expect(openIssues.every((i) => i.statusCode !== 9)).toBe(true);
      expect(completedIssues.every((i) => i.statusCode === 9)).toBe(true);
    });

    it("未完了・完了のそれぞれの中で期日昇順・五十音順でソートされること", () => {
      const { openIssues, completedIssues } = groupAndSortIssues(mixedIssues);
      expect(openIssues.map((i) => i.id)).toEqual([3, 1]); // 5/1 -> 5/10
      expect(completedIssues.map((i) => i.id)).toEqual([2, 4]); // 5/2 -> 5/5
    });

    it("該当するIssueが存在しないグループは空配列となること", () => {
      const allOpen = [mixedIssues[0], mixedIssues[2]];
      const result = groupAndSortIssues(allOpen);
      expect(result.openIssues).toHaveLength(2);
      expect(result.completedIssues).toEqual([]);
    });
  });
});


