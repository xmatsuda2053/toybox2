import type { ActiveView } from "../models/huboffice.model";
import { resolveStorageArea, type StorageAreaLike } from "./theme-storage";

export const PINNED_TOOLS_STORAGE_KEY = "huboffice_pinned_tools";
export const LAST_VIEW_STORAGE_KEY = "huboffice_last_view";

function sanitizePinnedIds(
  raw: unknown,
  validToolIds: readonly string[],
): string[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const validSet = new Set(validToolIds);
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of raw) {
    if (typeof item === "string" && validSet.has(item) && !seen.has(item)) {
      seen.add(item);
      result.push(item);
    }
  }
  return result;
}

/**
 * ピン留めされたツール ID 配列を読み込む
 */
export async function loadPinnedToolIds(
  validToolIds: readonly string[],
  storageArea?: StorageAreaLike,
): Promise<string[]> {
  const area = resolveStorageArea(storageArea);
  if (!area) {
    return [];
  }

  try {
    const result = await area.get(PINNED_TOOLS_STORAGE_KEY);
    return sanitizePinnedIds(result[PINNED_TOOLS_STORAGE_KEY], validToolIds);
  } catch {
    return [];
  }
}

/**
 * ピン留めされたツール ID 配列を永続化する
 */
export async function savePinnedToolIds(
  pinnedIds: readonly string[],
  storageArea?: StorageAreaLike,
): Promise<void> {
  const area = resolveStorageArea(storageArea);
  if (!area) {
    return;
  }

  const deduped = Array.from(new Set(pinnedIds));
  await area.set({ [PINNED_TOOLS_STORAGE_KEY]: deduped });
}

/**
 * 前回終了時の画面状態（home / settings / 有効ツール ID）を読み込む
 */
export async function loadLastView(
  validToolIds: readonly string[],
  storageArea?: StorageAreaLike,
): Promise<ActiveView> {
  const area = resolveStorageArea(storageArea);
  if (!area) {
    return "home";
  }

  try {
    const result = await area.get(LAST_VIEW_STORAGE_KEY);
    const raw = result[LAST_VIEW_STORAGE_KEY];
    if (raw === "home" || raw === "settings") {
      return raw;
    }
    if (typeof raw === "string" && validToolIds.includes(raw)) {
      return raw;
    }
    return "home";
  } catch {
    return "home";
  }
}

/**
 * 現在の画面状態を永続化する
 */
export async function saveLastView(
  view: ActiveView,
  storageArea?: StorageAreaLike,
): Promise<void> {
  const area = resolveStorageArea(storageArea);
  if (!area) {
    return;
  }

  await area.set({ [LAST_VIEW_STORAGE_KEY]: view });
}
