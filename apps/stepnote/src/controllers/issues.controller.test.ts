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

  async update(id: number, partial: Partial<Omit<IssueRecord, "id">>) {
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
 * 【IssuesController 仕様】
 *
 * 1. 初期化・データ取得 (Initial State & Load)
 *    - [x] 1-1. 初期化時に Repository から指定したtaskIdのIssue一覧を取得して state に保持し、host.requestUpdate() が呼び出されること
 *
 * 2. CRUD 操作とUI再描画 (Issue Management)
 *    - [x] 2-1. createIssue 実行時に新規Issueが追加され、state が更新されて requestUpdate() が呼ばれること
 *    - [x] 2-2. updateIssue 実行時に対象Issueが更新され、state が更新されて requestUpdate() が呼ばれること
 *    - [x] 2-3. deleteIssue 実行時に対象Issueが削除され、state が更新されて requestUpdate() が呼ばれること
 */
describe("IssuesController (TDD)", () => {
  let fakeRepository: FakeIssuesRepository;
  let mockHost: ReturnType<typeof createMockHost>;
  let controller: IssuesController;

  describe("1. 初期化・データ取得 (Initial State & Load)", () => {
    const targetTaskId = 1;
    const initData: IssueRecord[] = [
      {
        id: 1,
        taskId: targetTaskId,
        statusCode: 0,
        title: "Issue 1",
        value: "Content 1",
        dueDate: new Date("2026-05-01"),
      },
      {
        id: 2,
        taskId: targetTaskId,
        statusCode: 5,
        title: "Issue 2",
        value: "Content 2",
        dueDate: new Date("2026-05-02"),
      },
      {
        id: 3,
        taskId: 999,
        statusCode: 0,
        title: "Other Issue",
        value: "Other Content",
        dueDate: new Date("2026-05-03"),
      },
    ];

    beforeEach(async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeIssuesRepository(initData);
      controller = new IssuesController(
        mockHost.host,
        fakeRepository as any,
        targetTaskId,
      );
      await controller.initialized;
    });

    it("1-1. 初期化時に Repository から指定したtaskIdのIssue一覧を取得して state に保持し、host.requestUpdate() が呼び出されること", async () => {
      const expected = initData.filter((item) => item.taskId === targetTaskId);
      expect(controller.state).toEqual(expected);
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });
  });

  describe("2. CRUD 操作とUI再描画 (Issue Management)", () => {
    const targetTaskId = 1;

    beforeEach(async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeIssuesRepository();
      controller = new IssuesController(
        mockHost.host,
        fakeRepository as any,
        targetTaskId,
      );
      await controller.initialized;
      mockHost.requestUpdateMock.mockClear();
    });

    it("2-1. createIssue 実行時に新規Issueが追加され、state が更新されて requestUpdate() が呼ばれること", async () => {
      const newIssueData: Omit<IssueRecord, "id" | "taskId"> = {
        statusCode: 0,
        title: "新規Issue",
        value: "説明",
        dueDate: new Date("2026-06-01"),
      };

      await controller.createIssue(newIssueData);

      expect(controller.state.length).toBe(1);
      expect(controller.state[0]).toEqual({
        id: 1,
        taskId: targetTaskId,
        ...newIssueData,
      });
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });

    it("2-2. updateIssue 実行時に対象Issueが更新され、state が更新されて requestUpdate() が呼ばれること", async () => {
      await controller.createIssue({
        statusCode: 0,
        title: "初期Issue",
        value: "初期説明",
        dueDate: new Date("2026-06-01"),
      });
      mockHost.requestUpdateMock.mockClear();

      await controller.updateIssue(1, { title: "更新後Issue" });

      expect(controller.state.length).toBe(1);
      expect(controller.state[0]).toEqual({
        id: 1,
        taskId: targetTaskId,
        statusCode: 0,
        title: "更新後Issue",
        value: "初期説明",
        dueDate: new Date("2026-06-01"),
      });
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });

    it("2-3. deleteIssue 実行時に対象Issueが削除され、state が更新されて requestUpdate() が呼ばれること", async () => {
      await controller.createIssue({
        statusCode: 0,
        title: "削除対象Issue",
        value: "説明",
        dueDate: new Date("2026-06-01"),
      });
      expect(controller.state.length).toBe(1);
      mockHost.requestUpdateMock.mockClear();

      await controller.deleteIssue(1);

      expect(controller.state.length).toBe(0);
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });
  });
});
