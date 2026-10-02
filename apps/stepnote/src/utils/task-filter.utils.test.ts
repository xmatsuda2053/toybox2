import { describe, it, expect } from "vitest";
import type { TaskRecord } from "@/db/models/task.model";
import type { QuickAccessRecord } from "@/db/models/navigation.model";
import {
  matchesDueDateFilter,
  matchesStatusFilter,
  applyQuickAccessFilter,
  sortTasksByDueDateAndName,
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
});
