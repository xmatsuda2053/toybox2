import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactiveControllerHost } from "lit";
import { getCurrentFiscalYear } from "@shared/utils";
import { TaskListController } from "./task-list.controller.js";
import type { TaskRecord } from "@/db/models/task.model";

/**
 * TaskRepository の Fake 実装
 */
class FakeTaskRepository {
  public data: TaskRecord[];
  constructor(data: TaskRecord[] = []) {
    this.data = data.map((item) => ({ ...item }));
  }

  async getByFiscalYear(fiscalYear: number): Promise<TaskRecord[]> {
    return this.data.filter((task) => task.fiscalYear === fiscalYear);
  }

  async getAll(): Promise<TaskRecord[]> {
    return [...this.data];
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
 * 【TaskListController 仕様】
 *
 * 1. 初期化・年度管理 (Initial State & Fiscal Year)
 *    - [x] 1-1. 年度を指定せずに初期化した場合、getCurrentFiscalYear() の当年度が初期値として設定されること
 *    - [x] 1-2. 任意の年度を指定して初期化した場合、その年度が fiscalYear に設定されること
 *    - [x] 1-3. 初期化時に Repository から指定年度のタスク一覧を取得して state に保持し、host.requestUpdate() が呼ばれること
 *
 * 2. 年度切り替え (Fiscal Year Switching)
 *    - [x] 2-1. setFiscalYear 実行時に fiscalYear が更新され、該当年度のタスク一覧が再取得されて state が更新されること
 *    - [x] 2-2. setFiscalYear 実行後に host.requestUpdate() および subscribe リスナーが呼ばれること
 *    - [x] 2-3. 同一の年度が setFiscalYear に渡された場合、不要な再取得・通知を行わないこと
 *
 * 3. 再取得・リフレッシュ (Refresh)
 *    - [x] 3-1. refresh 実行時に現在選択中の年度のタスク一覧を再取得して state が更新され、requestUpdate() が呼ばれること
 *
 * 4. 状態購読（subscribe）の検証
 *    - [x] 4-1. subscribe で登録したリスナーが状態更新時に呼び出され、解除関数で購読解除できること
 */
describe("TaskListController (TDD)", () => {
  let fakeRepository: FakeTaskRepository;
  let mockHost: ReturnType<typeof createMockHost>;
  let controller: TaskListController;

  const currentYear = getCurrentFiscalYear();
  const sampleTasks: TaskRecord[] = [
    {
      id: 1,
      name: "当年度タスク1",
      statusCode: 0,
      dueDate: new Date("2026-05-01"),
      contacts: [],
      description: "Desc 1",
      fiscalYear: currentYear,
      labelId: 1,
      bookmark: false,
      selected: false,
    },
    {
      id: 2,
      name: "当年度タスク2",
      statusCode: 5,
      dueDate: new Date("2026-06-01"),
      contacts: [],
      description: "Desc 2",
      fiscalYear: currentYear,
      labelId: 2,
      bookmark: true,
      selected: false,
    },
    {
      id: 3,
      name: "昨年度タスク",
      statusCode: 9,
      dueDate: new Date("2025-05-01"),
      contacts: [],
      description: "Desc 3",
      fiscalYear: currentYear - 1,
      labelId: 1,
      bookmark: false,
      selected: false,
    },
  ];

  describe("1. 初期化・年度管理 (Initial State & Fiscal Year)", () => {
    it("1-1. 年度を指定せずに初期化した場合、getCurrentFiscalYear() の当年度が初期値として設定されること", async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeTaskRepository(sampleTasks);
      controller = new TaskListController(mockHost.host, fakeRepository as any);
      await controller.initialized;

      expect(controller.fiscalYear).toBe(currentYear);
    });

    it("1-2. 任意の年度を指定して初期化した場合、その年度が fiscalYear に設定されること", async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeTaskRepository(sampleTasks);
      const targetYear = 2025;
      controller = new TaskListController(
        mockHost.host,
        fakeRepository as any,
        targetYear,
      );
      await controller.initialized;

      expect(controller.fiscalYear).toBe(targetYear);
    });

    it("1-3. 初期化時に Repository から指定年度のタスク一覧を取得して state に保持し、host.requestUpdate() が呼ばれること", async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeTaskRepository(sampleTasks);
      controller = new TaskListController(mockHost.host, fakeRepository as any);
      await controller.initialized;

      expect(controller.state).toHaveLength(2);
      expect(controller.state.every((t) => t.fiscalYear === currentYear)).toBe(true);
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });
  });

  describe("2. 年度切り替え (Fiscal Year Switching)", () => {
    beforeEach(async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeTaskRepository(sampleTasks);
      controller = new TaskListController(mockHost.host, fakeRepository as any);
      await controller.initialized;
      mockHost.requestUpdateMock.mockClear();
    });

    it("2-1. setFiscalYear 実行時に fiscalYear が更新され、該当年度のタスク一覧が再取得されて state が更新されること", async () => {
      const prevYear = currentYear - 1;
      await controller.setFiscalYear(prevYear);

      expect(controller.fiscalYear).toBe(prevYear);
      expect(controller.state).toHaveLength(1);
      expect(controller.state[0].fiscalYear).toBe(prevYear);
      expect(controller.state[0].name).toBe("昨年度タスク");
    });

    it("2-2. setFiscalYear 実行後に host.requestUpdate() および subscribe リスナーが呼ばれること", async () => {
      const listenerMock = vi.fn();
      controller.subscribe(listenerMock);

      await controller.setFiscalYear(currentYear - 1);

      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
      expect(listenerMock).toHaveBeenCalledTimes(1);
    });

    it("2-3. 同一の年度が setFiscalYear に渡された場合、不要な再取得・通知を行わないこと", async () => {
      const listenerMock = vi.fn();
      controller.subscribe(listenerMock);

      await controller.setFiscalYear(currentYear);

      expect(mockHost.requestUpdateMock).not.toHaveBeenCalled();
      expect(listenerMock).not.toHaveBeenCalled();
    });
  });

  describe("3. 再取得・リフレッシュ (Refresh)", () => {
    beforeEach(async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeTaskRepository(sampleTasks);
      controller = new TaskListController(mockHost.host, fakeRepository as any);
      await controller.initialized;
      mockHost.requestUpdateMock.mockClear();
    });

    it("3-1. refresh 実行時に現在選択中の年度のタスク一覧を再取得して state が更新され、requestUpdate() が呼ばれること", async () => {
      fakeRepository.data.push({
        id: 4,
        name: "後から追加された当年度タスク",
        statusCode: 0,
        dueDate: new Date("2026-07-01"),
        contacts: [],
        description: "Desc 4",
        fiscalYear: currentYear,
        labelId: 1,
        bookmark: false,
        selected: false,
      });

      await controller.refresh();

      expect(controller.state).toHaveLength(3);
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });
  });

  describe("4. 状態購読（subscribe）の検証", () => {
    it("4-1. subscribe で登録したリスナーが状態更新時に呼び出され、解除関数で購読解除できること", async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeTaskRepository(sampleTasks);
      controller = new TaskListController(mockHost.host, fakeRepository as any);
      await controller.initialized;

      const listenerMock = vi.fn();
      const unsubscribe = controller.subscribe(listenerMock);

      await controller.setFiscalYear(currentYear - 1);
      expect(listenerMock).toHaveBeenCalledTimes(1);

      unsubscribe();

      await controller.setFiscalYear(currentYear);
      expect(listenerMock).toHaveBeenCalledTimes(1);
    });
  });
});
