import { describe, it, expect, vi, afterEach } from "vitest";
import {
  formatStorageSize,
  getStorageEstimate,
  calculateTaskMetrics,
  formatTaskProgress,
  formatTaskProgressTooltip,
} from "./app-footer.utils.js";
import { TASK_STATUS_CODE } from "../../constants/task-status.constants.js";

/**
 * 【AppFooter ユーティリティ仕様 (app-footer.utils.test.ts)】
 *
 * 1. formatStorageSize (ストレージサイズ文字列フォーマット)
 *    - 1-1. undefined または null の場合は "0 KB" を返すこと
 *    - 1-2. 0 バイトの場合は "0 KB" を返すこと
 *    - 1-3. 1024 バイト未満の場合は "B" 単位でフォーマットされること
 *    - 1-4. KB 単位の数値が適切にフォーマットされること (例: 1.5 KB)
 *    - 1-5. MB 単位の数値が適切にフォーマットされること (例: 2.4 MB)
 *    - 1-6. GB 単位の数値が適切にフォーマットされること (例: 1.2 GB)
 *
 * 2. getStorageEstimate (ストレージ使用量取得)
 *    - 2-1. navigator.storage.estimate が利用可能な場合、その usage 値を取得して返すこと
 *    - 2-2. navigator または navigator.storage が存在しない場合は undefined を返すこと
 *    - 2-3. estimate() が例外を送出した場合は安全に undefined を返すこと
 *
 * 3. calculateTaskMetrics (タスク集計と完了率算出)
 *    - 3-1. 未定義または空配列の場合は total: 0, completed: 0, rate: 0 を返すこと
 *    - 3-2. 完了タスクが含まれる場合、正しく件数と四捨五入の完了率を算出すること
 *    - 3-3. 全件完了の場合は rate: 100 を返すこと
 *
 * 4. formatTaskProgress (タスク進捗テキストのフォーマット)
 *    - 4-1. totalCount が 0 の場合は "0 Tasks" を返すこと
 *    - 4-2. フィルター未適用（filteredCount === totalCount）で複数件の場合、"X Tasks (Y%)" とフォーマットされること
 *    - 4-3. フィルター未適用で 1 件の場合、単数形 "1 Task (Y%)" とフォーマットされること
 *    - 4-4. フィルター適用中（filteredCount !== totalCount）の場合、"X/Y Tasks (Z%)" とフォーマットされること
 *
 * 5. formatTaskProgressTooltip (ツールチップ詳細テキストの生成)
 *    - 5-1. フィルター未適用の場合は "総タスク: X件 (完了: Y件, 完了率: Z%)" を返すこと
 *    - 5-2. フィルター適用中の場合は "表示中: X件 / 総タスク: Y件 (完了: Z件, 完了率: W%)" を返すこと
 */

