import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactiveControllerHost } from "lit";
import { IssuesController } from "@/controllers/issues.controller";
import type { IssueRecord } from "@/db/models/task.model";

/**
 * RepositoryのMock
 *
 * @class FakeIssuesRepository
 */
class FakeIssuesRepository {
  public data: IssueRecord[];
  constructor(data: IssueRecord[] = []) {
    this.data = data.map((item) => ({ ...item }));
  }

  async getByTaskId(taskId: number): Promise<IssueRecord[]> {
    return this.data.filter((item) => item.taskId === taskId);
  }

  async add(issue: Omit<IssueRecord, "id">): Promise<number> {
    const id = this.data.length + 1;
    this.data.push({ id, ...issue });
    return id;
  }

  async update(
    id: number,
    partial: Partial<Omit<IssueRecord, "id">>,
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
 * 【IssuesController 仕様（タスク連動型 Issue 管理）】
 *
 * 1. 初期化・データ取得 (Initial State & Load)
 *    - [x] 1-1. taskId 指定時、初期化時に Repository から指定したtaskIdのIssue一覧を取得して state に保持し、host.requestUpdate() が呼ばれること
 *    - [x] 1-2. taskId 未指定時、state は空配列 [] となり、taskId は undefined となり、host.requestUpdate() が呼ばれること
 *    - [x] 1-3. taskId ゲッターは現在対象の taskId を返すこと
 *
 * 2. タスクID変更・リフレッシュ (Change Target Task & Refresh)
 *    - [x] 2-1. setTaskId(id) で別のタスクIDを指定した際、対象のIssue一覧が再取得されて state が更新され、requestUpdate() が呼ばれること
 *    - [x] 2-2. setTaskId(undefined) を実行した際、state が空配列 [] にリセットされ、taskId が undefined となり、requestUpdate() が呼ばれること
 *    - [x] 2-3. refresh 実行時に Repository から最新データを再取得して state が更新され、requestUpdate() が呼ばれること
 *
 * 3. Issue 作成 (Issue Creation)
 *    - [x] 3-1. createIssue 実行時に新規Issueが追加され、新しく採番された ID が返ること
 *    - [x] 3-2. createIssue 実行後、state が最新化されて requestUpdate() が呼ばれること
 *    - [x] 3-3. taskId が undefined の場合、createIssue を呼び出しても追加処理は行われず undefined が返ること
 *
 * 4. Issue 更新・削除 (Issue Update & Deletion)
 *    - [x] 4-1. updateIssue 実行時に対象Issueが更新され、state が更新されて requestUpdate() が呼ばれること
 *    - [x] 4-2. deleteIssue 実行時に対象Issueが削除され、state が更新されて requestUpdate() が呼ばれること
 *
 * 5. 状態購読（subscribe）の検証
 *    - [x] 5-1. subscribe で登録したリスナーが状態更新時に呼び出され、解除関数で購読解除できること
 */
describe("IssuesController (TDD)", () => {
  let fakeRepository: FakeIssuesRepository;
  let mockHost: ReturnType<typeof createMockHost>;
  let controller: IssuesController;

  const testIssues: IssueRecord[] = [
    {
      id: 1,
      taskId: 1,
      statusCode: 0,
      title: "Issue 1-1",
      value: "Content 1-1",
      dueDate: new Date("2026-05-01"),
    },
    {
      id: 2,
      taskId: 1,
      statusCode: 5,
      title: "Issue 1-2",
      value: "Content 1-2",
      dueDate: new Date("2026-05-02"),
    },
    {
      id: 3,
      taskId: 2,
      statusCode: 0,
      title: "Issue 2-1",
      value: "Content 2-1",
      dueDate: new Date("2026-05-03"),
    },
  ];

  describe("1. 初期化・データ取得 (Initial State & Load)", () => {
    it("1-1. taskId 指定時、初期化時に Repository から指定したtaskIdのIssue一覧を取得して state に保持し、host.requestUpdate() が呼ばれること", async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeIssuesRepository(testIssues);
      controller = new IssuesController(
        mockHost.host,
        fakeRepository as any,
        1,
      );
      await controller.initialized;

      expect(controller.state).toHaveLength(2);
      expect(controller.state).toEqual([testIssues[0], testIssues[1]]);
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });

    it("1-2. taskId 未指定時、state は空配列 [] となり、taskId は undefined となり、host.requestUpdate() が呼ばれること", async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeIssuesRepository(testIssues);
      controller = new IssuesController(mockHost.host, fakeRepository as any);
      await controller.initialized;

      expect(controller.state).toEqual([]);
      expect(controller.taskId).toBeUndefined();
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });

    it("1-3. taskId ゲッターは現在対象の taskId を返すこと", async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeIssuesRepository(testIssues);
      controller = new IssuesController(
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
      fakeRepository = new FakeIssuesRepository(testIssues);
      controller = new IssuesController(
        mockHost.host,
        fakeRepository as any,
        1,
      );
      await controller.initialized;
      mockHost.requestUpdateMock.mockClear();
    });

    it("2-1. setTaskId(id) で別のタスクIDを指定した際、対象のIssue一覧が再取得されて state が更新され、requestUpdate() が呼ばれること", async () => {
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
        statusCode: 0,
        title: "Added directly to repo",
        value: "Direct",
        dueDate: new Date("2026-05-04"),
      });

      await controller.refresh();

      expect(controller.state).toHaveLength(3);
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });
  });

  describe("3. Issue 作成 (Issue Creation)", () => {
    beforeEach(async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeIssuesRepository();
      controller = new IssuesController(
        mockHost.host,
        fakeRepository as any,
        1,
      );
      await controller.initialized;
      mockHost.requestUpdateMock.mockClear();
    });

    it("3-1. createIssue 実行時に新規Issueが追加され、新しく採番された ID が返ること", async () => {
      const newIssueData: Omit<IssueRecord, "id" | "taskId"> = {
        statusCode: 0,
        title: "新規Issue",
        value: "説明",
        dueDate: new Date("2026-06-01"),
      };

      const newId = await controller.createIssue(newIssueData);

      expect(newId).toBe(1);
      expect(controller.state).toHaveLength(1);
      expect(controller.state[0].id).toBe(1);
      expect(controller.state[0].taskId).toBe(1);
      expect(controller.state[0].title).toBe("新規Issue");
    });

    it("3-2. createIssue 実行後、state が最新化されて requestUpdate() が呼ばれること", async () => {
      await controller.createIssue({
        statusCode: 0,
        title: "新規Issue",
        value: "説明",
        dueDate: new Date("2026-06-01"),
      });

      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });

    it("3-3. taskId が undefined の場合、createIssue を呼び出しても追加処理は行われず undefined が返ること", async () => {
      await controller.setTaskId(undefined);
      mockHost.requestUpdateMock.mockClear();

      const result = await controller.createIssue({
        statusCode: 0,
        title: "未選択時のIssue",
        value: "説明",
        dueDate: new Date("2026-06-01"),
      });

      expect(result).toBeUndefined();
      expect(controller.state).toEqual([]);
      expect(fakeRepository.data).toHaveLength(0);
    });
  });

  describe("4. Issue 更新・削除 (Issue Update & Deletion)", () => {
    beforeEach(async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeIssuesRepository(testIssues);
      controller = new IssuesController(
        mockHost.host,
        fakeRepository as any,
        1,
      );
      await controller.initialized;
      mockHost.requestUpdateMock.mockClear();
    });

    it("4-1. updateIssue 実行時に対象Issueが更新され、state が更新されて requestUpdate() が呼ばれること", async () => {
      await controller.updateIssue(1, { title: "更新されたタイトル" });

      expect(controller.state[0].title).toBe("更新されたタイトル");
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });

    it("4-2. deleteIssue 実行時に対象Issueが削除され、state が更新されて requestUpdate() が呼ばれること", async () => {
      await controller.deleteIssue(1);

      expect(controller.state).toHaveLength(1);
      expect(controller.state[0].id).toBe(2);
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });
  });

  describe("5. 状態購読（subscribe）の検証", () => {
    it("5-1. subscribe で登録したリスナーが状態更新時に呼び出され、解除関数で購読解除できること", async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeIssuesRepository(testIssues);
      controller = new IssuesController(
        mockHost.host,
        fakeRepository as any,
        1,
      );
      await controller.initialized;

      const listenerMock = vi.fn();
      const unsubscribe = controller.subscribe(listenerMock);
      expect(typeof unsubscribe).toBe("function");

      // 状態更新（updateIssue）でリスナーが発火すること
      await controller.updateIssue(1, { title: "購読テスト更新" });
      expect(listenerMock).toHaveBeenCalledTimes(1);

      // 解除関数を実行
      unsubscribe();

      // 解除後は状態変更があってもリスナーが発火しないこと
      await controller.updateIssue(1, { title: "購読解除後更新" });
      expect(listenerMock).toHaveBeenCalledTimes(1);
    });
  });
});
