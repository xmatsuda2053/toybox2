import { describe, it, expect, vi } from "vitest";
import {
  ORGANIZATION_SORT_STORAGE_KEY,
  STAFF_SORT_STORAGE_KEY,
  loadOrganizationSortMode,
  loadStaffSortMode,
  saveOrganizationSortMode,
  saveStaffSortMode,
} from "./sort-storage";
import type { StorageAreaLike } from "./theme-storage";

/**
 * テスト仕様: ソート順設定永続化ユーティリティ (sort-storage.ts)
 *
 * - 仕様1: ストレージから職員の保存済みソート順（department / name / staffId）を読み込めること
 * - 仕様2: 職員ソート順が未保存や不正値の場合はデフォルト値 'department' を返すこと
 * - 仕様3: saveStaffSortMode で選択した職員ソート順をストレージへ保存できること
 * - 仕様4: ストレージから組織の保存済みソート順（registered / department / location）を読み込め、未保存・不正値時は 'registered' を返すこと
 * - 仕様5: saveOrganizationSortMode で選択した組織ソート順をストレージへ保存できること
 */
describe("Staff Sort Storage Tests", () => {
  it("ストレージから保存済みソート順を読み込み、不正値時は department にフォールバックすること", async () => {
    const validStorage: StorageAreaLike = {
      get: vi.fn().mockResolvedValue({ [STAFF_SORT_STORAGE_KEY]: "staffId" }),
      set: vi.fn().mockResolvedValue(undefined),
    };
    expect(await loadStaffSortMode(validStorage)).toBe("staffId");

    const invalidStorage: StorageAreaLike = {
      get: vi.fn().mockResolvedValue({ [STAFF_SORT_STORAGE_KEY]: "invalid" }),
      set: vi.fn().mockResolvedValue(undefined),
    };
    expect(await loadStaffSortMode(invalidStorage)).toBe("department");

    const emptyStorage: StorageAreaLike = {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
    };
    expect(await loadStaffSortMode(emptyStorage)).toBe("department");
  });

  it("saveStaffSortMode でソート順設定をストレージへ保存できること", async () => {
    const set = vi.fn().mockResolvedValue(undefined);
    const storage: StorageAreaLike = {
      get: vi.fn().mockResolvedValue({}),
      set,
    };

    await saveStaffSortMode("name", storage);
    expect(set).toHaveBeenCalledWith({ [STAFF_SORT_STORAGE_KEY]: "name" });
  });

  it("ストレージから組織の保存済みソート順を読み込み、未保存・不正値時は registered にフォールバックすること", async () => {
    const validStorage: StorageAreaLike = {
      get: vi
        .fn()
        .mockResolvedValue({ [ORGANIZATION_SORT_STORAGE_KEY]: "location" }),
      set: vi.fn().mockResolvedValue(undefined),
    };
    expect(await loadOrganizationSortMode(validStorage)).toBe("location");

    const invalidStorage: StorageAreaLike = {
      get: vi
        .fn()
        .mockResolvedValue({ [ORGANIZATION_SORT_STORAGE_KEY]: "invalid" }),
      set: vi.fn().mockResolvedValue(undefined),
    };
    expect(await loadOrganizationSortMode(invalidStorage)).toBe("registered");

    const emptyStorage: StorageAreaLike = {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
    };
    expect(await loadOrganizationSortMode(emptyStorage)).toBe("registered");
  });

  it("saveOrganizationSortMode で組織のソート順設定をストレージへ保存できること", async () => {
    const set = vi.fn().mockResolvedValue(undefined);
    const storage: StorageAreaLike = {
      get: vi.fn().mockResolvedValue({}),
      set,
    };

    await saveOrganizationSortMode("department", storage);
    expect(set).toHaveBeenCalledWith({
      [ORGANIZATION_SORT_STORAGE_KEY]: "department",
    });
  });
});
