import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/db/schema/database.schema";
import type { LogRecord } from "@/db/models/journal.model";
import { LogsRepository } from "@/repositories/logs.repository";

/**
 * 【LogsRepository 仕様】
 *
 * 1. データ取得・初期化
 *    - [x] 1-1. 指定したtaskIdに紐づくLogが存在しない場合は空配列 [] を返すこと
 *    - [x] 1-2. 指定したtaskIdのLogリストを取得できること
 * 2. CRUD 操作
 *    - [x] 2-1. 新規Logを正常に追加できること
 *    - [x] 2-2. 既存Logのプロパティを更新できること
 *    - [x] 2-3. 指定したidのLogを削除できること
 */
describe("logs repository tests", () => {
  let repository: LogsRepository;

  beforeEach(async () => {
    await db.logs.clear();
    repository = new LogsRepository();
  });

  describe("1. データ取得・初期化", () => {
    it("1-1. 指定したtaskIdに紐づくLogが存在しない場合は空配列 [] を返すこと", async () => {
      const result: LogRecord[] = await repository.getByTaskId(99999);
      expect(result).toEqual([]);
    });

    it("1-2. 指定したtaskIdのLogリストを取得できること", async () => {
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
      expect(result[0].value).toEqual(log1.value);
      expect(result[0].taskId).toEqual(1);
      expect(result[1].value).toEqual(log2.value);
      expect(result[1].taskId).toEqual(1);
    });
  });

  describe("2. CRUD 操作", () => {
    it("2-1. 新規Logを正常に追加できること", async () => {
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
      expect(result?.taskId).toEqual(newLog.taskId);
      expect(result?.value).toEqual(newLog.value);
      expect(result?.createdAt).toEqual(newLog.createdAt);
      expect(result?.updatedAt).toEqual(newLog.updatedAt);
    });

    it("2-2. 既存Logのプロパティを更新できること", async () => {
      const baseLog: Omit<LogRecord, "id"> = {
        taskId: 1,
        value: "Base Log",
        createdAt: new Date("2026-05-01T09:00:00"),
        updatedAt: new Date("2026-05-01T09:00:00"),
      };

      const id = await repository.add(baseLog);

      const updatedLog: Partial<Omit<LogRecord, "id">> = {
        value: "Updated Log Content",
        updatedAt: new Date("2026-05-01T10:00:00"),
      };
      await repository.update(id, updatedLog);
      const result = await db.logs.get(id);

      expect(result).toBeDefined();
      expect(result?.value).toEqual(updatedLog.value);
      expect(result?.updatedAt).toEqual(updatedLog.updatedAt);
      expect(result?.createdAt).toEqual(baseLog.createdAt);
      expect(result?.taskId).toEqual(baseLog.taskId);
    });

    it("2-3. 指定したidのLogを削除できること", async () => {
      const newLog: Omit<LogRecord, "id"> = {
        taskId: 1,
        value: "Test Log",
        createdAt: new Date("2026-05-01T09:00:00"),
      };

      const id = await repository.add(newLog);
      await repository.delete(id);
      const result = await db.logs.get(id);

      expect(result).toBeUndefined();
    });
  });
});
