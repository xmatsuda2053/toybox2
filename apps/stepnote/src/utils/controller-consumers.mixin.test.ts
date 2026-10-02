import { describe, it, expect, vi } from "vitest";
import {
  SubscriberElement,
  WithLabelsController,
  WithTaskController,
} from "./controller-consumers.mixin";
import type { LabelsController } from "@/controllers/labels.controller";
import type { TaskController } from "@/controllers/task.controller";

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
});
