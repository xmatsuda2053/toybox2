import "fake-indexeddb/auto";
import { setMaxListeners } from "node:events";
import { describe, it, expect, vi } from "vitest";
import { ContextProvider } from "@lit/context";
import type { ReactiveControllerHost } from "lit";
import {
  createAppRepositories,
  createAppControllers,
  provideAppContexts,
  bindAppControllerSubscriptions,
  type ContextProviderHost,
} from "./app-root.bootstrap.js";

/**
 * 【app-root.bootstrap 仕様】
 *
 * 1. リポジトリおよびコントローラー初期化
 *    - 1-1. createAppRepositories が必要なリポジトリ群を一括生成して返すこと
 *    - 1-2. createAppControllers が 15 種類の Controller および SystemLogService を生成すること
 *
 * 2. @lit/context 配給および連携購読
 *    - 2-1. provideAppContexts が 15 種類の ContextProvider を登録すること
 *    - 2-2. bindAppControllerSubscriptions が各 Controller 間の連動購読を設定すること
 */
class MockReactiveHost extends EventTarget implements ReactiveControllerHost {
  public addController = vi.fn();
  public removeController = vi.fn();
  public requestUpdate = vi.fn();
  public updateComplete = Promise.resolve(true);
}

describe("app-root.bootstrap", () => {
  it("1-1. createAppRepositories が必要なリポジトリ群を一括生成して返すこと", () => {
    const repos = createAppRepositories();

    expect(repos.taskRepository).toBeDefined();
    expect(repos.issuesRepository).toBeDefined();
    expect(repos.notesRepository).toBeDefined();
    expect(repos.scratchRepository).toBeDefined();
    expect(repos.labelsRepository).toBeDefined();
    expect(repos.logsRepository).toBeDefined();
    expect(repos.tagsRepository).toBeDefined();
    expect(repos.tagSetsRepository).toBeDefined();
    expect(repos.quickAccessRepository).toBeDefined();
    expect(repos.taskTemplateRepository).toBeDefined();
  });

  it("1-2. createAppControllers が 15 種類の Controller および SystemLogService を生成すること", () => {
    const host = new MockReactiveHost();
    const repos = createAppRepositories();
    const bundle = createAppControllers(host, repos, {
      exportCallback: vi.fn().mockResolvedValue(undefined),
      notifyCallback: vi.fn(),
    });

    expect(bundle.layoutUIController).toBeDefined();
    expect(bundle.quickAccessController).toBeDefined();
    expect(bundle.labelsController).toBeDefined();
    expect(bundle.taskController).toBeDefined();
    expect(bundle.taskListController).toBeDefined();
    expect(bundle.taskTableController).toBeDefined();
    expect(bundle.logsController).toBeDefined();
    expect(bundle.notesController).toBeDefined();
    expect(bundle.issuesController).toBeDefined();
    expect(bundle.themeController).toBeDefined();
    expect(bundle.scratchController).toBeDefined();
    expect(bundle.taskTemplateController).toBeDefined();
    expect(bundle.autoExportController).toBeDefined();
    expect(bundle.taskHistoryController).toBeDefined();
    expect(bundle.tagsController).toBeDefined();
    expect(bundle.tagSetsController).toBeDefined();
    expect(bundle.systemLogService).toBeDefined();
  });

  it("2-1. provideAppContexts が 15 種類の ContextProvider を登録すること", () => {
    const host = new MockReactiveHost();
    const repos = createAppRepositories();
    const bundle = createAppControllers(host, repos, {
      exportCallback: vi.fn().mockResolvedValue(undefined),
      notifyCallback: vi.fn(),
    });

    setMaxListeners(30, host);
    const addControllerSpy = vi.spyOn(host, "addController");
    provideAppContexts(host as unknown as ContextProviderHost, bundle);

    const uniqueProviders = new Set(
      addControllerSpy.mock.calls
        .map(([controller]) => controller)
        .filter((controller) => controller instanceof ContextProvider),
    );
    expect(uniqueProviders.size).toBe(16);
  });

  it("2-2. bindAppControllerSubscriptions が各 Controller 間の連動購読を設定すること", async () => {
    const host = new MockReactiveHost();
    const repos = createAppRepositories();
    const bundle = createAppControllers(host, repos, {
      exportCallback: vi.fn().mockResolvedValue(undefined),
      notifyCallback: vi.fn(),
    });
    const requestUpdate = vi.fn();

    const taskListeners: Array<() => Promise<void> | void> = [];
    const issueListeners: Array<() => Promise<void> | void> = [];
    const labelListeners: Array<() => Promise<void> | void> = [];
    const tagListeners: Array<() => Promise<void> | void> = [];

    vi.spyOn(bundle.taskController, "subscribe").mockImplementation((cb) => {
      taskListeners.push(cb);
      return () => {};
    });
    vi.spyOn(bundle.issuesController, "subscribe").mockImplementation((cb) => {
      issueListeners.push(cb);
      return () => {};
    });
    vi.spyOn(bundle.labelsController, "subscribe").mockImplementation((cb) => {
      labelListeners.push(cb);
      return () => {};
    });
    vi.spyOn(bundle.tagsController, "subscribe").mockImplementation((cb) => {
      tagListeners.push(cb);
      return () => {};
    });

    const setIssuesTaskId = vi.spyOn(bundle.issuesController, "setTaskId").mockResolvedValue();
    const setLogsTaskId = vi.spyOn(bundle.logsController, "setTaskId").mockResolvedValue();
    const setNotesTaskId = vi.spyOn(bundle.notesController, "setTaskId").mockResolvedValue();
    const recordHistory = vi.spyOn(bundle.taskHistoryController, "record").mockImplementation(() => {});
    const refreshList = vi.spyOn(bundle.taskListController, "refresh").mockResolvedValue();
    const refreshTable = vi.spyOn(bundle.taskTableController, "refresh").mockResolvedValue();
    const refreshTask = vi.spyOn(bundle.taskController, "refresh").mockResolvedValue();
    const refreshTagSets = vi.spyOn(bundle.tagSetsController, "refresh").mockResolvedValue();

    bindAppControllerSubscriptions(bundle, requestUpdate);

    vi.spyOn(bundle.taskController, "state", "get").mockReturnValue({
      id: 42,
      name: "Task",
      statusCode: 0,
      fiscalYear: 2026,
      bookmark: false,
      description: "",
      contacts: [],
      dueDate: new Date(),
      labelId: 1,
      selected: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await taskListeners[0]?.();
    expect(setIssuesTaskId).toHaveBeenCalledWith(42);
    expect(setLogsTaskId).toHaveBeenCalledWith(42);
    expect(setNotesTaskId).toHaveBeenCalledWith(42);
    expect(recordHistory).toHaveBeenCalledWith(42);
    expect(refreshList).toHaveBeenCalled();
    expect(refreshTable).toHaveBeenCalled();

    await issueListeners[0]?.();
    expect(refreshTask).toHaveBeenCalled();

    await labelListeners[0]?.();
    expect(requestUpdate).toHaveBeenCalled();

    await tagListeners[0]?.();
    expect(refreshTagSets).toHaveBeenCalled();
  });
});
