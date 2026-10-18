import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/db/schema/database.schema";
import type { ScratchRecord } from "@/db/models/scratch.model";
import { ScratchRepository } from "@/repositories/scratch.repository";

/**
 * 【ScratchRepository 仕様】
 *
 * 1. データ取得・初期化 (Read)
 *    - 1-1. 空のDBからの全件取得で空配列 [] を返すこと
 *    - 1-2. 保存されている全Scratchを取得できること (getAll)
 *    - 1-3. 指定したIDのScratchを取得できること (getById)
 *    - 1-4. 存在しないIDの場合は undefined を返すこと (getById)
 *
 * 2. CRUD 操作 (Create / Update / Delete)
 *    - 2-1. 新規Scratchを正常に追加でき、自動採番された ID が返ること
 *    - 2-2. 既存Scratchのプロパティを更新できること
 *    - 2-3. 指定したIDのScratchを削除できること
 */
describe("ScratchRepository Tests", () => {
  let repository: ScratchRepository;

  beforeEach(async () => {
    await db.scratches.clear();
    repository = new ScratchRepository();
  });

  describe("1. データ取得・初期化 (Read)", () => {
    it("1-1. 空のDBからの全件取得で空配列 [] を返すこと", async () => {
      const result: ScratchRecord[] = await repository.getAll();
      expect(result).toEqual([]);
    });

    it("1-2. 保存されている全Scratchを取得できること (getAll)", async () => {
      const item1: Omit<ScratchRecord, "id"> = {
        value: "Scratch 1",
        createdAt: new Date("2026-04-01T10:00:00"),
        updatedAt: new Date("2026-04-01T10:00:00"),
      };
      const item2: Omit<ScratchRecord, "id"> = {
        value: "Scratch 2",
        createdAt: new Date("2026-04-02T11:00:00"),
        updatedAt: new Date("2026-04-02T11:00:00"),
      };

      await db.scratches.bulkAdd([item1, item2]);

      const result: ScratchRecord[] = await repository.getAll();
      expect(result).toHaveLength(2);
      expect(result[0].value).toBe("Scratch 1");
      expect(result[1].value).toBe("Scratch 2");
    });

    it("1-3. 指定したIDのScratchを取得できること (getById)", async () => {
      const item: Omit<ScratchRecord, "id"> = {
        value: "Target Scratch",
      };
      const id = await db.scratches.add(item);

      const found = await repository.getById(id);
      expect(found).toBeDefined();
      expect(found?.value).toBe("Target Scratch");
    });

    it("1-4. 存在しないIDの場合は undefined を返すこと (getById)", async () => {
      const found = await repository.getById(99999);
      expect(found).toBeUndefined();
    });
  });

  describe("2. CRUD 操作 (Create / Update / Delete)", () => {
    it("2-1. 新規Scratchを正常に追加でき、自動採番された ID が返ること", async () => {
      const newId = await repository.add({
        value: "New Scratch Page",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(typeof newId).toBe("number");
      expect(newId).toBeGreaterThan(0);

      const saved = await db.scratches.get(newId);
      expect(saved?.value).toBe("New Scratch Page");
    });

    it("2-2. 既存Scratchのプロパティを更新できること", async () => {
      const id = await db.scratches.add({
        value: "Original Value",
      });

      await repository.update(id, { value: "Updated Value" });

      const updated = await db.scratches.get(id);
      expect(updated?.value).toBe("Updated Value");
    });

    it("2-3. 指定したIDのScratchを削除できること", async () => {
      const id = await db.scratches.add({
        value: "To Be Deleted",
      });

      await repository.delete(id);

      const deleted = await db.scratches.get(id);
      expect(deleted).toBeUndefined();
    });
  });
});
