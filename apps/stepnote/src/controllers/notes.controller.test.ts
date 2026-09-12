import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactiveControllerHost } from "lit";
import { NotesController } from "@/controllers/notes.controller";
import type { NoteRecord } from "@/db/models/journal.model";

/**
 * RepositoryのMock
 *
 * @class FakeNotesRepository
 */
class FakeNotesRepository {
  public data: NoteRecord[];
  constructor(data: NoteRecord[] = []) {
    this.data = data.map((item) => ({ ...item }));
  }

  async getByTaskId(taskId: number): Promise<NoteRecord[]> {
    return this.data.filter((item) => item.taskId === taskId);
  }

  async add(note: Omit<NoteRecord, "id">): Promise<number> {
    const id = this.data.length + 1;
    this.data.push({ id, ...note });
    return id;
  }

  async update(id: number, partial: Partial<Omit<NoteRecord, "id">>) {
    const index = this.data.findIndex((item) => item.id === id);
    if (index !== -1) {
      this.data[index] = { ...this.data[index], ...partial };
    }
  }

  async delete(id: number) {
    const index = this.data.findIndex((item) => item.id === id);
    if (index !== -1) {
      this.data.splice(index, 1);
    }
  }
}

/**
 * モック作成
 *
 * @return {*}
 */
const createMockHost = () => {
  const requestUpdateMock = vi.fn();
  const host: ReactiveControllerHost = {
    addController: vi.fn(),
    removeController: vi.fn(),
    requestUpdate: requestUpdateMock,
    updateComplete: Promise.resolve(true),
  };
  return { host, requestUpdateMock };
};

/**
 * 【NotesController 仕様】
 *
 * 1. 初期化・データ取得 (Initial State & Load)
 *    - [x] 1-1. 初期化時に Repository から指定したtaskIdのNote一覧を取得して state に保持し、host.requestUpdate() が呼び出されること
 *
 * 2. CRUD 操作とUI再描画 (Note Management)
 *    - [x] 2-1. createNote 実行時に新規Noteが追加され、state が更新されて requestUpdate() が呼ばれること
 *    - [x] 2-2. updateNote 実行時に対象Noteが更新され、state が更新されて requestUpdate() が呼ばれること
 *    - [x] 2-3. deleteNote 実行時に対象Noteが削除され、state が更新されて requestUpdate() が呼ばれること
 */
describe("NotesController (TDD)", () => {
  let fakeRepository: FakeNotesRepository;
  let mockHost: ReturnType<typeof createMockHost>;
  let controller: NotesController;

  describe("1. 初期化・データ取得 (Initial State & Load)", () => {
    const targetTaskId = 1;
    const initData: NoteRecord[] = [
      {
        id: 1,
        taskId: targetTaskId,
        value: "Note 1",
        createdAt: new Date("2026-05-01"),
      },
      {
        id: 2,
        taskId: targetTaskId,
        value: "Note 2",
        createdAt: new Date("2026-05-02"),
      },
      {
        id: 3,
        taskId: 999,
        value: "Other Note",
        createdAt: new Date("2026-05-03"),
      },
    ];

    beforeEach(async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeNotesRepository(initData);
      controller = new NotesController(
        mockHost.host,
        fakeRepository as any,
        targetTaskId,
      );
      await controller.initialized;
    });

    it("1-1. 初期化時に Repository から指定したtaskIdのNote一覧を取得して state に保持し、host.requestUpdate() が呼び出されること", async () => {
      const expected = initData.filter((item) => item.taskId === targetTaskId);
      expect(controller.state).toEqual(expected);
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });
  });

  describe("2. CRUD 操作とUI再描画 (Note Management)", () => {
    const targetTaskId = 1;

    beforeEach(async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeNotesRepository();
      controller = new NotesController(
        mockHost.host,
        fakeRepository as any,
        targetTaskId,
      );
      await controller.initialized;
      mockHost.requestUpdateMock.mockClear();
    });

    it("2-1. createNote 実行時に新規Noteが追加され、state が更新されて requestUpdate() が呼ばれること", async () => {
      const newNoteData: Omit<NoteRecord, "id" | "taskId"> = {
        value: "新規Note",
        createdAt: new Date("2026-06-01"),
      };

      await controller.createNote(newNoteData);

      expect(controller.state.length).toBe(1);
      expect(controller.state[0]).toEqual({
        id: 1,
        taskId: targetTaskId,
        ...newNoteData,
      });
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });

    it("2-2. updateNote 実行時に対象Noteが更新され、state が更新されて requestUpdate() が呼ばれること", async () => {
      await controller.createNote({
        value: "初期Note",
        createdAt: new Date("2026-06-01"),
      });
      mockHost.requestUpdateMock.mockClear();

      await controller.updateNote(1, { value: "更新後Note" });

      expect(controller.state.length).toBe(1);
      expect(controller.state[0]).toEqual({
        id: 1,
        taskId: targetTaskId,
        value: "更新後Note",
        createdAt: new Date("2026-06-01"),
      });
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });

    it("2-3. deleteNote 実行時に対象Noteが削除され、state が更新されて requestUpdate() が呼ばれること", async () => {
      await controller.createNote({
        value: "削除対象Note",
        createdAt: new Date("2026-06-01"),
      });
      expect(controller.state.length).toBe(1);
      mockHost.requestUpdateMock.mockClear();

      await controller.deleteNote(1);

      expect(controller.state.length).toBe(0);
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });
  });
});
