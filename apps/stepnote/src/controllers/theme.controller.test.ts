import { describe, it, expect, vi } from "vitest";
import type { ReactiveControllerHost } from "lit";
import { ThemeController } from "./theme.controller";


/**
 * Reactive Controller の モック
 */
const createMockHost = () => {
  const requestUpdateMock = vi.fn();
  const host: ReactiveControllerHost = {
    addController: vi.fn(),
    removeController: vi.fn(),
    requestUpdate: requestUpdateMock,
    updateComplete: Promise.resolve(true),
  };
  return { host, requestUpdateMock };
};

/**
 * Storage モックの生成
 */
const createMockStorage = (initialData: Record<string, string> = {}) => {
  const store = { ...initialData };
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
    _store: store,
  };
};

/**
 * matchMedia モックの生成
 */
const createMockMatchMedia = (initialDark: boolean = false) => {
  let matches = initialDark;
  let listener: ((e: { matches: boolean }) => void) | null = null;

  const mql = {
    get matches() {
      return matches;
    },
    addEventListener: vi.fn(
      (_event: string, cb: (e: { matches: boolean }) => void) => {
        listener = cb;
      },
    ),
    removeEventListener: vi.fn(
      (_event: string, _cb: (e: { matches: boolean }) => void) => {
        listener = null;
      },
    ),
    // テスト用トリガー
    simulateChange: (newDark: boolean) => {
      matches = newDark;
      if (listener) {
        listener({ matches: newDark });
      }
    },
  };

  const matchMediaFn = vi.fn((_query: string) => mql);
  return { matchMediaFn, mql };
};

/**
 * targetElement モックの生成
 */
const createMockElement = () => {
  const classListSet = new Set<string>();
  const attributes: Record<string, string> = {};

  return {
    classList: {
      add: vi.fn((cls: string) => classListSet.add(cls)),
      remove: vi.fn((cls: string) => classListSet.delete(cls)),
      contains: vi.fn((cls: string) => classListSet.has(cls)),
      get _classes() {
        return Array.from(classListSet);
      },
    },
    setAttribute: vi.fn((key: string, val: string) => {
      attributes[key] = val;
    }),
    getAttribute: vi.fn((key: string) => attributes[key] ?? null),
    _attributes: attributes,
  };
};

/**
 * 仕様 1: 初期化時、Storage に保存値がない場合はデフォルトで 'system' モードとなり、OS の設定に応じた resolvedTheme が設定されること。
 * 仕様 2: 初期化時、Storage に保存値がある場合はそのモード（'light' または 'dark'）が復元され、resolvedTheme が一致すること。
 * 仕様 3: setTheme で 'dark' を設定した場合、状態が更新され、Storage に保存され、DOM にダークモードのクラス/属性が反映され、ホストへの再描画通知が行われること。
 * 仕様 4: setTheme で 'light' を設定した場合、状態が更新され、Storage に保存され、DOM にライトモードのクラス/属性が反映され、ホストへの再描画通知が行われること。
 * 仕様 5: setTheme で 'system' を設定した場合、OS のカラー設定に応じた resolvedTheme が適用され、Storage に保存されること。
 * 仕様 6: すでに同じテーマがセットされている場合、不要な再描画通知や DOM 反映が行われないこと。
 * 仕様 7: 'system' モード時に OS のカラーモードが変更された場合、resolvedTheme が自動追従して更新・再描画通知されること。
 * 仕様 8: 'light' または 'dark' モード固定時に OS のカラーモードが変更されても、resolvedTheme は影響を受けないこと。
 * 仕様 9: subscribe で登録されたリスナー関数が状態変更時に呼び出され、解除関数で購読解除できること。
 */
