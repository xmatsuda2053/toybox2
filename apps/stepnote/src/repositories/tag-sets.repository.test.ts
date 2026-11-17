import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { db } from "@/db/schema/database.schema";
import { TagSetsRepository } from "./tag-sets.repository";

/**
 * 【TagSetsRepository 仕様】
 * 1. 基本的なCRUDおよびソート取得
 *    - 1-1. getAllSorted でタグセット名昇順（自然順）の一覧を取得できること
 * 2. バリデーションと重複制御
 *    - 2-1. addTagSet でタグセット名が正規化（トリム）され tagIds が重複除去されて登録されること
 *    - 2-2. addTagSet で空の名前を指定した場合、例外がスローされること
 *    - 2-3. addTagSet で既存タグセットと重複する名前（大文字小文字違い含む）を指定した場合、例外がスローされること
 *    - 2-4. updateTagSet で名前・説明・tagIds を更新できること
 *    - 2-5. updateTagSet で他の既存タグセットと重複する名前に変更しようとした場合、例外がスローされること
 * 3. 削除
 *    - 3-1. deleteTagSet で指定IDのタグセットが削除されること
 */
describe("TagSetsRepository Tests", () => {
  let repository: TagSetsRepository;

  beforeEach(async () => {
    await db.delete();
    await db.open();
    repository = new TagSetsRepository();
  });

  describe("1. 基本的なCRUDおよびソート取得", () => {
    it("1-1. getAllSorted でタグセット名昇順（自然順）の一覧を取得できること", async () => {
      await repository.addTagSet({ name: "開発セット2", tagIds: [2] });
      await repository.addTagSet({ name: "開発セット10", tagIds: [3] });
      await repository.addTagSet({ name: "APIリリース", tagIds: [1] });

      const list = await repository.getAllSorted();
      expect(list.map((s) => s.name)).toEqual([
        "APIリリース",
        "開発セット2",
        "開発セット10",
      ]);
    });
  });

  describe("2. バリデーションと重複制御", () => {
    it("2-1. addTagSet で名前が正規化（トリム）され tagIds が重複除去されて登録されること", async () => {
      const id = await repository.addTagSet({
        name: "  定例タスク  ",
        description: "  定例用セット  ",
        tagIds: [1, 2, 1, 3],
      });

      const saved = await repository.getById(id);
      expect(saved).toBeDefined();
      expect(saved?.name).toBe("定例タスク");
      expect(saved?.description).toBe("定例用セット");
      expect(saved?.tagIds).toEqual([1, 2, 3]);
    });

    it("2-2. addTagSet で空の名前を指定した場合、例外がスローされること", async () => {
      await expect(
        repository.addTagSet({ name: "   ", tagIds: [1] }),
      ).rejects.toThrow();
    });

    it("2-3. addTagSet で既存タグセットと重複する名前（大文字小文字違い含む）を指定した場合、例外がスローされること", async () => {
      await repository.addTagSet({ name: "Release", tagIds: [1] });
      await expect(
        repository.addTagSet({ name: "release", tagIds: [2] }),
      ).rejects.toThrow();
    });

    it("2-4. updateTagSet で名前・説明・tagIds を更新できること", async () => {
      const id = await repository.addTagSet({
        name: "旧セット",
        description: "旧説明",
        tagIds: [1],
      });

      await repository.updateTagSet(id, {
        name: "新セット",
        description: "新説明",
        tagIds: [2, 3, 2],
      });

      const updated = await repository.getById(id);
      expect(updated?.name).toBe("新セット");
      expect(updated?.description).toBe("新説明");
      expect(updated?.tagIds).toEqual([2, 3]);
    });

    it("2-5. updateTagSet で他の既存タグセットと重複する名前に変更しようとした場合、例外がスローされること", async () => {
      await repository.addTagSet({ name: "Frontend", tagIds: [1] });
      const id2 = await repository.addTagSet({ name: "Backend", tagIds: [2] });

      await expect(
        repository.updateTagSet(id2, { name: "frontend" }),
      ).rejects.toThrow();
    });
  });

  describe("3. 削除", () => {
    it("3-1. deleteTagSet で指定IDのタグセットが削除されること", async () => {
      const id = await repository.addTagSet({ name: "一時セット", tagIds: [1] });
      await repository.deleteTagSet(id);
      expect(await repository.getById(id)).toBeUndefined();
    });
  });
});
