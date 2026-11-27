import { describe, it, expect, vi } from "vitest";
import {
  applyThemeToRoot,
  createThemeStorage,
  resolveEffectiveTheme,
  type StorageAreaLike,
  type ThemeRootLike,
} from "./theme-storage.utils";

/**
 * 【theme-storage.utils 仕様（拡張機能共通テーマ永続化・適用ユーティリティ）】
 *
 * 1. ストレージ永続化（createThemeStorage）
 *    - 1-1. 指定したストレージキーで saveTheme / loadTheme が読み書きできること
 *    - 1-2. 未保存または不正値・例外発生時はデフォルト "system" を返すこと
 *
 * 2. 実効テーマ解決・ルート要素適用（resolveEffectiveTheme / applyThemeToRoot）
 *    - 2-1. system モード時は prefersDark に応じて dark / light を解決すること
 *    - 2-2. applyThemeToRoot が dark / light に応じて wa-dark / wa-light クラスおよび data-theme 属性を正しく切り替えること
 */

describe("theme-storage.utils", () => {
  it("1-1. 指定したストレージキーで saveTheme / loadTheme が読み書きできること", async () => {
    const store: Record<string, unknown> = {};
    const area: StorageAreaLike = {
      get: vi.fn(async (key: string) => ({ [key]: store[key] })),
      set: vi.fn(async (items: Record<string, unknown>) => {
        Object.assign(store, items);
      }),
    };

    const storage = createThemeStorage("custom_app_theme");
    await storage.saveTheme("dark", area);
    expect(store["custom_app_theme"]).toBe("dark");
    await expect(storage.loadTheme(area)).resolves.toBe("dark");
  });

  it("1-2. 未保存または不正値・例外発生時はデフォルト system を返すこと", async () => {
    const storage = createThemeStorage("custom_app_theme");
    const emptyArea: StorageAreaLike = {
      get: vi.fn(async () => ({})),
      set: vi.fn(async () => {}),
    };
    await expect(storage.loadTheme(emptyArea)).resolves.toBe("system");

    const invalidArea: StorageAreaLike = {
      get: vi.fn(async () => ({ custom_app_theme: "invalid" })),
      set: vi.fn(async () => {}),
    };
    await expect(storage.loadTheme(invalidArea)).resolves.toBe("system");

    const errorArea: StorageAreaLike = {
      get: vi.fn(async () => {
        throw new Error("read error");
      }),
      set: vi.fn(async () => {}),
    };
    await expect(storage.loadTheme(errorArea)).resolves.toBe("system");
  });

  it("2-1. system モード時は prefersDark に応じて dark / light を解決すること", () => {
    expect(resolveEffectiveTheme("system", true)).toBe("dark");
    expect(resolveEffectiveTheme("system", false)).toBe("light");
    expect(resolveEffectiveTheme("dark", false)).toBe("dark");
    expect(resolveEffectiveTheme("light", true)).toBe("light");
  });

  it("2-2. applyThemeToRoot が dark / light に応じて wa-dark / wa-light クラスおよび data-theme 属性を正しく切り替えること", () => {
    const add = vi.fn();
    const remove = vi.fn();
    const setAttribute = vi.fn();
    const root: ThemeRootLike = {
      classList: { add, remove },
      setAttribute,
    };

    applyThemeToRoot("dark", root, false);
    expect(remove).toHaveBeenCalledWith("wa-light");
    expect(add).toHaveBeenCalledWith("wa-dark");
    expect(setAttribute).toHaveBeenCalledWith("data-theme", "dark");

    applyThemeToRoot("light", root, true);
    expect(remove).toHaveBeenCalledWith("wa-dark");
    expect(add).toHaveBeenCalledWith("wa-light");
    expect(setAttribute).toHaveBeenCalledWith("data-theme", "light");
  });
});
