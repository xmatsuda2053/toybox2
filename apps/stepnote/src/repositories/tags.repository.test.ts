import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/db/schema/database.schema";
import type { TagRecord } from "@/db/models/tag.model";
import { TagsRepository } from "@/repositories/tags.repository";

/**
 * 【TagsRepository 仕様】
 *
 * 1. データ取得・初期化
 *    - 1-1. 空のDBからの全件取得で空配列 [] を返すこと
 *    - 1-2. 指定したIDのタグを取得できること
 *    - 1-3. 存在しないIDの場合は undefined を返すこと
 *    - 1-4. getAllSorted でタグ名の昇順（自然順）でソートされた一覧を取得できること
 *    - 1-5. findByNameIgnoreCase で大文字小文字を区別せずにタグを検索できること
 * 2. 作成・更新操作とバリデーション
 *    - 2-1. addTag で前後空白および先頭 '#' をトリム・正規化してタグを追加できること
 *    - 2-2. addTag で空文字または '#' のみの名前を指定した場合、例外がスローされること
 *    - 2-3. addTag で既存タグと重複する名前（大文字小文字違い含む）を指定した場合、例外がスローされること
 *    - 2-4. updateTag でタグ名・説明・色（variant）を更新できること
 *    - 2-5. updateTag で他の既存タグと重複する名前に変更しようとした場合、例外がスローされること
 * 3. 使用件数集計および関連タスク連動削除
 *    - 3-1. getTaskUsageCount で指定タグIDを使用しているタスク件数を取得できること
 *    - 3-2. deleteTagWithCleanup でタグを削除し、該当タグを保持する全タスクの tagIds からも対象IDを除去すること
 */
