import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactiveControllerHost } from "lit";
import type { TaskRecord, IssueRecord } from "@/db/models/task.model";
import type { LabelRecord } from "@/db/models/navigation.model";
import type { TagRecord } from "@/db/models/tag.model";
import type { TaskRepository } from "@/repositories/task.repository";
import type { IssuesRepository } from "@/repositories/issues.repository";
import type { LabelsRepository } from "@/repositories/labels.repository";
import type { TagsRepository } from "@/repositories/tags.repository";
import type { TaskListQuery } from "@/db/queries/task-list.query";
import { TaskTableController } from "./task-table.controller.js";

/**
 * 【TaskTableController 仕様 (タスク一覧表示モード状態管理)】
 *
 * 1. 初期化・永続化復元
 *    - 1-1. ストレージ未設定時は fiscalYear="all", sort={ key: "dueDate", direction: "asc" } で初期化されること
 *    - 1-2. ストレージの保存値から年度選択・ソート順が復元されること
 *
 * 2. データロード（refresh）
 *    - 2-1. 全タスク・Issue集計・ラベル名・タグが結合されて rows へ格納され、再描画通知されること
 *
 * 3. フィルタ操作と永続化・選択リセット
 *    - 3-1. setFiscalYearFilter 実行時に年度が永続化され、rows が絞り込まれ、selectedIds がリセットされること
 *    - 3-2. setStatusFilter / setLabelFilter / setTagFilter / setDueFilter / setKeywordFilter により絞り込まれ、selectedIds がリセットされること
 *    - 3-3. setKeywordFilter 時に taskListQuery.searchTaskIds が利用されて横断検索が行われること
 *    - 3-4. resetFilters により年度以外の条件が初期値へ戻ること
 *
 * 4. 列ソート切替と永続化
 *    - 4-1. toggleSort で同一列を指定すると昇順/降順が反転し、別列を指定すると昇順に切り替わり、ストレージへ保存されること
 *
 * 5. チェックボックス選択管理
 *    - 5-1. toggleRowSelection で単一行の選択状態が切り替わり、selectedCount / isAllFilteredSelected / isSomeFilteredSelected が正しく算出されること
 *    - 5-2. toggleSelectAllFiltered で表示中の全行を一括選択・一括解除できること
 *    - 5-3. clearSelection で選択状態が全解除されること
 *
 * 6. ブックマークトグル
 *    - 6-1. toggleBookmark 実行時に taskRepository.update が呼ばれ、一覧が最新化されること
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

const createMockStorage = (initial?: Record<string, string>) => {
  const store = new Map<string, string>(Object.entries(initial ?? {}));
  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
  };
};

describe("TaskTableController", () => {
  let tasks: TaskRecord[];
  let issues: IssueRecord[];
  let labels: LabelRecord[];
  let tags: TagRecord[];
  let taskRepoMock: { getAll: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  let issuesRepoMock: { getAll: ReturnType<typeof vi.fn> };
  let labelsRepoMock: { getAll: ReturnType<typeof vi.fn> };
  let tagsRepoMock: { getAll: ReturnType<typeof vi.fn> };
  let queryMock: { searchTaskIds: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    tasks = [
      {
        id: 1,
        statusCode: 0,
        name: "Bタスク",
        dueDate: new Date("2026-06-01T00:00:00.000Z"),
        contacts: [{ div: "開発", name: "田中", tel: "" }],
        description: "",
        fiscalYear: 2026,
        labelId: 10,
        bookmark: false,
        selected: false,
        tagIds: [100],
      },
      {
        id: 2,
        statusCode: 5,
        name: "Aタスク",
        dueDate: new Date("2025-05-01T00:00:00.000Z"),
        contacts: [],
        description: "",
        fiscalYear: 2025,
        labelId: 20,
        bookmark: true,
        selected: false,
        tagIds: [200],
      },
    ];
    issues = [
      { id: 1, taskId: 1, statusCode: 9, title: "完了", value: "" },
      { id: 2, taskId: 1, statusCode: 0, title: "未完了", value: "" },
    ];
    labels = [
      { id: 10, name: "開発", description: "", isSelected: false },
      { id: 20, name: "運用", description: "", isSelected: false },
    ];
    tags = [
      { id: 100, name: "優先", description: "", variant: "danger" },
      { id: 200, name: "定例", description: "", variant: "neutral" },
    ];

    taskRepoMock = {
      getAll: vi.fn().mockImplementation(async () => tasks.map((t) => ({ ...t }))),
      update: vi.fn().mockImplementation(async (id: number, partial: Partial<TaskRecord>) => {
        const target = tasks.find((t) => t.id === id);
        if (target) Object.assign(target, partial);
      }),
    };
    issuesRepoMock = { getAll: vi.fn().mockResolvedValue(issues) };
    labelsRepoMock = { getAll: vi.fn().mockResolvedValue(labels) };
    tagsRepoMock = { getAll: vi.fn().mockResolvedValue(tags) };
    queryMock = { searchTaskIds: vi.fn().mockResolvedValue(new Set([1])) };
  });

  const createController = (storage = createMockStorage()) => {
    const { host, requestUpdateMock } = createMockHost();
    const controller = new TaskTableController(host, {
      taskRepository: taskRepoMock as unknown as TaskRepository,
      issuesRepository: issuesRepoMock as unknown as IssuesRepository,
      labelsRepository: labelsRepoMock as unknown as LabelsRepository,
      tagsRepository: tagsRepoMock as unknown as TagsRepository,
      taskListQuery: queryMock as unknown as TaskListQuery,
      storage,
    });
    return { controller, requestUpdateMock, storage };
  };

  describe("1. 初期化・永続化復元", () => {
    it("1-1. ストレージ未設定時はデフォルト値で初期化されること", () => {
      const { controller } = createController();
      expect(controller.filter.fiscalYear).toBe("all");
      expect(controller.sort).toEqual({ key: "dueDate", direction: "asc" });
      expect(controller.selectedCount).toBe(0);
    });

    it("1-2. ストレージの保存値から年度選択・ソート順が復元されること", () => {
      const storage = createMockStorage({
        stepnote_task_table_fiscal_year: "2025",
        stepnote_task_table_sort: '{"key":"id","direction":"desc"}',
      });
      const { controller } = createController(storage);
      expect(controller.filter.fiscalYear).toBe(2025);
      expect(controller.sort).toEqual({ key: "id", direction: "desc" });
    });
  });

  describe("2. データロード（refresh）", () => {
    it("2-1. 全タスク・Issue集計・ラベル名・タグが結合されて rows へ格納されること", async () => {
      const { controller, requestUpdateMock } = createController();
      await controller.refresh();

      expect(controller.rows.map((r) => r.task.id)).toEqual([2, 1]);
      expect(controller.rows[1].labelName).toBe("開発");
      expect(controller.rows[1].tags.map((t) => t.name)).toEqual(["優先"]);
      expect(controller.rows[1].issuesDone).toBe(1);
      expect(controller.rows[1].issuesTotal).toBe(2);
      expect(requestUpdateMock).toHaveBeenCalled();
    });
  });

  describe("3. フィルタ操作と永続化・選択リセット", () => {
    it("3-1. setFiscalYearFilter 実行時に年度が永続化され、rows が絞り込まれ、selectedIds がリセットされること", async () => {
      const { controller, storage } = createController();
      await controller.refresh();
      controller.toggleRowSelection(1);
      expect(controller.selectedCount).toBe(1);

      await controller.setFiscalYearFilter(2026);
      expect(controller.filter.fiscalYear).toBe(2026);
      expect(storage.setItem).toHaveBeenCalledWith(
        "stepnote_task_table_fiscal_year",
        "2026",
      );
      expect(controller.rows.map((r) => r.task.id)).toEqual([1]);
      expect(controller.selectedCount).toBe(0);
    });

    it("3-2. setStatusFilter / setLabelFilter / setTagFilter / setDueFilter により絞り込まれ、selectedIds がリセットされること", async () => {
      const { controller } = createController();
      await controller.refresh();
      controller.toggleRowSelection(2);

      controller.setStatusFilter(5);
      expect(controller.rows.map((r) => r.task.id)).toEqual([2]);
      expect(controller.selectedCount).toBe(0);

      controller.setStatusFilter("all");
      controller.setLabelFilter(10);
      expect(controller.rows.map((r) => r.task.id)).toEqual([1]);

      controller.setLabelFilter("all");
      controller.setTagFilter(200);
      expect(controller.rows.map((r) => r.task.id)).toEqual([2]);
    });

    it("3-3. setKeywordFilter 時に taskListQuery.searchTaskIds が利用されて横断検索が行われること", async () => {
      const { controller } = createController();
      await controller.refresh();

      await controller.setKeywordFilter("横断検索ワード");
      expect(queryMock.searchTaskIds).toHaveBeenCalledWith("横断検索ワード");
      expect(controller.rows.map((r) => r.task.id)).toEqual([1]);
    });

    it("3-4. resetFilters により年度以外の条件が初期値へ戻ること", async () => {
      const { controller } = createController();
      await controller.refresh();
      await controller.setFiscalYearFilter(2026);
      controller.setStatusFilter(5);
      controller.setLabelFilter(10);
      controller.setTagFilter(100);
      controller.setDueFilter("overdue");

      await controller.resetFilters();
      expect(controller.filter.fiscalYear).toBe(2026);
      expect(controller.filter.statusCode).toBe("all");
      expect(controller.filter.labelId).toBe("all");
      expect(controller.filter.tagId).toBe("all");
      expect(controller.filter.dueFilter).toBe("all");
      expect(controller.filter.keyword).toBe("");
    });
  });

  describe("4. 列ソート切替と永続化", () => {
    it("4-1. toggleSort で同一列なら昇順/降順反転、別列なら昇順となり永続化されること", async () => {
      const { controller, storage } = createController();
      await controller.refresh();

      controller.toggleSort("id");
      expect(controller.sort).toEqual({ key: "id", direction: "asc" });
      expect(controller.rows.map((r) => r.task.id)).toEqual([1, 2]);

      controller.toggleSort("id");
      expect(controller.sort).toEqual({ key: "id", direction: "desc" });
      expect(controller.rows.map((r) => r.task.id)).toEqual([2, 1]);
      expect(storage.setItem).toHaveBeenCalledWith(
        "stepnote_task_table_sort",
        JSON.stringify({ key: "id", direction: "desc" }),
      );
    });
  });

  describe("5. チェックボックス選択管理", () => {
    it("5-1. toggleRowSelection で単一行の選択状態と集計プロパティが正しく算出されること", async () => {
      const { controller } = createController();
      await controller.refresh();

      controller.toggleRowSelection(1);
      expect(controller.selectedCount).toBe(1);
      expect(controller.isSomeFilteredSelected).toBe(true);
      expect(controller.isAllFilteredSelected).toBe(false);

      controller.toggleRowSelection(2);
      expect(controller.selectedCount).toBe(2);
      expect(controller.isSomeFilteredSelected).toBe(false);
      expect(controller.isAllFilteredSelected).toBe(true);
    });

    it("5-2. toggleSelectAllFiltered で表示中の全行を一括選択・一括解除できること", async () => {
      const { controller } = createController();
      await controller.refresh();

      controller.toggleSelectAllFiltered();
      expect(controller.selectedCount).toBe(2);
      expect(controller.isAllFilteredSelected).toBe(true);

      controller.toggleSelectAllFiltered();
      expect(controller.selectedCount).toBe(0);
      expect(controller.isAllFilteredSelected).toBe(false);
    });

    it("5-3. clearSelection で選択状態が全解除されること", async () => {
      const { controller } = createController();
      await controller.refresh();
      controller.toggleSelectAllFiltered();

      controller.clearSelection();
      expect(controller.selectedCount).toBe(0);
    });
  });

  describe("6. ブックマークトグル", () => {
    it("6-1. toggleBookmark 実行時に taskRepository.update が呼ばれ、一覧が最新化されること", async () => {
      const { controller } = createController();
      await controller.refresh();

      await controller.toggleBookmark(1);
      expect(taskRepoMock.update).toHaveBeenCalledWith(1, { bookmark: true });
      const updated = controller.rows.find((r) => r.task.id === 1);
      expect(updated?.task.bookmark).toBe(true);
    });
  });
});
