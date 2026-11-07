import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactiveControllerHost } from "lit";
import {
  TaskHistoryController,
  type TaskHistoryControllerOptions,
} from "./task-history.controller.js";
import {
  DEFAULT_TASK_HISTORY_MAX_COUNT,
  TASK_HISTORY_STORAGE_KEY,
  TASK_HISTORY_MAX_COUNT_STORAGE_KEY,
} from "../types/domain/task-history.type.js";

/**
 * 【TaskHistoryController 仕様 (task-history.controller.test.ts)】
 *
 * 1. 初期化と永続化（LocalStorage 連携）
 *    - 1-1. ストレージに保存された履歴と設定がある場合、読み込んで初期状態とすること
 *    - 1-2. ストレージにデータがない場合、空履歴とデフォルト最大件数（10件）で初期状態とすること
 *    - 1-3. ストレージのJSONが破損している場合、安全に空履歴へフォールバックすること
 *
 * 2. 履歴の記録と削除（CRUD 操作）
 *    - 2-1. record(taskId) でタスクIDが先頭に追加され、ストレージに保存されること
 *    - 2-2. 既に存在する taskId を record した場合、最新として先頭に移動すること（LRU）
 *    - 2-3. maxCount を超えた場合、末尾が切り捨てられること
 *    - 2-4. remove(taskId) で指定したタスクが削除され、ストレージに保存されること
 *    - 2-5. clear() で全履歴がクリアされ、ストレージに保存されること
 *    - 2-6. clean(validTaskIds) で存在しないタスクが削除されること
 *
 * 3. 最大保持件数の変更
 *    - 3-1. setMaxCount(count) で最大件数が更新され、ストレージに保存されること
 *    - 3-2. setMaxCount で件数を減らした場合、既存履歴が切り詰められて保存されること
 *    - 3-3. 5未満や30超の数値が渡された場合、範囲内（5〜30）にクランプされること
 *
 * 4. リアクティビティと購読
 *    - 4-1. 状態変更時に host.requestUpdate() が呼び出されること
 *    - 4-2. subscribe で登録されたリスナーに変更が通知されること
 */

