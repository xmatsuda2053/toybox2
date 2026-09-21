import "fake-indexeddb/auto";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flattenTemplate } from "@shared/utils";
import type {
  ThemeController,
  ThemeMode,
} from "@/controllers/theme.controller.js";
import { ThemeSwitcher } from "./theme-switcher";

/**
 * 【ThemeSwitcher 仕様 (ヘッダーテーマ切り替え独立コンポーネント化)】
 *
 * 1. 基本レンダリング構造
 *    - 1-1. wa-dropdown（placement="bottom-end"）およびトリガーボタン（wa-button#btn-theme-dropdown）がレンダリングされること
 *    - 1-2. ドロップダウン内にシステム、ライト、ダークの各選択項目（wa-dropdown-item）がレンダリングされること
 *
 * 2. 状態連動とアイコン・ラベル解決
 *    - 2-1. themeController.theme が "system" のとき、アイコン名が "display-solid-full"、ラベルが "テーマ: システム"、システム項目が checked となること
 *    - 2-2. themeController.theme が "light" のとき、アイコン名が "sun-solid-full"、ラベルが "テーマ: ライト"、ライト項目が checked となること
 *    - 2-3. themeController.theme が "dark" のとき、アイコン名が "moon-solid-full"、ラベルが "テーマ: ダーク"、ダーク項目が checked となること
 *    - 2-4. themeController が未設定の場合、デフォルトとして "system" 相当のアイコンとラベルが返されること
 *
 * 3. テーマ切り替えイベントハンドリング
 *    - 3-1. handleThemeSelect 実行時、選択された値で themeController.setTheme が呼び出されること
 *    - 3-2. themeController が未設定の場合でも handleThemeSelect が例外なく安全に終了すること
 *
 * 4. コントローラー状態購読（Observer / Subscribe）と排他的選択制御
 *    - 4-1. コントローラー設定時に controller.subscribe が呼び出され、リスナーが登録されること
 *    - 4-2. controller の購読コールバック実行時に requestUpdate が呼び出されること
 *    - 4-3. 各 wa-dropdown-item の checked プロパティが排他的（選択項目のみ true、他は false）にバインドされること
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
    it('1-1. wa-dropdown（placement="bottom-end"）およびトリガーボタン（wa-button#btn-theme-dropdown）がレンダリングされること', () => {
      const htmlStr = flattenTemplate(themeSwitcher.render());
      expect(htmlStr).toContain("<wa-dropdown");
      expect(htmlStr).toContain('placement="bottom-end"');
      expect(htmlStr).toContain('id="btn-theme-dropdown"');
      expect(htmlStr).toContain('class="btn-theme-dropdown"');
      expect(htmlStr).toContain("<wa-icon");
    });

    it("1-2. ドロップダウン内にシステム、ライト、ダークの各選択項目（wa-dropdown-item）がレンダリングされること", () => {
      const htmlStr = flattenTemplate(themeSwitcher.render());
      expect(htmlStr).toContain('value="system"');
      expect(htmlStr).toContain("システム");
      expect(htmlStr).toContain('value="light"');
      expect(htmlStr).toContain("ライト");
      expect(htmlStr).toContain('value="dark"');
      expect(htmlStr).toContain("ダーク");
    });
  });

  describe("2. 状態連動とアイコン・ラベル解決", () => {
    it('2-1. themeController.theme が "system" のとき、アイコン名が "display-solid-full"、ラベルが "テーマ: システム"、システム項目が checked となること', () => {
      mockThemeController.theme = "system";
      expect(themeSwitcher.currentThemeIcon).toBe("display-solid-full");
      expect(themeSwitcher.currentThemeLabel).toBe("テーマ: システム");

      const htmlStr = flattenTemplate(themeSwitcher.render());
      expect(htmlStr).toContain("display-solid-full");
      expect(htmlStr).toContain("テーマ: システム");
      expect(htmlStr).toMatch(/value="system"[^>]*\bchecked\b/);
    });

    it('2-2. themeController.theme が "light" のとき、アイコン名が "sun-solid-full"、ラベルが "テーマ: ライト"、ライト項目が checked となること', () => {
      mockThemeController.theme = "light";
      expect(themeSwitcher.currentThemeIcon).toBe("sun-solid-full");
      expect(themeSwitcher.currentThemeLabel).toBe("テーマ: ライト");

      const htmlStr = flattenTemplate(themeSwitcher.render());
      expect(htmlStr).toContain("sun-solid-full");
      expect(htmlStr).toContain("テーマ: ライト");
      expect(htmlStr).toMatch(/value="light"[^>]*\bchecked\b/);
    });

    it('2-3. themeController.theme が "dark" のとき、アイコン名が "moon-solid-full"、ラベルが "テーマ: ダーク"、ダーク項目が checked となること', () => {
      mockThemeController.theme = "dark";
      expect(themeSwitcher.currentThemeIcon).toBe("moon-solid-full");
      expect(themeSwitcher.currentThemeLabel).toBe("テーマ: ダーク");

      const htmlStr = flattenTemplate(themeSwitcher.render());
      expect(htmlStr).toContain("moon-solid-full");
      expect(htmlStr).toContain("テーマ: ダーク");
      expect(htmlStr).toMatch(/value="dark"[^>]*\bchecked\b/);
    });

    it('2-4. themeController が未設定の場合、デフォルトとして "system" 相当のアイコンとラベルが返されること', () => {
      themeSwitcher.themeController = undefined;
      expect(themeSwitcher.currentThemeIcon).toBe("display-solid-full");
      expect(themeSwitcher.currentThemeLabel).toBe("テーマ: システム");
    });
  });

  describe("3. テーマ切り替えイベントハンドリング", () => {
    it("3-1. handleThemeSelect 実行時、選択された値で themeController.setTheme が呼び出されること", () => {
      const selectEvent = new CustomEvent("wa-select", {
        detail: { item: { value: "dark" } },
      });
      themeSwitcher.handleThemeSelect(
        selectEvent as unknown as CustomEvent<{ item: { value: string } }>,
      );

      expect(mockThemeController.setTheme).toHaveBeenCalledTimes(1);
      expect(mockThemeController.setTheme).toHaveBeenCalledWith("dark");
    });

    it("3-2. themeController が未設定の場合でも handleThemeSelect が例外なく安全に終了すること", () => {
      themeSwitcher.themeController = undefined;
      const selectEvent = new CustomEvent("wa-select", {
        detail: { item: { value: "light" } },
      });

      expect(() => {
        themeSwitcher.handleThemeSelect(
          selectEvent as unknown as CustomEvent<{ item: { value: string } }>,
        );
      }).not.toThrow();
    });
  });

  describe("4. コントローラー状態購読（Observer / Subscribe）と排他的選択制御", () => {
    it("4-1. コントローラー設定時に controller.subscribe が呼び出され、リスナーが登録されること", () => {
      expect(mockThemeController.subscribe).toHaveBeenCalledTimes(1);
    });

    it("4-2. controller の購読コールバック実行時に requestUpdate が呼び出されること", () => {
      const requestUpdateSpy = vi.spyOn(themeSwitcher, "requestUpdate");
      const subscribeCallback = mockThemeController.subscribe.mock.calls[0][0];

      subscribeCallback();
      expect(requestUpdateSpy).toHaveBeenCalled();
    });

    it("4-3. 各 wa-dropdown-item の checked プロパティが排他的（選択項目のみ true、他は false）にバインドされること", () => {
      mockThemeController.theme = "dark";
      const htmlStr = flattenTemplate(themeSwitcher.render());

      // プロパティバインディング .checked が使用されていること
      expect(htmlStr).toMatch(/value="dark"[^>]*\.checked=true|\.checked=true[^>]*value="dark"/);
      expect(htmlStr).toMatch(/value="light"[^>]*\.checked=false|\.checked=false[^>]*value="light"/);
      expect(htmlStr).toMatch(/value="system"[^>]*\.checked=false|\.checked=false[^>]*value="system"/);
    });
  });
});
