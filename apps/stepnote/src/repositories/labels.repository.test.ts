import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/db/schema/database.schema";
import { LabelRecord } from "@/db/models/navigation.model";
import { LabelsRepository } from "@/repositories/labels.repository";

/**
 * 【LabelsRepository 仕様】
 *
 * 1. データ取得・初期化
 *    - [x] 1-1. 空のDBからの全件取得で空配列 [] を返すこと
 *    - [x] 1-2. 指定したIDのラベルを取得できること
 *    - [x] 1-3. 存在しないIDの場合は undefined を返すこと
 * 2. CRUD 操作
 *    - [x] 2-1. 新規ラベルを正常に追加できること
 *    - [x] 2-2. 既存ラベルのプロパティを更新できること
 *    - [x] 2-3. 指定したIDのラベルを削除できること
 * 3. 選択状態の操作と排他制御
 *    - [x] 3-1. 非選択のラベルをトグルした際、選択状態（isSelected: true）に更新されること
 *    - [x] 3-2. あるラベルが選択中に別のラベルをトグルした際、新しく選択したラベルのみが選択状態となり、以前選択されていたラベルは解除されること（排他制御）
 *    - [x] 3-3. 既に選択中のラベルを再度トグルした際、選択解除（isSelected: false）となり、選択中ラベルが0件になること
 *    - [x] 3-4. すべてのラベルの選択状態を解除できること
 *    - [x] 3-5. 存在しないIDのラベルを反転しようとした場合、例外がスローされること
 */
describe("Label Repository Tests", () => {
  let repository: LabelsRepository;

  beforeEach(async () => {
    await db.labels.clear();
    repository = new LabelsRepository();
  });

  describe("1. データ取得・初期化", () => {
    it("1-1. 空のDBからの全件取得で空配列 [] を返すこと", async () => {
      const result: LabelRecord[] = await repository.getAll();
      expect(result).toEqual([]);
    });

    it("1-2. 指定したIDのラベルを取得できること", async () => {
      const newLabel: Omit<LabelRecord, "id"> = {
        name: "Test Label",
        description: "Test Description",
        isSelected: false,
      };

      const id = await db.labels.add(newLabel);
      const result: LabelRecord | undefined = await repository.getById(id);

      expect(result?.name).toEqual(newLabel.name);
      expect(result?.description).toEqual(newLabel.description);
      expect(result?.isSelected).toEqual(newLabel.isSelected);
    });

    it("1-3. 存在しないIDの場合は undefined を返すこと", async () => {
      const result: LabelRecord | undefined = await repository.getById(99999);
      expect(result).toBeUndefined();
    });
  });

  describe("2. CRUD 操作", () => {
    it("2-1. 新規ラベルを正常に追加できること", async () => {
      const newLabel: Omit<LabelRecord, "id"> = {
        name: "Test Label",
        description: "Test Description",
        isSelected: false,
      };

      const id = await repository.add(newLabel);
      const result: LabelRecord = (await repository.getById(id))!;

      expect(result.name).toEqual(newLabel.name);
      expect(result.description).toEqual(newLabel.description);
      expect(result.isSelected).toEqual(newLabel.isSelected);
    });

    it("2-2. 既存ラベルのプロパティを更新できること", async () => {
      const baseLabel: Omit<LabelRecord, "id"> = {
        name: "Test Label",
        description: "Test Description",
        isSelected: false,
      };

      const id = await repository.add(baseLabel);

      const updatedLabel: Partial<Omit<LabelRecord, "id">> = {
        name: "Updated Label",
        description: "Updated Description",
        isSelected: true,
      };
      await repository.update(id, updatedLabel);
      const newLabel: LabelRecord = (await repository.getById(id))!;

      expect(newLabel.name).toEqual(updatedLabel.name);
      expect(newLabel.description).toEqual(updatedLabel.description);
      expect(newLabel.isSelected).toEqual(updatedLabel.isSelected);
    });

    it("2-3. 指定したIDのラベルを削除できること", async () => {
      const newLabel: Omit<LabelRecord, "id"> = {
        name: "Test Label",
        description: "Test Description",
        isSelected: false,
      };

      const id = await repository.add(newLabel);
      await repository.delete(id);
      const result: LabelRecord | undefined = await repository.getById(id);

      expect(result).toEqual(undefined);
    });
  });

  describe("3. 選択状態の操作と排他制御", () => {
    it("3-1. 非選択のラベルをトグルした際、選択状態（isSelected: true）に更新されること", async () => {
      const baseLabel: Omit<LabelRecord, "id"> = {
        name: "Test Label",
        description: "Test Description",
        isSelected: false,
      };

      const id = await repository.add(baseLabel);
      await repository.toggleLabel(id);
      const result: LabelRecord = (await repository.getById(id))!;

      expect(result.isSelected).toBe(true);
    });

    it("3-2. あるラベルが選択中に別のラベルをトグルした際、新しく選択したラベルのみが選択状態となり、以前選択されていたラベルは解除されること（排他制御）", async () => {
      const id1 = await repository.add({
        name: "Label 1",
        description: "Description 1",
        isSelected: false,
      });
      const id2 = await repository.add({
        name: "Label 2",
        description: "Description 2",
        isSelected: false,
      });

      // Label 1 をトグル -> Label 1 が true
      await repository.toggleLabel(id1);
      expect((await repository.getById(id1))?.isSelected).toBe(true);
      expect((await repository.getById(id2))?.isSelected).toBe(false);

      // Label 2 をトグル -> Label 1 は解除され、Label 2 のみ true
      await repository.toggleLabel(id2);
      expect((await repository.getById(id1))?.isSelected).toBe(false);
      expect((await repository.getById(id2))?.isSelected).toBe(true);
    });

    it("3-3. 既に選択中のラベルを再度トグルした際、選択解除（isSelected: false）となり、選択中ラベルが0件になること", async () => {
      const id = await repository.add({
        name: "Test Label",
        description: "Test Description",
        isSelected: true,
      });

      await repository.toggleLabel(id);
      const result = (await repository.getById(id))!;

      expect(result.isSelected).toBe(false);
    });

    it("3-4. すべてのラベルの選択状態を解除できること", async () => {
      await repository.add({
        name: "Test Label",
        description: "Test Description",
        isSelected: true,
      });

      await repository.clearAllSelected();
      const result: LabelRecord[] = await repository.getAll();

      expect(result.every((label) => !label.isSelected)).toBe(true);
    });

    it("3-5. 存在しないIDのラベルを反転しようとした場合、例外がスローされること", async () => {
      await expect(repository.toggleLabel(99999)).rejects.toThrow(
        "Label with id 99999 not found",
      );
    });
  });
});