describe("TaskHistoryController", () => {
  let mockHost: ReactiveControllerHost;
  let mockStorage: Record<string, string>;
  let storageAdapter: NonNullable<TaskHistoryControllerOptions["storage"]>;

  beforeEach(() => {
    mockHost = {
      addController: vi.fn(),
      removeController: vi.fn(),
      requestUpdate: vi.fn(),
      updateComplete: Promise.resolve(true),
    };
    mockStorage = {};
    storageAdapter = {
      getItem: (key: string) => mockStorage[key] ?? null,
      setItem: (key: string, value: string) => {
        mockStorage[key] = value;
      },
      removeItem: (key: string) => {
        delete mockStorage[key];
      },
    };
  });

  describe("1. 初期化と永続化", () => {
    it("ストレージに保存された履歴と設定がある場合、読み込んで初期状態とすること", () => {
      const savedHistory = [
        { taskId: 2, accessedAt: 2000 },
        { taskId: 1, accessedAt: 1000 },
      ];
      mockStorage[TASK_HISTORY_STORAGE_KEY] = JSON.stringify(savedHistory);
      mockStorage[TASK_HISTORY_MAX_COUNT_STORAGE_KEY] = "15";

      const controller = new TaskHistoryController(mockHost, {
        storage: storageAdapter,
      });

      expect(controller.history).toEqual(savedHistory);
      expect(controller.maxCount).toBe(15);
    });

    it("ストレージにデータがない場合、空履歴とデフォルト最大件数（10件）で初期状態とすること", () => {
      const controller = new TaskHistoryController(mockHost, {
        storage: storageAdapter,
      });

      expect(controller.history).toEqual([]);
      expect(controller.maxCount).toBe(DEFAULT_TASK_HISTORY_MAX_COUNT);
    });

    it("ストレージのJSONが破損している場合、安全に空履歴へフォールバックすること", () => {
      mockStorage[TASK_HISTORY_STORAGE_KEY] = "invalid json";
      mockStorage[TASK_HISTORY_MAX_COUNT_STORAGE_KEY] = "invalid";

      const controller = new TaskHistoryController(mockHost, {
        storage: storageAdapter,
      });

      expect(controller.history).toEqual([]);
      expect(controller.maxCount).toBe(DEFAULT_TASK_HISTORY_MAX_COUNT);
    });
  });

  describe("2. 履歴の記録と削除", () => {
    it("record(taskId) でタスクIDが先頭に追加され、ストレージに保存されること", () => {
      const controller = new TaskHistoryController(mockHost, {
        storage: storageAdapter,
        nowProvider: () => 1000,
      });

      controller.record(1);

      expect(controller.history).toEqual([{ taskId: 1, accessedAt: 1000 }]);
      expect(mockStorage[TASK_HISTORY_STORAGE_KEY]).toBe(
        JSON.stringify([{ taskId: 1, accessedAt: 1000 }]),
      );
      expect(mockHost.requestUpdate).toHaveBeenCalled();
    });

    it("既に存在する taskId を record した場合、最新として先頭に移動すること（LRU）", () => {
      let currentTime = 1000;
      const controller = new TaskHistoryController(mockHost, {
        storage: storageAdapter,
        nowProvider: () => currentTime,
      });

      controller.record(1);
      currentTime = 2000;
      controller.record(2);
      currentTime = 3000;
      controller.record(1); // 1 を再訪

      expect(controller.history).toEqual([
        { taskId: 1, accessedAt: 3000 },
        { taskId: 2, accessedAt: 2000 },
      ]);
    });

    it("maxCount を超えた場合、末尾が切り捨てられること", () => {
      const controller = new TaskHistoryController(mockHost, {
        storage: storageAdapter,
        nowProvider: () => 1000,
      });
      controller.setMaxCount(5);

      for (let id = 1; id <= 6; id++) {
        controller.record(id);
      }

      expect(controller.history.length).toBe(5);
      expect(controller.history[0]?.taskId).toBe(6);
      expect(controller.history[4]?.taskId).toBe(2);
    });

    it("remove(taskId) で指定したタスクが削除され、ストレージに保存されること", () => {
      const controller = new TaskHistoryController(mockHost, {
        storage: storageAdapter,
        nowProvider: () => 1000,
      });
      controller.record(1);
      controller.record(2);

      controller.remove(1);

      expect(controller.history).toEqual([{ taskId: 2, accessedAt: 1000 }]);
      expect(mockStorage[TASK_HISTORY_STORAGE_KEY]).toBe(
        JSON.stringify([{ taskId: 2, accessedAt: 1000 }]),
      );
    });

    it("clear() で全履歴がクリアされ、ストレージに保存されること", () => {
      const controller = new TaskHistoryController(mockHost, {
        storage: storageAdapter,
        nowProvider: () => 1000,
      });
      controller.record(1);
      controller.record(2);

      controller.clear();

      expect(controller.history).toEqual([]);
      expect(mockStorage[TASK_HISTORY_STORAGE_KEY]).toBe(JSON.stringify([]));
    });

    it("clean(validTaskIds) で存在しないタスクが削除されること", () => {
      const controller = new TaskHistoryController(mockHost, {
        storage: storageAdapter,
        nowProvider: () => 1000,
      });
      controller.record(1);
      controller.record(2);
      controller.record(3);

      controller.clean(new Set([1, 3]));

      expect(controller.history.map((h) => h.taskId)).toEqual([3, 1]);
    });
  });

  describe("3. 最大保持件数の変更", () => {
    it("setMaxCount(count) で最大件数が更新され、ストレージに保存されること", () => {
      const controller = new TaskHistoryController(mockHost, {
        storage: storageAdapter,
      });

      controller.setMaxCount(20);

      expect(controller.maxCount).toBe(20);
      expect(mockStorage[TASK_HISTORY_MAX_COUNT_STORAGE_KEY]).toBe("20");
    });

    it("setMaxCount で件数を減らした場合、既存履歴が切り詰められて保存されること", () => {
      const controller = new TaskHistoryController(mockHost, {
        storage: storageAdapter,
        nowProvider: () => 1000,
      });
      for (let id = 1; id <= 10; id++) {
        controller.record(id);
      }
      expect(controller.history.length).toBe(10);

      controller.setMaxCount(5);

      expect(controller.maxCount).toBe(5);
      expect(controller.history.length).toBe(5);
      expect(controller.history[0]?.taskId).toBe(10);
      expect(controller.history[4]?.taskId).toBe(6);
    });

    it("5未満や30超の数値が渡された場合、範囲内（5〜30）にクランプされること", () => {
      const controller = new TaskHistoryController(mockHost, {
        storage: storageAdapter,
      });

      controller.setMaxCount(2);
      expect(controller.maxCount).toBe(5);

      controller.setMaxCount(50);
      expect(controller.maxCount).toBe(30);
    });
  });

  describe("4. リアクティビティと購読", () => {
    it("状態変更時に host.requestUpdate() が呼び出されること", () => {
      const controller = new TaskHistoryController(mockHost, {
        storage: storageAdapter,
      });
      vi.clearAllMocks();

      controller.record(1);
      expect(mockHost.requestUpdate).toHaveBeenCalledTimes(1);

      controller.setMaxCount(15);
      expect(mockHost.requestUpdate).toHaveBeenCalledTimes(2);

      controller.clear();
      expect(mockHost.requestUpdate).toHaveBeenCalledTimes(3);
    });

    it("subscribe で登録されたリスナーに変更が通知されること", () => {
      const controller = new TaskHistoryController(mockHost, {
        storage: storageAdapter,
      });
      const listener = vi.fn();
      const unsubscribe = controller.subscribe(listener);

      controller.record(1);
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      controller.record(2);
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });
});

