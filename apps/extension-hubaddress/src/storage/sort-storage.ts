import type {
  OrganizationSortMode,
  StaffSortMode,
} from "../models/directory.model";
import { resolveStorageArea, type StorageAreaLike } from "./theme-storage";

export const STAFF_SORT_STORAGE_KEY = "hubaddress_staff_sort";
export const ORGANIZATION_SORT_STORAGE_KEY = "hubaddress_organization_sort";

function isStaffSortMode(value: unknown): value is StaffSortMode {
  return value === "department" || value === "name" || value === "staffId";
}

function isOrganizationSortMode(value: unknown): value is OrganizationSortMode {
  return (
    value === "registered" || value === "department" || value === "location"
  );
}

async function loadSortMode<T extends string>(
  storageKey: string,
  defaultMode: T,
  isValid: (value: unknown) => value is T,
  storageArea?: StorageAreaLike,
): Promise<T> {
  const area = resolveStorageArea(storageArea);
  if (!area) {
    return defaultMode;
  }

  try {
    const result = await area.get(storageKey);
    const raw = result[storageKey];
    return isValid(raw) ? raw : defaultMode;
  } catch {
    return defaultMode;
  }
}

async function saveSortMode<T extends string>(
  storageKey: string,
  mode: T,
  storageArea?: StorageAreaLike,
): Promise<void> {
  const area = resolveStorageArea(storageArea);
  if (!area) {
    return;
  }

  await area.set({ [storageKey]: mode });
}

/**
 * 職員一覧のソート順設定をローカルストレージから読み込む
 */
export async function loadStaffSortMode(
  storageArea?: StorageAreaLike,
): Promise<StaffSortMode> {
  return loadSortMode(
    STAFF_SORT_STORAGE_KEY,
    "department",
    isStaffSortMode,
    storageArea,
  );
}

/**
 * 職員一覧のソート順設定をローカルストレージへ永続化する
 */
export async function saveStaffSortMode(
  mode: StaffSortMode,
  storageArea?: StorageAreaLike,
): Promise<void> {
  await saveSortMode(STAFF_SORT_STORAGE_KEY, mode, storageArea);
}

/**
 * 組織一覧のソート順設定をローカルストレージから読み込む
 */
export async function loadOrganizationSortMode(
  storageArea?: StorageAreaLike,
): Promise<OrganizationSortMode> {
  return loadSortMode(
    ORGANIZATION_SORT_STORAGE_KEY,
    "registered",
    isOrganizationSortMode,
    storageArea,
  );
}

/**
 * 組織一覧のソート順設定をローカルストレージへ永続化する
 */
export async function saveOrganizationSortMode(
  mode: OrganizationSortMode,
  storageArea?: StorageAreaLike,
): Promise<void> {
  await saveSortMode(ORGANIZATION_SORT_STORAGE_KEY, mode, storageArea);
}
