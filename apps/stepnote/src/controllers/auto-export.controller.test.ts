import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import type { ReactiveControllerHost } from "lit";
import {
  AutoExportController,
  type AutoExportControllerOptions,
} from "./auto-export.controller.js";
import { DEFAULT_AUTO_EXPORT_SETTINGS } from "../types/domain/backup.type.js";

/**
 * 【AutoExportController 仕様 (auto-export.controller.test.ts)】
 *
 * 1. 初期化と永続化（LocalStorage 連携）
 *    - 1-1. ストレージに保存された設定がある場合、それを読み込んで初期状態とすること
 *    - 1-2. ストレージに設定がない場合、DEFAULT_AUTO_EXPORT_SETTINGS を初期状態とすること
 *    - 1-3. ストレージのJSONが破損している場合、安全にデフォルト値へフォールバックすること
 *
 * 2. 設定変更（CRUD 操作）
 *    - 2-1. setEnabled で有効/無効を更新し、ストレージに保存されること
 *    - 2-2. addScheduleTime で新しい有効な時刻を追加し、正規化・昇順ソートされて保存されること
 *    - 2-3. addScheduleTime に不正な形式（例: "25:00"）を渡した場合は false を返し、状態が変更されないこと
 *    - 2-4. removeScheduleTime で指定した時刻が削除され、保存されること
 *    - 2-5. setScheduleTimes で時刻リストを一括更新できること
 *
 * 3. 定期監視とエクスポート実行（スケジューラ）
 *    - 3-1. enabled が true で指定時刻が到来した場合、exportCallback が実行され lastExportedSlot が更新されること
 *    - 3-2. 同一スロット（同日同一時刻）では二重に exportCallback が実行されないこと
 *    - 3-3. enabled が false の場合、指定時刻が到来しても exportCallback は実行されないこと
 *    - 3-4. exportCallback 完了時に notifyCallback が呼び出されること
 *    - 3-5. triggerManualExport を呼んだ場合、enabled や時刻判定に関わらず即座にエクスポートが実行されること
 *
 * 4. ライフサイクル（hostConnected / hostDisconnected）
 *    - 4-1. hostConnected でタイマーが開始されること
 *    - 4-2. hostDisconnected でタイマーが解除されること
 */

