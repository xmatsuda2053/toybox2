import type { ThemeMode } from "../models/directory.model";

export const THEME_STORAGE_KEY = "hubaddress_theme";

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

function isThemeMode(value: unknown): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system";
}

/**
 * テーマ設定をローカルストレージから読み込む
 */
export async function loadTheme(
  storageArea?: StorageAreaLike,
): Promise<ThemeMode> {
  const area = resolveStorageArea(storageArea);
  if (!area) {
    return "system";
  }

  try {
    const result = await area.get(THEME_STORAGE_KEY);
    const raw = result[THEME_STORAGE_KEY];
    return isThemeMode(raw) ? raw : "system";
  } catch {
    return "system";
  }
}

/**
 * テーマ設定をローカルストレージへ永続化する
 */
export async function saveTheme(
  mode: ThemeMode,
  storageArea?: StorageAreaLike,
): Promise<void> {
  const area = resolveStorageArea(storageArea);
  if (!area) {
    return;
  }

  await area.set({ [THEME_STORAGE_KEY]: mode });
}

/**
 * テーマ設定と OS ダークモード状態から実効テーマ ("light" | "dark") を解決する
 */
export function resolveEffectiveTheme(
  mode: ThemeMode,
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
  mode: ThemeMode,
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
