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

  async update(
    id: number,
    partial: Partial<Omit<NoteRecord, "id">>,
  ): Promise<void> {
    const index = this.data.findIndex((item) => item.id === id);
    if (index !== -1) {
      this.data[index] = { ...this.data[index], ...partial };
    }
  }

  async delete(id: number): Promise<void> {
    const index = this.data.findIndex((item) => item.id === id);
    if (index !== -1) {
      this.data.splice(index, 1);
    }
  }
}

/**
 * モックホスト作成
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
 * 【NotesController 仕様（タスク連動型 Note 管理）】
 *
 * 1. 初期化・データ取得 (Initial State & Load)
 *    - [x] 1-1. taskId 指定時、初期化時に Repository から指定したtaskIdのNote一覧を取得して state に保持し、host.requestUpdate() が呼ばれること
 *    - [x] 1-2. taskId 未指定時、state は空配列 [] となり、taskId は undefined となり、host.requestUpdate() が呼ばれること
 *    - [x] 1-3. taskId ゲッターは現在対象の taskId を返すこと
 *
 * 2. タスクID変更・リフレッシュ (Change Target Task & Refresh)
 *    - [x] 2-1. setTaskId(id) で別のタスクIDを指定した際、対象のNote一覧が再取得されて state が更新され、requestUpdate() が呼ばれること
 *    - [x] 2-2. setTaskId(undefined) を実行した際、state が空配列 [] にリセットされ、taskId が undefined となり、requestUpdate() が呼ばれること
 *    - [x] 2-3. refresh 実行時に Repository から最新データを再取得して state が更新され、requestUpdate() が呼ばれること
 *
 * 3. Note 作成 (Note Creation)
 *    - [x] 3-1. createNote 実行時に新規Noteが追加され、新しく採番された ID が返ること
 *    - [x] 3-2. createNote 実行後、state が最新化されて requestUpdate() が呼ばれること
 *    - [x] 3-3. taskId が undefined の場合、createNote を呼び出しても追加処理は行われず undefined が返ること
 *
 * 4. Note 更新・削除 (Note Update & Deletion)
 *    - [x] 4-1. updateNote 実行時に対象Noteが更新され、state が更新されて requestUpdate() が呼ばれること
 *    - [x] 4-2. deleteNote 実行時に対象Noteが削除され、state が更新されて requestUpdate() が呼ばれること
 */
