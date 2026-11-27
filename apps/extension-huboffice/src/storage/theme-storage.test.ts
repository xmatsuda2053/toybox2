import { describe, it, expect, vi } from "vitest";
import {
  THEME_STORAGE_KEY,
  loadTheme,
  saveTheme,
  resolveEffectiveTheme,
  applyThemeToRoot,
  type StorageAreaLike,
} from "./theme-storage";

/**
 * テスト仕様: テーマ設定永続化・適用ユーティリティ (theme-storage.ts)
 *
 * - 仕様1: ストレージキーが HubOffice 専用 (huboffice_theme) であること
 * - 仕様2: ストレージから保存済みテーマ（light / dark / system）を読み込み、不正値時は system にフォールバックすること
 * - 仕様3: saveTheme で選択したテーマをストレージへ保存できること
 * - 仕様4: resolveEffectiveTheme と applyThemeToRoot で wa-dark / wa-light および data-theme が正しく反映されること
 */
describe("HubOffice Theme Storage Tests", () => {
  it("ストレージキーが huboffice_theme であること", () => {
    expect(THEME_STORAGE_KEY).toBe("huboffice_theme");
  });

  it("ストレージから保存済みテーマを読み込み、不正値時は system にフォールバックすること", async () => {
    const validStorage: StorageAreaLike = {
      get: vi.fn().mockResolvedValue({ [THEME_STORAGE_KEY]: "dark" }),
      set: vi.fn().mockResolvedValue(undefined),
    };
    expect(await loadTheme(validStorage)).toBe("dark");

    const invalidStorage: StorageAreaLike = {
      get: vi.fn().mockResolvedValue({ [THEME_STORAGE_KEY]: "invalid" }),
      set: vi.fn().mockResolvedValue(undefined),
    };
    expect(await loadTheme(invalidStorage)).toBe("system");
  });

  it("saveTheme でテーマ設定をストレージへ保存できること", async () => {
    const set = vi.fn().mockResolvedValue(undefined);
    const storage: StorageAreaLike = {
      get: vi.fn().mockResolvedValue({}),
      set,
    };

    await saveTheme("light", storage);
    expect(set).toHaveBeenCalledWith({ [THEME_STORAGE_KEY]: "light" });
  });

  it("resolveEffectiveTheme で system 時に OS ダーク設定へ追従すること", () => {
    expect(resolveEffectiveTheme("light", true)).toBe("light");
    expect(resolveEffectiveTheme("dark", false)).toBe("dark");
    expect(resolveEffectiveTheme("system", true)).toBe("dark");
    expect(resolveEffectiveTheme("system", false)).toBe("light");
  });

  it("applyThemeToRoot でクラス (wa-dark / wa-light) と data-theme 属性を切り替えること", () => {
    const classes = new Set<string>(["wa-light"]);
    const attrs = new Map<string, string>();
    const fakeRoot = {
      classList: {
        add: (cls: string) => classes.add(cls),
        remove: (cls: string) => classes.delete(cls),
      },
      setAttribute: (k: string, v: string) => attrs.set(k, v),
    };

    applyThemeToRoot("dark", fakeRoot, false);
    expect(classes.has("wa-dark")).toBe(true);
    expect(classes.has("wa-light")).toBe(false);
    expect(attrs.get("data-theme")).toBe("dark");

    applyThemeToRoot("system", fakeRoot, false);
    expect(classes.has("wa-light")).toBe(true);
    expect(classes.has("wa-dark")).toBe(false);
    expect(attrs.get("data-theme")).toBe("light");
  });
});
