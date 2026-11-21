import { describe, it, expect } from "vitest";
import type { TaskRecord, IssueRecord } from "@/db/models/task.model";
import type { TagRecord } from "@/db/models/tag.model";
import type { TaskTableRowViewModel } from "@/types";
import {
  formatContactsSummary,
  buildTaskIssueCountMap,
  extractAvailableFiscalYears,
  filterTaskTableRows,
  sortTaskTableRows,
  normalizeTaskTableSortState,
  normalizeTaskTableFiscalYear,
} from "./task-table.utils.js";

/**
 * 【task-table.utils 仕様 (タスク一覧表示モード 純粋ロジック)】
 *
 * 1. 関係者表示サマリー整形（formatContactsSummary）
 *    - 1-1. 空配列または未定義の場合は "-" を返すこと
 *    - 1-2. 1件の場合は先頭関係者の氏名をそのまま返すこと
 *    - 1-3. 複数件の場合は「先頭氏名 +残件数」形式で返すこと
 *
 * 2. Issue集計マップ構築（buildTaskIssueCountMap）
 *    - 2-1. タスクごとの完了数・総数および未完了Issueの最優先期限ステータスが集計されること
 *
 * 3. 会計年度選択肢抽出（extractAvailableFiscalYears）
 *    - 3-1. タスクに含まれる年度と当年度を重複なく降順で返すこと
 *
 * 4. 複合フィルタリング（filterTaskTableRows）
 *    - 4-1. 会計年度・ステータス・ラベル（未分類含む）・タグ・期限状況・キーワードの複合条件で絞り込めること
 *    - 4-2. 期限状況フィルタ適用時、完了（statusCode=9）のタスクは除外されること
 *    - 4-3. matchedKeywordTaskIds が渡された場合、そのIDセットに基づいてキーワード絞り込みが行われること
 *
 * 5. 列別ソート（sortTaskTableRows）
 *    - 5-1. id / status / label / name / dueDate / issues の各キーについて昇順・降順で正しく並び替えられること
 *
 * 6. 永続化値正規化（normalizeTaskTableSortState / normalizeTaskTableFiscalYear）
 *    - 6-1. 不正な保存値に対してデフォルト値へ安全にフォールバックすること
 */

const createTask = (overrides: Partial<TaskRecord> = {}): TaskRecord => ({
  id: 1,
  statusCode: 0,
  name: "タスクA",
  dueDate: new Date("2026-05-10T00:00:00.000Z"),
  contacts: [],
  description: "",
  fiscalYear: 2026,
  labelId: 1,
  bookmark: false,
  selected: false,
  tagIds: [],
  ...overrides,
});

const createRow = (
  taskOverrides: Partial<TaskRecord> = {},
  rowOverrides: Partial<Omit<TaskTableRowViewModel, "task">> = {},
): TaskTableRowViewModel => ({
  task: createTask(taskOverrides),
  labelName: "開発",
  tags: [],
  issuesDone: 0,
  issuesTotal: 0,
  issuesDueInfo: null,
  taskDueInfo: null,
  ...rowOverrides,
});