describe("NotesController (TDD)", () => {
  let fakeRepository: FakeNotesRepository;
  let mockHost: ReturnType<typeof createMockHost>;
  let controller: NotesController;

  const testNotes: NoteRecord[] = [
    {
      id: 1,
      taskId: 1,
      value: "Note 1-1",
      createdAt: new Date("2026-05-01"),
    },
    {
      id: 2,
      taskId: 1,
      value: "Note 1-2",
      createdAt: new Date("2026-05-02"),
    },
    {
      id: 3,
      taskId: 2,
      value: "Note 2-1",
      createdAt: new Date("2026-05-03"),
    },
  ];

  describe("1. 初期化・データ取得 (Initial State & Load)", () => {
    it("1-1. taskId 指定時、初期化時に Repository から指定したtaskIdのNote一覧を取得して state に保持し、host.requestUpdate() が呼ばれること", async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeNotesRepository(testNotes);
      controller = new NotesController(
        mockHost.host,
        fakeRepository as any,
        1,
      );
      await controller.initialized;

      expect(controller.state).toHaveLength(2);
      expect(controller.state).toEqual([testNotes[0], testNotes[1]]);
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });

    it("1-2. taskId 未指定時、state は空配列 [] となり、taskId は undefined となり、host.requestUpdate() が呼ばれること", async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeNotesRepository(testNotes);
      controller = new NotesController(mockHost.host, fakeRepository as any);
      await controller.initialized;

      expect(controller.state).toEqual([]);
      expect(controller.taskId).toBeUndefined();
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });

    it("1-3. taskId ゲッターは現在対象の taskId を返すこと", async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeNotesRepository(testNotes);
      controller = new NotesController(
        mockHost.host,
        fakeRepository as any,
        1,
      );
      await controller.initialized;

      expect(controller.taskId).toBe(1);
    });
  });

  describe("2. タスクID変更・リフレッシュ (Change Target Task & Refresh)", () => {
    beforeEach(async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeNotesRepository(testNotes);
      controller = new NotesController(
        mockHost.host,
        fakeRepository as any,
        1,
      );
      await controller.initialized;
      mockHost.requestUpdateMock.mockClear();
    });

    it("2-1. setTaskId(id) で別のタスクIDを指定した際、対象のNote一覧が再取得されて state が更新され、requestUpdate() が呼ばれること", async () => {
      await controller.setTaskId(2);

      expect(controller.taskId).toBe(2);
      expect(controller.state).toHaveLength(1);
      expect(controller.state[0].id).toBe(3);
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });

    it("2-2. setTaskId(undefined) を実行した際、state が空配列 [] にリセットされ、taskId が undefined となり、requestUpdate() が呼ばれること", async () => {
      await controller.setTaskId(undefined);

      expect(controller.taskId).toBeUndefined();
      expect(controller.state).toEqual([]);
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });

    it("2-3. refresh 実行時に Repository から最新データを再取得して state が更新され、requestUpdate() が呼ばれること", async () => {
      fakeRepository.data.push({
        id: 4,
        taskId: 1,
        value: "Directly added note",
      });

      await controller.refresh();

      expect(controller.state).toHaveLength(3);
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });
  });

  describe("3. Note 作成 (Note Creation)", () => {
    beforeEach(async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeNotesRepository();
      controller = new NotesController(
        mockHost.host,
        fakeRepository as any,
        1,
      );
      await controller.initialized;
      mockHost.requestUpdateMock.mockClear();
    });

    it("3-1. createNote 実行時に新規Noteが追加され、新しく採番された ID が返ること", async () => {
      const newNoteData: Omit<NoteRecord, "id" | "taskId"> = {
        value: "新規Note",
        createdAt: new Date("2026-06-01"),
      };

      const newId = await controller.createNote(newNoteData);

      expect(newId).toBe(1);
      expect(controller.state).toHaveLength(1);
      expect(controller.state[0].id).toBe(1);
      expect(controller.state[0].taskId).toBe(1);
      expect(controller.state[0].value).toBe("新規Note");
    });

    it("3-2. createNote 実行後、state が最新化されて requestUpdate() が呼ばれること", async () => {
      await controller.createNote({
        value: "新規Note",
      });

      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });

    it("3-3. taskId が undefined の場合、createNote を呼び出しても追加処理は行われず undefined が返ること", async () => {
      await controller.setTaskId(undefined);
      mockHost.requestUpdateMock.mockClear();

      const result = await controller.createNote({
        value: "未選択時のNote",
      });

      expect(result).toBeUndefined();
      expect(controller.state).toEqual([]);
      expect(fakeRepository.data).toHaveLength(0);
    });
  });

  describe("4. Note 更新・削除 (Note Update & Deletion)", () => {
    beforeEach(async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeNotesRepository(testNotes);
      controller = new NotesController(
        mockHost.host,
        fakeRepository as any,
        1,
      );
      await controller.initialized;
      mockHost.requestUpdateMock.mockClear();
    });

    it("4-1. updateNote 実行時に対象Noteが更新され、state が更新されて requestUpdate() が呼ばれること", async () => {
      await controller.updateNote(1, { value: "更新されたNote" });

      expect(controller.state[0].value).toBe("更新されたNote");
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });

    it("4-2. deleteNote 実行時に対象Noteが削除され、state が更新されて requestUpdate() が呼ばれること", async () => {
      await controller.deleteNote(1);

      expect(controller.state).toHaveLength(1);
      expect(controller.state[0].id).toBe(2);
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });
  });
});
