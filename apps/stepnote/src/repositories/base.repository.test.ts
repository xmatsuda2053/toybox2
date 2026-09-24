import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/db/schema/database.schema";
import type { LabelRecord } from "@/db/models/navigation.model";
import type { LogRecord } from "@/db/models/journal.model";
import { BaseRepository } from "./base.repository";
import { BaseTaskSubItemRepository } from "./base-task-sub-item.repository";

/**
 * テスト仕様:
 * 1. BaseRepository 基本CRUD操作
 *    - 1-1. getAll: 空のテーブルから空配列を返すこと
 *    - 1-2. getAll: 全件のレコードを取得できること
 *    - 1-3. getById: 指定IDのレコードを取得できること
 *    - 1-4. getById: 存在しないIDの場合は undefined を返すこと
 *    - 1-5. add: 新規レコードを追加して採番されたIDを返すこと
 *    - 1-6. update: 指定IDのレコードを部分更新できること
 *    - 1-7. delete: 指定IDのレコードを削除できること
 * 2. BaseTaskSubItemRepository タスク紐付き操作
 *    - 2-1. getByTaskId: 指定taskIdに紐づくレコード配列を取得できること（該当なし時は空配列）
 *    - 2-2. deleteByTaskId: 指定taskIdに紐づくすべてのレコードを一括削除できること
 */

describe("BaseRepository Tests", () => {
  let repository: BaseRepository<LabelRecord>;

  beforeEach(async () => {
    await db.labels.clear();
    repository = new BaseRepository<LabelRecord>(db.labels);
  });

  describe("1. BaseRepository 基本CRUD操作", () => {
    it("1-1. getAll: 空のテーブルから空配列を返すこと", async () => {
      const result = await repository.getAll();
      expect(result).toEqual([]);
    });

    it("1-2. getAll: 全件のレコードを取得できること", async () => {
      await db.labels.bulkAdd([
        { name: "Label 1", description: "Desc 1", isSelected: false },
        { name: "Label 2", description: "Desc 2", isSelected: true },
      ]);
      const result = await repository.getAll();
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Label 1");
      expect(result[1].name).toBe("Label 2");
    });

    it("1-3. getById: 指定IDのレコードを取得できること", async () => {
      const id = await db.labels.add({
        name: "Target",
        description: "Target Desc",
        isSelected: false,
      });
      const result = await repository.getById(id as number);
      expect(result).toBeDefined();
      expect(result?.name).toBe("Target");
    });

    it("1-4. getById: 存在しないIDの場合は undefined を返すこと", async () => {
      const result = await repository.getById(9999);
      expect(result).toBeUndefined();
    });

    it("1-5. add: 新規レコードを追加して採番されたIDを返すこと", async () => {
      const id = await repository.add({
        name: "New Label",
        description: "New Desc",
        isSelected: false,
      });
      expect(id).toBeTypeOf("number");

      const created = await db.labels.get(id);
      expect(created?.name).toBe("New Label");
    });

    it("1-6. update: 指定IDのレコードを部分更新できること", async () => {
      const id = await db.labels.add({
        name: "Old Name",
        description: "Old Desc",
        isSelected: false,
      });
      await repository.update(id as number, { name: "Updated Name" });

      const updated = await db.labels.get(id as number);
      expect(updated?.name).toBe("Updated Name");
      expect(updated?.description).toBe("Old Desc");
    });

    it("1-7. delete: 指定IDのレコードを削除できること", async () => {
      const id = await db.labels.add({
        name: "To Delete",
        description: "Desc",
        isSelected: false,
      });
      await repository.delete(id as number);

      const deleted = await db.labels.get(id as number);
      expect(deleted).toBeUndefined();
    });
  });
});

describe("BaseTaskSubItemRepository Tests", () => {
  let repository: BaseTaskSubItemRepository<LogRecord>;

  beforeEach(async () => {
    await db.logs.clear();
    repository = new BaseTaskSubItemRepository<LogRecord>(db.logs);
  });

  describe("2. BaseTaskSubItemRepository タスク紐付き操作", () => {
    it("2-1. getByTaskId: 指定taskIdに紐づくレコード配列を取得できること（該当なし時は空配列）", async () => {
      await db.logs.bulkAdd([
        { taskId: 1, value: "Log 1" },
        { taskId: 1, value: "Log 2" },
        { taskId: 2, value: "Log 3" },
      ]);

      const task1Logs = await repository.getByTaskId(1);
      expect(task1Logs).toHaveLength(2);

      const nonExistentLogs = await repository.getByTaskId(999);
      expect(nonExistentLogs).toEqual([]);
    });

    it("2-2. deleteByTaskId: 指定taskIdに紐づくすべてのレコードを一括削除できること", async () => {
      await db.logs.bulkAdd([
        { taskId: 1, value: "Log 1" },
        { taskId: 1, value: "Log 2" },
        { taskId: 2, value: "Log 3" },
      ]);

      await repository.deleteByTaskId(1);

      const remainingTask1Logs = await repository.getByTaskId(1);
      expect(remainingTask1Logs).toHaveLength(0);

      const task2Logs = await repository.getByTaskId(2);
      expect(task2Logs).toHaveLength(1);
    });
  });
});
