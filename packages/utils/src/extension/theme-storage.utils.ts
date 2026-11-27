export type ExtensionThemeMode = "light" | "dark" | "system";

export interface StorageAreaLike {
  get: (keys: string) => Promise<Record<string, unknown>>;
  set: (items: Record<string, unknown>) => Promise<void>;
}

export interface ThemeRootLike {
  classList: {
    add: (token: string) => void;
    remove: (token: string) => void;
  };
  setAttribute: (name: string, value: string) => void;
}

export interface ExtensionThemeStorage {
  loadTheme: (storageArea?: StorageAreaLike) => Promise<ExtensionThemeMode>;
  saveTheme: (
    mode: ExtensionThemeMode,
    storageArea?: StorageAreaLike,
  ) => Promise<void>;
}

/**
 * chrome.storage.local または localStorage フォールバックを解決する
 */
export function resolveStorageArea(
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

function isThemeMode(value: unknown): value is ExtensionThemeMode {
  return value === "light" || value === "dark" || value === "system";
}

/**
 * 指定ストレージキーでテーマ設定を読み書きするストレージヘルパーを生成する
 */
export function createThemeStorage(storageKey: string): ExtensionThemeStorage {
  const loadTheme = async (
    storageArea?: StorageAreaLike,
  ): Promise<ExtensionThemeMode> => {
    const area = resolveStorageArea(storageArea);
    if (!area) {
      return "system";
    }

    try {
      const result = await area.get(storageKey);
      const raw = result[storageKey];
      return isThemeMode(raw) ? raw : "system";
    } catch {
      return "system";
    }
  };

  const saveTheme = async (
    mode: ExtensionThemeMode,
    storageArea?: StorageAreaLike,
  ): Promise<void> => {
    const area = resolveStorageArea(storageArea);
    if (!area) {
      return;
    }

    await area.set({ [storageKey]: mode });
  };

  return { loadTheme, saveTheme };
}

/**
 * テーマ設定と OS ダークモード状態から実効テーマ ("light" | "dark") を解決する
 */
export function resolveEffectiveTheme(
  mode: ExtensionThemeMode,
  prefersDark: boolean,
): "light" | "dark" {
  if (mode === "system") {
    return prefersDark ? "dark" : "light";
  }
  return mode;
}

/**
 * OS のカラースキーム設定がダークモードか判定する
 */
export function getSystemPrefersDark(): boolean {
  if (
    typeof globalThis.window === "undefined" ||
    typeof globalThis.window.matchMedia !== "function"
  ) {
    return false;
  }
  return globalThis.window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/**
 * ルート要素へ Web Awesome テーマクラス (wa-dark / wa-light) と data-theme を適用する
 */
export function applyThemeToRoot(
  mode: ExtensionThemeMode,
  root: ThemeRootLike | undefined = typeof document !== "undefined"
    ? document.documentElement
    : undefined,
  prefersDark: boolean = getSystemPrefersDark(),
): void {
  if (!root) {
    return;
  }

  const effective = resolveEffectiveTheme(mode, prefersDark);
  if (effective === "dark") {
    root.classList.remove("wa-light");
    root.classList.add("wa-dark");
    root.setAttribute("data-theme", "dark");
    return;
  }

  root.classList.remove("wa-dark");
  root.classList.add("wa-light");
  root.setAttribute("data-theme", "light");
}