describe("TagsRepository Tests", () => {
  let repository: TagsRepository;

  beforeEach(async () => {
    await db.delete();
    await db.open();
    repository = new TagsRepository();
  });

  describe("1. データ取得・初期化", () => {
    it("1-1. 空のDBからの全件取得で空配列 [] を返すこと", async () => {
      const result: TagRecord[] = await repository.getAll();
      expect(result).toEqual([]);
    });

    it("1-2. 指定したIDのタグを取得できること", async () => {
      const id = await repository.addTag({
        name: "緊急",
        description: "至急対応",
        variant: "danger",
      });
      const result = await repository.getById(id);

      expect(result).toBeDefined();
      expect(result?.name).toBe("緊急");
      expect(result?.description).toBe("至急対応");
      expect(result?.variant).toBe("danger");
    });

    it("1-3. 存在しないIDの場合は undefined を返すこと", async () => {
      const result = await repository.getById(99999);
      expect(result).toBeUndefined();
    });

    it("1-4. getAllSorted でタグ名の昇順でソートされた一覧を取得できること", async () => {
      await repository.addTag({ name: "Bravo", description: "", variant: "neutral" });
      await repository.addTag({ name: "Alpha", description: "", variant: "brand" });
      await repository.addTag({ name: "Charlie", description: "", variant: "success" });

      const result = await repository.getAllSorted();
      expect(result.map((t) => t.name)).toEqual(["Alpha", "Bravo", "Charlie"]);
    });

    it("1-5. findByNameIgnoreCase で大文字小文字を区別せずにタグを検索できること", async () => {
      await repository.addTag({ name: "API", description: "", variant: "brand" });

      const found = await repository.findByNameIgnoreCase("api");
      expect(found).toBeDefined();
      expect(found?.name).toBe("API");

      const notFound = await repository.findByNameIgnoreCase("UI");
      expect(notFound).toBeUndefined();
    });
  });

  describe("2. 作成・更新操作とバリデーション", () => {
    it("2-1. addTag で前後空白および先頭 '#' を正規化してタグを追加できること", async () => {
      const id = await repository.addTag({
        name: "  #バックエンド  ",
        description: "  API関連  ",
      });
      const result = await repository.getById(id);

      expect(result?.name).toBe("バックエンド");
      expect(result?.description).toBe("API関連");
      expect(result?.variant).toBe("neutral");
      expect(result?.createdAt).toBeInstanceOf(Date);
      expect(result?.updatedAt).toBeInstanceOf(Date);
    });

    it("2-2. addTag で空文字または '#' のみの名前を指定した場合、例外がスローされること", async () => {
      await expect(repository.addTag({ name: "   " })).rejects.toThrow();
      await expect(repository.addTag({ name: "## " })).rejects.toThrow();
    });

    it("2-3. addTag で既存タグと重複する名前（大文字小文字違い含む）を指定した場合、例外がスローされること", async () => {
      await repository.addTag({ name: "Design" });

      await expect(repository.addTag({ name: "design" })).rejects.toThrow();
    });

    it("2-4. updateTag でタグ名・説明・色（variant）を更新できること", async () => {
      const id = await repository.addTag({
        name: "旧タグ",
        description: "旧説明",
        variant: "neutral",
      });

      await repository.updateTag(id, {
        name: "新タグ",
        description: "新説明",
        variant: "warning",
      });

      const updated = await repository.getById(id);
      expect(updated?.name).toBe("新タグ");
      expect(updated?.description).toBe("新説明");
      expect(updated?.variant).toBe("warning");
    });

    it("2-5. updateTag で他の既存タグと重複する名前に変更しようとした場合、例外がスローされること", async () => {
      await repository.addTag({ name: "Frontend" });
      const id2 = await repository.addTag({ name: "Backend" });

      await expect(
        repository.updateTag(id2, { name: "frontend" }),
      ).rejects.toThrow();
    });
  });

  describe("3. 使用件数集計および関連タスク連動削除", () => {
    it("3-1. getTaskUsageCount で指定タグIDを使用しているタスク件数を取得できること", async () => {
      const tagId1 = await repository.addTag({ name: "重要" });
      const tagId2 = await repository.addTag({ name: "調査" });

      await db.tasks.add({
        statusCode: 0,
        name: "タスクA",
        dueDate: new Date(),
        contacts: [],
        description: "",
        fiscalYear: 2026,
        labelId: 1,
        bookmark: false,
        selected: false,
        tagIds: [tagId1, tagId2],
      });
      await db.tasks.add({
        statusCode: 0,
        name: "タスクB",
        dueDate: new Date(),
        contacts: [],
        description: "",
        fiscalYear: 2026,
        labelId: 1,
        bookmark: false,
        selected: false,
        tagIds: [tagId1],
      });

      expect(await repository.getTaskUsageCount(tagId1)).toBe(2);
      expect(await repository.getTaskUsageCount(tagId2)).toBe(1);
    });

    it("3-2. deleteTagWithCleanup でタグを削除し、該当タグを保持する全タスクの tagIds からも対象IDを除去すること", async () => {
      const tagId1 = await repository.addTag({ name: "削除対象" });
      const tagId2 = await repository.addTag({ name: "残すタグ" });

      const task1Id = await db.tasks.add({
        statusCode: 0,
        name: "タスク1",
        dueDate: new Date(),
        contacts: [],
        description: "",
        fiscalYear: 2026,
        labelId: 1,
        bookmark: false,
        selected: false,
        tagIds: [tagId1, tagId2],
      });
      const task2Id = await db.tasks.add({
        statusCode: 0,
        name: "タスク2",
        dueDate: new Date(),
        contacts: [],
        description: "",
        fiscalYear: 2026,
        labelId: 1,
        bookmark: false,
        selected: false,
        tagIds: [tagId1],
      });

      await repository.deleteTagWithCleanup(tagId1);

      expect(await repository.getById(tagId1)).toBeUndefined();
      expect(await repository.getById(tagId2)).toBeDefined();

      const task1 = await db.tasks.get(task1Id);
      const task2 = await db.tasks.get(task2Id);
      expect(task1?.tagIds).toEqual([tagId2]);
      expect(task2?.tagIds).toEqual([]);
    });

    it("3-3. deleteTagWithCleanup でタグ削除時、全タグセットの tagIds からも対象IDが除去されること", async () => {
      const tagId1 = await repository.addTag({ name: "削除タグ" });
      const tagId2 = await repository.addTag({ name: "維持タグ" });

      const setId1 = await db.table("tagSets").add({
        name: "セットA",
        description: "",
        tagIds: [tagId1, tagId2],
      });
      const setId2 = await db.table("tagSets").add({
        name: "セットB",
        description: "",
        tagIds: [tagId1],
      });

      await repository.deleteTagWithCleanup(tagId1);

      const set1 = await db.table("tagSets").get(setId1);
      const set2 = await db.table("tagSets").get(setId2);
      expect(set1?.tagIds).toEqual([tagId2]);
      expect(set2?.tagIds).toEqual([]);
    });
  });
});
