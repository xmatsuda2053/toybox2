import "fake-indexeddb/auto";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flattenTemplate } from "@shared/utils";
import type {
  ThemeController,
  ThemeMode,
} from "@/controllers/theme.controller.js";
import { ThemeSwitcher } from "./theme-switcher";

/**
 * 【ThemeSwitcher 仕様 (ヘッダーテーマ切り替えセグメントボタングループ化)】
 *
 * 1. 基本レンダリング構造
 *    - 1-1. wa-button-group（label="テーマ切り替え"）がレンダリングされること
 *    - 1-2. ボタングループ内にライト、ダーク、システムの各切り替えボタン（wa-button#btn-theme-light, #btn-theme-dark, #btn-theme-system）がレンダリングされること
 *    - 1-3. 各ボタンに対応するツールチップ（wa-tooltip[for]）がレンダリングされること
 *    - 1-4. 各ボタンに適切なテーマアイコン（sun-solid-full, moon-solid-full, display-solid-full）が表示されること
 *
 * 2. 状態連動とアクティブ表示・アクセシビリティ
 *    - 2-1. themeController.theme が "system" のとき、システムボタンに aria-pressed="true" が付与され、他は "false" となること
 *    - 2-2. themeController.theme が "light" のとき、ライトボタンに aria-pressed="true" が付与され、他は "false" となること
 *    - 2-3. themeController.theme が "dark" のとき、ダークボタンに aria-pressed="true" が付与され、他は "false" となること
 *    - 2-4. themeController が未設定の場合、デフォルトとして "system" がアクティブ（aria-pressed="true"）となること
 *
 * 3. テーマ切り替えイベントハンドリング
 *    - 3-1. handleThemeChange 実行時、選択された値で themeController.setTheme が呼び出されること
 *    - 3-2. themeController が未設定の場合でも handleThemeChange が例外なく安全に終了すること
 *
 * 4. コントローラー状態購読（Observer / Subscribe）
 *    - 4-1. コントローラー設定時に controller.subscribe が呼び出され、リスナーが登録されること
 *    - 4-2. controller の購読コールバック実行時に requestUpdate が呼び出されること
 */

