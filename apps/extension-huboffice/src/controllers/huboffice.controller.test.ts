import { describe, it, expect, vi } from "vitest";
import type { ReactiveControllerHost } from "lit";
import { HubOfficeController } from "./huboffice.controller";
import {
  LAST_VIEW_STORAGE_KEY,
  PINNED_TOOLS_STORAGE_KEY,
} from "../storage/office-storage";
import {
  THEME_STORAGE_KEY,
  type StorageAreaLike,
} from "../storage/theme-storage";

function createMockHost(): ReactiveControllerHost {
  return {
    addController: vi.fn(),
    removeController: vi.fn(),
    requestUpdate: vi.fn(),
    updateComplete: Promise.resolve(true),
  };
}

function createMemoryStorage(
  initial: Record<string, unknown> = {},
): StorageAreaLike {
  const store = { ...initial };
  return {
    get: vi.fn(async (key: string) =>
      key in store ? { [key]: store[key] } : {},
    ),
    set: vi.fn(async (items: Record<string, unknown>) => {
      Object.assign(store, items);
    }),
  };
}

/**
 * テスト仕様: HubOffice 状態管理コントローラー (huboffice.controller.ts)
 *
 * - 仕様1: 起動時初期化で前回の表示画面・ピン留め一覧・テーマ設定をストレージから復元すること
 * - 仕様2: openTool と goHome で画面遷移し、前回表示画面として永続化すること
 * - 仕様3: toggleSettings で設定画面を開閉し、再度呼ぶと直前の画面（ホームまたはツール）へ戻ること
 * - 仕様4: togglePin でツールのピン留めを切り替え、ホーム一覧の上部固定と永続化に反映すること
 * - 仕様5: setFilterQuery で表示ツール一覧を絞り込めること
 * - 仕様6: setThemeMode でテーマ設定を更新・永続化できること
 */
describe("HubOffice Controller Tests", () => {
  it("初期化時に前回画面・ピン留め・テーマをストレージから復元すること", async () => {
    const host = createMockHost();
    const storage = createMemoryStorage({
      [THEME_STORAGE_KEY]: "dark",
      [PINNED_TOOLS_STORAGE_KEY]: ["qr-generator"],
      [LAST_VIEW_STORAGE_KEY]: "wareki-converter",
    });

    const controller = new HubOfficeController(host, { storageArea: storage });
    await controller.initialize();

    expect(controller.themeMode).toBe("dark");
    expect(controller.pinnedToolIds).toEqual(["qr-generator"]);
    expect(controller.activeView).toBe("wareki-converter");
    expect(controller.visibleTools[0]?.id).toBe("qr-generator");
  });

  it("openTool と goHome で遷移しつつ前回画面を永続化すること", async () => {
    const host = createMockHost();
    const storage = createMemoryStorage();
    const controller = new HubOfficeController(host, { storageArea: storage });

    await controller.openTool("qr-generator");
    expect(controller.activeView).toBe("qr-generator");
    expect(storage.set).toHaveBeenCalledWith({
      [LAST_VIEW_STORAGE_KEY]: "qr-generator",
    });

    await controller.goHome();
    expect(controller.activeView).toBe("home");
    expect(storage.set).toHaveBeenCalledWith({
      [LAST_VIEW_STORAGE_KEY]: "home",
    });
  });

  it("toggleSettings で設定画面へ遷移し、再トグルで元のツール画面へ戻ること", async () => {
    const host = createMockHost();
    const storage = createMemoryStorage();
    const controller = new HubOfficeController(host, { storageArea: storage });

    await controller.openTool("wareki-converter");
    await controller.toggleSettings();
    expect(controller.activeView).toBe("settings");

    await controller.toggleSettings();
    expect(controller.activeView).toBe("wareki-converter");
  });

  it("togglePin でピン留めをトグルし永続化・並び順に反映すること", async () => {
    const host = createMockHost();
    const storage = createMemoryStorage();
    const controller = new HubOfficeController(host, { storageArea: storage });

    await controller.togglePin("qr-generator");
    expect(controller.isPinned("qr-generator")).toBe(true);
    expect(controller.visibleTools[0]?.id).toBe("qr-generator");
    expect(storage.set).toHaveBeenCalledWith({
      [PINNED_TOOLS_STORAGE_KEY]: ["qr-generator"],
    });

    await controller.togglePin("qr-generator");
    expect(controller.isPinned("qr-generator")).toBe(false);
  });

  it("setFilterQuery で表示ツール一覧を絞り込み、setThemeMode でテーマを保存すること", async () => {
    const host = createMockHost();
    const storage = createMemoryStorage();
    const controller = new HubOfficeController(host, { storageArea: storage });

    controller.setFilterQuery("QR");
    expect(controller.visibleTools.map((t) => t.id)).toEqual(["qr-generator"]);

    await controller.setThemeMode("light");
    expect(controller.themeMode).toBe("light");
    expect(storage.set).toHaveBeenCalledWith({ [THEME_STORAGE_KEY]: "light" });
  });
});
