import { describe, it, expect, vi, afterEach } from "vitest";
import {
  formatStorageSize,
  getStorageEstimate,
} from "./app-footer.utils.js";

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
 */

describe("AppFooter Utilities", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. formatStorageSize", () => {
    it("1-1. undefined または null の場合は '0 KB' を返すこと", () => {
      expect(formatStorageSize(undefined)).toBe("0 KB");
      expect(formatStorageSize(null as unknown as number)).toBe("0 KB");
    });

    it("1-2. 0 バイトの場合は '0 KB' を返すこと", () => {
      expect(formatStorageSize(0)).toBe("0 KB");
    });

    it("1-3. 1024 バイト未満の場合は 'B' 単位でフォーマットされること", () => {
      expect(formatStorageSize(500)).toBe("500 B");
    });

    it("1-4. KB 単位の数値が適切にフォーマットされること", () => {
      expect(formatStorageSize(1024)).toBe("1.0 KB");
      expect(formatStorageSize(1536)).toBe("1.5 KB");
    });

    it("1-5. MB 単位の数値が適切にフォーマットされること", () => {
      expect(formatStorageSize(2.4 * 1024 * 1024)).toBe("2.4 MB");
    });

    it("1-6. GB 単位の数値が適切にフォーマットされること", () => {
      expect(formatStorageSize(1.2 * 1024 * 1024 * 1024)).toBe("1.2 GB");
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
});
