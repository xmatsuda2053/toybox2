import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactiveControllerHost } from "lit";
import { TaskController } from "./task.controller.js";
import type { TaskRecord } from "@/db/models/task.model";
import type { CreateTaskInput } from "@/types";

/**
 * TaskRepository の Mock
 * TaskController で使用するメソッドのみを定義
 */
class FakeTaskRepository {
  public data: TaskRecord[];

  constructor(data: TaskRecord[] = []) {
    this.data = data.map((item) => ({ ...item }));
  }

  async getById(id: number): Promise<TaskRecord | undefined> {
    const item = this.data.find((t) => t.id === id);
    return item ? { ...item } : undefined;
  }

  async add(task: Omit<TaskRecord, "id">): Promise<number> {
    const id = this.data.length + 1;
    this.data.push({ id, ...task });
    return id;
  }

  async update(
    id: number,
    partial: Partial<Omit<TaskRecord, "id">>,
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
 * 【TaskController 仕様（単一タスク管理）】
 *
 * 1. 初期化・データ取得 (Initial State & Load)
 *    - [x] 1-1. taskId 指定時、初期化時に Repository から対象タスクを取得して state に保持し、host.requestUpdate() が呼ばれること
 *    - [x] 1-2. taskId 未指定時、state は undefined となり、requestUpdate() が呼ばれること
 *    - [x] 1-3. 存在しない taskId が指定された場合、state および taskId は undefined となること
 *    - [x] 1-4. hasTask ゲッターは、タスクが存在する場合に true、存在しない場合に false を返すこと
 *
 * 2. タスクID変更・リフレッシュ (Change Target Task & Refresh)
 *    - [x] 2-1. setTaskId(id) で別のタスクIDを指定した際、対象タスクが再取得されて state が更新され、requestUpdate() が呼ばれること
 *    - [x] 2-2. setTaskId(undefined) を実行した際、state および taskId が undefined にリセットされ、requestUpdate() が呼ばれること
 *    - [x] 2-3. setTaskId で存在しない taskId を指定した際、state および taskId が undefined となり、requestUpdate() が呼ばれること
 *    - [x] 2-4. refresh 実行時に Repository から最新データを再取得して state が更新され、requestUpdate() が呼ばれること
 *
 * 3. タスク新規作成 (Task Creation)
 *    - [x] 3-1. createTask 実行時に新規タスクが作成され、自身の state に反映され taskId が更新されて requestUpdate() が呼ばれること
 *    - [x] 3-2. ダイアログからの最小限入力（name, dueDate 等）で作成した際、未入力項目に安全なデフォルト値（statusCode: 0, bookmark: false, contacts: [] 等）が補完されて登録されること
 *    - [x] 3-3. 新規作成後に採番された ID が返ること
 *
 * 4. タスク更新 (Task Update)
 *    - [x] 4-1. updateTask 実行時に対象タスクが更新され、state が最新化されて requestUpdate() が呼ばれること
 *    - [x] 4-2. updateSummary を実行した際、サマリー項目のみが部分更新されること
 *    - [x] 4-3. updateProperty を実行した際、プロパティ項目のみが部分更新されること
 *    - [x] 4-4. updateStatus を実行した際、statusCode のみが更新されて requestUpdate() が呼ばれること
 *    - [x] 4-5. taskId が undefined の状態で更新メソッドを呼んでもエラーにならず何もしないこと
 *    - [x] 4-6. updateTask 実行時に updatedAt が自動的に設定されること
 *
 * 5. タスク削除 (Task Deletion)
 *    - [x] 5-1. deleteTask 実行時に Repository から対象タスクが削除され、state および taskId が undefined にクリアされて requestUpdate() が呼ばれること
 *    - [x] 5-2. taskId が undefined の状態で deleteTask を呼んでもエラーにならず何もしないこと
 *
 * 6. 状態購読（subscribe）の検証
 *    - [x] 6-1. subscribe で登録したリスナーが状態更新時に呼び出され、解除関数で購読解除できること
 */
describe("TaskController (Single Task TDD)", () => {
  let fakeRepository: FakeTaskRepository;
  let mockHost: ReturnType<typeof createMockHost>;
  let controller: TaskController;

  const testTasks: TaskRecord[] = [
    {
      id: 1,
      name: "タスク1",
      statusCode: 0,
      dueDate: new Date("2026-04-01"),
      contacts: [],
      description: "詳細1",
      fiscalYear: 2026,
      labelId: 1,
      bookmark: false,
      selected: false,
    },
    {
      id: 2,
      name: "タスク2",
      statusCode: 5,
      dueDate: new Date("2026-04-15"),
      contacts: [],
      description: "詳細2",
      fiscalYear: 2026,
      labelId: 2,
      bookmark: true,
      selected: false,
    },
  ];

  describe("1. 初期化・データ取得 (Initial State & Load)", () => {
    beforeEach(() => {
      mockHost = createMockHost();
      fakeRepository = new FakeTaskRepository(testTasks);
    });

    it("1-1. taskId 指定時、初期化時に Repository から対象タスクを取得して state に保持し、host.requestUpdate() が呼ばれること", async () => {
      controller = new TaskController(mockHost.host, fakeRepository as any, 1);
      await controller.initialized;

      expect(controller.state).toEqual(testTasks[0]);
      expect(controller.taskId).toBe(1);
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });

    it("1-2. taskId 未指定時、state は undefined となり、requestUpdate() が呼ばれること", async () => {
      controller = new TaskController(mockHost.host, fakeRepository as any);
      await controller.initialized;

      expect(controller.state).toBeUndefined();
      expect(controller.taskId).toBeUndefined();
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });

    it("1-3. 存在しない taskId が指定された場合、state および taskId は undefined となること", async () => {
      controller = new TaskController(
        mockHost.host,
        fakeRepository as any,
        999,
      );
      await controller.initialized;

      expect(controller.state).toBeUndefined();
      expect(controller.taskId).toBeUndefined();
    });

    it("1-4. hasTask ゲッターは、タスクが存在する場合に true、存在しない場合に false を返すこと", async () => {
      controller = new TaskController(mockHost.host, fakeRepository as any, 1);
      await controller.initialized;
      expect(controller.hasTask).toBe(true);

      const emptyController = new TaskController(
        mockHost.host,
        fakeRepository as any,
      );
      await emptyController.initialized;
      expect(emptyController.hasTask).toBe(false);
    });
  });

  describe("2. タスクID変更・リフレッシュ (Change Target Task & Refresh)", () => {
    beforeEach(async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeTaskRepository(testTasks);
      controller = new TaskController(mockHost.host, fakeRepository as any, 1);
      await controller.initialized;
      mockHost.requestUpdateMock.mockClear();
    });

    it("2-1. setTaskId(id) で別のタスクIDを指定した際、対象タスクが再取得されて state が更新され、requestUpdate() が呼ばれること", async () => {
      await controller.setTaskId(2);

      expect(controller.taskId).toBe(2);
      expect(controller.state).toEqual(testTasks[1]);
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });

    it("2-2. setTaskId(undefined) を実行した際、state および taskId が undefined にリセットされ、requestUpdate() が呼ばれること", async () => {
      await controller.setTaskId(undefined);

      expect(controller.taskId).toBeUndefined();
      expect(controller.state).toBeUndefined();
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });

    it("2-3. setTaskId で存在しない taskId を指定した際、state および taskId が undefined となり、requestUpdate() が呼ばれること", async () => {
      await controller.setTaskId(999);

      expect(controller.taskId).toBeUndefined();
      expect(controller.state).toBeUndefined();
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });

    it("2-4. refresh 実行時に Repository から最新データを再取得して state が更新され、requestUpdate() が呼ばれること", async () => {
      await fakeRepository.update(1, { name: "DB直接更新タスク" });

      await controller.refresh();

      expect(controller.state?.name).toBe("DB直接更新タスク");
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });
  });

  describe("3. タスク新規作成 (Task Creation)", () => {
    beforeEach(async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeTaskRepository(testTasks);
      controller = new TaskController(mockHost.host, fakeRepository as any);
      await controller.initialized;
      mockHost.requestUpdateMock.mockClear();
    });

    it("3-1. createTask 実行時に新規タスクが作成され、自身の state に反映され taskId が更新されて requestUpdate() が呼ばれること", async () => {
      const input: CreateTaskInput = {
        name: "新規タスク",
        dueDate: new Date("2026-05-01"),
        fiscalYear: 2026,
        labelId: 3,
        description: "タスクの説明",
      };

      const newId = await controller.createTask(input);

      expect(controller.taskId).toBe(newId);
      expect(controller.state?.id).toBe(newId);
      expect(controller.state?.name).toBe("新規タスク");
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });

    it("3-2. ダイアログからの最小限入力（name, dueDate 等）で作成した際、未入力項目に安全なデフォルト値（statusCode: 0, bookmark: false, contacts: [] 等）が補完されて登録されること", async () => {
      const minimalInput: CreateTaskInput = {
        name: "最小入力タスク",
        dueDate: new Date("2026-06-01"),
        fiscalYear: 2026,
        labelId: 1,
      };

      const newId = await controller.createTask(minimalInput);

      expect(controller.state).toBeDefined();
      expect(controller.state?.id).toBe(newId);
      expect(controller.state?.name).toBe("最小入力タスク");
      expect(controller.state?.dueDate).toEqual(new Date("2026-06-01"));
      expect(controller.state?.fiscalYear).toBe(2026);
      expect(controller.state?.labelId).toBe(1);
      expect(controller.state?.statusCode).toBe(0);
      expect(controller.state?.bookmark).toBe(false);
      expect(controller.state?.contacts).toEqual([]);
      expect(controller.state?.description).toBe("");
    });

    it("3-3. 新規作成後に採番された ID が返ること", async () => {
      const input: CreateTaskInput = {
        name: "採番確認タスク",
        dueDate: new Date("2026-05-01"),
        fiscalYear: 2026,
        labelId: 1,
      };

      const newId = await controller.createTask(input);

      expect(typeof newId).toBe("number");
      expect(newId).toBeGreaterThan(0);
    });
  });

  describe("4. タスク更新 (Task Update)", () => {
    beforeEach(async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeTaskRepository(testTasks);
      controller = new TaskController(mockHost.host, fakeRepository as any, 1);
      await controller.initialized;
      mockHost.requestUpdateMock.mockClear();
    });

    it("4-1. updateTask 実行時に対象タスクが更新され、state が最新化されて requestUpdate() が呼ばれること", async () => {
      await controller.updateTask({
        name: "更新後のタスク名",
        statusCode: 5,
      });

      expect(controller.state?.name).toBe("更新後のタスク名");
      expect(controller.state?.statusCode).toBe(5);
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });

    it("4-2. updateSummary を実行した際、サマリー項目のみが部分更新されること", async () => {
      await controller.updateSummary({
        name: "サマリーのみ更新",
        description: "新しい説明文",
      });

      expect(controller.state?.name).toBe("サマリーのみ更新");
      expect(controller.state?.description).toBe("新しい説明文");
      expect(controller.state?.fiscalYear).toBe(testTasks[0].fiscalYear);
      expect(controller.state?.labelId).toBe(testTasks[0].labelId);
    });

    it("4-3. updateProperty を実行した際、プロパティ項目のみが部分更新されること", async () => {
      await controller.updateProperty({
        bookmark: true,
        labelId: 99,
      });

      expect(controller.state?.bookmark).toBe(true);
      expect(controller.state?.labelId).toBe(99);
      expect(controller.state?.name).toBe(testTasks[0].name);
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });

    it("4-4. updateStatus を実行した際、statusCode のみが更新されて requestUpdate() が呼ばれること", async () => {
      await controller.updateStatus(9);

      expect(controller.state?.statusCode).toBe(9);
      expect(controller.state?.name).toBe(testTasks[0].name);
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });

    it("4-5. taskId が undefined の状態で更新メソッドを呼んでもエラーにならず何もしないこと", async () => {
      const emptyController = new TaskController(
        mockHost.host,
        fakeRepository as any,
      );
      await emptyController.initialized;

      await expect(
        emptyController.updateTask({ name: "テスト" }),
      ).resolves.not.toThrow();
      await expect(
        emptyController.updateStatus(5),
      ).resolves.not.toThrow();
      expect(emptyController.state).toBeUndefined();
    });

    it("4-6. updateTask 実行時に updatedAt が自動的に設定されること", async () => {
      const beforeTime = new Date(Date.now() - 1000);
      await controller.updateTask({ name: "日時更新確認" });

      expect(controller.state?.updatedAt).toBeDefined();
      expect(controller.state?.updatedAt!.getTime()).toBeGreaterThanOrEqual(
        beforeTime.getTime(),
      );
    });
  });

