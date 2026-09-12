import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/db/schema/database.schema";
import type { NoteRecord } from "@/db/models/journal.model";
import { NotesRepository } from "@/repositories/notes.repository";

/**
 * 【NotesRepository 仕様】
 *
 * 1. データ取得・初期化
 *    - [x] 1-1. 指定したtaskIdに紐づくNoteが存在しない場合は空配列 [] を返すこと
 *    - [x] 1-2. 指定したtaskIdのNoteリストを取得できること
 * 2. CRUD 操作
 *    - [x] 2-1. 新規Noteを正常に追加できること
 *    - [x] 2-2. 既存Noteのプロパティを更新できること
 *    - [x] 2-3. 指定したidのNoteを削除できること
 */
describe("notes repository tests", () => {
  let repository: NotesRepository;

  beforeEach(async () => {
    await db.notes.clear();
    repository = new NotesRepository();
  });

  describe("1. データ取得・初期化", () => {
    it("1-1. 指定したtaskIdに紐づくNoteが存在しない場合は空配列 [] を返すこと", async () => {
      const result: NoteRecord[] = await repository.getByTaskId(99999);
      expect(result).toEqual([]);
    });

    it("1-2. 指定したtaskIdのNoteリストを取得できること", async () => {
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
      expect(result[0].value).toEqual(note1.value);
      expect(result[0].taskId).toEqual(1);
      expect(result[1].value).toEqual(note2.value);
      expect(result[1].taskId).toEqual(1);
    });
  });

  describe("2. CRUD 操作", () => {
    it("2-1. 新規Noteを正常に追加できること", async () => {
      const newNote: Omit<NoteRecord, "id"> = {
        taskId: 1,
        value: "New Note Entry",
        createdAt: new Date("2026-05-01T09:00:00"),
        updatedAt: new Date("2026-05-01T09:00:00"),
      };

      const id = await repository.add(newNote);
      const result = await db.notes.get(id);

      expect(result).toBeDefined();
      expect(result?.id).toEqual(id);
      expect(result?.taskId).toEqual(newNote.taskId);
      expect(result?.value).toEqual(newNote.value);
      expect(result?.createdAt).toEqual(newNote.createdAt);
      expect(result?.updatedAt).toEqual(newNote.updatedAt);
    });

    it("2-2. 既存Noteのプロパティを更新できること", async () => {
      const baseNote: Omit<NoteRecord, "id"> = {
        taskId: 1,
        value: "Base Note",
        createdAt: new Date("2026-05-01T09:00:00"),
        updatedAt: new Date("2026-05-01T09:00:00"),
      };

      const id = await repository.add(baseNote);

      const updatedNote: Partial<Omit<NoteRecord, "id">> = {
        value: "Updated Note Content",
        updatedAt: new Date("2026-05-01T10:00:00"),
      };
      await repository.update(id, updatedNote);
      const result = await db.notes.get(id);

      expect(result).toBeDefined();
      expect(result?.value).toEqual(updatedNote.value);
      expect(result?.updatedAt).toEqual(updatedNote.updatedAt);
      expect(result?.createdAt).toEqual(baseNote.createdAt);
      expect(result?.taskId).toEqual(baseNote.taskId);
    });

    it("2-3. 指定したidのNoteを削除できること", async () => {
      const newNote: Omit<NoteRecord, "id"> = {
        taskId: 1,
        value: "Test Note",
        createdAt: new Date("2026-05-01T09:00:00"),
      };

      const id = await repository.add(newNote);
      await repository.delete(id);
      const result = await db.notes.get(id);

      expect(result).toBeUndefined();
    });
  });
});
