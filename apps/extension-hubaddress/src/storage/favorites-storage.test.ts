import { describe, it, expect, vi } from "vitest";
import {
  FAVORITES_STORAGE_KEY,
  loadFavorites,
  saveFavorites,
  type StorageAreaLike,
} from "./favorites-storage";

/**
 * テスト仕様: お気に入りローカル永続化ストレージ (favorites-storage.ts)
 *
 * - 仕様1: chrome.storage.local 互換ストレージから保存済みお気に入り（staffKeys, organizationKeys）を読み込めること
 * - 仕様2: 未保存や不正形式の場合に空配列のデフォルト値を返すこと
 * - 仕様3: saveFavorites でお気に入り状態を永続化できること
 */
describe("Favorites Storage Tests", () => {
  it("ストレージから保存済みお気に入りを読み込めること", async () => {
    const mockStorage: StorageAreaLike = {
      get: vi.fn().mockResolvedValue({
        [FAVORITES_STORAGE_KEY]: {
          staffKeys: ["staff:0010001"],
          organizationKeys: ["org:総務部 総務課::課長席"],
        },
      }),
      set: vi.fn().mockResolvedValue(undefined),
    };

    const loaded = await loadFavorites(mockStorage);
    expect(loaded).toEqual({
      staffKeys: ["staff:0010001"],
      organizationKeys: ["org:総務部 総務課::課長席"],
    });
  });

  it("未保存または不正データ時に空の初期値を返すこと", async () => {
    const mockStorage: StorageAreaLike = {
      get: vi.fn().mockResolvedValue({ [FAVORITES_STORAGE_KEY]: "broken" }),
      set: vi.fn().mockResolvedValue(undefined),
    };

    const loaded = await loadFavorites(mockStorage);
    expect(loaded).toEqual({
      staffKeys: [],
      organizationKeys: [],
    });
  });

  it("saveFavorites でお気に入りデータを保存できること", async () => {
    const set = vi.fn().mockResolvedValue(undefined);
    const mockStorage: StorageAreaLike = {
      get: vi.fn().mockResolvedValue({}),
      set,
    };

    await saveFavorites(
      {
        staffKeys: ["staff:001"],
        organizationKeys: ["org:営業課::"],
      },
      mockStorage,
    );

    expect(set).toHaveBeenCalledTimes(1);
    expect(set).toHaveBeenCalledWith({
      [FAVORITES_STORAGE_KEY]: {
        staffKeys: ["staff:001"],
        organizationKeys: ["org:営業課::"],
      },
    });
  });
});
