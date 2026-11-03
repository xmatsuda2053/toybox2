import { describe, it, expect, vi } from "vitest";
import {
  SubscriberElement,
  WithLabelsController,
  WithTaskController,
  WithTaskListController,
  WithIssuesController,
  WithNotesController,
  WithLogsController,
  WithLayoutUIController,
  WithScratchController,
  WithTaskTemplateController,
  WithAutoExportController,
} from "./controller-consumers.mixin";
import type { LabelsController } from "@/controllers/labels.controller";
import type { TaskController } from "@/controllers/task.controller";
import type { IssuesController } from "@/controllers/issues.controller";
import type { NotesController } from "@/controllers/notes.controller";
import type { LogsController } from "@/controllers/logs.controller";
import type { ScratchController } from "@/controllers/scratch.controller";
import type { TaskTemplateController } from "@/controllers/task-template.controller";
import type { AutoExportController } from "@/controllers/auto-export.controller";

/**
 * テスト仕様一覧:
 * 1. SubscriberElement 基底クラス
 *    - インスタンス生成時に subscriber が初期化されること
 * 2. WithLabelsController Mixin
 *    - labelsController の getter / setter が提供されること
 *    - labelsController 設定時に subscriber.bind が呼び出され、値が保持されること
 * 3. WithTaskController Mixin
 *    - taskController の getter / setter が提供されること
 *    - taskController 設定時に subscriber.bind が呼び出され、値が保持されること
 * 4. WithIssuesController Mixin
 *    - issuesController の getter / setter が提供されること
 *    - issuesController 設定時に subscriber.bind が呼び出され、値が保持されること
 * 5. WithNotesController Mixin
 *    - notesController の getter / setter が提供されること
 *    - notesController 設定時に subscriber.bind が呼び出され、値が保持されること
 * 6. WithLogsController Mixin
 *    - logsController の getter / setter が提供されること
 *    - logsController 設定時に subscriber.bind が呼び出され、値が保持されること
 * 7. WithScratchController Mixin
 *    - scratchController の getter / setter が提供されること
 *    - scratchController 設定時に subscriber.bind が呼び出され、値が保持されること
 * 8. WithTaskTemplateController Mixin
 *    - taskTemplateController の getter / setter が提供されること
 *    - taskTemplateController 設定時に subscriber.bind が呼び出され、値が保持されること
 * 9. WithAutoExportController Mixin
 *    - autoExportController の getter / setter が提供されること
 *    - autoExportController 設定時に subscriber.bind が呼び出され、値が保持されること
 * 10. コントローラー解除・再設定時の動作
 *    - 10-1. labelsController に undefined を再設定した際、既存の購読が解除されること
 *    - 10-2. taskController に undefined を再設定した際、既存の購読が解除されること
 *    - 10-3. 同一インスタンスを再設定した際、重複して subscribe が呼び出されないこと
 */

