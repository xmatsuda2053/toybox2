import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCurrentFiscalYear } from "@shared/utils";
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
 *
 * 7. 一覧からの直接更新（状態・ラベル・期限日・タグ）と業務ルール連携
 *    - 7-1. updateTaskStatus で状態更新・システムログ記録・再読込・onTaskMutated が呼ばれること
 *    - 7-2. 未完了 Issue があるタスクに対する updateTaskStatus(taskId, 9) が抑止されること
 *    - 7-3. updateTaskLabel でラベル更新・システムログ記録・再読込・onTaskMutated が呼ばれること
 *    - 7-4. updateTaskDueDate で期限日更新・システムログ記録・再読込・onTaskMutated が呼ばれること
 *    - 7-5. updateTaskTags でタグ更新・再読込・onTaskMutated が呼ばれること
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
  let taskRepoMock: {
    getAll: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let issuesRepoMock: {
    getAll: ReturnType<typeof vi.fn>;
    getByTaskId: ReturnType<typeof vi.fn>;
  };
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
      getAll: vi
        .fn()
        .mockImplementation(async () => tasks.map((t) => ({ ...t }))),
      update: vi
        .fn()
        .mockImplementation(
          async (id: number, partial: Partial<TaskRecord>) => {
            const target = tasks.find((t) => t.id === id);
            if (target) Object.assign(target, partial);
          },
        ),
    };
    issuesRepoMock = {
      getAll: vi.fn().mockImplementation(async () => issues),
      getByTaskId: vi
        .fn()
        .mockImplementation(async (taskId: number) =>
          issues.filter((i) => i.taskId === taskId),
        ),
    };
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

  const createAllYearController = () =>
    createController(
      createMockStorage({ stepnote_task_table_fiscal_year: "all" }),
    );

  describe("1. 初期化・永続化復元", () => {
    it("1-1. ストレージ未設定時は当年度（標準モード準拠）およびデフォルトソートで初期化されること", () => {
      const { controller } = createController();
      expect(controller.filter.fiscalYear).toBe(getCurrentFiscalYear());
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

    it("1-3. ストレージに 'all' が保存されている場合は全年度として復元されること", () => {
      const { controller } = createAllYearController();
      expect(controller.filter.fiscalYear).toBe("all");
    });
  });

  describe("2. データロード（refresh）", () => {
    it("2-1. 全タスク・Issue集計・ラベル名・タグが結合されて rows へ格納されること", async () => {
      const { controller, requestUpdateMock } = createAllYearController();
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
      const { controller, storage } = createAllYearController();
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
      const { controller } = createAllYearController();
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
      const { controller } = createAllYearController();
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
      const { controller, storage } = createAllYearController();
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
      const { controller } = createAllYearController();
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
      const { controller } = createAllYearController();
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

  describe("7. 一覧からの直接更新（状態・ラベル・期限日・タグ）と業務ルール連携", () => {
    const createRichController = () => {
      const { host, requestUpdateMock } = createMockHost();
      const systemLogServiceMock = {
        logTaskStatusChanged: vi.fn().mockResolvedValue(undefined),
        logTaskLabelChanged: vi.fn().mockResolvedValue(undefined),
        logTaskDueDateChanged: vi.fn().mockResolvedValue(undefined),
      };
      const onTaskMutated = vi.fn().mockResolvedValue(undefined);
      const controller = new TaskTableController(host, {
        taskRepository: taskRepoMock as unknown as TaskRepository,
        issuesRepository: issuesRepoMock as unknown as IssuesRepository,
        labelsRepository: labelsRepoMock as unknown as LabelsRepository,
        tagsRepository: tagsRepoMock as unknown as TagsRepository,
        taskListQuery: queryMock as unknown as TaskListQuery,
        storage: createMockStorage({
          stepnote_task_table_fiscal_year: "all",
        }),
        systemLogService: systemLogServiceMock as unknown as never,
        onTaskMutated,
      });
      return {
        controller,
        systemLogServiceMock,
        onTaskMutated,
        requestUpdateMock,
      };
    };

    it("7-1. updateTaskStatus で状態更新・システムログ記録・再読込・onTaskMutated が呼ばれること", async () => {
      const { controller, systemLogServiceMock, onTaskMutated } =
        createRichController();
      await controller.refresh();

      await (
        controller as unknown as {
          updateTaskStatus: (id: number, status: 0 | 5 | 9) => Promise<void>;
        }
      ).updateTaskStatus(1, 5);

      expect(taskRepoMock.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ statusCode: 5 }),
      );
      expect(systemLogServiceMock.logTaskStatusChanged).toHaveBeenCalledWith(
        1,
        0,
        5,
      );
      expect(onTaskMutated).toHaveBeenCalledWith(1);
    });

    it("7-2. 未完了 Issue があるタスクに対する updateTaskStatus(taskId, 9) が抑止されること", async () => {
      const { controller, systemLogServiceMock, onTaskMutated } =
        createRichController();
      await controller.refresh();

      await (
        controller as unknown as {
          updateTaskStatus: (id: number, status: 0 | 5 | 9) => Promise<void>;
        }
      ).updateTaskStatus(1, 9);

      expect(taskRepoMock.update).not.toHaveBeenCalled();
      expect(systemLogServiceMock.logTaskStatusChanged).not.toHaveBeenCalled();
      expect(onTaskMutated).not.toHaveBeenCalled();

      // Issue が存在しないタスク 2 は完了可能
      await (
        controller as unknown as {
          updateTaskStatus: (id: number, status: 0 | 5 | 9) => Promise<void>;
        }
      ).updateTaskStatus(2, 9);
      expect(taskRepoMock.update).toHaveBeenCalledWith(
        2,
        expect.objectContaining({ statusCode: 9 }),
      );
    });

    it("7-3. updateTaskLabel でラベル更新・システムログ記録・再読込・onTaskMutated が呼ばれること", async () => {
      const { controller, systemLogServiceMock, onTaskMutated } =
        createRichController();
      await controller.refresh();

      await (
        controller as unknown as {
          updateTaskLabel: (id: number, labelId: number) => Promise<void>;
        }
      ).updateTaskLabel(1, 20);

      expect(taskRepoMock.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ labelId: 20 }),
      );
      expect(systemLogServiceMock.logTaskLabelChanged).toHaveBeenCalledWith(
        1,
        "開発",
        "運用",
        10,
        20,
      );
      expect(onTaskMutated).toHaveBeenCalledWith(1);
    });

    it("7-4. updateTaskDueDate で期限日更新・システムログ記録・再読込・onTaskMutated が呼ばれること", async () => {
      const { controller, systemLogServiceMock, onTaskMutated } =
        createRichController();
      await controller.refresh();
      const nextDate = new Date("2026-07-01T00:00:00.000Z");

      await (
        controller as unknown as {
          updateTaskDueDate: (id: number, dueDate: Date) => Promise<void>;
        }
      ).updateTaskDueDate(1, nextDate);

      expect(taskRepoMock.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ dueDate: nextDate }),
      );
      expect(systemLogServiceMock.logTaskDueDateChanged).toHaveBeenCalledWith(
        1,
        new Date("2026-06-01T00:00:00.000Z"),
        nextDate,
      );
      expect(onTaskMutated).toHaveBeenCalledWith(1);
    });

    it("7-5. updateTaskTags でタグ更新・再読込・onTaskMutated が呼ばれること", async () => {
      const { controller, onTaskMutated } = createRichController();
      await controller.refresh();

      await (
        controller as unknown as {
          updateTaskTags: (id: number, tagIds: number[]) => Promise<void>;
        }
      ).updateTaskTags(1, [100, 200, 100]);

      expect(taskRepoMock.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ tagIds: [100, 200] }),
      );
      expect(onTaskMutated).toHaveBeenCalledWith(1);
    });
  });
});
