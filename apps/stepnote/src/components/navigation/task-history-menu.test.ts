import { describe, it, expect, vi, beforeEach } from "vitest";
import { TaskHistoryMenu } from "./task-history-menu.js";
import type { TaskHistoryController } from "../../controllers/task-history.controller.js";
import type { TaskRepository } from "../../repositories/task.repository.js";
import type { LabelsController } from "../../controllers/labels.controller.js";

/**
 * 【TaskHistoryMenu 仕様 (task-history-menu.test.ts)】
 *
 * 1. レンダリングとアクセシビリティ
 *    - 1-1. トリガーボタンに clock-rotate-left-solid-full アイコンが描画されること
 *    - 1-2. ツールチップに trigger="hover" が指定されていること
 *
 * 2. ドロップダウンコンテンツ
 *    - 2-1. 履歴が空の場合、空状態メッセージ（履歴はありません）が表示されること
 *    - 2-2. 履歴が存在する場合、タスク名とラベル情報が表示されること
 *
 * 3. ユーザーインタラクション
 *    - 3-1. タスク行をクリックした際、task-history-select カスタムイベントが taskId と共に発行されること
 *    - 3-2. 履歴クリアボタンをクリックした際、taskHistoryController.clear() が呼び出されること
 */

describe("TaskHistoryMenu", () => {
  let element: TaskHistoryMenu;
  let mockHistoryController: TaskHistoryController;
  let mockTaskRepository: TaskRepository;
  let mockLabelsController: LabelsController;

  beforeEach(() => {
    mockHistoryController = {
      history: [],
      maxCount: 10,
      record: vi.fn(),
      clear: vi.fn(),
      remove: vi.fn(),
      setMaxCount: vi.fn(),
      clean: vi.fn(),
      subscribe: vi.fn(() => vi.fn()),
    } as unknown as TaskHistoryController;

    mockTaskRepository = {
      getById: vi.fn(),
    } as unknown as TaskRepository;

    mockLabelsController = {
      state: [],
      subscribe: vi.fn(() => vi.fn()),
    } as unknown as LabelsController;

    element = new TaskHistoryMenu();
    element.taskHistoryController = mockHistoryController;
    element.taskRepository = mockTaskRepository;
    element.labelsController = mockLabelsController;
  });

  describe("1. レンダリングとアクセシビリティ", () => {
    it("1-1. トリガーボタンに clock-rotate-left-solid-full アイコンが描画されること", async () => {
      const template = element.render();
      expect(template).toBeDefined();

      // HTML文字列展開によるアイコン名検証
      const renderedHtml = JSON.stringify(template);
      expect(renderedHtml).toContain("clock-rotate-left-solid-full");
    });

    it("1-2. ツールチップに trigger=\"hover\" が指定されていること", async () => {
      const template = element.render();
      const renderedHtml = JSON.stringify(template);
      expect(renderedHtml).toContain('trigger=\\"hover\\"');
    });
  });

  describe("2. ドロップダウンコンテンツ", () => {
    it("2-1. 履歴が空の場合、空状態メッセージ（履歴はありません）が表示されること", async () => {
      element.viewItems = [];
      const template = element.render();
      const renderedHtml = JSON.stringify(template);
      expect(renderedHtml).toContain("履歴はありません");
    });

    it("2-2. 履歴が存在する場合、タスク名とラベル情報が表示されること", async () => {
      element.viewItems = [
        {
          taskId: 101,
          accessedAt: 2000,
          title: "テストタスクA",
          labelId: 1,
          labelName: "開発",
          statusCode: 0,
        },
      ];
      const template = element.render();
      const renderedHtml = JSON.stringify(template);
      expect(renderedHtml).toContain("テストタスクA");
      expect(renderedHtml).toContain("開発");
    });

    it("2-3. 履歴が存在する場合、クリア項目に trash-solid-full アイコンが表示されること", async () => {
      element.viewItems = [
        {
          taskId: 101,
          accessedAt: 2000,
          title: "テストタスクA",
          labelId: 1,
          labelName: "開発",
          statusCode: 0,
        },
      ];
      const template = element.render();
      const renderedHtml = JSON.stringify(template);
      expect(renderedHtml).toContain("trash-solid-full");
    });
  });

  describe("3. ユーザーインタラクション", () => {
    it("3-1. タスク選択時に task-history-select カスタムイベントが taskId と共に発行されること", () => {
      const dispatchSpy = vi.spyOn(element, "dispatchEvent");
      element.handleTaskItemClick(101);

      expect(dispatchSpy).toHaveBeenCalled();
      const dispatchedEvent = dispatchSpy.mock.calls[0]?.[0] as CustomEvent;
      expect(dispatchedEvent.type).toBe("task-history-select");
      expect(dispatchedEvent.detail).toEqual({ taskId: 101 });
      expect(dispatchedEvent.bubbles).toBe(true);
      expect(dispatchedEvent.composed).toBe(true);
    });

    it("3-2. 履歴クリア実行時に taskHistoryController.clear() が呼び出されること", () => {
      element.handleClearHistory();
      expect(mockHistoryController.clear).toHaveBeenCalledTimes(1);
    });

    it("3-3. wa-select イベントでタスクIDが選択された際、handleTaskItemClick が呼び出されること", () => {
      const taskClickSpy = vi.spyOn(element, "handleTaskItemClick");
      element.handleDropdownSelect({
        detail: { item: { value: "101" } },
      } as unknown as CustomEvent);

      expect(taskClickSpy).toHaveBeenCalledWith(101);
    });

    it("3-3. wa-select イベントで 'clear' が選択された際、handleClearHistory が呼び出されること", () => {
      const clearSpy = vi.spyOn(element, "handleClearHistory");
      element.handleDropdownSelect({
        detail: { item: { value: "clear" } },
      } as unknown as CustomEvent);

      expect(clearSpy).toHaveBeenCalled();
    });
  });
});