  describe("5. タスク削除 (Task Deletion)", () => {
    beforeEach(async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeTaskRepository(testTasks);
      controller = new TaskController(mockHost.host, fakeRepository as any, 1);
      await controller.initialized;
      mockHost.requestUpdateMock.mockClear();
    });

    it("5-1. deleteTask 実行時に Repository から対象タスクが削除され、state および taskId が undefined にクリアされて requestUpdate() が呼ばれること", async () => {
      await controller.deleteTask();

      expect(controller.taskId).toBeUndefined();
      expect(controller.state).toBeUndefined();
      expect(await fakeRepository.getById(1)).toBeUndefined();
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });

    it("5-2. taskId が undefined の状態で deleteTask を呼んでもエラーにならず何もしないこと", async () => {
      const emptyController = new TaskController(
        mockHost.host,
        fakeRepository as any,
      );
      await emptyController.initialized;

      await expect(emptyController.deleteTask()).resolves.not.toThrow();
    });
  });

  describe("6. 状態購読（subscribe）の検証", () => {
    it("6-1. subscribe で登録したリスナーが状態更新時に呼び出され、解除関数で購読解除できること", async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeTaskRepository(testTasks);
      controller = new TaskController(mockHost.host, fakeRepository as any, 1);
      await controller.initialized;

      const listenerMock = vi.fn();
      const unsubscribe = controller.subscribe(listenerMock);
      expect(typeof unsubscribe).toBe("function");

      // 状態更新（updateSummary）でリスナーが発火すること
      await controller.updateSummary({ name: "購読テスト更新" });
      expect(listenerMock).toHaveBeenCalledTimes(1);

      // 解除関数を実行
      unsubscribe();

      // 解除後は状態変更があってもリスナーが発火しないこと
      await controller.updateSummary({ name: "購読解除後更新" });
      expect(listenerMock).toHaveBeenCalledTimes(1);
    });
  });
});