describe("controller-consumers.mixin", () => {
  class DummyConsumerElement extends WithAutoExportController(
    WithTaskTemplateController(
      WithScratchController(
        WithLayoutUIController(
          WithLogsController(
            WithNotesController(
              WithIssuesController(
                WithTaskListController(
                  WithTaskController(
                    WithLabelsController(SubscriberElement),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    ),
  ) {}

  describe("1. SubscriberElement 基底クラス", () => {
    it("インスタンス生成時に subscriber が初期化されること", () => {
      const el = new SubscriberElement();
      expect(el.subscriber).toBeDefined();
    });
  });

  describe("2. WithLabelsController Mixin", () => {
    it("labelsController の getter / setter が提供され、設定時に値が保持されること", () => {
      const el = new DummyConsumerElement();
      expect(el.labelsController).toBeUndefined();

      const mockCtrl = {
        subscribe: vi.fn(),
      } as unknown as LabelsController;
      el.labelsController = mockCtrl;
      expect(el.labelsController).toBe(mockCtrl);
      expect(mockCtrl.subscribe).toHaveBeenCalled();
    });
  });

  describe("3. WithTaskController Mixin", () => {
    it("taskController の getter / setter が提供され、設定時に値が保持されること", () => {
      const el = new DummyConsumerElement();
      expect(el.taskController).toBeUndefined();

      const mockCtrl = {
        subscribe: vi.fn(),
      } as unknown as TaskController;
      el.taskController = mockCtrl;
      expect(el.taskController).toBe(mockCtrl);
      expect(mockCtrl.subscribe).toHaveBeenCalled();
    });
  });

  describe("4. WithIssuesController Mixin", () => {
    it("issuesController の getter / setter が提供され、設定時に値が保持されること", () => {
      const el = new DummyConsumerElement();
      expect(el.issuesController).toBeUndefined();

      const mockCtrl = {
        subscribe: vi.fn(),
      } as unknown as IssuesController;
      el.issuesController = mockCtrl;
      expect(el.issuesController).toBe(mockCtrl);
      expect(mockCtrl.subscribe).toHaveBeenCalled();
    });
  });

  describe("5. WithNotesController Mixin", () => {
    it("notesController の getter / setter が提供され、設定時に値が保持されること", () => {
      const el = new DummyConsumerElement();
      expect(el.notesController).toBeUndefined();

      const mockCtrl = {
        subscribe: vi.fn(),
      } as unknown as NotesController;
      el.notesController = mockCtrl;
      expect(el.notesController).toBe(mockCtrl);
      expect(mockCtrl.subscribe).toHaveBeenCalled();
    });
  });

  describe("6. WithLogsController Mixin", () => {
    it("logsController の getter / setter が提供され、設定時に値が保持されること", () => {
      const el = new DummyConsumerElement();
      expect(el.logsController).toBeUndefined();

      const mockCtrl = {
        subscribe: vi.fn(),
      } as unknown as LogsController;
      el.logsController = mockCtrl;
      expect(el.logsController).toBe(mockCtrl);
      expect(mockCtrl.subscribe).toHaveBeenCalled();
    });
  });

  describe("7. WithScratchController Mixin", () => {
    it("scratchController の getter / setter が提供され、設定時に値が保持されること", () => {
      const el = new DummyConsumerElement();
      expect(el.scratchController).toBeUndefined();

      const mockCtrl = {
        subscribe: vi.fn(),
      } as unknown as ScratchController;
      el.scratchController = mockCtrl;
      expect(el.scratchController).toBe(mockCtrl);
      expect(mockCtrl.subscribe).toHaveBeenCalled();
    });
  });

  describe("8. WithTaskTemplateController Mixin", () => {
    it("taskTemplateController の getter / setter が提供され、設定時に値が保持されること", () => {
      const el = new DummyConsumerElement();
      expect(el.taskTemplateController).toBeUndefined();

      const mockCtrl = {
        subscribe: vi.fn(),
      } as unknown as TaskTemplateController;
      el.taskTemplateController = mockCtrl;
      expect(el.taskTemplateController).toBe(mockCtrl);
      expect(mockCtrl.subscribe).toHaveBeenCalled();
    });
  });

  describe("9. WithAutoExportController Mixin", () => {
    it("autoExportController の getter / setter が提供され、設定時に値が保持されること", () => {
      const el = new DummyConsumerElement();
      expect(el.autoExportController).toBeUndefined();

      const mockCtrl = {
        subscribe: vi.fn(),
      } as unknown as AutoExportController;
      el.autoExportController = mockCtrl;
      expect(el.autoExportController).toBe(mockCtrl);
      expect(mockCtrl.subscribe).toHaveBeenCalled();
    });
  });

  describe("10. コントローラー解除・再設定時の動作", () => {
    it("10-1. labelsController に undefined を再設定した際、既存の購読が解除されること", () => {
      const el = new DummyConsumerElement();
      const unsubMock = vi.fn();
      const mockLabelsCtrl = {
        subscribe: vi.fn().mockReturnValue(unsubMock),
      } as unknown as LabelsController;

      el.labelsController = mockLabelsCtrl;
      expect(mockLabelsCtrl.subscribe).toHaveBeenCalledTimes(1);

      el.labelsController = undefined;
      expect(el.labelsController).toBeUndefined();
      expect(unsubMock).toHaveBeenCalledTimes(1);
    });

    it("10-2. taskController に undefined を再設定した際、既存の購読が解除されること", () => {
      const el = new DummyConsumerElement();
      const unsubMock = vi.fn();
      const mockTaskCtrl = {
        subscribe: vi.fn().mockReturnValue(unsubMock),
      } as unknown as TaskController;

      el.taskController = mockTaskCtrl;
      expect(mockTaskCtrl.subscribe).toHaveBeenCalledTimes(1);

      el.taskController = undefined;
      expect(el.taskController).toBeUndefined();
      expect(unsubMock).toHaveBeenCalledTimes(1);
    });

    it("10-3. 同一インスタンスを再設定した際、重複して subscribe が呼び出されないこと", () => {
      const el = new DummyConsumerElement();
      const mockLabelsCtrl = {
        subscribe: vi.fn(),
      } as unknown as LabelsController;

      el.labelsController = mockLabelsCtrl;
      expect(mockLabelsCtrl.subscribe).toHaveBeenCalledTimes(1);

      // 同一インスタンスを再代入
      el.labelsController = mockLabelsCtrl;
      expect(mockLabelsCtrl.subscribe).toHaveBeenCalledTimes(1);
    });
  });
});