describe("task-table.utils", () => {
  describe("1. formatContactsSummary", () => {
    it("1-1. 空配列または未定義の場合は '-' を返すこと", () => {
      expect(formatContactsSummary(undefined)).toBe("-");
      expect(formatContactsSummary([])).toBe("-");
    });

    it("1-2. 1件の場合は先頭関係者の氏名をそのまま返すこと", () => {
      expect(
        formatContactsSummary([{ div: "開発部", name: "山田 太郎", tel: "" }]),
      ).toBe("山田 太郎");
    });

    it("1-3. 複数件の場合は「先頭氏名 +残件数」形式で返すこと", () => {
      expect(
        formatContactsSummary([
          { div: "開発部", name: "山田 太郎", tel: "" },
          { div: "営業部", name: "佐藤 花子", tel: "" },
          { div: "総務部", name: "鈴木 一郎", tel: "" },
        ]),
      ).toBe("山田 太郎 +2");
    });
  });

  describe("2. buildTaskIssueCountMap", () => {
    it("2-1. タスクごとの完了数・総数および未完了Issueの最優先期限ステータスが集計されること", () => {
      const tasks = [createTask({ id: 10 }), createTask({ id: 20 })];
      const pastDate = new Date("2020-01-01T00:00:00.000Z");
      const issues: IssueRecord[] = [
        { id: 1, taskId: 10, statusCode: 9, title: "完了", value: "" },
        {
          id: 2,
          taskId: 10,
          statusCode: 5,
          title: "期限切れ",
          value: "",
          dueDate: pastDate,
        },
        { id: 3, taskId: 20, statusCode: 0, title: "未完了", value: "" },
      ];

      const map = buildTaskIssueCountMap(tasks, issues);
      expect(map.get(10)).toEqual({
        done: 1,
        total: 2,
        dueIconInfo: { icon: "fire-solid-full", status: "overdue" },
      });
      expect(map.get(20)).toEqual({
        done: 0,
        total: 1,
      });
    });
  });

  describe("3. extractAvailableFiscalYears", () => {
    it("3-1. タスクに含まれる年度と当年度を重複なく降順で返すこと", () => {
      const tasks = [
        createTask({ fiscalYear: 2024 }),
        createTask({ fiscalYear: 2026 }),
        createTask({ fiscalYear: 2024 }),
      ];
      expect(extractAvailableFiscalYears(tasks, 2025)).toEqual([
        2026, 2025, 2024,
      ]);
    });
  });

  describe("4. filterTaskTableRows", () => {
    const tagA: TagRecord = {
      id: 100,
      name: "重要",
      description: "",
      variant: "brand",
    };
    const tagB: TagRecord = {
      id: 200,
      name: "レビュー",
      description: "",
      variant: "neutral",
    };
    const rows: TaskTableRowViewModel[] = [
      createRow(
        {
          id: 1,
          fiscalYear: 2025,
          statusCode: 5,
          labelId: 1,
          tagIds: [100],
          name: "API設計",
          dueDate: new Date("2020-01-01T00:00:00.000Z"),
        },
        { labelName: "開発", tags: [tagA] },
      ),
      createRow(
        {
          id: 2,
          fiscalYear: 2026,
          statusCode: 9,
          labelId: 0,
          tagIds: [200],
          name: "完了タスク",
          dueDate: new Date("2020-01-01T00:00:00.000Z"),
        },
        { labelName: "", tags: [tagB] },
      ),
      createRow(
        {
          id: 3,
          fiscalYear: 2026,
          statusCode: 0,
          labelId: 2,
          tagIds: [100, 200],
          name: "UI実装",
          dueDate: new Date("2099-12-31T00:00:00.000Z"),
        },
        { labelName: "デザイン", tags: [tagA, tagB] },
      ),
    ];

    it("4-1. 会計年度・ステータス・ラベル（未分類含む）・タグ・キーワードの複合条件で絞り込めること", () => {
      expect(
        filterTaskTableRows(rows, {
          fiscalYear: 2026,
          keyword: "",
          statusCode: "all",
          labelId: "uncategorized",
          tagId: 200,
          dueFilter: "all",
        }).map((r) => r.task.id),
      ).toEqual([2]);

      expect(
        filterTaskTableRows(rows, {
          fiscalYear: "all",
          keyword: "",
          statusCode: 0,
          labelId: 2,
          tagId: 100,
          dueFilter: "all",
        }).map((r) => r.task.id),
      ).toEqual([3]);
    });

    it("4-2. 期限状況フィルタ適用時、完了（statusCode=9）のタスクは除外されること", () => {
      const result = filterTaskTableRows(rows, {
        fiscalYear: "all",
        keyword: "",
        statusCode: "all",
        labelId: "all",
        tagId: "all",
        dueFilter: "overdue",
      });
      expect(result.map((r) => r.task.id)).toEqual([1]);
    });

    it("4-3. matchedKeywordTaskIds が渡された場合、そのIDセットに基づいてキーワード絞り込みが行われること", () => {
      const result = filterTaskTableRows(
        rows,
        {
          fiscalYear: "all",
          keyword: "設計メモ",
          statusCode: "all",
          labelId: "all",
          tagId: "all",
          dueFilter: "all",
        },
        new Set([3]),
      );
      expect(result.map((r) => r.task.id)).toEqual([3]);
    });
  });

  describe("5. sortTaskTableRows", () => {
    const rows: TaskTableRowViewModel[] = [
      createRow(
        {
          id: 2,
          statusCode: 5,
          name: "タスク2",
          dueDate: new Date("2026-06-01T00:00:00.000Z"),
        },
        { labelName: "B企画", issuesDone: 1, issuesTotal: 2 },
      ),
      createRow(
        {
          id: 1,
          statusCode: 9,
          name: "タスク10",
          dueDate: new Date("2026-05-01T00:00:00.000Z"),
        },
        { labelName: "A開発", issuesDone: 2, issuesTotal: 2 },
      ),
      createRow(
        {
          id: 3,
          statusCode: 0,
          name: "タスク1",
          dueDate: new Date("2026-07-01T00:00:00.000Z"),
        },
        { labelName: "C運用", issuesDone: 0, issuesTotal: 0 },
      ),
    ];

    it("5-1. 各列キーについて昇順・降順で正しく並び替えられること", () => {
      expect(
        sortTaskTableRows(rows, { key: "id", direction: "asc" }).map(
          (r) => r.task.id,
        ),
      ).toEqual([1, 2, 3]);
      expect(
        sortTaskTableRows(rows, { key: "id", direction: "desc" }).map(
          (r) => r.task.id,
        ),
      ).toEqual([3, 2, 1]);
      expect(
        sortTaskTableRows(rows, { key: "status", direction: "asc" }).map(
          (r) => r.task.id,
        ),
      ).toEqual([3, 2, 1]);
      expect(
        sortTaskTableRows(rows, { key: "label", direction: "asc" }).map(
          (r) => r.task.id,
        ),
      ).toEqual([1, 2, 3]);
      expect(
        sortTaskTableRows(rows, { key: "name", direction: "asc" }).map(
          (r) => r.task.id,
        ),
      ).toEqual([3, 2, 1]);
      expect(
        sortTaskTableRows(rows, { key: "dueDate", direction: "asc" }).map(
          (r) => r.task.id,
        ),
      ).toEqual([1, 2, 3]);
      expect(
        sortTaskTableRows(rows, { key: "issues", direction: "desc" }).map(
          (r) => r.task.id,
        ),
      ).toEqual([1, 2, 3]);
    });
  });

  describe("6. 永続化値正規化", () => {
    it("6-1. 不正な保存値に対してデフォルト値へ安全にフォールバックすること", () => {
      expect(normalizeTaskTableSortState(null)).toEqual({
        key: "dueDate",
        direction: "asc",
      });
      expect(
        normalizeTaskTableSortState('{"key":"invalid","direction":"asc"}'),
      ).toEqual({
        key: "dueDate",
        direction: "asc",
      });
      expect(
        normalizeTaskTableSortState('{"key":"id","direction":"desc"}'),
      ).toEqual({
        key: "id",
        direction: "desc",
      });

      expect(normalizeTaskTableFiscalYear(null)).toBe("all");
      expect(normalizeTaskTableFiscalYear("all")).toBe("all");
      expect(normalizeTaskTableFiscalYear("2025")).toBe(2025);
      expect(normalizeTaskTableFiscalYear("abc")).toBe("all");
    });
  });
});
