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

  async select(id: number): Promise<void> {
    this.data.forEach((t) => {
      t.selected = t.id === id;
    });
  }

  async update(id: number, partial: Partial<TaskRecord>): Promise<void> {
    const item = this.data.find((t) => t.id === id);
    if (item) {
      Object.assign(item, partial);
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
 * 【TaskListController 仕様】
 *
 * 1. 初期化・年度管理 (Initial State & Fiscal Year)
 *    - 1-1. 年度を指定せずに初期化した場合、getCurrentFiscalYear() の当年度が初期値として設定されること
 *    - 1-2. 任意の年度を指定して初期化した場合、その年度が fiscalYear に設定されること
 *    - 1-3. 初期化時に Repository から指定年度のタスク一覧を取得して state に保持し、host.requestUpdate() が呼ばれること
 *
 * 2. 年度切り替え (Fiscal Year Switching)
 *    - 2-1. setFiscalYear 実行時に fiscalYear が更新され、該当年度のタスク一覧が再取得されて state が更新されること
 *    - 2-2. setFiscalYear 実行後に host.requestUpdate() および subscribe リスナーが呼ばれること
 *    - 2-3. 同一の年度が setFiscalYear に渡された場合、不要な再取得・通知を行わないこと
 *
 * 3. 再取得・リフレッシュ (Refresh)
 *    - 3-1. refresh 実行時に現在選択中の年度のタスク一覧を再取得して state が更新され、requestUpdate() が呼ばれること
 *
 * 4. 状態購読（subscribe）の検証
 *    - 4-1. subscribe で登録したリスナーが状態更新時に呼び出され、解除関数で購読解除できること
 *
 * 5. タスク自動ソート（期限日昇順 → タスク名昇順）
 *    - 5-1. 取得したタスク一覧が、第1ソートキー「期限日（dueDate）の昇順」で整列されること
 *    - 5-2. 期限日が同一の場合、第2ソートキー「タスク名（name）の昇順（辞書順）」で整列されること
 *
 * 6. ラベル絞り込み連動（Label Filtering）
 *    - 6-1. selectedLabelId が指定された場合、そのラベルに属するタスクのみが抽出されて state に格納されること
 *    - 6-2. selectedLabelId が undefined または未指定の場合、全タスクが表示されること
 *    - 6-3. setLabelFilter 実行時にフィルタが適用され、host.requestUpdate() および subscribe リスナーが呼ばれること
 *
 * 7. タスク選択・ブックマーク状態操作
 *    - 7-1. selectTask(id) 実行時に repository.select(id) が呼ばれ、最新一覧が再読み込みされること
 *    - 7-2. toggleBookmark(id, current) 実行時に repository.update が呼ばれ、最新一覧が再読み込みされること
 *
 * 8. 検索キーワード絞り込み（Search Keyword Filtering）
 *    - 8-1. setSearchKeyword 実行時に searchKeyword が更新され、キーワードで絞り込まれた一覧が state に格納されること
 *    - 8-2. 空文字または空白のみを設定した場合、検索絞り込みが解除されて元の全件一覧が復帰すること
 *    - 8-3. 同一キーワードが渡された場合、不要な再取得・通知を行わないこと
 *
 * 9. QuickAccess フィルタリング連動（QuickAccess Filtering）
 *    - 9-1. setQuickAccessFilter 実行時に QuickAccess の条件（ブックマーク・未分類・期限・ステータス等）が適用されて state が更新されること
 *    - 9-2. setQuickAccessFilter 実行後に host.requestUpdate() および subscribe リスナーが呼ばれること
 *    - 9-3. QuickAccess フィルタを解除（デフォルト状態）した場合、元の条件の一覧に復帰すること
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

  describe("5. タスク自動ソート（期限日昇順 → タスク名昇順）", () => {
    it("5-1. 取得したタスク一覧が、第1ソートキー「期限日（dueDate）の昇順」で整列されること", async () => {
      mockHost = createMockHost();
      const sortSampleTasks: TaskRecord[] = [
        {
          id: 1,
          name: "タスクB（遅い期限）",
          statusCode: 0,
          dueDate: new Date("2026-08-01"),
          contacts: [],
          description: "",
          fiscalYear: currentYear,
          labelId: 1,
          bookmark: false,
          selected: false,
        },
        {
          id: 2,
          name: "タスクA（早い期限）",
          statusCode: 0,
          dueDate: new Date("2026-04-01"),
          contacts: [],
          description: "",
          fiscalYear: currentYear,
          labelId: 1,
          bookmark: false,
          selected: false,
        },
      ];
      fakeRepository = new FakeTaskRepository(sortSampleTasks);
      controller = new TaskListController(mockHost.host, fakeRepository as any);
      await controller.initialized;

      expect(controller.state).toHaveLength(2);
      expect(controller.state[0].name).toBe("タスクA（早い期限）");
      expect(controller.state[1].name).toBe("タスクB（遅い期限）");
    });

    it("5-2. 期限日が同一の場合、第2ソートキー「タスク名（name）の昇順（辞書順）」で整列されること", async () => {
      mockHost = createMockHost();
      const sameDateTasks: TaskRecord[] = [
        {
          id: 1,
          name: "りんごタスク",
          statusCode: 0,
          dueDate: new Date("2026-05-01"),
          contacts: [],
          description: "",
          fiscalYear: currentYear,
          labelId: 1,
          bookmark: false,
          selected: false,
        },
        {
          id: 2,
          name: "あさがおタスク",
          statusCode: 0,
          dueDate: new Date("2026-05-01"),
          contacts: [],
          description: "",
          fiscalYear: currentYear,
          labelId: 1,
          bookmark: false,
          selected: false,
        },
        {
          id: 3,
          name: "みかんタスク",
          statusCode: 0,
          dueDate: new Date("2026-05-01"),
          contacts: [],
          description: "",
          fiscalYear: currentYear,
          labelId: 1,
          bookmark: false,
          selected: false,
        },
      ];
      fakeRepository = new FakeTaskRepository(sameDateTasks);
      controller = new TaskListController(mockHost.host, fakeRepository as any);
      await controller.initialized;

      expect(controller.state.map((t) => t.name)).toEqual([
        "あさがおタスク",
        "みかんタスク",
        "りんごタスク",
      ]);
    });
  });

  describe("6. ラベル絞り込み連動（Label Filtering）", () => {
    it("6-1. selectedLabelId が指定された場合、そのラベルに属するタスクのみが抽出されて state に格納されること", async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeTaskRepository(sampleTasks);
      controller = new TaskListController(mockHost.host, fakeRepository as any);
      await controller.initialized;

      await controller.setLabelFilter(1);

      expect(controller.state).toHaveLength(1);
      expect(controller.state[0].labelId).toBe(1);
      expect(controller.state[0].name).toBe("当年度タスク1");
    });

    it("6-2. selectedLabelId が undefined または未指定の場合、全タスクが表示されること", async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeTaskRepository(sampleTasks);
      controller = new TaskListController(mockHost.host, fakeRepository as any);
      await controller.initialized;

      await controller.setLabelFilter(1);
      expect(controller.state).toHaveLength(1);

      await controller.setLabelFilter(undefined);
      expect(controller.state).toHaveLength(2);
    });

    it("6-3. setLabelFilter 実行時にフィルタが適用され、host.requestUpdate() および subscribe リスナーが呼ばれること", async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeTaskRepository(sampleTasks);
      controller = new TaskListController(mockHost.host, fakeRepository as any);
      await controller.initialized;
      mockHost.requestUpdateMock.mockClear();

      const listenerMock = vi.fn();
      controller.subscribe(listenerMock);

      await controller.setLabelFilter(2);

      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
      expect(listenerMock).toHaveBeenCalledTimes(1);
      expect(controller.state).toHaveLength(1);
      expect(controller.state[0].labelId).toBe(2);
    });
  });

  describe("7. タスク選択・ブックマーク状態操作", () => {
    it("7-1. selectTask(id) 実行時に repository.select(id) が呼ばれ、最新一覧が再読み込みされること", async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeTaskRepository(sampleTasks);
      controller = new TaskListController(mockHost.host, fakeRepository as any);
      await controller.initialized;

      await controller.selectTask(1);

      expect(controller.state.find((t) => t.id === 1)?.selected).toBe(true);
      expect(controller.state.find((t) => t.id === 2)?.selected).toBe(false);
    });

    it("7-2. toggleBookmark(id, current) 実行時に repository.update が呼ばれ、最新一覧が再読み込みされること", async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeTaskRepository(sampleTasks);
      controller = new TaskListController(mockHost.host, fakeRepository as any);
      await controller.initialized;

      await controller.toggleBookmark(1, false);

      expect(controller.state.find((t) => t.id === 1)?.bookmark).toBe(true);

      await controller.toggleBookmark(1, true);

      expect(controller.state.find((t) => t.id === 1)?.bookmark).toBe(false);
    });
  });

  describe("8. 検索キーワード絞り込み（Search Keyword Filtering）", () => {
    it("8-1. setSearchKeyword 実行時に searchKeyword が更新され、キーワードで絞り込まれた一覧が state に格納されること", async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeTaskRepository(sampleTasks);
      controller = new TaskListController(mockHost.host, fakeRepository as any);
      await controller.initialized;

      expect(controller.searchKeyword).toBe("");

      await controller.setSearchKeyword("タスク1");

      expect(controller.searchKeyword).toBe("タスク1");
      expect(controller.state.length).toBe(1);
      expect(controller.state[0].name).toBe("当年度タスク1");
    });

    it("8-2. 空文字または空白のみを設定した場合、検索絞り込みが解除されて元の全件一覧が復帰すること", async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeTaskRepository(sampleTasks);
      controller = new TaskListController(mockHost.host, fakeRepository as any);
      await controller.initialized;

      await controller.setSearchKeyword("タスク1");
      expect(controller.state.length).toBe(1);

      await controller.setSearchKeyword("   ");
      expect(controller.searchKeyword).toBe("");
      expect(controller.state.length).toBe(2);
    });

    it("8-3. 同一キーワードが渡された場合、不要な再取得・通知を行わないこと", async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeTaskRepository(sampleTasks);
      controller = new TaskListController(mockHost.host, fakeRepository as any);
      await controller.initialized;

      await controller.setSearchKeyword("タスク1");
      mockHost.requestUpdateMock.mockClear();

      await controller.setSearchKeyword("タスク1");
      expect(mockHost.requestUpdateMock).not.toHaveBeenCalled();
    });
  });

  describe("9. QuickAccess フィルタリング連動（QuickAccess Filtering）", () => {
    it("9-1. setQuickAccessFilter 実行時に QuickAccess の条件（ブックマーク・未分類・期限・ステータス等）が適用されて state が更新されること", async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeTaskRepository(sampleTasks);
      controller = new TaskListController(mockHost.host, fakeRepository as any);
      await controller.initialized;

      // sampleTasks[0] は bookmark: false, sampleTasks[1] は bookmark: true
      await controller.setQuickAccessFilter({ isBookmarkSelected: true });

      expect(controller.quickAccess?.isBookmarkSelected).toBe(true);
      expect(controller.state.length).toBe(1);
      expect(controller.state[0].bookmark).toBe(true);
    });

    it("9-2. setQuickAccessFilter 実行後に host.requestUpdate() および subscribe リスナーが呼ばれること", async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeTaskRepository(sampleTasks);
      controller = new TaskListController(mockHost.host, fakeRepository as any);
      await controller.initialized;

      const listenerMock = vi.fn();
      controller.subscribe(listenerMock);

      await controller.setQuickAccessFilter({ isBookmarkSelected: true });

      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
      expect(listenerMock).toHaveBeenCalledTimes(1);
    });

    it("9-3. QuickAccess フィルタを解除（未指定またはデフォルト）した場合、元の条件の一覧に復帰すること", async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeTaskRepository(sampleTasks);
      controller = new TaskListController(mockHost.host, fakeRepository as any);
      await controller.initialized;

      await controller.setQuickAccessFilter({ isBookmarkSelected: true });
      expect(controller.state.length).toBe(1);

      await controller.setQuickAccessFilter(undefined);
      expect(controller.state.length).toBe(2);
    });
  });
});