describe("AppFooter Utilities", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. formatStorageSize", () => {
    it("1-1. undefined または null の場合は '0.00 MB' を返すこと", () => {
      expect(formatStorageSize(undefined)).toBe("0.00 MB");
      expect(formatStorageSize(null as unknown as number)).toBe("0.00 MB");
    });

    it("1-2. 0 バイトの場合は '0.00 MB' を返すこと", () => {
      expect(formatStorageSize(0)).toBe("0.00 MB");
    });

    it("1-3. 1024 バイト未満（例: 500 バイト）の場合、'0.00 MB' を返すこと", () => {
      expect(formatStorageSize(500)).toBe("0.00 MB");
    });

    it("1-4. 45 KB（46,080 バイト）の場合、'0.04 MB' を返すこと", () => {
      expect(formatStorageSize(46080)).toBe("0.04 MB");
    });

    it("1-5. 1.5 MB（1,572,864 バイト）の場合、'1.50 MB' を返すこと", () => {
      expect(formatStorageSize(1.5 * 1024 * 1024)).toBe("1.50 MB");
    });

    it("1-6. 10 MB（10,485,760 バイト）の場合、'10.00 MB' を返すこと", () => {
      expect(formatStorageSize(10 * 1024 * 1024)).toBe("10.00 MB");
    });
  });

  describe("2. getStorageEstimate", () => {
    it("2-1. navigator.storage.estimate が利用可能な場合、その usage 値を取得して返すこと", async () => {
      const mockEstimate = vi.fn().mockResolvedValue({ usage: 2516582 });
      const originalNavigator = globalThis.navigator;

      Object.defineProperty(globalThis, "navigator", {
        value: {
          storage: {
            estimate: mockEstimate,
          },
        },
        configurable: true,
        writable: true,
      });

      const result = await getStorageEstimate();
      expect(result).toBe(2516582);

      Object.defineProperty(globalThis, "navigator", {
        value: originalNavigator,
        configurable: true,
        writable: true,
      });
    });

    it("2-2. navigator.storage が存在しない場合は undefined を返すこと", async () => {
      const originalNavigator = globalThis.navigator;

      Object.defineProperty(globalThis, "navigator", {
        value: {},
        configurable: true,
        writable: true,
      });

      const result = await getStorageEstimate();
      expect(result).toBeUndefined();

      Object.defineProperty(globalThis, "navigator", {
        value: originalNavigator,
        configurable: true,
        writable: true,
      });
    });

    it("2-3. estimate() が例外を送出した場合は安全に undefined を返すこと", async () => {
      const originalNavigator = globalThis.navigator;

      Object.defineProperty(globalThis, "navigator", {
        value: {
          storage: {
            estimate: vi.fn().mockRejectedValue(new Error("Storage error")),
          },
        },
        configurable: true,
        writable: true,
      });

      const result = await getStorageEstimate();
      expect(result).toBeUndefined();

      Object.defineProperty(globalThis, "navigator", {
        value: originalNavigator,
        configurable: true,
        writable: true,
      });
    });
  });

  describe("3. calculateTaskMetrics", () => {
    it("3-1. 未定義または空配列の場合は total: 0, completed: 0, rate: 0 を返すこと", () => {
      expect(calculateTaskMetrics(undefined)).toEqual({
        total: 0,
        completed: 0,
        rate: 0,
      });
      expect(calculateTaskMetrics([])).toEqual({
        total: 0,
        completed: 0,
        rate: 0,
      });
    });

    it("3-2. 完了タスクが含まれる場合、正しく件数と四捨五入の完了率を算出すること", () => {
      const tasks = [
        { statusCode: TASK_STATUS_CODE.DONE },
        { statusCode: TASK_STATUS_CODE.PROGRESS },
        { statusCode: TASK_STATUS_CODE.DONE },
        { statusCode: TASK_STATUS_CODE.PENDING },
        { statusCode: TASK_STATUS_CODE.DONE },
        { statusCode: TASK_STATUS_CODE.PROGRESS },
        { statusCode: TASK_STATUS_CODE.PENDING },
        { statusCode: TASK_STATUS_CODE.PENDING },
      ];

      // 8件中3件完了 -> 3 / 8 = 37.5% -> 38%
      expect(calculateTaskMetrics(tasks)).toEqual({
        total: 8,
        completed: 3,
        rate: 38,
      });
    });

    it("3-3. 全件完了の場合は rate: 100 を返すこと", () => {
      const tasks = [
        { statusCode: TASK_STATUS_CODE.DONE },
        { statusCode: TASK_STATUS_CODE.DONE },
      ];

      expect(calculateTaskMetrics(tasks)).toEqual({
        total: 2,
        completed: 2,
        rate: 100,
      });
    });
  });

  describe("4. formatTaskProgress", () => {
    it("4-1. totalCount が 0 の場合は '0 Tasks' を返すこと", () => {
      expect(formatTaskProgress(0, 0, 0)).toBe("0 Tasks");
    });

    it("4-2. フィルター未適用（filteredCount === totalCount）で複数件の場合、'X Tasks (Y%)' とフォーマットされること", () => {
      expect(formatTaskProgress(12, 12, 67)).toBe("12 Tasks (67%)");
    });

    it("4-3. フィルター未適用で 1 件の場合、単数形 '1 Task (Y%)' とフォーマットされること", () => {
      expect(formatTaskProgress(1, 1, 0)).toBe("1 Task (0%)");
    });

    it("4-4. フィルター適用中（filteredCount !== totalCount）の場合、'X/Y Tasks (Z%)' とフォーマットされること", () => {
      expect(formatTaskProgress(8, 12, 67)).toBe("8/12 Tasks (67%)");
    });
  });

  describe("5. formatTaskProgressTooltip", () => {
    it("5-1. フィルター未適用の場合は '総タスク: X件 (完了: Y件, 完了率: Z%)' を返すこと", () => {
      expect(formatTaskProgressTooltip(12, 12, 8, 67)).toBe(
        "総タスク: 12件 (完了: 8件, 完了率: 67%)",
      );
    });

    it("5-2. フィルター適用中の場合は '表示中: X件 / 総タスク: Y件 (完了: Z件, 完了率: W%)' を返すこと", () => {
      expect(formatTaskProgressTooltip(8, 12, 8, 67)).toBe(
        "表示中: 8件 / 総タスク: 12件 (完了: 8件, 完了率: 67%)",
      );
    });
  });
});
