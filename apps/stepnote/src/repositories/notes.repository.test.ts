import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/db/schema/database.schema";
import type { NoteRecord } from "@/db/models/journal.model";
import { NotesRepository } from "@/repositories/notes.repository";

/**
 * 【NotesRepository 仕様】
 *
 * 1. データ取得・初期化 (Read)
 *    - [x] 1-1. 空のDBからの全件取得で空配列 [] を返すこと
 *    - [x] 1-2. 保存されている全Noteを取得できること (getAll)
 *    - [x] 1-3. 指定したIDのNoteを取得できること (getById)
 *    - [x] 1-4. 存在しないIDの場合は undefined を返すこと (getById)
 *    - [x] 1-5. 指定したtaskIdに紐づくNoteが存在しない場合は空配列 [] を返すこと (getByTaskId)
 *    - [x] 1-6. 指定したtaskIdのNoteリストを取得できること (getByTaskId)
 *
 * 2. CRUD 操作 (Create / Update / Delete)
 *    - [x] 2-1. 新規Noteを正常に追加でき、自動採番された ID が返ること
 *    - [x] 2-2. 既存Noteのプロパティを更新できること
 *    - [x] 2-3. 指定したIDのNoteを削除できること
 *    - [x] 2-4. 指定したtaskIdに紐づくNoteを一括削除できること (deleteByTaskId)
 */
describe("NotesRepository Tests", () => {
  let repository: NotesRepository;

  beforeEach(async () => {
    await db.notes.clear();
    repository = new NotesRepository();
  });

  describe("1. データ取得・初期化 (Read)", () => {
    it("1-1. 空のDBからの全件取得で空配列 [] を返すこと", async () => {
      const result: NoteRecord[] = await repository.getAll();
      expect(result).toEqual([]);
    });

    it("1-2. 保存されている全Noteを取得できること (getAll)", async () => {
      const note1: Omit<NoteRecord, "id"> = {
        taskId: 1,
        value: "Note 1",
        createdAt: new Date("2026-04-01T10:00:00"),
        updatedAt: new Date("2026-04-01T10:00:00"),
      };
      const note2: Omit<NoteRecord, "id"> = {
        taskId: 2,
        value: "Note 2",
        createdAt: new Date("2026-04-02T11:00:00"),
        updatedAt: new Date("2026-04-02T11:00:00"),
      };

      await db.notes.bulkAdd([note1, note2]);

      const result: NoteRecord[] = await repository.getAll();
      expect(result).toHaveLength(2);
      expect(result[0].value).toBe("Note 1");
      expect(result[1].value).toBe("Note 2");
    });

    it("1-3. 指定したIDのNoteを取得できること (getById)", async () => {
      const note: Omit<NoteRecord, "id"> = {
        taskId: 1,
        value: "Target Note",
        createdAt: new Date("2026-04-01T10:00:00"),
        updatedAt: new Date("2026-04-01T10:00:00"),
      };
      const id = await db.notes.add(note);

      const result: NoteRecord | undefined = await repository.getById(id);
      expect(result).toBeDefined();
      expect(result?.id).toBe(id);
      expect(result?.value).toBe("Target Note");
    });

    it("1-4. 存在しないIDの場合は undefined を返すこと (getById)", async () => {
      const result: NoteRecord | undefined = await repository.getById(99999);
      expect(result).toBeUndefined();
    });

    it("1-5. 指定したtaskIdに紐づくNoteが存在しない場合は空配列 [] を返すこと (getByTaskId)", async () => {
      const result: NoteRecord[] = await repository.getByTaskId(99999);
      expect(result).toEqual([]);
    });

    it("1-6. 指定したtaskIdのNoteリストを取得できること (getByTaskId)", async () => {
      const note1: Omit<NoteRecord, "id"> = {
        taskId: 1,
        value: "Note 1",
        createdAt: new Date("2026-04-01T10:00:00"),
        updatedAt: new Date("2026-04-01T10:00:00"),
      };
      const note2: Omit<NoteRecord, "id"> = {
        taskId: 1,
        value: "Note 2",
        createdAt: new Date("2026-04-02T11:00:00"),
        updatedAt: new Date("2026-04-02T11:00:00"),
      };
      const otherNote: Omit<NoteRecord, "id"> = {
        taskId: 2,
        value: "Other Note",
        createdAt: new Date("2026-04-03T12:00:00"),
        updatedAt: new Date("2026-04-03T12:00:00"),
      };

      await db.notes.bulkAdd([note1, note2, otherNote]);

      const result: NoteRecord[] = await repository.getByTaskId(1);
      expect(result).toHaveLength(2);
      expect(result[0].value).toBe(note1.value);
      expect(result[1].value).toBe(note2.value);
    });
  });

  describe("2. CRUD 操作 (Create / Update / Delete)", () => {
    it("2-1. 新規Noteを正常に追加でき、自動採番された ID が返ること", async () => {
      const newNote: Omit<NoteRecord, "id"> = {
        taskId: 1,
        value: "New Note Entry",
        createdAt: new Date("2026-05-01T09:00:00"),
        updatedAt: new Date("2026-05-01T09:00:00"),
      };

      const id = await repository.add(newNote);
      const result = await db.notes.get(id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(id);
      expect(result?.value).toBe(newNote.value);
    });

    it("2-2. 既存Noteのプロパティを更新できること", async () => {
      const baseNote: Omit<NoteRecord, "id"> = {
        taskId: 1,
        value: "Base Note",
        createdAt: new Date("2026-05-01T09:00:00"),
        updatedAt: new Date("2026-05-01T09:00:00"),
      };

      const id = await repository.add(baseNote);
      await repository.update(id, { value: "Updated Note Content" });
      const result = await db.notes.get(id);

      expect(result?.value).toBe("Updated Note Content");
    });

    it("2-3. 指定したIDのNoteを削除できること", async () => {
      const newNote: Omit<NoteRecord, "id"> = {
        taskId: 1,
        value: "Delete Target",
        createdAt: new Date("2026-05-01T09:00:00"),
        updatedAt: new Date("2026-05-01T09:00:00"),
      };

      const id = await repository.add(newNote);
      await repository.delete(id);
      const result = await db.notes.get(id);

      expect(result).toBeUndefined();
    });

    it("2-4. 指定したtaskIdに紐づくNoteを一括削除できること (deleteByTaskId)", async () => {
      const note1: Omit<NoteRecord, "id"> = {
        taskId: 1,
        value: "Note 1-1",
        createdAt: new Date("2026-04-01T10:00:00"),
      };
      const note2: Omit<NoteRecord, "id"> = {
        taskId: 1,
        value: "Note 1-2",
        createdAt: new Date("2026-04-02T11:00:00"),
      };
      const otherNote: Omit<NoteRecord, "id"> = {
        taskId: 2,
        value: "Note 2-1",
        createdAt: new Date("2026-04-03T12:00:00"),
      };

      await db.notes.bulkAdd([note1, note2, otherNote]);

      await repository.deleteByTaskId(1);

      const remainingTaskId1 = await repository.getByTaskId(1);
      const remainingTaskId2 = await repository.getByTaskId(2);

      expect(remainingTaskId1).toEqual([]);
      expect(remainingTaskId2).toHaveLength(1);
      expect(remainingTaskId2[0].value).toBe("Note 2-1");
    });
  });
});
