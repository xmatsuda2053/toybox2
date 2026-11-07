import { describe, it, expect } from "vitest";
import type { TaskHistoryItem } from "../types/domain/task-history.type.js";
import {
  recordTaskHistory,
  cleanTaskHistory,
  parseTaskHistory,
  parseMaxCount,
  clampMaxCount,
  buildTaskHistoryViewItems,
} from "./task-history.utils.js";
import type { TaskRecord } from "../db/models/task.model.js";
import type { LabelRecord } from "../db/models/navigation.model.js";

/**
 * テスト仕様一覧 (task-history.utils.test.ts):
 *
 * 1. recordTaskHistory
 *    - 履歴が空の場合、新規アイテムを先頭に追加すること
 *    - 異なるタスクを連続で追加した場合、常に最新のタスクが先頭に追加されること
 *    - 既に履歴に存在するタスクを追加した場合、既存位置から削除されて最新日時で先頭に移動すること（LRU）
 *    - maxCount を超える場合、最も古い末尾のアイテムが切り捨てられること
 *    - 不正な taskId（0以下、NaN、非数値）が渡された場合、履歴を変更せず元の配列を返すこと
 *
 * 2. cleanTaskHistory
 *    - validTaskIds に含まれるタスクのみが履歴に残ること
 *    - 削除された（validTaskIds に含まれない）タスクが履歴から除外されること
 *    - 全て有効な場合は元の配列内容を維持すること
 *
 * 3. parseTaskHistory
 *    - 正常な JSON 配列文字列を正しくパースして TaskHistoryItem 配列を返すこと
 *    - taskId が正の整数でない要素、または accessedAt が数値でない要素を除外すること
 *    - 不正な JSON 文字列や null、undefined の場合、空配列を返すこと
 *    - 配列以外の JSON（オブジェクトや数値など）の場合、空配列を返すこと
 *
 * 4. clampMaxCount / parseMaxCount
 *    - 許容範囲内（5〜30）の数値はそのまま返すこと
 *    - 許容下限未満（5未満）は 5 にクランプすること
 *    - 許容上限超え（30超）は 30 にクランプすること
 *    - 不正な値（NaN、非数値文字列など）の場合はデフォルト値（10）を返すこと
 */

