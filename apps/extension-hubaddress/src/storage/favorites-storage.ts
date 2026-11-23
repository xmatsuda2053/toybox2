export const FAVORITES_STORAGE_KEY = "hubaddress_favorites";

export interface FavoritesState {
  staffKeys: string[];
  organizationKeys: string[];
}

export interface StorageAreaLike {
  get: (keys: string) => Promise<Record<string, unknown>>;
  set: (items: Record<string, unknown>) => Promise<void>;
}

const EMPTY_FAVORITES: FavoritesState = {
  staffKeys: [],
  organizationKeys: [],
};

function resolveStorageArea(
  injected?: StorageAreaLike,
): StorageAreaLike | undefined {
  if (injected) {
    return injected;
  }

  const chromeStorage = (
    globalThis as {
      chrome?: { storage?: { local?: StorageAreaLike } };
    }
  ).chrome?.storage?.local;

  if (chromeStorage) {
    return chromeStorage;
  }

  if (typeof globalThis.localStorage !== "undefined") {
    return {
      get: async (key: string) => {
        const raw = globalThis.localStorage.getItem(key);
        return raw ? { [key]: JSON.parse(raw) as unknown } : {};
      },
      set: async (items: Record<string, unknown>) => {
        for (const [k, v] of Object.entries(items)) {
          globalThis.localStorage.setItem(k, JSON.stringify(v));
        }
      },
    };
  }

  return undefined;
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === "string");
}

/**
 * お気に入り状態をローカルストレージから読み込む
 */
export async function loadFavorites(
  storageArea?: StorageAreaLike,
): Promise<FavoritesState> {
  const area = resolveStorageArea(storageArea);
  if (!area) {
    return { ...EMPTY_FAVORITES };
  }

  try {
    const result = await area.get(FAVORITES_STORAGE_KEY);
    const raw = result[FAVORITES_STORAGE_KEY];
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
      return { ...EMPTY_FAVORITES };
    }
    const record = raw as Record<string, unknown>;
    return {
      staffKeys: normalizeStringArray(record.staffKeys),
      organizationKeys: normalizeStringArray(record.organizationKeys),
    };
  } catch {
    return { ...EMPTY_FAVORITES };
  }
}

/**
 * お気に入り状態をローカルストレージへ永続化する
 */
export async function saveFavorites(
  state: FavoritesState,
  storageArea?: StorageAreaLike,
): Promise<void> {
  const area = resolveStorageArea(storageArea);
  if (!area) {
    return;
  }

  await area.set({
    [FAVORITES_STORAGE_KEY]: {
      staffKeys: [...state.staffKeys],
      organizationKeys: [...state.organizationKeys],
    },
  });
}
