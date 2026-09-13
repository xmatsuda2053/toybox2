import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/db/schema/database.schema";
import type { LogRecord } from "@/db/models/journal.model";
import { LogsRepository } from "@/repositories/logs.repository";

/**
 * 【LogsRepository 仕様】
 *
 * 1. データ取得・初期化 (Read)
 *    - [x] 1-1. 空のDBからの全件取得で空配列 [] を返すこと
 *    - [x] 1-2. 保存されている全Logを取得できること (getAll)
 *    - [x] 1-3. 指定したIDのLogを取得できること (getById)
 *    - [x] 1-4. 存在しないIDの場合は undefined を返すこと (getById)
 *    - [x] 1-5. 指定したtaskIdに紐づくLogが存在しない場合は空配列 [] を返すこと (getByTaskId)
 *    - [x] 1-6. 指定したtaskIdのLogリストを取得できること (getByTaskId)
 *
 * 2. CRUD 操作 (Create / Update / Delete)
 *    - [x] 2-1. 新規Logを正常に追加でき、自動採番された ID が返ること
 *    - [x] 2-2. 既存Logのプロパティを更新できること
 *    - [x] 2-3. 指定したIDのLogを削除できること
 *    - [x] 2-4. 指定したtaskIdに紐づくLogを一括削除できること (deleteByTaskId)
 */
describe("LogsRepository Tests", () => {
  let repository: LogsRepository;

  beforeEach(async () => {
    await db.logs.clear();
    repository = new LogsRepository();
  });

  describe("1. データ取得・初期化 (Read)", () => {
    it("1-1. 空のDBからの全件取得で空配列 [] を返すこと", async () => {
      const result: LogRecord[] = await repository.getAll();
      expect(result).toEqual([]);
    });

    it("1-2. 保存されている全Logを取得できること (getAll)", async () => {
      const log1: Omit<LogRecord, "id"> = {
        taskId: 1,
        value: "Log 1",
        createdAt: new Date("2026-04-01T10:00:00"),
        updatedAt: new Date("2026-04-01T10:00:00"),
      };
      const log2: Omit<LogRecord, "id"> = {
        taskId: 2,
        value: "Log 2",
        createdAt: new Date("2026-04-02T11:00:00"),
        updatedAt: new Date("2026-04-02T11:00:00"),
      };

      await db.logs.bulkAdd([log1, log2]);

      const result: LogRecord[] = await repository.getAll();
      expect(result).toHaveLength(2);
      expect(result[0].value).toBe("Log 1");
      expect(result[1].value).toBe("Log 2");
    });

    it("1-3. 指定したIDのLogを取得できること (getById)", async () => {
      const log: Omit<LogRecord, "id"> = {
        taskId: 1,
        value: "Target Log",
        createdAt: new Date("2026-04-01T10:00:00"),
        updatedAt: new Date("2026-04-01T10:00:00"),
      };
      const id = await db.logs.add(log);

      const result: LogRecord | undefined = await repository.getById(id);
      expect(result).toBeDefined();
      expect(result?.id).toBe(id);
      expect(result?.value).toBe("Target Log");
    });

    it("1-4. 存在しないIDの場合は undefined を返すこと (getById)", async () => {
      const result: LogRecord | undefined = await repository.getById(99999);
      expect(result).toBeUndefined();
    });

    it("1-5. 指定したtaskIdに紐づくLogが存在しない場合は空配列 [] を返すこと (getByTaskId)", async () => {
      const result: LogRecord[] = await repository.getByTaskId(99999);
      expect(result).toEqual([]);
    });

    it("1-6. 指定したtaskIdのLogリストを取得できること (getByTaskId)", async () => {
      const log1: Omit<LogRecord, "id"> = {
        taskId: 1,
        value: "Log 1",
        createdAt: new Date("2026-04-01T10:00:00"),
        updatedAt: new Date("2026-04-01T10:00:00"),
      };
      const log2: Omit<LogRecord, "id"> = {
        taskId: 1,
        value: "Log 2",
        createdAt: new Date("2026-04-02T11:00:00"),
        updatedAt: new Date("2026-04-02T11:00:00"),
      };
      const otherLog: Omit<LogRecord, "id"> = {
        taskId: 2,
        value: "Other Log",
        createdAt: new Date("2026-04-03T12:00:00"),
        updatedAt: new Date("2026-04-03T12:00:00"),
      };

      await db.logs.bulkAdd([log1, log2, otherLog]);

      const result: LogRecord[] = await repository.getByTaskId(1);
      expect(result).toHaveLength(2);
      expect(result[0].value).toBe("Log 1");
      expect(result[1].value).toBe("Log 2");
    });
  });

  describe("2. CRUD 操作 (Create / Update / Delete)", () => {
    it("2-1. 新規Logを正常に追加でき、自動採番された ID が返ること", async () => {
      const newLog: Omit<LogRecord, "id"> = {
        taskId: 1,
        value: "New Log Entry",
        createdAt: new Date("2026-05-01T09:00:00"),
        updatedAt: new Date("2026-05-01T09:00:00"),
      };

      const id = await repository.add(newLog);
      const result = await db.logs.get(id);

      expect(result).toBeDefined();
      expect(result?.id).toEqual(id);
      expect(result?.value).toEqual(newLog.value);
    });

    it("2-2. 既存Logのプロパティを更新できること", async () => {
      const baseLog: Omit<LogRecord, "id"> = {
        taskId: 1,
        value: "Base Log",
        createdAt: new Date("2026-05-01T09:00:00"),
        updatedAt: new Date("2026-05-01T09:00:00"),
      };

      const id = await repository.add(baseLog);
      await repository.update(id, { value: "Updated Log Content" });
      const result = await db.logs.get(id);

      expect(result?.value).toBe("Updated Log Content");
    });

    it("2-3. 指定したIDのLogを削除できること", async () => {
      const newLog: Omit<LogRecord, "id"> = {
        taskId: 1,
        value: "Delete Target",
        createdAt: new Date("2026-05-01T09:00:00"),
        updatedAt: new Date("2026-05-01T09:00:00"),
      };

      const id = await repository.add(newLog);
      await repository.delete(id);
      const result = await db.logs.get(id);

      expect(result).toBeUndefined();
    });

    it("2-4. 指定したtaskIdに紐づくLogを一括削除できること (deleteByTaskId)", async () => {
      const log1: Omit<LogRecord, "id"> = {
        taskId: 1,
        value: "Log 1-1",
        createdAt: new Date("2026-04-01T10:00:00"),
      };
      const log2: Omit<LogRecord, "id"> = {
        taskId: 1,
        value: "Log 1-2",
        createdAt: new Date("2026-04-02T11:00:00"),
      };
      const otherLog: Omit<LogRecord, "id"> = {
        taskId: 2,
        value: "Log 2-1",
        createdAt: new Date("2026-04-03T12:00:00"),
      };

      await db.logs.bulkAdd([log1, log2, otherLog]);

      await repository.deleteByTaskId(1);

      const remainingTaskId1 = await repository.getByTaskId(1);
      const remainingTaskId2 = await repository.getByTaskId(2);

      expect(remainingTaskId1).toEqual([]);
      expect(remainingTaskId2).toHaveLength(1);
      expect(remainingTaskId2[0].value).toBe("Log 2-1");
    });
  });
});