describe("AutoExportController", () => {
  let mockHost: ReactiveControllerHost;
  let mockStorage: Record<string, string>;
  let storageAdapter: NonNullable<AutoExportControllerOptions["storage"]>;
  let mockNow: Date;
  let exportCallback: Mock<() => Promise<Blob>>;
  let notifyCallback: Mock<(fileName: string) => void>;
  let timerHandles: unknown[];
  let timerAdapter: NonNullable<AutoExportControllerOptions["timerProvider"]>;

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
    };
    mockNow = new Date(2026, 10, 3, 12, 0, 0); // 2026-11-03 12:00:00
    exportCallback = vi.fn<() => Promise<Blob>>().mockResolvedValue(new Blob(["mock-data"]));
    notifyCallback = vi.fn<(fileName: string) => void>();
    timerHandles = [];
    timerAdapter = {
      setInterval: (fn: () => void) => {
        timerHandles.push(fn);
        return fn;
      },
      clearInterval: (handle: unknown) => {
        const idx = timerHandles.indexOf(handle);
        if (idx !== -1) timerHandles.splice(idx, 1);
      },
    };
  });

  const createController = (options: Partial<AutoExportControllerOptions> = {}) => {
    return new AutoExportController(mockHost, {
      storage: storageAdapter,
      nowProvider: () => mockNow,
      timerProvider: timerAdapter,
      exportCallback,
      notifyCallback,
      ...options,
    });
  };

  describe("1. 初期化と永続化", () => {
    it("1-1. ストレージに保存された設定がある場合、それを読み込んで初期状態とすること", () => {
      mockStorage["stepnote_auto_export_settings"] = JSON.stringify({
        enabled: true,
        scheduleTimes: ["09:00", "18:00"],
        lastExportedSlot: "2026-11-03 09:00",
      });
      const controller = createController();
      expect(controller.state.enabled).toBe(true);
      expect(controller.state.scheduleTimes).toEqual(["09:00", "18:00"]);
      expect(controller.state.lastExportedSlot).toBe("2026-11-03 09:00");
    });

    it("1-2. ストレージに設定がない場合、DEFAULT_AUTO_EXPORT_SETTINGS を初期状態とすること", () => {
      const controller = createController();
      expect(controller.state.enabled).toBe(DEFAULT_AUTO_EXPORT_SETTINGS.enabled);
      expect(controller.state.scheduleTimes).toEqual(DEFAULT_AUTO_EXPORT_SETTINGS.scheduleTimes);
    });

    it("1-3. ストレージのJSONが破損している場合、安全にデフォルト値へフォールバックすること", () => {
      mockStorage["stepnote_auto_export_settings"] = "{ broken json ";
      const controller = createController();
      expect(controller.state.enabled).toBe(false);
      expect(controller.state.scheduleTimes).toEqual(DEFAULT_AUTO_EXPORT_SETTINGS.scheduleTimes);
    });
  });

  describe("2. 設定変更（CRUD 操作）", () => {
    it("2-1. setEnabled で有効/無効を更新し、ストレージに保存されること", () => {
      const controller = createController();
      controller.setEnabled(true);
      expect(controller.state.enabled).toBe(true);
      expect(JSON.parse(mockStorage["stepnote_auto_export_settings"]).enabled).toBe(true);
      expect(mockHost.requestUpdate).toHaveBeenCalled();
    });

    it("2-2. addScheduleTime で新しい有効な時刻を追加し、正規化・昇順ソートされて保存されること", () => {
      const controller = createController();
      const added = controller.addScheduleTime("06:30");
      expect(added).toBe(true);
      expect(controller.state.scheduleTimes).toContain("06:30");
      expect(controller.state.scheduleTimes[0]).toBe("06:30"); // 昇順先頭
      expect(mockHost.requestUpdate).toHaveBeenCalled();
    });

    it("2-3. addScheduleTime に不正な形式を渡した場合は false を返し、状態が変更されないこと", () => {
      const controller = createController();
      const initialCount = controller.state.scheduleTimes.length;
      const added = controller.addScheduleTime("99:99");
      expect(added).toBe(false);
      expect(controller.state.scheduleTimes.length).toBe(initialCount);
    });

    it("2-4. removeScheduleTime で指定した時刻が削除され、保存されること", () => {
      const controller = createController();
      controller.removeScheduleTime("12:00");
      expect(controller.state.scheduleTimes).not.toContain("12:00");
      expect(mockHost.requestUpdate).toHaveBeenCalled();
    });

    it("2-5. setScheduleTimes で時刻リストを一括更新できること", () => {
      const controller = createController();
      controller.setScheduleTimes(["20:00", "07:00"]);
      expect(controller.state.scheduleTimes).toEqual(["07:00", "20:00"]);
    });
  });

  describe("3. 定期監視とエクスポート実行", () => {
    it("3-1. enabled が true で指定時刻が到来した場合、exportCallback が実行され lastExportedSlot が更新されること", async () => {
      const controller = createController();
      controller.setEnabled(true); // scheduleTimes: ["08:00", "12:00", "17:15"]
      mockNow = new Date(2026, 10, 3, 12, 0, 10); // 12:00 スロット

      const executed = await controller.checkAndExport();
      expect(executed).toBe(true);
      expect(exportCallback).toHaveBeenCalledTimes(1);
      expect(controller.state.lastExportedSlot).toBe("2026-11-03 12:00");
      expect(controller.state.lastExportedAt).toBeDefined();
    });

    it("3-2. 同一スロット（同日同一時刻）では二重に exportCallback が実行されないこと", async () => {
      const controller = createController();
      controller.setEnabled(true);
      mockNow = new Date(2026, 10, 3, 12, 0, 10);

      await controller.checkAndExport();
      expect(exportCallback).toHaveBeenCalledTimes(1);

      // 同一スロットで再チェック
      const secondResult = await controller.checkAndExport();
      expect(secondResult).toBe(false);
      expect(exportCallback).toHaveBeenCalledTimes(1);
    });

    it("3-3. enabled が false の場合、指定時刻が到来しても exportCallback は実行されないこと", async () => {
      const controller = createController();
      controller.setEnabled(false);
      mockNow = new Date(2026, 10, 3, 12, 0, 0);

      const executed = await controller.checkAndExport();
      expect(executed).toBe(false);
      expect(exportCallback).not.toHaveBeenCalled();
    });

    it("3-4. exportCallback 完了時に notifyCallback が呼び出されること", async () => {
      const controller = createController();
      controller.setEnabled(true);
      mockNow = new Date(2026, 10, 3, 12, 0, 0);

      await controller.checkAndExport();
      expect(notifyCallback).toHaveBeenCalledTimes(1);
    });

    it("3-5. triggerManualExport を呼んだ場合、enabled や時刻判定に関わらず即座にエクスポートが実行されること", async () => {
      const controller = createController();
      controller.setEnabled(false); // 無効状態
      mockNow = new Date(2026, 10, 3, 15, 33, 0); // スケジュール外

      const executed = await controller.triggerManualExport();
      expect(executed).toBe(true);
      expect(exportCallback).toHaveBeenCalledTimes(1);
      expect(notifyCallback).toHaveBeenCalledTimes(1);
    });
  });

  describe("4. ライフサイクル", () => {
    it("4-1. hostConnected でタイマーが開始されること", () => {
      const controller = createController();
      controller.hostConnected();
      expect(timerHandles.length).toBe(1);
    });

    it("4-2. hostDisconnected でタイマーが解除されること", () => {
      const controller = createController();
      controller.hostConnected();
      expect(timerHandles.length).toBe(1);
      controller.hostDisconnected();
      expect(timerHandles.length).toBe(0);
    });
  });
});
