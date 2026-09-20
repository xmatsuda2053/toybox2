import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactiveControllerHost } from "lit";
import { LogsController } from "@/controllers/logs.controller";
import type { LogRecord } from "@/db/models/journal.model";

/**
 * RepositoryのMock
 *
 * @class FakeLogsRepository
 */
class FakeLogsRepository {
  public data: LogRecord[];
  constructor(data: LogRecord[] = []) {
    this.data = data.map((item) => ({ ...item }));
  }

  async getByTaskId(taskId: number): Promise<LogRecord[]> {
    return this.data.filter((item) => item.taskId === taskId);
  }

  async add(log: Omit<LogRecord, "id">): Promise<number> {
    const id = this.data.length + 1;
    this.data.push({ id, ...log });
    return id;
  }

  async update(
    id: number,
    partial: Partial<Omit<LogRecord, "id">>,
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
 * 【LogsController 仕様（タスク連動型 Log 管理）】
 *
 * 1. 初期化・データ取得 (Initial State & Load)
 *    - [x] 1-1. taskId 指定時、初期化時に Repository から指定したtaskIdのLog一覧を取得して state に保持し、host.requestUpdate() が呼ばれること
 *    - [x] 1-2. taskId 未指定時、state は空配列 [] となり、taskId は undefined となり、host.requestUpdate() が呼ばれること
 *    - [x] 1-3. taskId ゲッターは現在対象の taskId を返すこと
 *
 * 2. タスクID変更・リフレッシュ (Change Target Task & Refresh)
 *    - [x] 2-1. setTaskId(id) で別のタスクIDを指定した際、対象のLog一覧が再取得されて state が更新され、requestUpdate() が呼ばれること
 *    - [x] 2-2. setTaskId(undefined) を実行した際、state が空配列 [] にリセットされ、taskId が undefined となり、requestUpdate() が呼ばれること
 *    - [x] 2-3. refresh 実行時に Repository から最新データを再取得して state が更新され、requestUpdate() が呼ばれること
 *
 * 3. Log 作成 (Log Creation)
 *    - [x] 3-1. createLog 実行時に新規Logが追加され、新しく採番された ID が返ること
 *    - [x] 3-2. createLog 実行後、state が最新化されて requestUpdate() が呼ばれること
 *    - [x] 3-3. taskId が undefined の場合、createLog を呼び出しても追加処理は行われず undefined が返ること
 *
 * 4. Log 更新・削除 (Log Update & Deletion)
 *    - [x] 4-1. updateLog 実行時に対象Logが更新され、state が更新されて requestUpdate() が呼ばれること
 *    - [x] 4-2. deleteLog 実行時に対象Logが削除され、state が更新されて requestUpdate() が呼ばれること
 *
 * 5. 状態購読（subscribe）の検証
 *    - [x] 5-1. subscribe で登録したリスナーが状態更新時に呼び出され、解除関数で購読解除できること
 */
describe("LogsController (TDD)", () => {
  let fakeRepository: FakeLogsRepository;
  let mockHost: ReturnType<typeof createMockHost>;
  let controller: LogsController;

  const testLogs: LogRecord[] = [
    {
      id: 1,
      taskId: 1,
      value: "Log 1-1",
      createdAt: new Date("2026-05-01"),
    },
    {
      id: 2,
      taskId: 1,
      value: "Log 1-2",
      createdAt: new Date("2026-05-02"),
    },
    {
      id: 3,
      taskId: 2,
      value: "Log 2-1",
      createdAt: new Date("2026-05-03"),
    },
  ];

  describe("1. 初期化・データ取得 (Initial State & Load)", () => {
    it("1-1. taskId 指定時、初期化時に Repository から指定したtaskIdのLog一覧を取得して state に保持し、host.requestUpdate() が呼ばれること", async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeLogsRepository(testLogs);
      controller = new LogsController(
        mockHost.host,
        fakeRepository as any,
        1,
      );
      await controller.initialized;

      expect(controller.state).toHaveLength(2);
      expect(controller.state).toEqual([testLogs[0], testLogs[1]]);
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });

    it("1-2. taskId 未指定時、state は空配列 [] となり、taskId は undefined となり、host.requestUpdate() が呼ばれること", async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeLogsRepository(testLogs);
      controller = new LogsController(mockHost.host, fakeRepository as any);
      await controller.initialized;

      expect(controller.state).toEqual([]);
      expect(controller.taskId).toBeUndefined();
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });

    it("1-3. taskId ゲッターは現在対象の taskId を返すこと", async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeLogsRepository(testLogs);
      controller = new LogsController(
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
      fakeRepository = new FakeLogsRepository(testLogs);
      controller = new LogsController(
        mockHost.host,
        fakeRepository as any,
        1,
      );
      await controller.initialized;
      mockHost.requestUpdateMock.mockClear();
    });

    it("2-1. setTaskId(id) で別のタスクIDを指定した際、対象のLog一覧が再取得されて state が更新され、requestUpdate() が呼ばれること", async () => {
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
        value: "Directly added log",
      });

      await controller.refresh();

      expect(controller.state).toHaveLength(3);
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });
  });

  describe("3. Log 作成 (Log Creation)", () => {
    beforeEach(async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeLogsRepository();
      controller = new LogsController(
        mockHost.host,
        fakeRepository as any,
        1,
      );
      await controller.initialized;
      mockHost.requestUpdateMock.mockClear();
    });

    it("3-1. createLog 実行時に新規Logが追加され、新しく採番された ID が返ること", async () => {
      const newLogData: Omit<LogRecord, "id" | "taskId"> = {
        value: "新規Log",
        createdAt: new Date("2026-06-01"),
      };

      const newId = await controller.createLog(newLogData);

      expect(newId).toBe(1);
      expect(controller.state).toHaveLength(1);
      expect(controller.state[0].id).toBe(1);
      expect(controller.state[0].taskId).toBe(1);
      expect(controller.state[0].value).toBe("新規Log");
    });

    it("3-2. createLog 実行後、state が最新化されて requestUpdate() が呼ばれること", async () => {
      await controller.createLog({
        value: "新規Log",
      });

      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });

    it("3-3. taskId が undefined の場合、createLog を呼び出しても追加処理は行われず undefined が返ること", async () => {
      await controller.setTaskId(undefined);
      mockHost.requestUpdateMock.mockClear();

      const result = await controller.createLog({
        value: "未選択時のLog",
      });

      expect(result).toBeUndefined();
      expect(controller.state).toEqual([]);
      expect(fakeRepository.data).toHaveLength(0);
    });
  });

  describe("4. Log 更新・削除 (Log Update & Deletion)", () => {
    beforeEach(async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeLogsRepository(testLogs);
      controller = new LogsController(
        mockHost.host,
        fakeRepository as any,
        1,
      );
      await controller.initialized;
      mockHost.requestUpdateMock.mockClear();
    });

    it("4-1. updateLog 実行時に対象Logが更新され、state が更新されて requestUpdate() が呼ばれること", async () => {
      await controller.updateLog(1, { value: "更新されたLog" });

      expect(controller.state[0].value).toBe("更新されたLog");
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });

    it("4-2. deleteLog 実行時に対象Logが削除され、state が更新されて requestUpdate() が呼ばれること", async () => {
      await controller.deleteLog(1);

      expect(controller.state).toHaveLength(1);
      expect(controller.state[0].id).toBe(2);
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });
  });

  describe("5. 状態購読（subscribe）の検証", () => {
    it("5-1. subscribe で登録したリスナーが状態更新時に呼び出され、解除関数で購読解除できること", async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeLogsRepository(testLogs);
      controller = new LogsController(
        mockHost.host,
        fakeRepository as any,
        1,
      );
      await controller.initialized;

      const listenerMock = vi.fn();
      const unsubscribe = controller.subscribe(listenerMock);
      expect(typeof unsubscribe).toBe("function");

      // 状態更新（updateLog）でリスナーが発火すること
      await controller.updateLog(1, { value: "購読テスト更新" });
      expect(listenerMock).toHaveBeenCalledTimes(1);

      // 解除関数を実行
      unsubscribe();

      // 解除後は状態変更があってもリスナーが発火しないこと
      await controller.updateLog(1, { value: "購読解除後更新" });
      expect(listenerMock).toHaveBeenCalledTimes(1);
    });
  });
});
