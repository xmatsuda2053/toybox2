import "fake-indexeddb/auto";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { flattenTemplate } from "@shared/utils";
import { AppFooter } from "./app-footer.js";
import { TASK_STATUS_CODE } from "../../constants/task-status.constants.js";
import type { TaskListController } from "../../controllers/task-list.controller.js";

/**
 * 【AppFooter コンポーネント仕様 (app-footer.test.ts)】
 *
 * 1. 基本レンダリング構造
 *    - 1-1. ルート要素として footer.app-footer がレンダリングされること
 *    - 1-2. 3ゾーンのコンテナ (.app-footer__context, .app-footer__center, .app-footer__system) がレンダリングされること
 *    - 1-3. 左ゾーン (.app-footer__context) にローカル保存インジケーター (wa-icon[name="circle-check-solid-full"] およびテキスト「Saved」) がレンダリングされること
 *    - 1-4. 左ゾーンにストレージ使用量インジケーター (wa-icon[name="database-solid-full"]) がレンダリングされること
 *    - 1-5. 各インジケーターにツールチップ（wa-tooltip）が設定され、trigger="hover" および placement="top" でホバー時のみ表示されること
 *    - 1-6. 左ゾーンに年度インジケーター (wa-icon[name="calendar-solid-full"]) がレンダリングされること
 *    - 1-7. 左ゾーンにタスク進捗カウンター (wa-icon[name="list-check-solid-full"]) がレンダリングされること
 *    - 1-8. 年度およびタスク進捗に wa-tooltip（trigger="hover", placement="top"）が設定されること
 *
 * 2. ストレージ推定使用量の表示
 *    - 2-1. storageUsage が設定されている場合、フォーマットされた文字列 (例: "2.4 MB") が表示されること
 *    - 2-2. storageUsage が 0 または未設定の場合、"0 KB" が表示されること
 *
 * 3. ライフサイクル・初期化
 *    - 3-1. connectedCallback 実行時に updateStorageUsage が呼び出され、使用量が反映されること
 *
 * 4. タスク進捗・年度の表示
 *    - 4-1. fiscalYear が設定されている場合、年度アイコンと数値が表示されること
 *    - 4-2. taskListController が注入されている場合、タスク進捗（X/Y Tasks (Z%)）が表示されること
 */

