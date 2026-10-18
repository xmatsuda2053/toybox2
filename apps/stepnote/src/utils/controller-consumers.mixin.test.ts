import { describe, it, expect, vi } from "vitest";
import {
  SubscriberElement,
  WithLabelsController,
  WithTaskController,
  WithIssuesController,
  WithNotesController,
  WithLogsController,
  WithLayoutUIController,
} from "./controller-consumers.mixin";
import type { LabelsController } from "@/controllers/labels.controller";
import type { TaskController } from "@/controllers/task.controller";
import type { IssuesController } from "@/controllers/issues.controller";
import type { NotesController } from "@/controllers/notes.controller";
import type { LogsController } from "@/controllers/logs.controller";
import type { LayoutUIController } from "@/controllers/layout-ui.controller";

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
 * 7. コントローラー解除・再設定時の動作
 *    - 7-1. labelsController に undefined を再設定した際、既存の購読が解除されること
 *    - 7-2. taskController に undefined を再設定した際、既存の購読が解除されること
 *    - 7-3. 同一インスタンスを再設定した際、重複して subscribe が呼び出されないこと
 */

describe("controller-consumers.mixin", () => {
  describe("1. SubscriberElement 基底クラス", () => {
    it("1-1. インスタンス生成時に subscriber が初期化されること", () => {
      const el = new SubscriberElement();
      expect(el.subscriber).toBeDefined();
    });
  });

  describe("2. WithLabelsController Mixin", () => {
    class DummyLabelsElement extends WithLabelsController(SubscriberElement) {}

    it("2-1. labelsController の getter / setter が提供され、初期値は undefined であること", () => {
      const el = new DummyLabelsElement();
      expect(el.labelsController).toBeUndefined();
    });

    it("2-2. labelsController 設定時に subscriber.bind を通じてインスタンスが設定されること", () => {
      const el = new DummyLabelsElement();
      const mockLabelsCtrl = {
        subscribe: vi.fn(),
      } as unknown as LabelsController;

      el.labelsController = mockLabelsCtrl;
      expect(el.labelsController).toBe(mockLabelsCtrl);
    });
  });

  describe("3. WithTaskController Mixin", () => {
    class DummyTaskElement extends WithTaskController(SubscriberElement) {}

    it("3-1. taskController の getter / setter が提供され、初期値は undefined であること", () => {
      const el = new DummyTaskElement();
      expect(el.taskController).toBeUndefined();
    });

    it("3-2. taskController 設定時に subscriber.bind を通じてインスタンスが設定されること", () => {
      const el = new DummyTaskElement();
      const mockTaskCtrl = {
        subscribe: vi.fn(),
      } as unknown as TaskController;

      el.taskController = mockTaskCtrl;
      expect(el.taskController).toBe(mockTaskCtrl);
    });
  });

  describe("4. WithIssuesController Mixin", () => {
    class DummyIssuesElement extends WithIssuesController(SubscriberElement) {}

    it("4-1. issuesController の getter / setter が提供され、初期値は undefined であること", () => {
      const el = new DummyIssuesElement();
      expect(el.issuesController).toBeUndefined();
    });

    it("4-2. issuesController 設定時に subscriber.bind を通じてインスタンスが設定されること", () => {
      const el = new DummyIssuesElement();
      const mockIssuesCtrl = {
        subscribe: vi.fn(),
      } as unknown as IssuesController;

      el.issuesController = mockIssuesCtrl;
      expect(el.issuesController).toBe(mockIssuesCtrl);
    });
  });

  describe("5. WithNotesController Mixin", () => {
    class DummyNotesElement extends WithNotesController(SubscriberElement) {}

    it("5-1. notesController の getter / setter が提供され、初期値は undefined であること", () => {
      const el = new DummyNotesElement();
      expect(el.notesController).toBeUndefined();
    });

    it("5-2. notesController 設定時に subscriber.bind を通じてインスタンスが設定されること", () => {
      const el = new DummyNotesElement();
      const mockNotesCtrl = {
        subscribe: vi.fn(),
      } as unknown as NotesController;

      el.notesController = mockNotesCtrl;
      expect(el.notesController).toBe(mockNotesCtrl);
    });
  });

  describe("6. WithLogsController Mixin", () => {
    class DummyLogsElement extends WithLogsController(SubscriberElement) {}

    it("6-1. logsController の getter / setter が提供され、初期値は undefined であること", () => {
      const el = new DummyLogsElement();
      expect(el.logsController).toBeUndefined();
    });

    it("6-2. logsController 設定時に subscriber.bind を通じてインスタンスが設定されること", () => {
      const el = new DummyLogsElement();
      const mockLogsCtrl = {
        subscribe: vi.fn(),
      } as unknown as LogsController;

      el.logsController = mockLogsCtrl;
      expect(el.logsController).toBe(mockLogsCtrl);
    });
  });

  describe("7. WithLayoutUIController Mixin", () => {
    class DummyLayoutUIElement extends WithLayoutUIController(SubscriberElement) {}

    it("7-1. layoutUIController の getter / setter が提供され、初期値は undefined であること", () => {
      const el = new DummyLayoutUIElement();
      expect(el.layoutUIController).toBeUndefined();
    });

    it("7-2. layoutUIController 設定時に subscriber.bind を通じてインスタンスが設定されること", () => {
      const el = new DummyLayoutUIElement();
      const mockLayoutUICtrl = {
        subscribe: vi.fn(),
      } as unknown as LayoutUIController;

      el.layoutUIController = mockLayoutUICtrl;
      expect(el.layoutUIController).toBe(mockLayoutUICtrl);
    });
  });

  describe("8. コントローラー解除・再設定時の動作", () => {
    class DummyConsumerElement extends WithTaskController(
      WithLabelsController(SubscriberElement),
    ) {}

    it("7-1. labelsController に undefined を再設定した際、既存の購読が解除されること", () => {
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

    it("7-2. taskController に undefined を再設定した際、既存の購読が解除されること", () => {
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

    it("7-3. 同一インスタンスを再設定した際、重複して subscribe が呼び出されないこと", () => {
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