describe("task-history.utils", () => {
  describe("recordTaskHistory", () => {
    it("履歴が空の場合、新規アイテムを先頭に追加すること", () => {
      const now = 1700000000000;
      const result = recordTaskHistory([], 1, 10, now);

      expect(result).toEqual([
        { taskId: 1, accessedAt: now },
      ]);
    });

    it("異なるタスクを連続で追加した場合、常に最新のタスクが先頭に追加されること", () => {
      const initial: TaskHistoryItem[] = [
        { taskId: 1, accessedAt: 1000 },
      ];
      const result = recordTaskHistory(initial, 2, 10, 2000);

      expect(result).toEqual([
        { taskId: 2, accessedAt: 2000 },
        { taskId: 1, accessedAt: 1000 },
      ]);
    });

    it("既に履歴に存在するタスクを追加した場合、既存位置から削除されて最新日時で先頭に移動すること（LRU）", () => {
      const initial: TaskHistoryItem[] = [
        { taskId: 3, accessedAt: 3000 },
        { taskId: 2, accessedAt: 2000 },
        { taskId: 1, accessedAt: 1000 },
      ];
      const result = recordTaskHistory(initial, 2, 10, 4000);

      expect(result).toEqual([
        { taskId: 2, accessedAt: 4000 },
        { taskId: 3, accessedAt: 3000 },
        { taskId: 1, accessedAt: 1000 },
      ]);
    });

    it("maxCount を超える場合、最も古い末尾のアイテムが切り捨てられること", () => {
      const initial: TaskHistoryItem[] = [
        { taskId: 3, accessedAt: 3000 },
        { taskId: 2, accessedAt: 2000 },
        { taskId: 1, accessedAt: 1000 },
      ];
      // maxCount = 3 で新しい taskId: 4 を追加
      const result = recordTaskHistory(initial, 4, 3, 4000);

      expect(result).toEqual([
        { taskId: 4, accessedAt: 4000 },
        { taskId: 3, accessedAt: 3000 },
        { taskId: 2, accessedAt: 2000 },
      ]);
    });

    it("不正な taskId（0以下、NaN、非数値）が渡された場合、履歴を変更せず元の配列を返すこと", () => {
      const initial: TaskHistoryItem[] = [
        { taskId: 1, accessedAt: 1000 },
      ];

      expect(recordTaskHistory(initial, 0, 10, 2000)).toEqual(initial);
      expect(recordTaskHistory(initial, -5, 10, 2000)).toEqual(initial);
      expect(recordTaskHistory(initial, NaN, 10, 2000)).toEqual(initial);
    });
  });

  describe("cleanTaskHistory", () => {
    it("validTaskIds に含まれるタスクのみが履歴に残ること", () => {
      const initial: TaskHistoryItem[] = [
        { taskId: 3, accessedAt: 3000 },
        { taskId: 2, accessedAt: 2000 },
        { taskId: 1, accessedAt: 1000 },
      ];
      const validSet = new Set([1, 3]);
      const result = cleanTaskHistory(initial, validSet);

      expect(result).toEqual([
        { taskId: 3, accessedAt: 3000 },
        { taskId: 1, accessedAt: 1000 },
      ]);
    });

    it("削除されたタスクが履歴から除外されること", () => {
      const initial: TaskHistoryItem[] = [
        { taskId: 99, accessedAt: 9900 },
      ];
      const validSet = new Set([1, 2, 3]);
      const result = cleanTaskHistory(initial, validSet);

      expect(result).toEqual([]);
    });

    it("全て有効な場合は元の配列内容を維持すること", () => {
      const initial: TaskHistoryItem[] = [
        { taskId: 2, accessedAt: 2000 },
        { taskId: 1, accessedAt: 1000 },
      ];
      const validSet = new Set([1, 2]);
      const result = cleanTaskHistory(initial, validSet);

      expect(result).toEqual(initial);
    });
  });

  describe("parseTaskHistory", () => {
    it("正常な JSON 配列文字列を正しくパースして TaskHistoryItem 配列を返すこと", () => {
      const json = JSON.stringify([
        { taskId: 2, accessedAt: 2000 },
        { taskId: 1, accessedAt: 1000 },
      ]);
      const result = parseTaskHistory(json);

      expect(result).toEqual([
        { taskId: 2, accessedAt: 2000 },
        { taskId: 1, accessedAt: 1000 },
      ]);
    });

    it("taskId が正の整数でない要素、または accessedAt が数値でない要素を除外すること", () => {
      const json = JSON.stringify([
        { taskId: 1, accessedAt: 1000 },
        { taskId: "invalid", accessedAt: 2000 },
        { taskId: -1, accessedAt: 3000 },
        { taskId: 2, accessedAt: "invalid" },
        null,
        123,
      ]);
      const result = parseTaskHistory(json);

      expect(result).toEqual([
        { taskId: 1, accessedAt: 1000 },
      ]);
    });

    it("不正な JSON 文字列や null、undefined の場合、空配列を返すこと", () => {
      expect(parseTaskHistory("invalid json")).toEqual([]);
      expect(parseTaskHistory(null)).toEqual([]);
      expect(parseTaskHistory(undefined)).toEqual([]);
      expect(parseTaskHistory("")).toEqual([]);
    });

    it("配列以外の JSON（オブジェクトや数値など）の場合、空配列を返すこと", () => {
      expect(parseTaskHistory(JSON.stringify({ taskId: 1 }))).toEqual([]);
      expect(parseTaskHistory(JSON.stringify(123))).toEqual([]);
    });
  });

  describe("clampMaxCount / parseMaxCount", () => {
    it("許容範囲内（5〜30）の数値はそのまま返すこと", () => {
      expect(clampMaxCount(5)).toBe(5);
      expect(clampMaxCount(10)).toBe(10);
      expect(clampMaxCount(20)).toBe(20);
      expect(clampMaxCount(30)).toBe(30);
    });

    it("許容下限未満（5未満）は 5 にクランプすること", () => {
      expect(clampMaxCount(4)).toBe(5);
      expect(clampMaxCount(0)).toBe(5);
      expect(clampMaxCount(-10)).toBe(5);
    });

    it("許容上限超え（30超）は 30 にクランプすること", () => {
      expect(clampMaxCount(31)).toBe(30);
      expect(clampMaxCount(100)).toBe(30);
    });

    it("不正な値（NaN、非数値文字列など）の場合はデフォルト値（10）を返すこと", () => {
      expect(parseMaxCount("invalid", 10)).toBe(10);
      expect(parseMaxCount(null, 10)).toBe(10);
      expect(parseMaxCount(undefined, 10)).toBe(10);
      expect(parseMaxCount("15", 10)).toBe(15);
      expect(parseMaxCount("50", 10)).toBe(30);
    });
  });

  describe("buildTaskHistoryViewItems", () => {
    it("タスク情報とラベル情報をマッピングして ViewItem 一覧を生成すること", () => {
      const history: TaskHistoryItem[] = [
        { taskId: 2, accessedAt: 2000 },
        { taskId: 1, accessedAt: 1000 },
      ];
      const tasksMap = new Map<number, TaskRecord>([
        [
          1,
          {
            id: 1,
            name: "タスク1",
            fiscalYear: 2026,
            labelId: 10,
            statusCode: 0,
            dueDate: new Date(2026, 3, 1),
            contacts: [],
            description: "",
            bookmark: false,
            selected: false,
          },
        ],
        [
          2,
          {
            id: 2,
            name: "タスク2",
            fiscalYear: 2026,
            labelId: 20,
            statusCode: 5,
            dueDate: new Date(2026, 3, 2),
            contacts: [],
            description: "",
            bookmark: false,
            selected: false,
          },
        ],
      ]);
      const labelsMap = new Map<number, LabelRecord>([
        [10, { id: 10, name: "ラベルA", description: "", isSelected: false }],
        [20, { id: 20, name: "ラベルB", description: "", isSelected: false }],
      ]);

      const result = buildTaskHistoryViewItems(history, tasksMap, labelsMap);

      expect(result).toEqual([
        {
          taskId: 2,
          accessedAt: 2000,
          title: "タスク2",
          labelId: 20,
          labelName: "ラベルB",
          statusCode: 5,
        },
        {
          taskId: 1,
          accessedAt: 1000,
          title: "タスク1",
          labelId: 10,
          labelName: "ラベルA",
          statusCode: 0,
        },
      ]);
    });

    it("tasksMap に存在しないタスクは除外されること", () => {
      const history: TaskHistoryItem[] = [
        { taskId: 99, accessedAt: 9900 },
        { taskId: 1, accessedAt: 1000 },
      ];
      const tasksMap = new Map<number, TaskRecord>([
        [
          1,
          {
            id: 1,
            name: "タスク1",
            fiscalYear: 2026,
            labelId: 10,
            statusCode: 0,
            dueDate: new Date(2026, 3, 1),
            contacts: [],
            description: "",
            bookmark: false,
            selected: false,
          },
        ],
      ]);
      const labelsMap = new Map<number, LabelRecord>();

      const result = buildTaskHistoryViewItems(history, tasksMap, labelsMap);

      expect(result).toHaveLength(1);
      expect(result[0]?.taskId).toBe(1);
    });
  });
});