describe("theme.controller", () => {
  describe("初期化の検証", () => {
    it("Storage に保存値がない場合はデフォルトで 'system' モードとなり、OS の設定に応じた resolvedTheme が設定されること", () => {
      const { host } = createMockHost();
      const storage = createMockStorage();
      const { matchMediaFn } = createMockMatchMedia(true); // OS: dark
      const targetElement = createMockElement();

      const controller = new ThemeController(host, {
        storage,
        matchMedia: matchMediaFn,
        targetElement,
      });

      expect(controller.state.theme).toBe("system");
      expect(controller.state.resolvedTheme).toBe("dark");
      expect(targetElement.classList.add).toHaveBeenCalledWith("wa-dark");
      expect(targetElement.setAttribute).toHaveBeenCalledWith(
        "data-theme",
        "dark",
      );
    });

    it("Storage に保存値がある場合はそのモード（'light' または 'dark'）が復元され、resolvedTheme が一致すること", () => {
      const { host } = createMockHost();
      const storage = createMockStorage({ stepnote_theme: "light" });
      const { matchMediaFn } = createMockMatchMedia(true); // OS は dark だが保存値優先
      const targetElement = createMockElement();

      const controller = new ThemeController(host, {
        storage,
        matchMedia: matchMediaFn,
        targetElement,
      });

      expect(controller.state.theme).toBe("light");
      expect(controller.state.resolvedTheme).toBe("light");
      expect(targetElement.classList.add).toHaveBeenCalledWith("wa-light");
      expect(targetElement.setAttribute).toHaveBeenCalledWith(
        "data-theme",
        "light",
      );
    });
  });

  describe("setTheme の検証", () => {
    it("setTheme で 'dark' を設定した場合、状態が更新され、Storage に保存され、DOM にダークモードのクラス/属性が反映され、ホストへの再描画通知が行われること", () => {
      const { host, requestUpdateMock } = createMockHost();
      const storage = createMockStorage();
      const { matchMediaFn } = createMockMatchMedia(false); // OS: light
      const targetElement = createMockElement();

      const controller = new ThemeController(host, {
        storage,
        matchMedia: matchMediaFn,
        targetElement,
      });

      requestUpdateMock.mockClear();
      targetElement.classList.add.mockClear();
      targetElement.classList.remove.mockClear();
      targetElement.setAttribute.mockClear();

      controller.setTheme("dark");

      expect(controller.state.theme).toBe("dark");
      expect(controller.state.resolvedTheme).toBe("dark");
      expect(storage.setItem).toHaveBeenCalledWith("stepnote_theme", "dark");
      expect(targetElement.classList.remove).toHaveBeenCalledWith("wa-light");
      expect(targetElement.classList.add).toHaveBeenCalledWith("wa-dark");
      expect(targetElement.setAttribute).toHaveBeenCalledWith(
        "data-theme",
        "dark",
      );
      expect(requestUpdateMock).toHaveBeenCalledTimes(1);
    });

    it("setTheme で 'light' を設定した場合、状態が更新され、Storage に保存され、DOM にライトモードのクラス/属性が反映され、ホストへの再描画通知が行われること", () => {
      const { host, requestUpdateMock } = createMockHost();
      const storage = createMockStorage({ stepnote_theme: "dark" });
      const { matchMediaFn } = createMockMatchMedia(true);
      const targetElement = createMockElement();

      const controller = new ThemeController(host, {
        storage,
        matchMedia: matchMediaFn,
        targetElement,
      });

      requestUpdateMock.mockClear();
      targetElement.classList.add.mockClear();
      targetElement.classList.remove.mockClear();
      targetElement.setAttribute.mockClear();

      controller.setTheme("light");

      expect(controller.state.theme).toBe("light");
      expect(controller.state.resolvedTheme).toBe("light");
      expect(storage.setItem).toHaveBeenCalledWith("stepnote_theme", "light");
      expect(targetElement.classList.remove).toHaveBeenCalledWith("wa-dark");
      expect(targetElement.classList.add).toHaveBeenCalledWith("wa-light");
      expect(targetElement.setAttribute).toHaveBeenCalledWith(
        "data-theme",
        "light",
      );
      expect(requestUpdateMock).toHaveBeenCalledTimes(1);
    });

    it("setTheme で 'system' を設定した場合、OS のカラー設定に応じた resolvedTheme が適用され、Storage に保存されること", () => {
      const { host, requestUpdateMock } = createMockHost();
      const storage = createMockStorage({ stepnote_theme: "light" });
      const { matchMediaFn } = createMockMatchMedia(true); // OS: dark
      const targetElement = createMockElement();

      const controller = new ThemeController(host, {
        storage,
        matchMedia: matchMediaFn,
        targetElement,
      });

      requestUpdateMock.mockClear();

      controller.setTheme("system");

      expect(controller.state.theme).toBe("system");
      expect(controller.state.resolvedTheme).toBe("dark");
      expect(storage.setItem).toHaveBeenCalledWith("stepnote_theme", "system");
      expect(targetElement.classList.add).toHaveBeenCalledWith("wa-dark");
      expect(targetElement.setAttribute).toHaveBeenCalledWith(
        "data-theme",
        "dark",
      );
      expect(requestUpdateMock).toHaveBeenCalledTimes(1);
    });

    it("すでに同じテーマがセットされている場合、不要な再描画通知や DOM 反映が行われないこと", () => {
      const { host, requestUpdateMock } = createMockHost();
      const storage = createMockStorage({ stepnote_theme: "dark" });
      const { matchMediaFn } = createMockMatchMedia(true);
      const targetElement = createMockElement();

      const controller = new ThemeController(host, {
        storage,
        matchMedia: matchMediaFn,
        targetElement,
      });

      requestUpdateMock.mockClear();
      storage.setItem.mockClear();

      controller.setTheme("dark");

      expect(requestUpdateMock).not.toHaveBeenCalled();
      expect(storage.setItem).not.toHaveBeenCalled();
    });
  });

  describe("OS 連動（prefers-color-scheme）の検証", () => {
    it("'system' モード時に OS のカラーモードが変更された場合、resolvedTheme が自動追従して更新・再描画通知されること", () => {
      const { host, requestUpdateMock } = createMockHost();
      const storage = createMockStorage();
      const { matchMediaFn, mql } = createMockMatchMedia(false); // 初期は light
      const targetElement = createMockElement();

      const controller = new ThemeController(host, {
        storage,
        matchMedia: matchMediaFn,
        targetElement,
      });

      expect(controller.state.resolvedTheme).toBe("light");
      requestUpdateMock.mockClear();

      // OS が dark に切り替わったイベントをシミュレート
      mql.simulateChange(true);

      expect(controller.state.resolvedTheme).toBe("dark");
      expect(targetElement.classList.add).toHaveBeenCalledWith("wa-dark");
      expect(targetElement.setAttribute).toHaveBeenCalledWith(
        "data-theme",
        "dark",
      );
      expect(requestUpdateMock).toHaveBeenCalledTimes(1);
    });

    it("'light' または 'dark' モード固定時に OS のカラーモードが変更されても、resolvedTheme は影響を受けないこと", () => {
      const { host, requestUpdateMock } = createMockHost();
      const storage = createMockStorage({ stepnote_theme: "light" });
      const { matchMediaFn, mql } = createMockMatchMedia(false);
      const targetElement = createMockElement();

      const controller = new ThemeController(host, {
        storage,
        matchMedia: matchMediaFn,
        targetElement,
      });

      expect(controller.state.resolvedTheme).toBe("light");
      requestUpdateMock.mockClear();

      // OS が dark に切り替わっても固定設定のため変化しない
      mql.simulateChange(true);

      expect(controller.state.resolvedTheme).toBe("light");
      expect(requestUpdateMock).not.toHaveBeenCalled();
    });
  });

  describe("購読（subscribe）の検証", () => {
    it("subscribe で登録されたリスナー関数が状態変更時に呼び出され、解除関数で購読解除できること", () => {
      const { host } = createMockHost();
      const storage = createMockStorage();
      const { matchMediaFn } = createMockMatchMedia(false);
      const targetElement = createMockElement();

      const controller = new ThemeController(host, {
        storage,
        matchMedia: matchMediaFn,
        targetElement,
      });

      const listener = vi.fn();
      const unsubscribe = controller.subscribe(listener);

      // 初回変更
      controller.setTheme("dark");
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith({
        theme: "dark",
        resolvedTheme: "dark",
      });

      // 購読解除
      unsubscribe();

      // 解除後の変更では呼ばれない
      controller.setTheme("light");
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });
});