describe("AppFooter Component", () => {
  let footer: AppFooter;

  beforeEach(() => {
    footer = new AppFooter();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. 基本レンダリング構造", () => {
    it("1-1. ルート要素として footer.app-footer がレンダリングされること", () => {
      const htmlStr = flattenTemplate(footer.render());
      expect(htmlStr).toContain("<footer");
      expect(htmlStr).toContain("app-footer");
    });

    it("1-2. 3ゾーンのコンテナ (.app-footer__context, .app-footer__center, .app-footer__system) がレンダリングされること", () => {
      const htmlStr = flattenTemplate(footer.render());
      expect(htmlStr).toContain("app-footer__context");
      expect(htmlStr).toContain("app-footer__center");
      expect(htmlStr).toContain("app-footer__system");
    });

    it("1-3. 左ゾーン (.app-footer__context) にローカル保存インジケーターがレンダリングされること", () => {
      const htmlStr = flattenTemplate(footer.render());
      expect(htmlStr).toContain("circle-check-solid-full");
      expect(htmlStr).toContain('library="my-icons"');
      expect(htmlStr).toContain("Saved");
    });

    it("1-4. 左ゾーンにストレージ使用量インジケーターがレンダリングされること", () => {
      const htmlStr = flattenTemplate(footer.render());
      expect(htmlStr).toContain("database-solid-full");
      expect(htmlStr).toContain('library="my-icons"');
    });

    it("1-5. 各インジケーターにツールチップ（wa-tooltip）が設定され、trigger='hover' および placement='top' でホバー時のみ表示されること", () => {
      const htmlStr = flattenTemplate(footer.render());
      expect(htmlStr).toMatch(
        /<wa-tooltip[^>]*for="footer-status-saved"[^>]*placement="top"[^>]*trigger="hover"/,
      );
      expect(htmlStr).toContain("データはローカルのIndexedDBに自動保存されています");

      expect(htmlStr).toMatch(
        /<wa-tooltip[^>]*for="footer-status-storage"[^>]*placement="top"[^>]*trigger="hover"/,
      );
      expect(htmlStr).toContain("IndexedDBの推定ストレージ使用量");
    });

    it("1-6. 左ゾーンに年度インジケーターがレンダリングされること", () => {
      footer.fiscalYear = 2025;
      const htmlStr = flattenTemplate(footer.render());
      expect(htmlStr).toContain("calendar-solid-full");
      expect(htmlStr).toContain("2025");
    });

    it("1-7. 左ゾーンにタスク進捗カウンターがレンダリングされること", () => {
      footer.totalTaskCount = 12;
      footer.filteredTaskCount = 8;
      footer.completedTaskCount = 8;
      const htmlStr = flattenTemplate(footer.render());
      expect(htmlStr).toContain("list-check-solid-full");
      expect(htmlStr).toContain("8/12 Tasks (67%)");
    });

    it("1-8. 年度およびタスク進捗に wa-tooltip（trigger='hover', placement='top'）が設定されること", () => {
      footer.fiscalYear = 2025;
      footer.totalTaskCount = 12;
      footer.filteredTaskCount = 8;
      footer.completedTaskCount = 8;
      const htmlStr = flattenTemplate(footer.render());

      expect(htmlStr).toMatch(
        /<wa-tooltip[^>]*for="footer-status-year"[^>]*placement="top"[^>]*trigger="hover"/,
      );
      expect(htmlStr).toContain("2025年度");

      expect(htmlStr).toMatch(
        /<wa-tooltip[^>]*for="footer-status-tasks"[^>]*placement="top"[^>]*trigger="hover"/,
      );
      expect(htmlStr).toContain("表示中: 8件 / 総タスク: 12件");
    });
  });

  describe("2. ストレージ推定使用量の表示", () => {
    it("2-1. storageUsage が設定されている場合、フォーマットされた文字列が表示されること", () => {
      footer.storageUsage = 2.4 * 1024 * 1024;
      const htmlStr = flattenTemplate(footer.render());
      expect(htmlStr).toContain("2.4 MB");
    });

    it("2-2. storageUsage が 0 または未設定の場合、'0 KB' が表示されること", () => {
      footer.storageUsage = undefined;
      const htmlStr = flattenTemplate(footer.render());
      expect(htmlStr).toContain("0 KB");
    });
  });

  describe("3. ライフサイクル・初期化", () => {
    it("3-1. updateStorageUsage 実行時に取得した推定ストレージ量が反映されること", async () => {
      vi.spyOn(footer, "fetchStorageUsage").mockResolvedValue(1024 * 1024);
      await footer.updateStorageUsage();
      expect(footer.storageUsage).toBe(1024 * 1024);
    });
  });

  describe("4. タスク進捗・年度の表示", () => {
    it("4-1. fiscalYear が設定されている場合、年度アイコンと数値が表示されること", () => {
      footer.fiscalYear = 2026;
      const htmlStr = flattenTemplate(footer.render());
      expect(htmlStr).toContain("2026");
    });

    it("4-2. taskListController が注入されている場合、タスク進捗が表示されること", () => {
      const mockController = {
        fiscalYear: 2025,
        state: [
          { id: 1, statusCode: TASK_STATUS_CODE.DONE },
          { id: 2, statusCode: TASK_STATUS_CODE.PROGRESS },
        ],
        tasks: [
          { id: 1, statusCode: TASK_STATUS_CODE.DONE },
          { id: 2, statusCode: TASK_STATUS_CODE.PROGRESS },
          { id: 3, statusCode: TASK_STATUS_CODE.PENDING },
        ],
      };
      footer.taskListController = mockController as unknown as TaskListController;
      const htmlStr = flattenTemplate(footer.render());
      expect(htmlStr).toContain("2/3 Tasks (33%)");
    });
  });
});
