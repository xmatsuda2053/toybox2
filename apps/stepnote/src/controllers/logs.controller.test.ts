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

  async update(id: number, partial: Partial<Omit<LogRecord, "id">>) {
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
 * 【LogsController 仕様】
 *
 * 1. 初期化・データ取得 (Initial State & Load)
 *    - [x] 1-1. 初期化時に Repository から指定したtaskIdのLog一覧を取得して state に保持し、host.requestUpdate() が呼び出されること
 *
 * 2. CRUD 操作とUI再描画 (Log Management)
 *    - [x] 2-1. createLog 実行時に新規Logが追加され、state が更新されて requestUpdate() が呼ばれること
 *    - [x] 2-2. updateLog 実行時に対象Logが更新され、state が更新されて requestUpdate() が呼ばれること
 *    - [x] 2-3. deleteLog 実行時に対象Logが削除され、state が更新されて requestUpdate() が呼ばれること
 */
describe("LogsController (TDD)", () => {
  let fakeRepository: FakeLogsRepository;
  let mockHost: ReturnType<typeof createMockHost>;
  let controller: LogsController;

  describe("1. 初期化・データ取得 (Initial State & Load)", () => {
    const targetTaskId = 1;
    const initData: LogRecord[] = [
      {
        id: 1,
        taskId: targetTaskId,
        value: "Log 1",
        createdAt: new Date("2026-05-01"),
      },
      {
        id: 2,
        taskId: targetTaskId,
        value: "Log 2",
        createdAt: new Date("2026-05-02"),
      },
      {
        id: 3,
        taskId: 999,
        value: "Other Log",
        createdAt: new Date("2026-05-03"),
      },
    ];

    beforeEach(async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeLogsRepository(initData);
      controller = new LogsController(
        mockHost.host,
        fakeRepository as any,
        targetTaskId,
      );
      await controller.initialized;
    });

    it("1-1. 初期化時に Repository から指定したtaskIdのLog一覧を取得して state に保持し、host.requestUpdate() が呼び出されること", async () => {
      const expected = initData.filter((item) => item.taskId === targetTaskId);
      expect(controller.state).toEqual(expected);
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });
  });

  describe("2. CRUD 操作とUI再描画 (Log Management)", () => {
    const targetTaskId = 1;

    beforeEach(async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeLogsRepository();
      controller = new LogsController(
        mockHost.host,
        fakeRepository as any,
        targetTaskId,
      );
      await controller.initialized;
      mockHost.requestUpdateMock.mockClear();
    });

    it("2-1. createLog 実行時に新規Logが追加され、state が更新されて requestUpdate() が呼ばれること", async () => {
      const newLogData: Omit<LogRecord, "id" | "taskId"> = {
        value: "新規Log",
        createdAt: new Date("2026-06-01"),
      };

      await controller.createLog(newLogData);

      expect(controller.state.length).toBe(1);
      expect(controller.state[0]).toEqual({
        id: 1,
        taskId: targetTaskId,
        ...newLogData,
      });
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });

    it("2-2. updateLog 実行時に対象Logが更新され、state が更新されて requestUpdate() が呼ばれること", async () => {
      await controller.createLog({
        value: "初期Log",
        createdAt: new Date("2026-06-01"),
      });
      mockHost.requestUpdateMock.mockClear();

      await controller.updateLog(1, { value: "更新後Log" });

      expect(controller.state.length).toBe(1);
      expect(controller.state[0]).toEqual({
        id: 1,
        taskId: targetTaskId,
        value: "更新後Log",
        createdAt: new Date("2026-06-01"),
      });
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });

    it("2-3. deleteLog 実行時に対象Logが削除され、state が更新されて requestUpdate() が呼ばれること", async () => {
      await controller.createLog({
        value: "削除対象Log",
        createdAt: new Date("2026-06-01"),
      });
      expect(controller.state.length).toBe(1);
      mockHost.requestUpdateMock.mockClear();

      await controller.deleteLog(1);

      expect(controller.state.length).toBe(0);
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });
  });
});
