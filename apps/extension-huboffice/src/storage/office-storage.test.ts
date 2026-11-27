import { describe, it, expect, vi } from "vitest";
import {
  PINNED_TOOLS_STORAGE_KEY,
  LAST_VIEW_STORAGE_KEY,
  loadPinnedToolIds,
  savePinnedToolIds,
  loadLastView,
  saveLastView,
} from "./office-storage";
import type { StorageAreaLike } from "./theme-storage";

/**
 * テスト仕様: HubOffice 状態永続化ユーティリティ (office-storage.ts)
 *
 * - 仕様1: ピン留めツール ID 配列を読み込み、重複・非文字列・未知ツール ID を除外すること
 * - 仕様2: 未保存や不正値時は空配列を返すこと
 * - 仕様3: savePinnedToolIds で重複を除いて保存できること
 * - 仕様4: 前回表示画面（home / settings / 有効ツールID）を読み込み、未知ID時は home へフォールバックすること
 * - 仕様5: saveLastView で前回表示画面を保存できること
 */
describe("HubOffice State Storage Tests", () => {
  const validToolIds = ["wareki-converter", "qr-generator"] as const;

  it("ピン留めツール ID を読み込み、重複や未知 ID を除外すること", async () => {
    const storage: StorageAreaLike = {
      get: vi.fn().mockResolvedValue({
        [PINNED_TOOLS_STORAGE_KEY]: [
          "qr-generator",
          "unknown-tool",
          "qr-generator",
          123,
          "wareki-converter",
        ],
      }),
      set: vi.fn().mockResolvedValue(undefined),
    };

    const pinned = await loadPinnedToolIds(validToolIds, storage);
    expect(pinned).toEqual(["qr-generator", "wareki-converter"]);
  });

  it("ピン留めデータが未保存または不正型の場合は空配列を返すこと", async () => {
    const storage: StorageAreaLike = {
      get: vi.fn().mockResolvedValue({
        [PINNED_TOOLS_STORAGE_KEY]: "not-an-array",
      }),
      set: vi.fn().mockResolvedValue(undefined),
    };

    expect(await loadPinnedToolIds(validToolIds, storage)).toEqual([]);
  });

  it("savePinnedToolIds でピン留めツール ID 配列を保存すること", async () => {
    const set = vi.fn().mockResolvedValue(undefined);
    const storage: StorageAreaLike = {
      get: vi.fn().mockResolvedValue({}),
      set,
    };

    await savePinnedToolIds(["qr-generator", "qr-generator"], storage);
    expect(set).toHaveBeenCalledWith({
      [PINNED_TOOLS_STORAGE_KEY]: ["qr-generator"],
    });
  });

  it("前回表示画面を読み込み、有効な値のみ復元し未知ID時は home を返すこと", async () => {
    const toolStorage: StorageAreaLike = {
      get: vi.fn().mockResolvedValue({
        [LAST_VIEW_STORAGE_KEY]: "wareki-converter",
      }),
      set: vi.fn().mockResolvedValue(undefined),
    };
    expect(await loadLastView(validToolIds, toolStorage)).toBe(
      "wareki-converter",
    );

    const settingsStorage: StorageAreaLike = {
      get: vi.fn().mockResolvedValue({
        [LAST_VIEW_STORAGE_KEY]: "settings",
      }),
      set: vi.fn().mockResolvedValue(undefined),
    };
    expect(await loadLastView(validToolIds, settingsStorage)).toBe("settings");

    const invalidStorage: StorageAreaLike = {
      get: vi.fn().mockResolvedValue({
        [LAST_VIEW_STORAGE_KEY]: "deleted-tool",
      }),
      set: vi.fn().mockResolvedValue(undefined),
    };
    expect(await loadLastView(validToolIds, invalidStorage)).toBe("home");
  });

  it("saveLastView で前回表示画面を保存すること", async () => {
    const set = vi.fn().mockResolvedValue(undefined);
    const storage: StorageAreaLike = {
      get: vi.fn().mockResolvedValue({}),
      set,
    };

    await saveLastView("qr-generator", storage);
    expect(set).toHaveBeenCalledWith({
      [LAST_VIEW_STORAGE_KEY]: "qr-generator",
    });
  });
});