describe("ThemeSwitcher Component", () => {
  let themeSwitcher: ThemeSwitcher;
  let mockThemeController: {
    theme: ThemeMode;
    resolvedTheme: "light" | "dark";
    setTheme: ReturnType<typeof vi.fn>;
    subscribe: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockThemeController = {
      theme: "system",
      resolvedTheme: "light",
      setTheme: vi.fn(),
      subscribe: vi.fn(),
    };
    themeSwitcher = new ThemeSwitcher();
    themeSwitcher.themeController =
      mockThemeController as unknown as ThemeController;
  });

  describe("1. 基本レンダリング構造", () => {
    it('1-1. wa-button-group（label="テーマ切り替え"）がレンダリングされること', () => {
      const htmlStr = flattenTemplate(themeSwitcher.render());
      expect(htmlStr).toContain("<wa-button-group");
      expect(htmlStr).toContain('label="テーマ切り替え"');
    });

    it("1-2. ボタングループ内にライト、ダーク、システムの各切り替えボタンがレンダリングされること", () => {
      const htmlStr = flattenTemplate(themeSwitcher.render());
      expect(htmlStr).toContain('id="btn-theme-light"');
      expect(htmlStr).toContain('id="btn-theme-dark"');
      expect(htmlStr).toContain('id="btn-theme-system"');
    });

    it("1-3. 各ボタンに対応するツールチップ（wa-tooltip[for]）がレンダリングされること", () => {
      const htmlStr = flattenTemplate(themeSwitcher.render());
      expect(htmlStr).toContain('<wa-tooltip for="btn-theme-light"');
      expect(htmlStr).toContain("ライト");
      expect(htmlStr).toContain('<wa-tooltip for="btn-theme-dark"');
      expect(htmlStr).toContain("ダーク");
      expect(htmlStr).toContain('<wa-tooltip for="btn-theme-system"');
      expect(htmlStr).toContain("システム");
    });

    it("1-4. 各ボタンに適切なテーマアイコンが表示されること", () => {
      const htmlStr = flattenTemplate(themeSwitcher.render());
      expect(htmlStr).toContain('name="sun-solid-full"');
      expect(htmlStr).toContain('name="moon-solid-full"');
      expect(htmlStr).toContain('name="display-solid-full"');
    });
  });

  describe("2. 状態連動とアクティブ表示・アクセシビリティ", () => {
    it('2-1. themeController.theme が "system" のとき、システムボタンに aria-pressed="true" / appearance="filled" が付与され、他は "false" / "plain" となること', () => {
      mockThemeController.theme = "system";
      const htmlStr = flattenTemplate(themeSwitcher.render());

      expect(htmlStr).toMatch(/id="btn-theme-system"[^>]*variant="neutral"[^>]*appearance="filled"[^>]*aria-pressed="true"/);
      expect(htmlStr).toMatch(/id="btn-theme-light"[^>]*variant="neutral"[^>]*appearance="plain"[^>]*aria-pressed="false"/);
      expect(htmlStr).toMatch(/id="btn-theme-dark"[^>]*variant="neutral"[^>]*appearance="plain"[^>]*aria-pressed="false"/);
    });

    it('2-2. themeController.theme が "light" のとき、ライトボタンに aria-pressed="true" / appearance="filled" が付与され、他は "false" / "plain" となること', () => {
      mockThemeController.theme = "light";
      const htmlStr = flattenTemplate(themeSwitcher.render());

      expect(htmlStr).toMatch(/id="btn-theme-light"[^>]*variant="neutral"[^>]*appearance="filled"[^>]*aria-pressed="true"/);
      expect(htmlStr).toMatch(/id="btn-theme-dark"[^>]*variant="neutral"[^>]*appearance="plain"[^>]*aria-pressed="false"/);
      expect(htmlStr).toMatch(/id="btn-theme-system"[^>]*variant="neutral"[^>]*appearance="plain"[^>]*aria-pressed="false"/);
    });

    it('2-3. themeController.theme が "dark" のとき、ダークボタンに aria-pressed="true" / appearance="filled" が付与され、他は "false" / "plain" となること', () => {
      mockThemeController.theme = "dark";
      const htmlStr = flattenTemplate(themeSwitcher.render());

      expect(htmlStr).toMatch(/id="btn-theme-dark"[^>]*variant="neutral"[^>]*appearance="filled"[^>]*aria-pressed="true"/);
      expect(htmlStr).toMatch(/id="btn-theme-light"[^>]*variant="neutral"[^>]*appearance="plain"[^>]*aria-pressed="false"/);
      expect(htmlStr).toMatch(/id="btn-theme-system"[^>]*variant="neutral"[^>]*appearance="plain"[^>]*aria-pressed="false"/);
    });

    it('2-4. themeController が未設定の場合、デフォルトとして "system" がアクティブ（aria-pressed="true" / appearance="filled"）となること', () => {
      themeSwitcher.themeController = undefined;
      const htmlStr = flattenTemplate(themeSwitcher.render());

      expect(htmlStr).toMatch(/id="btn-theme-system"[^>]*variant="neutral"[^>]*appearance="filled"[^>]*aria-pressed="true"/);
      expect(htmlStr).toMatch(/id="btn-theme-light"[^>]*variant="neutral"[^>]*appearance="plain"[^>]*aria-pressed="false"/);
      expect(htmlStr).toMatch(/id="btn-theme-dark"[^>]*variant="neutral"[^>]*appearance="plain"[^>]*aria-pressed="false"/);
    });
  });

  describe("3. テーマ切り替えイベントハンドリング", () => {
    it("3-1. handleThemeChange 実行時、選択された値で themeController.setTheme が呼び出されること", () => {
      themeSwitcher.handleThemeChange("dark");
      expect(mockThemeController.setTheme).toHaveBeenCalledTimes(1);
      expect(mockThemeController.setTheme).toHaveBeenCalledWith("dark");

      themeSwitcher.handleThemeChange("light");
      expect(mockThemeController.setTheme).toHaveBeenCalledWith("light");
    });

    it("3-2. themeController が未設定の場合でも handleThemeChange が例外なく安全に終了すること", () => {
      themeSwitcher.themeController = undefined;
      expect(() => {
        themeSwitcher.handleThemeChange("light");
      }).not.toThrow();
    });
  });

  describe("4. コントローラー状態購読（Observer / Subscribe）", () => {
    it("4-1. コントローラー設定時に controller.subscribe が呼び出され、リスナーが登録されること", () => {
      expect(mockThemeController.subscribe).toHaveBeenCalledTimes(1);
    });

    it("4-2. controller の購読コールバック実行時に requestUpdate が呼び出されること", () => {
      const requestUpdateSpy = vi.spyOn(themeSwitcher, "requestUpdate");
      const subscribeCallback = mockThemeController.subscribe.mock.calls[0][0];

      subscribeCallback();
      expect(requestUpdateSpy).toHaveBeenCalled();
    });
  });
});
