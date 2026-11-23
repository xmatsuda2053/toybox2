import type { StaffSortMode } from "../models/directory.model";
import { resolveStorageArea, type StorageAreaLike } from "./theme-storage";

export const STAFF_SORT_STORAGE_KEY = "hubaddress_staff_sort";

function isStaffSortMode(value: unknown): value is StaffSortMode {
  return value === "department" || value === "name" || value === "staffId";
}

/**
 * 職員一覧のソート順設定をローカルストレージから読み込む
 */
export async function loadStaffSortMode(
  storageArea?: StorageAreaLike,
): Promise<StaffSortMode> {
  const area = resolveStorageArea(storageArea);
  if (!area) {
    return "department";
  }

  try {
    const result = await area.get(STAFF_SORT_STORAGE_KEY);
    const raw = result[STAFF_SORT_STORAGE_KEY];
    return isStaffSortMode(raw) ? raw : "department";
  } catch {
    return "department";
  }
}

/**
 * 職員一覧のソート順設定をローカルストレージへ永続化する
 */
export async function saveStaffSortMode(
  mode: StaffSortMode,
  storageArea?: StorageAreaLike,
): Promise<void> {
  const area = resolveStorageArea(storageArea);
  if (!area) {
    return;
  }

  await area.set({ [STAFF_SORT_STORAGE_KEY]: mode });
}
